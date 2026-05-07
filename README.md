# Backup Manager

Sistema de monitoramento de backups que recebe eventos via webhook e exibe o estado de saúde em um dashboard web.

## Stack

- **Backend**: Node.js + Express + TypeScript + lowdb
- **Frontend**: React + Vite + TypeScript + Tailwind CSS v4

## Setup

### Backend

```bash
cd backend
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

---

## API

### Criar dispositivo

```bash
curl -X POST http://localhost:3001/devices \
  -H "Content-Type: application/json" \
  -d '{"id":"notebook-linux-1","name":"Notebook Linux"}'
```

### Enviar evento de backup (webhook)

```bash
curl -X POST http://localhost:3001/webhooks/sync \
  -H "Content-Type: application/json" \
  -d '{
    "device_id": "notebook-linux-1",
    "source": "opensync",
    "task": "daily-documents-backup",
    "status": "success",
    "timestamp": "2026-05-06T12:00:00Z"
  }'
```

### Consultar status

```bash
curl http://localhost:3001/status
```

### Listar eventos

```bash
# Todos os eventos
curl http://localhost:3001/events

# Filtrado por dispositivo
curl http://localhost:3001/events?device_id=notebook-linux-1
```

---

## Lógica de status

Para cada combinação **device + task**:

| Condição | Status |
|---|---|
| Último `success` há menos de 24h | Healthy |
| Último `success` há mais de 24h | Warning |
| Último `success` há mais de 72h | Critical |
| Último evento é `error` | Critical |

---

## Estrutura

```
backup-manager/
├── backend/
│   └── src/
│       ├── server.ts
│       ├── types.ts
│       ├── db/database.ts
│       ├── routes/
│       └── services/
└── frontend/
    └── src/
        ├── App.tsx
        ├── types.ts
        ├── components/
        ├── pages/
        ├── hooks/
        └── services/
```
