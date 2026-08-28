import { createAction, props } from '@ngrx/store';
import { User } from '../../core/models';

export const login = createAction('[Auth] Login', props<{ email: string; password: string }>());
export const loginSuccess = createAction('[Auth] Login Success', props<{ accessToken: string; user: User }>());
export const loginFailure = createAction('[Auth] Login Failure', props<{ error: string }>());
export const logout = createAction('[Auth] Logout');
export const sessionRestored = createAction('[Auth] Session Restored', props<{ accessToken: string; user: User }>());
