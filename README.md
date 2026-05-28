# ⚡ AI Electronics Simulator

An interactive circuit learning platform with drag-and-drop component placement, real-time circuit validation, and AI-powered tutoring.

## 🏗️ Architecture

```
EletronicaSimulator/
├── backend/          # Node.js + Express API server
│   ├── server.js     # Main server with circuit validation & AI tutor
│   ├── .env          # Environment config (API keys)
│   └── package.json
└── frontend/         # React + Vite + React Flow
    ├── src/
    │   ├── App.jsx   # Main app with circuit canvas & tutor panel
    │   ├── index.css # Complete design system
    │   └── main.jsx  # Entry point
    ├── index.html
    └── package.json
```

## 🚀 Quick Start (One-Click Setup)

For easy installation and startup, you can use the provided scripts. These scripts will automatically install all dependencies and start both the frontend and backend servers.

### Windows
Double-click the `run.bat` file in the root folder, or run in terminal:
```cmd
run.bat
```

### Mac/Linux
Open a terminal in the root folder and run:
```bash
./run.sh
```

*(Optional) If you want to run them manually:*
1. **Backend**: `cd backend && npm install && npm run dev`
2. **Frontend**: `cd frontend && npm install && npm run dev`

### (Optional) Add OpenAI Key
Edit `backend/.env` and add your API key:
```
OPENAI_API_KEY=sk-your-key-here
```
Without an API key, the app uses a smart mock AI tutor.

## 🎮 How to Use
1. **Drag components** from the palette onto the canvas
2. **Connect nodes** by dragging from one handle to another
3. **Click "RUN SIMULATION & ASK AI"** to get circuit analysis
4. **Read Sparky's feedback** in the right panel — learn Ohm's Law the fun way!

## 🛠️ Tech Stack
- **Frontend**: React, Vite, React Flow (@xyflow/react)
- **Backend**: Node.js, Express, CORS
- **AI**: OpenAI API (with mock fallback)
