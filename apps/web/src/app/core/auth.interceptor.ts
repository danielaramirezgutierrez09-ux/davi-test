import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { catchError, throwError } from 'rxjs';
import { TokenStore } from './token.store';
import * as AuthActions from '../state/auth/auth.actions';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenStore).token();
  const store = inject(Store);
  const authReq =
    token && req.url.startsWith('/api')
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;
  return next(authReq).pipe(
    // Token expirado/inválido -> cierra sesión y vuelve a /login.
    catchError((err: HttpErrorResponse) => {
      if (err.status === 401 && req.url.startsWith('/api') && !req.url.includes('/auth/login')) {
        store.dispatch(AuthActions.logout());
      }
      return throwError(() => err);
    }),
  );
};
