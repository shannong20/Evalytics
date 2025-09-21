const { query } = require('../config/db');

/**
 * Fetches all categories and their associated questions.
 * The questions are nested within each category object.
 * @returns {Promise<Array>} A promise that resolves to an array of categories with nested questions.
 */
async function getCategoriesWithQuestions() {
  try {
    const sql = `
      SELECT
        c.category_id,
        c.name AS category_name,
        c.weight AS category_weight,
        json_agg(
          json_build_object(
            'question_id', q.question_id,
            'text', q.text,
            'weight', q.weight
          )
          ORDER BY q.question_id
        ) AS questions
      FROM
        Category c
      LEFT JOIN
        Question q ON c.category_id = q.category_id
      GROUP BY
        c.category_id, c.name, c.weight
      ORDER BY
        c.category_id;
    `;

    const { rows } = await query(sql);

    // Format the response to match the required structure
    const formattedResponse = rows.map(row => ({
      category_id: row.category_id,
      name: row.category_name,
      weight: row.category_weight,
      questions: row.questions.filter(q => q.question_id !== null) // Filter out null questions if a category has no questions
    }));

    return formattedResponse;
  } catch (error) {
    console.error('Error fetching categories with questions:', error);
    throw error;
  }
}

/**
 * Creates a new question
 * @param {Object} questionData - The question data
 * @param {string} questionData.text - The question text
 * @param {number} questionData.category_id - The ID of the category this question belongs to
 * @param {number} [questionData.weight=null] - The weight of the question (optional)
 * @returns {Promise<Object>} The created question with question_id, category_id, text, and weight
 */
async function createQuestion(questionData) {
  try {
    const { text, category_id, weight = null } = questionData;
    
    // Validate required fields
    if (!text || category_id === undefined) {
      throw new Error('Text and category_id are required');
    }

    // Insert the new question
    const queryText = `
      INSERT INTO Question (text, category_id, weight)
      VALUES ($1, $2, $3)
      RETURNING question_id, text, category_id, weight
    `;
    
    const { rows } = await query(queryText, [text, category_id, weight]);
    
    if (!rows || rows.length === 0) {
      throw new Error('Failed to create question');
    }
    
    return rows[0];
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
}

module.exports = {
  getCategoriesWithQuestions,
  createQuestion,
};
