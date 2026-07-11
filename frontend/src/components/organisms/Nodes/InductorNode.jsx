import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function InductorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="inductor-node">      {/* 2 kaki: kiri dan kanan. Non-polar, tanpa label +/- */}
      <div className="inductor-svg" style={{ margin: "4px auto", color: "#f59e0b" }}>
        <svg viewBox="0 0 50 20" width="50" height="20">
          <path d="M 0 10 L 10 10 C 10 0, 20 0, 20 10 C 20 0, 30 0, 30 10 C 30 0, 40 0, 40 10 L 50 10" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.inductance !== undefined ? data.inductance : 0} 
          onChange={(e) => updateNodeData(id, { inductance: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        mH
      </div>
    </BaseNode>
  );
}
