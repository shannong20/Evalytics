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

module.exports = { listDepartments };
