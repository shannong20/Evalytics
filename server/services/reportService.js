const { pool, query } = require('../config/db');

/**
 * Upsert summary report for a given evaluatee inside an existing transaction client.
 * Recomputes the average from Evaluation and writes to Summary_Report.
 *
 * Tables used (as provided):
 * - Evaluation(evaluation_id, evaluator_id, evaluatee_id, date_submitted, overall_score)
 * - Summary_Report(report_id, evaluatee_id, average_score, generated_on)
 */
async function upsertSummaryForEvaluateeTx(client, evaluatee_id) {
  // 1) Compute new overall average for this evaluatee from Evaluation
  const avgSql = `
    SELECT AVG(overall_score) AS avg
    FROM Evaluation
    WHERE evaluatee_id = $1
  `;
  const { rows: avgRows } = await client.query(avgSql, [evaluatee_id]);
  const avg = avgRows[0]?.avg ?? null;

  // 2) Update or insert Summary_Report
  const updateSql = `
    UPDATE Summary_Report
    SET average_score = $1, generated_on = CURRENT_TIMESTAMP
    WHERE evaluatee_id = $2
  `;
  const updateRes = await client.query(updateSql, [avg, evaluatee_id]);

  if (updateRes.rowCount === 0) {
    const insertSql = `
      INSERT INTO Summary_Report (evaluatee_id, average_score, generated_on)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
    `;
    await client.query(insertSql, [evaluatee_id, avg]);
  }
}

/**
 * Get overall averages per evaluatee from Summary_Report.
 */
async function getOverallAverages() {
  const sql = `
    SELECT evaluatee_id, average_score, generated_on
    FROM Summary_Report
    ORDER BY average_score DESC NULLS LAST, evaluatee_id ASC
  `;
  const { rows } = await query(sql);
  return rows;
}

/**
 * Get category-level averages for a specific evaluatee.
 *
 * Requires:
 * - Response(response_id, evaluation_id, question_id, rating)
 * - Question(question_id, category_id, text, weight)
 * - Category(category_id, name, weight)
 */
async function getCategoryAveragesByEvaluatee(evaluatee_id) {
  const sql = `
    SELECT
      c.category_id,
      c.name AS category_name,
      AVG(r.rating) AS average_rating,
      COUNT(*) AS responses_count
    FROM Response r
    INNER JOIN Evaluation e ON e.evaluation_id = r.evaluation_id
    INNER JOIN Question q ON q.question_id = r.question_id
    INNER JOIN Category c ON c.category_id = q.category_id
    WHERE e.evaluatee_id = $1
    GROUP BY c.category_id, c.name
    ORDER BY c.category_id
  `;
  const { rows } = await query(sql, [evaluatee_id]);
  return rows.map(r => ({
    category_id: Number(r.category_id),
    name: r.category_name,
    average_rating: r.average_rating !== null ? Number(r.average_rating) : null,
    responses_count: Number(r.responses_count),
  }));
}

/**
 * Top-rated faculty by highest average_score from Summary_Report.
 * Joins users to provide names.
 */
async function getTopRatedFaculty(limit = 10) {
  const sql = `
    SELECT 
      sr.evaluatee_id AS user_id,
      sr.average_score,
      u.first_name,
      u.last_name,
      u.department_id
    FROM Summary_Report sr
    INNER JOIN users u ON u.user_id = sr.evaluatee_id
    WHERE LOWER(COALESCE(u.role, '')) = 'faculty'
    ORDER BY sr.average_score DESC NULLS LAST, u.last_name ASC, u.first_name ASC
    LIMIT $1
  `;
  const { rows } = await query(sql, [limit]);
  return rows.map(r => ({
    user_id: Number(r.user_id),
    first_name: r.first_name,
    last_name: r.last_name,
    department_id: r.department_id,
    average_score: r.average_score !== null ? Number(r.average_score) : null,
  }));
}

module.exports = {
  upsertSummaryForEvaluateeTx,
  getOverallAverages,
  getCategoryAveragesByEvaluatee,
  getTopRatedFaculty,
};
