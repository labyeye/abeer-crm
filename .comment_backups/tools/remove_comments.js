#!/usr/bin/env node
// tools/remove_comments.js
// Walk the workspace, back up files to .comment_backups, and remove comments from source files.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BACKUP_DIR = path.join(ROOT, '.comment_backups');

const SKIP_DIRS = new Set(['.git', 'node_modules', '.comment_backups', 'dist', 'build']);

const TEXT_EXT = new Set([
  '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.htm', '.css', '.scss', '.md', '.py', '.java', '.c', '.cpp', '.h', '.cs', '.rb', '.php', '.sh', '.yml', '.yaml', '.env', '.txt'
]);

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function isBinary(filePath) {
  // quick heuristic: check for null bytes in first 8000 bytes
  try {
    const fd = fs.openSync(filePath, 'r');
    const buf = Buffer.alloc(8000);
    const read = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    for (let i = 0; i < read; i++) if (buf[i] === 0) return true;
    return false;
  } catch (e) {
    return true;
  }
}

function removeCommentsFromCode(code, ext) {
  // For JSON: just return original (removing comments from JSON is risky) unless a .jsonc
  if (ext === '.json') return code;

  // Simple state-machine to remove // line comments and /* */ block comments while preserving strings.
  let out = '';
  let i = 0;
  const len = code.length;
  let state = 'normal'; // normal, s_quote, d_quote, t_quote, regex, line_comment, block_comment
  let prev = '';

  while (i < len) {
    const ch = code[i];
    const ch2 = code[i + 1];

    if (state === 'normal') {
      if (ch === '/' && ch2 === '/') {
        state = 'line_comment';
        i += 2; // skip
        continue;
      }
      if (ch === '/' && ch2 === '*') {
        state = 'block_comment';
        i += 2;
        continue;
      }
      if (ch === '"') {
        state = 'd_quote';
        out += ch; i++; continue;
      }
      if (ch === "'") {
        state = 's_quote';
        out += ch; i++; continue;
      }
      if (ch === '`') {
        state = 't_quote';
        out += ch; i++; continue;
      }
      out += ch;
      i++;
      continue;
    }

    if (state === 'line_comment') {
      if (ch === '\n') { out += ch; state = 'normal'; }
      i++; continue;
    }

    if (state === 'block_comment') {
      if (ch === '*' && ch2 === '/') { state = 'normal'; i += 2; continue; }
      // preserve newlines to keep line numbers similar
      if (ch === '\n') out += '\n';
      i++; continue;
    }

    if (state === 'd_quote') {
      if (ch === '\\') { out += ch; out += code[i+1] || ''; i += 2; continue; }
      if (ch === '"') { out += ch; state = 'normal'; i++; continue; }
      out += ch; i++; continue;
    }

    if (state === 's_quote') {
      if (ch === '\\') { out += ch; out += code[i+1] || ''; i += 2; continue; }
      if (ch === "'") { out += ch; state = 'normal'; i++; continue; }
      out += ch; i++; continue;
    }

    if (state === 't_quote') {
      if (ch === '\\') { out += ch; out += code[i+1] || ''; i += 2; continue; }
      if (ch === '`') { out += ch; state = 'normal'; i++; continue; }
      out += ch; i++; continue;
    }

    // fallback
    out += ch; i++;
  }

  return out;
}

function processFile(filePath) {
  const rel = path.relative(ROOT, filePath);
  try {
    if (isBinary(filePath)) return false;
    const ext = path.extname(filePath).toLowerCase();
    if (!TEXT_EXT.has(ext)) return false;
    const orig = fs.readFileSync(filePath, 'utf8');
    const stripped = removeCommentsFromCode(orig, ext);
    if (stripped === orig) return false;
    // backup
    const backupPath = path.join(BACKUP_DIR, rel);
    ensureDir(path.dirname(backupPath));
    fs.writeFileSync(backupPath, orig, 'utf8');
    fs.writeFileSync(filePath, stripped, 'utf8');
    return true;
  } catch (e) {
    console.error('Error processing', rel, e.message);
    return false;
  }
}

function walk(dir, changedFiles) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const ent of entries) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full, changedFiles);
    else if (ent.isFile()) {
      const ok = processFile(full);
      if (ok) changedFiles.push(path.relative(ROOT, full));
    }
  }
}

function main() {
  ensureDir(BACKUP_DIR);
  const changed = [];
  console.log('Scanning and removing comments from', ROOT);
  walk(ROOT, changed);
  console.log('\nDone. Files changed:', changed.length);
  if (changed.length) console.log(changed.join('\n'));
  console.log('\nBackups saved under', BACKUP_DIR);
}

if (require.main === module) main();
