# Pitchline

Static European football betting tips site — Premier League, La Liga, Serie A, Bundesliga, Ligue 1, and Champions League.

## Local

```bash
cd ~/Developer/pitchline
python3 -m http.server 5173
```

Open [http://localhost:5173](http://localhost:5173).

## Deploy on Render

1. Push this folder to a Git repo.
2. In Render: **New → Static Site**.
3. Connect the repo. Publish directory: `.` — build command can be empty or `true`.
4. Or use Blueprint: Render will read `render.yaml`.

Tips live in `data/tips.json` — edit that file to update content (no build step).

## Pages

| Path | Purpose |
|------|---------|
| `/` | Home + featured tip |
| `/tips.html` | All tips + league filters |
| `/tip.html?id=pl-001` | Tip detail |
| `/about.html` | Method + responsible gambling |
