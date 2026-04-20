const express = require('express');
const router = express.Router();
const { getPool } = require('../config/db');

// GET /api/banners
router.get('/', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .query('SELECT * FROM banners WHERE is_active = 1');
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;