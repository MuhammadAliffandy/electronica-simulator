function calculateACImpedance(nodes, edges, frequency, totalResistance) {
  let totalL_H = 0;
  let totalC_F = 0;
  
  // Asumsi penyederhanaan seri untuk R-L-C
  nodes.forEach(n => {
    if (n.type === 'inductor' || n.data?.componentType === 'inductor') {
      const L_mH = n.data?.inductance ?? 0;
      totalL_H += (L_mH * 1e-3);
    }
    if (n.type === 'capacitor' || n.data?.componentType === 'capacitor') {
      const C_val = n.data?.capacitance ?? 0;
      const type = n.data?.capType ?? 'elco';
      
      const C_F = type === 'elco' ? (C_val * 1e-6) : (C_val * 1e-9);
      if (C_F > 0) {
        if (totalC_F === 0) totalC_F = C_F;
        else totalC_F = 1 / ((1 / totalC_F) + (1 / C_F)); // Series equivalence
      }
    }
  });

  const Xl = totalL_H > 0 ? 2 * Math.PI * frequency * totalL_H : 0;
  const Xc = totalC_F > 0 ? 1 / (2 * Math.PI * frequency * totalC_F) : 0;
  
  const R = totalResistance;
  // Impedance
  const Z = Math.sqrt(Math.pow(R, 2) + Math.pow(Xl - Xc, 2));
  
  // Phase angle in degrees
  let phaseAngleRad = 0;
  if (R === 0) {
    if (Xl > Xc) phaseAngleRad = Math.PI / 2;
    else if (Xc > Xl) phaseAngleRad = -Math.PI / 2;
  } else {
    phaseAngleRad = Math.atan((Xl - Xc) / R);
  }
  const phaseAngleDeg = phaseAngleRad * (180 / Math.PI);
  
  return {
    Xl,
    Xc,
    Z,
    phaseAngleDeg,
    totalL_H,
    totalC_F,
    hasACComponents: totalL_H > 0 || totalC_F > 0
  };
}

module.exports = {
  calculateACImpedance
};
