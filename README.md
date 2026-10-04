# Coinleaf Valley

A cozy pixel village that grows when you save. Track your pay, bills, loans and buy-now-pay-later plans. Pip and the villagers give money tips, and a daily Valley Mail letter teaches earning and investing.

## What's here

| File | What it is |
| --- | --- |
| `index.html` | The whole app: village, tabs, check-up, Valley Mail |
| `manifest.webmanifest` | Lets phones install it to the home screen |
| `sw.js` | Offline support, so the village opens without a connection |
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

## How data is stored right now

On the website, each person's village is saved in their own browser (localStorage). It stays on that device only, and clearing browser data erases it. Use **My stuff → Copy backup** to keep a copy.

Pip's AI deep dive and chat only work inside the Claude artifact version for now. On the website those cards say the feature isn't available; the check-up, game plan and Valley Mail work fully.

## Roadmap

1. **Accounts and sync**: sign-in plus a private database (Supabase or Firebase) so data follows each person across devices.
2. **Pip's AI on the website**: a small server function that calls the Claude API with the app's own key (never in the browser), with per-user limits.
3. **Privacy and terms**: a privacy policy and terms of use; review Philippine Data Privacy Act duties before opening sign-ups. Keep advice educational.
4. **App stores**: wrap the site with Capacitor for Google Play and the App Store.
