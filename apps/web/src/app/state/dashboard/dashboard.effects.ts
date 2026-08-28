import { Injectable, inject, NgZone } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, forkJoin, map, Observable, of, switchMap, takeUntil } from 'rxjs';
import { DashboardApiService } from '../../core/dashboard-api.service';
import { TokenStore } from '../../core/token.store';
import * as DashboardActions from './dashboard.actions';

@Injectable()
export class DashboardEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(DashboardApiService);
  private readonly tokens = inject(TokenStore);
  private readonly zone = inject(NgZone);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.loadDashboard, DashboardActions.realtimeTick),
      switchMap(() =>
        forkJoin([this.api.kpis(), this.api.accountsByType()]).pipe(
          map(([kpis, byType]) => DashboardActions.loadDashboardSuccess({ kpis, byType })),
          catchError((err) => of(DashboardActions.loadDashboardFailure({ error: err.error?.message ?? 'Error' }))),
        ),
      ),
    ),
  );

  /** SSE: al entrar abre stream; cada mensaje -> realtimeTick -> recarga KPIs. Cierra al salir. */
  readonly stream$ = createEffect(() =>
    this.actions$.pipe(
      ofType(DashboardActions.enterDashboard),
      switchMap(() =>
        this.sseStream().pipe(
          map(() => DashboardActions.realtimeTick()),
          takeUntil(this.actions$.pipe(ofType(DashboardActions.leaveDashboard))),
        ),
      ),
    ),
  );

  private sseStream(): Observable<unknown> {
    return new Observable((subscriber) => {
      const token = this.tokens.token();
      const es = new EventSource(`/api/dashboard/stream?token=${token}`);
      es.onmessage = (event) =>
        this.zone.run(() => subscriber.next(event));
      es.onerror = (err) => this.zone.run(() => subscriber.error(err));
      return () => es.close();
    });
  }
}
