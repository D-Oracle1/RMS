import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync, mkdirSync } from 'fs';

@Injectable()
export class UploadService {
  constructor(private readonly prisma: PrismaService) {
    // Ensure upload directories exist
    const avatarDir = join(process.cwd(), 'uploads', 'avatars');
    const propertyDir = join(process.cwd(), 'uploads', 'properties');

    if (!existsSync(avatarDir)) {
      mkdirSync(avatarDir, { recursive: true });
    }
    if (!existsSync(propertyDir)) {
      mkdirSync(propertyDir, { recursive: true });
    }
  }

  async updateUserAvatar(userId: string, filename: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Delete old avatar if exists
    if (user.avatar) {
      const oldAvatarPath = join(process.cwd(), 'uploads', 'avatars', user.avatar.split('/').pop() || '');
      try {
        if (existsSync(oldAvatarPath)) {
          await unlink(oldAvatarPath);
        }
      } catch (error) {
        console.error('Error deleting old avatar:', error);
      }
    }

    // Update user with new avatar URL
    const avatarUrl = `/uploads/avatars/${filename}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
    });

    return updatedUser;
  }

  async deleteUserAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatar) {
      const avatarPath = join(process.cwd(), 'uploads', 'avatars', user.avatar.split('/').pop() || '');
      try {
        if (existsSync(avatarPath)) {
          await unlink(avatarPath);
        }
      } catch (error) {
        console.error('Error deleting avatar:', error);
      }
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
      },
    });

    return updatedUser;
  }

  async uploadPropertyImages(files: Express.Multer.File[]): Promise<string[]> {
    const urls = files.map((file) => `/uploads/properties/${file.filename}`);
    return urls;
  }

  async deletePropertyImage(filename: string): Promise<void> {
    const imagePath = join(process.cwd(), 'uploads', 'properties', filename);
    try {
      if (existsSync(imagePath)) {
        await unlink(imagePath);
      }
    } catch (error) {
      console.error('Error deleting property image:', error);
    }
  }
}
