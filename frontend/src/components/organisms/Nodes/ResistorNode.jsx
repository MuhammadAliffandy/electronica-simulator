import { BaseNode } from "./BaseNode";
import { Handle, Position, useReactFlow } from "@xyflow/react";

function getResistorColors(value) {
  if (value === undefined || value === null) value = 0;
  let val = parseFloat(value);
  if (isNaN(val) || val <= 0) return ['#000000', '#000000', '#000000', '#d4af37'];

  const exponential = val.toExponential();
  const parts = exponential.split('e');
  const mantissa = parseFloat(parts[0]);
  const exponent = parseInt(parts[1], 10);

  const sigStr = (mantissa * 10).toFixed(0).padStart(2, '0');
  const d1 = parseInt(sigStr[0]);
  const d2 = parseInt(sigStr[1]);
  
  let multExp = exponent - 1;
  
  const colors = [
    '#000000', '#8b4513', '#ff0000', '#ffa500', '#ffff00', 
    '#008000', '#0000ff', '#ee82ee', '#808080', '#ffffff'
  ];
  
  let multiplierColor = '#000000';
  if (multExp >= 0 && multExp <= 9) {
    multiplierColor = colors[multExp];
  } else if (multExp === -1) {
    multiplierColor = '#d4af37';
  } else if (multExp === -2) {
    multiplierColor = '#c0c0c0';
  }

  return [colors[d1] || '#000', colors[d2] || '#000', multiplierColor, '#d4af37'];
}

export function ResistorNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const bands = getResistorColors(data.resistance);

  return (
    <BaseNode id={id} data={data} selected={selected} className="resistor-node">
      <div style={{
        width: '70px',
        height: '24px',
        backgroundColor: '#d2b48c',
        borderRadius: '12px',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-evenly',
        border: '2px solid #8b4513',
        margin: '0 auto 8px auto',
        overflow: 'hidden'
      }}>
        {bands.map((color, idx) => (
          <div key={idx} style={{
            width: '8px',
            height: '100%',
            backgroundColor: color,
            marginLeft: idx === 3 ? '8px' : '0'
          }}></div>
        ))}
      </div>
      <div className="node-label">
        Resistor
      </div>
      <div className="node-value">
        <input 
          type="number" 
          value={data.resistance !== undefined ? data.resistance : 0} 
          onChange={(e) => updateNodeData(id, { resistance: e.target.value === '' ? '' : Number(e.target.value) })}
          className="node-input nodrag"
          style={{ width: '70px' }}
        />
        Ω
      </div>
    </BaseNode>
  );
}
