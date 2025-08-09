/**
 * Vendor Management API Routes
 * CRUD operations for vendor management tables
 */

const express = require('express');
const router = express.Router();
const { body, param, query, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { checkRoles } = require('../../middleware/rbac');
const { dbMethods } = require('../../modules/database/backend');

// Middleware to restrict access to admin and customer_admin roles
const restrictToAdminAndCustomerAdmin = [
  authenticateToken,
  checkRoles(['admin', 'Admin', 'full_access', 'customer_admin'])
];

// GET /api/vendors - Get all vendors
router.get('/', restrictToAdminAndCustomerAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    let query = `
      SELECT v.*, c.customer_name 
      FROM rsvp_master_vendors v 
      LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
    `;
    
    // Apply filters if provided
    const params = [];
    if (req.query.customer_id) {
      query += ' WHERE v.customer_id = ?';
      params.push(req.query.customer_id);
    }
    
    if (req.query.vendor_type) {
      query += params.length ? ' AND v.vendor_type = ?' : ' WHERE v.vendor_type = ?';
      params.push(req.query.vendor_type);
    }
    
    if (req.query.vendor_status) {
      query += params.length ? ' AND v.vendor_status = ?' : ' WHERE v.vendor_status = ?';
      params.push(req.query.vendor_status);
    }
    
    // Add sorting
    query += ' ORDER BY v.created_at DESC';
    
    const vendors = await dbMethods.all(db, query, params);
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// GET /api/vendors/customer/:customerId - Get vendors for a specific customer
router.get('/customer/:customerId', restrictToAdminAndCustomerAdmin, [
  param('customerId').isInt().withMessage('Customer ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const db = req.app.locals.db;
    const vendors = await dbMethods.all(db, 
      `SELECT v.*, c.customer_name 
       FROM rsvp_master_vendors v 
       LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
       WHERE v.customer_id = ? 
       ORDER BY v.created_at DESC`, 
      [req.params.customerId]
    );
    
    res.json(vendors);
  } catch (error) {
    console.error('Error fetching customer vendors:', error);
    res.status(500).json({ error: 'Failed to fetch customer vendors' });
  }
});

// GET /api/vendors/types - Get vendor types (distinct)
router.get('/types', restrictToAdminAndCustomerAdmin, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const types = await dbMethods.all(db, 
      `SELECT DISTINCT vendor_type FROM rsvp_master_vendors ORDER BY vendor_type ASC`, 
      []
    );
    
    res.json(types);
  } catch (error) {
    console.error('Error fetching vendor types:', error);
    res.status(500).json({ error: 'Failed to fetch vendor types' });
  }
});

// GET /api/vendors/:id - Get vendor by ID with details
router.get('/:id', restrictToAdminAndCustomerAdmin, [
  param('id').isInt().withMessage('Vendor ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const db = req.app.locals.db;
    
    // Get vendor master data
    const vendor = await dbMethods.get(db, 
      `SELECT v.*, c.customer_name 
       FROM rsvp_master_vendors v 
       LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
       WHERE v.vendor_id = ?`, 
      [req.params.id]
    );
    
    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }
    
    // Get vendor details
    const vendorDetails = await dbMethods.get(db,
      `SELECT * FROM rsvp_vendor_details WHERE vendor_id = ?`,
      [req.params.id]
    );
    
    // Get vendor event allocations
    const eventAllocations = await dbMethods.all(db,
      `SELECT eva.*, e.event_name 
       FROM rsvp_vendor_event_allocation eva
       JOIN rsvp_master_events e ON eva.event_id = e.event_id
       WHERE eva.vendor_id = ?
       ORDER BY eva.service_start_datetime DESC`,
      [req.params.id]
    );
    
    // Combine data
    const result = {
      ...vendor,
      details: vendorDetails || {},
      eventAllocations: eventAllocations || []
    };
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching vendor:', error);
    res.status(500).json({ error: 'Failed to fetch vendor' });
  }
});

// POST /api/vendors - Create new vendor
router.post('/', restrictToAdminAndCustomerAdmin, [
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('vendor_name').notEmpty().withMessage('Vendor name is required'),
  body('vendor_type').notEmpty().withMessage('Vendor type is required'),
  body('vendor_email').optional().isEmail().withMessage('Invalid email format'),
  body('vendor_phone').optional().isLength({ min: 10 }).withMessage('Phone number must be at least 10 digits')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      customer_id, vendor_name, vendor_type, vendor_email, vendor_phone, 
      vendor_address, vendor_status, 
      // Details fields
      contact_person, contact_email, contact_phone, contract_details, payment_terms
    } = req.body;
    
    const db = req.app.locals.db;

    // Check if customer exists
    const customer = await dbMethods.get(db, 'SELECT customer_id FROM master_customers WHERE customer_id = ?', [customer_id]);
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    // Begin transaction
    await dbMethods.run(db, 'BEGIN TRANSACTION');
    
    try {
      // Insert main vendor record
      const result = await dbMethods.run(db, 
        `INSERT INTO rsvp_master_vendors (
          customer_id, vendor_name, vendor_type, vendor_email, vendor_phone, 
          vendor_address, vendor_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          customer_id, vendor_name, vendor_type, vendor_email, vendor_phone, 
          vendor_address, vendor_status || 'Active'
        ]
      );
      
      const vendorId = result.lastID;
      
      // Insert vendor details if provided
      if (contact_person || contact_email || contact_phone || contract_details || payment_terms) {
        await dbMethods.run(db,
          `INSERT INTO rsvp_vendor_details (
            vendor_id, contact_person, contact_email, contact_phone, 
            contract_details, payment_terms
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            vendorId, contact_person, contact_email, contact_phone, 
            contract_details, payment_terms
          ]
        );
      }
      
      // Commit transaction
      await dbMethods.run(db, 'COMMIT');
      
      // Return the created vendor with all details
      const newVendor = await dbMethods.get(db, 
        `SELECT v.*, c.customer_name 
         FROM rsvp_master_vendors v 
         LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
         WHERE v.vendor_id = ?`, 
        [vendorId]
      );
      
      res.status(201).json(newVendor);
    } catch (error) {
      // Rollback transaction on error
      await dbMethods.run(db, 'ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error creating vendor:', error);
    res.status(500).json({ error: 'Failed to create vendor' });
  }
});

// PUT /api/vendors/:id - Update vendor
router.put('/:id', restrictToAdminAndCustomerAdmin, [
  param('id').isInt().withMessage('Vendor ID must be an integer'),
  body('customer_id').isInt().withMessage('Customer ID is required and must be an integer'),
  body('vendor_name').notEmpty().withMessage('Vendor name is required'),
  body('vendor_type').notEmpty().withMessage('Vendor type is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      customer_id, vendor_name, vendor_type, vendor_email, vendor_phone, 
      vendor_address, vendor_status, 
      // Details fields
      contact_person, contact_email, contact_phone, contract_details, payment_terms
    } = req.body;
    
    const db = req.app.locals.db;
    const vendorId = req.params.id;

    // Check if vendor exists
    const existingVendor = await dbMethods.get(db, 'SELECT * FROM rsvp_master_vendors WHERE vendor_id = ?', [vendorId]);
    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check if customer exists
    const customer = await dbMethods.get(db, 'SELECT customer_id FROM master_customers WHERE customer_id = ?', [customer_id]);
    if (!customer) {
      return res.status(400).json({ error: 'Customer not found' });
    }

    // Begin transaction
    await dbMethods.run(db, 'BEGIN TRANSACTION');
    
    try {
      // Update main vendor record
      await dbMethods.run(db,
        `UPDATE rsvp_master_vendors SET 
          customer_id = ?, 
          vendor_name = ?, 
          vendor_type = ?, 
          vendor_email = ?, 
          vendor_phone = ?, 
          vendor_address = ?, 
          vendor_status = ?,
          updated_at = CURRENT_TIMESTAMP
         WHERE vendor_id = ?`,
        [
          customer_id, vendor_name, vendor_type, vendor_email, vendor_phone, 
          vendor_address, vendor_status, vendorId
        ]
      );
      
      // Check if vendor details exists
      const existingDetails = await dbMethods.get(db, 'SELECT * FROM rsvp_vendor_details WHERE vendor_id = ?', [vendorId]);
      
      if (existingDetails) {
        // Update vendor details
        await dbMethods.run(db,
          `UPDATE rsvp_vendor_details SET 
            contact_person = ?, 
            contact_email = ?, 
            contact_phone = ?, 
            contract_details = ?, 
            payment_terms = ?,
            updated_at = CURRENT_TIMESTAMP
           WHERE vendor_id = ?`,
          [
            contact_person, contact_email, contact_phone, 
            contract_details, payment_terms, vendorId
          ]
        );
      } else {
        // Insert vendor details
        await dbMethods.run(db,
          `INSERT INTO rsvp_vendor_details (
            vendor_id, contact_person, contact_email, contact_phone, 
            contract_details, payment_terms
          ) VALUES (?, ?, ?, ?, ?, ?)`,
          [
            vendorId, contact_person, contact_email, contact_phone, 
            contract_details, payment_terms
          ]
        );
      }
      
      // Commit transaction
      await dbMethods.run(db, 'COMMIT');
      
      // Return updated vendor with all details
      const updatedVendor = await dbMethods.get(db, 
        `SELECT v.*, c.customer_name 
         FROM rsvp_master_vendors v 
         LEFT JOIN master_customers c ON v.customer_id = c.customer_id 
         WHERE v.vendor_id = ?`, 
        [vendorId]
      );
      
      const vendorDetails = await dbMethods.get(db,
        `SELECT * FROM rsvp_vendor_details WHERE vendor_id = ?`,
        [vendorId]
      );
      
      res.json({
        ...updatedVendor,
        details: vendorDetails || {}
      });
    } catch (error) {
      // Rollback transaction on error
      await dbMethods.run(db, 'ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// DELETE /api/vendors/:id - Delete vendor
router.delete('/:id', restrictToAdminAndCustomerAdmin, [
  param('id').isInt().withMessage('Vendor ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const db = req.app.locals.db;
    const vendorId = req.params.id;

    // Check if vendor exists
    const existingVendor = await dbMethods.get(db, 'SELECT * FROM rsvp_master_vendors WHERE vendor_id = ?', [vendorId]);
    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Begin transaction
    await dbMethods.run(db, 'BEGIN TRANSACTION');
    
    try {
      // First delete any vendor event allocations
      await dbMethods.run(db, 'DELETE FROM rsvp_vendor_event_allocation WHERE vendor_id = ?', [vendorId]);
      
      // Delete vendor details
      await dbMethods.run(db, 'DELETE FROM rsvp_vendor_details WHERE vendor_id = ?', [vendorId]);
      
      // Delete main vendor record
      await dbMethods.run(db, 'DELETE FROM rsvp_master_vendors WHERE vendor_id = ?', [vendorId]);
      
      // Commit transaction
      await dbMethods.run(db, 'COMMIT');
      
      res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
      // Rollback transaction on error
      await dbMethods.run(db, 'ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// POST /api/vendors/:id/events - Assign vendor to an event
router.post('/:id/events', restrictToAdminAndCustomerAdmin, [
  param('id').isInt().withMessage('Vendor ID must be an integer'),
  body('event_id').isInt().withMessage('Event ID is required and must be an integer'),
  body('service_description').notEmpty().withMessage('Service description is required'),
  body('service_start_datetime').isISO8601().withMessage('Start time must be a valid date-time'),
  body('service_end_datetime').isISO8601().withMessage('End time must be a valid date-time'),
  body('cost').isFloat({ min: 0 }).withMessage('Cost must be a positive number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { 
      event_id, service_description, service_start_datetime, 
      service_end_datetime, cost, allocation_status
    } = req.body;
    
    const db = req.app.locals.db;
    const vendorId = req.params.id;

    // Check if vendor exists
    const existingVendor = await dbMethods.get(db, 'SELECT * FROM rsvp_master_vendors WHERE vendor_id = ?', [vendorId]);
    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Check if event exists
    const event = await dbMethods.get(db, 'SELECT event_id FROM rsvp_master_events WHERE event_id = ?', [event_id]);
    if (!event) {
      return res.status(400).json({ error: 'Event not found' });
    }

    // Insert vendor event allocation
    const result = await dbMethods.run(db, 
      `INSERT INTO rsvp_vendor_event_allocation (
        vendor_id, event_id, service_description, 
        service_start_datetime, service_end_datetime, 
        cost, allocation_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        vendorId, event_id, service_description, 
        service_start_datetime, service_end_datetime, 
        cost, allocation_status || 'Contracted'
      ]
    );
    
    const newAllocation = await dbMethods.get(db, 
      `SELECT eva.*, e.event_name 
       FROM rsvp_vendor_event_allocation eva
       JOIN rsvp_master_events e ON eva.event_id = e.event_id
       WHERE eva.event_vendor_allocation_id = ?`, 
      [result.lastID]
    );
    
    res.status(201).json(newAllocation);
  } catch (error) {
    console.error('Error assigning vendor to event:', error);
    res.status(500).json({ error: 'Failed to assign vendor to event' });
  }
});

// GET /api/vendors/:id/events - Get events for a vendor
router.get('/:id/events', restrictToAdminAndCustomerAdmin, [
  param('id').isInt().withMessage('Vendor ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const db = req.app.locals.db;
    const vendorId = req.params.id;
    
    // Check if vendor exists
    const existingVendor = await dbMethods.get(db, 'SELECT * FROM rsvp_master_vendors WHERE vendor_id = ?', [vendorId]);
    if (!existingVendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    // Get vendor event allocations with event details
    const events = await dbMethods.all(db,
      `SELECT eva.*, e.event_name, e.event_description, e.event_start_date, e.event_end_date,
              c.client_name, c.client_id
       FROM rsvp_vendor_event_allocation eva
       JOIN rsvp_master_events e ON eva.event_id = e.event_id
       JOIN rsvp_master_clients c ON e.client_id = c.client_id
       WHERE eva.vendor_id = ?
       ORDER BY eva.service_start_datetime DESC`,
      [vendorId]
    );
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching vendor events:', error);
    res.status(500).json({ error: 'Failed to fetch vendor events' });
  }
});

// DELETE /api/vendors/:vendorId/events/:eventAllocationId - Remove vendor from event
router.delete('/:vendorId/events/:eventAllocationId', restrictToAdminAndCustomerAdmin, [
  param('vendorId').isInt().withMessage('Vendor ID must be an integer'),
  param('eventAllocationId').isInt().withMessage('Event allocation ID must be an integer')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const db = req.app.locals.db;
    const { vendorId, eventAllocationId } = req.params;

    // Check if vendor event allocation exists
    const allocation = await dbMethods.get(db, 
      'SELECT * FROM rsvp_vendor_event_allocation WHERE event_vendor_allocation_id = ? AND vendor_id = ?', 
      [eventAllocationId, vendorId]
    );
    
    if (!allocation) {
      return res.status(404).json({ error: 'Vendor event allocation not found' });
    }

    // Delete vendor event allocation
    await dbMethods.run(db, 
      'DELETE FROM rsvp_vendor_event_allocation WHERE event_vendor_allocation_id = ?', 
      [eventAllocationId]
    );
    
    res.json({ message: 'Vendor removed from event successfully' });
  } catch (error) {
    console.error('Error removing vendor from event:', error);
    res.status(500).json({ error: 'Failed to remove vendor from event' });
  }
});

module.exports = router;
