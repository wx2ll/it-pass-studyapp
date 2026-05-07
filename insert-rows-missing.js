const https = require('https');
const fs = require('fs');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeXp6dmx6aGF4cmRnb3BxZm5wIiwicm9sZSI6InNlcnZpCeVfcm9sZSIsImlhdCI6MTc3Nzk5MjY3NSwiZXhwIjoyMDkzNTY4Njc1fQ.XbmY2NqyfuwwQb0HeyM4-hucPS87aEz-nRTadF3jnR8';

async function insertBatch(rows) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(rows);
    const options = {
      hostname: 'hsyzzvlzhaxrdgopqfnp.supabase.co',
      path: '/rest/v1/words',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_KEY,
        'Authorization': 'Bearer ' + SERVICE_KEY,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(data),
      },
    };
    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve({ status: res.statusCode });
        else reject(new Error('HTTP ' + res.statusCode + ': ' + body.substring(0, 300)));
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  const content = fs.readFileSync('/root/.openclaw/media/inbound/Page5-8---3efd7b1c-5d22-4e50-ad86-d66912f42c38.txt', 'utf8');
  const lines = content.split('\n');
  
  // Find all page start positions (where entry 1 appears)
  const pageStarts = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().match(/^"?1\./)) pageStarts.push(i);
  }
  console.log('Page starts (0-indexed):', pageStarts);
  // pageStarts = [1, 151, 301, 471]
  // ID offsets: pages 5-8 start at DB ids 121, 151, 181, 211

  // Parse ALL entries from all 4 pages (no entry limit per page)
  const records = [];

  for (let pi = 0; pi < pageStarts.length; pi++) {
    const startIdx = pageStarts[pi];
    const endIdx = pi < pageStarts.length - 1 ? pageStarts[pi + 1] : lines.length;
    const dbIdOffset = 121 + (pi * 30); // page5 offset=121, page6=151, page7=181, page8=211
    const pageNum = pi + 5;
    
    console.log('Parsing page ' + pageNum + ' (lines ' + startIdx + '-' + endIdx + ', DB IDs offset=' + dbIdOffset + ')');
    
    let i = startIdx;
    while (i < endIdx && i < lines.length) {
      const line = lines[i].trim();
      const match = line.match(/^"?(\d+)\./);
      if (match) {
        const entryNum = parseInt(match[1]);
        let entryLines = [line];
        let j = i + 1;
        while (j < endIdx && j < lines.length && !lines[j].trim().match(/^"?\d+\./)) {
          entryLines.push(lines[j]);
          j++;
        }
        const combined = entryLines.join('');
        const parts = [];
        let depth = 0, current = '';
        for (let k = 0; k < combined.length; k++) {
          const ch = combined[k];
          if (ch === '"') depth++;
          else if (ch === ',' && depth % 2 === 0) {
            parts.push(current.trim()); current = '';
          } else current += ch;
        }
        parts.push(current);

        if (parts.length >= 5) {
          const overview = parts[1], usage = parts[2], examples = parts[3], memory = parts[4];
          const [enOverview, jpOverview] = overview.includes('JP:')
            ? [overview.split('JP:')[0].replace('EN:', '').trim(), overview.split('JP:')[1].trim()]
            : [overview.replace('EN:', '').trim(), ''];
          const [enMemory, jpMemory] = memory.includes('JP:')
            ? [memory.split('JP:')[0].replace('EN:', '').trim(), memory.split('JP:')[1].trim()]
            : [memory.replace('EN:', '').trim(), ''];
          const esc = s => (s||'').replace(/'/g, "''").replace(/\r/g, '').replace(/\n/g, ' ').trim();
          records.push({
            id: dbIdOffset + entryNum - 1, // entry 1 -> dbIdOffset
            page_num: pageNum,
            word: esc(parts[0].replace(/^"+|"+$/g, '')),
            full_name: esc(parts[0].replace(/^"+|"+$/g, '')),
            overview_en: esc(enOverview),
            overview_jp: esc(jpOverview),
            usage: esc(usage),
            examples: esc(examples.replace(/・/g, ', ')),
            quick_memory_en: esc(enMemory),
            quick_memory_jp: esc(jpMemory),
            studied: false
          });
        }
        i = j;
      } else i++;
    }
  }

  console.log('Total parsed:', records.length, 'records');
  console.log('DB IDs:', records[0].id, '-', records[records.length-1].id);
  
  // Find missing ones (already inserted: IDs 121-235 = 115, need 9 more = IDs 211-214 and 236-240)
  const inserted = [211,212,213,214,236,237,238,239,240]; // from prior run
  const missing = records.filter(r => inserted.includes(r.id));
  console.log('Missing records to insert:', missing.length, '-> IDs:', missing.map(r => r.id).join(', '));

  const batchSize = 20;
  let success = 0, failed = 0;
  for (let i = 0; i < missing.length; i += batchSize) {
    const batch = missing.slice(i, i + batchSize);
    try {
      await insertBatch(batch);
      success += batch.length;
      console.log('Batch inserted ' + batch.length + ' (total: ' + success + '/' + missing.length + ')');
    } catch (err) {
      console.error('Failed:', err.message.substring(0, 150));
      failed += batch.length;
    }
  }
  console.log('Done: ' + success + ' success, ' + failed + ' failed');
}

main().catch(console.error);
