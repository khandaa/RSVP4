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
    const db = req.app.locals.db;
    await dbMethods.beginTransaction(db);
    try {
      let newRecord;
      if (tableName === 'roles_master') {
        const { permission_ids, ...roleData } = req.body;
        const fields = Object.keys(roleData);
        const values = fields.map(field => roleData[field]);
        const placeholders = fields.map(() => '?').join(', ');

        const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await dbMethods.run(db, query, values);
        const newRoleId = result.lastID;

        if (permission_ids && permission_ids.length > 0) {
          for (const permissionId of permission_ids) {
            await dbMethods.run(db, 'INSERT INTO role_permissions_tx (role_id, permission_id) VALUES (?, ?)', [newRoleId, permissionId]);
          }
        }
        newRecord = await dbMethods.get(db, `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`, [newRoleId]);
      } else {
        const fields = Object.keys(req.body).filter(key => key !== primaryKey);
        const values = fields.map(field => req.body[field]);
        const placeholders = fields.map(() => '?').join(', ');
        
        const query = `INSERT INTO ${tableName} (${fields.join(', ')}) VALUES (${placeholders})`;
        const result = await dbMethods.run(db, query, values);
        
        newRecord = await dbMethods.get(db, `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`, [result.lastID]);
      }
      await dbMethods.commit(db);
      res.status(201).json(newRecord);
    } catch (error) {
      await dbMethods.rollback(db);
      console.error(`Error creating ${tableName} record:`, error);
      console.error(`Query was: INSERT INTO ${tableName} (${Object.keys(req.body).filter(key => key !== primaryKey).join(', ')}) VALUES (${Object.keys(req.body).filter(key => key !== primaryKey).map(() => '?').join(', ')})`);
      console.error(`Values were:`, Object.keys(req.body).filter(key => key !== primaryKey).map(field => req.body[field]));
      res.status(500).json({
        error: `Failed to create ${tableName} record`,
        details: error.message,
        sql_error: error.code
      });
    }
  });

  // PUT update record
  routes.put('/:id', authenticateToken, async (req, res) => {
    const db = req.app.locals.db;
    let transaction;
    
    try {
      transaction = await dbMethods.beginTransaction(db);
      
      const existing = await dbMethods.get(db, `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`, [req.params.id]);
      if (!existing) {
        return res.status(404).json({ error: `${tableName} record not found` });
      }

      // Handle special case for users_master to manage roles
      if (tableName === 'users_master' && req.body.roles) {
        // Remove existing roles
        await dbMethods.run(db, 'DELETE FROM user_roles_tx WHERE user_id = ?', [req.params.id]);
        
        // Add new roles
        const roles = Array.isArray(req.body.roles) ? req.body.roles : [req.body.roles];
        for (const roleId of roles) {
          await dbMethods.run(
            db, 
            'INSERT INTO user_roles_tx (user_id, role_id) VALUES (?, ?)',
            [req.params.id, roleId]
          );
        }
      }

      // Filter out roles from the update fields as they're handled separately
      const updateFields = Object.keys(req.body).filter(key => 
        key !== primaryKey && key !== 'roles' && key !== 'password'
      );
      
      // Handle password update if provided
      if (req.body.password) {
        const bcrypt = require('bcryptjs');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(req.body.password, salt);
        
        updateFields.push('password_hash');
        req.body.password_hash = hashedPassword;
      }
      
      if (updateFields.length > 0) {
        const values = updateFields.map(field => req.body[field]);
        const setClause = updateFields.map(field => `${field} = ?`).join(', ');
        
        let query = `UPDATE ${tableName} SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
                    WHERE ${primaryKey} = ?`;
        
        await dbMethods.run(db, query, [...values, req.params.id]);
      }
      
      if (transaction) {
        await dbMethods.commit(db);
      }
      
      // Fetch the updated record with roles if this is a user
      let updatedRecord = await dbMethods.get(db, `SELECT * FROM ${tableName} WHERE ${primaryKey} = ?`, [req.params.id]);
      
      if (tableName === 'users_master') {
        const roles = await dbMethods.all(
          db,
          'SELECT r.role_id, r.name FROM roles_master r ' +
          'JOIN user_roles_tx ur ON r.role_id = ur.role_id ' +
          'WHERE ur.user_id = ?',
          [req.params.id]
        );
        updatedRecord.roles = roles.map(r => r.role_id);
      }
      
      res.json(updatedRecord);
    } catch (error) {
      if (transaction) {
        await dbMethods.rollback(db);
      }
      console.error(`Error updating ${tableName} record:`, error);
      res.status(500).json({ 
        error: `Failed to update ${tableName} record`,
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
// Custom user routes to handle role assignments
const userRoutes = express.Router();

// Create user with role assignments
userRoutes.post('/', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  const transaction = await dbMethods.beginTransaction(db);
  
  try {
    const { roles, ...userData } = req.body;
    
    // Hash password if provided
    if (userData.password) {
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      userData.password_hash = await bcrypt.hash(userData.password, 10);
      delete userData.password;
    }
    
    // Insert user
    const fields = Object.keys(userData);
    const values = fields.map(field => userData[field]);
    const placeholders = fields.map(() => '?').join(', ');
    
    const result = await dbMethods.run(
      db, 
      `INSERT INTO users_master (${fields.join(', ')}) VALUES (${placeholders})`,
      values
    );
    
    const userId = result.lastID;
    
    // Assign roles if provided
    if (roles && roles.length > 0) {
      for (const roleId of roles) {
        await dbMethods.run(
          db,
          'INSERT INTO user_roles_tx (user_id, role_id) VALUES (?, ?)',
          [userId, roleId]
        );
      }
    }
    
    // Get the created user with roles
    const user = await dbMethods.get(
      db,
      'SELECT * FROM users_master WHERE user_id = ?',
      [userId]
    );
    
    const userRoles = await dbMethods.all(
      db,
      'SELECT role_id FROM user_roles_tx WHERE user_id = ?',
      [userId]
    );
    
    await dbMethods.commit(db);
    
    res.status(201).json({
      ...user,
      roles: userRoles.map(r => r.role_id)
    });
    
  } catch (error) {
    await dbMethods.rollback(db);
    console.error('Error creating user:', error);
    res.status(500).json({ 
      error: 'Failed to create user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user with role assignments
userRoutes.put('/:id', authenticateToken, async (req, res) => {
  const db = req.app.locals.db;
  const transaction = await dbMethods.beginTransaction(db);
  
  try {
    const userId = req.params.id;
    const { roles, ...updateData } = req.body;
    
    // Hash password if provided
    if (updateData.password) {
      const bcrypt = require('bcryptjs');
      updateData.password_hash = await bcrypt.hash(updateData.password, 10);
      delete updateData.password;
    }
    
    // Update user data if there are fields to update
    if (Object.keys(updateData).length > 0) {
      const fields = Object.keys(updateData);
      const values = fields.map(field => updateData[field]);
      const setClause = fields.map(field => `${field} = ?`).join(', ');
      
      await dbMethods.run(
        db,
        `UPDATE users_master SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`,
        [...values, userId]
      );
    }
    
    // Update roles if provided
    if (roles) {
      // Remove existing roles
      await dbMethods.run(
        db,
        'DELETE FROM user_roles_tx WHERE user_id = ?',
        [userId]
      );
      
      // Add new roles
      for (const roleId of roles) {
        await dbMethods.run(
          db,
          'INSERT INTO user_roles_tx (user_id, role_id) VALUES (?, ?)',
          [userId, roleId]
        );
      }
    }
    
    // Get the updated user with roles
    const user = await dbMethods.get(
      db,
      'SELECT * FROM users_master WHERE user_id = ?',
      [userId]
    );
    
    const userRoles = await dbMethods.all(
      db,
      'SELECT role_id FROM user_roles_tx WHERE user_id = ?',
      [userId]
    );
    
    await dbMethods.commit(db);
    
    res.json({
      ...user,
      roles: userRoles.map(r => r.role_id)
    });
    
  } catch (error) {
    await dbMethods.rollback(db);
    console.error('Error updating user:', error);
    res.status(500).json({ 
      error: 'Failed to update user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get user with roles
userRoutes.get('/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.params.id;
    
    const user = await dbMethods.get(
      db,
      'SELECT * FROM users_master WHERE user_id = ?',
      [userId]
    );
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const roles = await dbMethods.all(
      db,
      'SELECT role_id FROM user_roles_tx WHERE user_id = ?',
      [userId]
    );
    
    res.json({
      ...user,
      roles: roles.map(r => r.role_id)
    });
    
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Get all users with their roles
userRoutes.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    const users = await dbMethods.all(
      db,
      'SELECT * FROM users_master ORDER BY created_at DESC'
    );
    
    // Get roles for each user
    const usersWithRoles = await Promise.all(users.map(async (user) => {
      const roles = await dbMethods.all(
        db,
        'SELECT r.role_id, r.name FROM roles_master r ' +
        'JOIN user_roles_tx ur ON r.role_id = ur.role_id ' +
        'WHERE ur.user_id = ?',
        [user.user_id]
      );
      
      return {
        ...user,
        roles: roles.map(r => r.role_id)
      };
    }));
    
    res.json(usersWithRoles);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Mount the user routes
router.use('/users', userRoutes);
router.use('/roles', createCRUDRoutes('roles_master', 'role_id'));
router.use('/permissions', createCRUDRoutes('permissions_master', 'permission_id'));
router.use('/user-roles', createCRUDRoutes('user_roles_tx', 'user_role_id'));
router.use('/role-permissions', createCRUDRoutes('role_permissions_tx', 'role_permission_id'));
router.use('/activity-logs', createCRUDRoutes('activity_logs_tx', 'activity_log_id'));

// ========================= RSVP MASTER TABLES =========================
router.use('/subevents', createCRUDRoutes('rsvp_master_subevents', 'subevent_id'));
// Custom endpoint for guest groups with member count
router.get('/guest-groups', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT
        g.*,
        COUNT(gd.guest_id) as member_count
      FROM rsvp_master_guest_groups g
      LEFT JOIN rsvp_guest_group_details gd ON g.guest_group_id = gd.guest_group_id
      GROUP BY g.guest_group_id
      ORDER BY g.created_at DESC
    `;
    const groups = await dbMethods.all(db, query, []);
    res.json(groups);
  } catch (error) {
    console.error('Error fetching guest groups with member count:', error);
    res.status(500).json({ error: 'Failed to fetch guest groups' });
  }
});

// Regular CRUD operations for guest groups (POST, PUT, DELETE)
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

// ========================= INVITE MANAGEMENT TABLES =========================
router.use('/invites', createCRUDRoutes('rsvp_master_invites', 'invite_id'));
router.use('/invite-versions', createCRUDRoutes('rsvp_invite_versions', 'invite_version_id'));
router.use('/invite-distributions', createCRUDRoutes('rsvp_invite_distributions', 'distribution_id'));
router.use('/invite-analytics', createCRUDRoutes('rsvp_invite_analytics', 'analytics_id'));

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

// Get current user profile
router.get('/users/profile', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const userId = req.user.id;
    
    // Get user details with customer information
    const query = `
      SELECT 
        um.user_id,
        um.email,
        um.first_name,
        um.last_name,
        um.mobile_number,
        um.is_active,
        mc.customer_id,
        mc.customer_name,
        mc.customer_email
      FROM users_master um
      LEFT JOIN master_customers mc ON um.email = mc.customer_email
      WHERE um.user_id = ?
    `;
    
    const user = await dbMethods.get(db, query, [userId]);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get user roles
    const rolesQuery = `
      SELECT r.name as role_name
      FROM user_roles_tx ur
      JOIN roles_master r ON ur.role_id = r.role_id
      WHERE ur.user_id = ?
    `;
    const roles = await dbMethods.all(db, rolesQuery, [userId]);
    
    res.json({
      ...user,
      roles: roles.map(r => r.role_name)
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Get event schedule with subevents and allocations
router.get('/event-schedule/:eventId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    
    // Handle special case for 'all' to get all subevents
    if (req.params.eventId === 'all') {
      const query = `
        SELECT
          s.subevent_id,
          s.subevent_name,
          s.subevent_description,
          s.subevent_start_datetime,
          s.subevent_end_datetime,
          s.subevent_status,
          s.event_id,
          e.event_name,
          v.venue_name,
          r.room_name,
          r.room_capacity as capacity
        FROM rsvp_master_subevents s
        LEFT JOIN rsvp_master_events e ON s.event_id = e.event_id
        LEFT JOIN rsvp_event_room_allocation era ON s.subevent_id = era.subevent_id
        LEFT JOIN rsvp_master_rooms r ON era.room_id = r.room_id
        LEFT JOIN rsvp_master_venues v ON r.venue_id = v.venue_id
        ORDER BY s.subevent_start_datetime
      `;
      
      const allSubevents = await dbMethods.all(db, query, []);
      return res.json({ data: allSubevents || [] });
    }
    
    // First check if event exists
    const event = await dbMethods.get(db, 'SELECT * FROM rsvp_master_events WHERE event_id = ?', [req.params.eventId]);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get subevents for this event with additional details
    const query = `
      SELECT
        s.subevent_id,
        s.subevent_name,
        s.subevent_description,
        s.subevent_start_datetime,
        s.subevent_end_datetime,
        s.subevent_status,
        s.event_id,
        e.event_name,
        v.venue_name,
        r.room_name,
        r.room_capacity as capacity,
        COUNT(gea.guest_id) as guest_count
      FROM rsvp_master_subevents s
      LEFT JOIN rsvp_master_events e ON s.event_id = e.event_id
      LEFT JOIN rsvp_event_room_allocation era ON s.subevent_id = era.subevent_id
      LEFT JOIN rsvp_master_rooms r ON era.room_id = r.room_id
      LEFT JOIN rsvp_master_venues v ON r.venue_id = v.venue_id
      LEFT JOIN rsvp_guest_event_allocation gea ON s.subevent_id = gea.subevent_id
      WHERE s.event_id = ?
      GROUP BY s.subevent_id
      ORDER BY s.subevent_start_datetime
    `;
    
    const schedule = await dbMethods.all(db, query, [req.params.eventId]);
    
    // Return data in consistent format
    res.json({ data: schedule || [] });
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


module.exports = router;