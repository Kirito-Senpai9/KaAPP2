import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = process.cwd();
const TARGET_DIR = join(ROOT, 'src');
const IGNORED_DIRS = new Set(['node_modules', '.git', '.expo', 'dist', 'build']);
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const LEGACY_PATTERN = /@\/screens\//g;

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;

    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath, files);
      continue;
    }

    if (!ALLOWED_EXTENSIONS.has(fullPath.slice(fullPath.lastIndexOf('.')))) continue;
    files.push(fullPath);
  }
  return files;
}

const matches = [];
for (const filePath of walk(TARGET_DIR)) {
  const content = readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    if (LEGACY_PATTERN.test(line)) {
      matches.push({
        file: relative(ROOT, filePath),
        lineNumber: index + 1,
        line: line.trim(),
      });
    }
    LEGACY_PATTERN.lastIndex = 0;
  });
}

if (matches.length > 0) {
  console.error('❌ Imports legados detectados. Use apenas @/features/*/screens.');
  for (const match of matches) {
    console.error(` - ${match.file}:${match.lineNumber} -> ${match.line}`);
  }
  process.exit(1);
}

console.log('✅ Nenhum import legado @/screens/* encontrado.');
