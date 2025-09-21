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
  if (!name || typeof name !== 'string') {
    console.log('Invalid department name:', name);
    return null;
  }
  
  const trimmedName = name.trim();
  console.log('Executing department query for name:', trimmedName);
  
  const sql = `
    SELECT department_id, name
    FROM Department
    WHERE LOWER(name) = LOWER($1)
    LIMIT 1
  `;
  
  try {
    console.log('Executing SQL:', sql, 'with params:', [trimmedName]);
    const { rows } = await query(sql, [trimmedName]);
    console.log('Query result:', { rowCount: rows?.length, firstRow: rows?.[0] });
    
    if (!rows || rows.length === 0) {
      console.log('No department found with name:', trimmedName);
      return null;
    }
    
    const r = rows[0];
    console.log('[departmentService] Raw row from DB:', r);
    console.log('[departmentService] Department found:', { 
      rawDepartmentId: r.department_id, 
      type: typeof r.department_id,
      name: r.name 
    });
    
    // Ensure we're returning the department_id as a string
    const department = { 
      department_id: String(r.department_id), 
      name: r.name 
    };
    console.log('[departmentService] Department object before return:', department);
    console.log('[departmentService] Returning department object:', department);
    console.log('[departmentService] Final department object:', department);
    return department;
  } catch (error) {
    console.error('Error in findDepartmentByName:', error);
    throw error;
  }
}

module.exports = { listDepartments, findDepartmentByName };
