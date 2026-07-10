import { Handle, Position } from "@xyflow/react";

export const TwoWayHandles = () => (
  <>
    <Handle type="source" position={Position.Right} id="right" />
    <Handle type="source" position={Position.Left} id="left" />
  </>
);
