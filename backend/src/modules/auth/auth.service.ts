import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../../database/prisma.service';
import { MasterPrismaService } from '../../database/master-prisma.service';
import { TenantPrismaService } from '../../database/tenant-prisma.service';
import { CompanyService } from '../company/company.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserDto } from '../users/dto/update-user.dto';
import { UserRole, UserStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly masterPrisma: MasterPrismaService,
    private readonly tenantPrisma: TenantPrismaService,
    private readonly companyService: CompanyService,
  ) {}

  /**
   * Register a new user.
   * If inviteCode is provided, registers in the company's tenant DB.
   * If on a tenant domain (req.tenant.companyId set), registers in that tenant DB.
   * Otherwise registers in the default DB.
   */
  async register(registerDto: RegisterDto, companyId?: string | null) {
    // If invite code provided, resolve company and register in its tenant DB
    if (registerDto.inviteCode) {
      return this.registerWithInviteCode(registerDto);
    }

    // Standard registration in current tenant DB (PrismaService is request-scoped)
    const existingUser = await this.usersService.findByEmail(registerDto.email);

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await this.prisma.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role: registerDto.role || UserRole.CLIENT,
        status: UserStatus.ACTIVE,
      },
    });

    // Create role-specific profile
    await this.createRoleProfile(this.prisma, user, registerDto);

    const tokens = await this.generateTokens(user, companyId);

    const { password, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Register a user using an invite code.
   * Resolves the company, connects to its tenant DB, and creates the user there.
   * First user with the invite code becomes ADMIN.
   */
  private async registerWithInviteCode(registerDto: RegisterDto) {
    const company = await this.companyService.resolveByInviteCode(
      registerDto.inviteCode!,
    );

    if (!company) {
      throw new BadRequestException('Invalid invite code');
    }

    if (!company.isActive) {
      throw new BadRequestException('This company is currently inactive');
    }

    // Get tenant DB client for this company
    const tenantClient = await this.tenantPrisma.getClient(company.id);

    // Check if email already exists in this tenant
    const existing = await tenantClient.user.findUnique({
      where: { email: registerDto.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists in this company');
    }

    // Check if this is the first user (becomes ADMIN)
    const userCount = await tenantClient.user.count();
    const role = userCount === 0 ? UserRole.ADMIN : (registerDto.role || UserRole.CLIENT);

    const hashedPassword = await bcrypt.hash(registerDto.password, 12);

    const user = await tenantClient.user.create({
      data: {
        email: registerDto.email,
        password: hashedPassword,
        firstName: registerDto.firstName,
        lastName: registerDto.lastName,
        phone: registerDto.phone,
        role,
        status: UserStatus.ACTIVE,
      },
    });

    // Create role-specific profile using tenant client
    await this.createRoleProfile(tenantClient, user, registerDto);

    const tokens = await this.generateTokens(user, company.id);

    const { password, ...userWithoutPassword } = user;

    return {
      user: { ...userWithoutPassword, companyId: company.id },
      company: { id: company.id, name: company.name, slug: company.slug, domain: company.domain },
      ...tokens,
    };
  }

  /**
   * Login — dual auth.
   * First checks if it's a SUPER_ADMIN login (master DB).
   * If not, falls back to tenant user login (request-scoped PrismaService).
   */
  async login(loginDto: LoginDto, companyId?: string | null) {
    // Try SUPER_ADMIN login from master DB
    const superAdmin = await this.validateSuperAdmin(
      loginDto.email,
      loginDto.password,
    );

    if (superAdmin) {
      const tokens = await this.generateSuperAdminTokens(superAdmin);
      const { password, ...safeAdmin } = superAdmin;
      return {
        user: {
          ...safeAdmin,
          role: 'SUPER_ADMIN',
          isSuperAdmin: true,
        },
        ...tokens,
      };
    }

    // Tenant user login
    const user = await this.validateUser(loginDto.email, loginDto.password);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Account is not active');
    }

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const tokens = await this.generateTokens(user, companyId);

    const { password, ...userWithoutPassword } = user;

    return {
      user: { ...userWithoutPassword, companyId },
      ...tokens,
    };
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);

    if (!user) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return null;
    }

    return user;
  }

  /**
   * Validate SUPER_ADMIN against master DB super_admins table.
   */
  private async validateSuperAdmin(email: string, password: string) {
    try {
      const admin = await this.masterPrisma.superAdmin.findUnique({
        where: { email },
      });

      if (!admin) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password);
      if (!isPasswordValid) {
        return null;
      }

      return admin;
    } catch (error) {
      this.logger.debug(`Super admin lookup failed (expected if master DB not set up): ${error}`);
      return null;
    }
  }

  async generateTokens(user: any, companyId?: string | null) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyId: companyId || undefined,
    };

    const accessToken = this.jwtService.sign(payload);

    const refreshToken = uuidv4();
    const refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn', '30d');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(refreshExpiresIn));

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: this.configService.get<string>('jwt.expiresIn', '7d'),
    };
  }

  /**
   * Generate tokens for SUPER_ADMIN (stored in master DB, no tenant context).
   */
  private async generateSuperAdminTokens(admin: any) {
    const payload = {
      sub: admin.id,
      email: admin.email,
      role: 'SUPER_ADMIN',
      isSuperAdmin: true,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      refreshToken: uuidv4(), // SUPER_ADMIN doesn't use refresh token table in tenant DB
      expiresIn: this.configService.get<string>('jwt.expiresIn', '7d'),
    };
  }

  async refreshTokens(refreshToken: string) {
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Delete old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    // Generate new tokens
    return this.generateTokens(storedToken.user);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // Logout from all devices
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: 'Password changed successfully' };
  }

  async updateProfile(userId: string, updateDto: UpdateUserDto) {
    const data: any = {};
    if (updateDto.firstName) data.firstName = updateDto.firstName;
    if (updateDto.lastName) data.lastName = updateDto.lastName;
    if (updateDto.phone !== undefined) data.phone = updateDto.phone;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        role: true,
      },
    });
    return updatedUser;
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        adminProfile: true,
        realtorProfile: true,
        clientProfile: {
          include: {
            realtor: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    avatar: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * Get SUPER_ADMIN profile from master DB.
   */
  async getSuperAdminProfile(adminId: string) {
    const admin = await this.masterPrisma.superAdmin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new BadRequestException('Super admin not found');
    }

    const { password, ...safeAdmin } = admin;
    return { ...safeAdmin, role: 'SUPER_ADMIN', isSuperAdmin: true };
  }

  /**
   * Create role-specific profile for a user.
   */
  private async createRoleProfile(prismaClient: any, user: any, registerDto: RegisterDto) {
    if (user.role === UserRole.REALTOR) {
      await prismaClient.realtorProfile.create({
        data: {
          userId: user.id,
          licenseNumber: registerDto.licenseNumber || `LIC-${uuidv4().substring(0, 8).toUpperCase()}`,
          agency: registerDto.agency,
          specializations: registerDto.specializations || [],
        },
      });
    } else if (user.role === UserRole.CLIENT) {
      await prismaClient.clientProfile.create({
        data: {
          userId: user.id,
        },
      });
    } else if (user.role === UserRole.ADMIN) {
      await prismaClient.adminProfile.create({
        data: {
          userId: user.id,
          permissions: ['all'],
        },
      });
    }
  }
}
