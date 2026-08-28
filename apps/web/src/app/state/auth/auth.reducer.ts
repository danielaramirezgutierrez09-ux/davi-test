import { createReducer, on } from '@ngrx/store';
import { User } from '../../core/models';
import * as AuthActions from './auth.actions';

export interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

function readStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('findash.user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

// Estado inicial re-hidratado síncrono: evita race guards vs effect restore.
export const initialState: AuthState = {
  user: readStoredUser(),
  token: localStorage.getItem('findash.token'),
  loading: false,
  error: null,
};

export const authReducer = createReducer(
  initialState,
  on(AuthActions.login, (state) => ({ ...state, loading: true, error: null })),
  on(AuthActions.loginSuccess, AuthActions.sessionRestored, (state, { accessToken, user }) => ({
    ...state,
    user,
    token: accessToken,
    loading: false,
    error: null,
  })),
  on(AuthActions.loginFailure, (state, { error }) => ({ ...state, loading: false, error })),
  on(AuthActions.logout, () => initialState),
);
