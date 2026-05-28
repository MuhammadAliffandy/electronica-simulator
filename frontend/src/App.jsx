// ============================================
// AI Electronics Simulator - Main Application
// React + React Flow + AI Tutor Integration
// ============================================

import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  useReactFlow,
  ConnectionMode,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import "./index.css";

// ============================================
// BACKEND API URL
// ============================================
const API_BASE = window.location.protocol === 'file:' 
  ? 'http://localhost:3001' 
  : `http://${window.location.hostname}:3001`;

// ============================================
// INTERNATIONALIZATION (EN / ID)
// ============================================

const i18n = {
  en: {
    headerSubtitle: "AI-Powered Circuit Learning Lab",
    systemOnline: "System Online",
    components: "🧩 Components",
    catPower: "⚡ Power",
    catPassive: "📐 Passive",
    catOutput: "💡 Output",
    catControl: "🔘 Control",
    catWiring: "🔗 Wiring",
    workspace: "🔧 Circuit Workspace",
    componentCount: "Components",
    wireCount: "Wires",
    reset: "🔄 Reset",
    simulate: "RUN SIMULATION & ASK AI",
    analyzing: "Analyzing Circuit...",
    tutorRole: "AI Circuit Tutor",
    readyTitle: "Ready to Learn!",
    readyText: 'Connect your circuit components on the canvas, then hit "Run Simulation & Ask AI" to get real-time feedback from Sparky, your AI tutor!',
    apiStatus: "API Status",
    analysisLog: "Analysis Log",
    aiInsights: "AI Insights",
    errorLog: "Error Log",
    greeting: "Greeting",
    explanation: "Explanation",
    hint: "💡 Hint",
    backendError: "Could not reach the backend. Make sure the server is running!",
  },
  id: {
    headerSubtitle: "Lab Pembelajaran Rangkaian Berbasis AI",
    systemOnline: "Sistem Aktif",
    components: "🧩 Komponen",
    catPower: "⚡ Daya",
    catPassive: "📐 Pasif",
    catOutput: "💡 Keluaran",
    catControl: "🔘 Kontrol",
    catWiring: "🔗 Kabel",
    workspace: "🔧 Area Kerja Rangkaian",
    componentCount: "Komponen",
    wireCount: "Kabel",
    reset: "🔄 Reset",
    simulate: "JALANKAN SIMULASI & TANYA AI",
    analyzing: "Menganalisis Rangkaian...",
    tutorRole: "Tutor Rangkaian AI",
    readyTitle: "Siap Belajar!",
    readyText: 'Hubungkan komponen rangkaian di kanvas, lalu tekan "Jalankan Simulasi & Tanya AI" untuk mendapat umpan balik langsung dari Sparky, tutor AI kamu!',
    apiStatus: "Status API",
    analysisLog: "Log Analisis",
    aiInsights: "Wawasan AI",
    errorLog: "Log Error",
    greeting: "Sapaan",
    explanation: "Penjelasan",
    hint: "💡 Petunjuk",
    backendError: "Tidak dapat terhubung ke backend. Pastikan server sudah berjalan!",
  },
};

// ============================================
// CUSTOM NODE COMPONENTS
// Each circuit component has its own styled node
// ============================================

function NodeDeleteButton({ id }) {
  const { deleteElements } = useReactFlow();
  const onClick = (e) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };
  return (
    <button className="node-delete-btn nodrag" onClick={onClick} title="Remove component">
      ×
    </button>
  );
}

function ErrorBadge({ data }) {
  if (!data.hasError) return null;
  return (
    <div className="node-error-badge-container">
      <div 
        className="node-error-badge" 
        onClick={(e) => data.onNodeErrorClick && data.onNodeErrorClick(e, data.id)}
      >
        ⚠️
      </div>
      {data.errorMessage && (
        <div className="node-error-tooltip">
          {data.errorMessage}
        </div>
      )}
    </div>
  );
}

// Shared 4-way handles for standard components
// We use Loose connection mode so any handle can connect to any handle.
const FourWayHandles = () => (
  <>
    <Handle type="source" position={Position.Top} id="top" />
    <Handle type="source" position={Position.Right} id="right" />
    <Handle type="source" position={Position.Bottom} id="bottom" />
    <Handle type="source" position={Position.Left} id="left" />
  </>
);

function BatteryNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} battery-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <FourWayHandles />
      <span className="node-emoji">🔋</span>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.voltage || 9} 
          onChange={(e) => updateNodeData(id, { voltage: Number(e.target.value) })}
          className="node-input nodrag"
        />
        V DC
      </div>
    </div>
  );
}

function getResistorBands(ohms) {
  if (!ohms || ohms < 10) return ['black', 'black', 'black'];
  const colors = ["black", "brown", "red", "orange", "yellow", "green", "blue", "violet", "gray", "white"];
  let val = ohms;
  let mult = 0;
  while (val >= 100) { val /= 10; mult++; }
  const digit1 = Math.floor(val / 10);
  const digit2 = Math.floor(val % 10);
  return [colors[digit1], colors[digit2], colors[mult]];
}

function ResistorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const bands = getResistorBands(data.resistance || 220);
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} resistor-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <FourWayHandles />
      <div className="resistor-body nodrag">
        <div className="resistor-band" style={{ backgroundColor: bands[0] }}></div>
        <div className="resistor-band" style={{ backgroundColor: bands[1] }}></div>
        <div className="resistor-band" style={{ backgroundColor: bands[2] }}></div>
        <div className="resistor-band" style={{ backgroundColor: '#FFD700' }}></div>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.resistance || 220} 
          onChange={(e) => updateNodeData(id, { resistance: Number(e.target.value) })}
          className="node-input nodrag"
        />
        Ω
      </div>
    </div>
  );
}

function PotentiometerNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} potentiometer-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <Handle type="target" position={Position.Left} id="pin1" />
      <Handle type="source" position={Position.Bottom} id="wiper" />
      <Handle type="source" position={Position.Right} id="pin3" />
      <span className="node-emoji">🎛️</span>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="range" min="0" max="100" 
          value={data.wiperPercent || 50} 
          onChange={(e) => updateNodeData(id, { wiperPercent: Number(e.target.value) })}
          className="nodrag custom-slider" style={{ width: '80px', marginTop: '4px' }}
        />
      </div>
      <div style={{ fontSize: '0.6rem', marginTop: '4px', color: 'var(--text-muted)' }}>
        Wiper: {data.wiperPercent || 50}% of {data.maxResistance || 10000}Ω
      </div>
    </div>
  );
}

function CapacitorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isElco = data.capType === "elco";
  const isExploded = data.hasError && data.errorMessage && data.errorMessage.includes("Explosion");
  
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} capacitor-node ${selected ? "selected" : ""} ${isExploded ? "exploded" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <FourWayHandles />
      {isElco && !isExploded && (
        <>
          <div className="polar-label polar-plus">+</div>
          <div className="polar-label polar-minus">-</div>
        </>
      )}
      <span className="node-emoji">{isExploded ? "💥" : (isElco ? "🛢️" : "🟠")}</span>
      <div className="node-label">{data.label} {isElco && !isExploded ? "(+/-)" : ""}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.capacitance || 100} 
          onChange={(e) => updateNodeData(id, { capacitance: Number(e.target.value) })}
          className="node-input nodrag"
        />
        {isElco ? "µF" : "nF"}
      </div>
      <div className="node-value" style={{ marginTop: '4px' }}>
        <select value={data.capType || "elco"} onChange={(e) => updateNodeData(id, { capType: e.target.value })} className="node-input nodrag" style={{ width: '80px' }}>
          <option value="elco">Elco (Polar)</option>
          <option value="ceramic">Ceramic</option>
        </select>
      </div>
    </div>
  );
}

function LEDNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isBurnt = data.hasError && data.errorMessage && data.errorMessage.includes("Burnout");
  const isDim = data.ledState === "dim";
  const isBright = data.ledState === "bright";
  
  let emoji = "💡";
  if (isBurnt) emoji = "💨";
  else if (data.color === "Blue") emoji = "💎";
  else if (data.color === "Green") emoji = "🟢";
  else if (data.color === "White") emoji = "⬜";
  else emoji = "🔴";

  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} led-node ${selected ? "selected" : ""} ${isBright ? "led-bright" : ""} ${isDim ? "led-dim" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <FourWayHandles />
      <span className="node-emoji">{emoji}</span>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <select 
          value={data.color || "Red"} 
          onChange={(e) => updateNodeData(id, { color: e.target.value })}
          className="node-input nodrag"
          style={{ width: "60px" }}
        >
          <option value="Red">Red</option>
          <option value="Blue">Blue</option>
          <option value="Green">Green</option>
          <option value="White">White</option>
        </select>
      </div>
    </div>
  );
}

function DiodeNode({ id, data, selected }) {
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} diode-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <Handle type="source" position={Position.Left} id="anode" />
      <Handle type="source" position={Position.Right} id="cathode" />
      <div className="pin-label pin-left">A</div>
      <div className="pin-label pin-right">K</div>
      <div className="diode-body nodrag">
        <div className="diode-triangle"></div>
        <div className="diode-line"></div>
      </div>
      <div className="node-label">{data.label}</div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>1N4007</div>
    </div>
  );
}

function TransistorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} transistor-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <Handle type="source" position={Position.Left} id="base" style={{ top: '50%' }} />
      <Handle type="source" position={Position.Top} id="collector" style={{ left: '50%' }} />
      <Handle type="source" position={Position.Bottom} id="emitter" style={{ left: '50%' }} />
      <div className="pin-label pin-left">B</div>
      <div className="pin-label pin-top">C</div>
      <div className="pin-label pin-bottom">E</div>
      <span className="node-emoji">⬛</span>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <select value={data.transistorType || "npn"} onChange={(e) => updateNodeData(id, { transistorType: e.target.value })} className="node-input nodrag" style={{ width: '80px' }}>
          <option value="npn">NPN (BC547)</option>
          <option value="pnp">PNP (BC557)</option>
        </select>
      </div>
    </div>
  );
}

function SwitchNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isOn = data.state === "closed";
  
  const toggleSwitch = () => {
    updateNodeData(id, { state: isOn ? "open" : "closed" });
  };

  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} switch-node ${isOn ? "switch-closed" : "switch-open"} ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <FourWayHandles />
      <div className="node-emoji nodrag" onClick={toggleSwitch} style={{ cursor: "pointer", display: "inline-block" }}>
        {isOn ? "🟢" : "🔴"}
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">{isOn ? "CLOSED" : "OPEN"}</div>
    </div>
  );
}

function MotorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} motor-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <FourWayHandles />
      <span className="node-emoji">⚙️</span>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.ratedVoltage || 5} 
          onChange={(e) => updateNodeData(id, { ratedVoltage: Number(e.target.value) })}
          className="node-input nodrag"
        />
        V Motor
      </div>
    </div>
  );
}

function BuzzerNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} buzzer-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <FourWayHandles />
      <span className="node-emoji">🔔</span>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.minVoltage || 3} 
          onChange={(e) => updateNodeData(id, { minVoltage: Number(e.target.value) })}
          className="node-input nodrag"
        />
        V min
      </div>
    </div>
  );
}

function WireJunctionNode({ id, data, selected }) {
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} junction-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <FourWayHandles />
      <span className="node-emoji">⭕</span>
      <div className="node-label">{data.label}</div>
    </div>
  );
}

function MultimeterNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} multimeter-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <Handle type="source" position={Position.Left} id="probe-red" style={{ top: '30%', background: '#ef4444', border: '2px solid white' }} />
      <Handle type="source" position={Position.Left} id="probe-black" style={{ top: '70%', background: '#111827', border: '2px solid white' }} />
      <div className="multimeter-screen nodrag">
        {data.reading !== undefined ? data.reading : "0.00"} {data.mode === 'V' ? 'V' : data.mode === 'A' ? 'mA' : 'Ω'}
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <select value={data.mode || "V"} onChange={(e) => updateNodeData(id, { mode: e.target.value })} className="node-input nodrag" style={{ width: '90px' }}>
          <option value="V">Voltmeter (V)</option>
          <option value="A">Ammeter (mA)</option>
          <option value="Ohm">Ohmmeter (Ω)</option>
        </select>
      </div>
    </div>
  );
}

function OscilloscopeNode({ id, data, selected }) {
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} oscilloscope-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <Handle type="source" position={Position.Left} id="ch1" style={{ top: '30%', background: '#00d4ff' }} />
      <Handle type="source" position={Position.Left} id="gnd" style={{ top: '70%', background: '#111827' }} />
      <div className="oscilloscope-screen nodrag">
        <svg viewBox="0 0 100 40" className="osc-wave">
          <polyline points="0,20 10,20 15,10 25,30 35,20 50,20 60,20 65,10 75,30 85,20 100,20" fill="none" stroke="#00d4ff" strokeWidth="2" />
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
    </div>
  );
}

// Register custom node types
const nodeTypes = {
  battery: BatteryNode,
  resistor: ResistorNode,
  potentiometer: PotentiometerNode,
  capacitor: CapacitorNode,
  led: LEDNode,
  diode: DiodeNode,
  transistor: TransistorNode,
  switch: SwitchNode,
  motor: MotorNode,
  buzzer: BuzzerNode,
  junction: WireJunctionNode,
  multimeter: MultimeterNode,
  oscilloscope: OscilloscopeNode,
};

// ============================================
// DEFAULT CIRCUIT LAYOUT
// 3 default components arranged in a series layout
// ============================================

const defaultNodes = [
  {
    id: "battery-1",
    type: "battery",
    position: { x: 80, y: 200 },
    data: {
      label: "9V Battery",
      componentType: "battery",
      voltage: 9,
    },
  },
  {
    id: "resistor-1",
    type: "resistor",
    position: { x: 350, y: 100 },
    data: {
      label: "220Ω Resistor",
      componentType: "resistor",
      resistance: 220,
    },
  },
  {
    id: "led-1",
    type: "led",
    position: { x: 620, y: 200 },
    data: {
      label: "Red LED",
      componentType: "led",
      color: "Red",
    },
  },
];

const defaultEdges = [];

// ============================================
// COMPONENT PALETTE DEFINITIONS
// Items that can be dragged onto the canvas
// ============================================

const paletteItems = [
  // Power
  { type: "battery", label: "Battery", emoji: "🔋", voltage: 9, category: "power" },
  // Passive
  { type: "resistor", label: "Resistor", emoji: "⚡", resistance: 220, category: "passive" },
  { type: "potentiometer", label: "Potentiometer", emoji: "🎛️", wiperPercent: 50, maxResistance: 10000, category: "passive" },
  { type: "capacitor", label: "Capacitor", emoji: "🔵", capacitance: 100, capType: "elco", category: "passive" },
  // Semiconductors / Output
  { type: "diode", label: "Diode", emoji: "▶️", category: "output" },
  { type: "transistor", label: "Transistor", emoji: "⬛", transistorType: "npn", category: "output" },
  { type: "led", label: "LED", emoji: "💡", color: "Red", category: "output" },
  { type: "motor", label: "DC Motor", emoji: "⚙️", ratedVoltage: 5, category: "output" },
  { type: "buzzer", label: "Buzzer", emoji: "🔔", minVoltage: 3, category: "output" },
  // Control & Instruments
  { type: "switch", label: "Switch", emoji: "🔴", state: "open", category: "control" },
  { type: "multimeter", label: "Multimeter", emoji: "📟", mode: "V", category: "control" },
  { type: "oscilloscope", label: "Oscilloscope", emoji: "📉", category: "control" },
  // Wiring
  { type: "junction", label: "Junction", emoji: "⭕", category: "wiring" },
];

// Category keys for palette (labels come from i18n)
const paletteCategoryKeys = ["power", "passive", "output", "control", "wiring"];

// ============================================
// AI TUTOR RESPONSE PANEL
// Renders the structured JSON from the backend
// ============================================

function TutorPanel({ response, isLoading, t, onSuggestionClick }) {
  if (isLoading) {
    return (
      <div className="tutor-panel">
        <div className="tutor-header">
          <div className="tutor-avatar">⚡</div>
          <div>
            <div className="tutor-name">Sparky</div>
            <div className="tutor-role">{t.tutorRole}</div>
          </div>
        </div>
        <div className="tutor-body">
          <div className="response-card">
            <div className="card-header">
              <span className="card-icon">🔄</span>
              <span className="card-title">{t.analyzing}</span>
            </div>
            <div className="card-content">
              <div className="loading-shimmer" style={{ width: "90%" }}></div>
              <div className="loading-shimmer" style={{ width: "75%" }}></div>
              <div className="loading-shimmer" style={{ width: "60%" }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="tutor-panel">
        <div className="tutor-header">
          <div className="tutor-avatar">⚡</div>
          <div>
            <div className="tutor-name">Sparky</div>
            <div className="tutor-role">{t.tutorRole}</div>
          </div>
        </div>
        <div className="tutor-body">
          <div className="welcome-placeholder">
            <div className="welcome-emoji">🔬</div>
            <div className="welcome-title">{t.readyTitle}</div>
            <div className="welcome-text">
              {t.readyText}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-panel">
      <div className="tutor-header">
        <div className="tutor-avatar">⚡</div>
        <div>
          <div className="tutor-name">Sparky</div>
          <div className="tutor-role">{t.tutorRole}</div>
        </div>
      </div>
      <div className="tutor-body">
        {/* API Status Card */}
        <div className="response-card status-card" style={{ animationDelay: "0s" }}>
          <div className="card-header">
            <span className="card-icon">📡</span>
            <span className="card-title">{t.apiStatus}</span>
          </div>
          <div className="card-content">
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 12px",
                background:
                  response.api_status === "ACTIVE"
                    ? "rgba(16, 185, 129, 0.15)"
                    : "rgba(239, 68, 68, 0.15)",
                borderRadius: 999,
                fontSize: "0.78rem",
                fontWeight: 600,
                color:
                  response.api_status === "ACTIVE" ? "#10b981" : "#ef4444",
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background:
                    response.api_status === "ACTIVE" ? "#10b981" : "#ef4444",
                }}
              ></span>
              {response.api_status}
            </span>
          </div>
        </div>

        {/* Analysis Log Card */}
        {response.analysis_log && response.analysis_log.length > 0 && (
          <div className="response-card analysis-card" style={{ animationDelay: "0.1s" }}>
            <div className="card-header">
              <span className="card-icon">📊</span>
              <span className="card-title">{t.analysisLog}</span>
            </div>
            <div className="log-list">
              {response.analysis_log.map((log, i) => (
                <div key={i} className="log-item">
                  {log}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insights Card */}
        {response.ai_insights && (
          <div className="response-card insight-card" style={{ animationDelay: "0.2s" }}>
            <div className="card-header">
              <span className="card-icon">🧠</span>
              <span className="card-title">{t.aiInsights}</span>
            </div>
            <div className="card-content">
              {/* Greeting */}
              <div className="insight-section">
                <div className="insight-label">{t.greeting}</div>
                <div className="insight-text">
                  {response.ai_insights.greeting}
                </div>
              </div>

              {/* Explanation */}
              <div className="insight-section">
                <div className="insight-label">{t.explanation}</div>
                <div className="insight-text">
                  {response.ai_insights.explanation}
                </div>
              </div>

              {/* Hint */}
              <div className="insight-section">
                <div className="insight-label">{t.hint}</div>
                <div className="insight-text">{response.ai_insights.hint}</div>
              </div>

              {/* Suggestion Button */}
              {response.ai_insights.suggestion_button_text && (
                <button className="btn-suggestion" onClick={onSuggestionClick}>
                  {response.ai_insights.suggestion_button_text}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Log Card */}
        {response.error_log && response.error_log.length > 0 && (
          <div className="response-card error-card" style={{ animationDelay: "0.3s" }}>
            <div className="card-header">
              <span className="card-icon">⚠️</span>
              <span className="card-title">{t.errorLog}</span>
            </div>
            <div className="log-list">
              {response.error_log.map((err, i) => (
                <div key={i} className="log-item" style={{ color: "#f87171" }}>
                  {err}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MAIN APP COMPONENT
// ============================================

let nodeIdCounter = 4; // Start after default 3 nodes

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedCats, setCollapsedCats] = useState({});
  const [lang, setLang] = useState("id");
  const [highlightSidebar, setHighlightSidebar] = useState(false);
  const [highlightTutor, setHighlightTutor] = useState(false);
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Current translations
  const t = i18n[lang];

  // Handle suggestion button click
  const handleSuggestionClick = () => {
    // Make sure sidebar is open
    setSidebarOpen(true);
    // Add a quick pulse effect to draw attention to the components
    setHighlightSidebar(true);
    setTimeout(() => setHighlightSidebar(false), 1500);
  };

  // Handle error badge click on a node
  const handleNodeErrorClick = (e) => {
    e.stopPropagation(); // prevent selecting the node behind the badge
    // Highlight the tutor panel so the user knows where the explanation is
    setHighlightTutor(true);
    setTimeout(() => setHighlightTutor(false), 1500);
  };

  // Category labels mapped from i18n
  const catLabels = {
    power: t.catPower,
    passive: t.catPassive,
    output: t.catOutput,
    control: t.catControl,
    wiring: t.catWiring,
  };

  // Toggle a category's collapsed state
  const toggleCategory = (catKey) => {
    setCollapsedCats((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  // Connect nodes when user drags an edge
  const onConnect = useCallback(
    (params) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#00d4ff", strokeWidth: 2.5 },
          },
          eds
        )
      );
    },
    [setEdges]
  );

  // Handle double clicking an edge to delete it
  const onEdgeDoubleClick = useCallback((event, edge) => {
    event.stopPropagation();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
  }, [setEdges]);

  // Handle drag from palette
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();

      const dataStr = event.dataTransfer.getData("application/reactflow");
      if (!dataStr || !reactFlowInstance) return;

      const data = JSON.parse(dataStr);
      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      const newId = `${data.type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const newNode = {
        id: newId,
        type: data.type,
        position,
        data: {
          label: data.label,
          componentType: data.type,
          ...(data.voltage !== undefined && { voltage: data.voltage }),
          ...(data.resistance !== undefined && { resistance: data.resistance }),
          ...(data.capacitance !== undefined && { capacitance: data.capacitance }),
          ...(data.color && { color: data.color }),
          ...(data.state && { state: data.state }),
          ...(data.ratedVoltage !== undefined && { ratedVoltage: data.ratedVoltage }),
          ...(data.minVoltage !== undefined && { minVoltage: data.minVoltage }),
        },
      };

      setNodes((nds) => [...nds, newNode]);
    },
    [reactFlowInstance, setNodes]
  );

  // Drag start handler for palette items
  const onDragStart = (event, item) => {
    event.dataTransfer.setData("application/reactflow", JSON.stringify(item));
    event.dataTransfer.effectAllowed = "move";
  };

  // Run Simulation - send circuit to backend
  const handleSimulate = async () => {
    setIsLoading(true);
    setResponse(null);

    try {
      const payload = {
        lang,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type,
          data: n.data,
          position: n.position,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle,
          targetHandle: e.targetHandle,
        })),
      };

      const res = await fetch(`${API_BASE}/api/evaluate-circuit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      setResponse(data);

      // Map error states to the nodes
      setNodes((nds) =>
        nds.map((n) => {
          const isCircuitSuccess = data.error_log && data.error_log.length === 0;
          const hasErr = data.error_nodes && data.error_nodes[n.id] !== undefined;
          return {
            ...n,
            data: {
              ...n.data,
              hasError: hasErr,
              errorMessage: hasErr ? data.error_nodes[n.id] : null,
              isSuccess: !hasErr && isCircuitSuccess,
            },
          };
        })
      );
    } catch (error) {
      setResponse({
        api_status: "ERROR",
        analysis_log: [],
        ai_insights: null,
        error_log: [
          `❌ ${t.backendError}`,
          `Details: ${error.message}`,
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset circuit to defaults
  const handleReset = () => {
    // Clear errors from nodes
    setNodes(defaultNodes.map(n => ({...n, data: {...n.data, hasError: false, errorMessage: null, isSuccess: false}})));
    setEdges([]);
    setResponse(null);
    nodeIdCounter = 4;
  };

  // Inject the error click handler into every node's data before passing to ReactFlow
  const nodesWithHandlers = nodes.map(n => ({
    ...n,
    data: { ...n.data, onNodeErrorClick: handleNodeErrorClick }
  }));

  // Memoize node types to prevent re-renders
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div className="app-container">
      {/* ---- Header ---- */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">⚡</div>
          <div>
            <div className="header-title">Electronica Simulator</div>
            <div className="header-subtitle">
              {t.headerSubtitle}
            </div>
          </div>
        </div>
        <div className="header-status">
          <button
            className="lang-toggle"
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
          </button>
          <button
            className="lang-toggle"
            onClick={() => setLang((l) => (l === "en" ? "id" : "en"))}
            title={lang === "en" ? "Ganti ke Bahasa Indonesia" : "Switch to English"}
          >
            <span className={`lang-option ${lang === "en" ? "active" : ""}`}>EN</span>
            <span className="lang-divider">/</span>
            <span className={`lang-option ${lang === "id" ? "active" : ""}`}>ID</span>
          </button>
          <div className="status-badge">
            <span className="status-dot"></span>
            {t.systemOnline}
          </div>
        </div>
      </header>

      {/* ---- Main 3-Column Layout ---- */}
      <div className="main-content">
        {/* LEFT: Component Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? "open" : "collapsed"} ${highlightSidebar ? "highlight-pulse" : ""}`}>
          <div className="sidebar-header">
            {sidebarOpen && <span className="sidebar-title">{t.components}</span>}
            <button
              className="sidebar-toggle"
              onClick={() => setSidebarOpen((v) => !v)}
              title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            >
              {sidebarOpen ? "◀" : "▶"}
            </button>
          </div>
          {sidebarOpen && (
            <div className="sidebar-body">
              {paletteCategoryKeys.map((catKey) => {
                const catLabel = catLabels[catKey];
                const items = paletteItems.filter((p) => p.category === catKey);
                if (items.length === 0) return null;
                const isCollapsed = collapsedCats[catKey];
                return (
                  <div key={catKey} className="sidebar-category">
                    <button
                      className="category-header"
                      onClick={() => toggleCategory(catKey)}
                    >
                      <span className="category-label">{catLabel}</span>
                      <span className={`category-chevron ${isCollapsed ? "collapsed" : ""}`}>
                        ▾
                      </span>
                    </button>
                    {!isCollapsed && (
                      <div className="category-items">
                        {items.map((item, i) => (
                          <div
                            key={`${catKey}-${i}`}
                            className="sidebar-item"
                            draggable
                            onDragStart={(e) => onDragStart(e, item)}
                          >
                            <span className="sidebar-item-icon">{item.emoji}</span>
                            <span className="sidebar-item-label">{item.label}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </aside>

        {/* CENTER: Circuit Canvas */}
        <div className="canvas-panel">
          {/* Canvas Toolbar */}
          <div className="canvas-toolbar">
            <span className="toolbar-title">
              {t.workspace} — {nodes.length} {t.componentCount}, {edges.length}{" "}
              {t.wireCount}
            </span>
            <div className="toolbar-actions">
              <button className="btn-secondary" onClick={handleReset}>
                {t.reset}
              </button>
            </div>
          </div>

          {/* React Flow Canvas */}
          <div className="canvas-wrapper" ref={reactFlowWrapper}>
            <ReactFlow
              nodes={nodesWithHandlers}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              nodeTypes={memoizedNodeTypes}
              connectionMode={ConnectionMode.Loose}
              fitView
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                animated: true,
                type: "smoothstep",
                style: { stroke: "#00d4ff", strokeWidth: 2.5 },
              }}
            >
              <Background gap={20} size={1} />
              <Controls />
              <MiniMap nodeBorderRadius={8} />
            </ReactFlow>
          </div>

          {/* Action Bar */}
          <div className="action-bar">
            <button
              id="btn-simulate"
              className={`btn-simulate ${isLoading ? "loading" : ""}`}
              onClick={handleSimulate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  {t.analyzing}
                </>
              ) : (
                <>
                  <span className="btn-icon">🚀</span>
                  {t.simulate}
                </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: AI Tutor Panel */}
        <div className={`tutor-wrapper ${highlightTutor ? "highlight-pulse" : ""}`}>
          <TutorPanel response={response} isLoading={isLoading} t={t} onSuggestionClick={handleSuggestionClick} />
        </div>
      </div>
    </div>
  );
}
