import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthUser } from '../../auth/jwt.strategy';

export const currentUserFactory = (
  _: unknown,
  ctx: ExecutionContext,
): AuthUser => ctx.switchToHttp().getRequest().user;

export const CurrentUser = createParamDecorator(currentUserFactory);
