import { getSmoothStepPath } from "@xyflow/react";

export function JumpEdge({ id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition, style = {}, markerEnd, animated }) {
  const [edgePath] = getSmoothStepPath({
    sourceX, sourceY, sourcePosition, targetX, targetY, targetPosition,
    borderRadius: 0,
  });

  return (
    <>
      <path id={id} className="react-flow__edge-path" d={edgePath} markerEnd={markerEnd} fillRule="evenodd" />
      <path className={`react-flow__edge-path-inner ${animated ? 'animated' : ''}`} d={edgePath} style={style} fillRule="evenodd" />
    </>
  );
}
