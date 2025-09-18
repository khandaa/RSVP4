/**
 * EmployDEX Base Platform - Main Application Entry Point
 * Created: 2025-06-26
 */

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const EventEmitter = require('events');

// Create a global event bus for inter-module communication
const eventBus = new EventEmitter();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;

// CORS Configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development mode, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      console.log('CORS: Request from origin:', origin);
      callback(null, true);
      return;
    }

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:5000',
      'http://localhost:5001',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    if (allowedOrigins.includes(origin) || allowedOrigins.some(allowed => origin.startsWith(allowed))) {
      callback(null, true);
    } else {
      console.log('CORS: Blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH']
};

// Middleware
app.use(cors(corsOptions));
app.use(helmet());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Ensure upload directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Database initialization
const dbPath = path.join(__dirname, '..', 'db', 'RSVP4.db');
const dbExists = fs.existsSync(dbPath);

// Create db directory if it doesn't exist
const dbDir = path.join(__dirname, '..', 'db');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Initialize database connection
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to the SQLite database');
    
    // If database doesn't exist, initialize it with schema
    if (!dbExists) {
      const sqlScript = fs.readFileSync(path.join(__dirname, '..', 'db', 'base_v1_db_script.sql'), 'utf8');
      
      // Split the script by semicolons to execute each statement separately
      const sqlStatements = sqlScript.split(';').filter(stmt => stmt.trim() !== '');
      
      db.serialize(() => {
        db.run('PRAGMA foreign_keys = ON');
        
        // Execute each SQL statement in the script
        sqlStatements.forEach(statement => {
          if (statement.trim()) {
            db.run(statement, (err) => {
              if (err) {
                console.error('Error executing SQL statement:', err.message);
                console.error('Statement:', statement);
              }
            });
          }
        });
        
        console.log('Database initialized successfully');
      });
    }
  }
});

// Make database connection available to all routes
app.locals.db = db;
app.locals.eventBus = eventBus;

// Register module routers
// Load and register all modules from the modules directory
const modulesPath = path.join(__dirname, '..', 'modules');

// Array of module names that should be loaded
const moduleNames = [
  'authentication', 
  'user_management', 
  'role_management', 
  'permission_management', 
  'logging',
  'database',
  'payment',
  'dashboard'
];

// Register each module's backend routes
moduleNames.forEach(moduleName => {
  try {
    const modulePath = path.join(modulesPath, moduleName, 'backend', 'index.js');
    if (fs.existsSync(modulePath)) {
      const moduleRouter = require(modulePath);
      app.use(`/api/${moduleName}`, moduleRouter);
      console.log(`Registered module: ${moduleName}`);
    } else {
      console.warn(`Module ${moduleName} does not have an index.js file`);
    }
  } catch (err) {
    console.error(`Error loading module ${moduleName}:`, err);
  }
});

// Register feature toggle routes
const featureToggleRoutes = require('./routes/feature-toggles');
app.use('/api/feature-toggles', featureToggleRoutes);

// Register payment transaction routes
const paymentTransactionRoutes = require('./routes/payment-transactions');
app.use('/api/payment/transactions', paymentTransactionRoutes);

// Register payment QR code routes
const paymentQrCodeRoutes = require('./routes/payment-qr-codes');
app.use('/api/payment/qr-codes', paymentQrCodeRoutes);

// Register widget config routes
const widgetConfigRoutes = require('./routes/widget-config');
app.use('/api', widgetConfigRoutes);

// Register file upload routes
const fileUploadRoutes = require('./routes/file-upload');
app.use('/api', fileUploadRoutes);

// Register RSVP4 CRUD routes
const customerRoutes = require('./routes/customers');
app.use('/api/customers', customerRoutes);

const clientRoutes = require('./routes/clients');
app.use('/api/clients', clientRoutes);

const eventRoutes = require('./routes/events');
app.use('/api/events', eventRoutes);

const guestRoutes = require('./routes/guests');
app.use('/api/guests', guestRoutes);

const venueRoutes = require('./routes/venues');
app.use('/api/venues', venueRoutes);

const vendorRoutes = require('./routes/vendors');
app.use('/api/vendors', vendorRoutes);

const masterDataRoutes = require('./routes/master-data');
app.use('/api/master-data', masterDataRoutes);

const employeeManagementRoutes = require('./routes/employee-management');
app.use('/api/employee-management', employeeManagementRoutes);

const comprehensiveCrudRoutes = require('./routes/comprehensive-crud');
app.use('/api/comprehensive-crud', comprehensiveCrudRoutes);


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  const errorLogger = app.locals.eventBus;
  errorLogger.emit('log:error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  });
  
  res.status(500).json({
    error: {
      message: 'An unexpected error occurred',
      id: Date.now().toString()
    }
  });
});

// Serve static frontend files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '..', 'frontend', 'build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'build', 'index.html'));
  });
}

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  eventBus.emit('system:startup', { timestamp: new Date() });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  
  // Close database connection
  if (db) {
    db.close((err) => {
      if (err) {
        console.error('Error closing database:', err.message);
      } else {
        console.log('Database connection closed');
      }
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

module.exports = app;
