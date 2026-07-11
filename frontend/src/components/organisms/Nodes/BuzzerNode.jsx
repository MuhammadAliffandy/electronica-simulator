import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function BuzzerNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="buzzer-node">      <span className="node-emoji">🔔</span>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.minVoltage !== undefined ? data.minVoltage : 3} 
          onChange={(e) => updateNodeData(id, { minVoltage: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        V min
      </div>
    </BaseNode>
  );
}
