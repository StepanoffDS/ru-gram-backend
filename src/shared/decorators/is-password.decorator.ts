import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export const IsPassword = () =>
  applyDecorators(
    IsString({ message: 'Пароль должен быть строкой' }),
    IsNotEmpty({ message: 'Пароль обязателен' }),
    MinLength(8, { message: 'Пароль должен быть не менее 8 символов' }),
  );
