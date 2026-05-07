-- VocabApp words table
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS words (
  id SERIAL PRIMARY KEY,
  page_num INTEGER NOT NULL,
  word TEXT NOT NULL,
  full_name TEXT,
  overview_en TEXT,
  overview_jp TEXT,
  usage TEXT,
  examples TEXT,
  quick_memory_en TEXT,
  quick_memory_jp TEXT,
  studied BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE words ENABLE ROW LEVEL SECURITY;

-- Allow all operations (app uses service role key)
CREATE POLICY "Allow all" ON words FOR ALL USING (true) WITH CHECK (true);
