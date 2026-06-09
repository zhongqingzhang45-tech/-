import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// 获取话术模板列表
router.get('/', (req, res) => {
  try {
    const { category } = req.query;

    let query = 'SELECT * FROM templates';
    const params: string[] = [];

    if (category) {
      query += ' WHERE category = ?';
      params.push(category as string);
    }

    query += ' ORDER BY created_at DESC';

    const items = db.prepare(query).all(...params);

    res.json({
      success: true,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch templates' });
  }
});

// 添加话术模板
router.post('/', (req, res) => {
  try {
    const { name, content, category } = req.body;

    const result = db.prepare(`
      INSERT INTO templates (name, content, category) VALUES (?, ?, ?)
    `).run(name, content, category || '通用');

    const item = db.prepare('SELECT * FROM templates WHERE id = ?').get(result.lastInsertRowid);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error adding template:', error);
    res.status(500).json({ success: false, error: 'Failed to add template' });
  }
});

// 更新话术模板
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, category } = req.body;

    db.prepare(`
      UPDATE templates SET name = ?, content = ?, category = ? WHERE id = ?
    `).run(name, content, category, id);

    const item = db.prepare('SELECT * FROM templates WHERE id = ?').get(id);

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, error: 'Failed to update template' });
  }
});

// 删除话术模板
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    db.prepare('DELETE FROM templates WHERE id = ?').run(id);

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete template' });
  }
});

export default router;
