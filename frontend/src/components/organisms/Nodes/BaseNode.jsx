import { Handle, Position } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";

/**
 * BaseNode handles common wrapping, styling (success, selected, error),
 * delete buttons, error badges, and handle placement.
 * 
 * @param {string} id - Node ID
 * @param {object} data - Node data
 * @param {boolean} selected - Node selection state
 * @param {string} className - Additional CSS class for the specific node type
 * @param {Array} handles - Array of handle definitions e.g. [{id: "left", pos: Position.Left, type: "source"}]
 */
export function BaseNode({ id, data, selected, className, handles, style, children }) {
  // Default 2-way handles if not provided. Both 'source' to allow dragging out from either end.
  const defaultHandles = [
    { id: "left", pos: Position.Left, type: "source" },
    { id: "right", pos: Position.Right, type: "source" }
  ];
  
  const nodeHandles = handles || defaultHandles;

  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} ${className} ${selected ? "selected" : ""}`} style={style}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      
      {nodeHandles.map(h => (
        <Handle 
          key={h.id}
          type={h.type} 
          position={h.pos} 
          id={h.id} 
          style={h.style || {}}
        />
      ))}
      
      {children}
    </div>
  );
}
