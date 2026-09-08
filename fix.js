const fs = require('fs');
let c = fs.readFileSync('apps/web/src/api/argus.ts', 'utf8');
c = c.replace(/\\\`/g, '\`');
c = c.replace(/\\\$/g, '$');
fs.writeFileSync('apps/web/src/api/argus.ts', c);
