// "About me" documents: the user's resume and project documents (design docs, SDDs, notes).
// They are turned into plain text once, kept next to the settings, and given to Claude with
// every question so it can answer "tell me about yourself", "what did you do at Siemens?",
// "explain the business process of your project"… from the user's own words.

const fs = require('fs');
const path = require('path');

const KINDS = { resume: 'resume', docs: 'docs' };
const SUPPORTED = ['.pdf', '.docx', '.txt', '.md'];
const MAX_CHARS = { resume: 40000, docs: 60000 }; // per file; resumes are short, design docs can be long

// PDF text, page by page, keeping line breaks where the text moves to a new line.
async function pdfText(buf) {
  const pdfjs = require('pdfjs-dist/legacy/build/pdf.js');
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), isEvalSupported: false, useSystemFonts: false, verbosity: 0 }).promise;
  const pages = [];
  for (let n = 1; n <= doc.numPages; n++) {
    const content = await (await doc.getPage(n)).getTextContent();
    let line = '', lastY = null;
    const lines = [];
    for (const it of content.items) {
      const y = it.transform ? Math.round(it.transform[5]) : lastY;
      if (lastY !== null && y !== lastY && line.trim()) { lines.push(line.trim()); line = ''; }
      line += it.str + (it.hasEOL ? '\n' : '');
      lastY = y;
    }
    if (line.trim()) lines.push(line.trim());
    pages.push(lines.join('\n'));
  }
  await doc.destroy();
  return pages.join('\n\n');
}

async function extractText(file) {
  const ext = path.extname(file).toLowerCase();
  const buf = fs.readFileSync(file);
  let text;
  if (ext === '.pdf') {
    text = await pdfText(buf);
  } else if (ext === '.docx') {
    text = (await require('mammoth').extractRawText({ buffer: buf })).value;
  } else if (ext === '.txt' || ext === '.md') {
    text = buf.toString('utf8');
  } else {
    throw new Error(`"${path.basename(file)}" is not a supported file. Use PDF, Word (.docx), .txt or .md.`);
  }
  text = String(text || '').replace(/\r/g, '').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (text.length < 40) throw new Error(`No readable text in "${path.basename(file)}". If it is a scanned PDF, save it as Word or text first.`);
  return text;
}

class DocumentStore {
  constructor(dir) {
    this.dir = dir;
  }

  folder(kind) { return path.join(this.dir, KINDS[kind]); }

  // Copies the document in as text. A new resume replaces the old one.
  async add(kind, file) {
    if (!KINDS[kind]) throw new Error('unknown document kind');
    const text = (await extractText(file)).slice(0, MAX_CHARS[kind]);
    const dir = this.folder(kind);
    fs.mkdirSync(dir, { recursive: true });
    if (kind === 'resume') for (const f of fs.readdirSync(dir)) fs.rmSync(path.join(dir, f), { force: true });
    const name = path.basename(file);
    const out = path.join(dir, name.replace(/[^\w.\- ]+/g, '_') + '.txt');
    fs.writeFileSync(out, text);
    return { name, chars: text.length, file: out };
  }

  remove(kind, name) {
    const p = path.join(this.folder(kind), path.basename(name) + '.txt');
    fs.rmSync(p, { force: true });
  }

  // [{ kind, name, text }]
  list() {
    const out = [];
    for (const kind of Object.keys(KINDS)) {
      const dir = this.folder(kind);
      if (!fs.existsSync(dir)) continue;
      for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.txt')).sort()) {
        try { out.push({ kind, name: f.slice(0, -4), text: fs.readFileSync(path.join(dir, f), 'utf8') }); } catch {}
      }
    }
    return out;
  }

  summary() {
    const l = this.list();
    return { resume: l.filter(d => d.kind === 'resume').map(d => d.name), docs: l.filter(d => d.kind === 'docs').map(d => d.name) };
  }
}

module.exports = { DocumentStore, extractText, SUPPORTED, MAX_CHARS };
