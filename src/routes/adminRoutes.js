const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

router.use(authenticateToken, requireAdmin);

// POST /api/admin/products
router.post('/products', async (req, res) => {
  try {
    const { name, price, description, image_url, stock, category_id, is_popular } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(18, 2), price)
      .input('description', sql.NVarChar, description || '')
      .input('image_url', sql.NVarChar, image_url || '')
      .input('stock', sql.Int, stock || 0)
      .input('category_id', sql.Int, category_id)
      .input('is_popular', sql.Bit, is_popular ? 1 : 0)
      .query(`INSERT INTO products
              (name, price, description, image_url, stock, category_id, is_popular)
              VALUES (@name, @price, @description, @image_url, @stock, @category_id, @is_popular)`);
    res.status(201).json({ message: 'Thêm sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// PUT /api/admin/products/:id
router.put('/products/:id', async (req, res) => {
  try {
    const { name, price, description, image_url, stock, category_id, is_popular } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .input('name', sql.NVarChar, name)
      .input('price', sql.Decimal(18, 2), price)
      .input('description', sql.NVarChar, description || '')
      .input('image_url', sql.NVarChar, image_url || '')
      .input('stock', sql.Int, stock || 0)
      .input('category_id', sql.Int, category_id)
      .input('is_popular', sql.Bit, is_popular ? 1 : 0)
      .query(`UPDATE products SET
              name=@name, price=@price, description=@description,
              image_url=@image_url, stock=@stock,
              category_id=@category_id, is_popular=@is_popular
              WHERE id=@id`);
    res.json({ message: 'Cập nhật sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// DELETE /api/admin/products/:id
router.delete('/products/:id', async (req, res) => {
  try {
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('DELETE FROM products WHERE id = @id');
    res.json({ message: 'Xóa sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/orders/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const pool = await getPool();
    await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .input('status', sql.NVarChar, status)
      .query('UPDATE orders SET status = @status WHERE id = @id');
    res.json({ message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;