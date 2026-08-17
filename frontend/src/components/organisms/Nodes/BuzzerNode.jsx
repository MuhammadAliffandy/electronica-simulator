import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function BuzzerNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="buzzer-node">      <div className="buzzer-visual" style={{ margin: "10px auto", position: "relative", width: "40px", height: "40px", borderRadius: "50%", background: "radial-gradient(circle at 30% 30%, #374151 0%, #030712 100%)", border: "2px solid #111827", boxShadow: "0 4px 6px rgba(0,0,0,0.5), inset 0 2px 4px rgba(255,255,255,0.1)" }}>
        {/* Top hole */}
        <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#000", position: "absolute", top: "12px", left: "12px", boxShadow: "inset 0 2px 4px rgba(0,0,0,1)" }}></div>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.minVoltage !== undefined ? data.minVoltage : 0} 
          onChange={(e) => updateNodeData(id, { minVoltage: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        V min
      </div>
    </BaseNode>
  );
}
