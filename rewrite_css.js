const fs = require('fs');

const css = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

:root {
  --bg-base: #0f111a;
  --bg-panel: #141722;
  --bg-card: #1b1e2b;
  --bg-card-hover: #222636;
  
  --accent-cyan: #00e5ff;
  --accent-cyan-dim: rgba(0, 229, 255, 0.1);
  --accent-yellow: #ffcb6b;
  
  --text-main: #a6accd;
  --text-bright: #ffffff;
  --text-dim: #676e95;
  
  --border-color: #292d3e;
  
  --font-sans: 'Inter', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  --react-flow-bg: var(--bg-base);
  --react-flow-dots: var(--border-color);
}

*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: var(--bg-base);
  color: var(--text-main);
  font-family: var(--font-sans);
  overflow: hidden;
}

/* App Layout */
.app-wrapper {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100vw;
}

/* Topbar */
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 48px;
  background: var(--bg-panel);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
  border-top: 2px solid var(--accent-cyan);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 24px;
}

.topbar-brand {
  display: flex;
  align-items: center;
  gap: 12px;
}

.topbar-logo {
  width: 24px;
  height: 24px;
}
.topbar-logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.topbar-title {
  color: var(--text-bright);
  font-weight: 600;
  font-size: 14px;
  letter-spacing: 0.5px;
}

.topbar-menu {
  display: flex;
  gap: 16px;
}

.topbar-menu span {
  font-size: 12px;
  color: var(--text-dim);
  cursor: pointer;
  transition: color 0.2s;
}
.topbar-menu span:hover {
  color: var(--text-bright);
}

.topbar-right {
  display: flex;
  gap: 16px;
  color: var(--text-dim);
}
.topbar-icon {
  cursor: pointer;
}
.topbar-icon:hover {
  color: var(--text-bright);
}

/* Main Layout */
.main-area {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: var(--bg-panel);
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}
.sidebar-header {
  padding: 16px;
}
.sidebar-title {
  color: var(--text-bright);
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
}
.sidebar-subtitle {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
}
.add-library-btn {
  margin: 16px;
  padding: 8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-main);
  font-size: 12px;
  font-family: var(--font-mono);
  text-align: center;
  cursor: pointer;
}
.add-library-btn:hover {
  background: var(--bg-card-hover);
}

.sidebar-categories {
  flex: 1;
  overflow-y: auto;
}
.category-header {
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  border-bottom: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 1px;
  color: var(--text-main);
}
.category-header:hover {
  color: var(--text-bright);
}
.category-items {
  background: var(--bg-base);
}
.palette-item {
  padding: 10px 16px 10px 32px;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--text-dim);
  cursor: grab;
  border-bottom: 1px solid var(--border-color);
}
.palette-item:hover {
  background: var(--bg-card-hover);
  color: var(--text-bright);
}

.sidebar-footer {
  padding: 16px;
  border-top: 1px solid var(--border-color);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-dim);
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.sidebar-footer div {
  cursor: pointer;
}
.sidebar-footer div:hover {
  color: var(--text-bright);
}

/* Canvas */
.canvas-wrapper {
  flex: 1;
  position: relative;
  background: var(--bg-base);
}
.canvas-overlay-top {
  position: absolute;
  top: 16px;
  left: 16px;
  padding: 4px 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-panel);
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
  z-index: 10;
}
.canvas-run-btn {
  position: absolute;
  bottom: 16px;
  right: 16px;
  padding: 12px 24px;
  background: var(--accent-cyan);
  color: #000;
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 700;
  border: none;
  cursor: pointer;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 8px;
}
.canvas-run-btn:hover {
  background: #33eaff;
}

/* Right Panel (Tutor) */
.right-panel {
  width: 320px;
  background: var(--bg-panel);
  border-left: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}
.tutor-header {
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid var(--border-color);
}
.tutor-avatar {
  width: 32px;
  height: 32px;
  border: 1px solid var(--accent-yellow);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-yellow);
}
.tutor-title {
  color: var(--text-bright);
  font-size: 14px;
  font-weight: 600;
}
.tutor-subtitle {
  color: var(--accent-yellow);
  font-size: 10px;
  font-family: var(--font-mono);
}
.tutor-tabs {
  display: flex;
  border-bottom: 1px solid var(--border-color);
}
.tutor-tab {
  flex: 1;
  text-align: center;
  padding: 12px;
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-dim);
  cursor: pointer;
}
.tutor-tab.active {
  color: var(--text-bright);
  border-bottom: 2px solid var(--accent-cyan);
}

.tutor-content {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  font-family: var(--font-mono);
  font-size: 11px;
}
.tutor-box {
  border: 1px solid var(--border-color);
  padding: 12px;
  margin-bottom: 16px;
}
.tutor-box-title {
  color: var(--accent-yellow);
  margin-bottom: 12px;
}
.tutor-box p {
  color: var(--text-main);
  line-height: 1.5;
  margin-bottom: 8px;
}
.tutor-input-area {
  padding: 16px;
  border-top: 1px solid var(--border-color);
}
.tutor-input-box {
  display: flex;
  align-items: center;
  border: 1px solid var(--border-color);
  background: var(--bg-base);
  padding: 8px 12px;
}
.tutor-input-box input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-bright);
  font-family: var(--font-mono);
  font-size: 11px;
}
.tutor-input-box svg {
  color: var(--text-dim);
  cursor: pointer;
}

/* Status Bar */
.status-bar {
  height: 24px;
  background: var(--bg-panel);
  border-top: 1px solid var(--border-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-dim);
}
.status-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.status-indicator {
  width: 8px;
  height: 8px;
  background: var(--accent-cyan);
}

/* Custom Nodes */
.circuit-node {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  padding: 8px;
  color: var(--text-bright);
  font-family: var(--font-mono);
  font-size: 10px;
  min-width: 60px;
  text-align: center;
  position: relative;
}
.circuit-node.selected {
  border-color: var(--accent-cyan);
  box-shadow: 0 0 0 1px var(--accent-cyan);
}
.node-label {
  margin-bottom: 4px;
  color: var(--text-dim);
}
.node-input {
  background: var(--bg-base);
  border: 1px solid var(--border-color);
  color: var(--accent-cyan);
  padding: 2px 4px;
  width: 40px;
  font-family: var(--font-mono);
  font-size: 10px;
  text-align: center;
}
.circuit-node .react-flow__handle {
  width: 6px;
  height: 6px;
  background: var(--accent-cyan);
  border: none;
  border-radius: 0;
}
.node-delete-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  color: var(--text-dim);
  width: 16px;
  height: 16px;
  font-size: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.node-delete-btn:hover {
  color: #ff5555;
  border-color: #ff5555;
}
`;

fs.writeFileSync('frontend/src/index.css', css);
console.log('index.css rewritten.');
