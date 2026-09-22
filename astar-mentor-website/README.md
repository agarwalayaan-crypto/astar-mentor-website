# The A* Mentor. Hosted Website

A multi-page Year 13 study dashboard covering the complete two-year specification for AQA Biology, OCR A Mathematics and Edexcel Economics, with a real Claude-powered AI Tutor, time-aware homework tracking, dedicated After School timers, and a spaced-repetition flashcard tool.

## What's in here

```
astar-mentor-website/
  server.js            Express server: serves the site and POST /api/chat (calls real Claude)
  package.json
  .env.example          Copy to .env for local testing (never commit the real .env)
  render.yaml           Optional Render "Blueprint", see hosting steps below
  public/
    index.html           Dashboard home
    briefing.html         Weekly Strategy Briefing, with the priority ranking algorithm
    homework.html         Free Periods & Homework, with time-budget planning
    afterschool.html      After School Zone, with its own Blurting and Weak Spot timers
    weekend.html          Weekend Sprint Zone
    revision.html         Complete syllabus checklist, tabbed by subject and year
    flashcards.html       Spaced-repetition flashcard tool
    analytics.html        Coverage & confidence analytics
    tutor.html             AI Tutor chat page
    tutor-engine.js        Offline fallback tutor, works with zero setup, no API key
    mentor-shared.js       Shared state model (localStorage) and the full specifications
    nav.js                 Shared sidebar navigation and theme toggle
    styles.css              Shared design system
```

All study data (homework, syllabus progress, retention timestamps, chat history) lives in the visitor's own browser via `localStorage`. There is no database and no accounts. The only thing the server does is relay AI Tutor chat requests to Claude, so your API key stays server-side.

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

If you skip the API key, everything still works. The AI Tutor page automatically falls back to its built-in offline engine.

---

## Hosting it on Render for free (Windows, step by step)

Render is a hosting platform with a free tier for small Node.js web services. You push this folder to GitHub, then connect Render to that GitHub repo.

### Step 1. Install Git for Windows

Download and install from [git-scm.com](https://git-scm.com/download/win). Accept the default options during setup. Restart your terminal afterwards.

### Step 2. Create a GitHub account and a new repository

1. Go to [github.com](https://github.com) and sign up if you don't have an account.
2. Click the **+** icon (top right), then **New repository**.
3. Name it something like `astar-mentor-website`. Leave it Public or Private, either works with Render's free tier. Do not tick "Add a README" (you already have one). Click **Create repository**.
4. GitHub shows you a page with commands. Keep that page open, you'll need the URL under "push an existing repository from the command line" (it looks like `https://github.com/yourname/astar-mentor-website.git`).

### Step 3. Push this folder to GitHub

Open a terminal inside this `astar-mentor-website` folder and run these one at a time:

```
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/astar-mentor-website.git
git push -u origin main
```

Replace the URL in the `remote add` line with the one GitHub gave you. The first push will ask you to sign in to GitHub in your browser. Follow the prompt.

> Your `.env` file is deliberately excluded by `.gitignore`, so your API key is never uploaded to GitHub. Keep it that way.

### Step 4. Create the Render account and web service

1. Go to [render.com](https://render.com) and sign up, ideally directly with your GitHub account.
2. From the Render dashboard, click **New +**, then **Web Service**.
3. Connect your GitHub account if prompted, then select the `astar-mentor-website` repository.
4. Fill in the settings:
   - **Name**: anything, for example `astar-mentor`
   - **Language**: Node
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
5. If your files ended up nested inside a subfolder in the repo, also set **Root Directory** to that subfolder's name.

### Step 5. Set your API key on Render

On the service's **Environment** tab:

1. Click **Add Environment Variable**.
2. Key: `ANTHROPIC_API_KEY`
3. Value: paste your real key from [console.anthropic.com](https://console.anthropic.com), under Settings, API Keys.
4. Click **Save Changes**, then **Manual Deploy**, **Deploy latest commit**.

Watch the Logs tab. When it settles you should see:
```
The A* Mentor website is running on port 10000
ANTHROPIC_API_KEY detected. AI Tutor is live.
```

### Step 6. Open your live site

Render gives you a URL like `https://astar-mentor.onrender.com`. That is your fully hosted, multi-page site with a real AI Tutor, reachable from any device.

### Notes on Render's free tier

- Free web services spin down after 15 minutes of inactivity and take 30 to 50 seconds to wake up on the next visit. That is normal, just wait for the first load.
- Free tier has a monthly usage cap of 750 hours, far more than one person needs for personal use.
- Every `git push` to `main` automatically redeploys the site.

### Updating the site later

```
git add .
git commit -m "Describe your change"
git push
```
Render redeploys automatically within a minute or two.

---

## How the Claude integration works

- The frontend (`tutor.html`) never talks to Anthropic directly. It calls your own server at `/api/chat`, same origin, so there are no CORS issues.
- `server.js` holds your `ANTHROPIC_API_KEY` as a server-side environment variable and uses the official `@anthropic-ai/sdk` to call `claude-opus-5`.
- Every request includes a fixed system prompt (tutor persona plus the complete two-year specification for all three exam boards, cached server-side so repeated requests are cheaper) and a live "student status" snippet built from the visitor's own dashboard data (anxiety ratings, high-priority topics, critical-decay topics, pending homework), so Claude can genuinely track trends.
- Image attachments are base64-encoded in the browser and sent as vision content blocks.
- When Claude sets homework, it wraps the tasks in a fenced `homework` code block; the frontend detects that and shows an "Add to my homework list" button that writes directly into the visitor's own `localStorage` state.
- If the server is unreachable, sleeping (free-tier cold start), or misconfigured, the AI Tutor page automatically falls back to `tutor-engine.js`, a fully offline knowledge base covering a curated set of high-yield topics, so the page never feels broken.

### Cost

Claude API usage is billed to your own Anthropic account, under console.anthropic.com, Billing. Casual personal use, a handful of tutoring conversations a day, typically costs a small fraction of a dollar per day. There is no cost at all when the offline engine is used.
