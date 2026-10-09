# Pitchline

European football betting tips with a **weekly access code**. Home and About are public; tip data and tip pages require the code.

## Local

```bash
cd ~/Developer/pitchline
npm install
ACCESS_CODE=dev-week-code SESSION_SECRET=dev-secret npm start
```

Open [http://localhost:5173](http://localhost:5173). Unlock with `dev-week-code`.

## Deploy on Render (Web Service)

Create a **Web Service** (not Static Site) from this repo:

| Setting | Value |
|---------|--------|
| Runtime | Node |
| Build Command | `npm install` |
| Start Command | `node server.js` |

**Environment variables**

| Key | Value |
|-----|--------|
| `ACCESS_CODE` | Weekly code you send to members (e.g. `PITCH-WEEK-41`) |
| `SESSION_SECRET` | Long random string (Render can generate) |
| `NODE_ENV` | `production` |

If you already have a Static Site named `pitchline`, create a new **Web Service** and delete/suspend the static one.

### Rotate the weekly code

1. Render → pitchline Web Service → **Environment**
2. Change `ACCESS_CODE`
3. Save (service restarts)
4. Send the new code to members — old sessions stop working

## Pages

| Path | Access |
|------|--------|
| `/` | Public (tips sections locked until unlock) |
| `/about.html` | Public |
| `/unlock.html` | Public — enter weekly code |
| `/tips.html` | Code required |
| `/tip.html?id=…` | Code required |
| `/api/tips` | Code required (JSON never public) |

Tips content: `data/tips.json` (served only via authenticated API).
