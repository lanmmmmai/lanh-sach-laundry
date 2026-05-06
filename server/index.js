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

      // Add new columns if they don't exist
      db.run("ALTER TABLE users ADD COLUMN branchIds TEXT", (err) => {});
      db.run("ALTER TABLE users ADD COLUMN salaryType TEXT", (err) => {});
      db.run("ALTER TABLE users ADD COLUMN salaryRate INTEGER", (err) => {});

      db.run(`CREATE TABLE IF NOT EXISTS shifts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        staffId INTEGER,
        branchId INTEGER,
        date TEXT,
        startTime TEXT,
        endTime TEXT,
        actualStartTime TEXT,
        actualEndTime TEXT,
        status TEXT,
        shiftName TEXT
      )`);

      db.run(`CREATE TABLE IF NOT EXISTS shift_templates (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        startTime TEXT,
        endTime TEXT
      )`);

      db.run("ALTER TABLE shifts ADD COLUMN shiftName TEXT", (err) => {});

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
        note TEXT,
        branchId INTEGER
      )`);

      db.run("ALTER TABLE orders ADD COLUMN branchId INTEGER", (err) => {});

      db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
        if (row && row.count === 0) {
          db.run('INSERT INTO users (email, password, role, name, branchIds, salaryType) VALUES (?, ?, ?, ?, ?, ?)', 
            ['admin@test.com', '123', 'admin', 'Chủ Tiệm', '[]', 'fulltime']
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
    const { email, password, role, name, branchId, branchIds, salaryType, salaryRate } = req.body;
    const existing = await getQuery('SELECT * FROM users WHERE email = ?', [email]);
    if (existing.length > 0) return res.status(400).json({ error: 'Email đã tồn tại' });
    
    const bIds = branchIds ? JSON.stringify(branchIds) : '[]';
    const result = await runQuery('INSERT INTO users (email, password, role, name, branchId, branchIds, salaryType, salaryRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [email, password, role, name, branchId, bIds, salaryType || 'parttime', salaryRate || 0]);
    res.json({ id: result.lastID, email, password, role, name, branchId, branchIds: JSON.parse(bIds), salaryType, salaryRate });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { password, name, branchId, branchIds, salaryType, salaryRate } = req.body;
    const bIds = branchIds ? JSON.stringify(branchIds) : '[]';
    await runQuery('UPDATE users SET password = ?, name = ?, branchId = ?, branchIds = ?, salaryType = ?, salaryRate = ? WHERE id = ?', 
      [password, name, branchId, bIds, salaryType, salaryRate, req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    await runQuery('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/users/bulk', async (req, res) => {
  try {
    const users = req.body;
    for (const u of users) {
      const bIds = u.branchIds ? JSON.stringify(u.branchIds) : '[]';
      const existing = await getQuery("SELECT id FROM users WHERE email = ? OR name = ?", [u.email, u.name]);
      if (existing.length > 0) {
        await runQuery('UPDATE users SET password = ?, name = ?, branchId = ?, branchIds = ?, salaryType = ?, salaryRate = ? WHERE id = ?', 
          [u.password, u.name, u.branchId || null, bIds, u.salaryType || 'parttime', u.salaryRate || 0, existing[0].id]);
      } else {
        await runQuery('INSERT INTO users (email, password, role, name, branchId, branchIds, salaryType, salaryRate) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
          [u.email, u.password, 'staff', u.name, u.branchId || null, bIds, u.salaryType || 'parttime', u.salaryRate || 0]);
      }
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// SHIFTS
app.get('/api/shifts', async (req, res) => {
  const data = await getQuery('SELECT * FROM shifts');
  res.json(data);
});
app.post('/api/shifts', async (req, res) => {
  const { staffId, branchId, date, startTime, endTime, status, shiftName } = req.body;
  const result = await runQuery('INSERT INTO shifts (staffId, branchId, date, startTime, endTime, status, shiftName) VALUES (?, ?, ?, ?, ?, ?, ?)', 
    [staffId, branchId, date, startTime, endTime, status || 'Pending', shiftName || '']);
  res.json({ id: result.lastID, staffId, branchId, date, startTime, endTime, status, shiftName });
});
app.put('/api/shifts/:id', async (req, res) => {
  const { actualStartTime, actualEndTime, status } = req.body;
  await runQuery('UPDATE shifts SET actualStartTime = ?, actualEndTime = ?, status = ? WHERE id = ?', 
    [actualStartTime, actualEndTime, status, req.params.id]);
  res.json({ success: true });
});
app.delete('/api/shifts/:id', async (req, res) => {
  await runQuery('DELETE FROM shifts WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});

// SHIFT TEMPLATES
app.get('/api/shift-templates', async (req, res) => {
  const data = await getQuery('SELECT * FROM shift_templates');
  res.json(data);
});
app.post('/api/shift-templates', async (req, res) => {
  const { name, startTime, endTime } = req.body;
  const result = await runQuery('INSERT INTO shift_templates (name, startTime, endTime) VALUES (?, ?, ?)', 
    [name, startTime, endTime]);
  res.json({ id: result.lastID, name, startTime, endTime });
});
app.delete('/api/shift-templates/:id', async (req, res) => {
  await runQuery('DELETE FROM shift_templates WHERE id = ?', [req.params.id]);
  res.json({ success: true });
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
app.post('/api/branches/bulk', async (req, res) => {
  const branches = req.body;
  for (const b of branches) {
    const existing = await getQuery('SELECT id FROM branches WHERE name = ?', [b.name]);
    if (existing.length > 0) {
      await runQuery('UPDATE branches SET address = ? WHERE id = ?', [b.address, existing[0].id]);
    } else {
      await runQuery('INSERT INTO branches (name, address) VALUES (?, ?)', [b.name, b.address]);
    }
  }
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
  for (const s of services) {
    const existing = await getQuery('SELECT id FROM services WHERE name = ?', [s.name]);
    if (existing.length > 0) {
      await runQuery('UPDATE services SET price = ?, unit = ?, category = ? WHERE id = ?', [s.price, s.unit, s.category, existing[0].id]);
    } else {
      await runQuery('INSERT INTO services (name, price, unit, category) VALUES (?, ?, ?, ?)', [s.name, s.price, s.unit, s.category]);
    }
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
  await runQuery(`INSERT INTO orders (id, createdAt, staff, customerName, customerPhone, service, weight, pricePerKg, surcharge, discount, totalPrice, paymentStatus, paymentMethod, status, returnDate, note, branchId) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
    [o.id, o.createdAt, o.staff, o.customerName, o.customerPhone, o.service, o.weight, o.pricePerKg, o.surcharge, o.discount, o.totalPrice, o.paymentStatus, o.paymentMethod, o.status, o.returnDate, o.note, o.branchId || null]
  );
  res.json(o);
});
app.put('/api/orders/:id', async (req, res) => {
  const o = req.body;
  await runQuery(`UPDATE orders SET status = ?, paymentStatus = ?, paymentMethod = ?, branchId = ? WHERE id = ?`, 
    [o.status, o.paymentStatus, o.paymentMethod, o.branchId || null, req.params.id]
  );
  res.json({ success: true });
});
app.delete('/api/orders/:id', async (req, res) => {
  await runQuery('DELETE FROM orders WHERE id = ?', [req.params.id]);
  res.json({ success: true });
});
app.post('/api/orders/bulk', async (req, res) => {
  const orders = req.body;
  for (const o of orders) {
    // Basic check to see if exists
    const existing = await getQuery('SELECT id FROM orders WHERE id = ?', [o.id]);
    if (existing.length > 0) {
      await runQuery(`UPDATE orders SET createdAt = ?, staff = ?, customerName = ?, customerPhone = ?, service = ?, weight = ?, pricePerKg = ?, surcharge = ?, discount = ?, totalPrice = ?, paymentStatus = ?, paymentMethod = ?, status = ?, returnDate = ?, note = ?, branchId = ? WHERE id = ?`, 
        [o.createdAt, o.staff, o.customerName, o.customerPhone, o.service, o.weight, o.pricePerKg, o.surcharge, o.discount, o.totalPrice, o.paymentStatus, o.paymentMethod, o.status, o.returnDate, o.note, o.branchId || null, o.id]
      );
    } else {
      await runQuery(`INSERT INTO orders (id, createdAt, staff, customerName, customerPhone, service, weight, pricePerKg, surcharge, discount, totalPrice, paymentStatus, paymentMethod, status, returnDate, note, branchId) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
        [o.id, o.createdAt, o.staff, o.customerName, o.customerPhone, o.service, o.weight, o.pricePerKg, o.surcharge, o.discount, o.totalPrice, o.paymentStatus, o.paymentMethod, o.status, o.returnDate, o.note, o.branchId || null]
      );
    }
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});
