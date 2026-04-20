const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getPool, sql } = require('../config/db');

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, phone, address } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Thiếu thông tin bắt buộc' });
    }
    const pool = await getPool();
    const check = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT id FROM users WHERE email = @email');
    if (check.recordset.length > 0) {
      return res.status(400).json({ message: 'Email đã tồn tại' });
    }
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.request()
      .input('username', sql.NVarChar, username)
      .input('email', sql.NVarChar, email)
      .input('password_hash', sql.NVarChar, hash)
      .input('phone', sql.NVarChar, phone || '')
      .input('address', sql.NVarChar, address || '')
      .query(`INSERT INTO users (username, email, password_hash, phone, address)
              OUTPUT INSERTED.id
              VALUES (@username, @email, @password_hash, @phone, @address)`);
    res.status(201).json({
      message: 'Đăng ký thành công',
      userId: result.recordset[0].id,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Thiếu email hoặc mật khẩu' });
    }
    const pool = await getPool();
    const result = await pool.request()
      .input('email', sql.NVarChar, email)
      .query('SELECT * FROM users WHERE email = @email');
    if (result.recordset.length === 0) {
      return res.status(401).json({ message: 'Email không tồn tại' });
    }
    const user = result.recordset[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ message: 'Mật khẩu không đúng' });
    }
    const token = jwt.sign(
      { id: user.id, email: user.email, is_admin: user.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      id: user.id,
      username: user.username,
      role: user.is_admin ? 'admin' : 'user',
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;