import { useReactFlow } from "@xyflow/react";

export function NodeDeleteButton({ id }) {
  const { deleteElements } = useReactFlow();
  const onClick = (e) => {
    e.stopPropagation();
    deleteElements({ nodes: [{ id }] });
  };
  return (
    <button className="node-delete-btn nodrag" onClick={onClick} title="Remove component">
      ×
    </button>
  );
}
