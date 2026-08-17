import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function MultimeterNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="multimeter-node" handles={[]}>      <Handle type="source" position={Position.Left} id="probe-red" style={{ top: '30%', background: '#ef4444', border: '2px solid white', width: '12px', height: '12px' }} />
      <Handle type="source" position={Position.Left} id="probe-black" style={{ top: '70%', background: '#374151', border: '2px solid white', width: '12px', height: '12px' }} />
      {/* Label probe */}
      <div style={{ position:'absolute', left:'-18px', top:'26%', color:'#ef4444', fontSize:'0.8rem', fontWeight:'bold', pointerEvents:'none' }}>+</div>
      <div style={{ position:'absolute', left:'-18px', top:'66%', color:'#9ca3af', fontSize:'0.8rem', fontWeight:'bold', pointerEvents:'none' }}>−</div>
      <div className="multimeter-casing" style={{ background: '#ca8a04', padding: '8px', borderRadius: '8px', border: '2px solid #854d0e', margin: '4px 0', boxShadow: 'inset 0 0 10px rgba(0,0,0,0.5)' }}>
        <div className="multimeter-screen" style={{ background: '#9ca3af', border: 'inset 2px #4b5563', color: '#111827', fontFamily: 'monospace', fontWeight: 'bold', fontSize: '1.2rem', padding: '4px', textAlign: 'right', borderRadius: '2px', textShadow: '0 1px 0 rgba(255,255,255,0.5)' }}>
          {data.reading !== undefined ? data.reading : "0.00"} {data.mode === 'V' ? 'V' : data.mode === 'A' ? 'mA' : 'Ω'}
        </div>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <select 
          value={data.mode || "V"} 
          onChange={(e) => {
            updateNodeData(id, { mode: e.target.value });
            if (window.triggerSimulation) window.triggerSimulation();
          }} 
          className="node-input nodrag" 
          style={{ width: '90px' }}
        >
          <option value="V">Voltmeter (V)</option>
          <option value="A">Ammeter (mA)</option>
          <option value="Ohm">Ohmmeter (Ω)</option>
        </select>
      </div>
    </BaseNode>
  );
}
