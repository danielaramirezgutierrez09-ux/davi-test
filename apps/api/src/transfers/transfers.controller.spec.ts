import { BadRequestException } from '@nestjs/common';
import { TransfersController } from './transfers.controller';

describe('TransfersController', () => {
  const service: any = { execute: jest.fn(), findByAccount: jest.fn() };
  const controller = new TransfersController(service);
  const user: any = { id: 'u1', role: 'CLIENT' };

  it('exige header X-Idempotency-Key', () => {
    expect(() =>
      controller.create({ fromAccountId: 'a', toAccountId: 'b', amount: 1 }, '', user),
    ).toThrow(BadRequestException);
  });

  it('delega al orquestador con key y usuario', () => {
    controller.create({ fromAccountId: 'a', toAccountId: 'b', amount: 1 }, 'key', user);
    expect(service.execute).toHaveBeenCalledWith(
      { fromAccountId: 'a', toAccountId: 'b', amount: 1 },
      'key',
      user,
    );
  });

  it('findByAccount delega al servicio', () => {
    controller.findByAccount('acc-1');
    expect(service.findByAccount).toHaveBeenCalledWith('acc-1');
  });
});
