import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { Role } from 'prisma/generated';
import { GqlRolesGuard } from '../guards/gql-roles.guard';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Combined decorator: sets required roles and applies both Auth and Roles guards
export const RolesAuth = (...roles: Role[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(GqlRolesGuard));
