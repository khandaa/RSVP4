/**
 * Employee Management API Routes
 * CRUD operations for employee-related tables
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// ========================= DEPARTMENTS =========================
// GET /api/employee-management/departments
router.get('/departments', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { roles, customer_id } = req.user;

    let query = `SELECT d.*, c.customer_name 
                 FROM rsvp_master_departments d 
                 LEFT JOIN master_customers c ON d.customer_id = c.customer_id`;
    const params = [];

    if (roles && roles.includes('Customer Admin') && customer_id) {
      query += ' WHERE d.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY d.department_name';

    const departments = await dbMethods.all(db, query, params);
    res.json(departments);
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// POST /api/employee-management/departments
router.post('/departments', [
  authenticateToken,
  checkPermissions('employee_management_create'),
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('department_name').notEmpty().withMessage('Department name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, department_name, department_description, department_status } = req.body;
    const db = req.app.locals.db;

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_departments (customer_id, department_name, department_description, department_status) VALUES (?, ?, ?, ?)',
      [customer_id, department_name, department_description, department_status || 'Active']
    );

    const newDepartment = await dbMethods.get(db, 
      `SELECT d.*, c.customer_name 
       FROM rsvp_master_departments d 
       LEFT JOIN master_customers c ON d.customer_id = c.customer_id 
       WHERE d.department_id = ?`, 
      [result.lastID]
    );
    res.status(201).json(newDepartment);
  } catch (error) {
    console.error('Error creating department:', error);
    res.status(500).json({ error: 'Failed to create department' });
  }
});

// PUT /api/employee-management/departments/:id
router.put('/departments/:id', [
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('department_name').notEmpty().withMessage('Department name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, department_name, department_description, department_status } = req.body;
    const db = req.app.locals.db;

    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_departments WHERE department_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_departments SET customer_id = ?, department_name = ?, department_description = ?, department_status = ?, updated_at = CURRENT_TIMESTAMP WHERE department_id = ?',
      [customer_id, department_name, department_description, department_status, req.params.id]
    );

    const updated = await dbMethods.get(db, 
      `SELECT d.*, c.customer_name 
       FROM rsvp_master_departments d 
       LEFT JOIN master_customers c ON d.customer_id = c.customer_id 
       WHERE d.department_id = ?`, 
      [req.params.id]
    );
    res.json(updated);
  } catch (error) {
    console.error('Error updating department:', error);
    res.status(500).json({ error: 'Failed to update department' });
  }
});

// DELETE /api/employee-management/departments/:id
router.delete('/departments/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_departments WHERE department_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Department not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_departments WHERE department_id = ?', [req.params.id]);
    res.json({ message: 'Department deleted successfully' });
  } catch (error) {
    console.error('Error deleting department:', error);
    res.status(500).json({ error: 'Failed to delete department' });
  }
});

// ========================= TEAMS =========================
// GET /api/employee-management/teams
router.get('/teams', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { roles, customer_id } = req.user;

    let query = `SELECT t.*, c.customer_name, e.first_name as leader_first_name, e.last_name as leader_last_name 
                 FROM rsvp_master_teams t 
                 LEFT JOIN master_customers c ON t.customer_id = c.customer_id 
                 LEFT JOIN rsvp_master_employees e ON t.team_leader_id = e.employee_id`;
    const params = [];

    if (roles && roles.includes('Customer Admin') && customer_id) {
      query += ' WHERE t.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY t.team_name';

    const teams = await dbMethods.all(db, query, params);
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// POST /api/employee-management/teams
router.post('/teams', [
  authenticateToken,
  checkPermissions('employee_management_create'),
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('team_name').notEmpty().withMessage('Team name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, team_name, team_leader_id, team_description, team_status } = req.body;
    const db = req.app.locals.db;

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_teams (customer_id, team_name, team_leader_id, team_description, team_status) VALUES (?, ?, ?, ?, ?)',
      [customer_id, team_name, team_leader_id, team_description, team_status || 'Active']
    );

    const newTeam = await dbMethods.get(db, 
      `SELECT t.*, c.customer_name, e.first_name as leader_first_name, e.last_name as leader_last_name 
       FROM rsvp_master_teams t 
       LEFT JOIN master_customers c ON t.customer_id = c.customer_id 
       LEFT JOIN rsvp_master_employees e ON t.team_leader_id = e.employee_id 
       WHERE t.team_id = ?`, 
      [result.lastID]
    );
    res.status(201).json(newTeam);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// GET /api/employee-management/teams/:id
router.get('/teams/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const team = await dbMethods.get(db, 
      `SELECT t.*, c.customer_name, e.first_name as leader_first_name, e.last_name as leader_last_name 
       FROM rsvp_master_teams t 
       LEFT JOIN master_customers c ON t.customer_id = c.customer_id 
       LEFT JOIN rsvp_master_employees e ON t.team_leader_id = e.employee_id 
       WHERE t.team_id = ?`, 
      [req.params.id]
    );
    
    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }
    
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// PUT /api/employee-management/teams/:id
router.put('/teams/:id', [
  authenticateToken,
  checkPermissions('employee_management_edit'),
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('team_name').notEmpty().withMessage('Team name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, team_name, team_leader_id, team_description, team_status } = req.body;
    const db = req.app.locals.db;

    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_teams WHERE team_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_teams SET customer_id = ?, team_name = ?, team_leader_id = ?, team_description = ?, team_status = ?, updated_at = CURRENT_TIMESTAMP WHERE team_id = ?',
      [customer_id, team_name, team_leader_id, team_description, team_status, req.params.id]
    );

    const updated = await dbMethods.get(db, 
      `SELECT t.*, c.customer_name, e.first_name as leader_first_name, e.last_name as leader_last_name 
       FROM rsvp_master_teams t 
       LEFT JOIN master_customers c ON t.customer_id = c.customer_id 
       LEFT JOIN rsvp_master_employees e ON t.team_leader_id = e.employee_id 
       WHERE t.team_id = ?`, 
      [req.params.id]
    );
    res.json(updated);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// DELETE /api/employee-management/teams/:id
router.delete('/teams/:id', [
  authenticateToken,
  checkPermissions('employee_management_delete')
], async (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_teams WHERE team_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_teams WHERE team_id = ?', [req.params.id]);
    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// ========================= EMPLOYEES =========================
// GET /api/employee-management/employees
router.get('/employees', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { roles, customer_id } = req.user;

    let query = `SELECT e.*, c.customer_name, d.department_name, t.team_name 
                 FROM rsvp_master_employees e 
                 LEFT JOIN master_customers c ON e.customer_id = c.customer_id 
                 LEFT JOIN rsvp_master_departments d ON e.department_id = d.department_id 
                 LEFT JOIN rsvp_master_teams t ON e.team_id = t.team_id`;
    const params = [];

    if (roles && roles.includes('Customer Admin') && customer_id) {
      query += ' WHERE e.customer_id = ?';
      params.push(customer_id);
    }

    query += ' ORDER BY e.first_name, e.last_name';

    const employees = await dbMethods.all(db, query, params);
    res.json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// GET /api/employee-management/employees/:id
router.get('/employees/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const employee = await dbMethods.get(db, 
      `SELECT e.*, c.customer_name, d.department_name, t.team_name 
       FROM rsvp_master_employees e 
       LEFT JOIN master_customers c ON e.customer_id = c.customer_id 
       LEFT JOIN rsvp_master_departments d ON e.department_id = d.department_id 
       LEFT JOIN rsvp_master_teams t ON e.team_id = t.team_id 
       WHERE e.employee_id = ?`, 
      [req.params.id]
    );
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    
    res.json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// POST /api/employee-management/employees
router.post('/employees', [
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, department_id, team_id, first_name, last_name, email, phone, hire_date, employee_status } = req.body;
    const db = req.app.locals.db;

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_employees (customer_id, department_id, team_id, first_name, last_name, email, phone, hire_date, employee_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_id, department_id, team_id, first_name, last_name, email, phone, hire_date, employee_status || 'Active']
    );

    const newEmployee = await dbMethods.get(db, 
      `SELECT e.*, c.customer_name, d.department_name, t.team_name 
       FROM rsvp_master_employees e 
       LEFT JOIN master_customers c ON e.customer_id = c.customer_id 
       LEFT JOIN rsvp_master_departments d ON e.department_id = d.department_id 
       LEFT JOIN rsvp_master_teams t ON e.team_id = t.team_id 
       WHERE e.employee_id = ?`, 
      [result.lastID]
    );
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// PUT /api/employee-management/employees/:id
router.put('/employees/:id', [
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('first_name').notEmpty().withMessage('First name is required'),
  body('last_name').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, department_id, team_id, first_name, last_name, email, phone, hire_date, employee_status } = req.body;
    const db = req.app.locals.db;

    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_employees WHERE employee_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_employees SET customer_id = ?, department_id = ?, team_id = ?, first_name = ?, last_name = ?, email = ?, phone = ?, hire_date = ?, employee_status = ?, updated_at = CURRENT_TIMESTAMP WHERE employee_id = ?',
      [customer_id, department_id, team_id, first_name, last_name, email, phone, hire_date, employee_status, req.params.id]
    );

    const updated = await dbMethods.get(db, 
      `SELECT e.*, c.customer_name, d.department_name, t.team_name 
       FROM rsvp_master_employees e 
       LEFT JOIN master_customers c ON e.customer_id = c.customer_id 
       LEFT JOIN rsvp_master_departments d ON e.department_id = d.department_id 
       LEFT JOIN rsvp_master_teams t ON e.team_id = t.team_id 
       WHERE e.employee_id = ?`, 
      [req.params.id]
    );
    res.json(updated);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ error: 'Failed to update employee' });
  }
});

// DELETE /api/employee-management/employees/:id
router.delete('/employees/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_employees WHERE employee_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_employees WHERE employee_id = ?', [req.params.id]);
    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;