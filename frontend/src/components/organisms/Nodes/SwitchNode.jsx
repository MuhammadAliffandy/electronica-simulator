import { BaseNode } from "./BaseNode";
import { useReactFlow } from "@xyflow/react";

export function SwitchNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isOn = data.state === "closed";
  
  const toggleSwitch = () => {
    updateNodeData(id, { state: isOn ? "open" : "closed" });
    if (window.triggerSimulation) window.triggerSimulation();
  };

  return (
    <BaseNode id={id} data={data} selected={selected} className="switch-node">      {/* SPST Switch SVG */}
      <div className="switch-svg-wrap" title={isOn ? "ON" : "OFF"}>
        <svg width="72" height="36" viewBox="0 0 72 36">
          {/* Left wire + terminal dot */}
          <line x1="0" y1="18" x2="16" y2="18" stroke={isOn ? "#10b981" : "#94a3b8"} strokeWidth="2.5"/>
          <circle cx="16" cy="18" r="3" fill={isOn ? "#10b981" : "#94a3b8"} />
          
          {/* Right wire + terminal dot */}
          <line x1="56" y1="18" x2="72" y2="18" stroke={isOn ? "#10b981" : "#94a3b8"} strokeWidth="2.5"/>
          <circle cx="56" cy="18" r="3" fill={isOn ? "#10b981" : "#94a3b8"} />
          
          {/* The switch lever */}
          <line 
            x1="16" y1="18" 
            x2="56" y2={isOn ? "18" : "6"} 
            stroke={isOn ? "#10b981" : "#ef4444"} 
            strokeWidth="3" 
            strokeLinecap="round"
            style={{ transition: 'all 0.2s ease' }}
          />
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value" style={{ marginTop: '4px' }}>
        <button 
          className="node-input nodrag" 
          onClick={toggleSwitch}
          style={{ cursor: 'pointer', background: isOn ? '#10b981' : '#ef4444', color: '#fff', border: 'none', borderRadius: '4px', padding: '4px 8px', fontWeight: 'bold' }}
        >
          {isOn ? 'TURN OFF' : 'TURN ON'}
        </button>
      </div>
    </BaseNode>
  );
}
