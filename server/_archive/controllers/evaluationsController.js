const { query } = require('../config/db');
const evaluationService = require('../services/evaluationService');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

function validatePayload(body) {
  const errors = [];

  if (!body || typeof body !== 'object') {
    errors.push('Body must be a JSON object');
    return { valid: false, errors };
  }

  const { subject, professor_name, peer_name, responses } = body;

  if (!isNonEmptyString(subject)) {
    errors.push('subject is required');
  }

  const targetName = isNonEmptyString(professor_name)
    ? professor_name.trim()
    : isNonEmptyString(peer_name)
      ? peer_name.trim()
      : '';

  if (!isNonEmptyString(targetName)) {
    errors.push('Either professor_name or peer_name must be provided');
  }

  if (!Array.isArray(responses)) {
    errors.push('responses must be an array');
  } else if (responses.length === 0) {
    errors.push('responses must not be empty');
  } else {
    for (let i = 0; i < responses.length; i++) {
      const r = responses[i] || {};
      if (!isNonEmptyString(r.question_id)) {
        errors.push(`responses[${i}].question_id is required`);
      }
      if (r.answer === undefined || r.answer === null || r.answer === '') {
        errors.push(`responses[${i}].answer is required`);
      }
      if (!isNonEmptyString(r.category)) {
        errors.push(`responses[${i}].category is required`);
      }
      if (!isNonEmptyString(r.type)) {
        errors.push(`responses[${i}].type is required`);
      }
    }
  }

  return { valid: errors.length === 0, errors, targetName };
}

// POST /api/evaluations
// Body: { form_id, student_id, faculty_id, answers: [{question_id, answer_value, metadata?}] }
exports.submitEvaluation = async (req, res) => {
  try {
    const { form_id, student_id, faculty_id } = req.body || {};
    const rawAnswers = Array.isArray(req.body?.answers) ? req.body.answers : [];

    // Normalize answers to support legacy/front-end variants
    const normalizedAnswers = rawAnswers.map((a) => ({
      // accept question_id or questionId
      question_id: a?.question_id || a?.questionId,
      // accept answer_value or answer or value
      answer_value: a?.answer_value ?? a?.answer ?? a?.value,
      metadata: a?.metadata,
    }));

    // Basic validation
    const errors = [];
    const asInt = (v) => Number.isInteger(Number(v)) ? Number(v) : NaN;
    const formIdNum = asInt(form_id);
    const studentIdNum = asInt(student_id);
    const facultyIdNum = asInt(faculty_id);
    if (!Number.isInteger(formIdNum)) errors.push('form_id must be an integer');
    if (!Number.isInteger(studentIdNum)) errors.push('student_id must be an integer');
    if (!Number.isInteger(facultyIdNum)) errors.push('faculty_id must be an integer');
    if (!Array.isArray(normalizedAnswers) || normalizedAnswers.length === 0) errors.push('answers must be a non-empty array');
    if (Array.isArray(normalizedAnswers)) {
      normalizedAnswers.forEach((a, i) => {
        if (!a || typeof a !== 'object') errors.push(`answers[${i}] must be an object`);
        if (!a?.question_id) errors.push(`answers[${i}].question_id is required`);
        if (a?.answer_value === undefined || a?.answer_value === null || a?.answer_value === '') {
          errors.push(`answers[${i}].answer_value is required`);
        }
      });
    }

    if (errors.length) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors } });
    }

    const result = await evaluationService.submitEvaluation({
      form_id: formIdNum,
      student_id: studentIdNum,
      faculty_id: facultyIdNum,
      answers: normalizedAnswers,
    });

    return res.status(201).json({ data: result });
  } catch (err) {
    // Surface service-layer validation errors
    if (err && err.status === 400) {
      return res.status(400).json({ error: { message: err.message, details: err.details } });
    }

    console.error('Error submitting evaluation (structured):', {
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
      stack: err?.stack,
    });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// GET /api/evaluations/:facultyId
exports.getEvaluationsByFaculty = async (req, res) => {
  const rawId = (req.params.facultyId || '').toString();
  const facultyId = Number(rawId);
  if (!Number.isInteger(facultyId) || facultyId <= 0) {
    return res.status(400).json({ error: { message: "Path parameter 'facultyId' must be a positive integer" } });
  }
  try {
    const data = await evaluationService.getEvaluationsByFaculty(facultyId);
    return res.status(200).json({ data });
  } catch (err) {
    console.error('Error fetching evaluations by faculty:', {
      facultyId,
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
    });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

exports.createEvaluation = async (req, res) => {
  try {
    const { valid, errors, targetName } = validatePayload(req.body);
    if (!valid) {
      return res.status(400).json({ error: { message: 'Validation failed', details: errors } });
    }

    // Build responses, optionally appending metadata such as department.
    const incomingResponses = Array.isArray(req.body.responses) ? req.body.responses : [];
    const metaDepartment = isNonEmptyString(req.body.department) ? String(req.body.department).trim() : '';
    const responsesWithMeta = metaDepartment
      ? [
          // Store metadata as a special record for analytics without schema changes
          { question_id: '_meta_department', category: '_meta', type: '_meta', answer: metaDepartment },
          ...incomingResponses,
        ]
      : incomingResponses;

    const payload = {
      subject: String(req.body.subject).trim(),
      target_name: targetName,
      responses: responsesWithMeta,
    };

    const sql = `
      INSERT INTO public.evaluation_submissions (subject, target_name, responses)
      VALUES ($1, $2, $3::jsonb)
      RETURNING submission_id::text AS submission_id, subject, target_name, created_at
    `;

    const params = [payload.subject, payload.target_name, JSON.stringify(payload.responses)];
    const { rows } = await query(sql, params);
    const created = rows[0];

    // Best-effort dual-write to structured tables if structured identifiers exist in body
    try {
      const asInt = (v) => Number.isInteger(Number(v)) ? Number(v) : NaN;
      const formIdNum = asInt(req.body?.form_id);
      let studentIdNum = asInt(req.body?.student_id);
      const facultyIdNum = asInt(req.body?.faculty_id);
      const userIdNum = asInt(req.body?.user_id);

      // Attempt to resolve student_id via user_id if not provided
      if (!Number.isInteger(studentIdNum) && Number.isInteger(userIdNum)) {
        try {
          const look = await query(`SELECT student_id FROM public.students WHERE user_id = $1 LIMIT 1`, [userIdNum]);
          if (look?.rows?.[0]?.student_id) {
            studentIdNum = Number(look.rows[0].student_id);
          } else {
            // Try to create a minimal students row if schema allows it
            try {
              const ins = await query(
                `INSERT INTO public.students (user_id) VALUES ($1)
                 RETURNING student_id`,
                [userIdNum]
              );
              if (ins?.rows?.[0]?.student_id) {
                studentIdNum = Number(ins.rows[0].student_id);
              }
            } catch (_) {
              // Ignore creation failures (e.g., schema requires more columns)
            }
          }
        } catch (_) {
          // Table might not exist or schema differs; continue gracefully
        }
      }

      // Map legacy responses to structured answers format only for integer-like question IDs
      const legacyResponses = Array.isArray(incomingResponses) ? incomingResponses : [];
      const normalizedAnswers = legacyResponses
        .filter((r) => r && r.question_id !== undefined && r.question_id !== null)
        .map((r) => ({
          question_id: r.question_id,
          answer_value: r.answer,
          metadata: r.metadata || null,
        }))
        .filter((a) => Number.isInteger(Number(a.question_id)))
        .map((a) => ({
          question_id: Number(a.question_id),
          answer_value: a.answer_value,
          metadata: a.metadata,
        }));

      const canStructured = Number.isInteger(formIdNum) && Number.isInteger(studentIdNum) && Number.isInteger(facultyIdNum) && normalizedAnswers.length > 0;
      if (canStructured) {
        await evaluationService.submitEvaluation({
          form_id: formIdNum,
          student_id: studentIdNum,
          faculty_id: facultyIdNum,
          answers: normalizedAnswers,
        });
      }
    } catch (dualErr) {
      // Do not fail the legacy response insert; just log for diagnostics
      console.warn('Dual-write to structured tables failed (non-fatal):', {
        code: dualErr?.code,
        message: dualErr?.message,
        detail: dualErr?.detail,
      });
    }

    return res.status(201).json(created);
  } catch (err) {
    console.error('Error creating evaluation submission:', { code: err?.code, message: err?.message, detail: err?.detail });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
