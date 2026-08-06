import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function PotentiometerNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="potentiometer-node" handles={[]}>      <Handle type="source" position={Position.Left} id="pin1" />
      <Handle type="source" position={Position.Bottom} id="wiper" />
      <Handle type="source" position={Position.Right} id="pin3" />
      <span className="node-emoji">🎛️</span>
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
