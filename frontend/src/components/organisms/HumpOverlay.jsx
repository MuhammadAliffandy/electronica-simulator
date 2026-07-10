import { useViewport } from "@xyflow/react";

export function HumpOverlay({ intersections, isRunning }) {
  const { x, y, zoom } = useViewport();
  
  return (
    <div style={{
      position: 'absolute',
      left: 0, top: 0, width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 1000,
      transform: `translate(${x}px, ${y}px) scale(${zoom})`,
      transformOrigin: '0 0'
    }}>
      {intersections.map((int, i) => (
        <svg 
          key={i}
          style={{ position: 'absolute', left: int.x - 12, top: int.y - 12, width: 24, height: 24, overflow: 'visible' }}
        >
          {/* Mask for the vertical line */}
          <rect x="8" y="0" width="8" height="24" fill="var(--react-flow-bg)" />
          {/* Re-draw vertical line */}
          <line x1="12" y1="0" x2="12" y2="24" stroke="#00d4ff" strokeWidth="2.5" className={isRunning ? "animated reverse-animation" : ""} />
          
          {/* Mask for horizontal line */}
          <rect x="0" y="8" width="24" height="8" fill="var(--react-flow-bg)" />
          {/* Draw horizontal hump */}
          <path d="M 0 12 L 4 12 A 8 8 0 0 1 20 12 L 24 12" fill="none" stroke="#00d4ff" strokeWidth="2.5" className={isRunning ? "animated reverse-animation" : ""} />
        </svg>
      ))}
    </div>
  );
}
