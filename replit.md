# LLM Forensic Investigator

## Overview
An LLM-powered log forensic investigation tool built with React, TypeScript, Vite, and Tailwind CSS. Provides a dashboard for monitoring logs, detecting threats, analyzing incidents, and interacting with AI for forensic analysis.

## Architecture
- **Frontend only** — pure React SPA, no backend server
- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS + shadcn/ui component library
- **Routing**: React Router DOM v6
- **State/Data**: TanStack React Query

## Pages
- `/` — Dashboard (overview, live log stream, active alerts, AI analysis)
- `/monitoring` — Live Monitoring
- `/analyze` — Analyze Logs
- `/history` — History
- `/ask-ai` — Ask AI
- `/settings` — Settings

## Project Structure
```
src/
  App.tsx          # Root component with routing
  main.tsx         # Entry point
  pages/           # Route-level page components
  components/      # Shared UI components (shadcn/ui + custom)
  hooks/           # Custom React hooks
  lib/             # Utility functions
  data/            # Static/mock data
```

## Dev & Run
- **Dev server**: `npm run dev` (runs on port 5000)
- **Build**: `npm run build` (outputs to `dist/`)

## Migration Notes (Lovable → Replit)
- Removed `lovable-tagger` from vite config (dev-only Lovable tool)
- Updated Vite server to use `host: "0.0.0.0"` and `port: 5000` for Replit compatibility
- Deployment configured as static site (Vite build → `dist/`)
