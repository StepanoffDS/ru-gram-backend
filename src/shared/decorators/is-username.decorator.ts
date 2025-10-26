import { applyDecorators } from '@nestjs/common';
import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export const IsUsername = () =>
  applyDecorators(
    IsString({ message: 'Username должен быть строкой' }),
    IsNotEmpty({ message: 'Username обязателен' }),
    MinLength(3, { message: 'Username должен быть не менее 3 символов' }),
    MaxLength(20, { message: 'Username должен быть не более 20 символов' }),
    Matches(/^[a-zA-Z0-9_-]+$/, {
      message:
        'Username должен содержать только латинские буквы, цифры и символы - и _',
    }),
  );
