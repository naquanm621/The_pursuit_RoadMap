# Deployment Guide

## Overview

This app has two parts:
1. **Frontend** - React/Vite app
2. **Backend** - Node.js/Express API with Gemini

The repository now includes a Vercel configuration that deploys both parts
together: the frontend is served from `frontend/dist`, and `/api/*` is handled
by explicit Express serverless functions in `api/`.

## Option 1: Deploy the whole app to Vercel

1. Import the GitHub repository into [Vercel](https://vercel.com).
2. Leave the project root as the repository root.
3. Vercel will use `vercel.json` for the install and build commands.
4. Add the environment variable `GEMINI_API_KEY`.
5. Deploy. The frontend and API will share the same domain.

No `VITE_API_URL` value is required for the combined deployment. The frontend
uses same-origin `/api/*` requests.

---

## Option 2: Deploy to Render (Separate backend)

### Step 1: Deploy Backend

1. Go to [render.com](https://render.com) and sign up with GitHub
2. Click "New +" → "Web Service"
3. Connect your GitHub repo: `naquanm621/pursuit_roadmap`
4. Configure:
   - **Name**: `pursuit-roadmap-api`
   - **Environment**: `Node`
   - **Build Command**: `cd backend && npm ci && npm run build`
   - **Start Command**: `cd backend && npm start`
5. Add Environment Variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your Gemini API key
6. Click "Create Web Service"

### Step 2: Get Backend URL

After deployment, you'll get a URL like:
```
https://pursuit-roadmap-api.onrender.com
```

### Step 3: Update Frontend

1. Create `.env` file in `/frontend` folder:
```
VITE_API_URL=https://pursuit-roadmap-api.onrender.com
```

2. Rebuild frontend:
```bash
cd frontend
npm run build
```

### Step 4: Deploy Frontend to GitHub Pages

Already configured! Just push:
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

---

## Option 3: Deploy to Railway (Separate backend)

### Step 1: Deploy Backend

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repo: `naquanm621/pursuit_roadmap`
4. Railway will auto-detect the `railway.json` config
5. Add environment variable:
   - Key: `GEMINI_API_KEY`
   - Value: Your API key
6. Deploy!

### Step 2-4: Same as Render (update env, rebuild, push)

---

## Development (Local)

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

Frontend will use `http://localhost:3000` automatically.

---

## Troubleshooting

**CORS Errors**: The backend already has CORS enabled. If issues persist, add your frontend domain to the backend CORS config in `backend/src/index.ts`.

**Build Fails**: Make sure you have:
- Node.js 18+ installed
- Run `npm ci` in both `/frontend` and `/backend` folders

**API Not Responding**: Check that:
1. `GEMINI_API_KEY` is set in environment variables
2. Backend URL in frontend `.env` is correct
3. Backend is running (check Render/Railway dashboard)

---

## Files Created for Deployment

- `.github/workflows/deploy.yml` - GitHub Pages auto-deploy
- `render.yaml` - Render configuration
- `railway.json` - Railway configuration
- `backend/Procfile` - Heroku/Render process file
- `frontend/.env.example` - Environment variable template
- `vercel.json` - Combined Vercel frontend/API configuration
- `api/` - Vercel serverless entrypoints for the Express API routes

## Important Notes

⚠️ **GitHub Pages is FREE but STATIC only** - Use the Vercel setup when the frontend and backend should share one deployment

⚠️ **Render/Railway FREE tiers**:
- Spin down after 15 min of inactivity (cold start ~30 seconds)
- Limited hours per month
- Perfect for demos and small projects

⚠️ **Your data**: The backend doesn't have a database. All data is stored in memory and resets on restart.
