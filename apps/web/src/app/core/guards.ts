import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { map, take } from 'rxjs';
import { selectUser } from '../state/auth/auth.selectors';

export const authGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  return store.select(selectUser).pipe(
    take(1),
    map((user) => (user ? true : router.createUrlTree(['/login']))),
  );
};

export const adminGuard: CanActivateFn = () => {
  const store = inject(Store);
  const router = inject(Router);
  return store.select(selectUser).pipe(
    take(1),
    map((user) =>
      user?.role === 'ADMIN' ? true : router.createUrlTree(['/']),
    ),
  );
};
