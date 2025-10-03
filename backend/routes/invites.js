/**
 * Invite Management API Routes
 * CRUD operations and WhatsApp integration for invites
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../../middleware/auth');
const { dbMethods } = require('../../modules/database/backend');
const whatsappService = require('../services/whatsappService');
const multer = require('multer');
const path = require('path');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/invites/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Allow images and videos
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed'));
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// GET /api/invites/by-event/:eventId - Get all invites for an event
router.get('/by-event/:eventId', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT
        i.*,
        iv.invite_version_id,
        iv.version_number,
        iv.invite_title,
        iv.is_active,
        (SELECT COUNT(*) FROM rsvp_invite_distributions id WHERE id.invite_version_id = iv.invite_version_id) as total_sent,
        u.first_name as created_by_name
      FROM rsvp_master_invites i
      LEFT JOIN rsvp_invite_versions iv ON i.invite_id = iv.invite_id AND iv.is_active = 1
      LEFT JOIN users_master u ON i.created_by = u.user_id
      WHERE i.event_id = ?
      ORDER BY i.created_at DESC
    `;

    const invites = await dbMethods.all(db, query, [req.params.eventId]);
    res.json(invites);
  } catch (error) {
    console.error('Error fetching invites:', error);
    res.status(500).json({ error: 'Failed to fetch invites' });
  }
});

// GET /api/invites/:id/versions - Get all versions of an invite
router.get('/:id/versions', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;
    const query = `
      SELECT
        iv.*,
        (SELECT COUNT(*) FROM rsvp_invite_distributions id WHERE id.invite_version_id = iv.invite_version_id) as total_sent
      FROM rsvp_invite_versions iv
      WHERE iv.invite_id = ?
      ORDER BY iv.version_number DESC
    `;

    const versions = await dbMethods.all(db, query, [req.params.id]);
    res.json(versions);
  } catch (error) {
    console.error('Error fetching invite versions:', error);
    res.status(500).json({ error: 'Failed to fetch invite versions' });
  }
});

// POST /api/invites - Create new invite
router.post('/', [
  authenticateToken,
  body('client_id').isInt().withMessage('Client ID is required'),
  body('event_id').isInt().withMessage('Event ID is required'),
  body('invite_name').notEmpty().withMessage('Invite name is required'),
  body('invite_title').notEmpty().withMessage('Invite title is required'),
  body('invite_text').notEmpty().withMessage('Invite text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      client_id,
      event_id,
      invite_name,
      invite_description,
      invite_title,
      invite_text,
      invite_images,
      invite_videos,
      background_color,
      text_color,
      font_family,
      template_style
    } = req.body;

    const db = req.app.locals.db;
    await dbMethods.run(db, 'BEGIN TRANSACTION');

    try {
      // Create invite master record
      const inviteResult = await dbMethods.run(db,
        'INSERT INTO rsvp_master_invites (client_id, event_id, invite_name, invite_description, created_by) VALUES (?, ?, ?, ?, ?)',
        [client_id, event_id, invite_name, invite_description, req.user.user_id]
      );

      const inviteId = inviteResult.lastID;

      // Create first version
      const versionResult = await dbMethods.run(db,
        `INSERT INTO rsvp_invite_versions
         (invite_id, version_number, invite_title, invite_text, invite_images, invite_videos,
          background_color, text_color, font_family, template_style, is_active)
         VALUES (?, 1, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          inviteId,
          invite_title,
          invite_text,
          JSON.stringify(invite_images || []),
          JSON.stringify(invite_videos || []),
          background_color || '#ffffff',
          text_color || '#000000',
          font_family || 'Arial',
          JSON.stringify(template_style || {}),
        ]
      );

      // Initialize analytics
      await dbMethods.run(db,
        'INSERT INTO rsvp_invite_analytics (invite_id, invite_version_id) VALUES (?, ?)',
        [inviteId, versionResult.lastID]
      );

      await dbMethods.run(db, 'COMMIT');

      // Fetch created invite with version details
      const newInvite = await dbMethods.get(db, `
        SELECT i.*, iv.invite_version_id, iv.version_number, iv.invite_title, iv.is_active
        FROM rsvp_master_invites i
        LEFT JOIN rsvp_invite_versions iv ON i.invite_id = iv.invite_id AND iv.is_active = 1
        WHERE i.invite_id = ?
      `, [inviteId]);

      res.status(201).json(newInvite);

    } catch (error) {
      await dbMethods.run(db, 'ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating invite:', error);
    res.status(500).json({ error: 'Failed to create invite' });
  }
});

// POST /api/invites/:id/versions - Create new version of invite
router.post('/:id/versions', [
  authenticateToken,
  body('invite_title').notEmpty().withMessage('Invite title is required'),
  body('invite_text').notEmpty().withMessage('Invite text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      invite_title,
      invite_text,
      invite_images,
      invite_videos,
      background_color,
      text_color,
      font_family,
      template_style
    } = req.body;

    const db = req.app.locals.db;
    await dbMethods.run(db, 'BEGIN TRANSACTION');

    try {
      // Get next version number
      const maxVersion = await dbMethods.get(db,
        'SELECT MAX(version_number) as max_version FROM rsvp_invite_versions WHERE invite_id = ?',
        [req.params.id]
      );

      const nextVersion = (maxVersion?.max_version || 0) + 1;

      // Deactivate current active version
      await dbMethods.run(db,
        'UPDATE rsvp_invite_versions SET is_active = 0 WHERE invite_id = ? AND is_active = 1',
        [req.params.id]
      );

      // Create new version
      const versionResult = await dbMethods.run(db,
        `INSERT INTO rsvp_invite_versions
         (invite_id, version_number, invite_title, invite_text, invite_images, invite_videos,
          background_color, text_color, font_family, template_style, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          req.params.id,
          nextVersion,
          invite_title,
          invite_text,
          JSON.stringify(invite_images || []),
          JSON.stringify(invite_videos || []),
          background_color || '#ffffff',
          text_color || '#000000',
          font_family || 'Arial',
          JSON.stringify(template_style || {}),
        ]
      );

      // Initialize analytics for new version
      await dbMethods.run(db,
        'INSERT INTO rsvp_invite_analytics (invite_id, invite_version_id) VALUES (?, ?)',
        [req.params.id, versionResult.lastID]
      );

      await dbMethods.run(db, 'COMMIT');

      const newVersion = await dbMethods.get(db,
        'SELECT * FROM rsvp_invite_versions WHERE invite_version_id = ?',
        [versionResult.lastID]
      );

      res.status(201).json(newVersion);

    } catch (error) {
      await dbMethods.run(db, 'ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating invite version:', error);
    res.status(500).json({ error: 'Failed to create invite version' });
  }
});

// POST /api/invites/upload-media - Upload media files
router.post('/upload-media', authenticateToken, upload.array('media', 5), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const files = req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      url: `/uploads/invites/${file.filename}`
    }));

    res.json({ files });
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
});

// POST /api/invites/send-preview - Send preview to single recipient
router.post('/send-preview', [
  authenticateToken,
  body('phone_number').notEmpty().withMessage('Phone number is required'),
  body('invite_data').isObject().withMessage('Invite data is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone_number, invite_data } = req.body;
    console.log('Send preview request:', { phone_number: phone_number, invite_data_keys: Object.keys(invite_data || {}) });

    // For development: Allow preview without WhatsApp configuration
    if (!whatsappService.isConfigured()) {
      console.log('WhatsApp not configured, returning mock response');
      return res.json({
        success: true,
        message: 'Preview sent (mock response - WhatsApp not configured)',
        status: 'delivered',
        mock: true
      });
    }

    const result = await whatsappService.sendInvite(phone_number, invite_data);
    res.json(result);

  } catch (error) {
    console.error('Error sending preview:', error);
    res.status(500).json({ error: 'Failed to send preview' });
  }
});

// POST /api/invites/:versionId/send - Send invite to selected guests
router.post('/:versionId/send', [
  authenticateToken,
  body('guest_ids').isArray().withMessage('Guest IDs array is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { guest_ids } = req.body;
    const versionId = req.params.versionId;

    if (!whatsappService.isConfigured()) {
      return res.status(400).json({ error: 'WhatsApp service not configured' });
    }

    const db = req.app.locals.db;

    // Get invite version details
    const version = await dbMethods.get(db, `
      SELECT iv.*, i.invite_name
      FROM rsvp_invite_versions iv
      JOIN rsvp_master_invites i ON iv.invite_id = i.invite_id
      WHERE iv.invite_version_id = ?
    `, [versionId]);

    if (!version) {
      return res.status(404).json({ error: 'Invite version not found' });
    }

    // Get guests with phone numbers
    const guests = await dbMethods.all(db, `
      SELECT guest_id, guest_first_name, guest_last_name, guest_phone
      FROM rsvp_master_guests
      WHERE guest_id IN (${guest_ids.map(() => '?').join(',')}) AND guest_phone IS NOT NULL
    `, guest_ids);

    const sendResults = [];
    let sentCount = 0;
    let failedCount = 0;

    // Prepare invite data
    const inviteData = {
      title: version.invite_title,
      text: version.invite_text,
      images: JSON.parse(version.invite_images || '[]'),
      videos: JSON.parse(version.invite_videos || '[]')
    };

    // Send to each guest
    for (const guest of guests) {
      try {
        const result = await whatsappService.sendInvite(guest.guest_phone, inviteData);

        // Store distribution record
        await dbMethods.run(db, `
          INSERT INTO rsvp_invite_distributions
          (invite_version_id, guest_id, phone_number, delivery_status, delivery_response)
          VALUES (?, ?, ?, ?, ?)
        `, [
          versionId,
          guest.guest_id,
          guest.guest_phone,
          result.status,
          JSON.stringify(result)
        ]);

        sendResults.push({
          guest: guest,
          result: result
        });

        if (result.success) {
          sentCount++;
        } else {
          failedCount++;
        }

        // Add delay between sends to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));

      } catch (error) {
        console.error(`Error sending to ${guest.guest_phone}:`, error);
        failedCount++;

        // Still record the failed attempt
        await dbMethods.run(db, `
          INSERT INTO rsvp_invite_distributions
          (invite_version_id, guest_id, phone_number, delivery_status, delivery_response)
          VALUES (?, ?, ?, ?, ?)
        `, [
          versionId,
          guest.guest_id,
          guest.guest_phone,
          'failed',
          JSON.stringify({ error: error.message })
        ]);
      }
    }

    // Update analytics
    await dbMethods.run(db, `
      UPDATE rsvp_invite_analytics
      SET total_sent = total_sent + ?,
          total_failed = total_failed + ?,
          last_sent_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE invite_version_id = ?
    `, [sentCount, failedCount, versionId]);

    res.json({
      message: `Invite sent to ${sentCount} guests, ${failedCount} failed`,
      sentCount,
      failedCount,
      totalGuests: guests.length,
      results: sendResults
    });

  } catch (error) {
    console.error('Error sending invites:', error);
    res.status(500).json({ error: 'Failed to send invites' });
  }
});

// GET /api/invites/:versionId/analytics - Get analytics for invite version
router.get('/:versionId/analytics', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const analytics = await dbMethods.get(db, `
      SELECT
        a.*,
        i.invite_name,
        iv.invite_title,
        iv.version_number
      FROM rsvp_invite_analytics a
      JOIN rsvp_invite_versions iv ON a.invite_version_id = iv.invite_version_id
      JOIN rsvp_master_invites i ON a.invite_id = i.invite_id
      WHERE a.invite_version_id = ?
    `, [req.params.versionId]);

    if (!analytics) {
      return res.status(404).json({ error: 'Analytics not found' });
    }

    // Get detailed distribution data
    const distributions = await dbMethods.all(db, `
      SELECT
        id.*,
        g.guest_first_name,
        g.guest_last_name,
        g.guest_email
      FROM rsvp_invite_distributions id
      JOIN rsvp_master_guests g ON id.guest_id = g.guest_id
      WHERE id.invite_version_id = ?
      ORDER BY id.sent_at DESC
    `, [req.params.versionId]);

    res.json({
      analytics,
      distributions
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// POST /api/invites/webhook - WhatsApp webhook endpoint
router.post('/webhook', async (req, res) => {
  try {
    const result = whatsappService.processWebhook(req.body);

    if (result && result.type === 'status') {
      // Update delivery status based on webhook
      const db = req.app.locals.db;

      for (const status of result.statuses) {
        // Update distribution record based on message ID
        await dbMethods.run(db, `
          UPDATE rsvp_invite_distributions
          SET delivery_status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE delivery_response LIKE ?
        `, [status.status, `%${status.id}%`]);
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.sendStatus(200); // Always return 200 to WhatsApp
  }
});

// GET /api/invites/webhook - WhatsApp webhook verification
router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const verificationResult = whatsappService.verifyWebhook(mode, token, challenge);

  if (verificationResult) {
    res.status(200).send(challenge);
  } else {
    res.sendStatus(403);
  }
});

// POST /api/invites/send-whatsapp - Send a single WhatsApp message
router.post('/send-whatsapp', [
  authenticateToken,
  body('guest_id').isInt().withMessage('Guest ID is required'),
  body('message').notEmpty().withMessage('Message is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { guest_id, message } = req.body;

    if (!whatsappService.isConfigured()) {
      return res.status(400).json({ error: 'WhatsApp service not configured' });
    }

    const db = req.app.locals.db;

    // Get guest with phone number
    const guest = await dbMethods.get(db, `
      SELECT guest_id, guest_first_name, guest_last_name, guest_phone
      FROM rsvp_master_guests
      WHERE guest_id = ? AND guest_phone IS NOT NULL
    `, [guest_id]);

    if (!guest) {
      return res.status(404).json({ error: 'Guest not found or has no phone number' });
    }

    const result = await whatsappService.sendMessage(guest.guest_phone, message);

    res.json(result);

  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp message' });
  }
});

module.exports = router;