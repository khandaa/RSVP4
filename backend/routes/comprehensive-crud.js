/**
 * Comprehensive CRUD API Routes
 * CRUD operations for remaining tables in the database
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// Helper function to create generic CRUD routes
const createCRUDRoutes = (tableName, primaryKey, requiredFields = [], joins = []) => {
  const routes = express.Router();

  // GET all records
  routes.get('/', authenticateToken, async (req, res) => {
    try {
      const db = req.app.locals.db;
      let query = `SELECT * FROM ${tableName}`;
      
      if (joins.length > 0) {
        query = joins.join(' ');
      }
      
      query += ' ORDER BY created_at DESC';
      
      const records = await dbMethods.all(db, query, []);
      res.json(records);
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      res.status(500).json({ error: `Failed to fetch ${tableName}` });
    }
  });

  // GET single record by ID
  routes.get('/:id', authenticateToken, async (req, res) => {
    try {
      const db = req.app.locals.db;
      let query = `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`;
      
      if (joins.length > 0) {
        query = joins.join(' ') + ` WHERE ${tableName}.${primaryKey} = ?`;
      }
      
      const record = await dbMethods.get(db, query, [req.params.id]);
      
      if (!record) {
        return res.status(404).json({ error: `${tableName} record not found` });
      }
      
      res.json(record);
    } catch (error) {
      console.error(`Error fetching ${tableName} record:`, error);
      res.status(500).json({ error: `Failed to fetch ${tableName} record` });
    }
  });

  // POST new record
  routes.post('/', authenticateToken, async (req, res) => {
    try {
      const db = req.app.locals.db;
      const fields = Object.keys(req.body).filter(key => key !== primaryKey);
      const values = fields.map(field => req.body[field]);
      const placeholders = fields.map(() => '?').join(', ');
      
      const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
      const result = await dbMethods.run(db, query, values);
      
      const newRecord = await dbMethods.get(db, `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`, [result.lastID]);
      res.status(201).json(newRecord);
    } catch (error) {
      console.error(`Error creating ${tableName} record:`, error);
      res.status(500).json({ error: `Failed to create ${tableName} record` });
    }
  });

  // PUT update record
  routes.put('/:id', authenticateToken, async (req, res) => {
    try {
      const db = req.app.locals.db;
      
      const existing = await dbMethods.get(db, `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`, [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: `${tableName} record not found` });
      }

      const fields = Object.keys(req.body).filter(key => key !== primaryKey);
      const values = fields.map(field => req.body[field]);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      let query = `UPDATE ${tableName} SET ${setClause}`;
      if (fields.includes('updated_at') || tableName.includes('master') || tableName.includes('rsvp_')) {
        query += ', updated_at = CURRENT_TIMESTAMP';
      }
      query += ` WHERE ${primaryKey} = ?`;
      
      await dbMethods.run(db, query, [...values, req.params.id]);
      
      const updated = await dbMethods.get(db, `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`, [req.params.id]);
      res.json(updated);
    } catch (error) {
      console.error(`Error updating ${tableName} record:`, error);
      res.status(500).json({ error: `Failed to update ${tableName} record` });
    }
  });

  // DELETE record
  routes.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const db = req.app.locals.db;
      
      const existing = await dbMethods.get(db, `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`, [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: `${tableName} record not found` });
      }

      await dbMethods.run(db, `DELETE FROM ${tableName} WHERE ${primaryKey} = ?`, [req.params.id]);
      res.json({ message: `${tableName} record deleted successfully` });
    } catch (error) {
      console.error(`Error deleting ${tableName} record:`, error);
      res.status(500).json({ error: `Failed to delete ${tableName} record` });
    }
  });

  return routes;
};

// ========================= USER MANAGEMENT TABLES =========================
router.use('/users', createCRUDRoutes('users_master', 'user_id'));
router.use('/roles', createCRUDRoutes('roles_master', 'role_id'));
router.use('/permissions', createCRUDRoutes('permissions_master', 'permission_id'));
router.use('/user-roles', createCRUDRoutes('user_roles_tx', 'user_role_id'));
router.use('/role-permissions', createCRUDRoutes('role_permissions_tx', 'role_permission_id'));
router.use('/activity-logs', createCRUDRoutes('activity_logs_tx', 'activity_log_id'));

// ========================= RSVP MASTER TABLES =========================
router.use('/subevents', createCRUDRoutes('rsvp_master_subevents', 'subevent_id'));
router.use('/guest-groups', createCRUDRoutes('rsvp_master_guest_groups', 'guest_group_id'));
router.use('/vendors', createCRUDRoutes('rsvp_master_vendors', 'vendor_id'));
router.use('/rooms', createCRUDRoutes('rsvp_master_rooms', 'room_id'));
router.use('/roles-master', createCRUDRoutes('rsvp_master_roles', 'role_id'));
router.use('/notifications', createCRUDRoutes('rsvp_master_notifications', 'notification_id'));

// ========================= DETAIL TABLES =========================
router.use('/client-details', createCRUDRoutes('rsvp_client_details', 'client_detail_id'));
router.use('/event-details', createCRUDRoutes('rsvp_event_details', 'event_detail_id'));
router.use('/event-documents', createCRUDRoutes('rsvp_event_documents', 'document_id'));
router.use('/subevent-details', createCRUDRoutes('rsvp_subevents_details', 'subevent_detail_id'));
router.use('/guest-details', createCRUDRoutes('rsvp_guest_details', 'guest_detail_id'));
router.use('/guest-documents', createCRUDRoutes('rsvp_guest_documents', 'document_id'));
router.use('/vendor-details', createCRUDRoutes('rsvp_vendor_details', 'vendor_detail_id'));
router.use('/venue-details', createCRUDRoutes('rsvp_venue_details', 'venue_detail_id'));
router.use('/employee-details', createCRUDRoutes('rsvp_employee_details', 'employee_detail_id'));
router.use('/team-details', createCRUDRoutes('rsvp_team_details', 'team_detail_id'));

// ========================= ALLOCATION TABLES =========================
router.use('/guest-event-allocation', createCRUDRoutes('rsvp_guest_event_allocation', 'allocation_id'));
router.use('/guest-group-details', createCRUDRoutes('rsvp_guest_group_details', 'group_detail_id'));
router.use('/guest-travel', createCRUDRoutes('rsvp_guest_travel', 'travel_id'));
router.use('/guest-accommodation', createCRUDRoutes('rsvp_guest_accommodation', 'guest_accommodation_id'));
router.use('/guest-vehicle-allocation', createCRUDRoutes('rsvp_guest_vehicle_allocation', 'vehicle_allocation_id'));
router.use('/vendor-event-allocation', createCRUDRoutes('rsvp_vendor_event_allocation', 'event_vendor_allocation_id'));
router.use('/venue-event-allocation', createCRUDRoutes('rsvp_venue_event_allocation', 'venue_event_allocation_id'));
router.use('/event-room-allocation', createCRUDRoutes('rsvp_event_room_allocation', 'event_room_allocation_id'));
router.use('/team-event-allocation', createCRUDRoutes('rsvp_team_event_allocation', 'team_event_allocation_id'));
router.use('/employee-role-allocation', createCRUDRoutes('rsvp_employee_role_allocation', 'employee_role_allocation_id'));
router.use('/employee-team-allocation', createCRUDRoutes('rsvp_employee_team_allocation', 'employee_team_allocation_id'));

// ========================= COMMUNICATION & RSVP TABLES =========================
router.use('/guest-communication', createCRUDRoutes('rsvp_guest_communication', 'communication_id'));
router.use('/guest-rsvp', createCRUDRoutes('rsvp_guest_rsvp', 'rsvp_id'));
router.use('/notification-templates', createCRUDRoutes('rsvp_notification_templates', 'notification_template_id'));

// ========================= TASK MANAGEMENT TABLES =========================
router.use('/task-assignment-details', createCRUDRoutes('rsvp_task_assignment_details', 'task_detail_id'));
router.use('/task-event-subevent-mapping', createCRUDRoutes('rsvp_task_event_subevent_mapping', 'task_event_subevent_id'));

// ========================= MEETING NOTES =========================
router.use('/client-meeting-notes', createCRUDRoutes('rsvp_client_meeting_notes', 'meeting_note_id'));

// ========================= ADDITIONAL SPECIALIZED ENDPOINTS =========================

// Get guests by event with RSVP status
router.get('/guests-with-rsvp/:eventId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT g.*, r.rsvp_status, r.rsvp_date, r.notes as rsvp_notes
      FROM rsvp_master_guests g
      LEFT JOIN rsvp_guest_rsvp r ON g.guest_id = r.guest_id AND g.event_id = r.event_id
      WHERE g.event_id = ?
      ORDER BY g.guest_last_name, g.guest_first_name
    `;
    const guests = await dbMethods.all(db, query, [req.params.eventId]);
    res.json(guests);
  } catch (error) {
    console.error('Error fetching guests with RSVP:', error);
    res.status(500).json({ error: 'Failed to fetch guests with RSVP' });
  }
});

// Get event schedule with subevents and allocations
router.get('/event-schedule/:eventId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT 
        s.subevent_id,
        s.subevent_name,
        s.subevent_description,
        s.subevent_start_datetime,
        s.subevent_end_datetime,
        s.subevent_status,
        v.venue_name,
        r.room_name,
        COUNT(g.guest_id) as guest_count
      FROM rsvp_master_subevents s
      LEFT JOIN rsvp_subevents_details sd ON s.subevent_id = sd.subevent_id
      LEFT JOIN rsvp_master_venues v ON sd.venue_id = v.venue_id
      LEFT JOIN rsvp_event_room_allocation era ON s.subevent_id = era.subevent_id
      LEFT JOIN rsvp_master_rooms r ON era.room_id = r.room_id
      LEFT JOIN rsvp_master_guests g ON s.subevent_id = g.subevent_id
      WHERE s.event_id = ?
      GROUP BY s.subevent_id
      ORDER BY s.subevent_start_datetime
    `;
    const schedule = await dbMethods.all(db, query, [req.params.eventId]);
    res.json(schedule);
  } catch (error) {
    console.error('Error fetching event schedule:', error);
    res.status(500).json({ error: 'Failed to fetch event schedule' });
  }
});

// Get venue availability
router.get('/venue-availability/:venueId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const { start_date, end_date } = req.query;
    
    const query = `
      SELECT 
        vea.venue_event_allocation_id,
        vea.booking_start_date,
        vea.booking_end_date,
        vea.booking_status,
        e.event_name,
        c.client_name
      FROM rsvp_venue_event_allocation vea
      JOIN rsvp_master_events e ON vea.event_id = e.event_id
      JOIN rsvp_master_clients c ON e.client_id = c.client_id
      WHERE vea.venue_id = ?
      AND (
        (vea.booking_start_date BETWEEN ? AND ?) OR
        (vea.booking_end_date BETWEEN ? AND ?) OR
        (vea.booking_start_date <= ? AND vea.booking_end_date >= ?)
      )
      ORDER BY vea.booking_start_date
    `;
    
    const bookings = await dbMethods.all(db, query, [
      req.params.venueId, 
      start_date, end_date, 
      start_date, end_date, 
      start_date, end_date
    ]);
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching venue availability:', error);
    res.status(500).json({ error: 'Failed to fetch venue availability' });
  }
});

router.get('/users/profile', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const user = await dbMethods.get(db, 'SELECT * FROM users_master WHERE user_id = ?', [req.user.id]);

    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;