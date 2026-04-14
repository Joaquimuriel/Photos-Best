-- Supabase PostgreSQL schema for photo enhancement app

-- Table: photos
CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL,
  original_photo_url TEXT NOT NULL,
  enhanced_photo_url TEXT,
  upload_date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  processing_status VARCHAR(20) CHECK (processing_status IN ('pending','processing','completed','failed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Table: daily_limits
CREATE TABLE IF NOT EXISTS daily_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_identifier TEXT NOT NULL,
  photos_used_today INT NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT current_date
);
