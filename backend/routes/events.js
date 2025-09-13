/**
 * Event Management API Routes
 * CRUD operations for rsvp_master_events table
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// GET /api/events - Get all events
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const events = await dbMethods.all(db, 
      `SELECT e.*, c.client_name, et.event_type_name 
       FROM rsvp_master_events e 
       LEFT JOIN rsvp_master_clients c ON e.client_id = c.client_id 
       LEFT JOIN rsvp_master_event_types et ON e.event_type_id = et.event_type_id 
       ORDER BY e.created_at DESC`, 
      []
    );
    res.json(events);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const event = await dbMethods.get(db, 
      `SELECT e.*, c.client_name, et.event_type_name 
       FROM rsvp_master_events e 
       LEFT JOIN rsvp_master_clients c ON e.client_id = c.client_id 
       LEFT JOIN rsvp_master_event_types et ON e.event_type_id = et.event_type_id 
       WHERE e.event_id = ?`, 
      [req.params.id]
    );
    
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
});

// POST /api/events - Create new event
router.post('/', [
  authenticateToken,
  body('client_id').isInt().withMessage('Client ID is required and must be an integer'),
  body('event_name').notEmpty().withMessage('Event name is required'),
  body('event_start_date').optional().isISO8601().withMessage('Invalid start date format'),
  body('event_end_date').optional().isISO8601().withMessage('Invalid end date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, event_name, event_description, event_status, event_type_id, event_start_date, event_end_date } = req.body;
    const db = req.app.locals.db;

    // Check if client exists
    const client = await dbMethods.get(db, 'SELECT client_id FROM rsvp_master_clients WHERE client_id = ?', [client_id]);
    if (!client) {
      return res.status(400).json({ error: 'Client not found' });
    }

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_events (client_id, event_name, event_description, event_status, event_type_id, event_start_date, event_end_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [client_id, event_name, event_description, event_status || 'Planned', event_type_id, event_start_date, event_end_date]
    );

    const newEvent = await dbMethods.get(db, 
      `SELECT e.*, c.client_name, et.event_type_name 
       FROM rsvp_master_events e 
       LEFT JOIN rsvp_master_clients c ON e.client_id = c.client_id 
       LEFT JOIN rsvp_master_event_types et ON e.event_type_id = et.event_type_id 
       WHERE e.event_id = ?`, 
      [result.lastID]
    );
    res.status(201).json(newEvent);
  } catch (error) {
    console.error('Error creating event:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    // Handle database constraint errors
    if (error.code === 'SQLITE_CONSTRAINT') {
      if (error.message.includes('FOREIGN KEY constraint failed')) {
        return res.status(400).json({ 
          error: 'Database constraint error',
          details: 'The provided client_id or event_type_id does not exist',
          code: 'INVALID_REFERENCE'
        });
      }
      return res.status(400).json({ 
        error: 'Database constraint error',
        details: error.message,
        code: 'DATABASE_CONSTRAINT'
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to create event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      code: 'EVENT_CREATION_FAILED'
    });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', [
  authenticateToken,
  body('client_id').isInt().withMessage('Client ID is required and must be an integer'),
  body('event_name').notEmpty().withMessage('Event name is required'),
  body('event_start_date').optional().isISO8601().withMessage('Invalid start date format'),
  body('event_end_date').optional().isISO8601().withMessage('Invalid end date format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { client_id, event_name, event_description, event_status, event_type_id, event_start_date, event_end_date } = req.body;
    const db = req.app.locals.db;

    const existingEvent = await dbMethods.get(db, 'SELECT * FROM rsvp_master_events WHERE event_id = ?', [req.params.id]);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if client exists
    const client = await dbMethods.get(db, 'SELECT client_id FROM rsvp_master_clients WHERE client_id = ?', [client_id]);
    if (!client) {
      return res.status(400).json({ error: 'Client not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_events SET client_id = ?, event_name = ?, event_description = ?, event_status = ?, event_type_id = ?, event_start_date = ?, event_end_date = ?, updated_at = CURRENT_TIMESTAMP WHERE event_id = ?',
      [client_id, event_name, event_description, event_status, event_type_id, event_start_date, event_end_date, req.params.id]
    );

    const updatedEvent = await dbMethods.get(db, 
      `SELECT e.*, c.client_name, et.event_type_name 
       FROM rsvp_master_events e 
       LEFT JOIN rsvp_master_clients c ON e.client_id = c.client_id 
       LEFT JOIN rsvp_master_event_types et ON e.event_type_id = et.event_type_id 
       WHERE e.event_id = ?`, 
      [req.params.id]
    );
    res.json(updatedEvent);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const existingEvent = await dbMethods.get(db, 'SELECT * FROM rsvp_master_events WHERE event_id = ?', [req.params.id]);
    if (!existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_events WHERE event_id = ?', [req.params.id]);
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

module.exports = router;