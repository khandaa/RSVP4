-- Feature Toggles Table Migration
-- Created: 2025-07-29

-- Create feature toggles table if it doesn't exist
CREATE TABLE IF NOT EXISTS feature_toggles (
    id INTEGER PRIMARY KEY,
    feature_name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    is_enabled INTEGER DEFAULT 0, -- 0 = disabled, 1 = enabled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert feature toggles for customer and client management if they don't exist
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES
    ('customer_management', 'Controls visibility and access to the customer management module', 1),
    ('client_management', 'Controls visibility and access to the client management module', 1),
    ('payment_integration', 'Controls access to payment features', 0);

-- Update the changelog
INSERT INTO changelog (version, description, script_name, applied_at, applied_by)
VALUES ('1.2.0', 'Added feature toggles for customer and client management', 'feature_toggles.sql', CURRENT_TIMESTAMP, 'system');
