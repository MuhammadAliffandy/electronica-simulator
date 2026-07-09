import { getSmoothStepPath } from '@xyflow/system';
const [d] = getSmoothStepPath({ sourceX: 0, sourceY: 0, sourcePosition: 'right', targetX: 100, targetY: 100, targetPosition: 'left', borderRadius: 0 });
console.log(d);
