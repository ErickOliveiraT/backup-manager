# Backup Manager — Frontend

Dashboard web para monitoramento de backups.

## Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS v4 (via `@tailwindcss/vite`, sem arquivo de config)
- React Router v7

## Estrutura

```
frontend/
├── src/
│   ├── components/        # StatusCard, StatCard, BarChart, DonutChart, modais, skeletons
│   ├── context/
│   │   └── LastUpdatedContext.tsx  # estado global de refresh
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── DevicesPage.tsx
│   │   ├── TasksPage.tsx
│   │   ├── EventsPage.tsx
│   │   ├── SettingsPage.tsx
│   │   └── LoginPage.tsx
│   ├── hooks/
│   │   └── usePolling.ts  # auto-refresh das páginas
│   ├── services/
│   │   ├── api.ts         # todas as chamadas HTTP (BASE_URL via VITE_API_BASE_URL)
│   │   └── auth.ts        # token no localStorage
│   └── types.ts
├── .env                   # VITE_API_BASE_URL produção (gitignored)
├── .env.local             # VITE_API_BASE_URL dev local (gitignored)
└── .env.example           # template com URL do emulador
```

## Comandos

```bash
npm run dev     # Vite dev server em :5173
npm run build   # tsc + vite build
npm run lint    # eslint
npm run deploy  # build + firebase deploy --only hosting
```

## Configuração

O frontend lê `VITE_API_BASE_URL` para localizar a API.

```bash
# dev local (aponta para o emulador Firebase Functions)
cp .env.example .env.local

# produção (.env já está configurado com a URL das Cloud Functions)
```

## Páginas

| Página | Rota | Descrição |
|---|---|---|
| Dashboard | `/` | Visão geral com cards de status, gráficos e eventos recentes |
| Devices | `/devices` | CRUD de dispositivos com paginação |
| Tasks | `/tasks` | CRUD de tasks com configuração de thresholds e cron |
| Events | `/events` | Log de eventos com filtros por dispositivo, status e data |
| Settings | `/settings` | API key, senha e preferência de notificações push |
