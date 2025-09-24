BEGIN;

-- Create evaluation_form table (integer PK to align with current frontend usage)
CREATE TABLE IF NOT EXISTS evaluation_form (
  form_id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  school_year VARCHAR(9) NOT NULL, -- e.g., 2024-2025
  semester VARCHAR(16),            -- e.g., 1st, 2nd, Summer
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_by UUID REFERENCES users(user_id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure start_date <= end_date
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'evaluation_form_date_check'
  ) THEN
    ALTER TABLE evaluation_form
      ADD CONSTRAINT evaluation_form_date_check CHECK (start_date <= end_date);
  END IF;
END $$;

-- Add form_id column to evaluation table if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'evaluation' AND column_name = 'form_id'
  ) THEN
    ALTER TABLE evaluation
      ADD COLUMN form_id INTEGER NULL REFERENCES evaluation_form(form_id) ON DELETE SET NULL;
  END IF;
END $$;

COMMIT;
