// Project indexer + retrieval.
// Small projects  -> whole project goes to Claude (cached, fast on repeat questions).
// Large projects  -> files are chunked and the chunks most relevant to the question are sent.

const fs = require('fs');
const path = require('path');

const DEFAULT_EXTENSIONS = [
  '.cls', '.trigger', '.apex', '.soql', '.page', '.component', '.cmp', '.app', '.evt',
  '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.xml', '.json', '.yaml', '.yml',
  '.md', '.txt', '.py', '.java', '.sql', '.email', '.design', '.intf'
];

const DEFAULT_IGNORE_DIRS = [
  'node_modules', '.git', '.sfdx', '.sf', '.vscode', '.idea', 'dist', 'build', 'out',
  'coverage', '__pycache__', '.localdevserver', 'staticresources', '.husky', 'venv', '.venv',
  // Salesforce metadata that names every field and class, so it drowns out the real code.
  'profiles', 'permissionsets', 'permissionsetgroups', 'translations', 'objectTranslations', 'layouts'
];

const STOPWORDS = new Set((
  'the a an and or but if then so to of in on at for with from by as is are was were be been ' +
  'it this that these those you your i me my we our they them he she his her do did does done ' +
  'can could would should will shall may might have has had what why how when where which who ' +
  'whom about into over under than there here just also very tell explain walk through please ' +
  'kya kaise kyun kab kaun hai ho tha the ki ka ke ko se me mein aur ya ne bhi par'
).split(/\s+/));

// Salesforce DX writes a "<source file>-meta.xml" next to Apex, LWC, Aura and VF source.
// Those hold only apiVersion/status, so skip them. Standalone metadata (flows, objects,
// fields, labels, custom metadata, flexipages…) IS the work and must stay indexed.
const COMPANION_META = /\.(cls|trigger|page|component|js|html|css|cmp|app|evt|intf|design|auradoc|svg|tokens|resource|asset|email)-meta\.xml$/i;

const TREE_MAX_CHARS = 15000;      // file list sent with every question
const RETRIEVAL_MAX_CHUNKS = 30;   // top excerpts per question
const RETRIEVAL_SCORE_FLOOR = 0.3; // drop excerpts scoring under 30% of the best one

// Split camelCase / PascalCase / snake_case so "WorkOrderTriggerHandler" matches "work order trigger".
function tokenize(text) {
  const spaced = text
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[_\-./\\]/g, ' ');
  return spaced
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(t => t.length >= 2 && !STOPWORDS.has(t));
}

function walk(root, exts, ignoreDirs, maxFileBytes, out = [], skipped = []) {
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return out; }
  for (const e of entries) {
    const full = path.join(root, e.name);
    if (e.isDirectory()) {
      if (ignoreDirs.includes(e.name) || e.name.startsWith('.')) continue;
      walk(full, exts, ignoreDirs, maxFileBytes, out, skipped);
    } else if (e.isFile()) {
      if (COMPANION_META.test(e.name)) continue; // e.g. Foo.cls-meta.xml: only apiVersion/status
      if (e.name === 'package-lock.json') continue;
      const ext = path.extname(e.name).toLowerCase();
      if (!exts.includes(ext)) continue;
      let size;
      try { size = fs.statSync(full).size; } catch { continue; }
      if (size === 0) continue;
      if (size > maxFileBytes) { skipped.push(full); continue; }
      out.push(full);
    }
  }
  return out;
}

class ProjectIndex {
  constructor(cfg = {}) {
    this.folders = cfg.projectFolders || [];
    this.notesFiles = cfg.notesFiles || [];
    this.aboutMe = cfg.aboutMe || []; // [{ kind: 'resume' | 'docs', name, text }]
    this.exts = (cfg.extensions || DEFAULT_EXTENSIONS).map(e => e.toLowerCase());
    this.ignoreDirs = cfg.ignoreDirs || DEFAULT_IGNORE_DIRS;
    this.maxFileBytes = cfg.maxFileKB ? cfg.maxFileKB * 1024 : 200 * 1024;
    this.fullContextChars = cfg.fullContextChars || 200000; // ~50k tokens, cached between questions
    this.retrievalChars = cfg.retrievalChars || 60000;      // ~15k tokens of excerpts per question
    this.chunkLines = 80;
    this.files = [];
    this.chunks = [];
    this.totalChars = 0;
  }

  build() {
    this.files = [];
    this.chunks = [];
    this.totalChars = 0;
    this.skippedLarge = [];
    for (const folder of this.folders) {
      if (!fs.existsSync(folder)) continue;
      for (const file of walk(folder, this.exts, this.ignoreDirs, this.maxFileBytes, [], this.skippedLarge)) {
        let text;
        try { text = fs.readFileSync(file, 'utf8'); } catch { continue; }
        if (text.includes('\u0000')) continue; // binary
        const rel = path.join(path.basename(folder), path.relative(folder, file));
        this.files.push({ rel, text });
        this.totalChars += text.length;
      }
    }
    this.notes = [];
    for (const n of this.notesFiles) {
      try { this.notes.push({ rel: path.basename(n), text: fs.readFileSync(n, 'utf8') }); } catch {}
    }
    this._buildChunks();
    return this.stats();
  }

  stats() {
    return {
      files: this.files.length,
      chunks: this.chunks.length,
      chars: this.totalChars,
      approxTokens: Math.round(this.totalChars / 4),
      mode: this.totalChars <= this.fullContextChars ? 'full' : 'retrieval',
      notes: this.notes ? this.notes.length : 0,
      resume: this.aboutMe.filter(d => d.kind === 'resume').length,
      docs: this.aboutMe.filter(d => d.kind === 'docs').length,
      skippedLarge: (this.skippedLarge || []).length
    };
  }

  _buildChunks() {
    const df = new Map();
    for (const f of this.files) {
      const lines = f.text.split('\n');
      const pathTokens = tokenize(f.rel);
      const step = this.chunkLines - 10;
      for (let start = 0; start < lines.length; start += step) {
        const body = lines.slice(start, start + this.chunkLines).join('\n');
        // path tokens repeated so file/class names weigh more than a random mention
        const toks = tokenize(body).concat(pathTokens, pathTokens, pathTokens);
        const tf = new Map();
        for (const t of toks) tf.set(t, (tf.get(t) || 0) + 1);
        for (const t of tf.keys()) df.set(t, (df.get(t) || 0) + 1);
        this.chunks.push({ rel: f.rel, startLine: start + 1, body, tf, len: toks.length });
        if (start + this.chunkLines >= lines.length) break;
      }
    }
    this.df = df;
    this.avgLen = this.chunks.reduce((s, c) => s + c.len, 0) / Math.max(1, this.chunks.length);
  }

  // BM25 ranking of chunks for the question.
  search(query, limitChars = this.retrievalChars) {
    const q = [...new Set(tokenize(query))];
    const N = this.chunks.length || 1;
    const k1 = 1.4, b = 0.75;
    const scored = [];
    for (const c of this.chunks) {
      let s = 0;
      for (const t of q) {
        const f = c.tf.get(t);
        if (!f) continue;
        const n = this.df.get(t) || 0;
        const idf = Math.log(1 + (N - n + 0.5) / (n + 0.5));
        s += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * c.len / this.avgLen));
      }
      if (s > 0) scored.push({ c, s });
    }
    scored.sort((x, y) => y.s - x.s);
    const floor = scored.length ? scored[0].s * RETRIEVAL_SCORE_FLOOR : 0;
    const picked = [];
    let used = 0;
    for (const { c, s } of scored) {
      if (s < floor || picked.length >= RETRIEVAL_MAX_CHUNKS) break;
      if (used + c.body.length > limitChars) continue;
      picked.push(c);
      used += c.body.length;
      if (used > limitChars * 0.95) break;
    }
    return picked;
  }

  // Full file list when it is short; otherwise one line per folder with a file count.
  fileTree(maxChars = TREE_MAX_CHARS) {
    const all = this.files.map(f => f.rel).sort();
    const full = all.join('\n');
    if (full.length <= maxChars) return full;

    const byDir = new Map();
    for (const rel of all) {
      const dir = path.dirname(rel);
      if (!byDir.has(dir)) byDir.set(dir, []);
      byDir.get(dir).push(path.basename(rel));
    }
    const lines = [];
    let used = 0;
    let shown = 0;
    for (const [dir, files] of byDir) {
      let line = `${dir}/ (${files.length} files): ${files.slice(0, 4).join(', ')}${files.length > 4 ? ', …' : ''}`;
      if (line.length > 200) line = line.slice(0, 197) + '…';
      if (used + line.length + 1 > maxChars - 60) break;
      lines.push(line);
      used += line.length + 1;
      shown++;
    }
    if (shown < byDir.size) lines.push(`… and ${byDir.size - shown} more folders (${all.length} files in total)`);
    return lines.join('\n');
  }

  // Returns { text, mode, sources } — the project context for one question.
  // text     -> stable per meeting (notes, file list, whole project): safe to prompt-cache.
  // excerpts -> chosen for this question (retrieval mode only): sent with the question.
  contextFor(question, { retrievalChars } = {}) {
    const parts = [];
    const full = this.totalChars <= this.fullContextChars;
    parts.push(!this.files.length
      ? 'MODE: notes only - no project files were indexed; only the notes below are available.'
      : full
        ? 'MODE: whole project - every indexed file is included below.'
        : 'MODE: excerpts only - the file list names every file, but only the excerpts sent with the question were read. ' +
          'A file name alone is not evidence of what the file does. If a listed file looks relevant but was not excerpted, ' +
          'say which file and that you would need to check it, instead of guessing or saying it is not in the files.');
    const resume = this.aboutMe.filter(d => d.kind === 'resume');
    const docs = this.aboutMe.filter(d => d.kind === 'docs');
    if (resume.length) {
      parts.push('=== MY RESUME (my real career: companies, roles, dates, projects, skills, certifications) ===');
      for (const d of resume) parts.push(`--- ${d.name} ---\n${d.text}`);
    } else {
      parts.push('=== MY RESUME ===\n(not added yet)');
    }
    if (docs.length) {
      parts.push('=== MY PROJECT DOCUMENTS (design documents and notes about my projects) ===');
      for (const d of docs) parts.push(`--- ${d.name} ---\n${d.text}`);
    }
    if (this.notes.length) {
      parts.push('=== MY WORK NOTES (written by me, most reliable) ===');
      for (const n of this.notes) parts.push(`--- ${n.rel} ---\n${n.text}`);
    }
    parts.push('=== PROJECT FILE LIST ===\n' + this.fileTree());

    if (!this.files.length) return { text: parts.join('\n\n'), excerpts: '', mode: 'notes', sources: [] };

    if (full) {
      parts.push('=== FULL PROJECT FILES ===');
      for (const f of this.files) parts.push(`--- FILE: ${f.rel} ---\n${f.text}`);
      return { text: parts.join('\n\n'), excerpts: '', mode: 'full', sources: this.files.map(f => f.rel) };
    }

    const chunks = this.search(question, retrievalChars || this.retrievalChars);
    const ex = chunks.length
      ? ['=== MOST RELEVANT EXCERPTS FROM MY PROJECT ===', ...chunks.map(c => `--- FILE: ${c.rel} (from line ${c.startLine}) ---\n${c.body}`)]
      : ['=== MOST RELEVANT EXCERPTS FROM MY PROJECT ===', '(no file matched this question)'];
    return { text: parts.join('\n\n'), excerpts: ex.join('\n\n'), mode: 'retrieval', sources: [...new Set(chunks.map(c => c.rel))] };
  }
}

module.exports = { ProjectIndex, tokenize, DEFAULT_EXTENSIONS, DEFAULT_IGNORE_DIRS };
