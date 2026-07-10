import { Handle, Position, useReactFlow } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";

export function TransistorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isNPN = (data.transistorType || 'npn') === 'npn';
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} transistor-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      {/* Base: kiri tengah */}
      <Handle type="source" position={Position.Left} id="base" style={{ top: '50%' }} />
      {/* Collector: atas tengah */}
      <Handle type="source" position={Position.Top} id="collector" style={{ left: '50%' }} />
      {/* Emitter: bawah tengah */}
      <Handle type="source" position={Position.Bottom} id="emitter" style={{ left: '50%' }} />

      {/* Pin badges — lebih besar dan jelas */}
      <div style={{ position:'absolute', left:'-22px', top:'50%', transform:'translateY(-50%)',
        background:'#854d0e', color:'#fef08a', fontSize:'0.65rem', fontWeight:'bold',
        padding:'1px 4px', borderRadius:'4px', pointerEvents:'none' }}>B</div>
      <div style={{ position:'absolute', top:'-20px', left:'50%', transform:'translateX(-50%)',
        background:'#991b1b', color:'#fca5a5', fontSize:'0.65rem', fontWeight:'bold',
        padding:'1px 4px', borderRadius:'4px', pointerEvents:'none' }}>C</div>
      <div style={{ position:'absolute', bottom:'-20px', left:'50%', transform:'translateX(-50%)',
        background:'#1e3a5f', color:'#93c5fd', fontSize:'0.65rem', fontWeight:'bold',
        padding:'1px 4px', borderRadius:'4px', pointerEvents:'none' }}>E</div>

      <div className="transistor-svg" style={{ margin: "4px auto", color: "#ec4899" }}>
        <svg viewBox="0 0 40 40" width="44" height="44">
          {/* Circle body */}
          <circle cx="20" cy="20" r="18" fill="none" stroke="currentColor" strokeWidth="2.5"/>
          {/* Base line */}
          <line x1="0" y1="20" x2="12" y2="20" stroke="currentColor" strokeWidth="2.5"/>
          {/* Base bar */}
          <line x1="12" y1="10" x2="12" y2="30" stroke="currentColor" strokeWidth="4"/>
          {/* Collector (up-right) */}
          <line x1="12" y1="13" x2="26" y2="3" stroke="currentColor" strokeWidth="2.5"/>
          <line x1="26" y1="3" x2="26" y2="0" stroke="currentColor" strokeWidth="2.5"/>
          {/* Emitter (down-right) */}
          <line x1="12" y1="27" x2="26" y2="37" stroke="currentColor" strokeWidth="2.5"/>
          <line x1="26" y1="37" x2="26" y2="40" stroke="currentColor" strokeWidth="2.5"/>
          {/* Arrow on emitter (NPN: pointing away, PNP: pointing in) */}
          {isNPN ? (
            <polygon points="19,32 25,38 25,31" fill="currentColor"/>
          ) : (
            <polygon points="14,23 12,29 18,27" fill="currentColor"/>
          )}
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <select value={data.transistorType || "npn"} onChange={(e) => updateNodeData(id, { transistorType: e.target.value })} className="node-input nodrag" style={{ width: '85px' }}>
          <option value="npn">NPN (BC547)</option>
          <option value="pnp">PNP (BC557)</option>
        </select>
      </div>
    </div>
  );
}
