# Kisan Kraya Seva — Backend (FastAPI + PostgreSQL)

FastAPI service backing the Farmer Procurement Portal. PostgreSQL is the
persistent source of truth; the queue service is structured so Redis pub/sub
and WebSockets can be added without rewrites (an in-process event bus +
`/ws/queue/{centre_id}` already exist).

```
backend/
├── app/
│   ├── main.py            # FastAPI app: CORS, routers, /health, error handlers
│   ├── config.py          # pydantic-settings (all secrets from env / .env)
│   ├── database.py        # async engine (psycopg 3) + session factory
│   ├── models/            # SQLAlchemy 2.x ORM (farmers, centres, slots, …)
│   ├── schemas/           # Pydantic request/response DTOs
│   ├── routers/           # auth, farmers, centres, slots, queue, …
│   ├── services/          # queue logic, security, events, seed
│   └── ws.py              # /ws/queue/{centre_id} live queue channel
├── alembic/               # migrations (alembic upgrade head)
├── tests/                 # pytest suite incl. concurrent queue-join tests
├── alembic.ini
├── requirements.txt
├── .env.example           # copy to .env and fill in real values
└── .env                   # git-ignored, real local configuration
```

## 1. PostgreSQL setup

```bash
# Ubuntu/Debian
sudo apt install postgresql
sudo service postgresql start

# Create an application role + databases (adjust the password!)
sudo -u postgres psql
```
```sql
CREATE ROLE kisan_app WITH LOGIN PASSWORD 'CHANGE_ME_kisan_2026';
CREATE DATABASE kisan_procurement OWNER kisan_app;
CREATE DATABASE kisan_procurement_test OWNER kisan_app;
GRANT ALL PRIVILEGES ON DATABASE kisan_procurement TO kisan_app;
GRANT ALL PRIVILEGES ON DATABASE kisan_procurement_test TO kisan_app;
\q
```

## 2. Configure environment

```bash
cd backend
cp .env.example .env
# edit .env → DATABASE_URL / TEST_DATABASE_URL (password!) and SECRET_KEY
# generate a strong key:  python -c "import secrets; print(secrets.token_hex(32))"
```

Never commit `.env` (it is git-ignored). All configuration is read from
environment variables via `app/config.py` (pydantic-settings).

## 3. Install dependencies & run migrations

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

alembic upgrade head          # apply migrations (creates all tables)
```

New schema changes: `alembic revision --autogenerate -m "..."` then
`alembic upgrade head`. `Base.metadata.create_all()` is never used.

## 4. Seed development data (fictitious)

```bash
python -m app.services.seed          # idempotent get-or-create
python -m app.services.seed --reset  # wipe + reseed
```

Seeds 18 centres, ~25 farmers, officer `OFF-2201`, slots for today-7…today+6,
today's live queue (`FPP-1020…1045` at the first centre → next join gets
`FPP-1046`), booking history, procurement records, payments and notifications.

Demo credentials (development only):

| Account | Login | Password |
|---|---|---|
| Demo farmer | `9876543210` | OTP `123456` **or** password `demo1234` |
| Officer | `OFF-2201` | `officer1234` |

## 5. Start the API

```bash
uvicorn app.main:app --reload          # http://localhost:8000
# interactive docs: http://localhost:8000/docs
```

## 6. Tests

```bash
pytest            # uses TEST_DATABASE_URL (kisan_procurement_test)
```

Covers registration/login, centre/slot APIs, queue join (token + position +
ETA), duplicate-join prevention, full-slot rejection, status transitions,
advance, procurements, payments — plus concurrent join tests proving unique
tokens and exact capacity under parallelism.

## 7. Frontend connection (Expo)

The React Native app reads the API base URL from `EXPO_PUBLIC_API_URL`
(see `.env.example` in the repo root). Android emulators default to
`http://10.0.2.2:8000`; physical devices must point at the machine's LAN IP.

```bash
# repo root
cp .env.example .env    # adjust EXPO_PUBLIC_API_URL if needed
npx expo start
```

Set `EXPO_PUBLIC_USE_BACKEND=false` to run the app on bundled mock data only.

## API summary

Base path `/api`. Highlights (full list at `/docs`):

```
POST   /api/auth/farmer/register | /api/auth/farmer/login | /api/auth/officer/login
POST   /api/farmers        GET/PUT /api/farmers/{id}
GET    /api/farmers/{id}/queue | /procurements | /payments
GET    /api/centres?state=&district=&status=&crop=    GET /api/centres/{id}
GET    /api/centres/{id}/slots?date=    POST /api/centres/{id}/slots   PATCH /api/slots/{id}
GET    /api/slots?from=&to=
POST   /api/queue/join                 GET /api/queue/{entry_id}
GET    /api/queue/centre/{centre_id}?date=      POST /api/queue/centre/{centre_id}/advance
PATCH  /api/queue/{entry_id}/status    PATCH /api/queue/{entry_id}/slot
POST   /api/queue/{entry_id}/arrive
POST   /api/procurements   GET/PATCH /api/procurements/{id}   GET /api/procurements
POST   /api/payments       GET/PATCH /api/payments/{id}       GET /api/payments?procurement_id=
GET    /api/notifications?farmer_id=    POST /api/notifications    PATCH /api/notifications/read-all
WS     /ws/queue/{centre_id}
GET    /health
```

### Queue concurrency design

* **Token numbers** — issued with `INSERT … ON CONFLICT (centre_id) DO UPDATE
  SET last_token = last_token + 1 RETURNING last_token` on `token_counters`
  (row-locked; never `MAX()+1`).
* **Capacity** — `UPDATE slots … WHERE booked_count < capacity RETURNING id`
  (atomic; full slots get `409 slot_full`).
* **Duplicates** — application check + partial unique index
  `uq_queue_farmer_active_per_centre WHERE status IN (WAITING, CALLED,
  IN_PROGRESS, ON_HOLD)`.
* **Position/ETA** — derived per request (active entries with a lower token
  for the same centre/day), never stored.

### Security notes

* Passwords: PBKDF2-HMAC-SHA256 (240k iterations, per-user salt). Aadhaar is
  stored only as an HMAC. No plaintext secrets anywhere.
* Auth tokens are HMAC-SHA256-signed payloads (`SECRET_KEY` from env).
* CORS is an explicit allow-list (`CORS_ORIGINS`). Set
  `REQUIRE_OFFICER_AUTH=true` in production to require officer bearer tokens
  for queue/slot mutations.
* All queries go through SQLAlchemy (parameterised) — no string SQL with
  user input.
