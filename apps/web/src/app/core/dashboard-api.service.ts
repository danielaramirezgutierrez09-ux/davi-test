import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AccountsByType, Kpis } from './models';

@Injectable({ providedIn: 'root' })
export class DashboardApiService {
  private readonly http = inject(HttpClient);

  kpis() {
    return this.http.get<Kpis>('/api/dashboard/kpis');
  }

  accountsByType() {
    return this.http.get<AccountsByType[]>('/api/dashboard/accounts-by-type');
  }
}
