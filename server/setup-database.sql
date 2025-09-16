-- Create the database if it doesn't exist
SELECT 'CREATE DATABASE "Evalytics" WITH OWNER = postgres ENCODING = "UTF8" LC_COLLATE = "English_United States.1252" LC_CTYPE = "English_United States.1252" TABLESPACE = pg_default CONNECTION LIMIT = -1 IS_TEMPLATE = False;'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'Evalytics')\gexec

-- Connect to the database
\c "Evalytics";

-- Ensure pgcrypto extension is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users
(
    user_id SERIAL PRIMARY KEY,
    firstname character varying(100) COLLATE pg_catalog."default" NOT NULL,
    lastname character varying(100) COLLATE pg_catalog."default" NOT NULL,
    email character varying(255) COLLATE pg_catalog."default" NOT NULL,
    password character varying(255) COLLATE pg_catalog."default" NOT NULL,
    role character varying(50) COLLATE pg_catalog."default" DEFAULT 'user'::character varying NOT NULL,
    department character varying(255) COLLATE pg_catalog."default",
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT users_email_key UNIQUE (email)
)
TABLESPACE pg_default;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email
    ON public.users USING btree
    (email COLLATE pg_catalog."default" ASC NULLS LAST)
    TABLESPACE pg_default;

-- Create a function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ language 'plpgsql';

-- Create trigger to update updated_at column
DO $$
BEGIN
    -- Drop the trigger if it exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        DROP TRIGGER update_users_updated_at ON public.users;
    END IF;
    
    -- Create the trigger
    EXECUTE 'CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE 
        ON public.users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();';
END $$;

-- Add a test user (password: test123)
INSERT INTO public.users (firstname, lastname, email, password, role)
SELECT 'Test', 'User', 'test@example.com', '$2a$10$XFDq3XG9yF5XGJp5XZ5U3.9K5q2K5XZ5U3.9K5q2K5XZ5U3.9K5q2K5XZ5U', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'test@example.com');

-- Verify the table was created
\dt

-- Show the users table structure
\d+ users

-- Show the test user
SELECT user_id, firstname, lastname, email, role, created_at FROM public.users;

-- Create questions table for evaluation question bank
CREATE TABLE IF NOT EXISTS public.questions
(
    question_id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    question_text varchar(300) NOT NULL,
    question_type varchar(20) NOT NULL CHECK (question_type IN ('rating_scale', 'text_response')),
    is_required boolean NOT NULL DEFAULT false,
    category varchar(100) NOT NULL,
    CONSTRAINT uq_questions_category_text UNIQUE (category, question_text)
)
TABLESPACE pg_default;

-- Helpful index for category filtering
CREATE INDEX IF NOT EXISTS idx_questions_category ON public.questions(category);
