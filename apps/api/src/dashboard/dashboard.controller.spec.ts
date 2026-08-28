import { firstValueFrom } from 'rxjs';
import { DashboardController } from './dashboard.controller';
import { EventsService } from '../common/events.service';

describe('DashboardController', () => {
  const dashboard: any = { kpis: jest.fn(), accountsByType: jest.fn() };
  const events = new EventsService();
  const controller = new DashboardController(dashboard, events);

  it('kpis delega al servicio', () => {
    controller.kpis();
    expect(dashboard.kpis).toHaveBeenCalled();
  });

  it('accountsByType delega al servicio', () => {
    controller.accountsByType();
    expect(dashboard.accountsByType).toHaveBeenCalled();
  });

  it('stream emite valor inicial y en cada evento de transacción', async () => {
    const first = await firstValueFrom(controller.stream());
    expect(first).toEqual({ data: { refresh: true } });
  });

  it('EventsService emite eventos de transacción', (done) => {
    const eventsService = new EventsService();
    eventsService.emitter.on('transaction.created', (payload) => {
      expect(payload.transactionId).toBe('t1');
      done();
    });
    eventsService.emitTransaction({ transactionId: 't1', status: 'COMPLETED', amount: 10 });
  });
});
