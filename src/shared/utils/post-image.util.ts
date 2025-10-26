import { BadRequestException } from '@nestjs/common';
import * as sharp from 'sharp';

export class PostImageUtil {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly MAX_IMAGES_PER_POST = 10;
  private static readonly SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/gif',
  ];

  static validateImage(
    mimetype: string,
    size: number,
    currentImageCount: number,
  ): void {
    if (!this.SUPPORTED_MIME_TYPES.includes(mimetype)) {
      throw new BadRequestException(
        'Неподдерживаемый формат изображения. Поддерживаются: JPEG, PNG, WebP, GIF',
      );
    }

    if (size > this.MAX_FILE_SIZE) {
      throw new BadRequestException(
        `Размер файла не должен превышать ${this.MAX_FILE_SIZE / 1024 / 1024}MB`,
      );
    }

    if (currentImageCount >= this.MAX_IMAGES_PER_POST) {
      throw new BadRequestException(
        `Максимальное количество изображений в посте: ${this.MAX_IMAGES_PER_POST}`,
      );
    }
  }

  static generateFilename(
    postId: string,
    originalName: string,
    index: number,
  ): string {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `/posts/${postId}/${index}_${timestamp}_${randomSuffix}.webp`;
  }

  static async processImage(
    buffer: Buffer,
    isGif: boolean = false,
  ): Promise<Buffer> {
    try {
      if (isGif) {
        // Для GIF сохраняем анимацию
        return await sharp(buffer, { animated: true })
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({
            quality: 85,
            effort: 6,
          })
          .toBuffer();
      } else {
        return await sharp(buffer)
          .resize(1200, 1200, {
            fit: 'inside',
            withoutEnlargement: true,
          })
          .webp({
            quality: 85,
            effort: 6,
          })
          .toBuffer();
      }
    } catch (error) {
      throw new BadRequestException('Ошибка при обработке изображения', {
        cause: error,
      });
    }
  }

  static extractS3KeyFromUrl(url: string): string | null {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname.substring(1); // Убираем первый слеш
    } catch {
      return null;
    }
  }

  static isGif(mimetype: string): boolean {
    return mimetype === 'image/gif';
  }
}
