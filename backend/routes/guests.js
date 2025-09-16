/**
 * Guest Management API Routes
 * CRUD operations for rsvp_master_guests table
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// GET /api/guests - Get all guests
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const guests = await dbMethods.all(db, 
      `SELECT g.*, c.client_name, e.event_name, s.subevent_name 
       FROM rsvp_master_guests g 
       LEFT JOIN rsvp_master_clients c ON g.client_id = c.client_id 
       LEFT JOIN rsvp_master_events e ON g.event_id = e.event_id 
       LEFT JOIN rsvp_master_subevents s ON g.subevent_id = s.subevent_id 
       ORDER BY g.created_at DESC`, 
      []
    );
    res.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

// GET /api/guests/:id - Get guest by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const guest = await dbMethods.get(db, 
      `SELECT g.*, c.client_name, e.event_name, s.subevent_name 
       FROM rsvp_master_guests g 
       LEFT JOIN rsvp_master_clients c ON g.client_id = c.client_id 
       LEFT JOIN rsvp_master_events e ON g.event_id = e.event_id 
       LEFT JOIN rsvp_master_subevents s ON g.subevent_id = s.subevent_id 
       WHERE g.guest_id = ?`, 
      [req.params.id]
    );
    
    if (!guest) {
      return res.status(404).json({ error: 'Guest not found' });
    }
    
    res.json(guest);
  } catch (error) {
    console.error('Error fetching guest:', error);
    res.status(500).json({ error: 'Failed to fetch guest' });
  }
});

// GET /api/guests/event/:eventId - Get guests by event ID
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const guests = await dbMethods.all(db, 
      `SELECT g.*, c.client_name, e.event_name, s.subevent_name 
       FROM rsvp_master_guests g 
       LEFT JOIN rsvp_master_clients c ON g.client_id = c.client_id 
       LEFT JOIN rsvp_master_events e ON g.event_id = e.event_id 
       LEFT JOIN rsvp_master_subevents s ON g.subevent_id = s.subevent_id 
       WHERE g.event_id = ? 
       ORDER BY g.created_at DESC`, 
      [req.params.eventId]
    );
    res.json(guests);
  } catch (error) {
    console.error('Error fetching guests for event:', error);
    res.status(500).json({ error: 'Failed to fetch guests for event' });
  }
});

// POST /api/guests - Create new guest
router.post('/', [
  authenticateToken,
  body('client_id').isInt().withMessage('Client ID is required and must be an integer'),
  body('event_id').isInt().withMessage('Event ID is required and must be an integer'),
  body('guest_first_name').notEmpty().withMessage('Guest first name is required'),
  body('guest_last_name').notEmpty().withMessage('Guest last name is required'),
  body('guest_email').optional().isEmail().withMessage('Invalid email format'),
  body('guest_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      client_id, event_id, subevent_id, guest_first_name, guest_last_name,
      guest_email, guest_phone, guest_status, guest_group_id,
      guest_type, guest_rsvp_status, guest_address, guest_city, guest_country,
      guest_dietary_preferences, guest_special_requirements, guest_notes
    } = req.body;
    const db = req.app.locals.db;

    // Check if client and event exist
    const client = await dbMethods.get(db, 'SELECT client_id FROM rsvp_master_clients WHERE client_id = ?', [client_id]);
    if (!client) {
      return res.status(400).json({ error: 'Client not found' });
    }

    const event = await dbMethods.get(db, 'SELECT event_id FROM rsvp_master_events WHERE event_id = ?', [event_id]);
    if (!event) {
      return res.status(400).json({ error: 'Event not found' });
    }

    // Create the guest record first
    const result = await dbMethods.run(db,
      'INSERT INTO rsvp_master_guests (client_id, event_id, subevent_id, guest_first_name, guest_last_name, guest_email, guest_phone, guest_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [client_id, event_id, subevent_id, guest_first_name, guest_last_name, guest_email, guest_phone, guest_status || 'Active']
    );

    const guestId = result.lastID;

    // If guest_group_id is provided, create the relationship
    if (guest_group_id) {
      await dbMethods.run(db,
        'INSERT INTO rsvp_guest_group_details (guest_group_id, guest_id, group_notes) VALUES (?, ?, ?)',
        [guest_group_id, guestId, `Auto-assigned to group on ${new Date().toISOString()}`]
      );
    }

    const newGuest = await dbMethods.get(db,
      `SELECT g.*, c.client_name, e.event_name, s.subevent_name
       FROM rsvp_master_guests g
       LEFT JOIN rsvp_master_clients c ON g.client_id = c.client_id
       LEFT JOIN rsvp_master_events e ON g.event_id = e.event_id
       LEFT JOIN rsvp_master_subevents s ON g.subevent_id = s.subevent_id
       WHERE g.guest_id = ?`,
      [guestId]
    );
    res.status(201).json(newGuest);
  } catch (error) {
    console.error('Error creating guest:', error);
    res.status(500).json({ error: 'Failed to create guest' });
  }
});

// PUT /api/guests/:id - Update guest
router.put('/:id', [
  authenticateToken,
  body('client_id').isInt().withMessage('Client ID is required and must be an integer'),
  body('event_id').isInt().withMessage('Event ID is required and must be an integer'),
  body('guest_first_name').notEmpty().withMessage('Guest first name is required'),
  body('guest_last_name').notEmpty().withMessage('Guest last name is required'),
  body('guest_email').optional().isEmail().withMessage('Invalid email format'),
  body('guest_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, event_id, subevent_id, guest_first_name, guest_last_name, guest_email, guest_phone, guest_status } = req.body;
    const db = req.app.locals.db;

    const existingGuest = await dbMethods.get(db, 'SELECT * FROM rsvp_master_guests WHERE guest_id = ?', [req.params.id]);
    if (!existingGuest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    // Check if client and event exist
    const client = await dbMethods.get(db, 'SELECT client_id FROM rsvp_master_clients WHERE client_id = ?', [client_id]);
    if (!client) {
      return res.status(400).json({ error: 'Client not found' });
    }

    const event = await dbMethods.get(db, 'SELECT event_id FROM rsvp_master_events WHERE event_id = ?', [event_id]);
    if (!event) {
      return res.status(400).json({ error: 'Event not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_guests SET client_id = ?, event_id = ?, subevent_id = ?, guest_first_name = ?, guest_last_name = ?, guest_email = ?, guest_phone = ?, guest_status = ?, updated_at = CURRENT_TIMESTAMP WHERE guest_id = ?',
      [client_id, event_id, subevent_id, guest_first_name, guest_last_name, guest_email, guest_phone, guest_status, req.params.id]
    );

    const updatedGuest = await dbMethods.get(db, 
      `SELECT g.*, c.client_name, e.event_name, s.subevent_name 
       FROM rsvp_master_guests g 
       LEFT JOIN rsvp_master_clients c ON g.client_id = c.client_id 
       LEFT JOIN rsvp_master_events e ON g.event_id = e.event_id 
       LEFT JOIN rsvp_master_subevents s ON g.subevent_id = s.subevent_id 
       WHERE g.guest_id = ?`, 
      [req.params.id]
    );
    res.json(updatedGuest);
  } catch (error) {
    console.error('Error updating guest:', error);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

// DELETE /api/guests/:id - Delete guest
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const existingGuest = await dbMethods.get(db, 'SELECT * FROM rsvp_master_guests WHERE guest_id = ?', [req.params.id]);
    if (!existingGuest) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_guests WHERE guest_id = ?', [req.params.id]);
    res.json({ message: 'Guest deleted successfully' });
  } catch (error) {
    console.error('Error deleting guest:', error);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

module.exports = router;