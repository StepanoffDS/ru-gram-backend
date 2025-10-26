import {
  type ArgumentMetadata,
  type PipeTransform,
  BadRequestException,
  Injectable,
} from '@nestjs/common';
import { ReadStream } from 'fs';
import { validateFileFormat, validateFileSize } from '../utils/file.util';

@Injectable()
export class FileValidationPipe implements PipeTransform {
  public async transform(value: any, metadata: ArgumentMetadata) {
    if (!value.filename) {
      throw new BadRequestException('Файл не найден');
    }

    const { filename, createReadStream } = value;

    const fileStream = createReadStream() as ReadStream;

    const allowedFormats = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    const isFileFormatValid = validateFileFormat(filename, allowedFormats);

    if (!isFileFormatValid) {
      throw new BadRequestException('Неверный формат файла');
    }

    const isFileSizeValid = await validateFileSize(
      fileStream,
      1024 * 1024 * 10, // 10mb
    );

    if (!isFileSizeValid) {
      throw new BadRequestException('Размер файла превышает 10 МБ');
    }

    return value;
  }
}
