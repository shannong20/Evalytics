const express = require('express');
const usersController = require('../controllers/usersController');

const router = express.Router();

// GET /api/users/faculty?department=College%20of%20Education
router.get('/faculty', usersController.listFaculty);

// GET /api/users/faculty/joined?department=College%20of%20Education
router.get('/faculty/joined', usersController.listFacultyJoined);

// GET /api/users/students/joined?department=...&course=...&year_level=...
router.get('/students/joined', usersController.listStudentsJoined);

// GET /api/users/supervisors/joined?department=...&title=...
router.get('/supervisors/joined', usersController.listSupervisorsJoined);

// GET /api/users/roles/:role?department=College%20of%20Education
// Examples:
//   /api/users/roles/faculty
//   /api/users/roles/student
//   /api/users/roles/supervisor
router.get('/roles/:role', usersController.listUsersByRoleJoined);

// GET /api/users/:id (numeric) - fetch single user with role-specific details
router.get('/:id(\\d+)', usersController.getUserById);

module.exports = router;
