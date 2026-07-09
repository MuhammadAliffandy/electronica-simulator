const d = "M0 0L20 0L 50,0Q 50,0 50,0L 50,100Q 50,100 50,100L80 100L100 100";
const numbers = d.match(/-?\d+(\.\d+)?/g).map(Number);
const pts = [];
for (let i = 0; i < numbers.length; i += 2) {
  pts.push({ x: numbers[i], y: numbers[i+1] });
}
const segs = [];
for (let i = 0; i < pts.length - 1; i++) {
  const p1 = pts[i];
  const p2 = pts[i+1];
  if (Math.abs(p1.x - p2.x) > 0.1 || Math.abs(p1.y - p2.y) > 0.1) {
    segs.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y });
  }
}
console.log(segs);
