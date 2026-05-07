const https = require('https');
const fs = require('fs');

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzeXp6dmx6aGF4cmRnb3BxZm5wIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Nzk5MjY3NSwiZXhwIjoyMDkzNTY4Njc1fQ.XbmY2NqyfuwwQb0HeyM4-hucPS87aEz-nRTadF3jnR8';

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
  
  // Page starts (0-indexed): page5=1, page6=151, page7=301, page8=471
  // IDs: page5=121-150, page6=151-180, page7=181-210, page8=211-240
  const pageStarts = [1, 151, 301, 471];
  const pageIdOffsets = [120, 150, 180, 210]; // offset from 1-indexed entry number to DB id

  const records = [];

  for (let pi = 0; pi < 4; pi++) {
    const startIdx = pageStarts[pi];
    const idOffset = pageIdOffsets[pi];
    let entryCount = 0;
    let i = startIdx;

    while (entryCount < 30 && i < lines.length) {
      const line = lines[i].trim();
      const match = line.match(/^"?(\d+)\./);
      if (match) {
        const entryNum = parseInt(match[1]);
        let entryLines = [line];
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().match(/^"?\d+\./)) {
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
            id: idOffset + entryNum,
            page_num: pi + 5,
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
          entryCount++;
        }
        i = j;
      } else i++;
    }
  }

  console.log('Parsed', records.length, 'records');
  console.log('ID range:', records[0].id, '-', records[records.length-1].id);
  console.log('Page range:', records[0].page_num, '-', records[records.length-1].page_num);

  const batchSize = 20;
  let success = 0, failed = 0;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    try {
      await insertBatch(batch);
      success += batch.length;
      console.log('Batch ' + batchNum + ': ' + batch.length + ' inserted (total: ' + success + '/' + records.length + ')');
    } catch (err) {
      console.error('Batch ' + batchNum + ' failed:', err.message.substring(0, 150));
      failed += batch.length;
    }
  }
  console.log('\nDone: ' + success + ' success, ' + failed + ' failed');
}

main().catch(console.error);
