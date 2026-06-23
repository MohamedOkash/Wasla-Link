const fs = require('fs');
let c = fs.readFileSync('src/services/revenue.service.ts', 'utf8');
if (!c.includes('collection')) {
  c = c.replace(/import \{([^}]+)\} from 'firebase\/firestore';/, "import {$1, collection} from 'firebase/firestore';");
  fs.writeFileSync('src/services/revenue.service.ts', c);
}
