# MultiChart Pro

## A) Host on Cloudflare (website, no MT5)

1. Upload this whole folder to your Cloudflare Workers project (Git repo or `npx wrangler deploy`).
   The file `.assetsignore` (note the leading dot) keeps worker.js, schema.sql, START.bat etc. from being published.
2. On the hosted site forex/metals come from Yahoo via the Worker, crypto from the exchanges. MT5 symbols such as `MT5:EURUSD` automatically fall back to the free forex feed.

## B) Connect Supabase (login + cloud-saved charts)

1. Supabase > SQL Editor: paste `schema.sql` and Run (safe to re-run).
2. Supabase > Project Settings > API: copy the Project URL and the **publishable** key into `config.js`
   (already filled in; the publishable key is meant to be public).
3. Cloudflare > your Worker > Settings > Variables and Secrets: add a **Secret** named
   `SUPABASE_SERVICE_KEY` with your Supabase **secret** key (`sb_secret_...`). Never put it in config.js or git.
   (CLI alternative: `npx wrangler secret put SUPABASE_SERVICE_KEY`)
4. Supabase > Authentication > Sign In / Providers: Email enabled. Registration through the Worker auto-confirms
   the email; if the secret is missing the page falls back to normal Supabase sign-up (confirmation email).
5. Deploy again, open the site, Register, then Login. Charts, drawings and watchlists sync to your account.

## C) Run locally with MetaTrader 5 (Windows)

1. Open MetaTrader 5 and log in.
2. Double-click `START.bat` (installs Flask, flask-cors and MetaTrader5, starts the bridge + web server).
3. Open <http://127.0.0.1:8000/index.html>. On localhost there is a "Skip login" link under the login box.
   Bridge check: <http://127.0.0.1:5000/ping>, symbols: <http://127.0.0.1:5000/symbols?q=EUR>.
