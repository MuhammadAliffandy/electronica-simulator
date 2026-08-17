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
    <BaseNode id={id} data={data} selected={selected} className="switch-node">      {/* Realistic Slide Switch */}
      <div className="switch-visual" title={isOn ? "ON" : "OFF"} style={{ margin: "10px auto", cursor: "pointer" }} onClick={toggleSwitch}>
        {/* Metal casing */}
        <div style={{ width: '48px', height: '24px', margin: '0 auto', background: 'linear-gradient(to bottom, #d1d5db, #9ca3af)', borderRadius: '4px', border: '1px solid #4b5563', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.5)' }}>
          {/* Inner track */}
          <div style={{ width: '36px', height: '12px', background: '#111827', borderRadius: '2px', position: 'relative', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.8)' }}>
            {/* The plastic slider */}
            <div style={{ 
              width: '16px', height: '14px', background: 'linear-gradient(to bottom, #ef4444, #991b1b)', 
              borderRadius: '2px', position: 'absolute', top: '-1px', left: isOn ? '20px' : '0px',
              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)', border: '1px solid #450a0a',
              boxShadow: '0 1px 2px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.3)'
            }}>
               {/* Ridges on slider */}
               <div style={{ width: '2px', height: '8px', background: '#450a0a', margin: '2px auto' }}></div>
            </div>
          </div>
          {/* Screw holes */}
          <div style={{ position: 'absolute', left: '2px', width: '4px', height: '4px', borderRadius: '50%', background: '#1f2937' }}></div>
          <div style={{ position: 'absolute', right: '2px', width: '4px', height: '4px', borderRadius: '50%', background: '#1f2937' }}></div>
        </div>
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
