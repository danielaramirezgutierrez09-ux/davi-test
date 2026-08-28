# FinDash — Billetera Digital (prueba técnica full-stack)

Monorepo pnpm: **NestJS 11 + Prisma + PostgreSQL 16 (Cloud SQL)** y **Angular 20 (standalone, signals, zoneless) + NgRx + Tailwind 4 + Chart.js**.

## Producción (GCP · proyecto `davi-test-506822`, us-central1)

- Web: https://findash-web-363954144901.us-central1.run.app
- API: https://findash-api-363954144901.us-central1.run.app

Credenciales seed (password `Password123!`): `admin@findash.com` (ADMIN), `ana@findash.com` (BASIC), `luis@findash.com` (PREMIUM), `corp@findash.com` (CORPORATE).

## Desarrollo local

```bash
pnpm install
pnpm --filter api exec prisma migrate dev   # aplica migraciones (DATABASE_URL en apps/api/.env)
pnpm --filter api exec prisma db seed       # datos de prueba
pnpm api:dev    # API :3000
pnpm web:dev    # Web :4200 (proxy /api -> :3000)
```

Tests: `pnpm --filter api test:cov` (umbral global 80%, actual ~98%).

## Decisiones clave (RF/RN)

| Regla | Implementación |
|---|---|
| JWT + RBAC | `JwtStrategy` + `RolesGuard` (admin global, cliente solo sus cuentas) |
| RN-01 Idempotencia | Header `X-Idempotency-Key` único; repetición devuelve la tx original (`duplicated: true`) |
| RN-02 Anti-fraude | Screening simulado 1–10s con timeout 3s (`ANTIFRAUD_TIMEOUT_MS`) -> aborto limpio (tx FAILED, sin movimiento de saldos) |
| RN-03 Comisiones | Strategy pattern: BASIC 2%, PREMIUM 0%, CORPORATE $5 fijos |
| RN-04 Orquestación | `TransfersService` (fondos + comisión + código de autorización) fuera de controllers |
| ACID / race conditions | `$transaction` + optimistic locking (`version` + `balance >= débito` en `updateMany`) |
| Tiempo real | SSE `/dashboard/stream` (EventSource no envía headers -> JWT por `?token=`) |
| Dashboard | Lazy loading (`loadComponent`), gráfico doughnut por tipo de cuenta |
| Avatares | `AvatarComponent` con skeleton + fallback a iniciales |

## Despliegue (Cloud Build + Cloud Run)

```bash
gcloud builds submit --config cloudbuild.api.yaml .    # imagen API
gcloud builds submit --config cloudbuild.web.yaml .    # imagen web (nginx)
# deploy: ver docs/IMPLEMENTATION-GUIDE.md §6 (DATABASE_URL por socket de Cloud SQL)
```

Notas: el client Prisma se genera a `apps/api/src/generated` (assets nest-cli) para sobrevivir a `pnpm deploy --prod --legacy` en la imagen; migraciones se aplican en CI/local antes del deploy.
