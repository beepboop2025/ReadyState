# ReadyState — Personal Resilience Intelligence Dashboard

A beautiful, data-driven dashboard that scores your personal preparedness across 6 critical life domains. Integrates with live market data to dynamically adjust crisis threat levels — bringing institutional-grade risk methodology to personal life.

![ReadyState Dashboard](https://img.shields.io/badge/React-18-blue?logo=react) ![Vite](https://img.shields.io/badge/Vite-5-purple?logo=vite) ![TailwindCSS](https://img.shields.io/badge/Tailwind-3-blue?logo=tailwindcss) ![License](https://img.shields.io/badge/License-MIT-green)

## The Problem

Climate events are increasing 5x since the 1970s. AI job displacement is accelerating. Cyberattacks are up 38% year-over-year. Yet there's **no tool** that gives normal people a unified view of their life readiness. Prepper apps are ugly and niche. Financial apps only cover money. Health apps only cover fitness.

**ReadyState is the missing middle ground** — a "credit score for life resilience" that's beautiful, actionable, and for everyone.

## Features

### Core Dashboard
- **Readiness Score (0–100)** — Animated circular gauge with dynamic color coding across 6 domains
- **73 Weighted Checklist Items** — Each item rated Critical / Important / Nice-to-have with expert tips
- **Radar Chart** — Visualize domain balance at a glance
- **Smart Prioritization** — Action items auto-sorted by weight from your weakest domains
- **Trend Tracking** — Daily score snapshots (up to 90 days) with area chart visualization

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

- Job Loss
- Natural Disaster
- Cyberattack / Data Breach
- Pandemic / Health Crisis
- Extended Power Outage
- Medical Emergency
- Economic Recession
- Forced Relocation

Each scenario shows which domains matter most, which items are critical, and expert tips for that specific threat.

### Live Market Threat Intelligence (DragonScope Integration)

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
| Pandemic/outbreak news > 5 | Pandemic +35 |
| High CPI (> 5) | Overall threat +12 |
| Reddit bearish > 60% | Job Loss +10, Economic +8 |

When DragonScope is offline, ReadyState works perfectly standalone with static threat defaults.

### Data Privacy
- **100% local storage** — All data stays on your device
- **Export/Import** — JSON backup and restore
- **No accounts, no tracking, no servers**

## Quick Start

```bash
# Clone
git clone https://github.com/beepboop2025/ReadyState.git
cd ReadyState

# Install
npm install

# Run
npm run dev
```

Open http://localhost:3000 in your browser.

### With Live Threat Intelligence

To enable dynamic market-driven threat levels, run DragonScope's data server alongside ReadyState:

```bash
# Terminal 1 — ReadyState
cd ReadyState && npm run dev

# Terminal 2 — DragonScope data feed
cd DragonScope && node server/dataServer.js
```

ReadyState automatically connects to DragonScope on port 3456 and polls every 2 minutes.

## Architecture

```
src/
├── main.jsx                    # Entry point
├── App.jsx                     # Router (state-based)
├── store.jsx                   # React Context + useReducer + localStorage
├── index.css                   # Tailwind + custom components
├── components/
│   ├── Layout.jsx              # Sidebar nav + header + responsive shell
│   ├── Dashboard.jsx           # Main dashboard with gauge, cards, charts
│   ├── DomainView.jsx          # Domain detail with collapsible checklists
│   ├── ScenarioPlanner.jsx     # Crisis scenario simulation
│   ├── Settings.jsx            # Profile, export/import, reset
│   ├── ReadinessGauge.jsx      # Animated SVG circular gauge
│   ├── RadarChart.jsx          # Recharts radar visualization
│   ├── ActionItems.jsx         # Prioritized action list
│   └── ThreatEnvironment.jsx   # Live threat display components
├── data/
│   ├── domains.js              # 6 domains, 73 items, scoring functions
│   └── scenarios.js            # 8 scenarios with impact weights
├── hooks/
│   └── useThreatLevel.js       # Market signal → threat level engine
└── services/
    └── dragonscope.js          # DragonScope API client with caching
```

## Tech Stack

- **React 18** — UI framework
- **Vite 5** — Build tool
- **TailwindCSS 3** — Utility-first styling with custom design system
- **Recharts** — Radar chart, area chart, tooltips
- **Lucide React** — Icon library
- **localStorage** — Zero-dependency persistence

## Build

```bash
npm run build    # Production build → dist/
npm run preview  # Preview production build
```

## License

MIT
