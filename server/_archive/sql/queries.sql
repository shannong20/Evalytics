-- =============================================
-- CRUD Operations for Department Table
-- =============================================

-- Create Department
INSERT INTO department (name) 
VALUES ($1) 
RETURNING *;

-- Get All Departments
SELECT * FROM department 
ORDER BY name;

-- Get Department by ID
SELECT * FROM department 
WHERE department_id = $1;

-- Update Department
UPDATE department 
SET name = $1, 
    updated_at = CURRENT_TIMESTAMP 
WHERE department_id = $2 
RETURNING *;

-- Delete Department
DELETE FROM department 
WHERE department_id = $1 
RETURNING *;


-- =============================================
-- CRUD Operations for Users Table
-- =============================================

-- Create User
INSERT INTO users (
    last_name, 
    first_name, 
    middle_initial, 
    email, 
    password_hash, 
    user_type, 
    role, 
    department_id
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
RETURNING *;

-- Get All Users
SELECT u.*, d.name as department_name 
FROM users u
LEFT JOIN department d ON u.department_id = d.department_id
ORDER BY u.last_name, u.first_name;

-- Get User by ID
SELECT u.*, d.name as department_name 
FROM users u
LEFT JOIN department d ON u.department_id = d.department_id
WHERE u.user_id = $1;

-- Get User by Email
SELECT u.*, d.name as department_name 
FROM users u
LEFT JOIN department d ON u.department_id = d.department_id
WHERE u.email = $1;

-- Update User
UPDATE users 
SET last_name = $1,
    first_name = $2,
    middle_initial = $3,
    email = $4,
    password_hash = COALESCE($5, password_hash),
    user_type = $6,
    role = $7,
    department_id = $8,
    is_active = $9,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $10 
RETURNING *;

-- Delete User (soft delete)
UPDATE users 
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE user_id = $1 
RETURNING *;

-- Get Users by Type (student, faculty, admin, supervisor)
SELECT u.*, d.name as department_name 
FROM users u
LEFT JOIN department d ON u.department_id = d.department_id
WHERE u.user_type = $1 
  AND u.is_active = true
ORDER BY u.last_name, u.first_name;


-- =============================================
-- CRUD Operations for Category Table
-- =============================================

-- Create Category
INSERT INTO category (name, weight) 
VALUES ($1, $2) 
RETURNING *;

-- Get All Categories
SELECT * FROM category 
ORDER BY name;

-- Get Category by ID
SELECT * FROM category 
WHERE category_id = $1;

-- Update Category
UPDATE category 
SET name = $1, 
    weight = $2,
    updated_at = CURRENT_TIMESTAMP 
WHERE category_id = $3 
RETURNING *;

-- Delete Category
DELETE FROM category 
WHERE category_id = $1 
RETURNING *;


-- =============================================
-- CRUD Operations for Question Table
-- =============================================

-- Create Question
INSERT INTO question (category_id, text, weight, is_active) 
VALUES ($1, $2, $3, $4) 
RETURNING *;

-- Get All Questions (with category name)
SELECT q.*, c.name as category_name, c.weight as category_weight 
FROM question q
JOIN category c ON q.category_id = c.category_id
ORDER BY c.name, q.text;

-- Get Question by ID (with category name)
SELECT q.*, c.name as category_name, c.weight as category_weight 
FROM question q
JOIN category c ON q.category_id = c.category_id
WHERE q.question_id = $1;

-- Get Questions by Category
SELECT q.*, c.name as category_name, c.weight as category_weight 
FROM question q
JOIN category c ON q.category_id = c.category_id
WHERE q.category_id = $1
  AND q.is_active = true
ORDER BY q.text;

-- Update Question
UPDATE question 
SET category_id = $1,
    text = $2,
    weight = $3,
    is_active = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE question_id = $5 
RETURNING *;

-- Delete Question (soft delete)
UPDATE question 
SET is_active = false,
    updated_at = CURRENT_TIMESTAMP
WHERE question_id = $1 
RETURNING *;

-- Get Active Questions by Category
SELECT q.*, c.name as category_name, c.weight as category_weight 
FROM question q
JOIN category c ON q.category_id = c.category_id
WHERE q.is_active = true
  AND c.name = $1
ORDER BY q.text;


-- =============================================
-- CRUD Operations for Evaluation Table
-- =============================================

-- Create Evaluation
INSERT INTO evaluation (
    evaluator_id, 
    evaluatee_id, 
    overall_score, 
    comments, 
    status
) VALUES ($1, $2, $3, $4, $5) 
RETURNING *;

-- Get Evaluation by ID (with user details)
SELECT 
    e.*,
    evaluator.first_name as evaluator_first_name,
    evaluator.last_name as evaluator_last_name,
    evaluator.email as evaluator_email,
    evaluatee.first_name as evaluatee_first_name,
    evaluatee.last_name as evaluatee_last_name,
    evaluatee.email as evaluatee_email
FROM evaluation e
JOIN users evaluator ON e.evaluator_id = evaluator.user_id
JOIN users evaluatee ON e.evaluatee_id = evaluatee.user_id
WHERE e.evaluation_id = $1;

-- Get Evaluations by Evaluator
SELECT 
    e.*,
    evaluatee.first_name as evaluatee_first_name,
    evaluatee.last_name as evaluatee_last_name,
    evaluatee.email as evaluatee_email
FROM evaluation e
JOIN users evaluatee ON e.evaluatee_id = evaluatee.user_id
WHERE e.evaluator_id = $1
ORDER BY e.date_submitted DESC;

-- Get Evaluations by Evaluatee
SELECT 
    e.*,
    evaluator.first_name as evaluator_first_name,
    evaluator.last_name as evaluator_last_name,
    evaluator.email as evaluator_email
FROM evaluation e
JOIN users evaluator ON e.evaluator_id = evaluator.user_id
WHERE e.evaluatee_id = $1
ORDER BY e.date_submitted DESC;

-- Update Evaluation
UPDATE evaluation 
SET evaluator_id = $1,
    evaluatee_id = $2,
    overall_score = $3,
    comments = $4,
    status = $5,
    updated_at = CURRENT_TIMESTAMP
WHERE evaluation_id = $6 
RETURNING *;

-- Submit Evaluation (update status and set submission date)
UPDATE evaluation 
SET status = 'submitted',
    date_submitted = CURRENT_TIMESTAMP,
    updated_at = CURRENT_TIMESTAMP
WHERE evaluation_id = $1 
  AND status = 'draft'
RETURNING *;

-- Delete Evaluation
DELETE FROM evaluation 
WHERE evaluation_id = $1 
RETURNING *;


-- =============================================
-- CRUD Operations for Response Table
-- =============================================

-- Create Response
INSERT INTO response (evaluation_id, question_id, rating, comments) 
VALUES ($1, $2, $3, $4) 
ON CONFLICT (evaluation_id, question_id) 
DO UPDATE SET 
    rating = EXCLUDED.rating,
    comments = EXCLUDED.comments,
    updated_at = CURRENT_TIMESTAMP
RETURNING *;

-- Get Responses for Evaluation
SELECT 
    r.*, 
    q.text as question_text,
    q.weight as question_weight,
    c.name as category_name,
    c.weight as category_weight
FROM response r
JOIN question q ON r.question_id = q.question_id
JOIN category c ON q.category_id = c.category_id
WHERE r.evaluation_id = $1
ORDER BY c.name, q.text;

-- Get Response by ID
SELECT 
    r.*, 
    q.text as question_text,
    q.weight as question_weight,
    c.name as category_name,
    c.weight as category_weight
FROM response r
JOIN question q ON r.question_id = q.question_id
JOIN category c ON q.category_id = c.category_id
WHERE r.response_id = $1;

-- Update Response
UPDATE response 
SET rating = $1,
    comments = $2,
    updated_at = CURRENT_TIMESTAMP
WHERE response_id = $3 
RETURNING *;

-- Delete Response
DELETE FROM response 
WHERE response_id = $1 
RETURNING *;

-- Calculate Evaluation Score
SELECT 
    AVG(r.rating * q.weight * c.weight) as weighted_score,
    COUNT(r.response_id) as response_count
FROM response r
JOIN question q ON r.question_id = q.question_id
JOIN category c ON q.category_id = c.category_id
WHERE r.evaluation_id = $1
GROUP BY r.evaluation_id;


-- =============================================
-- CRUD Operations for Summary Report Table
-- =============================================

-- Create Summary Report
INSERT INTO summary_report (
    evaluatee_id,
    average_score,
    period_start,
    period_end,
    report_data
) VALUES ($1, $2, $3, $4, $5) 
RETURNING *;

-- Get Summary Report by ID
SELECT 
    sr.*,
    u.first_name,
    u.last_name,
    u.email
FROM summary_report sr
JOIN users u ON sr.evaluatee_id = u.user_id
WHERE sr.report_id = $1;

-- Get Summary Reports for User
SELECT 
    sr.*,
    u.first_name,
    u.last_name,
    u.email
FROM summary_report sr
JOIN users u ON sr.evaluatee_id = u.user_id
WHERE sr.evaluatee_id = $1
ORDER BY sr.period_end DESC, sr.period_start DESC;

-- Get Summary Reports by Date Range
SELECT 
    sr.*,
    u.first_name,
    u.last_name,
    u.email
FROM summary_report sr
JOIN users u ON sr.evaluatee_id = u.user_id
WHERE sr.period_start >= $1 
  AND sr.period_end <= $2
ORDER BY u.last_name, u.first_name, sr.period_end DESC;

-- Update Summary Report
UPDATE summary_report 
SET average_score = $1,
    period_start = $2,
    period_end = $3,
    report_data = $4,
    updated_at = CURRENT_TIMESTAMP
WHERE report_id = $5 
RETURNING *;

-- Delete Summary Report
DELETE FROM summary_report 
WHERE report_id = $1 
RETURNING *;

-- Generate Summary Report Data
WITH evaluation_scores AS (
    SELECT 
        e.evaluatee_id,
        c.category_id,
        c.name as category_name,
        AVG(r.rating * q.weight) as category_score,
        COUNT(r.response_id) as response_count
    FROM evaluation e
    JOIN response r ON e.evaluation_id = r.evaluation_id
    JOIN question q ON r.question_id = q.question_id
    JOIN category c ON q.category_id = c.category_id
    WHERE e.status = 'submitted'
      AND e.date_submitted >= $1  -- period_start
      AND e.date_submitted <= $2  -- period_end
      AND e.evaluatee_id = $3     -- evaluatee_id
    GROUP BY e.evaluatee_id, c.category_id, c.name
)
SELECT 
    es.evaluatee_id,
    u.first_name,
    u.last_name,
    u.email,
    json_agg(
        json_build_object(
            'category_id', es.category_id,
            'category_name', es.category_name,
            'average_score', es.category_score,
            'response_count', es.response_count
        )
    ) as category_scores,
    AVG(es.category_score) as overall_average_score,
    SUM(es.response_count) as total_responses
FROM evaluation_scores es
JOIN users u ON es.evaluatee_id = u.user_id
GROUP BY es.evaluatee_id, u.first_name, u.last_name, u.email;
