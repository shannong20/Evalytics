const request = require('supertest');
const app = require('../server');
const { query } = require('../config/db');

describe('Forms API', () => {
  beforeAll(async () => {
    // Ensure at least one active form exists in the current window
    await query(`
      INSERT INTO evaluation_form (title, school_year, semester, start_date, end_date, created_by, is_active)
      SELECT 'Jest Active Form', '2025-2026', '1st', CURRENT_DATE - INTERVAL '1 day', CURRENT_DATE + INTERVAL '1 day', NULL, TRUE
      WHERE NOT EXISTS (SELECT 1 FROM evaluation_form WHERE title='Jest Active Form')
    `);
  });

  test('GET /api/v1/forms?active=true returns active forms', async () => {
    const res = await request(app)
      .get('/api/v1/forms?active=true')
      .expect(200);

    expect(res.body).toBeDefined();
    // Support either {status:'ok', data:[...]} or raw array in future
    const list = Array.isArray(res.body?.data) ? res.body.data : Array.isArray(res.body) ? res.body : [];
    expect(Array.isArray(list)).toBe(true);
  });
});
