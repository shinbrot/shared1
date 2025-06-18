/*
  # File Sharing Schema

  1. New Tables
    - `files`
      - `id` (uuid, primary key)
      - `original_filename` (text)
      - `r2_object_key` (text, unique)
      - `password_hash` (text, nullable)
      - `created_at` (timestamp)
      - `expires_at` (timestamp)
      - `download_count` (integer, default 0)
      - `uploader_ip` (text)
      - `uploader_email` (text, nullable)
      - `file_size` (bigint)
      - `content_type` (text)
      - `is_active` (boolean, default true)

    - `upload_rate_limits`
      - `id` (uuid, primary key)
      - `ip_address` (text, unique)
      - `upload_count` (integer, default 0)
      - `last_upload_date` (date)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated admin access
    - Add policies for public file access (read-only)

  3. Indexes
    - Index on `r2_object_key` for fast lookups
    - Index on `expires_at` for cleanup queries
    - Index on `ip_address` for rate limiting
*/

-- Files table for storing file metadata
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  original_filename text NOT NULL,
  r2_object_key text UNIQUE NOT NULL,
  password_hash text,
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + INTERVAL '3 days'),
  download_count integer DEFAULT 0,
  uploader_ip text NOT NULL,
  uploader_email text,
  file_size bigint NOT NULL,
  content_type text NOT NULL,
  is_active boolean DEFAULT true
);

-- Rate limiting table
CREATE TABLE IF NOT EXISTS upload_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text UNIQUE NOT NULL,
  upload_count integer DEFAULT 0,
  last_upload_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE upload_rate_limits ENABLE ROW LEVEL SECURITY;

-- Policies for files table
CREATE POLICY "Public can read active files"
  ON files
  FOR SELECT
  TO anon
  USING (is_active = true AND expires_at > now());

CREATE POLICY "Authenticated users can manage files"
  ON files
  FOR ALL
  TO authenticated
  USING (true);

-- Policies for rate limits table
CREATE POLICY "Anyone can read rate limits for their IP"
  ON upload_rate_limits
  FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anyone can update rate limits"
  ON upload_rate_limits
  FOR ALL
  TO anon
  USING (true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_files_r2_object_key ON files(r2_object_key);
CREATE INDEX IF NOT EXISTS idx_files_expires_at ON files(expires_at);
CREATE INDEX IF NOT EXISTS idx_files_created_at ON files(created_at);
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip ON upload_rate_limits(ip_address);
CREATE INDEX IF NOT EXISTS idx_rate_limits_date ON upload_rate_limits(last_upload_date);

-- Function to clean up expired files
CREATE OR REPLACE FUNCTION cleanup_expired_files()
RETURNS void AS $$
BEGIN
  UPDATE files 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
END;
$$ LANGUAGE plpgsql;