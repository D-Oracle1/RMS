import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createDepartmentDto: CreateDepartmentDto) {
    // Check if name already exists
    const existingName = await this.prisma.department.findUnique({
      where: { name: createDepartmentDto.name },
    });

    if (existingName) {
      throw new ConflictException('Department name already exists');
    }

    // Check if code already exists
    const existingCode = await this.prisma.department.findUnique({
      where: { code: createDepartmentDto.code },
    });

    if (existingCode) {
      throw new ConflictException('Department code already exists');
    }

    // Check if parent exists (if provided)
    if (createDepartmentDto.parentId) {
      const parent = await this.prisma.department.findUnique({
        where: { id: createDepartmentDto.parentId },
      });

      if (!parent) {
        throw new NotFoundException('Parent department not found');
      }
    }

    // Check if head exists (if provided)
    if (createDepartmentDto.headId) {
      const head = await this.prisma.staffProfile.findUnique({
        where: { id: createDepartmentDto.headId },
      });

      if (!head) {
        throw new NotFoundException('Staff member not found for department head');
      }
    }

    return this.prisma.department.create({
      data: createDepartmentDto,
      include: {
        parent: true,
        head: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            staff: true,
            children: true,
          },
        },
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    parentId?: string;
  }) {
    const { page = 1, limit = 50, search, parentId } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (parentId !== undefined) {
      where.parentId = parentId || null;
    }

    const [departments, total] = await Promise.all([
      this.prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          parent: {
            select: {
              id: true,
              name: true,
            },
          },
          head: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              staff: true,
              children: true,
            },
          },
        },
      }),
      this.prisma.department.count({ where }),
    ]);

    return {
      data: departments,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        parent: true,
        children: {
          include: {
            _count: {
              select: { staff: true },
            },
          },
        },
        head: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            staff: true,
            children: true,
            channels: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    return department;
  }

  async update(id: string, updateDepartmentDto: UpdateDepartmentDto) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    // Check if new name conflicts
    if (updateDepartmentDto.name && updateDepartmentDto.name !== department.name) {
      const existingName = await this.prisma.department.findUnique({
        where: { name: updateDepartmentDto.name },
      });

      if (existingName) {
        throw new ConflictException('Department name already exists');
      }
    }

    // Prevent circular parent relationship
    if (updateDepartmentDto.parentId) {
      if (updateDepartmentDto.parentId === id) {
        throw new BadRequestException('Department cannot be its own parent');
      }

      // Check if the new parent is a child of this department
      const isChild = await this.isDescendant(updateDepartmentDto.parentId, id);
      if (isChild) {
        throw new BadRequestException('Cannot set a child department as parent');
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: updateDepartmentDto,
      include: {
        parent: true,
        head: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
        _count: {
          select: {
            staff: true,
            children: true,
          },
        },
      },
    });
  }

  async delete(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            staff: true,
            children: true,
          },
        },
      },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (department._count.staff > 0) {
      throw new BadRequestException('Cannot delete department with staff members');
    }

    if (department._count.children > 0) {
      throw new BadRequestException('Cannot delete department with child departments');
    }

    return this.prisma.department.delete({
      where: { id },
    });
  }

  async getStaff(id: string, query: { page?: number; limit?: number }) {
    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    const [staff, total] = await Promise.all([
      this.prisma.staffProfile.findMany({
        where: { departmentId: id },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              avatar: true,
              status: true,
            },
          },
          manager: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.staffProfile.count({ where: { departmentId: id } }),
    ]);

    return {
      data: staff,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getHierarchy() {
    // Get all departments with their hierarchy
    const buildHierarchy = async (parentId: string | null = null): Promise<any[]> => {
      const departments = await this.prisma.department.findMany({
        where: { parentId },
        include: {
          head: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                  avatar: true,
                },
              },
            },
          },
          _count: {
            select: {
              staff: true,
            },
          },
        },
      });

      const result = [];
      for (const dept of departments) {
        const children = await buildHierarchy(dept.id);
        result.push({
          ...dept,
          children,
        });
      }
      return result;
    };

    return buildHierarchy();
  }

  async assignHead(id: string, headId: string | null) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department) {
      throw new NotFoundException('Department not found');
    }

    if (headId) {
      const staff = await this.prisma.staffProfile.findUnique({
        where: { id: headId },
      });

      if (!staff) {
        throw new NotFoundException('Staff member not found');
      }
    }

    return this.prisma.department.update({
      where: { id },
      data: { headId },
      include: {
        head: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  // Helper function to check if targetId is a descendant of departmentId
  private async isDescendant(targetId: string, departmentId: string): Promise<boolean> {
    const children = await this.prisma.department.findMany({
      where: { parentId: departmentId },
      select: { id: true },
    });

    for (const child of children) {
      if (child.id === targetId) {
        return true;
      }
      const isChildDescendant = await this.isDescendant(targetId, child.id);
      if (isChildDescendant) {
        return true;
      }
    }

    return false;
  }
}
