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
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/temp/' });

// GET /api/customers - Get all customers
router.get('/', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    // Enhanced error handling
    if (!db) {
      console.error('Database connection not available');
      return res.status(500).json({ error: 'Database connection not available' });
    }
    
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

    // Begin transaction
    await dbMethods.run(db, 'BEGIN TRANSACTION');

    try {
      // 1. Insert customer record
      const result = await dbMethods.run(db, 
        'INSERT INTO master_customers (customer_name, customer_email, customer_phone, customer_address, customer_city, customer_status) VALUES (?, ?, ?, ?, ?, ?)',
        [customer_name, customer_email, customer_phone, customer_address, customer_city, customer_status || 'Active']
      );
      
      const customerId = result.lastID;
      const newCustomer = await dbMethods.get(db, 'SELECT * FROM master_customers WHERE customer_id = ?', [customerId]);
      
      // 2. Create a user account for the customer admin if email is provided
      if (customer_email) {
        try {
          // Generate a default password (Admin@123)
          const bcrypt = require('bcryptjs');
          const salt = await bcrypt.genSalt(10);
          const defaultPassword = 'Admin@123';
          const hashedPassword = await bcrypt.hash(defaultPassword, salt);
          
          // Generate username from customer name
          const firstName = customer_name.split(' ')[0] || customer_name;
          const lastName = customer_name.split(' ').slice(1).join(' ') || 'Admin';
          
          // Check if user with this email already exists
          const existingUser = await dbMethods.get(db, 'SELECT user_id FROM users_master WHERE email = ?', [customer_email]);
          
          let userId;
          
          if (existingUser) {
            // Use existing user
            userId = existingUser.user_id;
            console.log(`Using existing user account for customer ${customer_name}, user ID: ${userId}`);
          } else {
            // Insert into users_master
            const userResult = await dbMethods.run(db, 
              'INSERT INTO users_master (mobile_number, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
              [customer_phone || '', customer_email, hashedPassword, firstName, lastName]
            );
            
            userId = userResult.lastID;
            console.log(`Created new user account for customer ${customer_name}, user ID: ${userId}`);
          }
          
          // Get Customer Admin role ID
          const customerAdminRole = await dbMethods.get(db, 'SELECT role_id FROM roles_master WHERE name = ?', ['Customer Admin']);
          if (customerAdminRole) {
            // Check if the user already has this role
            const existingRole = await dbMethods.get(db, 
              'SELECT user_role_id FROM user_roles_tx WHERE user_id = ? AND role_id = ?', 
              [userId, customerAdminRole.role_id]
            );
            
            if (!existingRole) {
              // Insert into user_roles_tx
              await dbMethods.run(db, 
                'INSERT INTO user_roles_tx (user_id, role_id) VALUES (?, ?)',
                [userId, customerAdminRole.role_id]
              );
              
              console.log(`Assigned Customer Admin role to user ${userId} for customer ${customer_name}`);
            } else {
              console.log(`User ${userId} already has Customer Admin role`);
            }
          } else {
            console.warn('Customer Admin role not found - user created without role assignment');
          }
        } catch (userError) {
          console.error('Error creating customer admin user:', userError);
          // Continue with customer creation even if user creation fails
        }
      }
      
      // Commit the transaction
      await dbMethods.run(db, 'COMMIT');
      
      res.status(201).json({
        ...newCustomer,
        message: customer_email ? 'Customer created with admin user account' : 'Customer created without admin user (no email provided)'
      });
      
    } catch (error) {
      // Rollback on error
      await dbMethods.run(db, 'ROLLBACK');
      throw error;
    }
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

// POST /api/customers/bulk-import - Bulk import customers from CSV/Excel
router.post('/bulk-import', [authenticateToken, upload.single('file')], async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const db = req.app.locals.db;
    const results = [];
    const errors = [];
    let rowNumber = 1; // Start from 1 (header is row 0)

    // Process CSV file
    const processCSV = () => {
      return new Promise((resolve, reject) => {
        fs.createReadStream(req.file.path)
          .pipe(csv())
          .on('data', async (row) => {
            rowNumber++;
            
            try {
              // Validate required fields
              if (!row.customer_name || !row.customer_name.trim()) {
                errors.push({
                  row: rowNumber,
                  message: 'Customer name is required'
                });
                return;
              }

              // Validate email format if provided
              if (row.customer_email && !/\S+@\S+\.\S+/.test(row.customer_email)) {
                errors.push({
                  row: rowNumber,
                  message: 'Invalid email format'
                });
                return;
              }

              // Validate phone format if provided
              if (row.customer_phone && !/^\d{10,}$/.test(row.customer_phone.replace(/\D/g, ''))) {
                errors.push({
                  row: rowNumber,
                  message: 'Invalid phone number format (10+ digits required)'
                });
                return;
              }

              // Prepare customer data
              const customerData = {
                customer_name: row.customer_name.trim(),
                customer_email: row.customer_email?.trim() || null,
                customer_phone: row.customer_phone?.trim() || null,
                customer_address: row.customer_address?.trim() || null,
                customer_city: row.customer_city?.trim() || null,
                customer_status: row.customer_status?.trim() || 'Active'
              };

              // Insert customer
              const result = await dbMethods.run(db,
                'INSERT INTO master_customers (customer_name, customer_email, customer_phone, customer_address, customer_city, customer_status) VALUES (?, ?, ?, ?, ?, ?)',
                [customerData.customer_name, customerData.customer_email, customerData.customer_phone, customerData.customer_address, customerData.customer_city, customerData.customer_status]
              );
              
              const customerId = result.lastID;
              
              // Create Customer Admin user if email is provided
              if (customerData.customer_email) {
                try {
                  // Generate a default password (Admin@123)
                  const bcrypt = require('bcryptjs');
                  const salt = await bcrypt.genSalt(10);
                  const defaultPassword = 'Admin@123';
                  const hashedPassword = await bcrypt.hash(defaultPassword, salt);
                  
                  // Generate user details from customer data
                  const firstName = customerData.customer_name.split(' ')[0] || customerData.customer_name;
                  const lastName = customerData.customer_name.split(' ').slice(1).join(' ') || 'Admin';
                  
                  // Check if user with this email already exists
                  const existingUser = await dbMethods.get(db, 'SELECT user_id FROM users_master WHERE email = ?', [customerData.customer_email]);
                  
                  let userId;
                  
                  if (existingUser) {
                    // Use existing user
                    userId = existingUser.user_id;
                    console.log(`Using existing user account for customer ${customerData.customer_name}, user ID: ${userId}`);
                  } else {
                    // Insert into users_master
                    const userResult = await dbMethods.run(db, 
                      'INSERT INTO users_master (mobile_number, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?)',
                      [customerData.customer_phone || '', customerData.customer_email, hashedPassword, firstName, lastName]
                    );
                    
                    userId = userResult.lastID;
                    console.log(`Created new user account for customer ${customerData.customer_name}, user ID: ${userId}`);
                  }
                  
                  // Get Customer Admin role ID
                  const customerAdminRole = await dbMethods.get(db, 'SELECT role_id FROM roles_master WHERE name = ?', ['Customer Admin']);
                  if (customerAdminRole) {
                    // Check if the user already has this role
                    const existingRole = await dbMethods.get(db, 
                      'SELECT user_role_id FROM user_roles_tx WHERE user_id = ? AND role_id = ?', 
                      [userId, customerAdminRole.role_id]
                    );
                    
                    if (!existingRole) {
                      // Insert into user_roles_tx
                      await dbMethods.run(db, 
                        'INSERT INTO user_roles_tx (user_id, role_id) VALUES (?, ?)',
                        [userId, customerAdminRole.role_id]
                      );
                      
                      console.log(`Assigned Customer Admin role to user ${userId} for customer ${customerData.customer_name}`);
                    } else {
                      console.log(`User ${userId} already has Customer Admin role`);
                    }
                  } else {
                    console.warn('Customer Admin role not found - user created without role assignment');
                  }
                } catch (userError) {
                  console.error('Error creating user for customer in row', rowNumber, ':', userError);
                  // Continue with customer creation even if user creation fails
                }
              }

              results.push({
                row: rowNumber,
                customer_id: customerId,
                customer_name: customerData.customer_name,
                user_created: customerData.customer_email ? true : false
              });

            } catch (dbError) {
              console.error('Database error for row', rowNumber, ':', dbError);
              errors.push({
                row: rowNumber,
                message: `Database error: ${dbError.message}`
              });
            }
          })
          .on('end', () => {
            // Clean up uploaded file
            fs.unlink(req.file.path, (err) => {
              if (err) console.error('Error deleting temp file:', err);
            });
            resolve();
          })
          .on('error', (error) => {
            console.error('CSV processing error:', error);
            reject(error);
          });
      });
    };

    await processCSV();

    // Return results
    res.json({
      successful: results.length,
      errors: errors,
      total: results.length + errors.length,
      imported_customers: results.slice(0, 10) // Return first 10 for preview
    });

  } catch (error) {
    console.error('Error processing bulk import:', error);
    
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('Error deleting temp file:', err);
      });
    }
    
    res.status(500).json({ error: 'Failed to process bulk import' });
  }
});

module.exports = router;