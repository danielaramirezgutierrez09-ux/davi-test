import { Injectable, signal } from '@angular/core';

const TOKEN_KEY = 'findash.token';

/** Simple token store; interceptor + SSE read from here. */
@Injectable({ providedIn: 'root' })
export class TokenStore {
  private readonly _token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  readonly token = this._token.asReadonly();

  set(token: string | null) {
    this._token.set(token);
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }
}
