import { Handle, Position, useReactFlow } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";

export function InductorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} inductor-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      {/* 2 kaki: kiri dan kanan. Non-polar, tanpa label +/- */}
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <div className="inductor-svg" style={{ margin: "4px auto", color: "#f59e0b" }}>
        <svg viewBox="0 0 50 20" width="50" height="20">
          <path d="M 0 10 L 10 10 C 10 0, 20 0, 20 10 C 20 0, 30 0, 30 10 C 30 0, 40 0, 40 10 L 50 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.inductance !== undefined ? data.inductance : 100} 
          onChange={(e) => updateNodeData(id, { inductance: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        mH
      </div>
    </div>
  );
}
