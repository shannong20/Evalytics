const { query } = require('../config/db');

/**
 * Public: list categories
 * GET /api/v1/categories/public
 */
async function listCategoriesPublic(req, res) {
  try {
    let rows;
    try {
      // Try quoted table name first (case-sensitive)
      ({ rows } = await query(`SELECT category_id, name, weight FROM "Category" ORDER BY category_id ASC`));
    } catch (err) {
      if (err && err.code === '42P01') {
        // Fallback to unquoted lowercase table name
        ({ rows } = await query(`SELECT category_id, name, weight FROM category ORDER BY category_id ASC`));
      } else {
        throw err;
      }
    }
    return res.status(200).json(rows);
  } catch (err) {
    console.error('Error listing categories:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

/**
 * Admin: list categories
 * GET /api/v1/categories
 */
async function listCategories(req, res) {
  try {
    let rows;
    try {
      ({ rows } = await query(`SELECT category_id, name, weight FROM "Category" ORDER BY category_id ASC`));
    } catch (err) {
      if (err && err.code === '42P01') {
        ({ rows } = await query(`SELECT category_id, name, weight FROM category ORDER BY category_id ASC`));
      } else {
        throw err;
      }
    }
    return res.status(200).json(rows);
  } catch (err) {
    console.error('Error listing categories (admin):', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

module.exports = {
  listCategoriesPublic,
  listCategories,
};
