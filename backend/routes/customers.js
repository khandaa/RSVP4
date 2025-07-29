/**
 * Customer Management API Routes
 * CRUD operations for master_customers table
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// GET /api/customers - Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const customers = await dbMethods.all(db, 'SELECT * FROM master_customers ORDER BY created_at DESC', []);
    res.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

// GET /api/customers/:id - Get customer by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const customer = await dbMethods.get(db, 'SELECT * FROM master_customers WHERE customer_id = ?', [req.params.id]);
    
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ error: 'Failed to fetch customer' });
  }
});

// POST /api/customers - Create new customer
router.post('/', [
  authenticateToken,
  body('customer_name').notEmpty().withMessage('Customer name is required'),
  body('customer_email').optional().isEmail().withMessage('Invalid email format'),
  body('customer_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_name, customer_email, customer_phone, customer_address, customer_city, customer_status } = req.body;
    const db = req.app.locals.db;

    const result = await dbMethods.run(db, 
      'INSERT INTO master_customers (customer_name, customer_email, customer_phone, customer_address, customer_city, customer_status) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_name, customer_email, customer_phone, customer_address, customer_city, customer_status || 'Active']
    );

    const newCustomer = await dbMethods.get(db, 'SELECT * FROM master_customers WHERE customer_id = ?', [result.lastID]);
    res.status(201).json(newCustomer);
  } catch (error) {
    console.error('Error creating customer:', error);
    res.status(500).json({ error: 'Failed to create customer' });
  }
});

// PUT /api/customers/:id - Update customer
router.put('/:id', [
  authenticateToken,
  body('customer_name').notEmpty().withMessage('Customer name is required'),
  body('customer_email').optional().isEmail().withMessage('Invalid email format'),
  body('customer_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_name, customer_email, customer_phone, customer_address, customer_city, customer_status } = req.body;
    const db = req.app.locals.db;

    const existingCustomer = await dbMethods.get(db, 'SELECT * FROM master_customers WHERE customer_id = ?', [req.params.id]);
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await dbMethods.run(db,
      'UPDATE master_customers SET customer_name = ?, customer_email = ?, customer_phone = ?, customer_address = ?, customer_city = ?, customer_status = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?',
      [customer_name, customer_email, customer_phone, customer_address, customer_city, customer_status, req.params.id]
    );

    const updatedCustomer = await dbMethods.get(db, 'SELECT * FROM master_customers WHERE customer_id = ?', [req.params.id]);
    res.json(updatedCustomer);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
});

// DELETE /api/customers/:id - Delete customer
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const existingCustomer = await dbMethods.get(db, 'SELECT * FROM master_customers WHERE customer_id = ?', [req.params.id]);
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await dbMethods.run(db, 'DELETE FROM master_customers WHERE customer_id = ?', [req.params.id]);
    res.json({ message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Error deleting customer:', error);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
});

module.exports = router;