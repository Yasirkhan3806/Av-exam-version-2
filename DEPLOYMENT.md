# AVExam v4 — VPS deployment guide (testing domain)

Step-by-step for putting this build on a VPS that **already runs other sites**
under Nginx + PM2 + MongoDB. Nothing here touches your existing sites — every
resource is namespaced (`avexam-test-*` PM2 apps, a dedicated Mongo database, a
dedicated OnlyOffice container, new Nginx server blocks).

---

## 0. Architecture — what runs where

| Piece | Process | Port (localhost only) | Public URL |
|---|---|---|---|
| Frontend (Next.js 15, App Router) | PM2 `avexam-test-web` — `next start` | 3100 | `https://testcbe.academicvitality.org` |
| Backend (Express 5, ESM) | PM2 `avexam-test-api` — `node server.js` | 5100 | same origin, path-routed (`/auth`, `/questions`, `/api/…`, …) |

> Ports 3100/5100 assume 3000/5000 are already used by your other services.
> Check with `ss -ltnp | grep -E ':(3000|5000)\b'` and adjust the PM2 config +
> Nginx `proxy_pass` lines together if you pick different numbers. The public
> URLs never change — only the localhost upstreams.
| OnlyOffice Document Server | Docker container | 8080 | `https://officecbe.academicvitality.org` |
| Database | your existing `mongod` | 27017 | dedicated DB `avexam_test` |

**Single-origin on purpose.** The frontend and backend are served from the *same*
hostname (`testcbe.academicvitality.org`), with Nginx routing backend path
prefixes to port 5000 and everything else to port 3000. This is the least-effort
option for authentication: the JWT cookies stay host-only on one domain, no
`COOKIE_DOMAIN`, no cross-origin CORS, and `testcbe.academicvitality.org` is
**already in the backend's CORS allow-list** (`backend/app.js`). The alternative
(separate `api.` subdomain) needs a CORS-list edit and a shared cookie domain —
covered in §12, but prefer single-origin.

`testcbe.academicvitality.org` shares the registrable domain
`academicvitality.org` with your production site. See §14 "Caveats" for the
cookie-collision implication.

---

## 1. Prerequisites on the VPS

```bash
node -v          # 20.x or 22.x — both supported (CI builds on 20; 22 LTS is fine)
pm2 -v           # already installed
docker -v        # needed for OnlyOffice; install if missing
nginx -v
mongosh --version
```

Any current LTS (20 or 22) works — Next 15, Express 5, Mongoose 8, Puppeteer 24
and bcrypt 6 all support Node 22. Just make sure the frontend **build** and the
PM2 **runtime** use the *same* Node version: bcrypt and `@sentry/profiling-node`
are native modules compiled against a specific Node ABI, so don't build under one
version and run under another (e.g. via an nvm `interpreter:` override in the PM2
config). If `npm ci` fails compiling a native module, install build tools:
`apt-get install -y build-essential python3`.

Pick a directory alongside your other sites, e.g. `/var/www/avexam-test`.

---

## 2. DNS

Add two `A` records pointing at the VPS IP:

```
testcbe.academicvitality.org      A   <VPS_IP>
officecbe.academicvitality.org    A   <VPS_IP>
```

Wait for them to resolve (`dig +short testcbe.academicvitality.org`) before
running certbot in §13.

---

## 3. One required code change (already applied in this branch)

`frontend/src/utils/onlyOfficeLoader.js` previously hard-coded
`http://localhost:8080`. It now reads `NEXT_PUBLIC_ONLYOFFICE_URL` and falls back
to localhost for dev. Nothing to do if you deploy this branch — just make sure
`NEXT_PUBLIC_ONLYOFFICE_URL` is set before the frontend build (§7).

No other code change is needed for the single-origin setup.

---

## 4. Get the code onto the VPS

```bash
cd /var/www
git clone <your-repo-url> avexam-test
cd avexam-test
git checkout main            # or the branch you're deploying

cd backend  && npm ci --omit=dev ; cd ..
cd frontend && npm ci ; cd ..
```

> Both `package-lock.json` files **are** committed (they were tracked before the
> `.gitignore` entries were added, so git still versions them — the `.gitignore`
> lines are just misleading). `npm ci` works and matches CI. The frontend needs
> its devDependencies (`next`, `eslint`, `tailwindcss`) to build, so don't pass
> `--omit=dev` there.

Puppeteer (used by the instructor answer-sheet PDF export) downloads Chromium on
install. If that step is blocked by your network, run it manually later:
`cd backend && npx puppeteer browsers install chrome`.

---

## 5. Generate fresh secrets

Do **not** reuse the values from your local `.env` files — at least one has been
exposed in plaintext already. Generate new ones on the VPS:

```bash
openssl rand -hex 64    # -> JWT_SECRET            (app auth; same value in backend + frontend)
openssl rand -hex 32    # -> ONLYOFFICE_JWT_SECRET (backend <-> Document Server; same value in backend + docker)
openssl rand -hex 32    # -> PEPPER               (only if this is a FRESH database; see note)
```

- **`JWT_SECRET`** must be **byte-for-byte identical** in `backend/.env` and
  `frontend/.env.local`. The frontend Edge middleware verifies tokens the
  backend signs.
- **`ONLYOFFICE_JWT_SECRET`** must be identical in `backend/.env` and the
  Document Server container's `JWT_SECRET` env var (§10).
- **`PEPPER`** is mixed into admin password hashes. If you are **importing admin
  accounts from production**, `PEPPER` must equal the production value or every
  admin login breaks. If you start with an empty DB and create a fresh admin
  (§9), any value is fine.

---

## 6. `backend/.env`

Create `/var/www/avexam-test/backend/.env`:

```ini
# --- Database -------------------------------------------------------------
# Dedicated DB on your existing mongod. Add credentials if your mongod has auth:
#   mongodb://user:pass@127.0.0.1:27017/avexam_test?authSource=admin
MONGODB_URL=mongodb://127.0.0.1:27017/avexam_test

# --- App auth ----------------------------------------------------------------
JWT_SECRET=<openssl rand -hex 64 from step 5 — MUST match frontend/.env.local>
PEPPER=<see step 5>

# --- Runtime ---------------------------------------------------------------
NODE_ENV=production
# Backend origin as reachable from the OnlyOffice container (public URL is
# simplest — a real hostname passes through untouched; only "localhost" would
# be rewritten). Used to build the document + callback URLs handed to the
# Document Server.
BACKEND_BASEURL=https://testcbe.academicvitality.org

# Cookies: leave COOKIE_DOMAIN UNSET for the single-origin setup (host-only
# cookie on testcbe.academicvitality.org). Only set it for the separate-
# subdomain setup in §12.
# COOKIE_DOMAIN=

# --- OnlyOffice ----------------------------------------------------------------
ONLYOFFICE_JWT_SECRET=<openssl rand -hex 32 from step 5 — MUST match the container>

# --- Email (Hostinger SMTP) — required for student welcome / credential mail --
EMAIL_HOST=smtp.hostinger.com
EMAIL_PORT=465
EMAIL_USER=<mailbox@your-domain>
EMAIL_PASS=<mailbox password>
EMAIL_FROM_NAME=Academic Vitality

# --- Cloudflare Turnstile (login CAPTCHA) ---------------------------------
CLOUDFLARE_SECRET_KEY=<Turnstile secret key for the testcbe domain>

# --- Sentry (optional; omit to disable) ---------------------------------------
SENTRY_DSN=
```

Notes
- `express-session` / `redis` appear in `package.json` but are **not used** — no
  Redis needed.
- The Turnstile **site key** goes in the frontend env; the **secret key** here.
  Add `testcbe.academicvitality.org` as an allowed hostname in the Cloudflare
  Turnstile widget config, or login CAPTCHA will fail.

---

## 7. `frontend/.env.local`

Create `/var/www/avexam-test/frontend/.env.local`. **`NEXT_PUBLIC_*` values are
inlined at build time** — set them before §11 and rebuild if they ever change.

```ini
# Same origin as the site itself (Nginx routes the API path prefixes to :5000)
NEXT_PUBLIC_BASEURL=https://testcbe.academicvitality.org

# Public origin of the OnlyOffice Document Server (its own subdomain, §13)
NEXT_PUBLIC_ONLYOFFICE_URL=https://officecbe.academicvitality.org

# MUST byte-for-byte match backend/.env JWT_SECRET. NOT NEXT_PUBLIC_ on purpose
# (server-only; used by Edge middleware at build AND runtime).
JWT_SECRET=<same value as backend/.env>

# Strips console.* and enables prod behaviour
NEXT_PUBLIC_MODE=production

NEXT_PUBLIC_JITSI_DOMAIN=meet.academicvitality.org
NEXT_PUBLIC_CLOUDFLARE_SITE_KEY=<Turnstile SITE key for testcbe domain>
NEXT_PUBLIC_SENTRY_DSN=

# Optional: upload source maps to Sentry during build
# SENTRY_ORG=
# SENTRY_PROJECT=
# SENTRY_AUTH_TOKEN=
```

Why `JWT_SECRET` is needed at build time: `frontend/src/middleware.js` and
`frontend/src/app/Admin/Dashboard/layout.js` throw at import if it's missing, and
`next build`'s "Collecting page data" phase imports them. (This is exactly what
failed your GitHub Actions build.)

---

## 8. System libraries for Puppeteer (Ubuntu/Debian)

The instructor "download answer sheet" feature launches headless Chromium. Install
its shared-library dependencies once:

```bash
sudo apt-get update
sudo apt-get install -y \
  ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
  libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
  libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
  libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
  libxtst6 lsb-release wget xdg-utils
```

(On Ubuntu 24.04 the package is `libasound2t64`.) Verify:
`cd backend && node -e "console.log(require('puppeteer').executablePath())"` then
check that file exists. `puppeteer.launch` here already passes
`--no-sandbox --disable-setuid-sandbox`, so running under PM2 as a non-root user
is fine.

---

## 9. Database + first admin

The DB is created on first connect — nothing to do manually. You just need one
admin account to log in.

Admin login (`POST /auth/admin-login`) looks up the **`User_Data`** collection by
`email` (lowercased) and checks `bcrypt.compare(password + PEPPER, hash)`.

Create a temporary script `backend/create-admin.mjs`:

```js
import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const email = (process.argv[2] || '').toLowerCase();
const password = process.argv[3];
if (!email || !password) {
  console.error('usage: node create-admin.mjs <email> <password>');
  process.exit(1);
}
await mongoose.connect(process.env.MONGODB_URL);
const hash = await bcrypt.hash(password + (process.env.PEPPER || ''), 10);
await mongoose.connection.collection('User_Data').updateOne(
  { email },
  { $set: { firstName: 'Admin', lastName: 'User', userName: email, email, password: hash } },
  { upsert: true },
);
console.log('admin ready:', email);
await mongoose.disconnect();
```

Run it from the backend dir (so it picks up `.env`), then delete it:

```bash
cd /var/www/avexam-test/backend
node create-admin.mjs admin@academicvitality.org 'ChooseAStrongPassword'
rm create-admin.mjs
```

If you're instead restoring a production dump, `mongorestore` into `avexam_test`
and skip this — but then `PEPPER` in `backend/.env` must match production.

---

## 10. OnlyOffice Document Server (Docker)

Runs as its own container, published on localhost:8080 only (Nginx terminates TLS
in front of it in §13).

```bash
docker run -itd --restart=always \
  --name avexam-test-onlyoffice \
  -p 127.0.0.1:8080:80 \
  -e JWT_ENABLED=true \
  -e JWT_SECRET='<ONLYOFFICE_JWT_SECRET from backend/.env>' \
  -e JWT_HEADER=Authorization \
  -v avexam_test_oo_data:/var/www/onlyoffice/Data \
  -v avexam_test_oo_logs:/var/log/onlyoffice \
  onlyoffice/documentserver
```

- `JWT_SECRET` here **must equal** `ONLYOFFICE_JWT_SECRET` in `backend/.env`.
- Give it a minute to boot; `curl -sI http://127.0.0.1:8080/healthcheck` should
  return `200` and the body `true`.
- Resource cost: the Document Server wants **~2 GB RAM**. Check `free -m` before
  committing — this is the single heaviest piece of the deployment.
- The container reaches the backend over the public internet via
  `BACKEND_BASEURL` (`https://testcbe.academicvitality.org/...`), so it needs
  working egress + the site's TLS cert must be valid (it will be, after §13).

---

## 11. Build the frontend

```bash
cd /var/www/avexam-test/frontend
npm run build      # reads .env.local; fails loudly if JWT_SECRET is missing
```

Rebuild whenever any `NEXT_PUBLIC_*` value or `JWT_SECRET` changes. The build
output (`.next/`) is git-ignored, which is correct — it's regenerated on each
deploy.

---

## 12. PM2

Create `/var/www/avexam-test/ecosystem.config.cjs` (`.cjs`, not `.js` — the
backend `package.json` sets `"type": "module"`):

```js
module.exports = {
  apps: [
    {
      name: 'avexam-test-api',
      cwd: './backend',           // REQUIRED: uploads, static dirs, logs and
      script: 'server.js',        // dotenv all resolve relative to cwd
      interpreter: 'node',
      // server.js reads process.env.PORT (falls back to 5000). Pick a port
      // that isn't already taken by your other services.
      env: { NODE_ENV: 'production', PORT: 5100 },
      max_memory_restart: '500M',
      time: true,
    },
    {
      name: 'avexam-test-web',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3100 -H 127.0.0.1',   // bind localhost; Nginx proxies
      env: { NODE_ENV: 'production' },
      max_memory_restart: '600M',
      time: true,
    },
  ],
};
```

Create the runtime directories the backend writes to (all git-ignored, so absent
on a fresh clone) and start:

```bash
cd /var/www/avexam-test/backend
mkdir -p logs Answer_pdfs TestQuestions uploads

cd /var/www/avexam-test
pm2 start ecosystem.config.cjs
pm2 save                 # persist across reboots (pm2 startup already set up)
pm2 logs avexam-test-api --lines 50   # confirm "MongoDB Connected" + "Server running"
pm2 logs avexam-test-web --lines 50   # confirm "Ready in ..."
```

If your other apps run under a different Node version via nvm, add
`interpreter: '/home/<user>/.nvm/versions/node/v20.x.x/bin/node'` to both apps.

---

## 13. Nginx

Two new server blocks. Nothing here overlaps your existing sites (different
`server_name`s).

### `/etc/nginx/sites-available/avexam-test`

```nginx
server {
    listen 80;
    server_name testcbe.academicvitality.org;

    client_max_body_size 50m;      # backend accepts up to 50mb bodies/uploads

    # --- Backend (Express :5100) — path prefixes from backend/app.js ---------
    location ~ ^/(auth|questions|subjects|instructors|caf-answers|prc-exams|api|TestQuestions|Answer_pdfs)(/|$) {
        proxy_pass http://127.0.0.1:5100;
        proxy_http_version 1.1;
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 120s;           # PDF export via Puppeteer can be slow
    }

    # --- Frontend (Next.js :3100) — everything else -------------------------
    location / {
        proxy_pass http://127.0.0.1:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade           $http_upgrade;
        proxy_set_header Connection        "upgrade";
        proxy_set_header Host              $host;
        proxy_set_header X-Real-IP         $remote_addr;
        proxy_set_header X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### `/etc/nginx/sites-available/avexam-test-office`

```nginx
map $http_upgrade $connection_upgrade {
    default upgrade;
    ""      close;
}

server {
    listen 80;
    server_name officecbe.academicvitality.org;

    client_max_body_size 100m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade            $http_upgrade;
        proxy_set_header Connection         $connection_upgrade;
        proxy_set_header Host               $host;
        proxy_set_header X-Real-IP          $remote_addr;
        proxy_set_header X-Forwarded-For    $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto  $scheme;
        proxy_set_header X-Forwarded-Host   $host;
    }
}
```

> If your Nginx already defines a `$connection_upgrade` map globally (some setups
> do, for other WebSocket sites), delete the `map` block above to avoid a
> duplicate-definition error.

Enable + reload:

```bash
sudo ln -s /etc/nginx/sites-available/avexam-test        /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/avexam-test-office /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 14. TLS (certbot)

```bash
sudo certbot --nginx \
  -d testcbe.academicvitality.org \
  -d officecbe.academicvitality.org
```

Certbot rewrites both server blocks to listen on 443 and adds the redirect. After
it finishes:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

The app forces `secure` + `SameSite=None` cookies when `NODE_ENV=production`, so
**HTTPS must be live** before login will work.

---

## 15. Smoke test

1. `https://testcbe.academicvitality.org` loads and (unauthenticated) redirects
   to `/Login`.
2. `https://testcbe.academicvitality.org/auth` returns the health-check JSON
   (proves the Nginx path-routing to :5000 works).
3. Admin login at `/Admin` with the account from §9 → lands on the dashboard
   (proves JWT signing + the frontend/backend `JWT_SECRET` match + cookies over
   HTTPS).
4. `https://officecbe.academicvitality.org/healthcheck` returns `true`.
5. Create a subject + exam, enrol a student, start the exam as that student, and
   confirm the **spreadsheet pane** loads an editable grid (proves
   `NEXT_PUBLIC_ONLYOFFICE_URL`, the container JWT secret match, and
   `BACKEND_BASEURL` reachability all line up). Type a value, switch questions,
   switch back — the value persists **until the backend restarts** (rough-work
   storage is in-memory by design; see Caveats).
6. `pm2 logs` for both apps — no repeating errors.

---

## 16. Redeploying after a code change

```bash
cd /var/www/avexam-test
git pull

cd backend  && npm ci --omit=dev ; cd ..
cd frontend && npm ci && npm run build ; cd ..

pm2 restart avexam-test-api avexam-test-web
pm2 save
```

The OnlyOffice container does not need restarting for app code changes.

---

## 17. Troubleshooting

| Symptom | Likely cause |
|---|---|
| `next build` fails: `JWT_SECRET is not set` | `frontend/.env.local` missing the var — §7. |
| Login succeeds but next page bounces back to `/Login` | `JWT_SECRET` differs between `backend/.env` and `frontend/.env.local`; or site not on HTTPS yet (cookie is `Secure`); or clock skew > 2 min between VPS and client. |
| Login returns "Invalid email or password" for a known-good admin | `PEPPER` doesn't match the value used when the hash was created (relevant only when importing existing accounts). |
| CAPTCHA fails on login | Turnstile site/secret key mismatch, or `testcbe.academicvitality.org` not whitelisted on the Turnstile widget. |
| Spreadsheet pane shows "Couldn't load the spreadsheet editor" | `NEXT_PUBLIC_ONLYOFFICE_URL` wrong or not rebuilt; `officecbe` cert invalid (mixed content); container down (`docker ps`). |
| Spreadsheet loads but never saves / "download failed" in `pm2 logs avexam-test-api` | `ONLYOFFICE_JWT_SECRET` ≠ container `JWT_SECRET`; or the container can't reach `BACKEND_BASEURL` (egress / DNS / cert). |
| Instructor "download answer sheet" 500s | Puppeteer system libs missing — §8; check `pm2 logs avexam-test-api` for the missing `.so`. |
| Uploads 500 or static question PDFs 404 | PM2 `cwd` for the API is not `./backend` — §12. |
| `502` from Nginx | PM2 app crashed or bound to a different port — `pm2 list`, `pm2 logs`. |

---

## 18. Caveats — read before you rely on this

- **Rough-work spreadsheet data is in-memory only.**
  `backend/services/onlyofficeExamService.js` stores it in a `Map`; restarting
  `avexam-test-api` (a redeploy, a crash, `max_memory_restart`) wipes every
  student's scratch sheet. This is an existing product decision, not a
  deployment gap — but on a server that restarts more than your laptop, students
  will notice. Persist to disk/Mongo before any real exam use.
- **Cookie collision with production.** `testcbe.academicvitality.org` and the
  production site share the registrable domain. The app's cookies (`token`,
  `ExamToken`, `instructorToken`, `eLibraryToken`) are host-only in the
  single-origin setup, so **a normal browser keeps them separate** — but if you
  ever switch to the separate-subdomain setup and set
  `COOKIE_DOMAIN=.academicvitality.org`, the test and prod cookies (same names,
  parent domain) will overwrite each other in a browser that visits both. Keep
  single-origin, or use a genuinely different domain for testing.
- **Secrets were exposed.** The `JWT_SECRET` currently in the repo's local
  `.env.local` was printed in plaintext during troubleshooting. Treat it as
  burned; use fresh values on the VPS (§5) and don't copy the local ones.
- **The `.gitignore` lists the lockfiles but they're still tracked.** Committed
  before the ignore rules were added. Harmless, but confusing — `git add`-ing a
  lockfile change needs `-f`. Either remove the `.gitignore` lines or
  `git rm --cached` the lockfiles and commit that decision.
- **Separate-subdomain alternative** (`api.testcbe.academicvitality.org`): add
  that origin to the `allowedOrigins` array in `backend/app.js`, set
  `NEXT_PUBLIC_BASEURL` to it, set `COOKIE_DOMAIN=.academicvitality.org` in
  `backend/.env` (needed so the Next.js Edge middleware on the app subdomain can
  read the `token` cookie the API subdomain sets), and give the API subdomain its
  own Nginx block + cert. More moving parts; only do this if you specifically
  need the API on its own host.
