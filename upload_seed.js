const https = require('https');

const SUPABASE_URL = 'https://hsyzzvlzhaxrdgopqfnp.supabase.co';
const SERVICE_KEY = 'sb_serv_FFwRZx-rwvpiWwHXZa86_A_lqRo5ThS';

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
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal',
        'Content-Length': Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode });
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function insertAllBatches() {
  const fs = require('fs');
  
  // Load seed.sql and parse it to get row data
  const content = fs.readFileSync('/root/.openclaw/workspace/vocabapp/seed.sql', 'utf8');
  
  // Extract VALUES section
  const valuesIdx = content.indexOf('VALUES');
  const valuesPart = content.substring(valuesIdx + 7);
  
  // Split into rows
  const rawRows = valuesPart.split('\n').filter(l => l.trim().startsWith('('));
  
  // Parse each row into an object
  const records = rawRows.map(row => {
    // Parse: (id, page_num, word, full_name, overview_en, overview_jp, usage, examples, quick_memory_en, quick_memory_jp, studied)
    const inner = row.trim().slice(1, -2); // remove ( and ,false)
    const parts = [];
    let current = '';
    let depth = 0;
    
    for (let i = 0; i < inner.length; i++) {
      const char = inner[i];
      if (char === "'") depth++;
      else if (char === ',' && depth % 2 === 0) {
        parts.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    parts.push(current.trim());
    
    return {
      id: parseInt(parts[0]),
      page_num: parseInt(parts[1]),
      word: parts[2].replace(/^'|'$/g, '').replace(/''/g, "'"),
      full_name: parts[3].replace(/^'|'$/g, '').replace(/''/g, "'"),
      overview_en: parts[4].replace(/^'|'$/g, '').replace(/''/g, "'"),
      overview_jp: parts[5].replace(/^'|'$/g, '').replace(/''/g, "'"),
      usage: parts[6].replace(/^'|'$/g, '').replace(/''/g, "'"),
      examples: parts[7].replace(/^'|'$/g, '').replace(/''/g, "'"),
      quick_memory_en: parts[8].replace(/^'|'$/g, '').replace(/''/g, "'"),
      quick_memory_jp: parts[9].replace(/^'|'$/g, '').replace(/''/g, "'"),
      studied: false,
    };
  });

  console.log('Total records parsed:', records.length);
  
  // Insert in batches of 25
  const batchSize = 25;
  let success = 0;
  let failed = 0;
  
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    const batchNum = Math.floor(i / batchSize) + 1;
    
    try {
      await insertBatch(batch);
      success += batch.length;
      console.log(`Batch ${batchNum}: inserted ${batch.length} records (total: ${success}/${records.length})`);
    } catch (err) {
      console.error(`Batch ${batchNum} failed:`, err.message);
      failed += batch.length;
      
      // Try inserting one by one for this batch
      console.log('Retrying individually...');
      for (const record of batch) {
        try {
          await insertBatch([record]);
          success++;
        } catch (e) {
          console.error('Failed record:', record.word, e.message.substring(0, 100));
          failed++;
        }
      }
    }
  }
  
  console.log(`\nDone: ${success} inserted, ${failed} failed`);
}

insertAllBatches().catch(console.error);