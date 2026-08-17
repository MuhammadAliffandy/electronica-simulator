import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function DiodeNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="diode-node" handles={[]}>      {/* 2 kaki: Anode (+) kiri, Katode (-) kanan */}
      <Handle type="source" position={Position.Left} id="anode" />
      <Handle type="source" position={Position.Right} id="cathode" />
      <div className="pin-label pin-left" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem' }}>A+</div>
      <div className="pin-label pin-right" style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.75rem' }}>K-</div>
      <div className="diode-visual" style={{ margin: "8px auto" }}>
        <div style={{ width: '50px', height: '16px', margin: '0 auto', background: 'linear-gradient(to bottom, #111827 0%, #374151 50%, #111827 100%)', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', border: '1px solid #030712', overflow: 'hidden' }}>
          {/* Silver Cathode Stripe */}
          <div style={{ width: '8px', height: '100%', background: 'linear-gradient(to bottom, #d1d5db 0%, #ffffff 50%, #d1d5db 100%)', marginRight: '6px' }}></div>
        </div>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value" style={{ marginTop: '4px' }}>
        <select value={data.diodeType || "standard"} onChange={(e) => updateNodeData(id, { diodeType: e.target.value })} className="node-input nodrag" style={{ width: '85px' }}>
          <option value="standard">Standard</option>
          <option value="zener">Zener</option>
          <option value="led">LED (Diode)</option>
          <option value="photodiode">Photodiode</option>
        </select>
      </div>
    </BaseNode>
  );
}
