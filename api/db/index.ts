import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, '../../data/marketing.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

// Initialize database schema
db.exec(`
  -- 客户表
  CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT UNIQUE NOT NULL,
    nickname TEXT,
    avatar TEXT,
    level INTEGER DEFAULT 0,
    tags TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 对话表
  CREATE TABLE IF NOT EXISTS conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  -- 消息表
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conversation_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    direction TEXT NOT NULL,
    source TEXT DEFAULT 'ai',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
  );

  -- 订单表
  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status TEXT DEFAULT 'pending',
    payment_method TEXT,
    paid_at DATETIME,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
  );

  -- 知识库表
  CREATE TABLE IF NOT EXISTS knowledge_base (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    category TEXT,
    priority INTEGER DEFAULT 0
  );

  -- 流程节点表
  CREATE TABLE IF NOT EXISTS flow_nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,
    config TEXT,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0
  );

  -- 话术模板表
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- 索引
  CREATE INDEX IF NOT EXISTS idx_customers_openid ON customers(openid);
  CREATE INDEX IF NOT EXISTS idx_conversations_customer ON conversations(customer_id);
  CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
  CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
`);

// Insert sample data if tables are empty
const customerCount = db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number };
if (customerCount.count === 0) {
  // Insert sample customers
  const insertCustomer = db.prepare(`
    INSERT INTO customers (openid, nickname, avatar, level, tags) VALUES (?, ?, ?, ?, ?)
  `);

  const customers = [
    ['wx_001', '张伟', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Zhang', 3, '高意向,已购买'],
    ['wx_002', '李娜', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Li', 2, '中意向'],
    ['wx_003', '王强', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Wang', 1, '低意向'],
    ['wx_004', '刘芳', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liu', 3, '高意向,已购买'],
    ['wx_005', '陈明', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chen', 2, '中意向,咨询中'],
  ];

  customers.forEach(c => insertCustomer.run(...c));

  // Insert sample conversations and messages
  const insertConversation = db.prepare(`
    INSERT INTO conversations (customer_id, status) VALUES (?, ?)
  `);
  const insertMessage = db.prepare(`
    INSERT INTO messages (conversation_id, content, direction, source) VALUES (?, ?, ?, ?)
  `);

  // Customer 1 - has conversation
  const conv1 = db.prepare('SELECT id FROM conversations WHERE customer_id = 1').get();
  if (!conv1) {
    const conv1Result = insertConversation.run(1, 'active');
    insertMessage.run(conv1Result.lastInsertRowid, '你好，我想了解一下产品', 'in', 'customer');
    insertMessage.run(conv1Result.lastInsertRowid, '您好！欢迎咨询，我们的产品可以帮助您...', 'out', 'ai');
  }

  // Insert sample orders
  const insertOrder = db.prepare(`
    INSERT INTO orders (customer_id, amount, status, payment_method, paid_at) VALUES (?, ?, ?, ?, ?)
  `);

  insertOrder.run(1, 299.00, 'paid', 'wechat', '2024-01-15 10:30:00');
  insertOrder.run(4, 599.00, 'paid', 'alipay', '2024-01-14 15:20:00');

  // Insert sample knowledge base
  const insertKnowledge = db.prepare(`
    INSERT INTO knowledge_base (question, answer, category, priority) VALUES (?, ?, ?, ?)
  `);

  insertKnowledge.run('产品价格', '我们的产品有三个版本：基础版299元，专业版599元，企业版1299元。', '价格', 10);
  insertKnowledge.run('如何购买', '您可以直接点击购买链接，或者添加客服微信进行人工下单。', '购买', 9);
  insertKnowledge.run('有什么优惠', '现在购买可以享受8折优惠，同时赠送价值199元的增值服务。', '优惠', 8);
  insertKnowledge.run('售后服务', '我们提供7x24小时在线客服，30天无理由退款保证。', '售后', 7);

  // Insert sample templates
  const insertTemplate = db.prepare(`
    INSERT INTO templates (name, content, category) VALUES (?, ?, ?)
  `);

  insertTemplate.run('欢迎语', '您好！我是AI智能助手，很高兴为您服务。请问有什么可以帮您的？', '开场');
  insertTemplate.run('产品介绍', '我们是一款专业的营销自动化工具，可以帮助您自动获客、自动回复、自动成交，让您的业务效率提升10倍！', '产品');
  insertTemplate.run('催单话术', '您好，您之前咨询的产品还在活动中，现在购买可以享受8折优惠，名额有限，要抓紧哦～', '跟进');
}

export default db;
