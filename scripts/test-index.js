// Usage: node scripts/test-index.js "<project folder>" "your question"
// Shows which files the copilot would send to Claude for that question — no API call.
const { ProjectIndex } = require('../src/context');
const [folder, ...q] = process.argv.slice(2);
if (!folder) { console.log('Usage: node scripts/test-index.js "<folder>" "question"'); process.exit(1); }
const idx = new ProjectIndex({ projectFolders: [folder] });
const s = idx.build();
console.log('Indexed:', s);
const question = q.join(' ') || 'what did you build';
const top = idx.search(question, 20000);
console.log(`\nTop matches for: "${question}"`);
for (const c of top.slice(0, 10)) console.log(`  ${c.rel}  (line ${c.startLine})`);
const ctx = idx.contextFor(question);
console.log(`\nMode: ${ctx.mode} · context size ~${Math.round(ctx.text.length / 4 / 1000)}k tokens`);
