const { query } = require('../config/db');

/**
 * List courses for the evaluatee's department.
 * Determine the evaluatee's department_id from users table, then
 * return courses from Course table for that department.
 *
 * @param {number} evaluateeId - user_id of the evaluatee (faculty being evaluated)
 * @returns {Promise<Array<{course_id:number, course_code:string, course_title:string}>>}
 */
async function listCoursesByEvaluatee(evaluateeId) {
  const id = (evaluateeId || '').toString();
  if (!id) return [];

  // 1) Find evaluatee's department
  const { rows: userRows } = await query(
    `SELECT department_id FROM users WHERE user_id::text = $1::text LIMIT 1`,
    [id]
  );
  if (!userRows || userRows.length === 0) return [];
  const departmentId = userRows[0].department_id;
  if (!departmentId) return [];

  // 2) Fetch courses for that department
  const { rows } = await query(
    `SELECT course_id, course_code, course_title
     FROM course
     WHERE department_id = $1
     ORDER BY course_code ASC, course_title ASC`,
    [departmentId]
  );

  return rows.map(r => ({
    course_id: Number(r.course_id),
    course_code: r.course_code,
    course_title: r.course_title,
  }));
}

module.exports = { listCoursesByEvaluatee };
