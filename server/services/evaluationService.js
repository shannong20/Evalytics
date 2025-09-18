const { pool } = require('../config/db');
const reportService = require('../services/reportService');

/**
 * Submits a new evaluation and its responses within a single transaction.
 * @param {object} evaluationData The evaluation data.
 * @param {number} evaluationData.evaluator_id The ID of the user submitting the evaluation.
 * @param {number} evaluationData.evaluatee_id The ID of the user being evaluated.
 * @param {Array<{question_id: number, rating: number}>} evaluationData.responses An array of response objects.
 * @returns {Promise<{evaluation_id: number, overall_score: number}>} The created evaluation's ID and final score.
 */
async function submitEvaluation({ evaluator_id, evaluatee_id, responses }) {
  // Validate responses array
  if (!Array.isArray(responses) || responses.length === 0) {
    const err = new Error('The `responses` array cannot be empty.');
    err.status = 400;
    throw err;
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. Insert into Evaluation table
    const evaluationQuery = `
      INSERT INTO Evaluation (evaluator_id, evaluatee_id, date_submitted)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      RETURNING evaluation_id;
    `;
    const evaluationResult = await client.query(evaluationQuery, [evaluator_id, evaluatee_id]);
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

    // 3. Compute the overall score
    const totalRating = responses.reduce((sum, res) => sum + res.rating, 0);
    const overall_score = totalRating / responses.length;

    // 4. Update the Evaluation with the computed overall_score
    const updateQuery = `
      UPDATE Evaluation
      SET overall_score = $1
      WHERE evaluation_id = $2;
    `;
    await client.query(updateQuery, [overall_score, evaluation_id]);

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
