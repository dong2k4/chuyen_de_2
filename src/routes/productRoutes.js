const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');

// GET /api/products?category_id=1&search=nồi
router.get('/', async (req, res) => {
  try {
    const { category_id, search } = req.query;
    const pool = await getPool();
    const request = pool.request();
    let query = `
      SELECT p.id, p.name, p.price, p.image_url, p.stock,
             p.is_popular, c.name AS category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE 1=1
    `;
    if (category_id) {
      request.input('category_id', sql.Int, parseInt(category_id));
      query += ' AND p.category_id = @category_id';
    }
    if (search) {
      request.input('search', sql.NVarChar, `%${search}%`);
      query += ' AND p.name LIKE @search';
    }
    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query(`
        SELECT p.*, c.name AS category_name
        FROM products p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.id = @id
      `);
    if (result.recordset.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;