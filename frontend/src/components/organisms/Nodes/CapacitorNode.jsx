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
      <div className="capacitor-visual" style={{ margin: "10px auto" }}>
        {isElco ? (
          <div style={{ width: '30px', height: '40px', margin: '0 auto', background: 'linear-gradient(to right, #1e3a8a 0%, #3b82f6 50%, #1e3a8a 100%)', borderRadius: '4px', position: 'relative', display: 'flex', border: '1px solid #172554' }}>
            {/* Gray negative stripe */}
            <div style={{ width: '8px', height: '100%', background: '#9ca3af', borderRight: '1px solid #6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-evenly' }}>
              <div style={{ color: '#1f2937', fontSize: '8px', fontWeight: 'bold' }}>-</div>
              <div style={{ color: '#1f2937', fontSize: '8px', fontWeight: 'bold' }}>-</div>
            </div>
            {/* Top metallic cross */}
            <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '8px', background: '#d1d5db', borderRadius: '4px 4px 0 0', borderBottom: '1px solid #9ca3af', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div style={{ width: '80%', height: '1px', background: '#9ca3af', position: 'absolute' }}></div>
               <div style={{ width: '1px', height: '80%', background: '#9ca3af', position: 'absolute' }}></div>
            </div>
            {isExploded && (
              <div style={{ position: 'absolute', top: '-10px', left: '0', width: '100%', textAlign: 'center', fontSize: '20px' }}>💥</div>
            )}
          </div>
        ) : (
          <div style={{ width: '24px', height: '24px', margin: '0 auto', background: 'radial-gradient(circle at 30% 30%, #f59e0b 0%, #b45309 80%)', borderRadius: '50%', border: '1px solid #78350f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: '8px', color: '#111827', fontWeight: 'bold', textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.3)' }}>104</span>
          </div>
        )}
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
