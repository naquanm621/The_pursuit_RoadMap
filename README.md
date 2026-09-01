Pursuit Roadmap (In Pursuit)

An AI-powered career roadmap app for Pursuit program students to track their learning journey, discover career paths, and get AI-generated trajectory insights.

Run & Operate

Frontend: cd frontend && npm run dev → port 5000
Backend: cd backend && npm run dev → port 3000
Build backend: cd backend && npm run build
Required env vars: GEMINI_API_KEY (in backend/.env for AI career path generation)
Stack

Frontend: React 18, Vite 6, Tailwind CSS 4, MUI, Radix UI, Framer Motion, React Router 7
Backend: Node.js 18+, Express 5, TypeScript, tsx (dev), Google Generative AI (Gemini)
Runtime: Node.js >= 18
Where things live

frontend/src/App.tsx — main app (login, onboarding, tutorial, roadmap, log views)
frontend/src/pages/ — additional pages (CyberSkillRoad, Login, Paths, Roadmap)
backend/src/index.ts — Express server entry point
backend/src/services/gemini.service.ts — Gemini AI integration
backend/src/services/trajectory.service.ts — prime-based skill weighting
frontend/.env — VITE_API_URL=http://localhost:3001
Architecture decisions

Backend runs on port 3001 (not 3000) to avoid conflicts with frontend dev defaults
Frontend uses VITE_API_URL env var to point at backend; falls back to http://localhost:3000
Trajectory engine uses prime-number-based weighting for skill combination scoring
Login is restricted to @pursuit.org email addresses (client-side check only)
No database — all state is in-memory/React state (resets on refresh)
Product

Login screen with @pursuit.org email gate
Onboarding: user enters prior skills
Interactive 8-week curriculum roadmap with completion tracking
AI-generated career path branches (via Gemini) based on completed weeks + prior skills
Journey Log with AI tutor chat (stub — future feature)
Dark/light theme toggle
User preferences

Populate as you build

Gotchas

GEMINI_API_KEY must be set in backend environment for AI features to work
The base in vite.config.ts was changed from /pursuit_roadmap/ to / for Replit hosting
Backend reads .env via dotenv; make sure backend/.env exists with the key
Pointers

Gemini AI docs: https://ai.google.dev/
Vite config: frontend/vite.config.ts
Deployment guide: DEPLOYMENT.md
