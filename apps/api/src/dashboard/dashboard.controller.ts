import { Controller, Get, Sse, UseGuards } from '@nestjs/common';
import { Observable, fromEvent, map, startWith } from 'rxjs';
import { Role } from '@prisma/client';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { EventsService, TRANSACTION_EVENT } from '../common/events.service';

interface MessageEvent {
  data: unknown;
}

@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class DashboardController {
  constructor(
    private readonly dashboard: DashboardService,
    private readonly events: EventsService,
  ) {}

  @Get('kpis')
  kpis() {
    return this.dashboard.kpis();
  }

  @Get('accounts-by-type')
  accountsByType() {
    return this.dashboard.accountsByType();
  }

  /** Realtime KPI stream: emits fresh KPIs on each completed transaction. */
  @Sse('stream')
  stream(): Observable<MessageEvent> {
    return fromEvent(this.events.emitter, TRANSACTION_EVENT).pipe(
      startWith(null),
      map(() => ({ data: { refresh: true } }) as MessageEvent),
    );
  }
}
