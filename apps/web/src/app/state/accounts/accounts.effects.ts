import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap } from 'rxjs';
import { AccountsApiService } from '../../core/accounts-api.service';
import * as AccountsActions from './accounts.actions';

@Injectable()
export class AccountsEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AccountsApiService);

  readonly load$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccountsActions.loadAccounts),
      // OJO: el action NgRx trae `type` (nombre de acción); el filtro real
      // es `accountType` para no colisionar con el discriminante.
      switchMap(({ page, limit, accountType, search }) =>
        this.api.findAll({ page, limit, type: accountType, search }).pipe(
          map((result) => AccountsActions.loadAccountsSuccess({ result })),
          catchError((err) => of(AccountsActions.loadAccountsFailure({ error: err.error?.message ?? 'Error' }))),
        ),
      ),
    ),
  );

  readonly loadMine$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccountsActions.loadMyAccounts),
      switchMap(() =>
        this.api.findMine().pipe(
          map((accounts) => AccountsActions.loadMyAccountsSuccess({ accounts })),
          catchError((err) => of(AccountsActions.loadMyAccountsFailure({ error: err.error?.message ?? 'Error' }))),
        ),
      ),
    ),
  );

  readonly createUserAccount$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AccountsActions.createAccountUser),
      switchMap(({ payload }) =>
        this.api.createUserAccount(payload).pipe(
          // Emite éxito (cierra el form) + recarga la lista.
          switchMap(() => of(
            AccountsActions.createAccountUserSuccess({ ok: true }),
            AccountsActions.loadAccounts({ page: 1, limit: 10 }),
          )),
          catchError((err) =>
            of(AccountsActions.createAccountUserFailure({ error: err.error?.message ?? 'Error al crear usuario' })),
          ),
        ),
      ),
    ),
  );
}

