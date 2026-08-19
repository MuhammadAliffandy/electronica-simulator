const fs = require('fs');
let code = fs.readFileSync('frontend/src/components/organisms/TutorPanel.jsx', 'utf8');

const badPath = '<path d="M12 2a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v2h2v4h-2v2a2 2 0 0 1-2 2h-3v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2H5a2 2 0 0 1-2-2v-2H1v-4h2V8a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2h2z"/>';
const goodPath = '<path d="M12 2a2 2 0 0 1 2 2v2h3a2 2 0 0 1 2 2v2h2v4h-2v2a2 2 0 0 1-2 2h-3v2a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2H5a2 2 0 0 1-2-2v-2H1v-4h2V8a2 2 0 0 1 2-2h3V4a2 2 0 0 1 2-2h2zM7 14v4h10v-4H7zm3-4a1 1 0 1 0 0 2 1 1 0 0 0 0-2zm4 0a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>';

code = code.split(badPath).join(goodPath);

fs.writeFileSync('frontend/src/components/organisms/TutorPanel.jsx', code);
console.log('patched svgs');
