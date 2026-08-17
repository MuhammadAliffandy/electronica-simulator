import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function MotorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="motor-node" handles={[]}>      {/* 2 kaki: Left(+) / Right(-) dengan label polaritas */}
      <Handle type="source" position={Position.Left} id="pos" />
      <Handle type="source" position={Position.Right} id="neg" />
      <div className="pin-label pin-left" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>+</div>
      <div className="pin-label pin-right" style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.9rem' }}>−</div>
      <div className="motor-visual" style={{ margin: "10px auto", position: "relative", width: "50px", height: "30px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {/* Silver body */}
        <div style={{ width: "40px", height: "30px", background: "linear-gradient(to bottom, #d1d5db 0%, #f3f4f6 20%, #9ca3af 80%, #4b5563 100%)", borderRadius: "4px", border: "1px solid #4b5563", boxShadow: "0 2px 4px rgba(0,0,0,0.5)", position: "relative", overflow: "hidden" }}>
           <div style={{ position: "absolute", top: 0, left: "10%", width: "1px", height: "100%", background: "rgba(0,0,0,0.1)" }}></div>
           <div style={{ position: "absolute", top: 0, right: "10%", width: "1px", height: "100%", background: "rgba(0,0,0,0.1)" }}></div>
        </div>
        {/* Gold Axle */}
        <div style={{ width: "10px", height: "8px", background: "linear-gradient(to bottom, #fde047, #ca8a04)", borderRadius: "0 2px 2px 0", border: "1px solid #a16207", borderLeft: "none", zIndex: 1, boxShadow: "0 1px 2px rgba(0,0,0,0.5)" }}></div>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.ratedVoltage !== undefined ? data.ratedVoltage : 0} 
          onChange={(e) => updateNodeData(id, { ratedVoltage: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        V Motor
      </div>
    </BaseNode>
  );
}
