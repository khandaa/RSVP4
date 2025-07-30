const crypto = require('crypto');
const jwt = require('jsonwebtoken');

/**
 * RSVP Token Generation and Validation Utilities
 * Provides secure token generation for guest RSVP links
 */

const JWT_SECRET = process.env.JWT_SECRET || 'your-rsvp-secret-key';
const TOKEN_EXPIRY = '30d'; // 30 days expiry for RSVP tokens

class RSVPTokenManager {
  /**
   * Generate a secure RSVP token for a guest
   * @param {Object} guestData - Guest information
   * @param {number} guestData.guest_id - Guest ID
   * @param {number} guestData.event_id - Event ID
   * @param {string} guestData.guest_email - Guest email
   * @param {Object} options - Additional options
   * @returns {string} Secure RSVP token
   */
  static generateRSVPToken(guestData, options = {}) {
    const { guest_id, event_id, guest_email } = guestData;
    const expiresIn = options.expiresIn || TOKEN_EXPIRY;

    // Create unique token ID to prevent replay attacks
    const tokenId = crypto.randomBytes(16).toString('hex');
    
    // Token payload
    const payload = {
      guest_id: parseInt(guest_id),
      event_id: parseInt(event_id),
      email: guest_email,
      token_id: tokenId,
      token_type: 'rsvp',
      issued_at: Date.now(),
      purpose: options.purpose || 'event_rsvp'
    };

    // Generate JWT token
    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn,
      issuer: 'rsvp-system',
      audience: 'guest'
    });

    return {
      token,
      tokenId,
      expiresAt: new Date(Date.now() + this.parseExpiry(expiresIn))
    };
  }

  /**
   * Generate RSVP token for subevent
   * @param {Object} guestData - Guest information
   * @param {number} subeventId - Subevent ID  
   * @param {Object} options - Additional options
   * @returns {Object} Token information
   */
  static generateSubeventRSVPToken(guestData, subeventId, options = {}) {
    const { guest_id, event_id, guest_email } = guestData;
    const expiresIn = options.expiresIn || TOKEN_EXPIRY;

    const tokenId = crypto.randomBytes(16).toString('hex');
    
    const payload = {
      guest_id: parseInt(guest_id),
      event_id: parseInt(event_id),
      subevent_id: parseInt(subeventId),
      email: guest_email,
      token_id: tokenId,
      token_type: 'subevent_rsvp',
      issued_at: Date.now(),
      purpose: options.purpose || 'subevent_rsvp'
    };

    const token = jwt.sign(payload, JWT_SECRET, { 
      expiresIn,
      issuer: 'rsvp-system',
      audience: 'guest'
    });

    return {
      token,
      tokenId,
      expiresAt: new Date(Date.now() + this.parseExpiry(expiresIn))
    };
  }

  /**
   * Validate RSVP token
   * @param {string} token - JWT token
   * @returns {Object} Decoded token payload or null if invalid
   */
  static validateRSVPToken(token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET, {
        issuer: 'rsvp-system',
        audience: 'guest'
      });

      // Check if token is expired (additional check)
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        return { error: 'Token expired', code: 'TOKEN_EXPIRED' };
      }

      // Validate required fields
      const requiredFields = ['guest_id', 'event_id', 'email', 'token_id', 'token_type'];
      for (const field of requiredFields) {
        if (!decoded[field]) {
          return { error: `Missing required field: ${field}`, code: 'INVALID_TOKEN' };
        }
      }

      return { payload: decoded, valid: true };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return { error: 'Token expired', code: 'TOKEN_EXPIRED' };
      } else if (error.name === 'JsonWebTokenError') {
        return { error: 'Invalid token', code: 'INVALID_TOKEN' };
      } else {
        return { error: 'Token validation failed', code: 'VALIDATION_ERROR' };
      }
    }
  }

  /**
   * Generate secure RSVP URL for guest
   * @param {string} token - RSVP token
   * @param {string} baseUrl - Base URL of the application
   * @returns {string} Complete RSVP URL
   */
  static generateRSVPUrl(token, baseUrl) {
    const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    return `${cleanBaseUrl}/rsvp/${token}`;
  }

  /**
   * Generate a simple access code for phone/SMS RSVP
   * @param {number} guestId - Guest ID
   * @param {number} eventId - Event ID
   * @returns {string} 6-digit access code
   */
  static generateAccessCode(guestId, eventId) {
    // Create a hash based on guest and event IDs with current date
    const dateString = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const hashInput = `${guestId}-${eventId}-${dateString}`;
    const hash = crypto.createHash('sha256').update(hashInput).digest('hex');
    
    // Extract 6 digits from hash
    const code = parseInt(hash.substring(0, 8), 16) % 1000000;
    return code.toString().padStart(6, '0');
  }

  /**
   * Validate access code
   * @param {string} code - 6-digit access code
   * @param {number} guestId - Guest ID
   * @param {number} eventId - Event ID
   * @returns {boolean} Whether code is valid
   */
  static validateAccessCode(code, guestId, eventId) {
    const expectedCode = this.generateAccessCode(guestId, eventId);
    return code === expectedCode;
  }

  /**
   * Generate batch RSVP tokens for multiple guests
   * @param {Array} guests - Array of guest objects
   * @param {Object} options - Generation options
   * @returns {Array} Array of token objects
   */
  static generateBatchRSVPTokens(guests, options = {}) {
    return guests.map(guest => {
      const tokenData = this.generateRSVPToken(guest, options);
      return {
        guest_id: guest.guest_id,
        guest_email: guest.guest_email,
        guest_name: `${guest.guest_first_name} ${guest.guest_last_name}`,
        ...tokenData
      };
    });
  }

  /**
   * Parse expiry string to milliseconds
   * @param {string} expiry - Expiry string like '30d', '24h', '60m'
   * @returns {number} Expiry in milliseconds
   */
  static parseExpiry(expiry) {
    const units = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000
    };

    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 30 * 24 * 60 * 60 * 1000; // Default 30 days
    }

    const [, value, unit] = match;
    return parseInt(value) * (units[unit] || units.d);
  }

  /**
   * Create RSVP tracking record
   * @param {Object} tokenData - Token information
   * @param {Object} guestData - Guest information
   * @returns {Object} Tracking record
   */
  static createTrackingRecord(tokenData, guestData) {
    return {
      token_id: tokenData.tokenId,
      guest_id: guestData.guest_id,
      event_id: guestData.event_id,
      subevent_id: guestData.subevent_id || null,
      token_hash: crypto.createHash('sha256').update(tokenData.token).digest('hex'),
      expires_at: tokenData.expiresAt,
      created_at: new Date(),
      is_used: false,
      usage_count: 0
    };
  }

  /**
   * Verify token hasn't been tampered with
   * @param {string} token - JWT token
   * @param {string} expectedHash - Expected token hash
   * @returns {boolean} Whether token matches expected hash
   */
  static verifyTokenIntegrity(token, expectedHash) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    return tokenHash === expectedHash;
  }
}

module.exports = RSVPTokenManager;