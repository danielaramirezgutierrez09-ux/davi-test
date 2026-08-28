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
      switchMap((query) =>
        this.api.findAll(query).pipe(
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
}
