const fs = require('fs');
let content = fs.readFileSync('server/index.js', 'utf8');

content = content.replace(
  /app\.post\('\/api\/users\/bulk', async \(req, res\) => \{[\s\S]*?res\.json\(\{ success: true \}\);\n  \} catch \(error\) \{ res\.status\(500\)\.json\(\{ error: error\.message \}\); \}\n\}\);/,
  `app.post('/api/users/bulk', async (req, res) => {
  try {
    const users = req.body;
    for (const u of users) {
      const adminId = u.adminId || 1;
      const bIds = u.branchIds ? JSON.stringify(u.branchIds) : '[]';
      const existing = await getQuery("SELECT id FROM users WHERE email = ? OR name = ?", [u.email, u.name]);
      if (existing.length > 0) {
        await runQuery('UPDATE users SET password = ?, name = ?, branchId = ?, branchIds = ?, salaryType = ?, salaryRate = ?, adminId = ? WHERE id = ?', 
          [u.password, u.name, u.branchId || null, bIds, u.salaryType || 'parttime', u.salaryRate || 0, adminId, existing[0].id]);
      } else {
        await runQuery('INSERT INTO users (email, password, role, name, branchId, branchIds, salaryType, salaryRate, adminId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', 
          [u.email, u.password, 'staff', u.name, u.branchId || null, bIds, u.salaryType || 'parttime', u.salaryRate || 0, adminId]);
      }
    }
    res.json({ success: true });
  } catch (error) { res.status(500).json({ error: error.message }); }
});`
);

fs.writeFileSync('server/index.js', content);
