/*
# Create initial schema for Junglinster Site Tracker

This migration creates the core tables for the construction site photo tracking app,
replacing the Base44 entities (SitePhoto, Comment, User) with Supabase tables.

## 1. New Tables

### profiles
- `id` (uuid, primary key, references auth.users) — one row per registered user
- `email` (text) — cached email for display
- `role` (text, default 'user') — 'admin' or 'user'
- `created_at` (timestamptz)

### site_photos
- `id` (uuid, primary key)
- `file_url` (text, not null) — public URL of the stored image
- `thumbnail_url` (text) — smaller thumbnail URL for grid views
- `taken_at` (timestamptz) — timestamp the photo was taken (from EXIF/metadata)
- `latitude` (numeric) — GPS latitude
- `longitude` (numeric) — GPS longitude
- `location_name` (text, default 'Junglinster')
- `phase` (text) — construction phase tag: planning, foundation, structure, roofing, facade, interior, exterior, landscaping, other
- `source` (text, default 'manual') — 'google_drive' or 'manual'
- `external_id` (text) — Google Drive file id, used for dedup
- `caption` (text) — original file name or short caption
- `created_by_id` (uuid, references auth.users) — the user who uploaded/synced it
- `created_by` (text) — cached email of the uploader for display
- `created_date` (timestamptz, default now()) — when the record was created

### comments
- `id` (uuid, primary key)
- `photo_id` (uuid, references site_photos, on delete cascade) — which photo this comment belongs to
- `text` (text, not null) — comment text
- `created_by_id` (uuid, references auth.users) — the user who wrote it
- `created_by` (text) — cached email of the commenter for display
- `created_date` (timestamptz, default now())

## 2. Security

- RLS enabled on all tables.
- `profiles`: users can read all profiles (to see who posted), update only their own.
- `site_photos`: authenticated users can read all photos; create/update/delete own or admin.
- `comments`: authenticated users can read all comments; create own; update/delete own or admin.

## 3. Important Notes

- `created_by_id` defaults to `auth.uid()` so inserts that omit it still satisfy RLS.
- `created_by` (email) is denormalized for display convenience.
- A trigger auto-creates a profile row when a new auth user signs up.
- A trigger auto-populates `created_by` email from auth.users on photo/comment insert.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_all" ON profiles;
CREATE POLICY "profiles_select_all" ON profiles FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

-- Site photos table
CREATE TABLE IF NOT EXISTS site_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  file_url text NOT NULL,
  thumbnail_url text,
  taken_at timestamptz,
  latitude numeric,
  longitude numeric,
  location_name text DEFAULT 'Junglinster',
  phase text,
  source text DEFAULT 'manual',
  external_id text,
  caption text,
  created_by_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by text,
  created_date timestamptz DEFAULT now()
);

ALTER TABLE site_photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_photos_select_all" ON site_photos;
CREATE POLICY "site_photos_select_all" ON site_photos FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "site_photos_insert_own" ON site_photos;
CREATE POLICY "site_photos_insert_own" ON site_photos FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by_id);

DROP POLICY IF EXISTS "site_photos_update_own_or_admin" ON site_photos;
CREATE POLICY "site_photos_update_own_or_admin" ON site_photos FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    auth.uid() = created_by_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "site_photos_delete_own_or_admin" ON site_photos;
CREATE POLICY "site_photos_delete_own_or_admin" ON site_photos FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_id uuid NOT NULL REFERENCES site_photos(id) ON DELETE CASCADE,
  text text NOT NULL,
  created_by_id uuid DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by text,
  created_date timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_all" ON comments;
CREATE POLICY "comments_select_all" ON comments FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "comments_insert_own" ON comments;
CREATE POLICY "comments_insert_own" ON comments FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by_id);

DROP POLICY IF EXISTS "comments_update_own_or_admin" ON comments;
CREATE POLICY "comments_update_own_or_admin" ON comments FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = created_by_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  )
  WITH CHECK (
    auth.uid() = created_by_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

DROP POLICY IF EXISTS "comments_delete_own_or_admin" ON comments;
CREATE POLICY "comments_delete_own_or_admin" ON comments FOR DELETE
  TO authenticated
  USING (
    auth.uid() = created_by_id
    OR EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Index for listing photos by taken_at descending
CREATE INDEX IF NOT EXISTS idx_site_photos_taken_at ON site_photos (taken_at DESC NULLS LAST);

-- Index for listing comments by photo_id
CREATE INDEX IF NOT EXISTS idx_comments_photo_id ON comments (photo_id, created_date);

-- Index for dedup by external_id
CREATE INDEX IF NOT EXISTS idx_site_photos_external_id ON site_photos (external_id) WHERE external_id IS NOT NULL;

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-populate created_by email on site_photos insert
CREATE OR REPLACE FUNCTION populate_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL AND NEW.created_by_id IS NOT NULL THEN
    SELECT email INTO NEW.created_by FROM auth.users WHERE id = NEW.created_by_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_site_photos_created_by ON site_photos;
CREATE TRIGGER on_site_photos_created_by
  BEFORE INSERT OR UPDATE ON site_photos
  FOR EACH ROW EXECUTE FUNCTION populate_created_by();

-- Auto-populate created_by email on comments insert
CREATE OR REPLACE FUNCTION populate_comment_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS NULL AND NEW.created_by_id IS NOT NULL THEN
    SELECT email INTO NEW.created_by FROM auth.users WHERE id = NEW.created_by_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_comments_created_by ON comments;
CREATE TRIGGER on_comments_created_by
  BEFORE INSERT OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION populate_comment_created_by();
