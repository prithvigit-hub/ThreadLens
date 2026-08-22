# LLM Forensic Investigator

## Overview
A full-stack LLM-powered log forensic investigation SaaS dashboard. Built with React + TypeScript (frontend) and FastAPI + Python (backend), connecting to MongoDB and Groq LLM API.

## Architecture
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui
- **Backend**: FastAPI (Python) on port 8000
- **Database**: MongoDB (via database.py)
- **AI**: Groq API (llama-3.3-70b-versatile) for chat, event analysis, and investigation
- **Routing**: React Router DOM v6
- **State/Data**: TanStack React Query

## Routes
- `/login` — Login page (mock auth, any email + password)
- `/` — Home landing page (ChatGPT-style, AI query box + action cards)
- `/dashboard` — Security dashboard (metrics, alerts, AI chat, demo simulation)
- `/monitoring` — Live monitoring (start/stop with Demo Mode or API endpoint)
- `/analyze` — Upload log files (async background processing)
- `/report` — Analysis report (after upload, shows threats + AI investigation)
- `/ask-ai` — AI chat with session history
- `/history` — Session history
- `/settings` — Settings with system status + user profile

## Key Features
- **Auth**: Mock login with localStorage persistence, private route protection
- **Home**: ChatGPT-style landing with AI query box and 3 action cards
- **Upload**: Async file processing up to 10 GB / 10M log entries, with polling progress
- **Report**: Auto-redirect after upload with AI forensic investigation button
- **Live Monitoring**: Manual start/stop with Demo Mode (simulated attacks)
- **Demo Simulation**: POST /api/demo/simulate generates realistic attack log data
- **AI Chat**: Cybersecurity-scoped chat with conversation history + off-topic detection

## Backend Endpoints
- `GET /api/health` — Backend + DB health check
- `POST /api/upload` — Async file upload (returns job_id immediately)
- `GET /api/upload/status/{job_id}` — Poll upload processing status
- `POST /api/demo/simulate` — Insert demo attack logs + alerts
- `POST /api/chat` — AI chat (cybersecurity domain only)
- `POST /api/analyze` — Analyze a single security event
- `POST /api/investigate` — AI forensic investigation of log sequence
- `GET /api/logs` — Get stored logs
- `GET /api/alerts` — Get alerts
- `GET /api/stats` — Dashboard statistics
- `GET /api/live-logs` — Live log stream
- `GET /api/sessions` — Upload session history
- `POST/GET/DELETE /api/chat/sessions` — Chat session management

## Project Structure
```
src/
  contexts/AuthContext.tsx  # Mock auth with localStorage
  pages/
    Login.tsx               # Login page
    Home.tsx                # ChatGPT-style landing page
    Dashboard.tsx           # Security dashboard + demo simulation
    AnalyzeLogs.tsx         # File upload with async processing
    ReportPage.tsx          # Post-upload analysis report
    LiveMonitoring.tsx      # Controllable live log monitoring
    AskAi.tsx               # AI chat with history sidebar
    HistoryPage.tsx         # Upload session history
    SettingsPage.tsx        # Settings + system status + user profile
  components/
    Layout.tsx              # App shell (sidebar + topbar)
    AppSidebar.tsx          # Navigation + user info + logout
    TopNavbar.tsx           # Header with threat status
    dashboard/
      MetricsSection.tsx    # Stats cards
      AlertsPanel.tsx       # Active alerts list
      LiveLogsPanel.tsx     # Real-time log stream (isActive prop)
      AiAnalysisPanel.tsx   # AI chat component (supports initialMessage)
backend/
  main.py                   # FastAPI app with all endpoints
  llm.py                    # Groq AI integration
  parser.py                 # Log line parser
  detector.py               # Threat detection
  database.py               # MongoDB connection
```

## Environment Variables
- `MONGODB_URI` — MongoDB connection string; required for accounts, stored logs, alerts, and sessions
- `GROQ_API_KEY` — Groq AI API key; required for chat and AI analysis
- `JWT_SECRET` — long random signing secret for authentication tokens
- `SMTP_EMAIL` / `SMTP_PASSWORD` — optional Gmail SMTP credentials for email verification

Without MongoDB or Groq configured, both workflows still start and `/api/health`
returns `status: ok`, while database-backed and AI actions report their missing
service explicitly. Do not commit these values; use Replit Secrets locally and
environment variables in VS Code.

## Dev & Run
- **Install frontend dependencies**: `npm install`
- **Install backend dependencies**: `python -m pip install -r backend/requirements.txt`
- **Frontend**: `npm run dev` (port 5000, via "Start application" workflow)
- **Backend**: `cd backend && python main.py` (port 8000, via "Backend API" workflow)
- **Build**: `npm run build` (outputs to `dist/`)
- **Lint**: `npm run lint`
- **Tests**: `npm test`
- **VS Code**: run the frontend and backend commands in separate terminals; Vite proxies `/api` to `http://localhost:8000`
