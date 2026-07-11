const fs = require('fs');
const path = require('path');

const nodesDir = path.join(__dirname, 'frontend/src/components/organisms/Nodes');
const files = fs.readdirSync(nodesDir).filter(f => f.endsWith('.jsx') && f !== 'BaseNode.jsx');

const complexNodes = ['TransistorNode.jsx', 'DiodeNode.jsx', 'LEDNode.jsx', 'MotorNode.jsx', 'BuzzerNode.jsx', 'OscilloscopeNode.jsx', 'SwitchNode.jsx', 'WireJunctionNode.jsx', 'PotentiometerNode.jsx'];

for (const file of files) {
  const filePath = path.join(nodesDir, file);
  let code = fs.readFileSync(filePath, 'utf8');

  // Add BaseNode import
  if (!code.includes('BaseNode')) {
    code = `import { BaseNode } from "./BaseNode";\n` + code;
  }

  // Remove unused imports
  code = code.replace(/import \{ NodeDeleteButton \}.*\n/g, '');
  code = code.replace(/import \{ ErrorBadge \}.*\n/g, '');
  code = code.replace(/import \{ TwoWayHandles \}.*\n/g, '');
  
  // Extract className
  const match = code.match(/className=\{`circuit-node[^{]*?(\$\{data\.isSuccess[^}]*?\})?([^$]*?)\$\{selected \? "selected" : ""\}`\}/);
  let nodeClassName = file.replace('Node.jsx', '').toLowerCase() + '-node';
  if (match && match[2]) {
    nodeClassName = match[2].trim();
  }

  const isComplex = complexNodes.includes(file);
  const baseNodeTag = isComplex 
    ? `<BaseNode id={id} data={data} selected={selected} className="${nodeClassName}" handles={[]}>` 
    : `<BaseNode id={id} data={data} selected={selected} className="${nodeClassName}">`;

  // Replace wrapper
  code = code.replace(/<div className=\{`circuit-node[^>]*>/, baseNodeTag);
  code = code.replace(/\s*<NodeDeleteButton id=\{id\} \/>\n/g, '');
  code = code.replace(/\s*<ErrorBadge data=\{data\} \/>\n/g, '');
  code = code.replace(/\s*<TwoWayHandles \/>\n/g, '');
  
  if (!isComplex) {
    code = code.replace(/\s*<Handle[^>]*id="left"[^>]*\/>/g, '');
    code = code.replace(/\s*<Handle[^>]*id="right"[^>]*\/>/g, '');
  }

  // Fix closing tag
  code = code.replace(/<\/div>\s*\);\s*\}\s*$/s, '</BaseNode>\n  );\n}\n');

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`Refactored ${file}`);
}
