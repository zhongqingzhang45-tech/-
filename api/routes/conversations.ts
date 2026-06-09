import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// 获取客户对话列表
router.get('/:customerId', (req, res) => {
  try {
    const { customerId } = req.params;

    const conversations = db.prepare(`
      SELECT * FROM conversations WHERE customer_id = ? ORDER BY started_at DESC
    `).all(customerId);

    const messages: Record<number, any[]> = {};

    conversations.forEach((conv: any) => {
      messages[conv.id] = db.prepare(`
        SELECT * FROM messages WHERE conversation_id = ? ORDER BY created_at ASC
      `).all(conv.id);
    });

    res.json({
      success: true,
      data: { list: conversations, messages },
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
});

// 创建新对话
router.post('/', (req, res) => {
  try {
    const { customerId } = req.body;

    const result = db.prepare(`
      INSERT INTO conversations (customer_id, status) VALUES (?, 'active')
    `).run(customerId);

    res.json({
      success: true,
      data: { id: result.lastInsertRowid },
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, error: 'Failed to create conversation' });
  }
});

// 发送消息
router.post('/message', (req, res) => {
  try {
    const { conversationId, content, direction = 'out', source = 'manual' } = req.body;

    const result = db.prepare(`
      INSERT INTO messages (conversation_id, content, direction, source) VALUES (?, ?, ?, ?)
    `).run(conversationId, content, direction, source);

    const message = db.prepare('SELECT * FROM messages WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      data: message,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
});

export default router;
