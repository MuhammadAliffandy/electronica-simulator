const fs = require('fs');
const path = require('path');

const nodesDir = path.join(__dirname, 'frontend/src/components/organisms/Nodes');
const files = fs.readdirSync(nodesDir).filter(f => f.endsWith('.jsx') && f !== 'BaseNode.jsx');

for (const file of files) {
  const filePath = path.join(nodesDir, file);
  let code = fs.readFileSync(filePath, 'utf8');

  // Add BaseNode import
  if (!code.includes('BaseNode')) {
    code = code.replace(/import \{.*?\} from "@xyflow\/react";\n/, (match) => {
      return match + `import { BaseNode } from "./BaseNode";\n`;
    });
  }

  // Remove NodeDeleteButton and ErrorBadge imports
  code = code.replace(/import \{ NodeDeleteButton \} from "\.\.\/\.\.\/atoms\/NodeDeleteButton";\n/g, '');
  code = code.replace(/import \{ ErrorBadge \} from "\.\.\/\.\.\/molecules\/ErrorBadge";\n/g, '');

  // Extract class name
  const classNameMatch = code.match(/className=\{`circuit-node \$\{data\.isSuccess \? "success" : ""\} (.*?) \$\{selected \? "selected" : ""\}`\}/);
  const nodeClassName = classNameMatch ? classNameMatch[1] : (file.replace('Node.jsx', '').toLowerCase() + '-node');

  // Replace wrapper start
  code = code.replace(/<div className=\{`circuit-node[^\n]*\n\s*<NodeDeleteButton id=\{id\} \/>\n\s*<ErrorBadge data=\{data\} \/>/, `<BaseNode id={id} data={data} selected={selected} className="${nodeClassName}">`);
  
  // Clean up any remaining wrapper starts if the above regex missed it (e.g., if formatted differently)
  if (!code.includes('<BaseNode')) {
     code = code.replace(/<div className=\{`circuit-node[^\n]*/, `<BaseNode id={id} data={data} selected={selected} className="${nodeClassName}">`);
     code = code.replace(/\s*<NodeDeleteButton id=\{id\} \/>\n/, '');
     code = code.replace(/\s*<ErrorBadge data=\{data\} \/>\n/, '');
  }

  // Replace trailing </div> with </BaseNode>
  // We want to replace only the outermost </div>.
  // Finding the outermost </div> can be tricky with regex, but usually it's the last </div> before the final }
  const parts = code.split('</div>\n  );\n}');
  if (parts.length === 2) {
    code = parts[0] + '</BaseNode>\n  );\n}';
  } else {
    // try different formatting
    const parts2 = code.split('</div>\n    );\n}');
    if (parts2.length === 2) {
      code = parts2[0] + '</BaseNode>\n    );\n}';
    }
  }

  // Remove explicit Handles if they are the default 2-way handles
  // Wait, Transistor has 3 handles, Diode has specific ids, LED has specific ids.
  // I will just pass handles prop if it's not the default. Or better, just let BaseNode handle it, BUT the handles inside the files shouldn't be rendered twice.
  // Actually, wait: Diode has "anode" and "cathode" ids. 
  // BaseNode uses "left" and "right". We should just remove Handles and pass `handles={[...]}` to BaseNode if they differ.
  // Doing this with a script is risky for 14 files. Let me just do it file by file or with a targeted script.

  // Instead of a full script, I will just do a simple replacement for the simple ones, and manually fix the complex ones.
}
