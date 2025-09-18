const path = require('path');
const Ajv = require('ajv/dist/2020');
const addFormats = require('ajv-formats');
const { query } = require('../config/db');

// Load JSON Schema
const schema = require(path.join('..', 'schemas', 'question.create.schema.json'));

const ajv = new Ajv({ allErrors: true, strict: true });
// Ensure 2020-12 meta-schema is available
try {
  const meta2020 = require('ajv/dist/refs/json-schema-2020-12/schema.json');
  ajv.addMetaSchema(meta2020);
} catch (_) {
  // noop: if already present or path changes in future versions
}
addFormats(ajv);
const validate = ajv.compile(schema);

function formatAjvErrors(errors) {
  return errors.map((e) => ({
    instancePath: e.instancePath,
    keyword: e.keyword,
    message: e.message,
    params: e.params,
  }));
}

// GET /api/questions - list all questions
exports.listQuestions = async (req, res) => {
  try {
    const sql = `
      SELECT question_id::text AS question_id, question_text, question_type, is_required, category
      FROM public.questions
      ORDER BY category ASC, question_text ASC
    `;
    const { rows } = await query(sql);
    return res.json(rows);
  } catch (err) {
    console.error('Error listing questions:', { code: err?.code, message: err?.message, detail: err?.detail });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// GET /api/questions/public/form/:formId - list questions for a specific form (no admin required)
exports.listQuestionsByFormPublic = async (req, res) => {
  const raw = (req.params.formId || '').toString();
  const formId = Number(raw);
  if (!Number.isInteger(formId) || formId <= 0) {
    return res.status(400).json({ error: { message: "Path parameter 'formId' must be a positive integer" } });
  }
  try {
    const sql = `
      SELECT question_id::text AS question_id, question_text, question_type, is_required, category
      FROM public.questions
      WHERE form_id = $1
      ORDER BY category ASC, question_text ASC
    `;
    const { rows } = await query(sql, [formId]);
    return res.json(rows);
  } catch (err) {
    console.error('Error listing questions by form (public):', { code: err?.code, message: err?.message, detail: err?.detail });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// GET /api/questions/public - list questions, optionally filter by category (no admin required)
exports.listQuestionsPublic = async (req, res) => {
  try {
    const { category } = req.query || {};
    let rows;
    if (category && String(category).trim() !== '') {
      const sql = `
        SELECT question_id::text AS question_id, question_text, question_type, is_required, category
        FROM public.questions
        WHERE LOWER(category) = LOWER($1)
        ORDER BY question_text ASC
      `;
      const result = await query(sql, [String(category).trim()]);
      rows = result.rows;
    } else {
      const sql = `
        SELECT question_id::text AS question_id, question_text, question_type, is_required, category
        FROM public.questions
        ORDER BY category ASC, question_text ASC
      `;
      const result = await query(sql);
      rows = result.rows;
    }
    return res.json(rows);
  } catch (err) {
    console.error('Error listing questions (public):', { code: err?.code, message: err?.message, detail: err?.detail });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

exports.createQuestion = async (req, res) => {
  try {
    const allowedKeys = new Set(['question_text', 'question_type', 'is_required', 'category']);
    const bodyKeys = Object.keys(req.body || {});
    const unknown = bodyKeys.filter((k) => !allowedKeys.has(k));
    if (unknown.length) {
      return res.status(400).json({
        error: {
          message: 'Unknown properties are not allowed',
          details: { unknown },
        },
      });
    }

    // Trim strings; default is_required only if missing
    const payload = {
      question_text: typeof req.body?.question_text === 'string' ? req.body.question_text.trim() : req.body?.question_text,
      question_type: req.body?.question_type,
      is_required: (req.body && Object.prototype.hasOwnProperty.call(req.body, 'is_required'))
        ? req.body.is_required
        : false,
      category: typeof req.body?.category === 'string' ? req.body.category.trim() : req.body?.category,
    };

    const valid = validate(payload);
    if (!valid) {
      return res.status(400).json({
        error: {
          message: 'Validation failed',
          details: formatAjvErrors(validate.errors || []),
        },
      });
    }

    const insertSql = `
      INSERT INTO public.questions (question_text, question_type, is_required, category)
      VALUES ($1, $2, $3, $4)
      RETURNING question_id::text AS question_id, question_text, question_type, is_required, category;
    `;

    const params = [payload.question_text, payload.question_type, payload.is_required, payload.category];

    const { rows } = await query(insertSql, params);
    const created = rows[0];
    return res.status(201).json(created);
  } catch (err) {
    if (err && err.code === '23505') {
      // Unique violation
      return res.status(409).json({
        error: { message: 'Duplicate question for this category', details: { constraint: 'uq_questions_category_text' } },
      });
    }

    // Map common Postgres errors to 400s with clearer messages
    if (err && err.code === '23514') {
      // Check constraint violation
      return res.status(400).json({ error: { message: 'Constraint violation on question fields', details: { code: err.code, constraint: err.constraint } } });
    }
    if (err && err.code === '23502') {
      // Not-null violation
      return res.status(400).json({ error: { message: 'Missing required field', details: { code: err.code } } });
    }
    if (err && err.code === '22P02') {
      // Invalid text representation (e.g., wrong type)
      return res.status(400).json({ error: { message: 'Invalid input syntax', details: { code: err.code } } });
    }
    if (err && err.code === '22001') {
      // String data right truncation
      return res.status(400).json({ error: { message: 'Value too long for column', details: { code: err.code } } });
    }

    console.error('Error creating question:', { code: err?.code, message: err?.message, detail: err?.detail });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
