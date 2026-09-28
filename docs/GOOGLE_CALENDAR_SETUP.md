# Configurazione Google Calendar

Il sito usa Google Calendar in sola lettura per mostrare separatamente le date occupate di Appartamento Ulivo e Appartamento Saline. Una richiesta FreeBusy interroga entrambi i calendari senza leggere o esporre titoli e descrizioni degli eventi.

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
   | `GOOGLE_CALENDAR_ID_ULIVO` | ID calendario dedicato ad Appartamento Ulivo | Variable |
   | `GOOGLE_CALENDAR_ID_SALINE` | ID calendario dedicato ad Appartamento Saline | Variable |
   | `WEB3FORMS_ACCESS_KEY` | Access key Web3Forms ruotata dopo averla rimossa dal codice pubblico | Secret |

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

OAuth security requirements:

- The Worker creates a one-time OAuth `state` value and stores it in KV for ten minutes.
- The callback stores tokens in the private `TOKENS` KV namespace and never renders or logs them.
- Each apartment has its own calendar ID; the public API returns only the two sets of occupied local dates.
- The public contact form sends submissions to the Worker proxy, never directly to Web3Forms.
- CORS is restricted to the production site and local development origins.

## Calendari per appartamento

1. Crea o individua un calendario Google distinto per ciascun alloggio.
2. Condividi entrambi con l'account Google autorizzato per questa integrazione, almeno in sola lettura.
3. Copia l'ID del calendario Ulivo in `GOOGLE_CALENDAR_ID_ULIVO` e quello Saline in `GOOGLE_CALENDAR_ID_SALINE`.
4. Configura entrambi come variabili runtime del Worker production e, per i test, in `.env` locale. I due ID devono essere distinti.
5. Le prenotazioni vanno inserite nel calendario corretto. L'API `freeBusy.query` restituisce entrambe le disponibilità in una sola chiamata.

### Modalità condivisa temporanea

Se per un breve periodo hai un solo ID calendario, configura lo stesso ID per Ulivo e Saline e abilita il secret Worker `ALLOW_SHARED_APARTMENT_CALENDAR=true`. L'interfaccia avviserà che i due alloggi mostrano le stesse date e il Worker interrogherà quell'ID una volta sola. Per tornare alla modalità corretta, imposta due ID distinti e rimuovi il flag:

```bash
npx wrangler secret delete ALLOW_SHARED_APARTMENT_CALENDAR --env production
```

Non lasciare la modalità condivisa quando i calendari separati sono pronti: non distingue le prenotazioni tra alloggi.

## Riautorizzare OAuth (`invalid_grant`)

Se `/api/availability` restituisce `Failed to fetch availability` e nei log Worker appare `invalid_grant`, autorizza nuovamente l'account Google che ha accesso ai calendari:

1. Apri `https://lapapessavacanze.com/auth/google`.
2. Accedi con l'account proprietario/condiviso dei calendari e approva l'accesso in sola lettura.
3. Il callback salva i nuovi token nel KV privato `TOKENS`; il Worker usa questi token aggiornati prima di quelli legacy presenti come variabili d'ambiente.
4. Ricarica la pagina disponibilit&agrave; e verifica che `/api/availability` risponda con `availabilityByApartment`.

Non copiare o inviare access token e refresh token in chat, HTML o file versionati.

Per i calendari nel progetto locale, aggiungi i due valori al file `.env` non versionato. Per production, aggiungili da Cloudflare Dashboard > Worker `my-store` > Settings > Variables and Secrets. Il Worker usa fallback prudenziale e rende le date non selezionabili quando i calendari non sono configurati o non rispondono.

## Limiti di traffico e spesa

Il Worker applica 60 richieste API per IP al minuto, 3 invii contatto per IP al minuto e un limiter outbound di 6 chiamate al minuto per chiave. Google Availability e i feed RSS sono serviti da cache edge; una sola chiamata Google copre i due alloggi. Questi limiter Cloudflare sono volutamente rapidi e distribuiti per data center: non sono un contatore contabile globale e possono superare il limite durante traffico simultaneo distribuito.

Per il tetto effettivo alla spesa Google, apri Google Cloud Console > APIs & Services > Google Calendar API > Quotas e imposta un limite giornaliero basso e adatto al traffico previsto (per esempio 1.000 richieste/giorno). Verifica che sia applicato al progetto OAuth usato dal Worker. Google indica che l'uso standard non ha costo aggiuntivo entro la soglia giornaliera documentata; una quota esplicita ridotta protegge anche dal traffico anomalo.

Il piano Workers Free di Cloudflare ha un limite di 100.000 richieste Worker al giorno. Se l'account usa un piano a consumo, imposta anche i limiti di spesa dal pannello Billing Cloudflare: il codice non pu&ograve; imporre un tetto di fatturazione globale. I Rate Limiting bindings Cloudflare sono locali al data center e approssimativi, quindi non garantiscono da soli un massimo globale di richieste.

Imposta inoltre un budget/avviso e il limite di invii previsto dal piano Web3Forms. La chiave precedentemente inclusa nel markup pubblico va ruotata e salvata come secret `WEB3FORMS_ACCESS_KEY`; il form resta disabilitato sul Worker finch&eacute; il secret non &egrave; configurato. Per production:

```bash
npx wrangler secret put WEB3FORMS_ACCESS_KEY --env production
```

Per il test locale aggiungi `WEB3FORMS_ACCESS_KEY=...` al `.env` ignorato da Git. Il limite Cloudflare protegge gli invii ordinari; il limite assoluto di costo per Web3Forms dipende dai limiti configurabili sul relativo account.

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

### Credential exposure or local Wrangler token exposure

If a client secret, access token, refresh token, or Wrangler OAuth token was ever copied into git, terminal logs, screenshots, or shared files, treat it as compromised. Revoke it in Google Cloud or Cloudflare, then issue a replacement. Deleting the text alone does not invalidate provider credentials.

```bash
npx wrangler logout
npx wrangler login
npx wrangler secret put GOOGLE_CLIENT_SECRET --env production
npx wrangler secret put GOOGLE_CLIENT_ID --env production
npx wrangler secret put GOOGLE_REDIRECT_URL --env production
```

### Errore sulle variabili mancanti

Le variabili devono essere configurate nel Worker `my-store/production`, non nel progetto Pages, in `my-store-production` o soltanto nel file `.env` locale.

## ID del calendario

Configura due calendari distinti con una variabile ciascuno:

```text
GOOGLE_CALENDAR_ID_ULIVO=calendar-id-ulivo
GOOGLE_CALENDAR_ID_SALINE=calendar-id-saline
WEB3FORMS_ACCESS_KEY=rotated-web3forms-key
```

Apri Google Calendar > menu del calendario > **Impostazioni e condivisione** > **Integra calendario** e copia l'**ID calendario** di ciascun alloggio. Condividi i due calendari con l'account autorizzato dall'OAuth del Worker. Non riutilizzare lo stesso ID: il Worker rifiuta ID uguali.

## Sicurezza

- Non committare `.env`.
- Non condividere Client secret, access token o refresh token.
- Se una credenziale viene esposta, revocala e sostituiscila.
- Mantieni autorizzati solo gli URI di redirect realmente utilizzati.
