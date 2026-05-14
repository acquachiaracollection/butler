# Butler - Acqua Chiara

Applicazione Next.js + Payload CMS per la gestione operativa del ristoro degli ospiti:

- kiosk ordini lato cliente
- dashboard staff protetta
- gestione ordini con stati e staff notes
- gestione inventario prodotti con immagini, ricerca e paginazione

## Stack

- Next.js 16
- Payload CMS 3
- Database Postgres (adapter Payload Postgres)
- UI React 19

## Funzionalita principali

### Frontend pubblico

- Pagina ordini su /order
- Visualizzazione prodotti disponibili
- Invio ordine con note ordine e note per singolo articolo

### Area staff (protetta)

- Login su /login
- Redirect automatico a /dashboard dopo login riuscito
- Dashboard su /dashboard con accesso rapido a:
  - /manage
  - /inventory

### Gestione ordini

- Visualizzazione ordini con stato (in attesa, in preparazione, completato, annullato)
- Cambio stato ordine dal frontend manage
- Campo staff notes in collection orders e in UI manage
- Paginazione ordini

### Gestione inventario

- CRUD prodotti (nome, prezzo, categoria, disponibilita, descrizione, immagine)
- Upload immagine su media
- Ricerca prodotti (nome, descrizione, categoria)
- Paginazione prodotti

## Collections Payload

- users
- media
- menu-categories
- menu-items
- orders

Il campo staff notes e presente nella collection orders come staffNotes.

## Setup locale

1. Copia variabili ambiente

   cp .env.example .env

2. Configura almeno queste variabili in .env

- DATABASE_URL
- PAYLOAD_SECRET

Facoltative per email SMTP:

- SMTP_HOST
- SMTP_PORT
- SMTP_USER
- SMTP_PASS
- SMTP_FROM_ADDRESS
- SMTP_FROM_NAME

Nota: la configurazione corrente usa Postgres. Imposta DATABASE_URL in formato Postgres, ad esempio:

postgres://user:password@localhost:5432/butler

3. Installa dipendenze

   pnpm install

4. Avvia in sviluppo

   pnpm dev

5. Apri

http://localhost:3000

## Script utili

- pnpm dev
- pnpm build
- pnpm start
- pnpm generate:types
- pnpm generate:importmap
- pnpm test
- pnpm test:int
- pnpm test:e2e

## Testing

- Test integrazione in tests/int
- Test end-to-end in tests/e2e

## Note operative

- Se modifichi le collections Payload, rigenera i tipi con:

  pnpm payload generate:types

- Le pagine staff richiedono autenticazione; in caso contrario redirect su /login.
