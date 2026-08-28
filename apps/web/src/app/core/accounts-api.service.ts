import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Account, AccountType, PagedAccounts } from './models';

@Injectable({ providedIn: 'root' })
export class AccountsApiService {
  private readonly http = inject(HttpClient);

  findAll(query: { page: number; limit: number; type?: AccountType; search?: string }) {
    let params = new HttpParams()
      .set('page', query.page)
      .set('limit', query.limit);
    if (query.type) params = params.set('type', query.type);
    if (query.search) params = params.set('search', query.search);
    return this.http.get<PagedAccounts>('/api/accounts', { params });
  }

  findMine() {
    return this.http.get<Account[]>('/api/accounts/mine');
  }
}
