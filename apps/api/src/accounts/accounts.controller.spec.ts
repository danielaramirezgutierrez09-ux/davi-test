import { AccountsController } from './accounts.controller';

describe('AccountsController', () => {
  const service: any = { findAll: jest.fn(), findMine: jest.fn(), findOne: jest.fn() };
  const controller = new AccountsController(service);

  it('findAll delega con query', () => {
    const query: any = { page: 1, limit: 10 };
    controller.findAll(query);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findMine usa el usuario autenticado', () => {
    controller.findMine({ id: 'u1' } as any);
    expect(service.findMine).toHaveBeenCalledWith('u1');
  });

  it('findOne delega por id', () => {
    controller.findOne('a1');
    expect(service.findOne).toHaveBeenCalledWith('a1');
  });
});
