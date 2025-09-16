-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in reverse order of dependencies)
DROP TABLE IF EXISTS response CASCADE;
DROP TABLE IF EXISTS evaluation CASCADE;
DROP TABLE IF EXISTS question CASCADE;
DROP TABLE IF EXISTS category CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS department CASCADE;
DROP TABLE IF EXISTS summary_report CASCADE;

-- Department table
CREATE TABLE department (
    department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users table (consolidated user types)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    middle_initial CHAR(1),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'faculty', 'admin', 'supervisor')),
    role VARCHAR(50),
    department_id UUID REFERENCES department(department_id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Category table
CREATE TABLE category (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 1.0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Question table
CREATE TABLE question (
    question_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_id UUID NOT NULL REFERENCES category(category_id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    weight DECIMAL(5,2) NOT NULL DEFAULT 1.0 CHECK (weight > 0 AND weight <= 1.0),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Evaluation table
CREATE TABLE evaluation (
    evaluation_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluator_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    evaluatee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    date_submitted TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    overall_score DECIMAL(5,2) CHECK (overall_score >= 0 AND overall_score <= 100),
    comments TEXT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Response table
CREATE TABLE response (
    response_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES evaluation(evaluation_id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES question(question_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(evaluation_id, question_id)
);

-- Summary Report table
CREATE TABLE summary_report (
    report_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluatee_id UUID NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    average_score DECIMAL(5,2) NOT NULL CHECK (average_score >= 0 AND average_score <= 100),
    generated_on TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    report_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(evaluatee_id, period_start, period_end)
);

-- Indexes for better query performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_question_category ON question(category_id);
CREATE INDEX idx_evaluation_evaluator ON evaluation(evaluator_id);
CREATE INDEX idx_evaluation_evaluatee ON evaluation(evaluatee_id);
CREATE INDEX idx_response_evaluation ON response(evaluation_id);
CREATE INDEX idx_response_question ON response(question_id);
CREATE INDEX idx_summary_report_evaluatee ON summary_report(evaluatee_id);
CREATE INDEX idx_summary_report_period ON summary_report(period_start, period_end);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_department_updated_at
BEFORE UPDATE ON department
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_category_updated_at
BEFORE UPDATE ON category
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_question_updated_at
BEFORE UPDATE ON question
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_evaluation_updated_at
BEFORE UPDATE ON evaluation
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_response_updated_at
BEFORE UPDATE ON response
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_summary_report_updated_at
BEFORE UPDATE ON summary_report
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default categories
INSERT INTO category (name, weight) VALUES 
('Commitment', 0.25),
('Knowledge of Subject', 0.25),
('Teaching for Independent Learning', 0.25),
('Management for Learning', 0.25)
ON CONFLICT (name) DO NOTHING;
