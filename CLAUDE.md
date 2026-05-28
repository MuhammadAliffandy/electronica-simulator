# CLAUDE.md — AI Electronics Simulator

This file provides context for AI assistants working on this codebase.

## Project Overview

An interactive, full-stack **AI Electronics Simulator** for learning circuit fundamentals through drag-and-drop building and real-time AI tutoring. Users place components (batteries, resistors, LEDs, capacitors, switches, motors, buzzers) on a canvas, wire them together, and receive guided feedback from "Sparky" — an AI tutor that teaches Ohm's Law the fun way.

**AI Fallback Chain**: OpenAI → Ollama (local LLM) → Mock tutor. The server auto-detects which providers are available at runtime.

## Architecture

```
EletronicaSimulator/
├── backend/                 # Node.js + Express API (port 3001)
│   ├── server.js            # Single-file server: validation engine, AI tutor, routes
│   ├── .env                 # Runtime config (OPENAI_API_KEY, PORT, OPENAI_MODEL)
│   ├── .env.example         # Template for environment setup
│   └── package.json         # express, cors, dotenv, openai
├── frontend/                # React + Vite (port 5173)
│   ├── src/
│   │   ├── App.jsx          # Main app: React Flow canvas, custom nodes, tutor panel
│   │   ├── index.css        # Full design system (dark theme, neon aesthetics)
│   │   └── main.jsx         # Entry point
│   ├── public/
│   │   └── favicon.svg      # Lightning bolt SVG favicon
│   ├── index.html           # HTML template with SEO meta
│   └── package.json         # react, @xyflow/react, vite
└── README.md                # User-facing quick start guide
```

## Tech Stack

| Layer      | Technology                         |
|------------|------------------------------------|
| Frontend   | React 19, Vite 8, @xyflow/react   |
| Backend    | Node.js 26, Express 4, CORS       |
| AI (Tier 1)| OpenAI SDK (gpt-4o-mini)           |
| AI (Tier 2)| Ollama local LLM (llama3.2)        |
| AI (Tier 3)| Built-in mock tutor (no deps)      |
| Styling    | Vanilla CSS (custom design system) |

## Key Concepts

### Circuit Validation Engine (`server.js`)
- **Closed loop detection**: DFS-based graph traversal on adjacency list built from React Flow edges.
- **LED burnout detection**: Checks if LED is directly wired to battery without a resistor in the path.
- **Ohm's Law calculation**: `I = V / R` computed when a valid series circuit with battery + resistor is detected.
- **Multi-resistor analysis**: Calculates total series resistance and per-resistor voltage drops.
- **RC time constant**: `τ = R × C` computed when capacitors are present.
- **Switch state awareness**: Detects open switches that prevent current flow.
- **Motor/Buzzer warnings**: Flags high current draw and missing current-limiting resistors.

### AI Tutor Agent ("Sparky")
- Persona: Friendly, gamified physics tutor using the "fun way" philosophy.
- **Core rule**: NEVER gives direct answers. Always guides with hints.
- **Dual mode**: Uses OpenAI API → falls back to Ollama local LLM → falls back to deterministic mock responses.
- Mock responses cover 3 scenarios: open circuit, burnout risk, valid circuit.

### Ollama Integration
- Calls Ollama's local REST API at `OLLAMA_URL` (default `http://localhost:11434`)
- Uses `/api/chat` endpoint with the same system prompt as OpenAI
- Auto-detects Ollama availability with a 2-second timeout health check on `/api/tags`
- Default model: `llama3.2` (configurable via `OLLAMA_MODEL` env var)
- Install: `brew install ollama && ollama pull llama3.2`

### Response Schema (strict contract)
All `/api/evaluate-circuit` responses MUST match:
```json
{
  "api_status": "ACTIVE",
  "analysis_log": ["string"],
  "ai_insights": {
    "greeting": "string",
    "explanation": "string",
    "hint": "string",
    "suggestion_button_text": "string"
  },
  "error_log": ["string"]
}
```

### Custom React Flow Nodes
Eight custom node types registered in `App.jsx`:
- `battery` → `BatteryNode` (🔋 with voltage display)
- `resistor` → `ResistorNode` (⚡ with resistance display)
- `led` → `LEDNode` (💡 with color display)
- `capacitor` → `CapacitorNode` (🔵 with capacitance display)
- `switch` → `SwitchNode` (🟢/🔴 with open/closed state)
- `motor` → `MotorNode` (⚙️ with rated voltage)
- `buzzer` → `BuzzerNode` (🔔 with min voltage)
- `junction` → `WireJunctionNode` (⭕ multi-handle splitter)

Each node uses `Handle` components for source/target connections.
The palette groups 22 components into 5 categories: Power, Passive, Output, Control, Wiring.

## Commands

```bash
# Backend
cd backend && npm install        # Install dependencies
cd backend && npm run dev        # Start with --watch (auto-restart)
cd backend && npm start          # Start production

# Frontend
cd frontend && npm install       # Install dependencies
cd frontend && npm run dev       # Vite dev server with HMR
cd frontend && npm run build     # Production build
```

## API Endpoints

| Method | Path                      | Description                              |
|--------|---------------------------|------------------------------------------|
| GET    | `/api/health`             | Health check, returns AI mode status     |
| POST   | `/api/evaluate-circuit`   | Main endpoint: receives `{nodes, edges}`, returns analysis + AI feedback |

## Design System (`index.css`)

- **Theme**: Dark background (`#0a0e1a`) with neon accents (cyan `#00d4ff`, purple `#7c3aed`, green `#10b981`).
- **Typography**: Inter (sans-serif) + JetBrains Mono (monospace) via Google Fonts.
- **Components**: Glassmorphism header, card slide-in animations, loading shimmer skeletons, animated wire edges.
- **Layout**: Split-screen — canvas panel (flex: 7) | tutor panel (flex: 3).
- All design tokens are CSS custom properties under `:root`.

## Code Conventions

- All code comments are in **English**.
- No TypeScript — plain JSX and CommonJS (`require` in backend, ESM imports in frontend).
- Single-file architecture for both server (`server.js`) and client (`App.jsx`) to keep the project approachable.
- Node types are registered via `useMemo` to prevent unnecessary re-renders in React Flow.

## Environment Variables

| Variable         | Default                | Description                                        |
|------------------|------------------------|----------------------------------------------------|
| `PORT`           | `3001`                 | Backend server port                                |
| `OPENAI_API_KEY` | _(empty)_              | OpenAI API key. Empty = skip to Ollama             |
| `OPENAI_MODEL`   | `gpt-4o-mini`          | OpenAI model for AI tutor                          |
| `OLLAMA_URL`     | `http://localhost:11434` | Ollama API base URL                              |
| `OLLAMA_MODEL`   | `llama3.2`             | Ollama model for AI tutor                          |

## Common Pitfalls

- **CORS**: Backend has `cors()` middleware enabled for all origins. Restrict in production.
- **Node path on macOS**: Node.js is installed via Homebrew at `/opt/homebrew/bin/node`. If `npx`/`node` is not found, use the full path or ensure `/opt/homebrew/bin` is in `$PATH`.
- **React Flow attribution**: Hidden via `proOptions={{ hideAttribution: true }}` — requires a paid license for production use.
- **Edge animation**: Default edges use `animated: true` with custom CSS keyframes (`flowDash`). This is purely visual.
