import fs from 'fs';
import path from 'path';

const srcDir = 'c:/Users/c-deepak.sharma/Desktop/Root Main/client/src';

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  content = content.replace(/cyber/g, 'pulse');
  content = content.replace(/Cyber/g, 'Pulse');
  content = content.replace(/CYBER/g, 'PULSE');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated:', filePath);
  }
}

function processDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.jsx') || entry.name.endsWith('.js') || entry.name.endsWith('.css') || entry.name.endsWith('.html'))) {
      replaceInFile(fullPath);
    }
  }
}

// 1. Rename cyber.css to theme.css if it exists
const cyberCssPath = path.join(srcDir, 'styles', 'cyber.css');
const themeCssPath = path.join(srcDir, 'styles', 'theme.css');

if (fs.existsSync(cyberCssPath)) {
  const cssContent = fs.readFileSync(cyberCssPath, 'utf8');
  fs.writeFileSync(themeCssPath, cssContent, 'utf8');
  fs.unlinkSync(cyberCssPath);
  console.log('Renamed cyber.css -> theme.css');
}

// 2. Process all files in client/src
processDir(srcDir);

// 3. Process client/styles.css and root files
const extraFiles = [
  'c:/Users/c-deepak.sharma/Desktop/Root Main/client/styles.css',
  'c:/Users/c-deepak.sharma/Desktop/Root Main/client/index.html',
  'c:/Users/c-deepak.sharma/Desktop/Root Main/index.html'
];

for (const f of extraFiles) {
  if (fs.existsSync(f)) {
    replaceInFile(f);
  }
}

console.log('Complete cyber removal script executed successfully.');
