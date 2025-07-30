-- Event Feature Toggle Migration
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

-- Insert feature toggle for event management if it doesn't exist
INSERT OR IGNORE INTO feature_toggles (feature_name, description, is_enabled)
VALUES ('event_management', 'Controls visibility and access to the event management module', 1);

-- Create changelog table if it doesn't exist
CREATE TABLE IF NOT EXISTS changelog (
    id INTEGER PRIMARY KEY,
    version VARCHAR(20),
    description TEXT,
    script_name VARCHAR(100),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(50)
);

-- Update the changelog
INSERT INTO changelog (version, description, script_name, applied_at, applied_by)
VALUES ('1.3.0', 'Added feature toggle for event management', 'event_toggle.sql', CURRENT_TIMESTAMP, 'system');
