import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function CapacitorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isElco = data.capType === "elco";
  const isExploded = data.hasError && data.errorMessage && data.errorMessage.includes("Explosion");
  
  return (
    <BaseNode id={id} data={data} selected={selected} className="capacitor-node">      {isElco && !isExploded && (
        <>
          <div className="polar-label polar-plus">+</div>
          <div className="polar-label polar-minus">-</div>
        </>
      )}
      <div className="capacitor-svg" style={{ margin: "4px auto", color: "#3b82f6" }}>
        <svg viewBox="0 0 40 24" width="40" height="24">
          <line x1="0" y1="12" x2="16" y2="12" stroke="currentColor" strokeWidth="2.5"/>
          <line x1="16" y1="4" x2="16" y2="20" stroke="currentColor" strokeWidth="2.5"/>
          {isElco ? (
            <path d="M 24 4 Q 20 12 24 20" fill="none" stroke="currentColor" strokeWidth="2.5"/>
          ) : (
            <line x1="24" y1="4" x2="24" y2="20" stroke="currentColor" strokeWidth="2.5"/>
          )}
          <line x1="24" y1="12" x2="40" y2="12" stroke="currentColor" strokeWidth="2.5"/>
        </svg>
      </div>
      <div className="node-label">{data.label} {isElco && !isExploded ? "(+/-)" : ""}</div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.capacitance !== undefined ? data.capacitance : 0} 
          onChange={(e) => updateNodeData(id, { capacitance: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        {isElco ? "µF" : "nF"}
      </div>
      <div className="node-value" style={{ marginTop: '4px' }}>
        <select value={data.capType || "elco"} onChange={(e) => updateNodeData(id, { capType: e.target.value })} className="node-input nodrag" style={{ width: '80px' }}>
          <option value="elco">Elco (Polar)</option>
          <option value="ceramic">Ceramic</option>
        </select>
      </div>
    </BaseNode>
  );
}
