# Project Atlas 🚀

A premium productivity dashboard with AI assistance, habit tracking, and focus tools.

## Tech Stack
- **Frontend**: React (Vite), Tailwind CSS, Framer Motion, Lucide React.
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite (Development), PostgreSQL (Production).
- **Core Features**: Bento Grid Dashboard, AI Assistant (Resend Integration), Focus Timer, Expenses Tracker, Journaling.

---

## 🛠 Local Setup

### 1. Backend
1. Go to `/backend`.
2. Create a virtual environment: `python -m venv venv`.
3. Activate it:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`
4. Install dependencies: `pip install -r requirements.txt`.
5. Configuration: Copy `.env.example` to `.env` and fill in your keys.
6. Run: `uvicorn app.main:app --reload`.

### 2. Frontend
1. Go to `/frontend`.
2. Install dependencies: `npm install`.
3. Run: `npm run dev`.

---

## 🌍 Deployment

### 1. Backend (Railway)
1. Push this code to a GitHub repository.
2. Connect the repository to **Railway.app**.
3. Add your environment variables from `.env` to the Railway project settings.
4. Railway will automatically detect the `Dockerfile` and deploy.

### 2. Frontend (Vercel)
1. Connect the same repository to **Vercel.com**.
2. Set the "Root Directory" to `frontend`.
3. Build Command: `npm run build`.
4. Output Directory: `dist`.
5. Set `VITE_API_URL` environment variable to your Railway backend URL.

---

## 🔐 Security Note
Never commit your `.env` file. It is already excluded in `.gitignore`. Use `.env.example` as a template for other environments.
