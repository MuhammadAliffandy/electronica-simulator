/**
 * Menghitung hambatan universal (Seri & Paralel) berdasarkan topologi Graph (nodes, edges).
 */
function calculateTotalResistance(resistors, pots, edges) {
  let totalHambatanUniversal = 0;
  const resGroups = {};
  const resistorDetails = [];
  const parallelGroupDetails = [];
  
  resistors.forEach((r) => {
    const rEdges = edges.filter(e => e.source === r.id || e.target === r.id);
    const connectedNodes = rEdges.map(e => e.source === r.id ? e.target : e.source).sort();
    const key = connectedNodes.join(',');
    if (!resGroups[key]) resGroups[key] = [];
    resGroups[key].push(r);
  });

  let groupIndex = 0;
  Object.values(resGroups).forEach(group => {
    groupIndex++;
    if (group.length === 1) {
      const rVal = group[0].data?.resistance || 220;
      totalHambatanUniversal += rVal;
      resistorDetails.push({ label: `R${groupIndex}`, value: rVal, unit: 'Ω', isParallel: false });
      parallelGroupDetails.push({ type: 'series', label: `R${groupIndex}`, equiv: rVal, resistors: group });
    } else {
      const invSum = group.reduce((acc, r) => acc + 1 / (r.data?.resistance || 220), 0);
      const Req = 1 / invSum;
      totalHambatanUniversal += Req;
      const labels = group.map((r, i) => `R${groupIndex}${String.fromCharCode(97+i)}`).join('‖');
      resistorDetails.push({ label: labels, value: Req, unit: 'Ω', isParallel: true, components: group });
      parallelGroupDetails.push({ type: 'parallel', label: labels, equiv: Req, resistors: group });
    }
  });

  pots.forEach((p, i) => {
    const effectiveR = ((p.data?.maxResistance || 10000) * (p.data?.wiperPercent || 50)) / 100;
    totalHambatanUniversal += effectiveR;
    resistorDetails.push({ label: `Pot${i + 1}`, value: effectiveR, unit: 'Ω', isParallel: false });
  });

  return {
    totalHambatanUniversal,
    resistorDetails,
    parallelGroupDetails
  };
}

module.exports = {
  calculateTotalResistance
};
