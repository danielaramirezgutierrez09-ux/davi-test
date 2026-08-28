import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('mapea payload JWT a AuthUser', () => {
    const strategy = new JwtStrategy(new ConfigService({ JWT_SECRET: 'secret' }));
    const user = strategy.validate({ sub: 'u1', email: 'a@b.com', role: 'ADMIN' as any });
    expect(user).toEqual({ id: 'u1', email: 'a@b.com', role: 'ADMIN' });
  });
});
