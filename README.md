# Backup Manager

Sistema de monitoramento de backups. Recebe eventos via webhook e exibe o status de saúde em um dashboard web e em um app mobile Android.

## Stack

| Camada | Tecnologia |
|---|---|
| **API** | Node.js + TypeScript + Firebase Functions v2 + Express |
| **Banco** | Firestore |
| **Frontend** | React 19 + Vite + TypeScript + Tailwind CSS v4 |
| **App** | Expo SDK 56 (React Native) — build via EAS |
| **Notificações** | FCM via Firebase Admin SDK — cron diário às 20h BRT |
| **Hosting** | Firebase Hosting — `https://backup-manager-2ae79.web.app` |

---

## Estrutura

```
backup-manager/
├── deploy.sh              # script de deploy seletivo (--api / --client)
├── firebase.json
├── .firebaserc
├── functions/             # API — Firebase Functions + Express
│   ├── src/
│   │   ├── index.ts       # exports das functions (HTTP + scheduled)
│   │   ├── types.ts
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── scripts/       # CLI create-user
│   │   └── services/
│   ├── .env               # variáveis de ambiente (gitignored)
│   └── .env.example
├── frontend/              # Dashboard web
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   ├── .env               # URL da API em produção (gitignored)
│   ├── .env.local         # URL do emulador em dev (gitignored)
│   └── .env.example
└── app/                   # App mobile (Expo)
    ├── app/               # telas (expo-router)
    │   ├── (tabs)/        # Dashboard, Devices, Tasks, Events, Settings
    │   ├── _layout.tsx    # auth guard + registro de push token
    │   └── login.tsx
    ├── src/
    │   ├── components/
    │   ├── services/      # api.ts, auth.ts
    │   ├── theme.ts
    │   └── types.ts
    ├── app.config.js      # config dinâmica (lê GOOGLE_SERVICES_JSON do EAS)
    ├── app.json
    └── eas.json
```

---

## Setup

### Pré-requisitos

- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- Autenticado: `firebase login`
- [EAS CLI](https://docs.expo.dev/eas/): `npm install -g eas-cli`
- Autenticado no Expo: `eas login`

### Variáveis de ambiente da API

```bash
cp functions/.env.example functions/.env
```

```
JWT_SECRET=your-jwt-secret-here
ALLOWED_ORIGINS=https://backup-manager-2ae79.web.app,http://localhost:5173
SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
```

`SERVICE_ACCOUNT_KEY` só é necessária para rodar o script `create-user` localmente.

### Criando usuários

**1.** Firebase Console → Project Settings → Service Accounts → **Generate new private key** → salvar como `functions/serviceAccountKey.json` (gitignored).

**2.** Definir o caminho no `.env`:
```
SERVICE_ACCOUNT_KEY=./serviceAccountKey.json
```

**3.** Rodar o script:
```bash
cd functions
npm run create-user -- --name "Erick" --username erick --password yourpassword
```

O campo `api_key` retornado é enviado nas requisições webhook. Também pode ser visualizado e regenerado na página **Settings** do dashboard.

### Rodando localmente

```bash
# API (emulador Firebase Functions na porta 5001)
cd functions && npm install && cd ..
firebase emulators:start --only functions

# Frontend (porta 5173)
cd frontend && npm install
npm run dev
```

O frontend lê `VITE_API_BASE_URL`. Para dev local, crie `frontend/.env.local` a partir do exemplo:

```bash
cp frontend/.env.example frontend/.env.local
```

### App mobile

```bash
cd app && npm install
npm start          # inicia o Expo dev server
npm run apk        # gera APK via EAS (build remoto — perfil preview)
```

#### Dev client (necessário para push notifications)

O `expo-notifications` exige um dev client com o native module incluído — não funciona no Expo Go.

```bash
# Gerar novo dev client após instalar/atualizar módulos nativos
eas build --profile development --platform android

# Ou rodar localmente (requer Android SDK / emulador)
npx expo run:android
```

Depois de instalar o APK do dev client no dispositivo:

```bash
npm start   # conecta ao dev client via QR code ou IP
```

> Sempre que um módulo nativo for adicionado ao projeto (`expo install <pacote>`), é necessário gerar um novo dev client antes de usar o módulo.

#### google-services.json (FCM)

O arquivo `google-services.json` é necessário para o FCM funcionar e está no `.gitignore`. Para builds via EAS, ele é armazenado como secret e injetado automaticamente durante o build.

**Setup inicial (uma vez por ambiente):**

```bash
# Baixar o arquivo em Firebase Console → Project Settings → Your apps → Android
# Salvar como app/google-services.json, depois:

eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment development
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment preview
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment production
```

Para verificar:

```bash
eas env:list
```

O `app.config.js` lê `process.env.GOOGLE_SERVICES_JSON` durante o build EAS e cai de volta para `./google-services.json` em builds locais.

---

## Deploy

```bash
./deploy.sh           # deploya API + frontend
./deploy.sh --api     # só a API
./deploy.sh --client  # só o frontend
```

URLs de produção:
- **API**: `https://us-central1-backup-manager-2ae79.cloudfunctions.net/{function-name}`
- **Frontend**: `https://backup-manager-2ae79.web.app`

---

## Webhook

Endpoint: `POST /webhooks/sync`

O campo `api_key` deve ser o de um usuário existente. Dispositivos e tasks são criados automaticamente se não existirem.

```bash
curl -X POST $BASE_URL/webhooks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "your-api-key",
    "device_id": "notebook-linux",
    "source": "opensync",
    "task": "documents-backup",
    "status": "success"
  }'
```

Valores de `status`: `success` | `error`.

---

## API

> Substitua `BASE_URL` por `http://127.0.0.1:5001/backup-manager-2ae79/us-central1` (emulador) ou `https://us-central1-backup-manager-2ae79.cloudfunctions.net` (produção).

### Autenticação

```bash
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "erick", "password": "yourpassword"}'
# {"token": "..."}
```

Use o token retornado no header `Authorization: Bearer <token>` em todos os endpoints protegidos.

### Endpoints

| Rota | Método | Auth | Descrição |
|---|---|---|---|
| `/auth/login` | POST | público | Retorna JWT |
| `/webhooks/sync` | POST | api_key no body | Registra evento de backup |
| `/devices` | GET, POST | JWT | Lista / cria dispositivos |
| `/devices/:id` | PATCH, DELETE | JWT | Atualiza / remove dispositivo |
| `/events` | GET | JWT | Lista eventos com filtros |
| `/events/:id` | DELETE | JWT | Remove evento |
| `/tasks` | GET, POST | JWT | Lista / cria tasks |
| `/tasks/:id` | PATCH, DELETE | JWT | Atualiza / remove task |
| `/status` | GET | JWT | Status de saúde por device+task |
| `/users/me` | GET | JWT | Perfil do usuário |
| `/users/me/api-key` | POST | JWT | Regenera API key |
| `/users/me/password` | POST | JWT | Altera senha |
| `/users/me/notifications` | PATCH | JWT | Atualiza preferência de notificação |
| `/users/me/fcm-token` | POST | JWT | Registra token FCM do dispositivo |

### Eventos — parâmetros de query

`device_id`, `status` (`success` | `error`), `date_from` (YYYY-MM-DD), `date_to` (YYYY-MM-DD), `page` (padrão: 1), `limit` (padrão: 25, máx: 100).

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "$BASE_URL/events?device_id=notebook-linux&status=error&page=1&limit=25"
```

Formato da resposta:
```json
{ "data": [...], "total": 243, "page": 1, "pages": 10 }
```

---

## Notificações push

A function `dailyNotifications` roda todo dia às **20:00 BRT** via Cloud Scheduler. Para cada usuário com `fcm_token` e `notification_preference !== 'none'`, envia uma notificação FCM separada por task com problema (excluindo tasks de dispositivos com `notifications_enabled: false`).

**Formato:**
```
🔴 documents-backup          ← título (nome da task)
notebook-linux · critical    ← body (dispositivo · status)
```

**Preferências disponíveis** (configuráveis em Settings no web e no app):
- Disabled
- Critical & Warning
- Critical only

**Controle por dispositivo:** cada device tem um campo `notifications_enabled` (padrão `true`, `PATCH /devices/:id`). Dispositivos com notificações desativadas são ignorados pelo `dailyNotifications` mesmo que o usuário tenha uma preferência ativa.

**Testando manualmente:** GCP Console → Cloud Scheduler → `firebase-schedule-dailyNotifications-us-central1` → **Run now**.

---

## Lógica de status

Para cada combinação **device + task**:

| Condição | Status |
|---|---|
| Último `success` há menos de 24h | Healthy |
| Último `success` entre 24h e 72h | Warning |
| Último `success` há mais de 72h | Critical |
| Último evento é `error` | Critical |

Os thresholds 24h/72h são padrão e podem ser sobrescritos por task via `warning_hours` / `critical_hours`.
