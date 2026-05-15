# Setup Completato: Web Push Notifications

## 📋 Riepilogo Implementazione

Ho implementato il supporto per Web Push Notifications per gli utenti autenticati (butler/admin). Gli utenti riceveranno notifiche push quando viene creato un nuovo ordine.

### ✅ Componenti Implementati

#### 1. **Collections Payload**
- **PushSubscriptions** (`src/collections/PushSubscriptions.ts`): Memorizza le sottoscrizioni push degli utenti
  - Relazione con Users
  - Endpoint, auth, p256dh (VAPID keys)
  - Timestamp automatici

#### 2. **API Endpoints**
- **POST `/api/internal/notifications/subscribe`**: Registra una sottoscrizione push
- **POST `/api/internal/notifications/unsubscribe`**: Rimuove una sottoscrizione push
- **GET `/api/internal/user/me`**: Restituisce i dati dell'utente autenticato

#### 3. **Server-Side Utilities**
- **`src/lib/push.ts`**: Utility per inviare notifiche push
  - `sendPushNotification()`: Invia a un utente specifico
  - `sendPushNotificationToAllButlers()`: Invia a tutti i butler

#### 4. **Client-Side Utilities**
- **`src/lib/push-client.ts`**: Utility lato client per gestire push
  - `enablePushNotifications()`: Abilita le notifiche
  - `disablePushNotifications()`: Disabilita le notifiche
  - `isPushNotificationsSupported()`: Verifica supporto
  - `isPushNotificationsEnabled()`: Verifica stato

#### 5. **UI Components**
- **`PushNotificationToggle.tsx`**: Componente React per attivare/disattivare le notifiche nel dashboard
- Integrato nel dashboard con sezione "Impostazioni Notifiche"

#### 6. **Service Worker**
- **`public/service-worker.js`**: Aggiornato per gestire
  - `push` events: Riceve e visualizza le notifiche
  - `notificationclick` events: Naviga verso l'ordine

#### 7. **Hooks Payload**
- **Orders Collection**: Hook `afterChange` che invia notifiche a tutti i butler quando viene creato un nuovo ordine

### 📦 Dipendenze Aggiunte
- `web-push@3.6.7`: Libreria per inviare push notification
- `@types/web-push@3.6.4`: Type definitions

## 🚀 Prossimi Step - Configurazione

### 1. Genera le VAPID Keys
Esegui questo comando una sola volta:
```bash
npx web-push generate-vapid-keys
```

Leggi l'output:
```
Public Key: <YOUR_PUBLIC_KEY>
Private Key: <YOUR_PRIVATE_KEY>
```

### 2. Configura le Variabili d'Ambiente
Aggiungi al file `.env.local`:
```env
VAPID_PUBLIC_KEY=<YOUR_PUBLIC_KEY>
VAPID_PRIVATE_KEY=<YOUR_PRIVATE_KEY>
VAPID_SUBJECT=mailto:your-email@example.com
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<YOUR_PUBLIC_KEY>
```

**Note**:
- `VAPID_SUBJECT` dovrebbe essere un email valido o URL
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY` è esposta al client (pubblica)
- Mantieni `VAPID_PRIVATE_KEY` segreta!

### 3. Avvia il Server
```bash
pnpm dev
```

Al primo avvio, Payload creerà automaticamente:
- La tabella `push_subscriptions`
- Gli indici necessari
- Una migration nel folder `src/migrations`

### 4. Test di Funzionamento
1. Accedi a http://localhost:3000/dashboard
2. Vai alla sezione "Impostazioni Notifiche"
3. Attiva il toggle per le notifiche push
4. Autorizza le notifiche quando il browser lo chiede
5. Vai a http://localhost:3000/order e crea un nuovo ordine
6. Dovresti ricevere una notifica push!

## 📱 Flow Utente

```
1. Utente accede al dashboard
   ↓
2. Attiva le notifiche push (PushNotificationToggle)
   ↓
3. Browser richiede permesso per notifiche
   ↓
4. Service worker si registra
   ↓
5. Browser genera subscription push
   ↓
6. Subscription viene salvata nel database (PushSubscriptions)
   ↓
7. Quando nuovo ordine viene creato:
   - Hook Orders.afterChange esegue
   - sendPushNotificationToAllButlers() viene chiamata
   - Notifiche vengono inviate a tutti i butler tramite web-push
   ↓
8. Service worker riceve la notifica
   ↓
9. Notifica appare nel browser dell'utente
   ↓
10. Utente clicca sulla notifica
   ↓
11. Service worker naviga a /dashboard con orderId
```

## 🔧 Struttura File

```
src/
├── collections/
│   └── PushSubscriptions.ts          # Collection per sottoscrizioni
├── lib/
│   ├── push.ts                       # Server-side utilities
│   └── push-client.ts                # Client-side utilities
├── app/
│   ├── (frontend)/
│   │   ├── components/
│   │   │   └── PushNotificationToggle.tsx  # UI Toggle
│   │   └── dashboard/
│   │       └── page.tsx               # Dashboard con toggle integrato
│   └── api/
│       ├── internal/
│       │   ├── notifications/
│       │   │   ├── subscribe/route.ts     # POST subscribe endpoint
│       │   │   └── unsubscribe/route.ts   # POST unsubscribe endpoint
│       │   └── user/me/route.ts           # GET current user
├── collections/Orders.ts             # Hook afterChange per notifiche
└── payload.config.ts                 # Aggiunto PushSubscriptions
```

## 🛡️ Security Considerations

✅ **Implementato:**
- Solo utenti autenticati possono creare/leggere sottoscrizioni
- Verification di ownership: gli utenti possono solo eliminare le loro sottoscrizioni
- VAPID public key è esposta (corretto), private key è segreta
- Sottoscrizioni scadute vengono rimosse automaticamente

⚠️ **Da Considerare:**
- Monitora i log di errore per sottoscrizioni non valide
- Implementa rate limiting per prevenire spam notifiche
- Backup regolari del database per preservare le sottoscrizioni

## 📊 Database Schema

Tabella `push_subscriptions`:
```sql
CREATE TABLE push_subscriptions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  endpoint TEXT NOT NULL UNIQUE,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

## 🐛 Troubleshooting

### Le notifiche non arrivano?
1. Verifica che VAPID_PRIVATE_KEY sia configurato
2. Controlla i log del server per errori
3. Verifica che il Service Worker sia registrato (DevTools → Application → Service Workers)
4. Controlla che la sottoscrizione sia nel database (Payload CMS → Push Subscriptions)

### "Questo browser non supporta le notifiche"?
- Usa un browser moderno (Chrome 50+, Firefox 48+, Edge 17+)
- Assicurati di usare HTTPS in produzione (localhost funziona per dev)

### Sottoscrizioni non salvate?
- Verifica che l'utente sia autenticato (check i cookie di autenticazione)
- Controlla che `credentials: 'include'` sia impostato nei fetch

## 📚 Documentazione Completa

Leggi [PUSH_NOTIFICATIONS.md](./PUSH_NOTIFICATIONS.md) per:
- Guida di setup dettagliata
- API endpoints documentation
- Code examples
- Best practices per production
