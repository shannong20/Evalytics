const { query } = require('../config/db');

async function listDepartments() {
  const sql = `
    SELECT department_id, name
    FROM Department
    ORDER BY name ASC
  `;
  const { rows } = await query(sql);
  return rows.map(r => ({
    department_id: String(r.department_id),
    name: r.name,
  }));
}

async function findDepartmentByName(name) {
  if (!name || typeof name !== 'string') return null;
  const sql = `
    SELECT department_id, name
    FROM Department
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
  `;
  const { rows } = await query(sql, [name.trim()]);
  if (!rows || rows.length === 0) return null;
  const r = rows[0];
  return { department_id: String(r.department_id), name: r.name };
}

module.exports = { listDepartments, findDepartmentByName };
