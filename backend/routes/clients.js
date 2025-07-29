/**
 * Client Management API Routes
 * CRUD operations for rsvp_master_clients table
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// GET /api/clients - Get all clients
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const clients = await dbMethods.all(db, 
      `SELECT c.*, cu.customer_name 
       FROM rsvp_master_clients c 
       LEFT JOIN master_customers cu ON c.customer_id = cu.customer_id 
       ORDER BY c.created_at DESC`, 
      []
    );
    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ error: 'Failed to fetch clients' });
  }
});

// GET /api/clients/:id - Get client by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const client = await dbMethods.get(db, 
      `SELECT c.*, cu.customer_name 
       FROM rsvp_master_clients c 
       LEFT JOIN master_customers cu ON c.customer_id = cu.customer_id 
       WHERE c.client_id = ?`, 
      [req.params.id]
    );
    
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }
    
    res.json(client);
  } catch (error) {
    console.error('Error fetching client:', error);
    res.status(500).json({ error: 'Failed to fetch client' });
  }
});

// POST /api/clients - Create new client
router.post('/', [
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('client_name').notEmpty().withMessage('Client name is required'),
  body('client_email').optional().isEmail().withMessage('Invalid email format'),
  body('client_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, client_name, client_email, client_phone, client_address, client_city, client_status } = req.body;
    const db = req.app.locals.db;

    // Check if customer exists
    const customer = await dbMethods.get(db, 'SELECT customer_id FROM master_customers WHERE customer_id = ?', [customer_id]);
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_clients (customer_id, client_name, client_email, client_phone, client_address, client_city, client_status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customer_id, client_name, client_email, client_phone, client_address, client_city, client_status || 'Active']
    );

    const newClient = await dbMethods.get(db, 
      `SELECT c.*, cu.customer_name 
       FROM rsvp_master_clients c 
       LEFT JOIN master_customers cu ON c.customer_id = cu.customer_id 
       WHERE c.client_id = ?`, 
      [result.lastID]
    );
    res.status(201).json(newClient);
  } catch (error) {
    console.error('Error creating client:', error);
    res.status(500).json({ error: 'Failed to create client' });
  }
});

// PUT /api/clients/:id - Update client
router.put('/:id', [
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('client_name').notEmpty().withMessage('Client name is required'),
  body('client_email').optional().isEmail().withMessage('Invalid email format'),
  body('client_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { customer_id, client_name, client_email, client_phone, client_address, client_city, client_status } = req.body;
    const db = req.app.locals.db;

    const existingClient = await dbMethods.get(db, 'SELECT * FROM rsvp_master_clients WHERE client_id = ?', [req.params.id]);
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Check if customer exists
    const customer = await dbMethods.get(db, 'SELECT customer_id FROM master_customers WHERE customer_id = ?', [customer_id]);
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_clients SET customer_id = ?, client_name = ?, client_email = ?, client_phone = ?, client_address = ?, client_city = ?, client_status = ?, updated_at = CURRENT_TIMESTAMP WHERE client_id = ?',
      [customer_id, client_name, client_email, client_phone, client_address, client_city, client_status, req.params.id]
    );

    const updatedClient = await dbMethods.get(db, 
      `SELECT c.*, cu.customer_name 
       FROM rsvp_master_clients c 
       LEFT JOIN master_customers cu ON c.customer_id = cu.customer_id 
       WHERE c.client_id = ?`, 
      [req.params.id]
    );
    res.json(updatedClient);
  } catch (error) {
    console.error('Error updating client:', error);
    res.status(500).json({ error: 'Failed to update client' });
  }
});

// DELETE /api/clients/:id - Delete client
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const existingClient = await dbMethods.get(db, 'SELECT * FROM rsvp_master_clients WHERE client_id = ?', [req.params.id]);
    if (!existingClient) {
      return res.status(404).json({ error: 'Client not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_clients WHERE client_id = ?', [req.params.id]);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Error deleting client:', error);
    res.status(500).json({ error: 'Failed to delete client' });
  }
});

module.exports = router;