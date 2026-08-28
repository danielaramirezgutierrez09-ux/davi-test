import { ExecutionContext } from '@nestjs/common';
import { currentUserFactory } from './current-user.decorator';
import { Roles, ROLES_KEY } from './roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';

describe('Decorators y PrismaService', () => {
  it('CurrentUser extrae request.user', () => {
    const ctx = {
      switchToHttp: () => ({ getRequest: () => ({ user: { id: 'u1' } }) }),
    } as unknown as ExecutionContext;
    expect(currentUserFactory(undefined, ctx)).toEqual({ id: 'u1' });
  });

  it('Roles define metadata ROLES_KEY', () => {
    class Target {
      @Roles('ADMIN' as any)
      handler() {}
    }
    const metadata = Reflect.getMetadata(ROLES_KEY, Target.prototype.handler);
    expect(metadata).toEqual(['ADMIN']);
  });

  it('PrismaService conecta y desconecta', async () => {
    const service = new PrismaService();
    const connect = jest.spyOn(service, '$connect').mockResolvedValue();
    const disconnect = jest.spyOn(service, '$disconnect').mockResolvedValue();
    await service.onModuleInit();
    await service.onModuleDestroy();
    expect(connect).toHaveBeenCalled();
    expect(disconnect).toHaveBeenCalled();
  });
});
