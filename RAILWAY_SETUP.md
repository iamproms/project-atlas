# 🚂 Detailed Railway Deployment Guide

Follow these steps to get your **Atlas Backend** live on Railway.

### 1. Connect GitHub to Railway
1. Go to [Railway.app](https://railway.app) and log in with GitHub.
2. Click **"+ New Project"** -> **"Deploy from GitHub repo"**.
3. Select `iamproms/project-atlas`.
4. When prompted, click **"Add Variables"** (we will do this in the next step).

### 2. Set Environment Variables
In the Railway dashboard for your service, go to the **Variables** tab and add the following:

- `DATABASE_URL`: `sqlite+aiosqlite:///./data/atlas.db` *(Note the /data/ prefix for persistence)*
- `SECRET_KEY`: *(Your secret key from .env)*
- `ALGORITHM`: `HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES`: `30`
- `REFRESH_TOKEN_EXPIRE_DAYS`: `7`
- `RESEND_API_KEY`: `re_your_real_key_here`
- `PORT`: `8000`

### 3. Enable Database Persistence (SQLite)
Since you are using SQLite, Railway will wipe the database every time you redeploy **unless** you mount a Volume.
1. In your project, click **"+ New"** -> **"Volume"**.
2. Mount it to the path `/app/data`.
3. This ensures your user accounts and habits aren't deleted on every update.

### 4. Health Checks & Domains
1. Go to **Settings** -> **Public Networking**.
2. Click **"Generate Domain"** to get your public API URL (e.g., `atlas-production.up.railway.app`).
3. **Important**: Copy this URL! You will need to put it into **Vercel** as `VITE_API_URL`.

### 5. Troubleshooting Logs
- Go to the **Logs** tab in Railway to see the Uvicorn output. 
- This is also where you will see the **Password Reset Tokens** if the email delivery has issues with the `onboarding@resend.dev` address.

---

### 💡 Recommendation: Switching to PostgreSQL
If you want to move away from "Volume files" (which can be finicky), Railway has a one-click Postgres button:
1. Click **"+ New"** -> **"Database"** -> **"PostgreSQL"**.
2. Railway will automatically inject a `DATABASE_URL` variable. 
3. Our code is already compatible! You'll just need to run `alembic upgrade head` once from the Railway terminal to create the tables.
