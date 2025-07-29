/**
 * Master Data API Routes
 * CRUD operations for various master tables
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkPermissions } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// ========================= EVENT TYPES =========================
// GET /api/master-data/event-types
router.get('/event-types', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const eventTypes = await dbMethods.all(db, 'SELECT * FROM rsvp_master_event_types ORDER BY event_type_name', []);
    res.json(eventTypes);
  } catch (error) {
    console.error('Error fetching event types:', error);
    res.status(500).json({ error: 'Failed to fetch event types' });
  }
});

// POST /api/master-data/event-types
router.post('/event-types', [
  authenticateToken,
  body('event_type_name').notEmpty().withMessage('Event type name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event_type_name, event_type_description } = req.body;
    const db = req.app.locals.db;

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_event_types (event_type_name, event_type_description) VALUES (?, ?)',
      [event_type_name, event_type_description]
    );

    const newEventType = await dbMethods.get(db, 'SELECT * FROM rsvp_master_event_types WHERE event_type_id = ?', [result.lastID]);
    res.status(201).json(newEventType);
  } catch (error) {
    console.error('Error creating event type:', error);
    res.status(500).json({ error: 'Failed to create event type' });
  }
});

// PUT /api/master-data/event-types/:id
router.put('/event-types/:id', [
  authenticateToken,
  body('event_type_name').notEmpty().withMessage('Event type name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { event_type_name, event_type_description } = req.body;
    const db = req.app.locals.db;

    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_event_types WHERE event_type_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_event_types SET event_type_name = ?, event_type_description = ?, updated_at = CURRENT_TIMESTAMP WHERE event_type_id = ?',
      [event_type_name, event_type_description, req.params.id]
    );

    const updated = await dbMethods.get(db, 'SELECT * FROM rsvp_master_event_types WHERE event_type_id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating event type:', error);
    res.status(500).json({ error: 'Failed to update event type' });
  }
});

// DELETE /api/master-data/event-types/:id
router.delete('/event-types/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_event_types WHERE event_type_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Event type not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_event_types WHERE event_type_id = ?', [req.params.id]);
    res.json({ message: 'Event type deleted successfully' });
  } catch (error) {
    console.error('Error deleting event type:', error);
    res.status(500).json({ error: 'Failed to delete event type' });
  }
});

// ========================= TASKS =========================
// GET /api/master-data/tasks
router.get('/tasks', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const tasks = await dbMethods.all(db, 'SELECT * FROM rsvp_master_tasks ORDER BY task_name', []);
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// POST /api/master-data/tasks
router.post('/tasks', [
  authenticateToken,
  body('task_name').notEmpty().withMessage('Task name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { task_name, task_description, task_priority } = req.body;
    const db = req.app.locals.db;

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_tasks (task_name, task_description, task_priority) VALUES (?, ?, ?)',
      [task_name, task_description, task_priority || 'Medium']
    );

    const newTask = await dbMethods.get(db, 'SELECT * FROM rsvp_master_tasks WHERE task_id = ?', [result.lastID]);
    res.status(201).json(newTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/master-data/tasks/:id
router.put('/tasks/:id', [
  authenticateToken,
  body('task_name').notEmpty().withMessage('Task name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { task_name, task_description, task_priority } = req.body;
    const db = req.app.locals.db;

    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_tasks WHERE task_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_tasks SET task_name = ?, task_description = ?, task_priority = ?, updated_at = CURRENT_TIMESTAMP WHERE task_id = ?',
      [task_name, task_description, task_priority, req.params.id]
    );

    const updated = await dbMethods.get(db, 'SELECT * FROM rsvp_master_tasks WHERE task_id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/master-data/tasks/:id
router.delete('/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_tasks WHERE task_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_tasks WHERE task_id = ?', [req.params.id]);
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// ========================= NOTIFICATION TYPES =========================
// GET /api/master-data/notification-types
router.get('/notification-types', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const notificationTypes = await dbMethods.all(db, 'SELECT * FROM rsvp_master_notification_types ORDER BY notification_type_name', []);
    res.json(notificationTypes);
  } catch (error) {
    console.error('Error fetching notification types:', error);
    res.status(500).json({ error: 'Failed to fetch notification types' });
  }
});

// POST /api/master-data/notification-types
router.post('/notification-types', [
  authenticateToken,
  body('notification_type_name').notEmpty().withMessage('Notification type name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      notification_type_name, 
      notification_type_description, 
      notification_medium, 
      notification_sending_identifier_name, 
      notification_sending_identifier_value 
    } = req.body;
    const db = req.app.locals.db;

    const result = await dbMethods.run(db, 
      'INSERT INTO rsvp_master_notification_types (notification_type_name, notification_type_description, notification_medium, notification_sending_identifier_name, notification_sending_identifier_value) VALUES (?, ?, ?, ?, ?)',
      [notification_type_name, notification_type_description, notification_medium, notification_sending_identifier_name, notification_sending_identifier_value]
    );

    const newNotificationType = await dbMethods.get(db, 'SELECT * FROM rsvp_master_notification_types WHERE notification_type_id = ?', [result.lastID]);
    res.status(201).json(newNotificationType);
  } catch (error) {
    console.error('Error creating notification type:', error);
    res.status(500).json({ error: 'Failed to create notification type' });
  }
});

// PUT /api/master-data/notification-types/:id
router.put('/notification-types/:id', [
  authenticateToken,
  body('notification_type_name').notEmpty().withMessage('Notification type name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      notification_type_name, 
      notification_type_description, 
      notification_medium, 
      notification_sending_identifier_name, 
      notification_sending_identifier_value 
    } = req.body;
    const db = req.app.locals.db;

    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_notification_types WHERE notification_type_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Notification type not found' });
    }

    await dbMethods.run(db,
      'UPDATE rsvp_master_notification_types SET notification_type_name = ?, notification_type_description = ?, notification_medium = ?, notification_sending_identifier_name = ?, notification_sending_identifier_value = ?, updated_at = CURRENT_TIMESTAMP WHERE notification_type_id = ?',
      [notification_type_name, notification_type_description, notification_medium, notification_sending_identifier_name, notification_sending_identifier_value, req.params.id]
    );

    const updated = await dbMethods.get(db, 'SELECT * FROM rsvp_master_notification_types WHERE notification_type_id = ?', [req.params.id]);
    res.json(updated);
  } catch (error) {
    console.error('Error updating notification type:', error);
    res.status(500).json({ error: 'Failed to update notification type' });
  }
});

// DELETE /api/master-data/notification-types/:id
router.delete('/notification-types/:id', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const existing = await dbMethods.get(db, 'SELECT * FROM rsvp_master_notification_types WHERE notification_type_id = ?', [req.params.id]);
    if (!existing) {
      return res.status(404).json({ error: 'Notification type not found' });
    }

    await dbMethods.run(db, 'DELETE FROM rsvp_master_notification_types WHERE notification_type_id = ?', [req.params.id]);
    res.json({ message: 'Notification type deleted successfully' });
  } catch (error) {
    console.error('Error deleting notification type:', error);
    res.status(500).json({ error: 'Failed to delete notification type' });
  }
});

module.exports = router;