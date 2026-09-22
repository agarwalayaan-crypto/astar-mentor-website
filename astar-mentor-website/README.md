# The A* Mentor — Hosted Website

A multi-page Year 13 study dashboard (AQA Biology, OCR A Maths, Edexcel Economics) with a real Claude-powered AI Tutor, homework tracking, retention analytics, and a Pomodoro timer.

## What's in here

```
astar-mentor-website/
  server.js            Express server: serves the site + POST /api/chat (calls real Claude)
  package.json
  .env.example          Copy to .env for local testing (never commit the real .env)
  render.yaml           Optional Render "Blueprint" — see hosting steps below
  public/
    index.html           Dashboard home
    briefing.html         Weekly Strategy Briefing
    homework.html         Free Periods & Homework
    afterschool.html      After School Zone
    weekend.html          Weekend Sprint Zone
    revision.html         Syllabus Checklist
    analytics.html        Coverage & confidence analytics
    pomodoro.html          Pomodoro timer
    tutor.html             AI Tutor chat page
    tutor-engine.js        Offline fallback tutor (works with zero setup, no API key)
    mentor-shared.js       Shared state model (localStorage) used by every page
    nav.js                 Shared sidebar navigation + theme toggle
    styles.css              Shared design system
```

All study data (homework, syllabus progress, retention timestamps, chat history) lives in **the visitor's own browser** via `localStorage` — there is no database and no accounts. The only thing the server does is relay AI Tutor chat requests to Claude, so your API key stays server-side.

---

## Run it locally first (optional but recommended)

1. Install [Node.js](https://nodejs.org) (LTS version) if you don't have it.
2. Open a terminal in this folder and run:
   ```
   npm install
   ```
3. Copy `.env.example` to `.env` and paste in a real API key from [console.anthropic.com](https://console.anthropic.com):
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Start it:
   ```
   npm start
   ```
5. Open `http://localhost:3000` in your browser.

If you skip the API key, everything still works — the AI Tutor page automatically falls back to its built-in offline engine.

---

## Hosting it on Render for free (Windows, step by step)

Render is a hosting platform with a free tier for small Node.js web services. You'll push this folder to GitHub, then connect Render to that GitHub repo.

### Step 1 — Install Git for Windows

Download and install from [git-scm.com](https://git-scm.com/download/win). Accept the default options during setup. Restart your terminal afterwards.

### Step 2 — Create a GitHub account and a new repository

1. Go to [github.com](https://github.com) and sign up if you don't have an account.
2. Click the **+** icon (top right) → **New repository**.
3. Name it something like `astar-mentor-website`. Leave it **Public** or **Private** — either works with Render's free tier. Don't tick "Add a README" (you already have one). Click **Create repository**.
4. GitHub shows you a page with commands — keep that page open, you'll need the URL under "…or push an existing repository from the command line" (it looks like `https://github.com/yourname/astar-mentor-website.git`).

### Step 3 — Push this folder to GitHub

Open a terminal (PowerShell) **inside this `astar-mentor-website` folder** and run these one at a time:

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/astar-mentor-website.git
git push -u origin main
```

Replace the URL in the `remote add` line with the one GitHub gave you. The first push will ask you to sign in to GitHub in your browser — follow the prompt.

> Your `.env` file is deliberately excluded by `.gitignore`, so your API key is never uploaded to GitHub. Good — keep it that way.

### Step 4 — Create the Render account and web service

1. Go to [render.com](https://render.com) and sign up (you can sign up directly with your GitHub account, which makes the next step easier).
2. From the Render dashboard, click **New +** → **Web Service**.
3. Connect your GitHub account if prompted, then select the `astar-mentor-website` repository you just pushed.
4. Fill in the settings:
   - **Name**: anything, e.g. `astar-mentor`
   - **Region**: closest to you
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: **Free**
5. Don't click "Create Web Service" yet — scroll down to **Environment Variables** first (next step).

### Step 5 — Set your API key on Render

Still on that same setup page (or afterwards under your service → **Environment** tab):

1. Click **Add Environment Variable**.
2. **Key**: `ANTHROPIC_API_KEY`
3. **Value**: paste your real key from [console.anthropic.com](https://console.anthropic.com) → **Settings → API Keys**.
4. Click **Create Web Service** (or **Save Changes** if you're editing an existing one).

Render will now run `npm install` then `npm start`. Watch the **Logs** tab — when it settles you should see:
```
The A* Mentor website is running on port 10000
ANTHROPIC_API_KEY detected — AI Tutor is live.
```

### Step 6 — Open your live site

Render gives you a URL like `https://astar-mentor.onrender.com`. Open it — that's your fully hosted, multi-page site with a real AI Tutor, reachable from any device, no local file needed.

### Notes on Render's free tier

- Free web services **spin down after 15 minutes of inactivity** and take ~30–50 seconds to wake up on the next visit. That's normal — just wait for the first load.
- Free tier has a monthly usage cap (750 hours), which is far more than one person needs for personal use.
- Every `git push` to `main` automatically redeploys the site (Render watches your GitHub repo).

### Updating the site later

Make your edits locally, then:
```
git add .
git commit -m "Describe your change"
git push
```
Render redeploys automatically within a minute or two.

---

## How the Claude integration works

- The frontend (`tutor.html`) never talks to Anthropic directly — it calls your own server at `/api/chat` (same origin, no CORS issues).
- `server.js` holds your `ANTHROPIC_API_KEY` as a server-side environment variable and uses the official `@anthropic-ai/sdk` to call `claude-opus-5`.
- Every request includes: a fixed system prompt (tutor persona + the three exact exam board specifications, cached server-side so repeated requests are cheaper), plus a live "student status" snippet built from the visitor's own dashboard data (anxiety ratings, high-priority topics, critical-decay topics, pending homework) so Claude can genuinely track trends.
- Image attachments are base64-encoded in the browser and sent as vision content blocks.
- When Claude sets homework, it wraps the tasks in a ` ```homework ` fenced block; the frontend detects that and shows an "Add to my Homework List" button that writes directly into the visitor's own `localStorage` state.
- If the server is unreachable, sleeping (free-tier cold start), or misconfigured, the AI Tutor page automatically and silently falls back to `tutor-engine.js` — a fully offline knowledge base covering all 26 syllabus topics, so the page never feels broken.

### Cost

Claude API usage is billed to your own Anthropic account (`console.anthropic.com` → Billing). Casual personal use (a handful of tutoring conversations a day) typically costs a small fraction of a dollar per day. There is no cost at all when the offline engine is used.
