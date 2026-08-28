import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, switchMap, tap } from 'rxjs';
import { AuthApiService } from '../../core/auth-api.service';
import { TokenStore } from '../../core/token.store';
import { User } from '../../core/models';
import * as AuthActions from './auth.actions';

const USER_KEY = 'findash.user';

@Injectable()
export class AuthEffects {
  private readonly actions$ = inject(Actions);
  private readonly api = inject(AuthApiService);
  private readonly tokens = inject(TokenStore);
  private readonly router = inject(Router);

  readonly login$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AuthActions.login),
      switchMap(({ email, password }) =>
        this.api.login(email, password).pipe(
          map((res) => AuthActions.loginSuccess({ accessToken: res.accessToken, user: res.user })),
          catchError((err) =>
            of(AuthActions.loginFailure({ error: err.error?.message ?? 'Error de autenticación' })),
          ),
        ),
      ),
    ),
  );

  readonly persist$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.loginSuccess),
        tap(({ accessToken, user }) => {
          this.tokens.set(accessToken);
          localStorage.setItem(USER_KEY, JSON.stringify(user));
          this.router.navigate([user.role === 'ADMIN' ? '/admin' : '/']);
        }),
      ),
    { dispatch: false },
  );

  readonly logout$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AuthActions.logout),
        tap(() => {
          this.tokens.set(null);
          localStorage.removeItem(USER_KEY);
          this.router.navigate(['/login']);
        }),
      ),
    { dispatch: false },
  );

  /** Re-hidrata sesión desde localStorage al arrancar. */
  readonly restore$ = createEffect(() =>
    of(null).pipe(
      map(() => {
        const token = this.tokens.token();
        const raw = localStorage.getItem(USER_KEY);
        if (token && raw) {
          return AuthActions.sessionRestored({ accessToken: token, user: JSON.parse(raw) as User });
        }
        return { type: '[Auth] No Session' };
      }),
    ),
  );
}
