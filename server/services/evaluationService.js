const { pool } = require('../config/db');
const reportService = require('../services/reportService');

/**
 * Submits a new evaluation and its responses within a single transaction.
 * @param {object} evaluationData The evaluation data.
 * @param {number} evaluationData.evaluator_id The ID of the user submitting the evaluation.
 * @param {number} evaluationData.evaluatee_id The ID of the user being evaluated.
 * @param {Array<{question_id: number, rating: number}>} evaluationData.responses An array of response objects.
 * @param {number} evaluationData.course_id The ID of the course being evaluated.
 * @param {number} evaluationData.form_id The ID of the evaluation form used.
 * @param {string} [evaluationData.comments] Optional free-text comments.
 * @returns {Promise<{evaluation_id: number, overall_score: number}>} The created evaluation's ID and final score.
 */
async function submitEvaluation({ evaluator_id, evaluatee_id, course_id, responses, comments, form_id }) {
  // Validate responses array
  if (!Array.isArray(responses) || responses.length === 0) {
    const err = new Error('The `responses` array cannot be empty.');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Validate the form_id: must exist, be active, and within date window
    {
      const formSql = `
        SELECT form_id, is_active,
               start_date,
               end_date,
               (CURRENT_DATE BETWEEN start_date AND end_date) AS in_window
        FROM evaluation_form
        WHERE form_id = $1
        LIMIT 1
      `;
      const { rows: formRows } = await client.query(formSql, [form_id]);
      if (formRows.length === 0) {
        const err = new Error('The specified evaluation form does not exist.');
        err.status = 400;
        throw err;
      }
      const f = formRows[0];
      if (!f.is_active || !f.in_window) {
        const err = new Error('The specified evaluation form is not active or is outside its date window.');
        err.status = 400;
        throw err;
      }
    }

    // 1. Insert into Evaluation table (store optional comments)
    const evaluationQuery = `
      INSERT INTO Evaluation (evaluator_id, evaluatee_id, course_id, comments, date_submitted, form_id)
      VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP, $5)
      RETURNING evaluation_id;
    `;
    const evaluationResult = await client.query(evaluationQuery, [
      evaluator_id,
      evaluatee_id,
      course_id,
      (comments && String(comments).trim()) ? String(comments).trim() : null,
      form_id,
    ]);
    const evaluation_id = evaluationResult.rows[0].evaluation_id;

    // 2. Insert all responses into the Response table
    // Build a single multi-row parameterized insert for efficiency
    const responseValues = [];
    const responseParams = [];
    let paramIndex = 1;
    for (const res of responses) {
      responseValues.push(`($${paramIndex++}, $${paramIndex++}, $${paramIndex++})`);
      responseParams.push(evaluation_id, res.question_id, res.rating);
    }

    const responseQuery = `
      INSERT INTO Response (evaluation_id, question_id, rating)
      VALUES ${responseValues.join(', ')};
    `;
    await client.query(responseQuery, responseParams);

    // 3. Compute the overall score using SQL from the Response table
    const computeScoreSql = `
      UPDATE Evaluation
      SET overall_score = sub.avg_rating
      FROM (SELECT ROUND(AVG(rating)::numeric,2) AS avg_rating FROM Response WHERE evaluation_id=$1) sub
      WHERE Evaluation.evaluation_id=$1;
    `;
    await client.query(computeScoreSql, [evaluation_id]);

    // Read back the computed score
    const { rows: scoreRows } = await client.query('SELECT overall_score FROM Evaluation WHERE evaluation_id=$1', [evaluation_id]);
    const overall_score = Number(scoreRows[0]?.overall_score ?? null);

    // 5. Upsert/update Summary_Report for this evaluatee within the same transaction
    await reportService.upsertSummaryForEvaluateeTx(client, evaluatee_id);

    await client.query('COMMIT');

    return { 
      evaluation_id,
      overall_score 
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in submitEvaluation transaction:', error);
    // Re-throw the error to be handled by the controller
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  submitEvaluation,
};
