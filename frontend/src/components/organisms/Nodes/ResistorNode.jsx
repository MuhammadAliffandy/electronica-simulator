import { Handle, Position, useReactFlow } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";

export function ResistorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} resistor-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      {/* 2 kaki: kiri dan kanan. Non-polar, tanpa label +/- */}
      <Handle type="source" position={Position.Left} id="left" />
      <Handle type="source" position={Position.Right} id="right" />
      <div className="resistor-body nodrag" style={{ background: 'transparent', border: 'none', height: 'auto', display: 'block', fontSize: '36px', color: '#8b5cf6', margin: '-5px 0 5px 0' }}>
        <strong>Ω</strong>
      </div>
      <div className="node-label">
        {data.resistance !== undefined ? `${data.resistance}\u03a9 Resistor` : 'Resistor'}
      </div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.resistance !== undefined ? data.resistance : 220} 
          onChange={(e) => updateNodeData(id, { resistance: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
        />
        Ω
      </div>
    </div>
  );
}
