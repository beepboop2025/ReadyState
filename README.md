# ReadyState — Personal Resilience Intelligence Dashboard

A beautiful, data-driven dashboard that scores your personal preparedness across 6 critical life domains. Integrates with live market data to dynamically adjust crisis threat levels — bringing institutional-grade risk methodology to personal life.

![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178c6?logo=typescript&logoColor=white) ![React](https://img.shields.io/badge/React-18-61dafb?logo=react&logoColor=white) ![Vite](https://img.shields.io/badge/Vite-5-646cff?logo=vite&logoColor=white) ![TailwindCSS](https://img.shields.io/badge/Tailwind-3-38bdf8?logo=tailwindcss&logoColor=white) ![License](https://img.shields.io/badge/License-MIT-22c55e)

<br/>

<p align="center">
  <img src="https://img.shields.io/badge/🛡️_ReadyState-v2.0-10b981?style=for-the-badge" alt="ReadyState v2.0" />
</p>

---

## Why ReadyState?

Climate events are increasing 5x since the 1970s. AI job displacement is accelerating. Cyberattacks are up 38% year-over-year. Yet there's **no tool** that gives normal people a unified view of their life readiness.

**ReadyState is the missing middle ground** — a "credit score for life resilience" that's beautiful, actionable, and for everyone.

---

## Features

### Core Dashboard
- **Readiness Score (0–100)** — Animated SVG gauge with threshold-based color coding
- **73 Weighted Checklist Items** — Each rated Critical / Important / Nice-to-have with expert tips
- **Radar Chart** — Visualize domain balance across all 6 domains
- **Smart Prioritization** — Action items auto-sorted by weight from your weakest domains
- **Trend Tracking** — Daily score snapshots (up to 90 days) with area chart
- **Global Search** — `Cmd+K` to search across all checklist items instantly

### 6 Life Domains

| Domain | Items | Covers |
|--------|-------|--------|
| **Financial** | 13 | Emergency funds, insurance, debt management, estate planning |
| **Supplies** | 14 | Water, food, first aid, tools, go-bag, vital documents |
| **Digital** | 12 | Passwords, 2FA, backups, encryption, account recovery |
| **Health** | 11 | Medical records, fitness, mental health, vaccinations |
| **Skills** | 12 | First aid, CPR, home repairs, career resilience, AI literacy |
| **Network** | 11 | Emergency contacts, community ties, evacuation plans |

### Scenario Planner

8 crisis simulations with weighted domain impact analysis:

> Job Loss · Natural Disaster · Cyberattack · Pandemic · Extended Power Outage · Medical Emergency · Economic Recession · Forced Relocation

Each scenario shows which domains matter most, critical items, effective risk calculations, and expert tips.

### Dark & Light Themes

Full theme support powered by CSS custom properties with Tailwind integration. Toggle between dark and light modes in Settings — your preference persists across sessions.

### Celebrations & Onboarding

- **First-time walkthrough** — 4-step guided onboarding for new users
- **Milestone toasts** — Celebrate when you hit 25%, 50%, 75%, 100% overall readiness
- **Domain completion** — Toast notification when any domain reaches 100%

### Live Threat Intelligence (DragonScope)

When connected to [DragonScope](https://github.com/beepboop2025/DragonScope), ReadyState pulls real market data to **dynamically adjust threat levels**:

```
Effective Risk = Threat Level × (1 - Readiness / 100)
```

| Market Signal | Scenario Impact |
|---|---|
| Yield curve inverted | Economic Crisis threat +25 |
| Fear & Greed ≤ 20 | Economic Crisis +20, Overall +25 |
| Unemployment > 6% | Job Loss +30, Medical +10 |
| Hack/breach news > 5 mentions | Cyberattack +30 |
| Reddit bearish > 60% | Job Loss +10, Economic +8 |

Works perfectly standalone when DragonScope is offline.

### FastAPI Backend (Optional)

A full Python backend for persistence, external data sources, and analysis:

- **FRED economic indicators** — Real unemployment, CPI, Fed funds rate
- **NOAA weather alerts** — Active severe weather monitoring
- **News aggregation** — Crisis keyword detection and scoring
- **Supply chain stress** — Composite stress index
- **User persistence** — PostgreSQL + async SQLAlchemy
- **Resilience scoring engine** — Server-side score computation
- **Forecasting** — Readiness trend prediction
- **Alert engine** — Threat spike and score drop detection

### Data & Privacy
- **100% local storage** — All frontend data stays on your device
- **Export** — JSON backup or CSV report
- **Import** — Restore from backup with validation
- **No accounts, no tracking** — Zero telemetry

---

## Quick Start

```bash
git clone https://github.com/beepboop2025/ReadyState.git
cd ReadyState
npm install
npm run dev
```

Open `http://localhost:3001` in your browser.

### With Backend (Optional)

```bash
# Start everything with Docker
docker compose up

# Or run locally:
# Terminal 1 — Frontend
npm run dev

# Terminal 2 — Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```

### With Live Threat Intelligence

Run DragonScope's data server alongside ReadyState:

```bash
cd DragonScope && node server/dataServer.js
```

ReadyState auto-connects on port 3456 and polls every 2 minutes.

---

## Architecture

```
src/
├── main.tsx                     # Entry + providers (Store, Toast, ErrorBoundary)
├── App.tsx                      # Router + celebrations + onboarding
├── store.tsx                    # React Context + useReducer + localStorage
├── config.ts                    # Environment config + thresholds
├── index.css                    # Tailwind + CSS custom properties (light/dark)
├── types/
│   └── index.ts                 # 30+ interfaces & type definitions
├── components/
│   ├── Layout.tsx               # Sidebar nav + header + search + responsive shell
│   ├── Dashboard.tsx            # Main dashboard — gauge, cards, charts, stats
│   ├── DomainView.tsx           # Domain detail — collapsible checklists, search, filter
│   ├── ScenarioPlanner.tsx      # Crisis scenario simulation + live signals
│   ├── Settings.tsx             # Profile, theme toggle, export/import, reset
│   ├── ReadinessGauge.tsx       # Animated SVG circular gauge
│   ├── RadarChart.tsx           # Recharts radar visualization
│   ├── ActionItems.tsx          # Prioritized action list
│   ├── ThreatEnvironment.tsx    # Live threat display + effective risk
│   ├── ErrorBoundary.tsx        # React error boundary
│   ├── Toast.tsx                # Toast notification system + provider
│   └── Onboarding.tsx           # First-time user walkthrough
├── data/
│   ├── domains.ts               # 6 domains, 73 items, scoring functions
│   └── scenarios.ts             # 8 scenarios with impact weights
├── hooks/
│   ├── useThreatLevel.ts        # Market signal → threat level engine
│   └── useCelebrations.ts       # Milestone detection + toast triggers
└── services/
    └── dragonscope.ts           # DragonScope API client with caching

backend/
├── main.py                      # FastAPI app — routes, CORS, lifespan
├── database.py                  # Async SQLAlchemy setup
├── models/
│   └── user.py                  # User, UserScore, ScoreHistory, AlertPreference
└── services/
    ├── economic.py              # FRED API integration
    ├── news.py                  # News aggregation + crisis scoring
    ├── weather.py               # NOAA weather alerts
    ├── supply_chain.py          # Supply chain stress index
    ├── resilience_scorer.py     # Score computation engine
    ├── forecaster.py            # Trend forecasting
    └── alert_engine.py          # Threat spike / score drop alerts
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict mode) |
| **UI** | React 18 |
| **Build** | Vite 5 |
| **Styling** | TailwindCSS 3 + CSS custom properties |
| **Charts** | Recharts |
| **Icons** | Lucide React |
| **Backend** | FastAPI + SQLAlchemy + Pydantic |
| **Database** | PostgreSQL (Docker) / SQLite (local) |
| **Storage** | localStorage (frontend) |

## Build

```bash
npm run build     # Production build → dist/
npm run preview   # Preview production build locally
```

---

## License

MIT
