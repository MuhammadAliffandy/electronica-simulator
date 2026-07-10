import { useReactFlow } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";
import { TwoWayHandles } from "../../atoms/TwoWayHandles";

export function SwitchNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isOn = data.state === "closed";
  
  const toggleSwitch = () => {
    updateNodeData(id, { state: isOn ? "open" : "closed" });
    if (window.triggerSimulation) window.triggerSimulation();
  };

  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} switch-node ${isOn ? "switch-closed" : "switch-open"} ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <TwoWayHandles />
      {/* SPST Switch SVG */}
      <div className="nodrag switch-svg-wrap" onClick={toggleSwitch} title={isOn ? "Klik untuk buka (OFF)" : "Klik untuk tutup (ON)"}>
        <svg width="72" height="36" viewBox="0 0 72 36">
          {/* Left wire + terminal dot */}
          <line x1="0" y1="18" x2="16" y2="18" stroke={isOn ? "#10b981" : "#94a3b8"} strokeWidth="2.5"/>
          <circle cx="16" cy="18" r="3.5" fill={isOn ? "#10b981" : "#94a3b8"}/>
          {/* Right wire + terminal dot */}
          <line x1="56" y1="18" x2="72" y2="18" stroke={isOn ? "#10b981" : "#94a3b8"} strokeWidth="2.5"/>
          <circle cx="56" cy="18" r="3.5" fill={isOn ? "#10b981" : "#94a3b8"}/>
          {/* Lever */}
          {isOn ? (
            /* Closed — horizontal lever */
            <line x1="16" y1="18" x2="56" y2="18" stroke="#10b981" strokeWidth="3" strokeLinecap="round"/>
          ) : (
            /* Open — lever angled up */
            <line x1="16" y1="18" x2="50" y2="6" stroke="#f59e0b" strokeWidth="3" strokeLinecap="round"/>
          )}
          {/* Arrow indicator when open */}
          {!isOn && (
            <polygon points="50,6 44,8 47,14" fill="#f59e0b" opacity="0.8"/>
          )}
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value" style={{ fontWeight: 'bold', color: isOn ? '#10b981' : '#f59e0b' }}>
        {isOn ? "⬛ CLOSED (ON)" : "⬜ OPEN (OFF)"}
      </div>
      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '2px' }}>klik untuk toggle</div>
    </div>
  );
}
