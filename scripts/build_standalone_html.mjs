import fs from 'fs';
import path from 'path';

const distDir = 'apps/web/dist';
const indexHtml = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

const assetsDir = path.join(distDir, 'assets');
const assetFiles = fs.readdirSync(assetsDir);
const cssFile = assetFiles.find(f => f.endsWith('.css'));
const jsFile = assetFiles.find(f => f.endsWith('.js'));

if (!cssFile || !jsFile) {
  console.error('Could not find bundled CSS or JS assets in ' + assetsDir);
  process.exit(1);
}

console.log('Bundling:', cssFile, 'and', jsFile);

const cssContent = fs.readFileSync(path.join(assetsDir, cssFile), 'utf8');
const jsContent = fs.readFileSync(path.join(assetsDir, jsFile), 'utf8');

// Build standalone single-file HTML
let standaloneHtml = indexHtml;
standaloneHtml = standaloneHtml.replace(
  /<link rel="stylesheet"[^>]+>/,
  `<style>\n${cssContent}\n</style>`
);
standaloneHtml = standaloneHtml.replace(
  /<script type="module"[^>]+><\/script>/,
  `<script>\n${jsContent}\n</script>`
);

fs.writeFileSync('ARGUS_INNOVATION_SIMULATOR.html', standaloneHtml, 'utf8');
const stat = fs.statSync('ARGUS_INNOVATION_SIMULATOR.html');
console.log(`Successfully created ARGUS_INNOVATION_SIMULATOR.html! Size: ${(stat.size / 1024).toFixed(1)} KB`);
