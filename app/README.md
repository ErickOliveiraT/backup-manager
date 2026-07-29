# Backup Manager — App

App Android para monitoramento de backups, espelhando as funcionalidades do dashboard web.

## Stack

- Expo SDK 56 / React Native 0.85
- Expo Router (navegação file-based)
- Expo Secure Store (armazenamento do token JWT)
- Expo Notifications (push notifications via FCM)
- Lucide React Native (ícones)
- TypeScript

## Estrutura

```
app/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx    # navegação por abas (5 abas)
│   │   ├── index.tsx      # Dashboard
│   │   ├── devices.tsx    # Devices
│   │   ├── tasks.tsx      # Tasks
│   │   ├── events.tsx     # Events
│   │   └── settings.tsx   # Settings
│   ├── _layout.tsx        # auth guard + registro de push token
│   └── login.tsx
├── src/
│   ├── components/        # DonutChart, StatCard, StatusBadge, Skeleton
│   ├── services/
│   │   ├── api.ts         # cliente HTTP (BASE_URL via EXPO_PUBLIC_API_BASE_URL)
│   │   └── auth.ts        # token no Secure Store
│   ├── theme.ts           # paleta de cores
│   └── types.ts
├── app.config.js          # config dinâmica — lê GOOGLE_SERVICES_JSON do EAS
├── app.json               # config estática do Expo
└── eas.json               # perfis de build (development, preview)
```

## Comandos

```bash
npm install
npm start              # Expo dev server
npm run apk            # build APK via EAS (perfil preview)
```

## Variáveis de ambiente

| Variável | Descrição | Default |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | URL base da API | `https://us-central1-backup-manager-2ae79.cloudfunctions.net` |

Crie um arquivo `.env.local` para apontar para o emulador em dev:

```
EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:5001/backup-manager-2ae79/us-central1
```

## Builds

### APK (preview)

```bash
npm run apk
# equivale a: eas build --profile preview --platform android
```

### Dev client

O dev client inclui os native modules (necessário para push notifications). Deve ser recriado sempre que um módulo nativo for adicionado via `expo install`.

```bash
eas build --profile development --platform android
```

Após instalar o APK do dev client no dispositivo:

```bash
npm start   # conecta via QR code ou IP
```

## Push Notifications (FCM)

O `google-services.json` é necessário para o FCM funcionar e está no `.gitignore`. Para builds via EAS, o arquivo é armazenado como secret.

### Setup inicial (uma vez por ambiente)

```bash
# Baixar em Firebase Console → Project Settings → Your apps → Android
# Salvar como app/google-services.json, depois:

eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment development
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment preview
eas env:create --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json --visibility secret --environment production
```

O `app.config.js` lê `process.env.GOOGLE_SERVICES_JSON` durante o build EAS e cai de volta para `./google-services.json` em builds locais (`npx expo run:android`).

### Fluxo de registro

1. No primeiro acesso autenticado, o app solicita permissão de notificações
2. Se concedida, obtém o token FCM nativo via `getDevicePushTokenAsync()`
3. Envia o token para o backend (`POST /users/me/fcm-token`)
4. A partir daí, o cron diário das 20h BRT entrega notificações por task

### Preferência de notificações

Configurável na tela Settings:

| Opção | Comportamento |
|---|---|
| Disabled | Nenhuma notificação |
| Critical & Warning | Notifica tasks em warning e critical |
| Critical only | Notifica apenas tasks em critical |

### Mute por dispositivo

Na tela Devices, cada dispositivo tem um botão de sino para ativar/desativar notificações individualmente (`notifications_enabled`, padrão ligado). Dispositivos mutados são ignorados pelo cron diário mesmo com a preferência do usuário ativa.
