const { query } = require('../config/db');

// Cache for schema checks to avoid repeated information_schema queries
let studentsColumnsCache = null;
let tablesExistenceCache = {};

async function tableExists(tableName) {
  if (tablesExistenceCache[tableName] != null) return tablesExistenceCache[tableName];
  try {
    const { rowCount } = await query(
      `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
      [tableName]
    );
    tablesExistenceCache[tableName] = rowCount > 0;
  } catch (_) {
    tablesExistenceCache[tableName] = false;
  }
  return tablesExistenceCache[tableName];
}

async function ensureStudentsColumns() {
  if (studentsColumnsCache) return studentsColumnsCache;
  studentsColumnsCache = { course_title: false, course: false, year_level: false };
  try {
    const { rows } = await query(
      `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='students'`
    );
    const names = new Set(rows.map(r => r.column_name));
    studentsColumnsCache.course_title = names.has('course_title');
    studentsColumnsCache.course = names.has('course');
    studentsColumnsCache.year_level = names.has('year_level');
  } catch (_) {
    // leave defaults (all false)
  }
  return studentsColumnsCache;
}

function normalizeRole(role) {
  const r = String(role || '').trim().toLowerCase();
  if (r === 'professor') return 'faculty';
  if (r === 'students') return 'student';
  if (r === 'supervisors') return 'supervisor';
  return r;
}

/**
 * Fetch a single user by ID and include role-specific data.
 * Returns a plain object with combined fields.
 */
async function getUserById(userId) {
  // 1) Load the base user
  const userSql = `
    SELECT user_id, firstname, lastname, email, role, department, created_at, updated_at
    FROM public.users
    WHERE user_id = $1
    LIMIT 1
  `;
  const userRes = await query(userSql, [userId]);
  if (userRes.rowCount === 0) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  const u = userRes.rows[0];
  const role = normalizeRole(u.role);

  // 2) Prepare result with common fields
  const result = {
    user_id: Number(u.user_id),
    firstname: u.firstname,
    lastname: u.lastname,
    email: u.email,
    role: role,
    department: u.department || null,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };

  // 3) Fetch role-specific details
  if (role === 'faculty' && await tableExists('faculty')) {
    const sql = `SELECT faculty_id, department, position FROM public.faculty WHERE user_id = $1 LIMIT 1`;
    const { rows } = await query(sql, [userId]);
    if (rows[0]) {
      result.faculty_id = Number(rows[0].faculty_id);
      result.faculty_department = rows[0].department || null;
      result.position = rows[0].position || null;
    }
  } else if (role === 'student' && await tableExists('students')) {
    await ensureStudentsColumns();
    const fields = ['student_id'];
    if (studentsColumnsCache.course_title) fields.push('course_title');
    if (studentsColumnsCache.course) fields.push('course');
    if (studentsColumnsCache.year_level) fields.push('year_level');

    const sql = `SELECT ${fields.join(', ')} FROM public.students WHERE user_id = $1 LIMIT 1`;
    const { rows } = await query(sql, [userId]);
    if (rows[0]) {
      result.student_id = Number(rows[0].student_id);
      if (studentsColumnsCache.course_title) result.course_title = rows[0].course_title || null;
      if (studentsColumnsCache.course) result.course = rows[0].course || null;
      if (studentsColumnsCache.year_level) result.year_level = rows[0].year_level;
    }
  } else if (role === 'supervisor' && await tableExists('supervisors')) {
    const sql = `SELECT supervisor_id, department, title, created_at, updated_at FROM public.supervisors WHERE user_id = $1 LIMIT 1`;
    const { rows } = await query(sql, [userId]);
    if (rows[0]) {
      result.supervisor_id = Number(rows[0].supervisor_id);
      result.supervisor_department = rows[0].department || null;
      result.title = rows[0].title || null;
      if (rows[0].created_at !== undefined) result.supervisor_created_at = rows[0].created_at;
      if (rows[0].updated_at !== undefined) result.supervisor_updated_at = rows[0].updated_at;
    }
  }

  return result;
}

module.exports = {
  getUserById,
};
