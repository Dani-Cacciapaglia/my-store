# Configurazione Google Calendar

Il sito usa Google Calendar in sola lettura per mostrare le date non disponibili.

## Valori production

L'URI OAuth production deve essere identico in Google Cloud e Cloudflare:

```text
https://lapapessavacanze.com/auth/google/callback
```

Non usare `http`, non aggiungere una barra finale e non usare il redirect locale in production.

## 1. Abilitare Google Calendar API

1. Apri [Google Cloud Console](https://console.cloud.google.com/).
2. Seleziona il progetto nel quale creerai il client OAuth, oppure creane uno nuovo.
3. Vai in **APIs & Services** > **Library**.
4. Cerca **Google Calendar API** e clicca **Enable**.

## 2. Configurare il consenso OAuth

1. Vai in **Google Auth Platform** > **Audience**. Nelle interfacce precedenti la voce e' **APIs & Services** > **OAuth consent screen**.
2. Scegli **External** se richiesto.
3. Inserisci nome applicazione, email di supporto e contatto sviluppatore.
4. In **Test users**, aggiungi:

   ```text
   cacciapagliadaniele8@gmail.com
   ```

5. Salva.

Durante la fase **Testing** solo gli utenti presenti in **Test users** possono autorizzare l'applicazione.

## 3. Creare il client OAuth Web

Non creare un service account: il progetto usa OAuth con dati utente.

1. Vai in **Google Auth Platform** > **Clients**, oppure in **APIs & Services** > **Credentials**.
2. Clicca **Create client** o **Create credentials** > **OAuth client ID**.
3. Seleziona **Web application**.
4. In **Authorized redirect URIs** aggiungi:

   ```text
   https://lapapessavacanze.com/auth/google/callback
   ```

5. Se devi testare anche in locale, aggiungi separatamente:

   ```text
   http://localhost:8787/auth/google/callback
   ```

6. Crea il client e conserva **Client ID** e **Client secret**.

Client ID e Client secret devono appartenere allo stesso client Web. Non inserirli nel repository o nel codice del browser.

## 4. Configurare il Worker Cloudflare

Il repository usa Pages per i file statici e il Worker `my-store` per `/auth/*` e `/api/*`.

Nella Dashboard Cloudflare apri il servizio il cui URL termina con:

```text
/workers/services/view/my-store/production
```

Non usare `my-store-production`, che e' un servizio diverso.

1. Vai in **Workers & Pages** > **Workers**.
2. Apri `my-store` nell'ambiente `/production`.
3. Vai in **Settings**.
4. In **Runtime variables and secrets**, clicca **Configure API tokens and other runtime variables**.
5. Aggiungi:

   | Nome | Valore | Tipo |
   | --- | --- | --- |
   | `GOOGLE_CLIENT_ID` | Client ID del client Web Google | Variable |
   | `GOOGLE_CLIENT_SECRET` | Client secret dello stesso client | Secret |
   | `GOOGLE_REDIRECT_URL` | `https://lapapessavacanze.com/auth/google/callback` | Variable |
   | `GOOGLE_CALENDAR_ID` | `primary` o l'ID del calendario | Variable |

6. Salva le variabili.

Il file `.env` locale non configura automaticamente Cloudflare.

### Configurazione con Wrangler

Dalla cartella del progetto puoi salvare i tre secret. I valori vengono richiesti senza essere inseriti nel comando:

```bash
npx wrangler secret put GOOGLE_CLIENT_ID --env production
npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
npx wrangler secret put GOOGLE_REDIRECT_URL --env production
```

Quando richiesto, inserisci:

```text
https://lapapessavacanze.com/auth/google/callback
```

## 5. Deploy

Per i file statici:

```bash
npm run pages:deploy
```

Per creare o aggiornare il Worker OAuth:

```bash
npm run deploy:worker
```

Per eseguire entrambi:

```bash
npm run deploy:all
```

## 6. Verifica

Controlla l'account Cloudflare autenticato:

```bash
npx wrangler whoami
```

Controlla che i secret production esistano. Il comando mostra solo nomi e tipi:

```bash
npx wrangler secret list --env production
```

Devono comparire almeno:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_REDIRECT_URL
```

Verifica il redirect pubblico:

```bash
curl -sS -D - -o /dev/null https://lapapessavacanze.com/auth/google
```

La risposta deve essere `302`. Nell'header `location` controlla che `client_id` sia quello esistente in Google Cloud e che `redirect_uri` sia:

```text
https://lapapessavacanze.com/auth/google/callback
```

Poi apri in Firefox una finestra anonima, accedi con `cacciapagliadaniele8@gmail.com` e visita:

```text
https://lapapessavacanze.com/auth/google
```

Accetta il permesso di lettura. Il Worker salvera' i token nel namespace KV `TOKENS`.

## Problemi comuni

### Accesso bloccato, errore 401, `GeneralOAuthFlow`

Controlla che l'account usato sia presente in **Test users** e che il progetto OAuth sia quello corretto. Se Firefox seleziona un account diverso, usa una finestra anonima e accedi solo con l'account autorizzato.

### `The OAuth client was not found` o `invalid_client`

Il Worker sta usando un Client ID inesistente, eliminato o diverso da quello configurato. Verifica che il Client ID esista in Google Cloud, che il client sia di tipo **Web application**, che il secret appartenga allo stesso client e che il redirect URI coincida in Google Cloud e Cloudflare.

Dopo ogni modifica esegui:

```bash
npm run deploy:worker
```

### Errore sulle variabili mancanti

Le variabili devono essere configurate nel Worker `my-store/production`, non nel progetto Pages, in `my-store-production` o soltanto nel file `.env` locale.

## ID del calendario

Per il calendario principale usa:

```text
GOOGLE_CALENDAR_ID=primary
```

Per un calendario diverso, apri Google Calendar > menu del calendario > **Impostazioni e condivisione** > **Integra calendario** e copia l'**ID calendario**.

## Sicurezza

- Non committare `.env`.
- Non condividere Client secret, access token o refresh token.
- Se una credenziale viene esposta, revocala e sostituiscila.
- Mantieni autorizzati solo gli URI di redirect realmente utilizzati.
