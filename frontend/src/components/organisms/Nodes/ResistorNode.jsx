import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

export function ResistorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  return (
    <BaseNode id={id} data={data} selected={selected} className="resistor-node">      {/* 2 kaki: kiri dan kanan. Non-polar, tanpa label +/- */}
      <div className="resistor-body" style={{ background: 'transparent', border: 'none', height: 'auto', display: 'block', fontSize: '36px', color: '#8b5cf6', margin: '-5px 0 5px 0' }}>
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
    </BaseNode>
  );
}
