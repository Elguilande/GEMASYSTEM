/*
  # Gema Storage - Storage Table

  1. New Tables
    - `storage_entries`
      - `id` (uuid, primary key)
      - `name` (text) - filename or message identifier
      - `content` (text) - the stored content
      - `sender_id` (text) - anonymous session identifier
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `storage_entries`
    - Allow any authenticated or anon user to insert and read entries
    - This is a shared storage demo, so entries are readable by all

  3. Notes
    - Data is stored in Supabase (not in-memory), persisted across sessions
    - Realtime is used for live push notifications between devices/tabs
*/

CREATE TABLE IF NOT EXISTS storage_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  content text NOT NULL DEFAULT '',
  sender_id text NOT NULL DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE storage_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read storage entries"
  ON storage_entries FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert storage entries"
  ON storage_entries FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update storage entries"
  ON storage_entries FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

ALTER PUBLICATION supabase_realtime ADD TABLE storage_entries;
