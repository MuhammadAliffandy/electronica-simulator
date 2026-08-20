import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { ComponentSidebar } from "./components/organisms/ComponentSidebar";
import { TutorPanel } from "./components/organisms/TutorPanel";

// Import all nodes
import { BatteryNode } from "./components/organisms/Nodes/BatteryNode";
import { ResistorNode } from "./components/organisms/Nodes/ResistorNode";
import { DiodeNode } from "./components/organisms/Nodes/DiodeNode";
import { LEDNode } from "./components/organisms/Nodes/LEDNode";
import { CapacitorNode } from "./components/organisms/Nodes/CapacitorNode";
import { InductorNode } from "./components/organisms/Nodes/InductorNode";
import { MotorNode } from "./components/organisms/Nodes/MotorNode";
import { BuzzerNode } from "./components/organisms/Nodes/BuzzerNode";
import { SwitchNode } from "./components/organisms/Nodes/SwitchNode";
import { PotentiometerNode } from "./components/organisms/Nodes/PotentiometerNode";
import { MultimeterNode } from "./components/organisms/Nodes/MultimeterNode";
import { OscilloscopeNode } from "./components/organisms/Nodes/OscilloscopeNode";
import { TransistorNode } from "./components/organisms/Nodes/TransistorNode";
import { WireJunctionNode } from "./components/organisms/Nodes/WireJunctionNode";
import { SettingsModal } from "./components/organisms/SettingsModal";
import { initLocalAI, chatLocalAI } from "./services/localAiService";
import elvoLogo from "./assets/elvo-logo.jpg";

const nodeTypes = {
  battery: BatteryNode,
  resistor: ResistorNode,
  diode: DiodeNode,
  led: LEDNode,
  capacitor: CapacitorNode,
  inductor: InductorNode,
  motor: MotorNode,
  buzzer: BuzzerNode,
  switch: SwitchNode,
  potentiometer: PotentiometerNode,
  multimeter: MultimeterNode,
  oscilloscope: OscilloscopeNode,
  transistor: TransistorNode,
  junction: WireJunctionNode,
};

const defaultNodes = [
  {
    id: "battery-1",
    type: "battery",
    position: { x: 150, y: 150 },
    data: {
      label: "DC Source",
      componentType: "battery",
      voltage: 0,
      sourceType: "dc",
    },
  },
  {
    id: "resistor-1",
    type: "resistor",
    position: { x: 350, y: 100 },
    data: {
      label: "Resistor",
      componentType: "resistor",
      resistance: 0,
    },
  },
];

let nodeIdCounter = 100;

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState(defaultNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [response, setResponse] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Halo! Aku ELVO AI, rekan belajarmu di lab elektronik ini. Ada yang bisa aku bantu atau mari kita mulai merangkai sirkuit!' }
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isChatLoading, setIsChatLoading] = useState(false);

  const [leftWidth, setLeftWidth] = useState(260);
  const [isResizingLeft, setIsResizingLeft] = useState(false);
  const [rightWidth, setRightWidth] = useState(320);
  const [isResizingRight, setIsResizingRight] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizingLeft) {
        setLeftWidth(Math.max(200, Math.min(e.clientX, 500)));
      }
      if (isResizingRight) {
        setRightWidth(Math.max(250, Math.min(window.innerWidth - e.clientX, 600)));
      }
    };
    const handleMouseUp = () => {
      setIsResizingLeft(false);
      setIsResizingRight(false);
    };

    if (isResizingLeft || isResizingRight) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingLeft, isResizingRight]);

  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  // Settings & Local AI State
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiMode, setAiMode] = useState('cloud'); // 'cloud' | 'local'
  const [localAiProgress, setLocalAiProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  const takeSnapshot = useCallback(() => {
    setPast((p) => [
      ...p,
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
    ]);
    setFuture([]);
  }, [nodes, edges]);

  const handleUndo = useCallback(() => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
      ...f,
    ]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
  }, [past, nodes, edges, setNodes, setEdges]);

  const handleRedo = useCallback(() => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [
      ...p,
      { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) },
    ]);
    setNodes(next.nodes);
    setEdges(next.edges);
  }, [future, nodes, edges, setNodes, setEdges]);

  const onNodeDragStop = useCallback(() => {
    takeSnapshot();
  }, [takeSnapshot]);

  // Keyboard shortcuts: Ctrl+Z = Undo, Ctrl+Y / Ctrl+Shift+Z = Redo
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsedCats, setCollapsedCats] = useState({});
  const reactFlowWrapper = useRef(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    window.triggerSimulation = () => {
      if (isRunning) handleSimulate(true);
    };
  });

  const toggleCategory = (catKey) => {
    setCollapsedCats((prev) => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const onConnect = useCallback(
    (params) => {
      takeSnapshot();
      setEdges((eds) => addEdge({ ...params, animated: isRunning, style: { stroke: 'var(--accent-cyan)', strokeWidth: 2 } }, eds));
      if (isRunning) {
        setTimeout(() => {
          if (window.triggerSimulation) window.triggerSimulation();
        }, 50);
      }
    },
    [setEdges, isRunning, takeSnapshot]
  );

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  // Default parameter values for every component type.
  // All numeric values start at 0 — user sets them manually.
  const componentDefaults = {
    battery:        { label: 'DC Source', voltage: 0, sourceType: 'dc' },
    resistor:       { label: 'Resistor', resistance: 0 },
    capacitor:      { label: 'Capacitor', capacitance: 0 },
    inductor:       { label: 'Inductor', inductance: 0 },
    potentiometer:  { label: 'Potentiometer', resistance: 0, position: 0 },
    diode:          { label: 'Diode', vf: 0 },
    led:            { label: 'LED', vf: 0 },
    transistor:     { label: 'Transistor', hfe: 0 },
    switch:         { label: 'Switch', state: 'open' },
    multimeter:     { label: 'Multimeter', mode: 'V' },
    oscilloscope:   { label: 'Oscilloscope' },
    buzzer:         { label: 'Buzzer' },
    motor:          { label: 'DC Motor' },
    junction:       { label: 'Junction' },
  };

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      const defaultDataStr = event.dataTransfer.getData("application/reactflow-data");
      if (typeof type === "undefined" || !type || !reactFlowInstance) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX,
        y: event.clientY,
      });

      let parsedData = {};
      try {
        parsedData = defaultDataStr ? JSON.parse(defaultDataStr) : {};
      } catch (e) { }

      // Merge: component defaults → sidebar drag data → componentType
      const defaults = componentDefaults[type] || {};

      const newNode = {
        id: `${type}-${nodeIdCounter++}`,
        type,
        position,
        data: {
          ...defaults,
          ...parsedData,
          componentType: type,
        },
      };

      takeSnapshot();
      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes, takeSnapshot]
  );

  const onEdgeDoubleClick = useCallback((event, edge) => {
    takeSnapshot();
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    if (isRunning) {
      setTimeout(() => {
        if (window.triggerSimulation) window.triggerSimulation();
      }, 50);
    }
  }, [setEdges, isRunning, takeSnapshot]);

  const handleSimulate = async (silentParam = false) => {
    const silent = typeof silentParam === 'boolean' ? silentParam : false;
    setIsLoading(!silent);
    setIsRunning(true);

    // Animate edges
    setEdges(eds => eds.map(e => ({ ...e, animated: true })));

    try {
      const res = await fetch("http://localhost:3001/api/evaluate-circuit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nodes, edges, lang: "id" }),
      });
      const data = await res.json();
      setResponse(data);

      if (!silent && (data.ai_insights || data.analysis_log)) {
        let circuitMessage = "";
        
        if (data.analysis_log && data.analysis_log.length > 0) {
          circuitMessage += data.analysis_log.join('\n') + '\n\n';
        }
        
        if (data.ai_insights) {
          circuitMessage += `ELVO AI ANALYSIS:\n${data.ai_insights.explanation}\n\n[HINT]: ${data.ai_insights.hint}`;
        }
        
        setMessages(prev => [...prev, { role: 'assistant', isSystem: true, content: circuitMessage }]);
      }

      if (data.nodes_state) {
        setNodes((nds) =>
          nds.map((n) => {
            let newData = { ...n.data };
            if (data.nodes_state && data.nodes_state[n.id]) {
              newData = {
                ...newData,
                ...data.nodes_state[n.id],
                isSuccess: data.api_status === "ACTIVE",
              };
            }
            if (data.error_nodes && data.error_nodes[n.id]) {
              newData = {
                ...newData,
                hasError: true,
                errorMessage: data.error_nodes[n.id]
              };
            } else {
              newData.hasError = false;
              newData.errorMessage = null;
            }
            return { ...n, data: newData };
          })
        );
      }
    } catch (err) {
      console.error(err);
      alert("Simulation failed. Ensure backend is running.");
      setIsRunning(false);
      setEdges(eds => eds.map(e => ({ ...e, animated: false })));
    }
    setIsLoading(false);
  };

  const handleStop = () => {
    setIsRunning(false);
    setEdges(eds => eds.map(e => ({ ...e, animated: false })));
    setNodes(nds => nds.map(n => {
      const { isSuccess, hasError, errorMessage, ledState, brightness, reading, ...restData } = n.data;
      return { ...n, data: restData };
    }));
    setResponse(null);
  };

  const handleDownloadLocalAi = async () => {
    setIsDownloading(true);
    try {
      await initLocalAI((progress) => {
        // progress is usually between 0 and 1
        // We will parse it to percentage if it provides a text or number
        if (typeof progress === 'number') {
           setLocalAiProgress(progress * 100);
        } else if (progress?.progress !== undefined) {
           setLocalAiProgress(progress.progress * 100);
        }
      });
      setLocalAiProgress(100);
    } catch (err) {
      console.error(err);
      alert("Failed to initialize Local AI Engine. Ensure your browser supports WebGPU.");
    }
    setIsDownloading(false);
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;
    const newMessages = [...messages, { role: 'user', content: chatInput }];
    setMessages(newMessages);
    setChatInput("");
    setIsChatLoading(true);
    try {
      const circuitCtx = response ? { ...response } : {};
      circuitCtx.current_nodes = nodes.map(n => ({ id: n.id, type: n.type, data: n.data }));
      circuitCtx.current_edges = edges.map(e => ({ source: e.source, target: e.target }));

      if (aiMode === 'local') {
        // Run completely offline in the browser via WebLLM
        const localData = await chatLocalAI(newMessages, circuitCtx);
        setMessages([...newMessages, localData]);
      } else {
        // Run via Node Backend / Cloud
        const res = await fetch("http://localhost:3001/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages, circuitContext: circuitCtx, lang: "id" }),
        });
        const data = await res.json();
        setMessages([...newMessages, data]);
      }
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: 'assistant', content: 'Maaf, aku sedang tidak bisa merespons saat ini. (Pastikan AI Engine sudah siap atau server menyala)' }]);
    }
    setIsChatLoading(false);
  };

  const handleSave = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "circuit.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed.nodes && parsed.edges) {
          setNodes(parsed.nodes);
          setEdges(parsed.edges);
        } else {
          alert("Invalid circuit file format.");
        }
      } catch (err) {
        alert("Error parsing file.");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // Reset input
  };

  const handleClear = () => {
    if (window.confirm("Yakin ingin menghapus seluruh sirkuit?")) {
      takeSnapshot();
      setNodes([]);
      setEdges([]);
      setResponse(null);
    }
  };

  const handleReset = () => {
    if (window.confirm("Reset sirkuit ke kondisi awal?")) {
      takeSnapshot();
      setNodes(defaultNodes);
      setEdges([]);
      setResponse(null);
      setIsRunning(false);
    }
  };

  const memoizedNodeTypes = useMemo(() => nodeTypes, []);

  return (
    <ReactFlowProvider>
    <div className="app-wrapper">
      <div className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <div className="topbar-logo">
              <img src={elvoLogo} alt="ELVO Logo" />
            </div>
            <div className="topbar-title">ELVO Simulator</div>
          </div>
          <div className="topbar-menu">
            <div className="dropdown">
              <span>File</span>
              <div className="dropdown-content">
                <div onClick={handleSave}>Save Circuit</div>
                <div>
                  <label htmlFor="load-circuit" style={{ cursor: 'pointer' }}>Load Circuit</label>
                  <input type="file" id="load-circuit" accept=".json" style={{ display: 'none' }} onChange={handleLoad} />
                </div>
              </div>
            </div>
            <div className="dropdown">
              <span>Edit</span>
              <div className="dropdown-content">
                <div onClick={handleUndo} style={{ color: past.length === 0 ? 'var(--text-muted)' : 'inherit', pointerEvents: past.length === 0 ? 'none' : 'auto' }}>Undo (Ctrl+Z)</div>
                <div onClick={handleRedo} style={{ color: future.length === 0 ? 'var(--text-muted)' : 'inherit', pointerEvents: future.length === 0 ? 'none' : 'auto' }}>Redo (Ctrl+Y)</div>
                <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0' }} />
                <div onClick={handleReset}>Reset to Default</div>
                <div onClick={handleClear}>Clear Canvas</div>
              </div>
            </div>
            <span onClick={() => setIsSettingsOpen(true)}>Settings</span>
            <span onClick={handleSimulate}>Simulate</span>
          </div>
        </div>
        <div className="topbar-right" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span
            className="topbar-icon"
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', color: 'var(--text-main)' }}
            onClick={() => {
              const root = document.documentElement;
              const isLight = root.getAttribute('data-theme') === 'light';
              root.setAttribute('data-theme', isLight ? 'dark' : 'light');
            }}
            title="Toggle Theme"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20a10 10 0 0 0 0-20z" fill="currentColor" />
            </svg>
          </span>
        </div>
      </div>

      <div className="main-area">
        <div style={{ width: leftWidth, height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <ComponentSidebar
            sidebarOpen={sidebarOpen}
            setSidebarOpen={setSidebarOpen}
            collapsedCats={collapsedCats}
            toggleCategory={toggleCategory}
            onDragStart={(event, nodeType, nodeData) => {
              event.dataTransfer.setData("application/reactflow", nodeType);
              event.dataTransfer.setData("application/reactflow-data", JSON.stringify(nodeData));
              event.dataTransfer.effectAllowed = "move";
            }}
          />
        </div>

        <div className="resizer" onMouseDown={() => setIsResizingLeft(true)} />

        <div className="canvas-wrapper" ref={reactFlowWrapper}>
          <div className="canvas-overlay-top">
            X: 124.0 Y: 45.5 | Z-Zoom: 100%
          </div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeDragStop={onNodeDragStop}
            nodeTypes={memoizedNodeTypes}
            connectionMode="loose"
            defaultEdgeOptions={{ type: 'smoothstep' }}
            fitView
          >
            <Background color="var(--border-color)" gap={16} size={1} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                switch (node.type) {
                  case 'battery': return '#ef4444';
                  case 'resistor': return '#8b5cf6';
                  case 'capacitor': return '#3b82f6';
                  default: return 'var(--accent-cyan)';
                }
              }}
              nodeStrokeColor="var(--border-color)"
              nodeBorderRadius={4}
              maskColor="var(--bg-panel)"
              style={{ backgroundColor: 'var(--bg-base)', border: '1px solid var(--border-color)', borderRadius: '8px', overflow: 'hidden' }}
            />
          </ReactFlow>
          <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '12px', zIndex: 10 }}>
            {isRunning ? (
              <button
                className="canvas-run-btn"
                onClick={handleStop}
                style={{ position: 'relative', bottom: 'auto', right: 'auto', background: '#ef4444', borderColor: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}><rect x="6" y="6" width="12" height="12" rx="2"/></svg>
                STOP SIM
              </button>
            ) : (
              <button
                className="canvas-run-btn"
                onClick={() => handleSimulate(false)}
                style={{ position: 'relative', bottom: 'auto', right: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ marginRight: '6px' }}><path d="M8 5v14l11-7z"/></svg>
                RUN SIM
              </button>
            )}
            <button
              className="canvas-run-btn"
              onClick={handleReset}
              style={{ position: 'relative', bottom: 'auto', right: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Reset ke kondisi awal"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
              RESET
            </button>
          </div>
        </div>

        <div className="resizer" onMouseDown={() => setIsResizingRight(true)} />

        <div style={{ width: rightWidth, height: '100%', display: 'flex', flexDirection: 'column', flexShrink: 0, overflow: 'hidden' }}>
          <TutorPanel
            messages={messages}
            isChatLoading={isChatLoading}
            isSimulating={isLoading}
            onSendMessage={handleSendMessage}
            chatInput={chatInput}
            setChatInput={setChatInput}
          />
        </div>
      </div>

      <div className="status-bar">
        <div className="status-left">
          <div className="status-indicator"></div>
          <div>Solver: Steady State</div>
          <div>|</div>
          <div>Engine: SPICE-Ng</div>
        </div>
        <div>T: 0.000s</div>
      </div>
      
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)}
        aiMode={aiMode}
        setAiMode={setAiMode}
        localAiProgress={localAiProgress}
        onDownloadLocalAi={handleDownloadLocalAi}
        isDownloading={isDownloading}
      />
    </div>
    </ReactFlowProvider>
  );
}
