const questionService = require('../services/questionService');
const { query } = require('../config/db');

/**
 * Controller to get all categories with their nested questions.
 * @route GET /api/v1/questions-with-categories
 */
const getCategoriesWithQuestions = async (req, res) => {
  try {
    const categories = await questionService.getCategoriesWithQuestions();

    if (!categories || categories.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: 'No categories or questions found',
      });
    }

    return res.status(200).json({
      status: 'success',
      data: { categories },
    });
  } catch (error) {
    console.error('Error in getCategoriesWithQuestions controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  getCategoriesWithQuestions,
  // Public: list all questions, optional category filter
  async listQuestionsPublic(req, res) {
    try {
      const { category } = req.query || {};
      let sql = `
        SELECT
          q.question_id::text AS question_id,
          q.category_id,
          c.name AS category,
          q.text AS question_text,
          q.weight
        FROM question q
        JOIN category c ON c.category_id = q.category_id
      `;
      const params = [];
      if (category && String(category).trim() !== '') {
        params.push(String(category).trim());
        sql += ' WHERE LOWER(c.name) = LOWER($1) AND q.is_active = TRUE';
      }
      if (!(category && String(category).trim() !== '')) {
        // No category filter; still show only active
        sql += ' WHERE q.is_active = TRUE';
      }
      sql += ' ORDER BY c.category_id ASC, q.question_id ASC';
      const { rows } = await query(sql, params);
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error in listQuestionsPublic:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
  
  // Admin: update question
  async updateQuestion(req, res) {
    try {
      const idRaw = (req.params.id || '').toString();
      const questionId = Number(idRaw);
      if (!Number.isInteger(questionId) || questionId <= 0) {
        return res.status(400).json({ status: 'error', message: "Path parameter 'id' must be a positive integer" });
      }

      const updates = {};
      if (typeof req.body?.text === 'string') {
        const text = String(req.body.text).trim();
        if (text.length < 5 || text.length > 255) {
          return res.status(400).json({ status: 'error', message: 'text must be 5-255 characters' });
        }
        updates.text = text;
      }
      if (req.body?.category_id != null) {
        const cid = Number(req.body.category_id);
        if (!Number.isInteger(cid) || cid <= 0) {
          return res.status(400).json({ status: 'error', message: 'category_id must be a positive integer' });
        }
        // ensure category exists
        const { rows: cat } = await query('SELECT 1 FROM category WHERE category_id=$1', [cid]);
        if (cat.length === 0) {
          return res.status(400).json({ status: 'error', message: 'category_id does not exist' });
        }
        updates.category_id = cid;
      }
      if (req.body?.weight != null) {
        const w = Number(req.body.weight);
        if (!isFinite(w) || w < 0 || w > 100) {
          return res.status(400).json({ status: 'error', message: 'weight must be between 0 and 100' });
        }
        updates.weight = w;
      }

      if (Object.keys(updates).length === 0) {
        return res.status(400).json({ status: 'error', message: 'No valid fields to update' });
      }

      // Build dynamic SQL
      const setParts = [];
      const params = [];
      let idx = 1;
      for (const [k, v] of Object.entries(updates)) {
        setParts.push(`${k}=$${idx++}`);
        params.push(v);
      }
      params.push(questionId);

      const sql = `UPDATE question SET ${setParts.join(', ')}, updated_at=NOW() WHERE question_id=$${idx} RETURNING question_id::text AS question_id, category_id, text AS question_text, weight`;
      const { rows } = await query(sql, params);
      if (rows.length === 0) {
        return res.status(404).json({ status: 'error', message: 'Question not found' });
      }
      const updated = rows[0];
      const { rows: catRow } = await query('SELECT name FROM category WHERE category_id=$1', [updated.category_id]);
      updated.category = catRow[0]?.name || null;
      return res.status(200).json(updated);
    } catch (error) {
      console.error('Error in updateQuestion:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // Admin: delete question
  async deleteQuestion(req, res) {
    try {
      const idRaw = (req.params.id || '').toString();
      const questionId = Number(idRaw);
      if (!Number.isInteger(questionId) || questionId <= 0) {
        return res.status(400).json({ status: 'error', message: "Path parameter 'id' must be a positive integer" });
      }
      // Soft delete: mark as inactive instead of deleting (avoids FK violations against response)
      const { rowCount } = await query(
        'UPDATE question SET is_active = FALSE, updated_at = NOW() WHERE question_id = $1 AND is_active = TRUE',
        [questionId]
      );
      if (rowCount === 0) {
        return res.status(404).json({ status: 'error', message: 'Question not found or already inactive' });
      }
      return res.status(204).send();
    } catch (error) {
      console.error('Error in deleteQuestion:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // Public: list questions by form id (fallback to all if form_id not present)
  async listQuestionsByFormPublic(req, res) {
    try {
      const raw = (req.params.formId || '').toString();
      const formId = Number(raw);
      if (!Number.isInteger(formId) || formId <= 0) {
        return res.status(400).json({ status: 'error', message: "Path parameter 'formId' must be a positive integer" });
      }
      // If your schema has form_id, filter by it. Otherwise, return all.
      const hasFormIdColumn = false; // set true if you add form_id to Question
      let rows;
      if (hasFormIdColumn) {
        const { rows: r } = await query(
          `SELECT q.question_id::text AS question_id, q.category_id, c.name AS category, q.text AS question_text, q.weight
           FROM question q JOIN category c ON c.category_id=q.category_id
           WHERE q.form_id=$1 AND q.is_active=TRUE
           ORDER BY c.category_id ASC, q.question_id ASC`,
           [formId]
        );
        rows = r;
      } else {
        const { rows: r } = await query(
          `SELECT q.question_id::text AS question_id, q.category_id, c.name AS category, q.text AS question_text, q.weight
           FROM question q JOIN category c ON c.category_id=q.category_id
           WHERE q.is_active=TRUE
           ORDER BY c.category_id ASC, q.question_id ASC`
        );
        rows = r;
      }
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error in listQuestionsByFormPublic:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // Admin: list all questions
  async listQuestions(req, res) {
    try {
      const { rows } = await query(
        `SELECT q.question_id::text AS question_id, q.category_id, c.name AS category, q.text AS question_text, q.weight
         FROM question q JOIN category c ON c.category_id=q.category_id
         WHERE q.is_active = TRUE
         ORDER BY c.category_id ASC, q.question_id ASC`
      );
      return res.status(200).json(rows);
    } catch (error) {
      console.error('Error in listQuestions:', error);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },

  // Admin: create question with defaults (type=rating_scale, required=true)
  async createQuestion(req, res) {
    try {
      // Support both new and legacy payloads
      const textRaw = (typeof req.body?.text === 'string' ? req.body.text : req.body?.question_text) || '';
      const text = String(textRaw).trim();
      let category_id = Number(req.body?.category_id);
      const categoryNameRaw = req.body?.category;
      const weight = req.body?.weight != null ? Number(req.body.weight) : 1.0;

      if (text.length < 5 || text.length > 255) {
        return res.status(400).json({ status: 'error', message: 'text/question_text must be 5-255 characters' });
      }

      if (!Number.isInteger(category_id) || category_id <= 0) {
        if (typeof categoryNameRaw === 'string' && categoryNameRaw.trim() !== '') {
          // Lookup category_id by name (lowercase table name)
          const { rows: catRows } = await query(`SELECT category_id FROM category WHERE LOWER(name)=LOWER($1) LIMIT 1`, [categoryNameRaw.trim()]);
          if (catRows.length === 0) {
            return res.status(400).json({ status: 'error', message: `Unknown category name: ${categoryNameRaw}` });
          }
          category_id = Number(catRows[0].category_id);
        } else {
          return res.status(400).json({ status: 'error', message: 'category_id or category name is required' });
        }
      }

      const insertSql = `
        INSERT INTO question (category_id, text, weight)
        VALUES ($1, $2, $3)
        RETURNING question_id::text AS question_id, category_id, text AS question_text, weight;
      `;
      const params = [category_id, text, isNaN(weight) ? 1.0 : weight];
      const { rows } = await query(insertSql, params);
      const created = rows[0];
      // Attach category name for UI convenience
      const { rows: cat } = await query(`SELECT name FROM category WHERE category_id=$1`, [category_id]);
      created.category = cat[0]?.name || null;
      return res.status(201).json(created);
    } catch (err) {
      if (err && err.code === '23505') return res.status(409).json({ status: 'error', message: 'Duplicate question for this category' });
      if (err && err.code === '23514') return res.status(400).json({ status: 'error', message: 'Constraint violation on question fields' });
      if (err && err.code === '23502') return res.status(400).json({ status: 'error', message: 'Missing required field' });
      console.error('Error in createQuestion:', err);
      return res.status(500).json({ status: 'error', message: 'Internal server error' });
    }
  },
}
;
