# FinDash — Documento Técnico Final

Prueba técnica full-stack: billetera digital con auth JWT+RBAC, cuentas, transferencias con reglas de negocio y dashboard admin en tiempo real.

- Repo: https://github.com/danielaramirezgutierrez09-ux/davi-test (público)
- Web: https://findash-web-363954144901.us-central1.run.app
- API: https://findash-api-363954144901.us-central1.run.app
- Swagger UI: https://findash-api-363954144901.us-central1.run.app/docs
- Credenciales demo (password `Password123!`): `admin@findash.com` (ADMIN), `ana@findash.com` (BASIC), `luis@findash.com` (PREMIUM), `corp@findash.com` (CORPORATE)

---

## 1. Stack y versiones

| Capa | Elección | Por qué |
|---|---|---|
| Monorepo | pnpm workspaces | Builds filtrados, `pnpm deploy --prod --legacy` para imágenes Docker slim |
| Backend | NestJS 11, Prisma 7 (driver adapter `@prisma/adapter-pg`), PostgreSQL 16 | Estructura modular, DI, pipes de validación; Prisma 7 exige adapter explícito (más control de conexión) |
| Frontend | Angular 22 standalone, signals, zoneless, control flow `@if/@for` | Angular moderno sin zone.js; menos boilerplate, CD por signals |
| Estado | NgRx clásico (Store + Effects + Selectors) | Requisito: estado centralizado, cero HTTP en componentes |
| Tiempo real | SSE (`EventSource`) | Requisito del dashboard es unidireccional (server → cliente); WebSocket sería sobre-ingeniería |
| Gráficos | Chart.js vía `ng2-charts` | Doughnut por tipo de cuenta, poco peso |
| Estilos | Tailwind CSS 4 | Utility-first, tema por CSS vars (`@theme`) |
| Tests | Jest + ts-jest, umbral global 80% | Coverage actual ~98.5% statements |
| Cloud | GCP: Cloud Run (api+web), Cloud SQL Postgres 16, Secret Manager, Artifact Registry, Cloud Build | Requisito PLUS nube; serverless con escala a cero |

Nota honesta: `pnpm up --latest` llevó NestJS a 12 y se revirtió a 11 — Nest 12 es ESM-puro y choca con Jest CJS (ts-jest). Angular 22 + TypeScript 6 sí se adoptaron. Lección: "lo último" no siempre es lo correcto; se documenta la decisión.

---

## 2. Arquitectura

```
davi-test/
├── apps/
│   ├── api/                  # NestJS
│   │   ├── prisma/           # schema + migraciones + seed
│   │   ├── prisma.config.ts  # Prisma 7: datasource url + seed command
│   │   └── src/
│   │       ├── auth/         # JWT (passport), login, JwtStrategy
│   │       ├── accounts/     # listado paginado/filtros, alta admin de usuarios
│   │       ├── transfers/    # RN-01..RN-04
│   │       ├── dashboard/    # KPIs + SSE
│   │       ├── common/       # guards (JWT, roles), decorators, EventsService
│   │       └── generated/    # client Prisma generado (assets nest-cli)
│   └── web/                  # Angular
│       ├── nginx.conf        # proxy /api -> Cloud Run API + no-cache HTML
│       └── src/app/
│           ├── core/         # api services, interceptor, guards, TokenStore
│           ├── state/        # NgRx: auth, accounts, transfers, dashboard
│           ├── pages/        # login, client home, admin cuentas, admin dashboard (lazy)
│           └── shared/       # AvatarComponent (skeleton + fallback)
├── Dockerfile.api / Dockerfile.web
├── cloudbuild.api.yaml / cloudbuild.web.yaml
└── docker-compose.yml        # Postgres local opcional
```

Flujo request: `Component → dispatch Action → Effect → ApiService (HTTP) → API NestJS → Prisma → Cloud SQL`. Los componentes **nunca** llaman HTTP directamente.

---

## 3. Decisiones por requisito (RF/RN)

### Auth JWT + RBAC
- `JwtStrategy` acepta `Authorization: Bearer` y `?token=` (necesario para SSE: `EventSource` no puede enviar headers).
- `RolesGuard` + `@Roles(Role.ADMIN)`: admin ve todo; cliente solo sus cuentas (`/accounts/mine`).
- Rehidratación de sesión **síncrona** en el estado inicial del reducer NgRx (bug real encontrado: los guards con `take(1)` perdían la carrera contra el effect de restore y redirigían a /login tras F5).
- Token expira en 1h; el interceptor HTTP hace logout automático ante 401.

### Listado de cuentas (admin)
- `GET /accounts` paginado (`page`, `limit` máx 100) + filtros `type` y `search` (n° cuenta, nombre, email; `insensitive`).
- Respuesta `{ data, meta: { total, page, limit, totalPages } }` → la UI renderiza paginador sin cálculos.
- Tabla admin: titular (avatar+nombre+email), **UID usuario**, **ID cuenta**, n° cuenta, tipo, saldo.
- Bug real documentado: los actions NgRx llevan `type` (nombre de la acción); pasar el action entero al servicio HTTP enviaba `type=[Accounts] Load` como query param → 400 del enum. Fix: destructurar en el effect. Backend valida enum con `class-validator` — el error era correcto, el cliente estaba mal.

### Alta de usuarios desde admin
- `POST /accounts` (solo ADMIN): crea usuario CLIENT + cuenta en una sola operación Prisma anidada (`user.create({ accounts: { create } })`).
- Validaciones: email único (409), password mín 6 (bcrypt), tipo enum, saldo inicial ≥ 0.
- N° cuenta secuencial `FD-XXXX`. Avatar genérico `/avatar.svg` por defecto.

### Transferencias (núcleo)
- **Atomicidad (RNF ACID)**: `$transaction` interactiva + *optimistic locking*: `updateMany({ where: { id, version, balance: { gte: debito } }, data: { version: { increment: 1 } } })`. Si `count === 0` → `ConflictException` (fondos insuficientes o escritura concurrente). No hay `SELECT ... FOR UPDATE`: la condición vive en el UPDATE, imposible doble gasto.
- **RN-01 Idempotencia**: header `X-Idempotency-Key` con constraint único. Si la key existe → devuelve la tx original con `duplicated: true` (incluso si FAILED) sin repetir efectos. La UI genera `crypto.randomUUID()` por intento.
- **RN-02 Anti-fraude**: `AntiFraudService` simula screening 1-10s; `Promise.race` contra timeout (`ANTIFRAUD_TIMEOUT_MS=3000`). Timeout → 503 limpio + tx FAILED persistida (auditable) y cero movimiento de saldos (la tx de BD ni siquiera abre).
- **RN-03 Comisiones (Strategy)**: `CommissionResolver` mapea tipo de cuenta → estrategia: BASIC 2%, PREMIUM $0, CORPORATE $5 fijos. Agregar un nivel = una clase + una línea en el mapa (Open/Closed).
- **RN-04 Orquestación**: `TransfersService` coordina anti-fraude → comisión → débito/crédito → código de autorización → evento SSE. El controller solo parsea DTO y delega.
- `Decimal` de Prisma para dinero (nunca float), redondeo a 2 decimales en comisión.

### Dashboard admin tiempo real
- `GET /dashboard/kpis` (total cuentas, saldo total, tx de hoy, comisiones acumuladas) + `GET /dashboard/accounts-by-type`.
- `GET /dashboard/stream` SSE: `EventsService` (EventEmitter) emite en cada transferencia → effect NgRx abre `EventSource`, cada mensaje dispara `realtimeTick` → recarga KPIs. `startWith` para carga inicial; `takeUntil(leaveDashboard)` cierra el stream. `NgZone.run` porque EventSource vive fuera de Angular.
- Ruta lazy: `loadComponent` — el chunk del dashboard (con Chart.js) solo se descarga si entra un admin.

### Avatares
- `AvatarComponent` signal-based: skeleton (`animate-pulse`) mientras carga, fallback a iniciales si `error` o sin src. Imagen genérica local `/avatar.svg` (sin dependencia de servicios externos tipo pravatar).

---

## 4. Testing

- 55 tests unitarios, 13 suites; coverage global ~98.5% statements / ~82% branches (umbral 80% configurado en jest — falla el build si baja).
- Casos clave: idempotencia (replay devuelve original), timeout anti-fraude → 503 sin tocar saldos, comisiones por las 3 estrategias, race condition (updateMany count=0 → Conflict), RBAC guards, paginación/filtros, alta admin (409 duplicado).
- `@nestjs/swagger` es ESM → stub en tests vía `moduleNameMapper` (los decorators no aportan a lógica de negocio testeada).

## 5. Despliegue GCP

- **Cloud SQL** Postgres 16 (`db-f1-micro`), BD `findash`. La API se conecta por socket Unix `/cloudsql/...` en Cloud Run y por IP autorizada en local.
- **Secret Manager**: `DATABASE_URL`, `JWT_SECRET` inyectados como env vars; la cuenta de servicio de Cloud Run tiene `roles/secretmanager.secretAccessor`.
- **Cloud Build** construye 2 imágenes a Artifact Registry; deploy con `gcloud run deploy`.
- `Dockerfile.api`: build con pnpm filtrado → `prisma generate` → `nest build` → `pnpm deploy --prod --legacy /out` → runtime node:22-alpine solo con prod deps. `ENV DATABASE_URL` dummy en build porque `prisma.config.ts` (Prisma 7) exige la variable definida para generate.
- `Dockerfile.web`: build Angular → `nginx:alpine` con `proxy_pass` fijo al API (variables en `proxy_pass` rompen sin resolver DNS), `proxy_buffering off` para SSE, HTML con `no-store` (los chunks llevan hash; el HTML no debe cachearse — bug real de despliegue serviendo bundle viejo).
- Migraciones: se aplican antes del deploy desde entorno conectado (`prisma migrate deploy`).

## 6. GitFlow

- `main` (releases, tags `v1.0.0`→`v1.2.0`) ← merges de `develop`.
- `develop` ← `feature/*` y `fix/*` con merge `--no-ff` y mensajes en español tipo conventional commits.
- Ramas usadas: `feature/backend-core`, `feature/frontend`, `feature/tests-y-despliegue`, `feature/admin-usuarios-upgrade`, `fix/accounts-query-type`, `feature/admin-lista-uid`.

## 7. RNF cumplidos

| RNF | Evidencia |
|---|---|
| BD ACID anti race-conditions | Optimistic locking con `version` + condición de saldo en el UPDATE |
| Estado centralizado, sin HTTP en componentes | NgRx 4 slices; HTTP solo en `core/*-api.service.ts` + effects |
| Lazy loading dashboard | `loadComponent` + chunk separado (~2.4 kB + chart.js) |
| Cloud GCP | Cloud Run ×2 + Cloud SQL + Secret Manager + Artifact Registry + Cloud Build |
| Documentación API | Swagger UI en `/docs` con Bearer auth y header de idempotencia |

## 8. Lecciones / decisiones bajo presión

1. "Latest" no gratis: NestJS 12 (ESM-only) vs Jest CJS → se quedó Nest 11; Angular 22 + TS 6 y Prisma 7 sí se adoptaron con migración real (driver adapter, `prisma.config.ts`).
2. Los actions NgRx **no** son DTOs: destructurar siempre antes de llamar servicios (bug del query param `type`).
3. Rehidratación de auth debe ser síncrona si los guards leen el store.
4. HTML con `no-store` en SPAs con assets fingerprinted: evita servir bundles viejos tras redeploy.
5. SSE > WebSocket cuando el flujo es unidireccional; requiere auth por query param y `proxy_buffering off` en nginx.
