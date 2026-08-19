const fs = require('fs');
let code = fs.readFileSync('backend/services/aiService.js', 'utf8');

code = code.replace(
  'function generateMockAIResponse(validationResult, lang) {\n  const { hasLoop, burnoutRisk, nodes = [] } = validationResult;',
  'function generateMockAIResponse(validationResult, lang) {\n  const { hasLoop, burnoutRisk, nodes = [], computedValues } = validationResult;'
);

code = code.replace(
  `  const battery = nodes.find(n => n.type === 'battery' || n.data?.componentType === 'battery');
  const resistor = nodes.find(n => n.type === 'resistor' || n.data?.componentType === 'resistor');
  const vs = battery?.data?.voltage || 0;
  const r = resistor?.data?.resistance || 0;
  const i_mA = r > 0 ? ((vs / r) * 1000).toFixed(2) : 0;`,
  `  const vs = computedValues?.V_s || 0;
  const r = computedValues?.R_total || 0;
  let i_mA = computedValues?.I_mA || 0;
  if (typeof i_mA === 'number') i_mA = i_mA.toFixed(2);
  let r_disp = r > 1e6 ? '∞' : (typeof r === 'number' ? r.toFixed(1) : r);`
);

// Replace the string formatting for `r` to `r_disp` in explanations
code = code.replace(/resistor \$\{r\} Ohm/g, 'resistor ${r_disp} Ohm');
code = code.replace(/hambatan \$\{r\} Ohm/g, 'hambatan ${r_disp} Ohm');
code = code.replace(/resistance to the \$\{vs\}V/g, 'resistance to the ${vs}V'); // Ensure we don't accidentally match this if it uses `r` 
code = code.replace(/\$\{r\} Ohm resistance/g, '${r_disp} Ohm resistance');

fs.writeFileSync('backend/services/aiService.js', code);
console.log('patched aiService.js');
