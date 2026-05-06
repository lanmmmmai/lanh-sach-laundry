import express from 'express';
import cors from 'cors';
import sqlite3Pkg from 'sqlite3';
const sqlite3 = sqlite3Pkg.verbose();
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir);
}

const db = new sqlite3.Database(path.join(dbDir, 'database.sqlite'), (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database.');
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT UNIQUE,
        password TEXT,
        role TEXT,
        name TEXT,
        branchId INTEGER
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS branches (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        address TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        price INTEGER,
        unit TEXT,
        category TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS customers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT UNIQUE,
        name TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        createdAt TEXT,
        staff TEXT,
        customerName TEXT,
        customerPhone TEXT,
        service TEXT,
        weight REAL,
        pricePerKg INTEGER,
        surcharge INTEGER,
        discount INTEGER,
        totalPrice INTEGER,
        paymentStatus TEXT,
        paymentMethod TEXT,
        status TEXT,
        returnDate TEXT,
        note TEXT
      )`);

      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (row && row.count === 0) {
          db.run('INSERT INTO users (email, password, role, name, branchId) VALUES (?, ?, ?, ?, ?)', 
            ['admin@test.com', '123', 'admin', 'Chủ Tiệm', null]
          );
        }
      });
    });
  }
});

const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function (err) {
    if (err) reject(err);
    else resolve(this);
  });
});

const getQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await getQuery('SELECT * FROM users');
    res.json(users);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await getQuery('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
    if (users.length > 0) res.json({ success: true, user: users[0] });
    else res.json({ success: false, message: 'Sai email hoặc mật khẩu' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/users', async (req, res) => {
  try {
    const { email, password, role, name, branchId } = req.body;
    const existing = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email đã tồn tại' });
    
    const result = await runQuery('INSERT INTO users (email, password, role, name, branchId) VALUES (?, ?, ?, ?, ?)', [email, password, role, name, branchId]);
    res.json({ id: result.lastID, email, password, role, name, branchId });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { password, name, branchId } = req.body;
    await runQuery('UPDATE users SET password = ?, name = ?, branchId = ? WHERE id = ?', [password, name, branchId, req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.get('/api/branches', async (req, res) => {
  const data = await getQuery('SELECT * FROM branches');
  res.json(data);
});
app.post('/api/branches', async (req, res) => {
  const { name, address } = req.body;
  const result = await runQuery('INSERT INTO branches (name, address) VALUES (?, ?)', [name, address]);
  res.json({ id: result.lastID, name, address });
});
app.put('/api/branches/:id', async (req, res) => {
  const { name, address } = req.body;
  await runQuery('UPDATE branches SET name = ?, address = ? WHERE id = ?', [name, address, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/branches/:id', async (req, res) => {
  await runQuery('DELETE FROM branches WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

app.get('/api/services', async (req, res) => {
  const data = await getQuery('SELECT * FROM services');
  res.json(data);
});
app.post('/api/services', async (req, res) => {
  const { name, price, unit, category } = req.body;
  const result = await runQuery('INSERT INTO services (name, price, unit, category) VALUES (?, ?, ?, ?)', [name, price, unit, category]);
  res.json({ id: result.lastID, name, price, unit, category });
});
app.put('/api/services/:id', async (req, res) => {
  const { name, price, unit, category } = req.body;
  await runQuery('UPDATE services SET name = ?, price = ?, unit = ?, category = ? WHERE id = ?', [name, price, unit, category, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/services/:id', async (req, res) => {
  await runQuery('DELETE FROM services WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});
app.post('/api/services/bulk', async (req, res) => {
  const services = req.body;
  await runQuery('DELETE FROM services');
  for (const s of services) {
    await runQuery('INSERT INTO services (name, price, unit, category) VALUES (?, ?, ?, ?)', [s.name, s.price, s.unit, s.category]);
  }
  res.json({ success: true });
});

app.get('/api/customers', async (req, res) => {
  const data = await getQuery('SELECT * FROM customers');
  res.json(data);
});
app.post('/api/customers', async (req, res) => {
  const { phone, name } = req.body;
  try {
    const result = await runQuery('INSERT INTO customers (phone, name) VALUES (?, ?)', [phone, name]);
    res.json({ id: result.lastID, phone, name });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/orders', async (req, res) => {
  const data = await getQuery('SELECT * FROM orders');
  res.json(data);
});
app.post('/api/orders', async (req, res) => {
  const o = req.body;
  await runQuery(`INSERT INTO orders (id, createdAt, staff, customerName, customerPhone, service, weight, pricePerKg, surcharge, discount, totalPrice, paymentStatus, paymentMethod, status, returnDate, note) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [o.id, o.createdAt, o.staff, o.customerName, o.customerPhone, o.service, o.weight, o.pricePerKg, o.surcharge, o.discount, o.totalPrice, o.paymentStatus, o.paymentMethod, o.status, o.returnDate, o.note]
  );
  res.json(o);
});
app.put('/api/orders/:id', async (req, res) => {
  const o = req.body;
  await runQuery(`UPDATE orders SET status = ?, paymentStatus = ?, paymentMethod = ? WHERE id = ?`, 
    [o.status, o.paymentStatus, o.paymentMethod, req.params.id]
  );
  res.json({ success: true });
});
app.delete('/api/orders/:id', async (req, res) => {
  await runQuery('DELETE FROM orders WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
