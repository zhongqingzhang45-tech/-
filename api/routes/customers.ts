import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// 获取客户列表
router.get('/', (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', level } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];

    if (search) {
      query += ' AND (nickname LIKE ? OR openid LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    if (level !== undefined && level !== '') {
      query += ' AND level = ?';
      params.push(Number(level));
    }

    const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as count');
    const total = (db.prepare(countQuery).get(...params) as { count: number }).count;

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(limit), offset);

    const customers = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: {
        list: customers,
        total,
        page: Number(page),
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// 获取客户详情
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!customer) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const conversations = db.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM messages WHERE conversation_id = c.id) as message_count
      FROM conversations c
      WHERE c.customer_id = ?
      ORDER BY c.started_at DESC
    `).all(id);

    const orders = db.prepare('SELECT * FROM orders WHERE customer_id = ? ORDER BY paid_at DESC').all(id);

    res.json({
      success: true,
      data: { customer, conversations, orders },
    });
  } catch (error) {
    console.error('Error fetching customer detail:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer detail' });
  }
});

// 更新客户标签
router.put('/:id/tags', (req, res) => {
  try {
    const { id } = req.params;
    const { tags } = req.body;

    db.prepare('UPDATE customers SET tags = ? WHERE id = ?').run(tags.join(','), id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating customer tags:', error);
    res.status(500).json({ success: false, error: 'Failed to update tags' });
  }
});

// 更新客户等级
router.put('/:id/level', (req, res) => {
  try {
    const { id } = req.params;
    const { level } = req.body;

    db.prepare('UPDATE customers SET level = ? WHERE id = ?').run(level, id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating customer level:', error);
    res.status(500).json({ success: false, error: 'Failed to update level' });
  }
});

export default router;
