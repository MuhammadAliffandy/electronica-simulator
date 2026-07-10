import { useReactFlow } from "@xyflow/react";
import { NodeDeleteButton } from "../../atoms/NodeDeleteButton";
import { ErrorBadge } from "../../molecules/ErrorBadge";
import { TwoWayHandles } from "../../atoms/TwoWayHandles";

export function WireJunctionNode({ id, data, selected }) {
  return (
    <div className={`circuit-node ${data.isSuccess ? "success" : ""} junction-node ${selected ? "selected" : ""}`}>
      <NodeDeleteButton id={id} />
      <ErrorBadge data={data} />
      <TwoWayHandles />
      <span className="node-emoji">⭕</span>
      <div className="node-label">{data.label}</div>
    </div>
  );
}
