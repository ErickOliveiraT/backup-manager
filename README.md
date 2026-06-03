# Backup Manager

Sistema de monitoramento de backups. Recebe eventos via webhook e exibe o status de saúde em um dashboard web e em um app mobile.

## Stack

| Camada | Tecnologia |
|---|---|
| **API** | Node.js + TypeScript + Firebase Functions v2 + Express |
| **Banco** | Firestore |
| **Frontend** | React + Vite + TypeScript + Tailwind CSS v4 |
| **App** | Expo (React Native) — build via EAS |
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
│   │   ├── index.ts       # 7 function exports
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
│   │   ├── pages/
│   │   ├── hooks/
│   │   └── services/
│   ├── .env               # URL da API em produção (gitignored)
│   ├── .env.local         # URL do emulador em dev (gitignored)
│   └── .env.example       # template com URL do emulador
└── app/                   # App mobile (Expo)
    ├── app/               # telas (expo-router)
    ├── src/
    │   ├── components/
    │   ├── services/
    │   └── types.ts
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

| Rota | Método | Auth |
|---|---|---|
| `/auth/login` | POST | público |
| `/webhooks/sync` | POST | api_key no body |
| `/devices` | GET, POST | JWT |
| `/devices/:id` | PATCH, DELETE | JWT |
| `/events` | GET | JWT |
| `/events/:id` | DELETE | JWT |
| `/tasks` | GET, POST | JWT |
| `/tasks/:id` | PATCH, DELETE | JWT |
| `/status` | GET | JWT |
| `/users/me` | GET | JWT |
| `/users/me/api-key` | POST | JWT |

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

## Lógica de status

Para cada combinação **device + task**:

| Condição | Status |
|---|---|
| Último `success` há menos de 24h | Healthy |
| Último `success` entre 24h e 72h | Warning |
| Último `success` há mais de 72h | Critical |
| Último evento é `error` | Critical |

Os thresholds 24h/72h são padrão e podem ser sobrescritos por task via `warning_hours` / `critical_hours`.
