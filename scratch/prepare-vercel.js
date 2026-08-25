import fs from 'fs';
import path from 'path';

const distDir = 'c:/Users/c-deepak.sharma/Desktop/Root Main/dist';
const staticDir = 'c:/Users/c-deepak.sharma/Desktop/Root Main/.vercel/output/static';

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursiveSync(path.join(src, childItemName), path.join(dest, childItemName));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

copyRecursiveSync(distDir, staticDir);
console.log('Successfully populated .vercel/output/static from dist');
