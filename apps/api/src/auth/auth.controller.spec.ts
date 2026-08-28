import { AuthController } from './auth.controller';

describe('AuthController', () => {
  it('login delega al servicio', () => {
    const service: any = { login: jest.fn().mockReturnValue('ok') };
    const controller = new AuthController(service);
    const dto = { email: 'a@b.com', password: '123456' };
    expect(controller.login(dto)).toBe('ok');
    expect(service.login).toHaveBeenCalledWith(dto);
  });
});
