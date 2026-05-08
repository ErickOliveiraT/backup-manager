# Backup Manager

Sistema de monitoramento de backups que recebe eventos via webhook e exibe o estado de saúde em um dashboard web.

## Stack

- **Functions**: Node.js + TypeScript + Firebase Functions v2 + Express
- **Banco de dados**: Firestore
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4

## Setup

### Pré-requisitos

- [Firebase CLI](https://firebase.google.com/docs/cli): `npm install -g firebase-tools`
- Autenticado: `firebase login`

### Firebase Functions

#### Configurando as variáveis de ambiente

Copie o arquivo de exemplo e preencha com os valores reais:

```bash
cp functions/.env.example functions/.env
```

```
WEBHOOK_API_KEY=seu-segredo-aqui
LOGIN_USER=admin
LOGIN_PASSWORD=sua-senha-aqui
JWT_SECRET=seu-jwt-secret-aqui
```

O arquivo `functions/.env` é lido automaticamente pelo Firebase CLI tanto no emulador quanto no deploy. Ele está no `.gitignore`.

#### Atualizando as variáveis

Edite `functions/.env` diretamente e faça um novo deploy:

```bash
firebase deploy --only functions
```

#### Rodando localmente (emulador)

1. Certifique-se de que `functions/.env` está preenchido.

2. Instale as dependências e inicie o emulador:

```bash
cd functions && npm install
cd ..
firebase emulators:start --only functions
```

As functions ficam disponíveis em `http://127.0.0.1:5001/backup-manager-2ae79/us-central1/`.

#### Deploy

```bash
firebase deploy --only functions
```

O build TypeScript roda automaticamente antes do deploy. As functions são publicadas em:

```
https://us-central1-backup-manager-2ae79.cloudfunctions.net/{nome-da-function}
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Rodando em http://localhost:5173
```

O frontend lê `VITE_API_BASE_URL` para saber onde está a API. Copie o exemplo e ajuste conforme o ambiente:

```bash
cp frontend/.env.example frontend/.env
```

O arquivo `frontend/.env` está no `.gitignore`. O `.env.example` serve de template com a URL do emulador local.

---

## Functions

| Function | Rota | Auth |
|---|---|---|
| `auth` | `POST /auth/login` | pública |
| `webhooks` | `POST /webhooks/sync` | api_key no body |
| `devices` | `GET/POST /devices`, `PATCH /devices/:id` | JWT |
| `events` | `GET /events`, `DELETE /events/:id` | JWT |
| `tasks` | `GET/POST/PATCH/DELETE /tasks` | JWT |
| `status` | `GET /status` | JWT |

---

## API

> Nos exemplos abaixo, substitua `BASE_URL` por `http://127.0.0.1:5001/backup-manager-2ae79/us-central1` (emulador) ou `https://us-central1-backup-manager-2ae79.cloudfunctions.net` (produção).

### Autenticação

```bash
curl -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "sua-senha-aqui"}'
# Retorna {"token": "..."}
```

Use o token retornado no header `Authorization: Bearer <token>` nas demais requisições.

### Webhook — enviar evento de backup

O campo `api_key` é obrigatório. O webhook cria automaticamente o device e a task caso ainda não existam.

```bash
# Backup bem-sucedido
curl -X POST $BASE_URL/webhooks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "seu-segredo-aqui",
    "device_id": "notebook-linux",
    "source": "opensync",
    "task": "documents-backup",
    "status": "success",
    "timestamp": "2026-05-07T03:00:00Z"
  }'

# Backup com erro
curl -X POST $BASE_URL/webhooks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "seu-segredo-aqui",
    "device_id": "notebook-linux",
    "source": "rsync",
    "task": "system-backup",
    "status": "error",
    "timestamp": "2026-05-07T04:15:00Z"
  }'

# Timestamp relativo (agora)
curl -X POST $BASE_URL/webhooks/sync \
  -H "Content-Type: application/json" \
  -d "{
    \"api_key\": \"seu-segredo-aqui\",
    \"device_id\": \"notebook-linux\",
    \"source\": \"opensync\",
    \"task\": \"documents-backup\",
    \"status\": \"success\",
    \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\"
  }"
```

### Dispositivos

```bash
# Listar
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/devices

# Criar
curl -X POST $BASE_URL/devices \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id": "notebook-linux", "name": "Notebook Linux"}'
```

### Tasks

```bash
# Listar
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/tasks

# Criar com thresholds customizados
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

# Atualizar thresholds
curl -X PATCH $BASE_URL/tasks/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"warning_hours": 48, "critical_hours": 96}'

# Remover cron (setar null)
curl -X PATCH $BASE_URL/tasks/<id> \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cron": null}'

# Deletar
curl -X DELETE -H "Authorization: Bearer $TOKEN" $BASE_URL/tasks/<id>
```

### Eventos

```bash
# Todos
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/events

# Filtrado por dispositivo
curl -H "Authorization: Bearer $TOKEN" "$BASE_URL/events?device_id=notebook-linux"

# Deletar
curl -X DELETE -H "Authorization: Bearer $TOKEN" $BASE_URL/events/<id>
```

### Status

```bash
curl -H "Authorization: Bearer $TOKEN" $BASE_URL/status
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

Os thresholds de 24h/72h são os padrões e podem ser sobrescritos por task via `warning_hours` / `critical_hours`.

---

## Estrutura

```
backup-manager/
├── firebase.json
├── .firebaserc
├── functions/
│   ├── src/
│   │   ├── index.ts       # exports das 6 functions
│   │   ├── types.ts
│   │   ├── db/database.ts
│   │   ├── middleware/
│   │   ├── routes/
│   │   └── services/
│   ├── .env               # variáveis de ambiente (gitignored)
│   ├── .env.example       # template das variáveis
│   └── package.json
└── frontend/
    ├── .env             # variáveis de ambiente (gitignored)
    ├── .env.example     # template das variáveis
    └── src/
        ├── components/
        ├── pages/
        ├── hooks/
        └── services/
```
