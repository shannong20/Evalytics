const { query } = require('../config/db');
const userService = require('../services/userService');

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

exports.listFaculty = async (req, res) => {
  try {
    const department = (req.query.department || '').toString().trim();
    if (!isNonEmptyString(department)) {
      return res.status(400).json({ error: { message: 'Query parameter "department" is required' } });
    }

    const sql = `
      SELECT user_id, firstname, lastname, email, role, department
      FROM public.users
      WHERE LOWER(role) IN ('faculty', 'professor')
        AND LOWER(TRIM(COALESCE(department, ''))) = LOWER(TRIM($1))
      ORDER BY lastname ASC, firstname ASC
    `;
    const params = [department];
    const { rows } = await query(sql, params);

    let items = rows.map(r => ({
      id: String(r.user_id),
      full_name: `${r.firstname} ${r.lastname}`.trim(),
      email: r.email,
      role: r.role,
      department: r.department || null,
    }));

    // Strict filtering only; if none match, return an empty list to avoid cross-department leakage

    return res.status(200).json({ data: items });
  } catch (err) {
    console.error('Error listing faculty by department:', {
      department: (req.query.department || '').toString(),
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
    });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// GET /api/users/:id
// Fetch a single user by ID with role-specific details merged
exports.getUserById = async (req, res) => {
  const rawId = (req.params.id || '').toString();
  const idNum = Number(rawId);
  if (!Number.isInteger(idNum) || idNum <= 0) {
    return res.status(400).json({ error: { message: "Path parameter 'id' must be a positive integer" } });
  }

  try {
    const user = await userService.getUserById(idNum);
    return res.status(200).json({ data: user });
  } catch (err) {
    if (err && err.status === 404) {
      return res.status(404).json({ error: { message: 'User not found' } });
    }
    console.error('Error fetching user by id:', {
      id: idNum,
      code: err?.code,
      message: err?.message,
      stack: err?.stack,
    });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// GET /api/users/students/joined?department=...&course=...&year_level=...
// Returns students joined with users on user_id, includes student-specific fields.
exports.listStudentsJoined = async (req, res) => {
  try {
    const { department, course_title } = req.query;
    const where = [];
    const params = [];

    if (department) {
      where.push(`LOWER(TRIM(COALESCE(u.department, ''))) = LOWER(TRIM($${params.length + 1}))`);
      params.push(department);
    }

    if (course_title) {
      where.push(`LOWER(TRIM(s.course_title)) = LOWER(TRIM($${params.length + 1}))`);
      params.push(course_title);
    }

    const sql = `
      SELECT 
        u.user_id,
        u.firstname,
        u.lastname,
        u.email,
        u.role,
        u.department AS user_department,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        s.student_id,
        s.course_title
      FROM public.users u
      INNER JOIN public.students s ON s.user_id = u.user_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY u.lastname ASC, u.firstname ASC
    `;

    const { rows } = await query(sql, params);
    const data = rows.map(r => ({
      id: String(r.user_id),
      student_id: String(r.student_id),
      full_name: `${r.firstname} ${r.lastname}`.trim(),
      email: r.email,
      role: r.role,
      user_department: r.user_department || null,
      user_created_at: r.user_created_at,
      user_updated_at: r.user_updated_at,
      course_title: r.course_title || null,
    }));

    return res.status(200).json({ data });
  } catch (err) {
    if (err && err.code === '42P01') {
      return res.status(501).json({ error: { message: "Students table doesn't exist. Please create table 'public.students' with columns (student_id, user_id, course_title)." } });
    }
    console.error('Error listing students joined:', {
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
    });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// GET /api/users/supervisors/joined?department=...&title=...
// Returns supervisors joined with users on user_id, includes supervisor-specific fields.
exports.listSupervisorsJoined = async (req, res) => {
  try {
    const department = (req.query.department || '').toString().trim();
    const title = (req.query.title || '').toString().trim();

    const where = ["LOWER(u.role) = LOWER('supervisor')"]; // ensure correct role
    const params = [];
    if (isNonEmptyString(department)) {
      where.push(`LOWER(TRIM(COALESCE(sp.department, u.department, ''))) = LOWER(TRIM($${params.length + 1}))`);
      params.push(department);
    }
    if (isNonEmptyString(title)) {
      where.push(`LOWER(TRIM(COALESCE(sp.title, ''))) = LOWER(TRIM($${params.length + 1}))`);
      params.push(title);
    }

    const sql = `
      SELECT 
        u.user_id,
        u.firstname,
        u.lastname,
        u.email,
        u.role,
        u.department AS user_department,
        sp.supervisor_id,
        sp.department AS supervisor_department,
        sp.title,
        sp.created_at AS supervisor_created_at,
        sp.updated_at AS supervisor_updated_at
      FROM public.users u
      INNER JOIN public.supervisors sp ON sp.user_id = u.user_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY u.lastname ASC, u.firstname ASC
    `;

    const { rows } = await query(sql, params);
    const data = rows.map(r => ({
      id: String(r.user_id),
      supervisor_id: String(r.supervisor_id),
      full_name: `${r.firstname} ${r.lastname}`.trim(),
      email: r.email,
      role: r.role,
      user_department: r.user_department || null,
      supervisor_department: r.supervisor_department || null,
      title: r.title || null,
      supervisor_created_at: r.supervisor_created_at,
      supervisor_updated_at: r.supervisor_updated_at,
    }));

    return res.status(200).json({ data });
  } catch (err) {
    if (err && err.code === '42P01') {
      return res.status(501).json({ error: { message: "Supervisors table doesn't exist. Please create table 'public.supervisors' with columns (supervisor_id, user_id, department, title)." } });
    }
    console.error('Error listing supervisors joined:', {
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
    });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// GET /api/users/roles/:role?department=College%20of%20Education
// Generic endpoint: join users with a role table when available, else return users filtered by role.
exports.listUsersByRoleJoined = async (req, res) => {
  const rawRole = (req.params.role || '').toString().trim().toLowerCase();
  const department = (req.query.department || '').toString().trim();

  if (!rawRole) {
    return res.status(400).json({ error: { message: 'Path parameter \'role\' is required' } });
  }

  // Map role -> candidate table names in preference order
  const candidateTables = {
    faculty: ['faculty'],
    professor: ['faculty'],
    student: ['students', 'student'],
    students: ['students'],
    supervisor: ['supervisors', 'supervisor'],
    supervisors: ['supervisors'],
    admin: [],
  };

  const candidates = candidateTables[rawRole] || [];

  // Helper: check if table exists
  async function tableExists(table) {
    try {
      const check = await query(
        `SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1 LIMIT 1`,
        [table]
      );
      return check && check.rowCount > 0;
    } catch (_) {
      return false;
    }
  }

  try {
    let selectedTable = null;
    for (const t of candidates) {
      // eslint-disable-next-line no-await-in-loop
      if (await tableExists(t)) { selectedTable = t; break; }
    }

    // When no role table: just return users filtered by role (and optional department)
    if (!selectedTable) {
      const where = ["LOWER(u.role) = LOWER($1)"];
      const params = [rawRole];
      if (isNonEmptyString(department)) {
        where.push("LOWER(TRIM(COALESCE(u.department, ''))) = LOWER(TRIM($2))");
        params.push(department);
      }
      const sql = `
        SELECT u.user_id, u.firstname, u.lastname, u.email, u.role, u.department AS user_department
        FROM public.users u
        WHERE ${where.join(' AND ')}
        ORDER BY u.lastname ASC, u.firstname ASC
      `;
      const { rows } = await query(sql, params);
      return res.status(200).json({
        data: rows.map(r => ({
          id: String(r.user_id),
          full_name: `${r.firstname} ${r.lastname}`.trim(),
          email: r.email,
          role: r.role,
          user_department: r.user_department || null,
          role_data: null,
        }))
      });
    }

    // Join path: include role table data as JSON (excluding user_id) for flexibility across schemas
    const params = [];
    const where = [];
    // Always filter by role for safety
    where.push(`LOWER(u.role) = LOWER($${params.length + 1})`);
    params.push(rawRole);
    if (isNonEmptyString(department)) {
      where.push(`LOWER(TRIM(COALESCE(r.department, u.department, ''))) = LOWER(TRIM($${params.length + 1}))`);
      params.push(department);
    }

    // Map of fields to select for each role
    const roleFields = {
      faculty: ['faculty_id', 'department', 'position'],
      student: ['student_id', 'course_title'],
      supervisor: ['supervisor_id', 'department', 'title'],
    };

    // Build the SELECT clause with role-specific fields
    const fields = ['u.user_id', 'u.firstname', 'u.lastname', 'u.email', 'u.role', 'u.department AS user_department'];
    
    if (roleFields[selectedTable]) {
      roleFields[selectedTable].forEach(field => {
        fields.push(`r.${field} AS ${field}`);
      });
    }

    const sql = `
      SELECT ${fields.join(', ')}
      FROM public.users u
      INNER JOIN public.${selectedTable} r ON r.user_id = u.user_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY u.lastname ASC, u.firstname ASC
    `;

    const { rows } = await query(sql, params);
    const data = rows.map(r => {
      const result = {
        id: String(r.user_id),
        full_name: `${r.firstname} ${r.lastname}`.trim(),
        email: r.email,
        role: r.role,
        user_department: r.user_department || null,
      };

      // Add role-specific data
      if (r.faculty_id) {
        result.faculty_id = String(r.faculty_id);
        result.faculty_department = r.department || null;
        result.position = r.position || null;
      } else if (r.student_id) {
        result.student_id = String(r.student_id);
        result.course_title = r.course_title || null;
      } else if (r.supervisor_id) {
        result.supervisor_id = String(r.supervisor_id);
        result.supervisor_department = r.department || null;
        result.title = r.title || null;
      }

      return result;
    });

    return res.status(200).json({
      data: data
    });
  } catch (err) {
    console.error('Error listing users by role (joined):', {
      role: rawRole,
      department: department,
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
    });
    // Provide helpful message when table missing
    if (err && err.code === '42P01') {
      const tableSchemas = {
        faculty: 'faculty(faculty_id, user_id, department, position)',
        students: 'students(student_id, user_id, course_title)',
        supervisors: 'supervisors(supervisor_id, user_id, department, title)'
      };
      const schema = tableSchemas[selectedTable] || `${selectedTable}(id, user_id, ...)`;
      
      return res.status(501).json({ 
        error: { 
          message: `Role table '${selectedTable}' doesn't exist. ` +
                  `Please create table 'public.${selectedTable}' with columns: ${schema}`
        } 
      });
    }
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};

// GET /api/users/faculty/joined?department=College%20of%20Education
// Returns faculty joined with users on user_id, including role-specific fields like position.
exports.listFacultyJoined = async (req, res) => {
  try {
    const department = (req.query.department || '').toString().trim();

    const whereClauses = [];
    const params = [];
    if (isNonEmptyString(department)) {
      // Prefer faculty.department if present, fallback to users.department
      whereClauses.push("LOWER(TRIM(COALESCE(f.department, u.department, ''))) = LOWER(TRIM($1))");
      params.push(department);
    }

    const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const sql = `
      SELECT 
        u.user_id,
        u.firstname,
        u.lastname,
        u.email,
        u.role,
        u.department AS user_department,
        u.created_at AS user_created_at,
        u.updated_at AS user_updated_at,
        f.faculty_id,
        f.department AS faculty_department,
        f.position
      FROM public.users u
      INNER JOIN public.faculty f ON f.user_id = u.user_id
      ${whereSql}
      ORDER BY u.lastname ASC, u.firstname ASC
    `;

    const { rows } = await query(sql, params);

    const data = rows.map(r => ({
      id: String(r.user_id),
      faculty_id: String(r.faculty_id),
      full_name: `${r.firstname} ${r.lastname}`.trim(),
      email: r.email,
      role: r.role,
      user_department: r.user_department || null,
      user_created_at: r.user_created_at,
      user_updated_at: r.user_updated_at,
      faculty_department: r.faculty_department || null,
      position: r.position || null,
    }));

    return res.status(200).json({ data });
  } catch (err) {
    // Postgres 42P01 = undefined_table (faculty table might not exist)
    if (err && err.code === '42P01') {
      return res.status(501).json({ error: { message: "Faculty table doesn't exist. Please create table 'public.faculty' with columns (faculty_id, user_id, department, position)." } });
    }

    console.error('Error listing faculty joined:', {
      department: (req.query.department || '').toString(),
      code: err?.code,
      message: err?.message,
      detail: err?.detail,
    });
    return res.status(500).json({ error: { message: 'Internal server error' } });
  }
};
