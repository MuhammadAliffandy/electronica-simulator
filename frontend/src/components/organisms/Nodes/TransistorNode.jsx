import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function TransistorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isNPN = (data.transistorType || 'npn') === 'npn';
  return (
    <BaseNode id={id} data={data} selected={selected} className="transistor-node" handles={[]}>      {/* Base: kiri tengah */}
      <Handle type="source" position={Position.Left} id="base" style={{ top: '50%' }} />
      {/* C di atas */}
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

      <div className="transistor-visual" style={{ margin: "10px auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* TO-92 Body */}
        <div style={{ width: '40px', height: '30px', background: 'linear-gradient(to right, #111827 0%, #374151 50%, #111827 100%)', borderTopLeftRadius: '20px', borderTopRightRadius: '20px', border: '1px solid #030712', borderBottom: 'none', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: '4px' }}>
           <span style={{ fontSize: '8px', color: '#9ca3af', fontFamily: 'monospace' }}>{isNPN ? 'BC547' : 'BC557'}</span>
        </div>
        {/* TO-92 Bottom Ridge */}
        <div style={{ width: '44px', height: '4px', background: '#1f2937', border: '1px solid #030712', borderRadius: '2px' }}></div>
        {/* 3 Legs */}
        <div style={{ display: 'flex', width: '30px', justifyContent: 'space-between', marginTop: '-1px' }}>
          <div style={{ width: '4px', height: '16px', background: 'linear-gradient(to right, #9ca3af, #f3f4f6, #9ca3af)' }}></div>
          <div style={{ width: '4px', height: '16px', background: 'linear-gradient(to right, #9ca3af, #f3f4f6, #9ca3af)' }}></div>
          <div style={{ width: '4px', height: '16px', background: 'linear-gradient(to right, #9ca3af, #f3f4f6, #9ca3af)' }}></div>
        </div>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <select value={data.transistorType || "npn"} onChange={(e) => updateNodeData(id, { transistorType: e.target.value })} className="node-input nodrag" style={{ width: '85px' }}>
          <option value="npn">NPN (BC547)</option>
          <option value="pnp">PNP (BC557)</option>
        </select>
      </div>
    </BaseNode>
  );
}
