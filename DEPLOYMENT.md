# Deployment Guide

## Overview

This app has two parts:
1. **Frontend** - React app (deploys to GitHub Pages)
2. **Backend** - Node.js/Express API (deploys to Render or Railway)

---

## Option 1: Deploy to Render (Recommended - Free)

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

## Option 2: Deploy to Railway (Alternative)

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

## Important Notes

⚠️ **GitHub Pages is FREE but STATIC only** - That's why we need a separate backend host

⚠️ **Render/Railway FREE tiers**:
- Spin down after 15 min of inactivity (cold start ~30 seconds)
- Limited hours per month
- Perfect for demos and small projects

⚠️ **Your data**: The backend doesn't have a database. All data is stored in memory and resets on restart.
