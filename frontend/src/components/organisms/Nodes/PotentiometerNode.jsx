import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function PotentiometerNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="potentiometer-node" handles={[]}>      <Handle type="source" position={Position.Left} id="pin1" />
      <Handle type="source" position={Position.Bottom} id="wiper" />
      <Handle type="source" position={Position.Right} id="pin3" />
      <div className="potentiometer-visual" style={{ margin: "10px auto", position: "relative", width: "40px", height: "40px", filter: "drop-shadow(0px 4px 4px rgba(0,0,0,0.5))" }}>
        {/* Base ring */}
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "#1f2937", border: "2px solid #4b5563", position: "absolute", top: 0, left: 0 }}></div>
        {/* Knob */}
        <div style={{ 
          width: "32px", height: "32px", borderRadius: "50%", background: "linear-gradient(135deg, #374151, #111827)", 
          border: "1px solid #111827", position: "absolute", top: "2px", left: "2px",
          transform: `rotate(${((data.wiperPercent || 50) / 100) * 270 - 135}deg)`, transition: "transform 0.1s ease-out",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1), 0 2px 4px rgba(0,0,0,0.5)"
        }}>
          {/* Indicator mark */}
          <div style={{ width: "3px", height: "10px", background: "#f87171", borderRadius: "2px", position: "absolute", top: "4px", left: "13px" }}></div>
        </div>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="range" min="0" max="100" 
          value={data.wiperPercent || 50} 
          onChange={(e) => {
            updateNodeData(id, { wiperPercent: Number(e.target.value) });
            if (window.triggerSimulation) window.triggerSimulation();
          }}
          className="nodrag custom-slider" style={{ width: '80px', marginTop: '4px' }}
        />
      </div>
      <div style={{ fontSize: '0.6rem', marginTop: '4px', color: 'var(--text-muted)' }}>
        Wiper: {data.wiperPercent || 50}% of {data.maxResistance || 10000}Ω
      </div>
    </BaseNode>
  );
}
