import { Handle, Position, useReactFlow } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";

export function MultimeterNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} multimeter-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <Handle type="source" position={Position.Left} id="probe-red" style={{ top: '30%', background: '#ef4444', border: '2px solid white', width: '12px', height: '12px' }} />
      <Handle type="source" position={Position.Left} id="probe-black" style={{ top: '70%', background: '#374151', border: '2px solid white', width: '12px', height: '12px' }} />
      {/* Label probe */}
      <div style={{ position:'absolute', left:'-18px', top:'26%', color:'#ef4444', fontSize:'0.8rem', fontWeight:'bold', pointerEvents:'none' }}>+</div>
      <div style={{ position:'absolute', left:'-18px', top:'66%', color:'#9ca3af', fontSize:'0.8rem', fontWeight:'bold', pointerEvents:'none' }}>−</div>
      <div className="multimeter-screen nodrag">
        {data.reading !== undefined ? data.reading : "0.00"} {data.mode === 'V' ? 'V' : data.mode === 'A' ? 'mA' : 'Ω'}
      </div>
      <div className="node-label">{data.label}</div>
      <div className="node-value">
        <select value={data.mode || "V"} onChange={(e) => updateNodeData(id, { mode: e.target.value })} className="node-input nodrag" style={{ width: '90px' }}>
          <option value="V">Voltmeter (V)</option>
          <option value="A">Ammeter (mA)</option>
          <option value="Ohm">Ohmmeter (Ω)</option>
        </select>
      </div>
    </div>
  );
}
