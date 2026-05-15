# Web Push Notifications Setup Guide

## Overview

Questo progetto supporta le Web Push Notifications per gli utenti autenticati (butler e admin). Gli utenti riceveranno notifiche alla creazione di ogni nuovo ordine.

## Configuration

### 1. Generate VAPID Keys

Web Push utilizza VAPID (Voluntary Application Server Identification) keys per identificare il server. Genera le chiavi usando:

```bash
npx web-push generate-vapid-keys
```

Questo genererà output simile a:

```
Public Key: <YOUR_PUBLIC_KEY>
Private Key: <YOUR_PRIVATE_KEY>
```

### 2. Set Environment Variables

Aggiungi le seguenti variabili nel file `.env.local`:

```env
# Web Push Notification Keys
VAPID_PUBLIC_KEY=<YOUR_PUBLIC_KEY>
VAPID_PRIVATE_KEY=<YOUR_PRIVATE_KEY>
VAPID_SUBJECT=mailto:your-email@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<YOUR_PUBLIC_KEY>
```

**Importante**: `NEXT_PUBLIC_VAPID_PUBLIC_KEY` è esposta al client, quindi è pubblica. Solo la chiave privata deve rimanere segreta.

### 3. Database Migration

La collection `PushSubscriptions` memorizza le sottoscrizioni push degli utenti. 

Una migrazione sarà eseguita automaticamente all'avvio del server se non esiste già la tabella.

Se necessario, esegui la migrazione manualmente:

```bash
pnpm payload migrate
```

### 4. Service Worker

Il Service Worker è già configurato in `/public/service-worker.js` e:
- Riceve le notifiche push
- Mostra le notifiche all'utente
- Gestisce i click sulle notifiche per navigare verso l'ordine

## Features

### Per gli Utenti (Butler/Admin)

1. **Enable Notifications**: Nel dashboard, gli utenti possono attivare le notifiche push usando il toggle "Notifiche Push"
2. **Receive Notifications**: Riceveranno una notifica quando viene creato un nuovo ordine
3. **Click to Navigate**: Cliccando sulla notifica, verranno reindirizzati al dashboard con l'ordine identificato

### Server-Side

- Quando un nuovo ordine viene creato, il hook `afterChange` della collection `Orders` invia notifiche push a tutti i butler
- Le sottoscrizioni scadute/non valide vengono rimosse automaticamente

## API Endpoints

### POST `/api/internal/notifications/subscribe`

Registra una nuova sottoscrizione push per l'utente autenticato.

**Request Body**:
```json
{
  "subscription": {
    "endpoint": "https://...",
    "keys": {
      "auth": "...",
      "p256dh": "..."
    }
  }
}
```

**Response**: `201 Created`

### POST `/api/internal/notifications/unsubscribe`

Rimuove una sottoscrizione push.

**Request Body**:
```json
{
  "endpoint": "https://..."
}
```

**Response**: `200 OK`

### GET `/api/internal/user/me`

Restituisce i dati dell'utente autenticato.

**Response**: 
```json
{
  "id": "user_id",
  "email": "user@example.com",
  "role": "butler"
}
```

## Client-Side Integration

### Enable Push Notifications

```typescript
import { enablePushNotifications } from '@/lib/push-client'

await enablePushNotifications(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!)
```

### Disable Push Notifications

```typescript
import { disablePushNotifications } from '@/lib/push-client'

await disablePushNotifications()
```

### Check Support

```typescript
import { isPushNotificationsSupported, isPushNotificationsEnabled } from '@/lib/push-client'

const supported = await isPushNotificationsSupported()
const enabled = await isPushNotificationsEnabled()
```

## Browser Compatibility

Web Push Notifications sono supportate in:
- Chrome/Chromium (68+)
- Firefox (48+)
- Edge (17+)
- Opera (55+)

Safari ha un supporto limitato (solo macOS 13.1+).

## Testing

### Manual Testing

1. Accedi al dashboard come butler
2. Attiva le notifiche push usando il toggle
3. Concedi i permessi quando il browser lo chiede
4. Crea un nuovo ordine dalla pagina `/order`
5. Dovresti ricevere una notifica push

### Inspect Subscriptions

Nel Payload CMS admin panel, accedi a "Push Subscriptions" per visualizzare tutte le sottoscrizioni registrate.

## Troubleshooting

### "Le notifiche push non sono supportate dal tuo browser"
- Usa un browser moderno che supporta Service Workers e Push API
- Assicurati di usare HTTPS (o localhost per sviluppo)

### "Permesso per le notifiche non concesso"
- Controlla le impostazioni delle notifiche del browser
- Potrebbe essere necessario fare un refresh della pagina dopo aver concesso il permesso

### Notifiche non ricevute
1. Verifica che il Service Worker sia registrato:
   - DevTools → Application → Service Workers
2. Controlla che la sottoscrizione sia registrata:
   - Payload CMS admin → Push Subscriptions
3. Verifica i log del server per errori
4. Assicurati che VAPID_PRIVATE_KEY sia configurato

### Errore: "VAPID keys not configured"
- Assicurati che `VAPID_PRIVATE_KEY` sia configurato in `.env.local`

## Production Considerations

1. **Backups**: Esegui regolarmente il backup del database per preservare le sottoscrizioni push
2. **Cleanup**: Le sottoscrizioni scadute vengono rimosse automaticamente quando fallisce l'invio
3. **Rate Limiting**: Considera di limitare il numero di notifiche inviate per prevenire spam
4. **Monitoring**: Monitora gli errori di invio delle notifiche nei log del server

## Additional Resources

- [MDN: Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- [Web Push Protocol (RFC 8030)](https://datatracker.ietf.org/doc/html/draft-thomson-webpush-protocol)
- [web-push Library](https://github.com/web-push-libs/web-push)
