const request = require('supertest');
const app = require('../server');
const { query } = require('../config/db');

async function ensureQuestionsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS public.questions (
      question_id uuid PRIMARY KEY,
      question_text varchar(300) NOT NULL,
      question_type varchar(20) NOT NULL CHECK (question_type IN ('rating_scale', 'text_response')),
      is_required boolean NOT NULL DEFAULT false,
      category varchar(100) NOT NULL,
      CONSTRAINT uq_questions_category_text UNIQUE (category, question_text)
    );
  `);
}

describe('POST /api/questions', () => {
  beforeAll(async () => {
    await ensureQuestionsTable();
  });

  afterAll(async () => {
    // No pool.end() here because server/config/db manages pool globally for the app
  });

  const endpoint = '/api/questions';
  const adminHeader = { 'x-admin': 'true' };

  test('creates a question successfully (201)', async () => {
    const payload = {
      question_text: 'How would you rate the course materials?   ',
      question_type: 'rating_scale',
      category: 'Course',
      is_required: true,
    };

    const res = await request(app)
      .post(endpoint)
      .set(adminHeader)
      .send(payload);

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      question_text: 'How would you rate the course materials?',
      question_type: 'rating_scale',
      category: 'Course',
      is_required: true,
    });
    expect(typeof res.body.question_id).toBe('string');

    // cleanup
    await query('DELETE FROM public.questions WHERE question_id = $1', [res.body.question_id]);
  });

  test('rejects duplicate question in same category (409)', async () => {
    const payload = {
      question_text: 'Duplicate Check Question',
      question_type: 'text_response',
      category: 'HR',
      is_required: false,
    };

    const first = await request(app).post(endpoint).set(adminHeader).send(payload);
    expect(first.status).toBe(201);

    const second = await request(app).post(endpoint).set(adminHeader).send(payload);
    expect(second.status).toBe(409);
    expect(second.body).toHaveProperty('error');

    // cleanup
    await query('DELETE FROM public.questions WHERE category=$1 AND question_text=$2', [payload.category, payload.question_text]);
  });

  test('rejects payload with unknown properties (400)', async () => {
    const payload = {
      question_text: 'Valid text with extra',
      question_type: 'rating_scale',
      category: 'Course',
      foo: 'bar',
    };

    const res = await request(app).post(endpoint).set(adminHeader).send(payload);
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error.message).toMatch(/Unknown properties/);
  });

  test('rejects non-boolean is_required (400)', async () => {
    const payload = {
      question_text: 'Check boolean type',
      question_type: 'rating_scale',
      category: 'Course',
      is_required: 'true',
    };

    const res = await request(app).post(endpoint).set(adminHeader).send(payload);
    expect(res.status).toBe(400);
  });

  test('rejects too short question_text (400)', async () => {
    const res = await request(app)
      .post(endpoint)
      .set(adminHeader)
      .send({ question_text: 'Hey', question_type: 'text_response', category: 'General' });

    expect(res.status).toBe(400);
  });

  test('rejects unsupported question_type (400)', async () => {
    const res = await request(app)
      .post(endpoint)
      .set(adminHeader)
      .send({ question_text: 'Valid length question', question_type: 'multiple_choice', category: 'General' });

    expect(res.status).toBe(400);
  });

  test('rejects too short category (400)', async () => {
    const res = await request(app)
      .post(endpoint)
      .set(adminHeader)
      .send({ question_text: 'Valid length question', question_type: 'rating_scale', category: 'A' });

    expect(res.status).toBe(400);
  });

  test('missing required fields (400)', async () => {
    const res = await request(app)
      .post(endpoint)
      .set(adminHeader)
      .send({ question_type: 'rating_scale', category: 'General' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });
});
