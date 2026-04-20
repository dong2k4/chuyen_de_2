const express = require('express');
const router = express.Router();
const { getPool, sql } = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// POST /api/orders
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { address, payment_method, items } = req.body;
    const user_id = req.user.id;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Giỏ hàng trống' });
    }
    const pool = await getPool();
    const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const orderResult = await pool.request()
      .input('user_id', sql.Int, user_id)
      .input('total_amount', sql.Decimal(18, 2), total)
      .input('address', sql.NVarChar, address || '')
      .input('payment_method', sql.NVarChar, payment_method || 'COD')
      .query(`INSERT INTO orders (user_id, total_amount, address, payment_method)
              OUTPUT INSERTED.id
              VALUES (@user_id, @total_amount, @address, @payment_method)`);
    const order_id = orderResult.recordset[0].id;
    for (const item of items) {
      await pool.request()
        .input('order_id', sql.Int, order_id)
        .input('product_id', sql.Int, item.productId)
        .input('quantity', sql.Int, item.quantity)
        .input('price', sql.Decimal(18, 2), item.price)
        .query(`INSERT INTO order_items (order_id, product_id, quantity, price)
                VALUES (@order_id, @product_id, @quantity, @price)`);
    }
    res.status(201).json({ message: 'Đặt hàng thành công', orderId: order_id });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// GET /api/orders
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const result = await pool.request()
      .input('user_id', sql.Int, req.user.id)
      .query(`SELECT * FROM orders WHERE user_id = @user_id
              ORDER BY created_at DESC`);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

// GET /api/orders/:id
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const pool = await getPool();
    const order = await pool.request()
      .input('id', sql.Int, parseInt(req.params.id))
      .query('SELECT * FROM orders WHERE id = @id');
    const items = await pool.request()
      .input('order_id', sql.Int, parseInt(req.params.id))
      .query(`SELECT oi.*, p.name AS product_name
              FROM order_items oi
              JOIN products p ON oi.product_id = p.id
              WHERE oi.order_id = @order_id`);
    res.json({ ...order.recordset[0], items: items.recordset });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err.message });
  }
});

module.exports = router;