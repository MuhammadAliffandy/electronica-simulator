import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function BatteryNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isAC = data.sourceType === "ac";
  return (
    <BaseNode id={id} data={data} selected={selected} className="battery-node">      {/* SVG voltage source symbol */}
      <div className="vsource-symbol">
        {isAC ? (
          <svg viewBox="0 0 48 48" width="48" height="48">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none"/>
            {/* Sine wave */}
            <path d="M 10 24 C 14 14, 18 14, 24 24 C 30 34, 34 34, 38 24" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          </svg>
        ) : (
          <svg viewBox="0 0 48 48" width="48" height="48">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2.5" fill="none"/>
            {/* + symbol */}
            <line x1="24" y1="12" x2="24" y2="22" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            <line x1="19" y1="17" x2="29" y2="17" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
            {/* – symbol */}
            <line x1="19" y1="31" x2="29" y2="31" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        )}
      </div>
      <div className="pin-label pin-left" style={{ color: '#ef4444', fontSize: '1.2rem', left: '10px', fontWeight: 'bold' }}>+</div>
      <div className="pin-label pin-right" style={{ color: '#3b82f6', fontSize: '1.4rem', right: '10px', fontWeight: 'bold' }}>-</div>
      <div className="node-label">{data.label}</div>
      <div className="node-value" style={{ marginBottom: "4px" }}>
        <select value={data.sourceType || "dc"} onChange={(e) => updateNodeData(id, { sourceType: e.target.value, label: e.target.value === 'ac' ? 'AC Source' : 'DC Source' })} className="node-input nodrag" style={{ width: '60px' }}>
          <option value="dc">DC</option>
          <option value="ac">AC</option>
        </select>
      </div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.voltage !== undefined ? data.voltage : 0} 
          onChange={(e) => updateNodeData(id, { voltage: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        V
      </div>
      {isAC && (
        <div className="node-value" style={{ marginTop: '4px' }}>
          <input 
            type="number" 
            value={data.frequency !== undefined ? data.frequency : 50} 
            onChange={(e) => updateNodeData(id, { frequency: e.target.value === '' ? '' : Number(e.target.value) })}
            className="node-input nodrag"
          />
          Hz
        </div>
      )}
    </BaseNode>
  );
}
