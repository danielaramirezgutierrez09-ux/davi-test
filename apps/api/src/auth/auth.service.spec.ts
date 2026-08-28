import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';

jest.mock('bcrypt');

describe('AuthService', () => {
  const prisma: any = { user: { findUnique: jest.fn() } };
  const jwt: any = { sign: jest.fn().mockReturnValue('signed-token') };
  const service = new AuthService(prisma, jwt);

  beforeEach(() => jest.clearAllMocks());

  it('login exitoso devuelve token y usuario con cuentas', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      password: 'hash',
      fullName: 'Ana',
      role: 'CLIENT',
      avatarUrl: null,
      accounts: [{ id: 'a1', accountNumber: 'FD-1', type: 'BASIC', balance: 10 }],
    });
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);

    const res = await service.login({ email: 'a@b.com', password: 'secret1' });

    expect(res.accessToken).toBe('signed-token');
    expect(res.user.accounts).toHaveLength(1);
    expect(jwt.sign).toHaveBeenCalledWith({ sub: 'u1', email: 'a@b.com', role: 'CLIENT' });
  });

  it('usuario inexistente -> 401', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(service.login({ email: 'x@x.com', password: '123456' })).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('password incorrecto -> 401', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'u1', password: 'hash', accounts: [] });
    (bcrypt.compare as jest.Mock).mockResolvedValue(false);
    await expect(service.login({ email: 'x@x.com', password: 'wrong1' })).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
