-- This script adds the missing columns to the rsvp_master_guests table.
-- Run this script if you are getting 'no such column' errors related to guest fields.

ALTER TABLE rsvp_master_guests ADD COLUMN guest_type VARCHAR(50);
ALTER TABLE rsvp_master_guests ADD COLUMN guest_rsvp_status VARCHAR(20) DEFAULT 'Pending';
ALTER TABLE rsvp_master_guests ADD COLUMN guest_address TEXT;
ALTER TABLE rsvp_master_guests ADD COLUMN guest_city VARCHAR(50);
ALTER TABLE rsvp_master_guests ADD COLUMN guest_country VARCHAR(50);
ALTER TABLE rsvp_master_guests ADD COLUMN guest_dietary_preferences TEXT;
ALTER TABLE rsvp_master_guests ADD COLUMN guest_special_requirements TEXT;
ALTER TABLE rsvp_master_guests ADD COLUMN guest_notes TEXT;
