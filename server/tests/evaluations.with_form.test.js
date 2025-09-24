const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../server');
const { query } = require('../config/db');

async function ensureActiveForm() {
  // Try to get an active form in current date window
  const { rows } = await query(
    `SELECT form_id FROM evaluation_form WHERE is_active=TRUE AND CURRENT_DATE BETWEEN start_date AND end_date ORDER BY form_id DESC LIMIT 1`
  );
  if (rows.length > 0) return rows[0].form_id;
  // Insert one
  const res = await query(
    `INSERT INTO evaluation_form (title, school_year, semester, start_date, end_date, created_by, is_active, type, description)
     VALUES ('Jest Window Form', '2025-2026', '1st', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day', NULL, TRUE, 'faculty', 'Jest auto form')
     RETURNING form_id`
  );
  return res.rows[0].form_id;
}

async function seedDepartment(name = 'Test Dept') {
  const { rows } = await query(
    `INSERT INTO department (name) VALUES ($1) RETURNING department_id`,
    [name]
  );
  return rows[0].department_id;
}

async function seedUser({ first, last, role, departmentId }) {
  const { rows } = await query(
    `INSERT INTO users (first_name, last_name, middle_initial, email, password, user_type, role, department_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
     RETURNING user_id`,
    [first, last, '', `${first}.${last}.${Date.now()}@example.com`, 'test-hash', 'User', role, departmentId]
  );
  return rows[0].user_id;
}

async function seedCourse(departmentId) {
  const { rows } = await query(
    `INSERT INTO course (department_id, course_code, course_title) VALUES ($1,$2,$3) RETURNING course_id`,
    [departmentId, `CS${Math.floor(Math.random()*900+100)}`, 'Intro to CS']
  );
  return rows[0].course_id;
}

async function seedCategoryAndQuestion() {
  const cat = await query(`INSERT INTO category (name, weight) VALUES ($1,$2) RETURNING category_id`, ['General', 1.0]);
  const category_id = cat.rows[0].category_id;
  const q = await query(
    `INSERT INTO question (category_id, text, weight) VALUES ($1,$2,$3) RETURNING question_id`,
    [category_id, 'Sample rating question?', 1.0]
  );
  return { category_id, question_id: q.rows[0].question_id };
}

function makeToken(user_id) {
  const secret = process.env.JWT_SECRET || 'testsecret';
  return jwt.sign({ id: user_id }, secret, { expiresIn: '1h' });
}

describe('POST /api/v1/evaluations with form_id', () => {
  let evaluatorId, evaluateeId, departmentId, courseId, questionId, formId, token;

  beforeAll(async () => {
    formId = await ensureActiveForm();
    departmentId = await seedDepartment();
    evaluatorId = await seedUser({ first: 'Eval', last: 'User', role: 'Student', departmentId });
    evaluateeId = await seedUser({ first: 'Prof', last: 'User', role: 'Faculty', departmentId });
    courseId = await seedCourse(departmentId);
    const cq = await seedCategoryAndQuestion();
    questionId = cq.question_id;
    token = makeToken(evaluatorId);
  });

  test('creates evaluation and responses, computes overall_score', async () => {
    const res = await request(app)
      .post('/api/v1/evaluations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        form_id: formId,
        evaluatee_id: evaluateeId,
        course_id: courseId,
        responses: [ { question_id: questionId, rating: 5 } ],
        comments: 'Great',
      })
      .expect(201);

    expect(res.body?.status).toBe('success');
    const evalId = res.body?.data?.evaluation_id;
    expect(evalId).toBeTruthy();

    const check = await query(`SELECT form_id, overall_score FROM evaluation WHERE evaluation_id=$1`, [evalId]);
    expect(check.rows.length).toBe(1);
    expect(Number(check.rows[0].form_id)).toBe(Number(formId));
    expect(Number(check.rows[0].overall_score)).toBeCloseTo(5.0, 2);
  });

  test('rejects evaluation when form is outside date window', async () => {
    // Create a form that is active=false or outside window
    const pastForm = await query(
      `INSERT INTO evaluation_form (title, school_year, semester, start_date, end_date, created_by, is_active, type, description)
       VALUES ('Jest Past Form', '2024-2025', '1st', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE - INTERVAL '1 day', NULL, TRUE, 'faculty', 'Past window')
       RETURNING form_id`
    );
    const badFormId = pastForm.rows[0].form_id;

    const res = await request(app)
      .post('/api/v1/evaluations')
      .set('Authorization', `Bearer ${token}`)
      .send({
        form_id: badFormId,
        evaluatee_id: evaluateeId,
        course_id: courseId,
        responses: [ { question_id: questionId, rating: 4 } ],
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });
});
