const { query } = require('../config/db');

async function listForms({ active } = {}) {
  const params = [];
  let sql = `
    SELECT form_id, title, school_year, semester, start_date, end_date, created_by, is_active, created_at
    FROM evaluation_form
  `;
  if (active === true) {
    sql += ' WHERE is_active = TRUE';
  }
  sql += ' ORDER BY created_at DESC, form_id DESC';
  const { rows } = await query(sql, params);
  return rows;
}

async function getFormById(formId) {
  const { rows } = await query(
    `SELECT form_id, title, school_year, semester, start_date, end_date, created_by, is_active, created_at
     FROM evaluation_form WHERE form_id=$1`,
    [formId]
  );
  return rows[0] || null;
}

async function createForm({ title, school_year, semester, start_date, end_date, created_by, is_active = true }) {
  const { rows } = await query(
    `INSERT INTO evaluation_form (title, school_year, semester, start_date, end_date, created_by, is_active)
     VALUES ($1,$2,$3,$4,$5,$6,$7)
     RETURNING form_id, title, school_year, semester, start_date, end_date, created_by, is_active, created_at` ,
    [title, school_year, semester, start_date, end_date, created_by, is_active]
  );
  return rows[0];
}

async function updateForm(formId, updates) {
  const allowed = ['title','school_year','semester','start_date','end_date','is_active'];
  const setParts = [];
  const params = [];
  let idx = 1;
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      setParts.push(`${key}=$${idx++}`);
      params.push(updates[key]);
    }
  }
  if (setParts.length === 0) return await getFormById(formId);
  params.push(formId);
  const { rows } = await query(
    `UPDATE evaluation_form SET ${setParts.join(', ')} WHERE form_id=$${idx} RETURNING form_id, title, school_year, semester, start_date, end_date, created_by, is_active, created_at`,
    params
  );
  return rows[0] || null;
}

async function softDeleteForm(formId) {
  const { rows } = await query(
    `UPDATE evaluation_form SET is_active=FALSE WHERE form_id=$1 RETURNING form_id, title, school_year, semester, start_date, end_date, created_by, is_active, created_at`,
    [formId]
  );
  return rows[0] || null;
}

module.exports = {
  listForms,
  getFormById,
  createForm,
  updateForm,
  softDeleteForm,
};
