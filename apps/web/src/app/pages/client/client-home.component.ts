import { Component, OnInit, computed, inject } from '@angular/core';
import { AsyncPipe, DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import * as AccountsActions from '../../state/accounts/accounts.actions';
import * as TransfersActions from '../../state/transfers/transfers.actions';
import { selectAccountsLoading, selectMyAccounts } from '../../state/accounts/accounts.selectors';
import {
  selectLastTransaction,
  selectTransferDuplicated,
  selectTransferError,
  selectTransferLoading,
} from '../../state/transfers/transfers.selectors';
import { selectUser } from '../../state/auth/auth.selectors';
import { Account } from '../../core/models';
import { calcFee, feeLabel } from '../../core/commission';

@Component({
  selector: 'app-client-home',
  standalone: true,
  imports: [AsyncPipe, DecimalPipe, ReactiveFormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6 space-y-8">
      <h2 class="font-display text-2xl font-bold text-stone-900">Mis cuentas</h2>

      @if (loading$ | async) {
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="h-28 rounded-xl bg-stone-200 animate-pulse"></div>
          <div class="h-28 rounded-xl bg-stone-200 animate-pulse"></div>
        </div>
      } @else {
        <div class="grid gap-4 sm:grid-cols-2">
          @for (acc of accounts(); track acc.id) {
            <div class="rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 p-5 space-y-1">
              <div class="flex items-center justify-between">
                <p class="text-sm text-stone-500">{{ acc.accountNumber }}</p>
                <span class="inline-block text-xs px-2 py-1 rounded-full font-medium"
                      [class]="badgeClass(acc.type)">{{ acc.type }}</span>
              </div>
              <p class="font-display text-2xl font-bold text-stone-900">\${{ num(acc.balance) | number:'1.2-2' }}</p>
              <p class="text-xs text-stone-400">Comisión: {{ feeRule(acc.type) }}</p>
            </div>
          }
        </div>
      }

      <section class="rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70 p-6 space-y-4">
        <h3 class="font-display text-lg font-semibold text-stone-900">Nueva transferencia</h3>
        <form [formGroup]="form" (ngSubmit)="submit()" class="grid gap-4 sm:grid-cols-3">
          <select formControlName="fromAccountId" class="border border-stone-300 rounded-lg px-3 py-2 bg-white">
            <option value="" disabled>Cuenta origen</option>
            @for (acc of accounts(); track acc.id) {
              <option [value]="acc.id">{{ acc.accountNumber }} ({{ acc.type }})</option>
            }
          </select>
          <input formControlName="toAccountId" placeholder="UUID cuenta destino"
                 class="border border-stone-300 rounded-lg px-3 py-2" />
          <input formControlName="amount" type="number" min="1" step="0.01" placeholder="Monto"
                 class="border border-stone-300 rounded-lg px-3 py-2" />

          @if (source(); as src) {
            <div class="sm:col-span-3 rounded-xl border p-4 text-sm space-y-2"
                 [class.border-emerald-200]="valid()"
                 [class.bg-emerald-50/50]="valid()"
                 [class.border-red-200]="!valid()"
                 [class.bg-red-50/60]="!valid()">
              <div class="flex justify-between text-stone-600">
                <span>Saldo disponible</span>
                <span class="font-medium text-stone-900">\${{ num(src.balance) | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-stone-600">
                <span>Monto a transferir</span>
                <span class="font-medium text-stone-900">\${{ amount() | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between text-stone-600">
                <span>Comisión ({{ feeRule(src.type) }})</span>
                <span class="font-medium text-stone-900">\${{ fee() | number:'1.2-2' }}</span>
              </div>
              <div class="flex justify-between border-t pt-2 font-semibold"
                   [class.text-emerald-700]="valid()" [class.text-red-700]="!valid()">
                <span>Total a debitar</span>
                <span>\${{ total() | number:'1.2-2' }}</span>
              </div>
              @if (sameAccount()) {
                <p class="text-red-600 font-medium">La cuenta destino no puede ser la misma de origen.</p>
              }
              @if (exceeds()) {
                <p class="text-red-600 font-medium">
                  Saldo insuficiente: monto + comisión superan tu saldo disponible.
                </p>
              }
            </div>
          }

          <button type="submit" [disabled]="form.invalid || !valid() || (transferLoading$ | async)"
                  class="sm:col-span-3 bg-emerald-600 text-white rounded-lg py-2.5 font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
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
              @if (duplicated$ | async) { <span class="text-xs text-stone-500">(respuesta idempotente)</span> }
            </p>
            <p><strong>Monto:</strong> \${{ num(tx.amount) | number:'1.2-2' }} · <strong>Comisión:</strong> \${{ num(tx.fee) | number:'1.2-2' }}</p>
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

  protected readonly accounts = toSignal(this.store.select(selectMyAccounts), { initialValue: [] as Account[] });
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

  private readonly formValues = toSignal(this.form.valueChanges, { initialValue: this.form.getRawValue() });

  protected readonly source = computed(() =>
    this.accounts().find((a) => a.id === this.formValues().fromAccountId),
  );
  protected readonly amount = computed(() => Number(this.formValues().amount) || 0);
  protected readonly fee = computed(() => calcFee(this.source()?.type, this.amount()));
  protected readonly total = computed(() => this.amount() + this.fee());
  protected readonly exceeds = computed(() => {
    const src = this.source();
    return !!src && this.total() > this.num(src.balance);
  });
  protected readonly sameAccount = computed(() => {
    const v = this.formValues();
    return !!v.fromAccountId && v.fromAccountId === v.toAccountId;
  });
  protected readonly valid = computed(() => !!this.source() && !this.exceeds() && !this.sameAccount());

  ngOnInit() {
    this.store.dispatch(AccountsActions.loadMyAccounts());
  }

  protected num(v: string | number): number {
    return Number(v);
  }

  protected feeRule = feeLabel;

  protected badgeClass(type: string): string {
    return {
      BASIC: 'bg-stone-100 text-stone-700',
      PREMIUM: 'bg-amber-100 text-amber-700',
      CORPORATE: 'bg-emerald-100 text-emerald-700',
    }[type] ?? 'bg-stone-100 text-stone-700';
  }

  protected submit() {
    if (this.form.invalid || !this.valid()) return;
    this.store.dispatch(
      TransfersActions.executeTransfer({
        ...this.form.getRawValue(),
        idempotencyKey: crypto.randomUUID(),
      }),
    );
  }
}
