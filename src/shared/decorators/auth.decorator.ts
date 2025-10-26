import { applyDecorators, UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';

export const Auth = () => applyDecorators(UseGuards(GqlAuthGuard));
