import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import * as AuthActions from '../../state/auth/auth.actions';
import { selectAuthError, selectAuthLoading } from '../../state/auth/auth.selectors';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, AsyncPipe],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-100">
      <form [formGroup]="form" (ngSubmit)="submit()"
            class="w-full max-w-sm bg-white rounded-xl shadow p-8 space-y-4">
        <h1 class="text-2xl font-bold text-center text-emerald-700">FinDash</h1>
        <p class="text-sm text-center text-gray-500">Billetera digital</p>

        <input formControlName="email" type="email" placeholder="Email"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        <input formControlName="password" type="password" placeholder="Contraseña"
               class="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500" />

        @if (error$ | async; as error) {
          <p class="text-sm text-red-600">{{ error }}</p>
        }

        <button type="submit" [disabled]="form.invalid || (loading$ | async)"
                class="w-full bg-emerald-600 text-white rounded-lg py-2 font-medium hover:bg-emerald-700 disabled:opacity-50">
          {{ (loading$ | async) ? 'Ingresando…' : 'Ingresar' }}
        </button>

        <p class="text-xs text-gray-400 text-center">
          admin@findash.com / ana@findash.com · · Password123!
        </p>
      </form>
    </div>
  `,
})
export class LoginComponent {
  private readonly store = inject(Store);
  private readonly fb = inject(FormBuilder);

  protected readonly loading$ = this.store.select(selectAuthLoading);
  protected readonly error$ = this.store.select(selectAuthError);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  protected submit() {
    if (this.form.invalid) return;
    const { email, password } = this.form.getRawValue();
    this.store.dispatch(AuthActions.login({ email, password }));
  }
}


