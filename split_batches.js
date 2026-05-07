const fs = require('fs');

const content = fs.readFileSync('/root/.openclaw/workspace/vocabapp/seed.sql', 'utf8');

// Split the INSERT statement and the VALUES
// The header ends at "VALUES"
const valuesIdx = content.indexOf('VALUES');
const header = content.substring(0, valuesIdx) + 'VALUES\n';
const valuesPart = content.substring(valuesIdx + 7);

// Split by "  (" to get individual rows
const rows = valuesPart.split('\n').filter(l => l.trim().startsWith('('));

console.log('Total rows:', rows.length);

// Split into chunks of 30
const chunkSize = 30;
const chunks = [];
for (let i = 0; i < rows.length; i += chunkSize) {
  chunks.push(rows.slice(i, i + chunkSize));
}

console.log('Split into', chunks.length, 'chunks');

// Generate batch SQL files
chunks.forEach((chunk, idx) => {
  const batchSql = header + chunk.join(',\n') + ';';
  const filename = `/root/.openclaw/workspace/vocabapp/batch_${String(idx + 1).padStart(2, '0')}.sql`;
  fs.writeFileSync(filename, batchSql);
  console.log(`Batch ${idx + 1}: ${chunk.length} rows, ${batchSql.length} bytes -> ${filename}`);
});