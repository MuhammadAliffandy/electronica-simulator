import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function InductorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="inductor-node">      {/* 2 kaki: kiri dan kanan. Non-polar, tanpa label +/- */}
      <div className="inductor-visual" style={{ margin: "4px auto", display: "flex", justifyContent: "center" }}>
        <svg viewBox="0 0 40 40" width="40" height="40" style={{ filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.5))' }}>
          {/* Green Toroid Core */}
          <circle cx="20" cy="20" r="14" fill="none" stroke="#166534" strokeWidth="8" />
          {/* Copper Coils */}
          <path d="M 12 10 Q 6 12 8 20 Q 10 28 16 30" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 18 8 Q 12 10 14 20 Q 16 30 22 32" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 24 8 Q 18 10 20 20 Q 22 30 28 32" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 30 10 Q 24 12 26 20 Q 28 28 34 30" fill="none" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
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
