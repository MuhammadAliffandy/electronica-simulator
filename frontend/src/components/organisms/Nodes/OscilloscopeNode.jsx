import { BaseNode } from "./BaseNode";
import { Handle, Position } from "@xyflow/react";

export function OscilloscopeNode({ id, data, selected }) {
  return (
    <BaseNode id={id} data={data} selected={selected} className="oscilloscope-node" handles={[]}>      <Handle type="source" position={Position.Left} id="ch1" style={{ top: '30%', background: '#00d4ff' }} />
      <Handle type="source" position={Position.Left} id="gnd" style={{ top: '70%', background: '#111827' }} />
      <div className="oscilloscope-screen" style={{ overflow: 'hidden' }}>
        <svg viewBox="0 0 200 40" className="osc-wave" style={{ width: '200%', transform: 'translateX(0)', animation: 'scroll-wave 2s linear infinite' }}>
          <path d={Array.from({ length: 200 }).map((_, i) => `${i === 0 ? 'M' : 'L'} ${i},${20 + 15 * Math.sin(i * 0.1)}`).join(' ')} fill="none" stroke="#00d4ff" strokeWidth="2" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
    </BaseNode>
  );
}
