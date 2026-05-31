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
│   ├── components/    # componentes reutilizáveis
│   ├── pages/         # Dashboard, DevicesPage, TasksPage
│   ├── hooks/         # usePolling — auto-refresh das páginas
│   ├── services/
│   │   └── api.ts     # todas as chamadas HTTP (BASE_URL hardcoded :3001)
│   └── types.ts
├── .env               # VITE_API_BASE_URL produção (gitignored)
├── .env.local         # VITE_API_BASE_URL dev local (gitignored)
└── .env.example       # template com URL do emulador
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
