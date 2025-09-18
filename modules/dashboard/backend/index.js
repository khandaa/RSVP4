const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../../middleware/auth');
const { dbMethods } = require('../../database/backend');

router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const db = req.app.locals.db;

    const userCountResult = await dbMethods.get(db, 'SELECT COUNT(*) as count FROM users_master');
    const roleCountResult = await dbMethods.get(db, 'SELECT COUNT(*) as count FROM roles_master');

    res.json({
      userCount: userCountResult.count,
      roleCount: roleCountResult.count,
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

module.exports = router;
