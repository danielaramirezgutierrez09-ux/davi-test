import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import * as AccountsActions from '../../state/accounts/accounts.actions';
import * as TransfersActions from '../../state/transfers/transfers.actions';
import { selectMyAccounts, selectAccountsLoading } from '../../state/accounts/accounts.selectors';
import {
  selectLastTransaction,
  selectTransferDuplicated,
  selectTransferError,
  selectTransferLoading,
} from '../../state/transfers/transfers.selectors';
import { selectUser } from '../../state/auth/auth.selectors';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 space-y-8">
      <h2 class="text-xl font-bold">Mis cuentas</h2>

      @if (loading$ | async) {
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="h-28 rounded-xl bg-gray-200 animate-pulse"></div>
          <div class="h-28 rounded-xl bg-gray-200 animate-pulse"></div>
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          @for (acc of accounts$ | async; track acc.id) {
            <div class="rounded-xl bg-white shadow p-5 space-y-1">
              <p class="text-sm text-gray-500">{{ acc.accountNumber }}</p>
              <p class="text-2xl font-bold">\${{ acc.balance | number:'1.2-2' }}</p>
              <span class="inline-block text-xs px-2 py-1 rounded-full"
                    [class]="badgeClass(acc.type)">{{ acc.type }}</span>
            </div>
          }
        </div>
      }

      <section class="rounded-xl bg-white shadow p-6 space-y-4">
        <h3 class="text-lg font-semibold">Nueva transferencia</h3>
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4 sm:grid-cols-3">
          <select formControlName="fromAccountId" class="border rounded-lg px-3 py-2">
            <option value="" disabled>Cuenta origen</option>
            @for (acc of accounts$ | async; track acc.id) {
              <option [value]="acc.id">{{ acc.accountNumber }} ({{ acc.type }})</option>
            }
          </select>
          <input formControlName="toAccountId" placeholder="UUID cuenta destino"
                 class="border rounded-lg px-3 py-2" />
          <input formControlName="amount" type="number" min="1" placeholder="Monto"
                 class="border rounded-lg px-3 py-2" />
          <button type="submit" [disabled]="form.invalid || (transferLoading$ | async)"
                  class="sm:col-span-3 bg-indigo-600 text-white rounded-lg py-2 font-medium hover:bg-indigo-700 disabled:opacity-50">
            {{ (transferLoading$ | async) ? 'Validando anti-fraude…' : 'Transferir' }}
          </button>
        </form>

        @if (transferError$ | async; as err) {
          <p class="text-sm text-red-600">{{ err }}</p>
        }
        @if (lastTx$ | async; as tx) {
          <div class="rounded-lg border p-4 text-sm space-y-1"
               [class.border-green-300]="tx.status === 'COMPLETED'"
               [class.border-red-300]="tx.status === 'FAILED'">
            <p><strong>Estado:</strong> {{ tx.status }}
              @if (duplicated$ | async) { <span class="text-xs text-gray-500">(respuesta idempotente)</span> }
            </p>
            <p><strong>Monto:</strong> \${{ tx.amount | number:'1.2-2' }} · <strong>Comisión:</strong> \${{ tx.fee | number:'1.2-2' }}</p>
            <p><strong>Autorización:</strong> {{ tx.authorizationCode }}</p>
            @if (tx.failureReason) { <p class="text-red-600">{{ tx.failureReason }}</p> }
          </div>
        }
      </section>
    </div>
  `,
})
export class ClientHomeComponent implements OnInit {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);

  protected readonly accounts$ = this.store.select(selectMyAccounts);
  protected readonly loading$ = this.store.select(selectAccountsLoading);
  protected readonly transferLoading$ = this.store.select(selectTransferLoading);
  protected readonly transferError$ = this.store.select(selectTransferError);
  protected readonly lastTx$ = this.store.select(selectLastTransaction);
  protected readonly duplicated$ = this.store.select(selectTransferDuplicated);
  protected readonly user$ = this.store.select(selectUser);

  protected readonly form = this.fb.nonNullable.group({
    fromAccountId: ['', Validators.required],
    toAccountId: ['', Validators.required],
    amount: [null as unknown as number, [Validators.required, Validators.min(1)]],
  });

  ngOnInit() {
    this.store.dispatch(AccountsActions.loadMyAccounts());
  }

  protected badgeClass(type: string): string {
    return {
      BASIC: 'bg-gray-100 text-gray-700',
      PREMIUM: 'bg-amber-100 text-amber-700',
      CORPORATE: 'bg-indigo-100 text-indigo-700',
    }[type] ?? 'bg-gray-100 text-gray-700';
  }

  protected submit() {
    if (this.form.invalid) return;
    this.store.dispatch(
      TransfersActions.executeTransfer({
        ...this.form.getRawValue(),
        idempotencyKey: crypto.randomUUID(),
      }),
    );
  }
}
