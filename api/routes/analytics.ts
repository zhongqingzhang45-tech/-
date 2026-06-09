import { Router } from 'express';
import db from '../db/index.js';

const router = Router();

// 获取仪表盘统计数据
router.get('/dashboard', (req, res) => {
  try {
    // 今日新增客户
    const todayCustomers = (db.prepare(`
      SELECT COUNT(*) as count FROM customers
      WHERE date(created_at) = date('now')
    `).get() as { count: number }).count;

    // 今日对话数
    const todayConversations = (db.prepare(`
      SELECT COUNT(*) as count FROM conversations
      WHERE date(started_at) = date('now')
    `).get() as { count: number }).count;

    // 今日订单数
    const todayOrders = (db.prepare(`
      SELECT COUNT(*) as count FROM orders
      WHERE date(paid_at) = date('now') AND status = 'paid'
    `).get() as { count: number }).count;

    // 今日成交金额
    const todayRevenue = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM orders
      WHERE date(paid_at) = date('now') AND status = 'paid'
    `).get() as { total: number }).total;

    // 总客户数
    const totalCustomers = (db.prepare(`
      SELECT COUNT(*) as count FROM customers
    `).get() as { count: number }).count;

    // 转化率 (有订单的客户/总客户)
    const customersWithOrders = (db.prepare(`
      SELECT COUNT(DISTINCT customer_id) as count FROM orders WHERE status = 'paid'
    `).get() as { count: number }).count;
    const conversionRate = totalCustomers > 0 ? (customersWithOrders / totalCustomers * 100).toFixed(1) : 0;

    // 高意向客户数
    const highIntentCustomers = (db.prepare(`
      SELECT COUNT(*) as count FROM customers WHERE level >= 3
    `).get() as { count: number }).count;

    res.json({
      success: true,
      data: {
        todayCustomers,
        todayConversations,
        todayOrders,
        todayRevenue,
        conversionRate,
        highIntentCustomers,
        totalCustomers,
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard stats' });
  }
});

// 获取漏斗数据
router.get('/funnel', (req, res) => {
  try {
    // 获客 -> 私聊 -> 筛选 -> 成交
    const stages = ['潜在客户', '已接待', '有意向', '已成交'];
    const counts = [
      (db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }).count,
      (db.prepare('SELECT COUNT(*) as count FROM conversations').get() as { count: number }).count,
      (db.prepare('SELECT COUNT(*) as count FROM customers WHERE level >= 2').get() as { count: number }).count,
      (db.prepare("SELECT COUNT(*) as count FROM orders WHERE status = 'paid'").get() as { count: number }).count,
    ];

    res.json({
      success: true,
      data: { stages, counts },
    });
  } catch (error) {
    console.error('Error fetching funnel data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch funnel data' });
  }
});

// 获取客户等级分布
router.get('/customer-levels', (req, res) => {
  try {
    const levels = db.prepare(`
      SELECT level, COUNT(*) as count
      FROM customers
      GROUP BY level
      ORDER BY level DESC
    `).all();

    res.json({
      success: true,
      data: levels,
    });
  } catch (error) {
    console.error('Error fetching customer levels:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer levels' });
  }
});

// 获取最近7天趋势数据
router.get('/trend', (req, res) => {
  try {
    const trend = db.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as customers,
        (SELECT COUNT(*) FROM conversations WHERE date(started_at) = date(c.created_at)) as conversations
      FROM customers c
      WHERE created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();

    res.json({
      success: true,
      data: trend,
    });
  } catch (error) {
    console.error('Error fetching trend data:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch trend data' });
  }
});

export default router;
