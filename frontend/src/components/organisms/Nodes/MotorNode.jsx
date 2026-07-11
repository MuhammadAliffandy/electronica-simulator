import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function MotorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="motor-node" handles={[]}>      {/* 2 kaki: Left(+) / Right(-) dengan label polaritas */}
      <Handle type="target" position={Position.Left} id="pos" />
      <Handle type="source" position={Position.Right} id="neg" />
      <div className="pin-label pin-left" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>+</div>
      <div className="pin-label pin-right" style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.9rem' }}>−</div>
      <span className="node-emoji">⚙️</span>
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
