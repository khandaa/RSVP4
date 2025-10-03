/**
 * Venue Management API Routes
 * CRUD operations for rsvp_master_venues table
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// GET /api/venues - Get all venues
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const venues = await dbMethods.all(db, 
      `SELECT v.*, c.customer_name 
       FROM rsvp_master_venues v 
       LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
       ORDER BY v.created_at DESC`, 
      []
    );
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/customer/:customerId - Get venues by customer ID
router.get('/customer/:customerId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { customerId } = req.params;
    const { sortField = 'venue_name', sortOrder = 'asc', sortDirection = 'asc' } = req.query;

    // Validate sortOrder (support both sortOrder and sortDirection)
    const sortParam = sortOrder || sortDirection;
    const order = sortParam && sortParam.toLowerCase() === 'desc' ? 'DESC' : 'ASC';

    // Validate sortField (prevent SQL injection)
    const allowedSortFields = ['venue_name', 'venue_city', 'venue_capacity', 'created_at'];
    const validSortField = allowedSortFields.includes(sortField) ? sortField : 'venue_name';

    const venues = await dbMethods.all(db,
      `SELECT v.*, c.customer_name
       FROM rsvp_master_venues v
       LEFT JOIN master_customers c ON v.customer_id = c.customer_id
       WHERE v.customer_id = ?
       ORDER BY v.${validSortField} ${order}`,
      [customerId]
    );
    res.json(venues);
  } catch (error) {
    console.error('Error fetching venues by customer:', error);
    res.status(500).json({ error: 'Failed to fetch venues' });
  }
});

// GET /api/venues/:id - Get venue by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const venue = await dbMethods.get(db, 
      `SELECT v.*, c.customer_name 
       FROM rsvp_master_venues v 
       LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
       WHERE v.venue_id = ?`, 
      [req.params.id]
    );
    
    if (!venue) {
      return res.status(404).json({ error: 'Venue not found' });
    }
    
    res.json(venue);
  } catch (error) {
    console.error('Error fetching venue:', error);
    res.status(500).json({ error: 'Failed to fetch venue' });
  }
});

// POST /api/venues - Create new venue
router.post('/', [
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('venue_name').notEmpty().withMessage('Venue name is required'),
  body('venue_capacity').optional().isInt({ min: 1 }).withMessage('Venue capacity must be a positive integer'),
  body('venue_contact_email').optional().isEmail().withMessage('Invalid email format'),
  body('venue_contact_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      customer_id, venue_name, venue_address, venue_city, venue_capacity, 
      venue_contact_person, venue_contact_email, venue_contact_phone, venue_status 
    } = req.body;
    const db = req.app.locals.db;

    // Check if customer exists
    const customer = await dbMethods.get(db, 'SELECT customer_id FROM master_customers WHERE customer_id = ?', [customer_id]);
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_venues (customer_id, venue_name, venue_address, venue_city, venue_capacity, venue_contact_person, venue_contact_email, venue_contact_phone, venue_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [customer_id, venue_name, venue_address, venue_city, venue_capacity, venue_contact_person, venue_contact_email, venue_contact_phone, venue_status || 'Active']
    );

    const newVenue = await dbMethods.get(db, 
      `SELECT v.*, c.customer_name 
       FROM rsvp_master_venues v 
       LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
       WHERE v.venue_id = ?`, 
      [result.lastID]
    );
    res.status(201).json(newVenue);
  } catch (error) {
    console.error('Error creating venue:', error);
    res.status(500).json({ error: 'Failed to create venue' });
  }
});

// PUT /api/venues/:id - Update venue
router.put('/:id', [
  authenticateToken,
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('venue_name').notEmpty().withMessage('Venue name is required'),
  body('venue_capacity').optional().isInt({ min: 1 }).withMessage('Venue capacity must be a positive integer'),
  body('venue_contact_email').optional().isEmail().withMessage('Invalid email format'),
  body('venue_contact_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      customer_id, venue_name, venue_address, venue_city, venue_capacity, 
      venue_contact_person, venue_contact_email, venue_contact_phone, venue_status 
    } = req.body;
    const db = req.app.locals.db;

    const existingVenue = await dbMethods.get(db, 'SELECT * FROM rsvp_master_venues WHERE venue_id = ?', [req.params.id]);
    if (!existingVenue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    // Check if customer exists
    const customer = await dbMethods.get(db, 'SELECT customer_id FROM master_customers WHERE customer_id = ?', [customer_id]);
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_venues SET customer_id = ?, venue_name = ?, venue_address = ?, venue_city = ?, venue_capacity = ?, venue_contact_person = ?, venue_contact_email = ?, venue_contact_phone = ?, venue_status = ?, updated_at = CURRENT_TIMESTAMP WHERE venue_id = ?',
      [customer_id, venue_name, venue_address, venue_city, venue_capacity, venue_contact_person, venue_contact_email, venue_contact_phone, venue_status, req.params.id]
    );

    const updatedVenue = await dbMethods.get(db, 
      `SELECT v.*, c.customer_name 
       FROM rsvp_master_venues v 
       LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
       WHERE v.venue_id = ?`, 
      [req.params.id]
    );
    res.json(updatedVenue);
  } catch (error) {
    console.error('Error updating venue:', error);
    res.status(500).json({ error: 'Failed to update venue' });
  }
});

// DELETE /api/venues/:id - Delete venue
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const existingVenue = await dbMethods.get(db, 'SELECT * FROM rsvp_master_venues WHERE venue_id = ?', [req.params.id]);
    if (!existingVenue) {
      return res.status(404).json({ error: 'Venue not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_venues WHERE venue_id = ?', [req.params.id]);
    res.json({ message: 'Venue deleted successfully' });
  } catch (error) {
    console.error('Error deleting venue:', error);
    res.status(500).json({ error: 'Failed to delete venue' });
  }
});

// GET /api/venues/:id/checklist - Get checklist for a venue
router.get('/:id/checklist', authenticateToken, async (req, res) => {
  try {
    // Placeholder implementation
    const checklist = [
      { id: 1, text: 'Lobby and entrance clean and welcoming', checked: false },
      { id: 2, text: 'Reception staff professional and friendly', checked: false },
      { id: 3, text: 'Public areas (lounges, bars) well-maintained', checked: false },
      { id: 4, text: 'Restrooms clean and well-stocked', checked: false },
      { id: 5, text: 'Event spaces clean and properly set up', checked: false },
      { id: 6, text: 'Audiovisual equipment functional', checked: false },
      { id: 7, text: 'Guest rooms clean and well-appointed', checked: false },
      { id: 8, text: 'Security measures in place', checked: false },
    ];
    res.json(checklist);
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ error: 'Failed to fetch checklist' });
  }
});

// POST /api/venues/:id/checklist - Update checklist for a venue
router.post('/:id/checklist', authenticateToken, async (req, res) => {
  try {
    const { checklist } = req.body;
    // Placeholder implementation - just log the data for now
    console.log(`Checklist for venue ${req.params.id} updated:`, checklist);
    res.json({ message: 'Checklist updated successfully' });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ error: 'Failed to update checklist' });
  }
});

module.exports = router;