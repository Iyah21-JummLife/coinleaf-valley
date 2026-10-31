# Coinleaf Valley

A cozy pixel village that grows when you save. Track your pay, bills, loans and buy-now-pay-later plans. Pip and the villagers give money tips, and a daily Valley Mail letter teaches earning and investing.

## What's here

| File | What it is |
| --- | --- |
| `index.html` | The whole app: village, tabs, check-up, Valley Mail |
| `manifest.webmanifest` | Lets phones install it to the home screen |
| `sw.js` | Offline support, so the village opens without a connection |
| `config.js` | Supabase settings for sign-in and sync (empty = this device only) |
| `cloud.js` | Sign-in and cloud saving for the website version |
| `supabase/schema.sql` | Database table and privacy rules to run once in Supabase |
| `vendor/supabase.js` | Supabase client library (v2.117.3, MIT, see `vendor/supabase-LICENSE`) |
| `icons/` | App icons (Pip) |

There is no build step. Any static host can serve this folder as is.

## Try it locally

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Put it online

Pick one (all have free tiers):

- **Vercel**: vercel.com → Add New → Project → import this repository → Deploy.
- **Netlify**: app.netlify.com → Add new site → Import an existing project → pick this repository → Deploy.
- **Cloudflare Pages**: dash.cloudflare.com → Workers & Pages → Create → Pages → connect this repository.

Leave the build command empty and the output folder as the root. Every push to `main` redeploys.

## Install on a phone

Open the site, then:

- **Android (Chrome)**: menu → Add to Home screen or Install app.
- **iPhone (Safari)**: Share → Add to Home Screen.

## How data is stored

`index.html` is the same app as the Claude artifact. Inside Claude it saves through Claude's own storage. On the website, `cloud.js` provides the same storage on top of Supabase:

- **Signed out** (or `config.js` left empty): the village saves in that browser only. **My stuff → Copy backup** keeps a copy.
- **Signed in**: each village saves to the person's account and syncs across devices. The first sign-in moves the village on that device into the account. Signing out removes it from the device; it stays in the account.

Sign-in is passwordless: people get a 6-digit code by email (the link in the email works too).

Pip's AI deep dive and chat only work inside the Claude version for now. On the website those cards say the feature isn't available; the check-up, game plan and Valley Mail work fully.

## Set up sign-in (Supabase)

1. Create a free project at [supabase.com](https://supabase.com) (region: Southeast Asia).
2. **SQL Editor → New query**: paste `supabase/schema.sql` and run it.
3. **Authentication → Email Templates → Magic Link**: make the email show the code, for example:
   ```html
   <h2>Your Coinleaf Valley sign-in code</h2>
   <p>Type this code in the app: <b>{{ .Token }}</b></p>
   <p>Or <a href="{{ .ConfirmationURL }}">tap here to sign in</a> on this device.</p>
   ```
4. **Authentication → URL Configuration**: set **Site URL** to the website address (for example `https://coinleaf-valley.vercel.app`) and add it under **Redirect URLs**.
5. **Project Settings → API**: copy the **Project URL** and the **anon / publishable** key into `config.js`. Never put the `service_role` or secret key in this repository.

Supabase's built-in email sender only allows a few emails an hour. Before opening sign-ups to the public, add your own email provider under **Authentication → SMTP Settings**.

## Roadmap

1. **Accounts and sync**: done (Supabase, see above).
2. **Pip's AI on the website**: a small server function that calls the Claude API with the app's own key (never in the browser), with per-user limits.
3. **Privacy and terms**: a privacy policy and terms of use; review Philippine Data Privacy Act duties before opening sign-ups. Keep advice educational.
4. **App stores**: wrap the site with Capacitor for Google Play and the App Store.
