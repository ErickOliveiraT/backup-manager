# Backup Manager

Sistema de monitoramento de backups que recebe eventos via webhook e exibe o estado de saúde em um dashboard web.

## Stack

- **Backend**: Node.js + Express + TypeScript + Firebase Admin SDK (Firestore)
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4

## Setup

### Backend

1. Baixe o arquivo de credenciais do Firebase Console em **Project Settings → Service Accounts → Generate new private key** e salve como `api/backup-manager.json`.

2. Defina a API key do webhook em `api/.env`:

```
WEBHOOK_API_KEY=seu-segredo-aqui
```

3. Instale e rode:

```bash
cd api
npm install
npm run dev
# Rodando em http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# Rodando em http://localhost:5173
```

### Popular dados de exemplo

```bash
cd api
npm run seed
```

---

## API

### Dispositivos

```bash
# Criar dispositivo
curl -X POST http://localhost:3001/devices \
  -H "Content-Type: application/json" \
  -d '{"id": "notebook-linux", "name": "Notebook Linux"}'

# Listar dispositivos
curl http://localhost:3001/devices
```

### Webhook — enviar evento de backup

O campo `api_key` é obrigatório em todas as requisições ao webhook. Requisições sem a key ou com key inválida recebem `401`.

```bash
# Backup bem-sucedido
curl -X POST http://localhost:3001/webhooks/sync \
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
curl -X POST http://localhost:3001/webhooks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "seu-segredo-aqui",
    "device_id": "notebook-linux",
    "source": "rsync",
    "task": "system-backup",
    "status": "error",
    "timestamp": "2026-05-07T04:15:00Z"
  }'

# Evento de celular via Android
curl -X POST http://localhost:3001/webhooks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "api_key": "seu-segredo-aqui",
    "device_id": "galaxy-s23",
    "source": "android",
    "task": "photos-backup",
    "status": "success",
    "timestamp": "2026-05-07T06:00:00Z"
  }'

# Evento com timestamp relativo (agora)
curl -X POST http://localhost:3001/webhooks/sync \
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

> O webhook cria automaticamente o device e a task caso ainda não existam.

### Tasks

```bash
# Listar tasks
curl http://localhost:3001/tasks

# Criar task com thresholds customizados
curl -X POST http://localhost:3001/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "notebook-linux",
    "task": "weekly-backup",
    "cron": "0 2 * * 0",
    "warning_hours": 168,
    "critical_hours": 336
  }'

# Atualizar thresholds de uma task
curl -X PATCH http://localhost:3001/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"warning_hours": 48, "critical_hours": 96}'

# Remover cron de uma task (setar null)
curl -X PATCH http://localhost:3001/tasks/<id> \
  -H "Content-Type: application/json" \
  -d '{"cron": null}'

# Deletar task
curl -X DELETE http://localhost:3001/tasks/<id>
```

### Eventos

```bash
# Todos os eventos
curl http://localhost:3001/events

# Filtrado por dispositivo
curl "http://localhost:3001/events?device_id=notebook-linux"
```

### Status

```bash
curl http://localhost:3001/status
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
├── api/
│   ├── src/
│   │   ├── server.ts
│   │   ├── types.ts
│   │   ├── db/database.ts       # inicialização do Firestore
│   │   ├── routes/
│   │   └── services/
│   ├── scripts/
│   │   ├── seed.ts              # popula dados de exemplo
│   │   └── clear-events.ts      # limpa a coleção de eventos
│   ├── .env                     # GOOGLE_APPLICATION_CREDENTIALS
│   └── backup-manager.json      # service account (gitignored)
└── frontend/
    └── src/
        ├── App.tsx
        ├── types.ts
        ├── components/
        ├── pages/
        ├── hooks/
        └── services/
```
