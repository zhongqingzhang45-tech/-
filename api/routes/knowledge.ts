import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// 获取知识库列表
router.get('/', (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM knowledge_base';
    const params: string[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category as string);
    }

    query += ' ORDER BY priority DESC, id ASC';

    const items = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching knowledge base:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch knowledge base' });
  }
});

// 添加知识
router.post('/', (req, res) => {
  try {
    const { question, answer, category, priority = 0 } = req.body;

    const result = db.prepare(`
      INSERT INTO knowledge_base (question, answer, category, priority) VALUES (?, ?, ?, ?)
    `).run(question, answer, category || '通用', priority);

    const item = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error adding knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to add knowledge' });
  }
});

// 更新知识
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { question, answer, category, priority } = req.body;

    db.prepare(`
      UPDATE knowledge_base SET question = ?, answer = ?, category = ?, priority = ? WHERE id = ?
    `).run(question, answer, category, priority, id);

    const item = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(id);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error updating knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to update knowledge' });
  }
});

// 删除知识
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to delete knowledge' });
  }
});

// 搜索知识库
router.get('/search', (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const items = db.prepare(`
      SELECT * FROM knowledge_base
      WHERE question LIKE ? OR answer LIKE ?
      ORDER BY priority DESC
      LIMIT 5
    `).all(`%${q}%`, `%${q}%`);

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error searching knowledge:', error);
    res.status(500).json({ success: false, error: 'Failed to search knowledge' });
  }
});

export default router;
