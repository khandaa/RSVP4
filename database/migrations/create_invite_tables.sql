-- Create invite master table for storing invite templates
CREATE TABLE IF NOT EXISTS rsvp_master_invites (
    invite_id INTEGER PRIMARY KEY,
    client_id INTEGER NOT NULL,
    event_id INTEGER NOT NULL,
    invite_name VARCHAR(255) NOT NULL,
    invite_description TEXT,
    invite_status VARCHAR(20) DEFAULT 'Draft',
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (client_id) REFERENCES rsvp_master_clients(client_id),
    FOREIGN KEY (event_id) REFERENCES rsvp_master_events(event_id),
    FOREIGN KEY (created_by) REFERENCES users_master(user_id)
);

-- Create invite versions table for storing different versions of invites
CREATE TABLE IF NOT EXISTS rsvp_invite_versions (
    invite_version_id INTEGER PRIMARY KEY,
    invite_id INTEGER NOT NULL,
    version_number INTEGER NOT NULL DEFAULT 1,
    invite_title VARCHAR(255),
    invite_text TEXT,
    invite_images TEXT, -- JSON array of image URLs/paths
    invite_videos TEXT, -- JSON array of video URLs/paths
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#000000',
    font_family VARCHAR(100) DEFAULT 'Arial',
    template_style TEXT, -- JSON for additional styling
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invite_id) REFERENCES rsvp_master_invites(invite_id) ON DELETE CASCADE
);

-- Create invite distribution table for tracking sent invites
CREATE TABLE IF NOT EXISTS rsvp_invite_distributions (
    distribution_id INTEGER PRIMARY KEY,
    invite_version_id INTEGER NOT NULL,
    guest_id INTEGER NOT NULL,
    distribution_channel VARCHAR(50) DEFAULT 'whatsapp',
    phone_number VARCHAR(20),
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    delivery_status VARCHAR(50) DEFAULT 'sent', -- sent, delivered, failed, read
    delivery_response TEXT, -- WhatsApp API response
    read_at TIMESTAMP,
    responded_at TIMESTAMP,
    response_data TEXT, -- JSON for any response data
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invite_version_id) REFERENCES rsvp_invite_versions(invite_version_id),
    FOREIGN KEY (guest_id) REFERENCES rsvp_master_guests(guest_id)
);

-- Create invite analytics table for tracking metrics
CREATE TABLE IF NOT EXISTS rsvp_invite_analytics (
    analytics_id INTEGER PRIMARY KEY,
    invite_id INTEGER NOT NULL,
    invite_version_id INTEGER NOT NULL,
    total_sent INTEGER DEFAULT 0,
    total_delivered INTEGER DEFAULT 0,
    total_failed INTEGER DEFAULT 0,
    total_read INTEGER DEFAULT 0,
    total_responded INTEGER DEFAULT 0,
    last_sent_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (invite_id) REFERENCES rsvp_master_invites(invite_id),
    FOREIGN KEY (invite_version_id) REFERENCES rsvp_invite_versions(invite_version_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_invite_versions_invite_id ON rsvp_invite_versions(invite_id);
CREATE INDEX IF NOT EXISTS idx_invite_versions_active ON rsvp_invite_versions(is_active);
CREATE INDEX IF NOT EXISTS idx_invite_distributions_invite_version ON rsvp_invite_distributions(invite_version_id);
CREATE INDEX IF NOT EXISTS idx_invite_distributions_guest ON rsvp_invite_distributions(guest_id);
CREATE INDEX IF NOT EXISTS idx_invite_distributions_status ON rsvp_invite_distributions(delivery_status);
CREATE INDEX IF NOT EXISTS idx_invite_analytics_invite ON rsvp_invite_analytics(invite_id);