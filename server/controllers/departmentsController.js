const departmentService = require('../services/departmentService');

async function listDepartments(req, res) {
  try {
    const departments = await departmentService.listDepartments();
    return res.status(200).json({ status: 'success', data: departments });
  } catch (err) {
    console.error('listDepartments error:', err);
    return res.status(500).json({ status: 'error', message: 'Internal server error' });
  }
}

async function findDepartmentByName(req, res) {
  try {
    const { name } = req.query;
    console.log('Searching for department with name:', name);
    
    if (!name) {
      console.log('No department name provided');
      return res.status(400).json({ 
        status: 'error', 
        message: 'Department name is required' 
      });
    }

    console.log('Calling departmentService.findDepartmentByName');
    const department = await departmentService.findDepartmentByName(name);
    console.log('[departmentsController] Department service returned:', department);
    
    if (!department) {
      console.log(`Department '${name}' not found`);
      return res.status(404).json({ 
        status: 'error', 
        message: 'Department not found' 
      });
    }

    // Log the department data structure
    console.log('[departmentsController] Sending department data in response:', {
      department_id: department.department_id,
      name: department.name,
      type: typeof department.department_id
    });

    return res.status(200).json({ 
      status: 'success', 
      data: department 
    });
  } catch (err) {
    console.error('findDepartmentByName error:', err);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Internal server error' 
    });
  }
}

module.exports = { 
  listDepartments,
  findDepartmentByName 
};
