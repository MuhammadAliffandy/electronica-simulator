import { Handle, Position, useReactFlow } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";
import { TwoWayHandles } from "../../atoms/TwoWayHandles";

export function BuzzerNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} buzzer-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <TwoWayHandles />
      <span className="node-emoji">🔔</span>
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
    </div>
  );
}
