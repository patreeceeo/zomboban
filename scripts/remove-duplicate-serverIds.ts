// Usage: ts-node scripts/normalize-server-ids.ts path/to/data.json [output.json]
// Normalizes serverIds in the input JSON file as described in your requirements.
// The lowest serverId becomes 0, the next lowest 1, etc. Duplicates are resolved by assigning the next unused serverId.

import * as fs from 'fs';

if (process.argv.length < 3) {
  console.error(`Usage: tsx ${process.argv[0]} path/to/data.json [output.json]`);
  process.exit(1);
}

const inputPath = process.argv[2];
const outputPath = process.argv[3] || inputPath.replace(/\.json$/, '.normalized.json');

const raw = fs.readFileSync(inputPath, 'utf-8');
const entities: {serverId: number}[] = JSON.parse(raw);

for(const [index, entity] of entities.entries()) {
  entity.serverId = index;
}

fs.writeFileSync(outputPath, JSON.stringify(entities, null, 2));
console.log(`Wrote to ${outputPath}`);
