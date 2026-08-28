import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { TransfersApiService } from '../../core/transfers-api.service';
import * as TransfersActions from './transfers.actions';
import * as AccountsActions from '../accounts/accounts.actions';

@Injectable()
export class TransfersEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(TransfersApiService);

  readonly execute$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransfersActions.executeTransfer),
      switchMap(({ idempotencyKey, ...payload }) =>
        this.api.execute(payload, idempotencyKey).pipe(
          map((result) => TransfersActions.executeTransferSuccess({ result })),
          catchError((err) =>
            of(TransfersActions.executeTransferFailure({ error: err.error?.message ?? 'Error en la transferencia' })),
          ),
        ),
      ),
    ),
  );

  /** Tras transferencia completada, refresca saldos propios. */
  readonly refreshAfterTransfer$ = createEffect(() =>
    this.actions$.pipe(
      ofType(TransfersActions.executeTransferSuccess),
      map(() => AccountsActions.loadMyAccounts()),
    ),
  );
}
