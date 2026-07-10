import { Handle, Position } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";

export function OscilloscopeNode({ id, data, selected }) {
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} oscilloscope-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <Handle type="source" position={Position.Left} id="ch1" style={{ top: '30%', background: '#00d4ff' }} />
      <Handle type="source" position={Position.Left} id="gnd" style={{ top: '70%', background: '#111827' }} />
      <div className="oscilloscope-screen nodrag">
        <svg viewBox="0 0 100 40" className="osc-wave">
          <polyline points="0,20 10,20 15,10 25,30 35,20 50,20 60,20 65,10 75,30 85,20 100,20" fill="none" stroke="#00d4ff" strokeWidth="2" />
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
    </div>
  );
}
