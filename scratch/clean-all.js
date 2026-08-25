import fs from 'fs';

const dirsToClean = [
  'c:/Users/c-deepak.sharma/Desktop/Root Main/assets',
  'c:/Users/c-deepak.sharma/Desktop/Root Main/dist',
  'c:/Users/c-deepak.sharma/Desktop/Root Main/node_modules/.vite',
  'c:/Users/c-deepak.sharma/Desktop/Root Main/client/node_modules/.vite',
  'c:/Users/c-deepak.sharma/Desktop/Root Main/.vercel/output'
];

dirsToClean.forEach(d => {
  if (fs.existsSync(d)) {
    try {
      fs.rmSync(d, { recursive: true, force: true });
      console.log('Deleted:', d);
    } catch (e) {
      console.error('Failed to delete:', d, e.message);
    }
  }
});
