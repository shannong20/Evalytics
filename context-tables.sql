-- Faculty Evaluation WebApp DB (PostgreSQL Version)

DROP TABLE IF EXISTS Summary_Report;
DROP TABLE IF EXISTS Response;
DROP TABLE IF EXISTS Evaluation;
DROP TABLE IF EXISTS Question;
DROP TABLE IF EXISTS Category;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Department;

CREATE TABLE Department (
    department_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE Users (
    user_id SERIAL PRIMARY KEY,
    last_name VARCHAR(50) NOT NULL,
    first_name VARCHAR(50) NOT NULL,
    middle_initial CHAR(1),
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    user_type VARCHAR(10) CHECK (user_type IN ('Admin','User')) NOT NULL DEFAULT 'User',
    role VARCHAR(15) CHECK (role IN ('Faculty','Student','Supervisor')) NOT NULL,
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES Department(department_id)
);

CREATE TABLE Category (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    weight DECIMAL(5,2) DEFAULT NULL
);

CREATE TABLE Question (
    question_id SERIAL PRIMARY KEY,
    category_id INT NOT NULL,
    text VARCHAR(255) NOT NULL,
    weight DECIMAL(5,2) DEFAULT NULL,
    FOREIGN KEY (category_id) REFERENCES Category(category_id)
);

CREATE TABLE Evaluation (
    evaluation_id SERIAL PRIMARY KEY,
    evaluator_id INT NOT NULL,
    evaluatee_id INT NOT NULL,
    date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    overall_score DECIMAL(5,2) DEFAULT NULL,
    FOREIGN KEY (evaluator_id) REFERENCES Users(user_id),
    FOREIGN KEY (evaluatee_id) REFERENCES Users(user_id)
);

CREATE TABLE Response (
    response_id SERIAL PRIMARY KEY,
    evaluation_id INT NOT NULL,
    question_id INT NOT NULL,
    rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    FOREIGN KEY (evaluation_id) REFERENCES Evaluation(evaluation_id),
    FOREIGN KEY (question_id) REFERENCES Question(question_id)
);

CREATE TABLE Summary_Report (
    report_id SERIAL PRIMARY KEY,
    evaluatee_id INT NOT NULL,
    average_score DECIMAL(5,2) NOT NULL,
    generated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (evaluatee_id) REFERENCES Users(user_id)
);