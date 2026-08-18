import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function BatteryNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isAC = data.sourceType === "ac";
  return (
    <BaseNode id={id} data={data} selected={selected} className="battery-node">      {/* Realistic voltage source symbol */}
      <div className="vsource-symbol" style={{ margin: "10px 0" }}>
        {isAC ? (
          <div style={{ width: '40px', height: '40px', margin: '0 auto', background: '#374151', borderRadius: '8px', border: '2px solid #9ca3af', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Wall plug holes */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '4px' }}>
              <div style={{ width: '6px', height: '12px', background: '#111827', borderRadius: '2px' }}></div>
              <div style={{ width: '6px', height: '12px', background: '#111827', borderRadius: '2px' }}></div>
            </div>
            <div style={{ width: '8px', height: '8px', background: '#111827', borderRadius: '50%' }}></div>
          </div>
        ) : (
          <div style={{ width: '64px', height: '24px', margin: '0 auto', display: 'flex', alignItems: 'center' }}>
            {/* Negative Terminal */}
            <div style={{ width: '4px', height: '16px', background: '#9ca3af', borderRadius: '2px 0 0 2px' }}></div>
            {/* Battery Body */}
            <div style={{ flex: 1, height: '100%', background: 'linear-gradient(to bottom, #1f2937 0%, #4b5563 50%, #1f2937 100%)', borderRadius: '2px', border: '1px solid #111827', display: 'flex', position: 'relative', overflow: 'hidden' }}>
               <div style={{ width: '25%', height: '100%', background: '#3b82f6', borderRight: '1px solid #111827' }}></div> {/* Blue negative side */}
               <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e5e7eb', fontSize: '10px', fontWeight: 'bold', textShadow: '1px 1px 0 #000' }}></div>
               <div style={{ width: '25%', height: '100%', background: '#ef4444', borderLeft: '1px solid #111827' }}></div> {/* Red positive side */}
            </div>
            {/* Positive Tip */}
            <div style={{ width: '6px', height: '12px', background: '#9ca3af', borderRadius: '0 3px 3px 0', border: '1px solid #4b5563', borderLeft: 'none' }}></div>
          </div>
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
          onChange={(e) => {
            updateNodeData(id, { voltage: e.target.value === '' ? '' : Number(e.target.value) });
            if (window.triggerSimulation) window.triggerSimulation();
          }}
          className="node-input nodrag"
        />
        V
      </div>
      {isAC && (
        <div className="node-value" style={{ marginTop: '4px' }}>
          <input 
            type="number" 
            value={data.frequency !== undefined ? data.frequency : 50} 
            onChange={(e) => {
              updateNodeData(id, { frequency: e.target.value === '' ? '' : Number(e.target.value) });
              if (window.triggerSimulation) window.triggerSimulation();
            }}
            className="node-input nodrag"
          />
          Hz
        </div>
      )}
    </BaseNode>
  );
}
