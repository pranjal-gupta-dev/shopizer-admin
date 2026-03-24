# shopizer-admin — Build & Run Plan

Angular 11 admin dashboard. Talks to the Shopizer backend API on port 8080.

## Prerequisites

```bash
node --version   # needs Node 14–16 (Angular 11 is incompatible with Node 17+)
npm --version    # needs npm 6+
```

> If you have a newer Node, use [nvm](https://github.com/nvm-sh/nvm):
> ```bash
> nvm install 16 && nvm use 16
> ```

---

## Option A — Local Dev Server

**Step 1: Install dependencies**
```bash
cd "/Users/pranjalgupta/local disk/Technogise/shopizer-suite/shopizer-admin"
npm install
```

**Step 2: Configure API URL**

Edit `src/environments/environment.ts`:
```ts
apiUrl: "http://localhost:8080/api"
```
This already points to the local Shopizer backend — no change needed if running backend on port 8080.

**Step 3: Start dev server**
```bash
npm start
```

- Admin UI: `http://localhost:4200`
- Default credentials: `admin` / `password`

> The dev server proxies `/api` calls via `proxy.conf.json` — make sure the backend is running first.

---

## Option B — Docker

**Step 1: Build the Angular app**
```bash
cd "/Users/pranjalgupta/local disk/Technogise/shopizer-suite/shopizer-admin"
npm install
npm run build
```
This outputs to `dist/`.

**Step 2: Build & run Docker image**
```bash
docker build -t shopizer-admin .
docker run -p 80:80 shopizer-admin
```

- Admin UI: `http://localhost:80`

> The Dockerfile copies `dist/` into nginx and runs `envsubst` to inject `env.js` at startup.

---

## Connecting to Backend

| Setting | Value |
|---------|-------|
| Backend running locally | `apiUrl: "http://localhost:8080/api"` in `environment.ts` |
| Backend running in Docker | Use host IP, e.g. `http://host.docker.internal:8080/api` |

---

## Known Issues & Fixes

### 1. Node version incompatibility
Angular 11 requires Node 14 or 16. Node 17+ breaks the build with OpenSSL errors.

**Fix:**
```bash
nvm use 16
# or set env var for Node 17+:
export NODE_OPTIONS=--openssl-legacy-provider
```

### 2. `npm install` fails with peer dependency errors
**Fix:** Use legacy peer deps flag:
```bash
npm install --legacy-peer-deps
```

### 3. `postinstall` script (`ngcc`) hangs or fails
The `package.json` runs `ngcc` after install. On slow machines this can take several minutes.
Just wait — it will complete.

### 4. Proxy not working in dev (API calls fail with 404/CORS)
The dev server uses `proxy.conf.json` which by default points to `http://aws-demo.shopizer.com:8080`.
For local development, update it to point to your local backend:
```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```

### 5. Docker — `dist/` folder missing
The Dockerfile expects `dist/` to already exist (it does NOT build inside Docker).
Always run `npm run build` before `docker build`.

---

## Common Issues

| Problem | Fix |
|---------|-----|
| `Port 4200 in use` | `ng serve --port 4201` |
| `Cannot find module '@angular/core'` | Run `npm install` first |
| Blank page after login | Check backend is running and `apiUrl` is correct |
| `ngcc` errors on install | Upgrade to Node 16 or set `NODE_OPTIONS=--openssl-legacy-provider` |
