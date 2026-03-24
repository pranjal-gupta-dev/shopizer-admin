# shopizer-admin — Business & Technical Context

> For full suite architecture, see [`../../docs/DOCUMENTATION.md`](../../docs/DOCUMENTATION.md) and [`../../docs/ARCHITECTURE_DIAGRAM.md`](../../docs/ARCHITECTURE_DIAGRAM.md)

---

## What This Repo Does

This is the **merchant back-office admin dashboard**. It lets store owners and admins manage every aspect of their shop: products, orders, customers, shipping, tax, payments, CMS content, and store settings. It talks exclusively to the Shopizer backend API.

---

## Business Domain

| Section | What the merchant can do |
|---------|--------------------------|
| Dashboard | Overview stats |
| Catalogue | Create/edit products, categories, brands, product options & variants, catalogues |
| Orders | View/manage orders, order history, transactions, print invoices |
| Customers | View/manage customer accounts |
| Store Management | Configure store details, branding, manage retailers (marketplace mode) |
| Shipping | Set shipping origin, methods, packages, rules |
| Tax | Define tax classes and rates per zone |
| Payment | Configure payment providers (Stripe, PayPal, Braintree, etc.) |
| Content | Manage CMS pages, boxes, banners, file uploads, promotions |
| User Management | Create/manage admin users and their roles |

---

## Technical Stack

| Concern | Technology |
|---------|-----------|
| Language | TypeScript 4.0.8 |
| Framework | Angular 11.2.14 |
| UI Library | Nebular 5/6 (Akveo) + Bootstrap 4 |
| Build | Angular CLI 11 (`ng build`) |
| Dev Server | `ng serve` on port `4200` |
| HTTP | Angular `HttpClient` via `CrudService` |
| Auth | JWT Bearer token stored in localStorage |
| Node requirement | Node 14–16 (Node 17+ breaks the build) |

---

## Source Structure

```
src/app/
├── @core/              # Core utilities, mock data, data interfaces
├── @theme/             # Nebular theme, shared layout components, SCSS themes
└── pages/
    ├── auth/           # Login, register, forgot/reset password
    ├── home/           # Dashboard
    ├── catalogue/      # Products, categories, brands, options, variations
    ├── orders/         # Order list, details, invoice, history
    ├── customers/      # Customer list and forms
    ├── store-management/ # Store config, branding, retailers
    ├── shipping/       # Shipping origin, methods, packages, rules
    ├── tax-management/ # Tax classes and rates
    ├── payment/        # Payment method configuration
    ├── content/        # CMS pages, boxes, images, files, promotions
    ├── user-management/ # Admin user management
    └── shared/         # Guards, interceptors, services, models, validators
```

---

## Key Services

| Service | Purpose |
|---------|---------|
| `AuthService` | Login, logout, token management |
| `TokenService` | JWT read/write from localStorage |
| `CrudService` | Generic base for all HTTP CRUD operations |
| `ConfigService` | Reads `apiUrl` from `environment.ts` |
| `StoreService` | Store CRUD |
| `UserService` | Admin user CRUD |
| `SecurityService` | Role/permission checks |
| `StorageService` | LocalStorage wrapper |

---

## Route Guards

| Guard | Protects |
|-------|---------|
| `AuthGuard` | All pages behind login |
| `AdminGuard` | Admin-only sections |
| `SuperAdminGuard` | Super admin sections |
| `MarketplaceGuard` | Marketplace features |
| `RetailAdminGuard` | Retail admin routes |
| `ExitGuard` | Warns on unsaved form changes |

---

## HTTP Interceptors

- `AuthInterceptor` — Attaches `Authorization: Bearer <token>` to every request
- `GlobalErrorInterceptor` — Catches HTTP errors and shows toast notifications

---

## Configuration

| File | Purpose |
|------|---------|
| `src/environments/environment.ts` | Dev API URL (`http://localhost:8080/api`) |
| `src/environments/environment.prod.ts` | Prod API URL |
| `proxy.conf.json` | Dev proxy — routes `/api` to backend. **Default points to `aws-demo.shopizer.com:8080`** — change to `http://localhost:8080` for local dev |

---

## Known Gotchas

1. **Node 14–16 required** — Angular 11 breaks on Node 17+. Use `nvm use 16` or set `NODE_OPTIONS=--openssl-legacy-provider`
2. **`proxy.conf.json` points to remote demo** — update to `http://localhost:8080` when running locally
3. **`npm install` may need `--legacy-peer-deps`** due to peer dependency conflicts
4. **`postinstall` runs `ngcc`** — this can take several minutes on first install, just wait
5. **Docker requires pre-built `dist/`** — the Dockerfile does NOT build inside Docker; run `npm run build` first
6. **Default login**: `admin` / `password` (seeded by the backend on first run)
