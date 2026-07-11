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
  useViewport,
  ConnectionMode,
  getSmoothStepPath,
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
    catActive: "⚡ Active",
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
    readyText: 'Connect your circuit components on the canvas, then hit "Run Simulation & Ask AI" to get real-time feedback from ELVO AI, your AI tutor!',
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
    catActive: "⚡ Komponen Aktif",
    catPassive: "📐 Komponen Pasif",
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
    readyText: 'Hubungkan komponen rangkaian di kanvas, lalu tekan "Jalankan Simulasi & Tanya AI" untuk mendapat umpan balik langsung dari ELVO AI, tutor AI kamu!',
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

import { BatteryNode } from "./components/organisms/Nodes/BatteryNode";
import { ResistorNode } from "./components/organisms/Nodes/ResistorNode";
import { PotentiometerNode } from "./components/organisms/Nodes/PotentiometerNode";
import { CapacitorNode } from "./components/organisms/Nodes/CapacitorNode";
import { InductorNode } from "./components/organisms/Nodes/InductorNode";
import { LEDNode } from "./components/organisms/Nodes/LEDNode";
import { DiodeNode } from "./components/organisms/Nodes/DiodeNode";
import { TransistorNode } from "./components/organisms/Nodes/TransistorNode";
import { SwitchNode } from "./components/organisms/Nodes/SwitchNode";
import { MotorNode } from "./components/organisms/Nodes/MotorNode";
import { BuzzerNode } from "./components/organisms/Nodes/BuzzerNode";
import { WireJunctionNode } from "./components/organisms/Nodes/WireJunctionNode";
import { MultimeterNode } from "./components/organisms/Nodes/MultimeterNode";
import { OscilloscopeNode } from "./components/organisms/Nodes/OscilloscopeNode";
import { JumpEdge } from "./components/atoms/JumpEdge";
import { TutorPanel } from "./components/organisms/TutorPanel";
import { ComponentSidebar, paletteItems, paletteCategoryKeys } from "./components/organisms/ComponentSidebar";
import { HumpOverlay } from "./components/organisms/HumpOverlay";

// Register custom node types
const nodeTypes = {
  battery: BatteryNode,
  resistor: ResistorNode,
  potentiometer: PotentiometerNode,
  capacitor: CapacitorNode,
  inductor: InductorNode,
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

const edgeTypes = {
  jumpEdge: JumpEdge,
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
      label: "9V DC Source",
      componentType: "battery",
      voltage: 9,
      sourceType: "dc",
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
export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [intersections, setIntersections] = useState([]);
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
    active: t.catActive,
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
            type: "jumpEdge",
            className: `jump-edge ${isRunning ? "animated reverse-animation" : ""}`,
            style: { stroke: "#00d4ff", borderRadius: 0 },
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
          ...(data.sourceType && { sourceType: data.sourceType }),
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
  // Calculate wire intersections for humps
  useEffect(() => {
    const timer = setTimeout(() => {
      const paths = document.querySelectorAll('.react-flow__edge-path-inner');
      const segs = [];
      paths.forEach(p => {
        const d = p.getAttribute('d');
        if (!d) return;
        const parts = d.match(/[ML]\s*[-0-9.]+[,\s]+[-0-9.]+/g);
        if (!parts) return;
        let prevX, prevY;
        parts.forEach(part => {
          const cleanPart = part.replace(/[ML]/g, ' ').trim().replace(/,/g, ' ');
          const tokens = cleanPart.split(/\s+/);
          if (tokens.length < 2) return;
          const px = parseFloat(tokens[tokens.length-2]);
          const py = parseFloat(tokens[tokens.length-1]);
          if (part.includes('M')) {
            prevX = px; prevY = py;
          } else if (part.includes('L')) {
            segs.push({ x1: prevX, y1: prevY, x2: px, y2: py });
            prevX = px; prevY = py;
          }
        });
      });

      const horizontals = [];
      const verticals = [];
      segs.forEach(s => {
        if (Math.abs(s.y1 - s.y2) < 0.5) horizontals.push({ y: s.y1, xMin: Math.min(s.x1, s.x2), xMax: Math.max(s.x1, s.x2) });
        else if (Math.abs(s.x1 - s.x2) < 0.5) verticals.push({ x: s.x1, yMin: Math.min(s.y1, s.y2), yMax: Math.max(s.y1, s.y2) });
      });

      const ints = [];
      horizontals.forEach(h => {
        verticals.forEach(v => {
          if (v.x > h.xMin + 1 && v.x < h.xMax - 1 && h.y > v.yMin + 1 && h.y < v.yMax - 1) {
            ints.push({ x: v.x, y: h.y });
          }
        });
      });
      
      // Remove duplicates
      const uniqueInts = [];
      const seen = new Set();
      ints.forEach(int => {
        const key = `${Math.round(int.x)},${Math.round(int.y)}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueInts.push(int);
        }
      });
      
      setIntersections(uniqueInts);
    }, 50);
    return () => clearTimeout(timer);
  }, [nodes, edges]);

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
              ...(data.nodes_state && data.nodes_state[n.id] ? data.nodes_state[n.id] : {})
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
      setIsRunning(true);
    }
  };

  const simulateRef = useRef(handleSimulate);
  useEffect(() => {
    simulateRef.current = handleSimulate;
  });

  // Manual trigger for real-time controls (e.g., potentiometer)
  useEffect(() => {
    window.triggerSimulation = () => {
      if (isRunning) {
        // debounce slightly to prevent spamming
        clearTimeout(window.simTimer);
        window.simTimer = setTimeout(() => {
          simulateRef.current();
        }, 100);
      }
    };
  }, [isRunning]);

  // Update edge animation state when isRunning changes
  useEffect(() => {
    setEdges((eds) => 
      eds.map((e) => ({
        ...e,
        className: `jump-edge ${isRunning ? "animated reverse-animation" : ""}`,
      }))
    );
  }, [isRunning]);

  const handleStop = () => {
    setIsRunning(false);
    setResponse(null);
    setNodes((nds) =>
      nds.map((n) => ({
        ...n,
        data: {
          ...n.data,
          hasError: false,
          errorMessage: null,
          isSuccess: false,
          ledState: "off",
        },
      }))
    );
  };

  // Reset circuit — kosongkan kanvas sepenuhnya
  const handleReset = () => {
    handleStop();
    setNodes([]);
    setEdges([]);
    setResponse(null);
    setIntersections([]);
    nodeIdCounter = 1;
  };

  // Inject the error click handler into every node's data before passing to ReactFlow
  const nodesWithHandlers = nodes.map(n => ({
    ...n,
    data: { ...n.data, onNodeErrorClick: handleNodeErrorClick }
  }));

  // Memoize node types to prevent re-renders
  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <div className={`app-container ${isRunning ? "is-running" : ""}`}>
      {/* ---- Header ---- */}
      <header className="app-header">
        <div className="header-brand">
          <div className="header-logo">
            <img src="/elvo-logo.jpg" alt="ELVO Logo" />
          </div>
          <div>
            <div className="header-title">ELVO</div>
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
        <ComponentSidebar
          t={t}
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          highlightSidebar={highlightSidebar}
          catLabels={catLabels}
          collapsedCats={collapsedCats}
          toggleCategory={toggleCategory}
          onDragStart={onDragStart}
        />

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
              edgeTypes={edgeTypes}
              connectionMode={ConnectionMode.Loose}
              connectionRadius={40}
              fitView
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{
                type: "jumpEdge",
                className: "jump-edge",
                style: { stroke: "#00d4ff", borderRadius: 0 },
              }}
            >
              <Background gap={20} size={1} />
              <HumpOverlay intersections={intersections} isRunning={isRunning} />
              <Controls />
              <MiniMap nodeBorderRadius={8} />
            </ReactFlow>
          </div>

          {/* Action Bar */}
          <div className="action-bar">
            <button
              id="btn-simulate"
              className={`btn-simulate ${isLoading ? "loading" : ""} ${isRunning ? "btn-stop" : ""}`}
              onClick={isRunning ? handleStop : handleSimulate}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <div className="spinner"></div>
                  {t.analyzing}
                </>
              ) : isRunning ? (
                <>
                  <span className="btn-icon">⏹</span>
                  STOP SIMULATION
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
