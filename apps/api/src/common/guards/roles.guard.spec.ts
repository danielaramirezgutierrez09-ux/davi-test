import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

function ctxWith(user: any): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('sin metadata de roles permite acceso', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(undefined) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(ctxWith(null))).toBe(true);
  });

  it('ADMIN pasa cuando se requiere ADMIN', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']) } as unknown as Reflector;
    expect(new RolesGuard(reflector).canActivate(ctxWith({ role: 'ADMIN' }))).toBe(true);
  });

  it('CLIENT es rechazado cuando se requiere ADMIN', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(['ADMIN']) } as unknown as Reflector;
    expect(() => new RolesGuard(reflector).canActivate(ctxWith({ role: 'CLIENT' }))).toThrow(ForbiddenException);
  });
});
