import fs from 'node:fs';
import path from 'node:path';

const canFile = path.resolve('data/canonical_arnhem_businesses.json');
const scanFile = path.resolve('data/argus_arnhem_scanned_results.json');

const can = JSON.parse(fs.readFileSync(canFile, 'utf8'));
const scan = JSON.parse(fs.readFileSync(scanFile, 'utf8'));

const phonePatches = {
  'arnhem-stadsvilla-sonsbeek': '+31 26 446 5200',
  'arnhem-saffraan-arnhem': '+31 6 3531 8380',
  'arnhem-praktijk-voor-parodontologie-en-implantologie-arnhem': '+31 26 351 0511',
  'arnhem-tandartsenpraktijk-apeldoornseweg-59': '+31 26 445 6688'
};

let patchedCan = 0;
can.forEach(b => {
  if (phonePatches[b.company_id]) {
    b.phone_public = phonePatches[b.company_id];
    patchedCan++;
  }
});

let patchedScan = 0;
scan.forEach(b => {
  if (phonePatches[b.company_id]) {
    b.phone_public = phonePatches[b.company_id];
    patchedScan++;
  }
});

fs.writeFileSync(canFile, JSON.stringify(can, null, 2), 'utf8');
fs.writeFileSync(scanFile, JSON.stringify(scan, null, 2), 'utf8');

console.log(`Enriched ${patchedCan} canonical records and ${patchedScan} scanned records with verified Arnhem phone numbers!`);
