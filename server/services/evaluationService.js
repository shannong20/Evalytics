const { pool, query } = require('../config/db');

/**
 * Insert into evaluation_responses and evaluation_answers within a transaction.
 * answers: Array<{ question_id: number | string (int-like), answer_value: string | number, metadata?: any }>
 * Returns: { response_id: number }
 */
async function submitEvaluation({ form_id, student_id, faculty_id, answers }) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 0) Validate questions against the form
    const { rows: qrows } = await client.query(
      `SELECT question_id AS question_id, question_type, is_required
       FROM public.questions
       WHERE form_id = $1`,
      [form_id]
    );
    const allowedIds = new Map(); // id -> { type, required }
    const requiredIds = new Set();
    for (const r of qrows) {
      allowedIds.set(String(r.question_id), { type: r.question_type, required: !!r.is_required });
      if (r.is_required) requiredIds.add(String(r.question_id));
    }
    if (allowedIds.size === 0) {
      const err = new Error('No questions found for the specified form_id');
      err.status = 400;
      throw err;
    }

    // Coerce provided question_ids to integers and validate
    const normalizedAnswers = (answers || []).map((a, i) => {
      const qidNum = Number(a.question_id);
      if (!Number.isInteger(qidNum)) {
        const err = new Error('answers[].question_id must be an integer');
        err.status = 400;
        err.details = { index: i, question_id: a.question_id };
        throw err;
      }
      return {
        question_id: qidNum,
        answer_value: a.answer_value,
        metadata: a.metadata ?? null,
      };
    });

    // Ensure all provided questions belong to form and required ones are present
    const providedIds = new Set(normalizedAnswers.map(a => String(a.question_id)));
    const invalidIds = Array.from(providedIds).filter(id => !allowedIds.has(id));
    if (invalidIds.length) {
      const err = new Error('Some answers reference questions not in this form');
      err.status = 400;
      err.details = { invalid_question_ids: invalidIds };
      throw err;
    }
    const missingRequired = Array.from(requiredIds).filter(id => !providedIds.has(id));
    if (missingRequired.length) {
      const err = new Error('Missing answers for required questions');
      err.status = 400;
      err.details = { missing_required_question_ids: missingRequired };
      throw err;
    }

    // Light validation: numeric ratings for rating_scale
    for (const a of normalizedAnswers) {
      const meta = allowedIds.get(String(a.question_id));
      if (!meta) continue;
      if (meta.type === 'rating_scale' && a.answer_value != null) {
        const num = Number(a.answer_value);
        if (!Number.isFinite(num)) {
          const err = new Error('answer_value must be numeric for rating_scale questions');
          err.status = 400;
          err.details = { question_id: String(a.question_id), answer_value: a.answer_value };
          throw err;
        }
      }
    }

    const insertResponseText = `
      INSERT INTO public.evaluation_responses (form_id, student_id, faculty_id, submitted_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING response_id
    `;
    const { rows: responseRows } = await client.query(insertResponseText, [form_id, student_id, faculty_id]);
    const response_id = Number(responseRows[0].response_id);

    if (Array.isArray(normalizedAnswers) && normalizedAnswers.length > 0) {
      // Build a single multi-row parameterized insert
      const values = [];
      const params = [];
      let idx = 1;
      for (const a of normalizedAnswers) {
        values.push(`($${idx++}, $${idx++}::int, $${idx++}::text, $${idx++}::jsonb)`);
        params.push(response_id, a.question_id, String(a.answer_value), a.metadata ? JSON.stringify(a.metadata) : null);
      }
      const insertAnswersText = `
        INSERT INTO public.evaluation_answers (response_id, question_id, answer_value, metadata)
        VALUES ${values.join(', ')}
      `;
      await client.query(insertAnswersText, params);
    }

    await client.query('COMMIT');
    return { response_id };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch (_) {}
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Fetch all evaluation responses for a faculty, including their answers and question text.
 * Returns array of responses: { response_id, form_id, student_id, faculty_id, submitted_at, answers: [{ question_id, question_text, answer_value }] }
 */
async function getEvaluationsByFaculty(facultyId) {
  const sql = `
    SELECT 
      er.response_id,
      er.form_id,
      er.student_id,
      er.faculty_id,
      er.submitted_at,
      ea.question_id,
      q.question_text,
      ea.answer_value
    FROM public.evaluation_responses er
    LEFT JOIN public.evaluation_answers ea ON ea.response_id = er.response_id
    LEFT JOIN public.questions q ON q.question_id = ea.question_id
    WHERE er.faculty_id = $1
    ORDER BY er.submitted_at DESC, er.response_id DESC
  `;
  const { rows } = await query(sql, [facultyId]);

  // Group rows by response
  const byResponse = new Map();
  for (const r of rows) {
    let item = byResponse.get(r.response_id);
    if (!item) {
      item = {
        response_id: Number(r.response_id),
        form_id: Number(r.form_id),
        student_id: Number(r.student_id),
        faculty_id: Number(r.faculty_id),
        submitted_at: r.submitted_at,
        answers: [],
      };
      byResponse.set(r.response_id, item);
    }
    if (r.question_id) {
      item.answers.push({
        question_id: r.question_id,
        question_text: r.question_text || null,
        answer_value: r.answer_value,
      });
    }
  }

  return Array.from(byResponse.values());
}

module.exports = {
  submitEvaluation,
  getEvaluationsByFaculty,
};
