import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const ROOT = process.cwd();

function runOxlint() {
  try {
    const out = execSync('npx oxlint -f json', { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
    return JSON.parse(out).diagnostics || [];
  } catch (err) {
    if (err.stdout) {
      return JSON.parse(err.stdout.toString()).diagnostics || [];
    }
    return [];
  }
}

function cleanImports() {
  const diagnostics = runOxlint();
  const fileToUnusedImports = new Map();

  for (const d of diagnostics) {
    if (d.code === 'eslint(no-unused-vars)' && d.help && d.help.includes('import')) {
      const match = d.message.match(/Identifier '([^']+)' is imported but never used/);
      if (match) {
        const id = match[1];
        const filepath = path.resolve(ROOT, d.filename);
        if (!fileToUnusedImports.has(filepath)) {
          fileToUnusedImports.set(filepath, new Set());
        }
        fileToUnusedImports.get(filepath).add(id);
      }
    }
  }

  for (const [filepath, unusedSet] of fileToUnusedImports.entries()) {
    if (!fs.existsSync(filepath)) continue;
    let content = fs.readFileSync(filepath, 'utf-8');

    for (const id of unusedSet) {
      // Look within import statements
      content = content.replace(/(import\s*\{[^}]+\}\s*from\s*['"][^'"]+['"];?)/g, (fullImport) => {
        // Only replace inside this import statement if it contains the id
        const re = new RegExp(`\\b${id}\\b\\s*,?\\s*`);
        let updated = fullImport.replace(re, '');
        // Clean trailing/leading commas inside braces
        updated = updated.replace(/\{\s*,/g, '{').replace(/,\s*\}/g, '}').replace(/,\s*,/g, ',');
        return updated;
      });

      // 2. Default import: import id from '...'; or import id, { ... } from '...';
      content = content.replace(new RegExp(`import\\s+${id}\\s*,\\s*(\\{[^}]+\\})\\s*from\\s*['"][^'"]+['"];?`, 'g'), 'import $1 from');
      content = content.replace(new RegExp(`import\\s+${id}\\s*from\\s*['"][^'"]+['"];?\\r?\\n?`, 'g'), '');
    }

    // Clean up empty import statements: import { } from '...';
    content = content.replace(/import\s*\{\s*\}\s*from\s*['"][^'"]+['"];?\r?\n?/g, '');

    fs.writeFileSync(filepath, content, 'utf-8');
  }

  console.log(`Cleaned unused imports across ${fileToUnusedImports.size} files.`);
}

cleanImports();
