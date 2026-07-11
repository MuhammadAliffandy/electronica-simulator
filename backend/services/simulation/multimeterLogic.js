function calculateMultimeterReadings(multimeters, battery, totalHambatanUniversal, hasLoop, burnoutRisk, hasOpenPins, nodes_state) {
  multimeters.forEach(mm => {
    const mmMode = mm.data?.mode || "V";
    let reading = "0.00";
    let unit = mmMode;

    if (hasLoop && !burnoutRisk && !hasOpenPins) {
      if (mmMode === "V") {
         const voltage = battery?.data?.voltage || 9;
         reading = voltage.toFixed(2);
      } else if (mmMode === "A") {
         const v = battery?.data?.voltage || 9;
         if(totalHambatanUniversal > 0) {
             const i = (v / totalHambatanUniversal) * 1000;
             reading = i.toFixed(2);
             unit = "mA";
         }
      } else if (mmMode === "Ω") {
         reading = totalHambatanUniversal.toFixed(1);
      }
    } else if (mmMode === "Ω" && !hasOpenPins) {
      // Multimeter bisa mengukur hambatan meskipun baterai tidak terpasang
      reading = totalHambatanUniversal.toFixed(1);
    }
    
    nodes_state[mm.id] = { reading, unit };
  });
}

module.exports = {
  calculateMultimeterReadings
};
