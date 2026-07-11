import { BaseNode } from "./BaseNode";
import { useReactFlow } from "@xyflow/react";

export function WireJunctionNode({ id, data, selected }) {
  return (
    <BaseNode id={id} data={data} selected={selected} className="junction-node">      <span className="node-emoji">⭕</span>
      <div className="node-label">{data.label}</div>
    </BaseNode>
  );
}
