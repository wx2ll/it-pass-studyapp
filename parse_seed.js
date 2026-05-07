const fs = require('fs');

const content = fs.readFileSync('/root/.openclaw/media/inbound/deepseek_csv_20260507_17bc21---c0e500ad-098d-4d28-97dd-bce75fd7a8b9.txt', 'utf8');

// Split content by rows - each row starts with "number.word" at the beginning of a line
const rowPattern = /(?<=\n)"(\d+)\.([^"]+)"/g;
let matches = [...content.matchAll(rowPattern)];

console.log('Row markers found:', matches.length);

// Build individual row strings
let rawRows = [];
let lastIndex = 0;

for (const m of matches) {
  const start = m.index;
  const rowText = content.substring(lastIndex, start).trim();
  if (rowText) rawRows.push(rowText);
  lastIndex = start;
}
const lastText = content.substring(lastIndex).trim();
if (lastText) rawRows.push(lastText);

console.log('Total rows (including header):', rawRows.length);
// rawRows[0] is header, rawRows[1..30] is page 1, rawRows[31..60] is page 2, etc.

// Skip header (index 0)
let currentPage = 1;
let wordNum = 1;
let insertStatements = [];

for (let i = 1; i < rawRows.length; i++) {
  const raw = rawRows[i];
  
  // Parse the first field to get word number and name
  const firstComma = raw.indexOf(',');
  const firstField = raw.substring(0, firstComma).replace(/"/g, '');
  
  // Extract number and word name
  const numMatch = firstField.match(/^(\d+)\.(.+)/);
  if (!numMatch) {
    console.log('Could not parse first field at row', i, ':', firstField.substring(0, 50));
    continue;
  }
  
  let rowNum = parseInt(numMatch[1]);
  let wordName = numMatch[2];
  
  // Detect new page when number resets to 1 (and we've seen more than 1 word)
  if (rowNum === 1 && wordNum > 1) {
    currentPage++;
    console.log('New page detected at row', i, '- now page', currentPage);
  }
  
  // Extract the remaining fields (Overview, Usage, Examples, Quick Memory)
  // These are all the content after the first comma, which may contain newlines
  const rest = raw.substring(firstComma + 1);
  
  // Split rest by the last 4 double-quote-comma patterns to get the 4 fields
  // Format: "field1","field2","field3","field4"
  // But fields can contain newlines within quotes
  
  // Find field boundaries - they end with "," except the last one ends with "
  const fieldParts = [];
  let depth = 0;
  let current = '';
  
  for (let j = 0; j < rest.length; j++) {
    const char = rest[j];
    if (char === '"') {
      depth++;
    } else if (char === ',' && depth % 2 === 0) {
      fieldParts.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fieldParts.push(current); // last field
  
  let overview = fieldParts[0] || '';
  let usage = fieldParts[1] || '';
  let examples = fieldParts[2] || '';
  let quickMem = fieldParts[3] || '';
  
  // Parse EN/JP from overview
  let overview_en = overview;
  let overview_jp = '';
  if (overview.includes('JP:')) {
    const idx = overview.indexOf('JP:');
    overview_en = overview.substring(0, idx).replace('EN:', '').trim();
    overview_jp = overview.substring(idx + 3).trim();
  } else {
    overview_en = overview.replace('EN:', '').trim();
  }
  
  // Parse EN/JP from quick memory
  let qm_en = '';
  let qm_jp = '';
  if (quickMem.includes('JP:')) {
    const idx = quickMem.indexOf('JP:');
    qm_en = quickMem.substring(0, idx).replace('EN:', '').trim();
    qm_jp = quickMem.substring(idx + 3).trim();
  } else {
    qm_en = quickMem.replace('EN:', '').trim();
  }
  
  // Clean examples - remove bullet points
  const cleanExamples = examples.replace(/・/g, ', ').replace(/\n/g, ' ').replace(/"/g, "'").trim();
  
  // Escape for SQL
  const esc = (s) => (s || '').replace(/'/g, "''").replace(/\r/g, ' ').replace(/\n/g, ' ').trim();
  
  insertStatements.push(`  (${wordNum}, ${currentPage}, '${esc(wordName)}', '', '${esc(overview_en)}', '${esc(overview_jp)}', '${esc(usage)}', '${esc(cleanExamples)}', '${esc(qm_en)}', '${esc(qm_jp)}', false)`);
  
  wordNum++;
}

console.log('\nTotal words:', insertStatements.length);
console.log('Total pages:', currentPage);
console.log('\nFirst 3 inserts:');
insertStatements.slice(0, 3).forEach(s => console.log(s));
console.log('\nLast 3 inserts:');
insertStatements.slice(-3).forEach(s => console.log(s));

// Write SQL
const sql = `-- IT Passport Vocabulary Seed Data\n-- Generated from deepseek_csv_20260507_17bc21.txt\n-- Total: ${insertStatements.length} words across ${currentPage} pages\n\nINSERT INTO words (id, page_num, word, full_name, overview_en, overview_jp, usage, examples, quick_memory_en, quick_memory_jp, studied)\nVALUES\n${insertStatements.join(',\n')};`;

fs.writeFileSync('/root/.openclaw/workspace/vocabapp/seed.sql', sql);
console.log('\nSeed SQL written to seed.sql (' + fs.statSync('/root/.openclaw/workspace/vocabapp/seed.sql').size + ' bytes)');