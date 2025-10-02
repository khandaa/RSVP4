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
    const { event_id } = req.query;
    let query = `SELECT g.*, c.client_name, e.event_name, s.subevent_name 
                 FROM rsvp_master_guests g 
                 LEFT JOIN rsvp_master_clients c ON g.client_id = c.client_id 
                 LEFT JOIN rsvp_master_events e ON g.event_id = e.event_id 
                 LEFT JOIN rsvp_master_subevents s ON g.subevent_id = s.subevent_id`;
    const params = [];

    if (event_id) {
      query += ' WHERE g.event_id = ?';
      params.push(event_id);
    }

    query += ' ORDER BY g.created_at DESC';

    const guests = await dbMethods.all(db, query, params);
    res.json(guests);
  } catch (error) {
    console.error('Error fetching guests:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

// GET /api/guests/template - Download CSV template for bulk import (must be before /:id route)
router.get('/template', authenticateToken, async (req, res) => {
  try {
    const csvHeaders = [
      'client_id',
      'event_id',
      'subevent_id',
      'guest_first_name',
      'guest_last_name',
      'guest_email',
      'guest_phone',
      'guest_status'
    ];

    const sampleData = [
      '1,1,,John,Doe,john.doe@example.com,+1234567890,Active',
      '1,1,,Jane,Smith,jane.smith@example.com,+1234567891,Active'
    ];

    const csvContent = [
      csvHeaders.join(','),
      ...sampleData
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=guest-import-template.csv');
    res.send(csvContent);

  } catch (error) {
    console.error('Error generating template:', error);
    res.status(500).json({ error: 'Failed to generate template' });
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

    const db = req.app.locals.db;
    let {
      client_id, event_id, subevent_id, guest_first_name, guest_last_name,
      guest_email, guest_phone, guest_status, guest_group_id, guest_group_name,
      guest_type, guest_rsvp_status, guest_address, guest_city, guest_country,
      guest_dietary_preferences, guest_special_requirements, guest_notes
    } = req.body;

    // If client_id is not provided, infer it from the event
    if (!client_id) {
      const eventDetails = await dbMethods.get(db, 'SELECT client_id FROM rsvp_master_events WHERE event_id = ?', [event_id]);
      if (eventDetails) {
        client_id = eventDetails.client_id;
      }
    }

    // Re-validate that we have a client_id now
    if (!client_id) {
      return res.status(400).json({ error: 'Could not determine client for the guest.' });
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

    // Create the guest record first
    const result = await dbMethods.run(db,
      'INSERT INTO rsvp_master_guests (client_id, event_id, subevent_id, guest_first_name, guest_last_name, guest_email, guest_phone, guest_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [client_id, event_id, subevent_id, guest_first_name, guest_last_name, guest_email, guest_phone, guest_status || 'Active']
    );

    const guestId = result.lastID;

    // Handle guest group assignment (either by ID or by name)
    let finalGroupId = guest_group_id;

    // If guest_group_name is provided, find or create the group
    if (guest_group_name && guest_group_name.trim()) {
      // First, try to find existing group by name
      let existingGroup = await dbMethods.get(db,
        'SELECT guest_group_id FROM rsvp_master_guest_groups WHERE group_name = ? AND client_id = ?',
        [guest_group_name.trim(), client_id]
      );

      if (!existingGroup) {
        // Create new group if it doesn't exist
        const groupResult = await dbMethods.run(db,
          'INSERT INTO rsvp_master_guest_groups (client_id, group_name, group_description) VALUES (?, ?, ?)',
          [client_id, guest_group_name.trim(), `Guest group created: ${guest_group_name.trim()}`]
        );
        finalGroupId = groupResult.lastID;
      } else {
        finalGroupId = existingGroup.guest_group_id;
      }
    }

    // If we have a group ID (either provided or created), create the relationship
    if (finalGroupId) {
      await dbMethods.run(db,
        'INSERT INTO rsvp_guest_group_details (guest_group_id, guest_id, group_notes) VALUES (?, ?, ?)',
        [finalGroupId, guestId, `Assigned to group on ${new Date().toISOString()}`]
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

    const { client_id, event_id, subevent_id, guest_first_name, guest_last_name, guest_email, guest_phone, guest_status, guest_group_name } = req.body;
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

    // Handle guest group update
    if (guest_group_name !== undefined) {
      // First, remove any existing group associations for this guest
      await dbMethods.run(db,
        'DELETE FROM rsvp_guest_group_details WHERE guest_id = ?',
        [req.params.id]
      );

      // If a group name is provided, find or create the group and associate it
      if (guest_group_name && guest_group_name.trim()) {
        let groupId = null;

        // Try to find existing group by name
        let existingGroup = await dbMethods.get(db,
          'SELECT guest_group_id FROM rsvp_master_guest_groups WHERE group_name = ? AND client_id = ?',
          [guest_group_name.trim(), client_id]
        );

        if (!existingGroup) {
          // Create new group if it doesn't exist
          const groupResult = await dbMethods.run(db,
            'INSERT INTO rsvp_master_guest_groups (client_id, group_name, group_description) VALUES (?, ?, ?)',
            [client_id, guest_group_name.trim(), `Guest group created: ${guest_group_name.trim()}`]
          );
          groupId = groupResult.lastID;
        } else {
          groupId = existingGroup.guest_group_id;
        }

        // Create the new association
        await dbMethods.run(db,
          'INSERT INTO rsvp_guest_group_details (guest_group_id, guest_id, group_notes) VALUES (?, ?, ?)',
          [groupId, req.params.id, `Updated group assignment on ${new Date().toISOString()}`]
        );
      }
    }

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

// POST /api/guests/bulk - Bulk import guests from CSV
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');

// Configure multer for CSV upload
const upload = multer({
  dest: path.join(__dirname, '../uploads/temp'),
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

router.post('/bulk', [authenticateToken, upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = req.app.locals.db;
    const results = [];
    const errors = [];
    let processed = 0;
    let successful = 0;

    // Parse CSV file
    const csvData = [];

    const mapHeaders = ({ header, index }) => header.toLowerCase().trim();

    await new Promise((resolve, reject) => {
      fs.createReadStream(req.file.path)
        .pipe(csv({ mapHeaders }))
        .on('data', (data) => csvData.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    for (let i = 0; i < csvData.length; i++) {
      const row = csvData[i];
      processed++;

      try {
        // Validate required fields
        if (!row.client_id || !row.event_id || !row.guest_first_name || !row.guest_last_name) {
          errors.push({
            row: i + 1,
            error: 'Missing required fields: client_id, event_id, guest_first_name, guest_last_name'
          });
          continue;
        }

        // Convert string IDs to integers
        const client_id = parseInt(row.client_id);
        const event_id = parseInt(row.event_id);
        const subevent_id = row.subevent_id ? parseInt(row.subevent_id) : null;

        // Validate client exists
        const client = await dbMethods.get(db, 'SELECT client_id FROM rsvp_master_clients WHERE client_id = ?', [client_id]);
        if (!client) {
          errors.push({
            row: i + 1,
            error: `Client ID ${client_id} not found`
          });
          continue;
        }

        // Validate event exists
        const event = await dbMethods.get(db, 'SELECT event_id FROM rsvp_master_events WHERE event_id = ?', [event_id]);
        if (!event) {
          errors.push({
            row: i + 1,
            error: `Event ID ${event_id} not found`
          });
          continue;
        }

        // Validate email format if provided
        if (row.guest_email && !row.guest_email.includes('@')) {
          errors.push({
            row: i + 1,
            error: 'Invalid email format'
          });
          continue;
        }

        // Check if guest already exists (by email or combination of name+event)
        let existingGuest = null;
        if (row.guest_email) {
          existingGuest = await dbMethods.get(db,
            'SELECT guest_id FROM rsvp_master_guests WHERE guest_email = ? AND event_id = ?',
            [row.guest_email, event_id]
          );
        }

        if (!existingGuest) {
          existingGuest = await dbMethods.get(db,
            'SELECT guest_id FROM rsvp_master_guests WHERE guest_first_name = ? AND guest_last_name = ? AND event_id = ?',
            [row.guest_first_name, row.guest_last_name, event_id]
          );
        }

        if (existingGuest) {
          errors.push({
            row: i + 1,
            error: 'Guest already exists in this event'
          });
          continue;
        }

        // Insert guest
        const result = await dbMethods.run(db,
          'INSERT INTO rsvp_master_guests (client_id, event_id, subevent_id, guest_first_name, guest_last_name, guest_email, guest_phone, guest_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            client_id,
            event_id,
            subevent_id,
            row.guest_first_name.trim(),
            row.guest_last_name.trim(),
            row.guest_email ? row.guest_email.trim() : null,
            row.guest_phone ? row.guest_phone.trim() : null,
            row.guest_status || 'Active'
          ]
        );

        const guestId = result.lastID;

        // Handle guest group
        if (row.guest_group && row.guest_group.trim()) {
          let groupId = null;
          const groupName = row.guest_group.trim();

          let existingGroup = await dbMethods.get(db,
            'SELECT guest_group_id FROM rsvp_master_guest_groups WHERE group_name = ? AND client_id = ?',
            [groupName, client_id]
          );

          if (existingGroup) {
            groupId = existingGroup.guest_group_id;
          } else {
            const groupResult = await dbMethods.run(db,
              'INSERT INTO rsvp_master_guest_groups (client_id, group_name) VALUES (?, ?)',
              [client_id, groupName]
            );
            groupId = groupResult.lastID;
          }

          await dbMethods.run(db,
            'INSERT INTO rsvp_guest_group_details (guest_group_id, guest_id) VALUES (?, ?)',
            [groupId, guestId]
          );
        }

        successful++;
        results.push({
          row: i + 1,
          guest_id: result.lastID,
          name: `${row.guest_first_name} ${row.guest_last_name}`,
          status: 'success'
        });

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errors.push({
          row: i + 1,
          error: error.message || 'Unknown error occurred'
        });
      }
    }

    // Clean up uploaded file
    try {
      fs.unlinkSync(req.file.path);
    } catch (cleanupError) {
      console.error('Error cleaning up file:', cleanupError);
    }

    res.json({
      message: 'Bulk import completed',
      total: processed,
      successful: successful,
      failed: errors.length,
      results: results,
      errors: errors
    });

  } catch (error) {
    console.error('Error in bulk import:', error);

    // Clean up uploaded file if it exists
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file:', cleanupError);
      }
    }

    res.status(500).json({ error: 'Failed to process bulk import' });
  }
});

module.exports = router;