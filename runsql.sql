-- Users table (admin panel users)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  uid TEXT UNIQUE NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone_number TEXT,
  role TEXT DEFAULT 'admin',
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- OTPs table (signup verification)
CREATE TABLE IF NOT EXISTS otps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  otp TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Traffic history table (for reports/cron)
CREATE TABLE IF NOT EXISTS traffic_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  billboard_id UUID REFERENCES billboards(id),
  date TEXT,
  hour INTEGER,
  traffic_volume INTEGER,
  congestion_level TEXT,
  average_speed NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add extra columns to billboards
ALTER TABLE billboards ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;
ALTER TABLE billboards ADD COLUMN IF NOT EXISTS panel_names JSONB DEFAULT '[]';
ALTER TABLE billboards ADD COLUMN IF NOT EXISTS district TEXT;

-- Add extra columns to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS total_amount NUMERIC;
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_phone TEXT;

-- Add updated_at to packages
ALTER TABLE packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Add updated_at to customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- RLS policies for new tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE otps ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read users" ON users;
CREATE POLICY "Public read users" ON users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert users" ON users;
CREATE POLICY "Public insert users" ON users FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update users" ON users;
CREATE POLICY "Public update users" ON users FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete users" ON users;
CREATE POLICY "Public delete users" ON users FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public all otps" ON otps;
CREATE POLICY "Public all otps" ON otps FOR ALL USING (true);

DROP POLICY IF EXISTS "Public read traffic_history" ON traffic_history;
CREATE POLICY "Public read traffic_history" ON traffic_history FOR SELECT USING (true);
DROP POLICY IF EXISTS "Public insert traffic_history" ON traffic_history;
CREATE POLICY "Public insert traffic_history" ON traffic_history FOR INSERT WITH CHECK (true);

-- Allow updates and deletes on existing tables
DROP POLICY IF EXISTS "Public update billboards" ON billboards;
CREATE POLICY "Public update billboards" ON billboards FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public insert billboards" ON billboards;
CREATE POLICY "Public insert billboards" ON billboards FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public delete billboards" ON billboards;
CREATE POLICY "Public delete billboards" ON billboards FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public update proposals" ON proposals;
CREATE POLICY "Public update proposals" ON proposals FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete proposals" ON proposals;
CREATE POLICY "Public delete proposals" ON proposals FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public update customers" ON customers;
CREATE POLICY "Public update customers" ON customers FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete customers" ON customers;
CREATE POLICY "Public delete customers" ON customers FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public insert posts" ON posts;
CREATE POLICY "Public insert posts" ON posts FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Public update posts" ON posts;
CREATE POLICY "Public update posts" ON posts FOR UPDATE USING (true);
DROP POLICY IF EXISTS "Public delete posts" ON posts;
CREATE POLICY "Public delete posts" ON posts FOR DELETE USING (true);

DROP POLICY IF EXISTS "Public update settings" ON settings;
CREATE POLICY "Public update settings" ON settings FOR UPDATE USING (true);
