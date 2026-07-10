import { Handle, Position, useReactFlow } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";

export function MotorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} motor-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      {/* 2 kaki: Left(+) / Right(-) dengan label polaritas */}
      <Handle type="source" position={Position.Left} id="pos" />
      <Handle type="source" position={Position.Right} id="neg" />
      <div className="pin-label pin-left" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.9rem' }}>+</div>
      <div className="pin-label pin-right" style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.9rem' }}>−</div>
      <span className="node-emoji">⚙️</span>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.ratedVoltage !== undefined ? data.ratedVoltage : 5} 
          onChange={(e) => updateNodeData(id, { ratedVoltage: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        V Motor
      </div>
    </div>
  );
}
