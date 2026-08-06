import { BaseNode } from "./BaseNode";
import { Position, useReactFlow } from "@xyflow/react";

const LED_SPECS = {
  Red:    { vf: 2.0, ifMax: 20, glowColor: "239,68,68" },
  Yellow: { vf: 2.1, ifMax: 20, glowColor: "234,179,8" },
  Green:  { vf: 2.2, ifMax: 25, glowColor: "34,197,94" },
  Blue:   { vf: 3.2, ifMax: 20, glowColor: "59,130,246" },
  White:  { vf: 3.2, ifMax: 20, glowColor: "248,250,252" },
};

export function LEDNode({ id, data, selected }) {
  const { updateNodeData } = useReactFlow();
  const isBurnt = data.ledState === "burnt" || data.ledState === "burn" || (data.hasError && data.errorMessage && data.errorMessage.toLowerCase().includes("terbakar"));
  const isDim   = data.ledState === "dim";
  const isBright = data.ledState === "bright" || data.ledState === "on";

  const color = data.color || "Red";
  const spec = LED_SPECS[color] || LED_SPECS.Red;
  const gc = spec.glowColor;

  const ledFillColor = isBurnt ? "#6b7280" :
    !isBright && !isDim ? "#374151" :
    isDim   ? `rgba(${gc},0.35)` :
    `rgba(${gc},0.85)`;

  const ledStrokeColor = isBurnt ? "#9ca3af" : `rgb(${gc})`;
  const nodeGlowStyle = isBright
    ? { boxShadow: `0 0 20px 6px rgba(${gc},0.55), 0 0 40px 10px rgba(${gc},0.25)` }
    : isDim
    ? { boxShadow: `0 0 8px 2px rgba(${gc},0.25)`, opacity: 0.75 }
    : !isBright && !isDim && !isBurnt
    ? { filter: "grayscale(70%) brightness(0.55)", opacity: 0.65 }
    : {};

  // Pass handles explicitly so BaseNode does NOT auto-create defaults
  const handles = [
    { id: "anode",   pos: Position.Left,  type: "source" },
    { id: "cathode", pos: Position.Right, type: "source" },
  ];

  return (
    <BaseNode
      className={`led-node led-${color.toLowerCase()} ${isBurnt ? "led-burnt" : ""}`}
      id={id}
      data={data}
      selected={selected}
      style={nodeGlowStyle}
      handles={handles}
    >
      <div className="pin-label pin-left" style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '0.75rem' }}>A+</div>
      <div className="pin-label pin-right" style={{ color: '#60a5fa', fontWeight: 'bold', fontSize: '0.75rem' }}>K-</div>
      {/* LED SVG symbol */}
      <div className="led-symbol">
        <svg viewBox="0 0 40 44" width="40" height="44">
          {/* Bulb dome */}
          <path d="M 8 24 A 12 12 0 1 1 32 24 L 32 30 Q 32 34 28 34 L 12 34 Q 8 34 8 30 Z"
            fill={ledFillColor} stroke={ledStrokeColor} strokeWidth="2" />
          {/* Flat base */}
          <rect x="12" y="34" width="16" height="4" rx="1" fill={ledStrokeColor} opacity="0.7"/>
          {/* Legs */}
          <line x1="16" y1="38" x2="14" y2="44" stroke={ledStrokeColor} strokeWidth="2" strokeLinecap="round"/>
          <line x1="24" y1="38" x2="26" y2="44" stroke={ledStrokeColor} strokeWidth="2" strokeLinecap="round"/>
          {/* Triangle (diode symbol) */}
          <polygon points="17,26 23,22 23,30" fill="white" opacity={isBright ? "0.9" : "0.4"}/>
          <line x1="23" y1="21" x2="23" y2="31" stroke="white" strokeWidth="1.5" opacity={isBright ? "0.9" : "0.4"}/>
          {/* Rays when bright */}
          {isBright && (
            <>
              <line x1="34" y1="14" x2="38" y2="10" stroke={`rgb(${gc})`} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
              <line x1="36" y1="20" x2="41" y2="18" stroke={`rgb(${gc})`} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
              <line x1="6" y1="14" x2="2" y2="10" stroke={`rgb(${gc})`} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
              <line x1="4" y1="20" x2="-1" y2="18" stroke={`rgb(${gc})`} strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            </>
          )}
          {/* Burnt X */}
          {isBurnt && (
            <>
              <line x1="16" y1="16" x2="24" y2="28" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
              <line x1="24" y1="16" x2="16" y2="28" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
            </>
          )}
        </svg>
      </div>
      <div className="node-label">{data.label}</div>
      <div className="led-spec-row">
        <span className="led-spec-badge" style={{ background: `rgba(${gc},0.15)`, color: `rgb(${gc})` }}>
          Vf={spec.vf}V
        </span>
        <span className="led-spec-badge" style={{ background: `rgba(${gc},0.15)`, color: `rgb(${gc})` }}>
          If≤{spec.ifMax}mA
        </span>
      </div>
      <div className="led-state-label">
        {isBurnt ? "🔥 TERBAKAR" : isDim ? "🌑 REDUP" : isBright ? "✨ MENYALA" : "⚫ MATI"}
      </div>
      <div className="node-value">
        <select
          value={color}
          onChange={(e) => updateNodeData(id, { color: e.target.value })}
          className="node-input nodrag"
          style={{ width: "70px" }}
        >
          <option value="Red">Red</option>
          <option value="Yellow">Yellow</option>
          <option value="Green">Green</option>
          <option value="Blue">Blue</option>
          <option value="White">White</option>
        </select>
      </div>
    </BaseNode>
  );
}
