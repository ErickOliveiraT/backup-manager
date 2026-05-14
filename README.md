# Backup Manager

Backup monitoring system that receives events via webhook and displays health status on a web dashboard.

## Stack

- **Functions**: Node.js + TypeScript + Firebase Functions v2 + Express
- **Database**: Firestore
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4
- **Hosting**: Firebase Hosting — `https://backup-manager-2ae79.web.app`

---

## Setup

### Prerequisites

- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- Authenticated: `firebase login`

### Functions — environment variables

Copy the example file and fill in the real values:

```bash
cp functions/.env.example functions/.env
```

```
JWT_SECRET=your-jwt-secret-here
ALLOWED_ORIGINS=https://backup-manager-2ae79.web.app,http://localhost:5173
SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
```

`functions/.env` is loaded automatically by Firebase CLI in both the emulator and on deploy. It is gitignored.

`SERVICE_ACCOUNT_KEY` is only required to run the `create-user` script locally. It is not used by the deployed functions.

To update a variable, edit `functions/.env` and redeploy:

```bash
npm run deploy
```

### Creating users

Users are managed via a CLI script. There is no signup flow in the application.

**1. Download a service account key**

Firebase Console → Project Settings → Service Accounts → **Generate new private key** → save as `functions/serviceAccountKey.json` (gitignored).

**2. Set the key path in `.env`**

```
SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
```

**3. Run the script**

```bash
cd functions
npm run create-user -- --name "Erick" --username erick --password yourpassword
```

Output:

```json
{
  "id": "...",
  "name": "Erick",
  "username": "erick",
  "api_key": "...",
  "created_at": "..."
}
```

The printed `api_key` is what the user sends in webhook requests. It can also be viewed and regenerated from the **Settings** page in the dashboard.

### Functions — running locally

```bash
cd functions && npm install && cd ..
npm run emulator
```

Functions are available at `http://127.0.0.1:5001/backup-manager-2ae79/us-central1/`.

### Functions — deploy

```bash
npm run deploy
```

The TypeScript build runs automatically before deploy. Functions are published at:

```
https://us-central1-backup-manager-2ae79.cloudfunctions.net/{function-name}
```

### Frontend

```bash
cd frontend && npm install
npm run frontend:dev   # from project root
```

The frontend reads `VITE_API_BASE_URL` to locate the API.

- **Production** (`frontend/.env`): points to the Cloud Functions URL
- **Local dev** (`frontend/.env.local`): points to the emulator — create from the example:

```bash
cp frontend/.env.example frontend/.env.local
```

Both files are gitignored. `.env.example` is the committed template with the emulator URL.

---

## Root scripts

```bash
npm run build          # compile functions TypeScript
npm run deploy         # deploy functions
npm run emulator       # start Firebase emulator
npm run frontend:dev   # start Vite dev server
npm run frontend:build # build frontend for production
```

---

## Functions

| Function | Route | Auth |
|---|---|---|
| `auth` | `POST /auth/login` | public |
| `webhooks` | `POST /webhooks/sync` | api_key in body |
| `devices` | `GET/POST /devices`, `PATCH/DELETE /devices/:id` | JWT |
| `events` | `GET /events`, `DELETE /events/:id` | JWT |
| `tasks` | `GET/POST/PATCH/DELETE /tasks` | JWT |
| `status` | `GET /status` | JWT |
| `users` | `GET /users/me`, `POST /users/me/api-key` | JWT |

---

## API

> In the examples below, replace `BASE_URL` with `http://127.0.0.1:5001/backup-manager-2ae79/us-central1` (emulator) or `https://us-central1-backup-manager-2ae79.cloudfunctions.net` (production).

### Authentication

```bash
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "erick", "password": "yourpassword"}'
# Returns {"token": "..."}
```

Use the returned token in the `Authorization: Bearer <token>` header for all protected endpoints.

### User — current user info

```bash
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/users/me
```

### User — regenerate API key

```bash
curl -X POST -H "Authorization: Bearer $TOKEN" $BASE_URL/users/me/api-key
# Returns {"api_key": "..."}
```

### Webhook — send a backup event

The `api_key` field must match the key of an existing user. The timestamp is generated server-side (São Paulo timezone). Devices and tasks are created automatically if they don't exist yet.

```bash
# Successful backup
curl -X POST $BASE_URL/webhooks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your-api-key-here",
    "device_id": "notebook-linux",
    "source": "opensync",
    "task": "documents-backup",
    "status": "success"
  }'

# Failed backup
curl -X POST $BASE_URL/webhooks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your-api-key-here",
    "device_id": "notebook-linux",
    "source": "rsync",
    "task": "system-backup",
    "status": "error"
  }'
```

### Devices

```bash
# List
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/devices

# Create
curl -X POST $BASE_URL/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "notebook-linux", "name": "Notebook Linux"}'
```

### Tasks

```bash
# List
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/tasks

# Create with custom thresholds
curl -X POST $BASE_URL/tasks \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "notebook-linux",
    "task": "weekly-backup",
    "cron": "0 2 * * 0",
    "warning_hours": 168,
    "critical_hours": 336
  }'

# Update thresholds
curl -X PATCH $BASE_URL/tasks/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"warning_hours": 48, "critical_hours": 96}'

# Remove cron (set null)
curl -X PATCH $BASE_URL/tasks/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cron": null}'

# Delete
curl -X DELETE -H "Authorization: Bearer $TOKEN" $BASE_URL/tasks/<id>
```

### Events

```bash
# All events (paginated, 25 per page by default)
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/events

# Pagination
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/events?page=2&limit=50"

# Filter by device
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/events?device_id=notebook-linux"

# Filter by status
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/events?status=error"

# Filter by date range
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/events?date_from=2026-05-01&date_to=2026-05-08"

# Combine filters
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/events?device_id=notebook-linux&status=error&page=1&limit=25"

# Delete
curl -X DELETE -H "Authorization: Bearer $TOKEN" $BASE_URL/events/<id>
```

Response format:

```json
{
  "data": [...],
  "total": 243,
  "page": 1,
  "pages": 10
}
```

Supported query parameters: `device_id`, `status` (`success` | `error`), `date_from` (YYYY-MM-DD), `date_to` (YYYY-MM-DD), `page` (default: 1), `limit` (default: 25, max: 100).

### Status

```bash
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/status
```

---

## Status logic

For each **device + task** combination:

| Condition | Status |
|---|---|
| Last `success` less than 24h ago | Healthy |
| Last `success` between 24h and 72h ago | Warning |
| Last `success` more than 72h ago | Critical |
| Last event is `error` | Critical |

The 24h/72h thresholds are defaults and can be overridden per task via `warning_hours` / `critical_hours`.

---

## Structure

```
backup-manager/
├── package.json           # root scripts shortcut
├── firebase.json
├── .firebaserc
├── functions/
│   ├── src/
│   │   ├── index.ts       # 7 function exports
│   │   ├── types.ts
│   │   ├── db/database.ts
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── scripts/       # create-user CLI
│   │   └── services/
│   ├── .env               # environment variables (gitignored)
│   ├── .env.example       # variable template
│   └── package.json
└── frontend/
    ├── .env               # production API URL (gitignored)
    ├── .env.local         # local dev API URL (gitignored)
    ├── .env.example       # variable template (emulator URL)
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        └── services/
```
