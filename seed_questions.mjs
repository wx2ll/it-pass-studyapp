import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://oclhkuackbnpimfzxqwb.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jbGhrdWFja2JucGltZnp4cXdiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Njc3Nzg3MiwiZXhwIjoyMDkyMzUzODcyfQ.KXoTGm2O9pPxSrm6BhHt-OW3KhdgfDkQmiEgtcHGb18'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Create tables first
async function createTables() {
  // Create pdf_sources table
  const { error: sourcesError } = await supabase.rpc('exec', {
    query: `
    CREATE TABLE IF NOT EXISTS pdf_sources (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      filename_question TEXT,
      filename_answer TEXT,
      file_hash_question TEXT,
      file_hash_answer TEXT,
      exam_year TEXT,
      exam_season TEXT,
      total_questions INTEGER,
      uploaded_at TIMESTAMPTZ DEFAULT NOW()
    );
    `
  }).catch(() => {
    // Try direct insert if RPC not available
    console.log('Trying direct table creation...')
  })
  
  console.log('Tables creation attempted')
}

// Try creating tables via raw SQL
async function tryCreateTables() {
  const { data, error } = await supabase.from('pdf_sources').select('id').limit(1).catch(e => ({ data: null, error: e }))
  console.log('pdf_sources check:', error?.message || 'exists')
}

tryCreateTables()
