import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LoginResponse } from './models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  login(email: string, password: string) {
    return this.http.post<LoginResponse>('/api/auth/login', { email, password });
  }
}
