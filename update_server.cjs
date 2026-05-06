const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

// Update GET endpoints
content = content.replace(
  /app\.get\('\/api\/(shifts|shift-templates|branches|services|customers|orders)', async \(req, res\) => \{\n\s+const data = await getQuery\('SELECT \* FROM \w+'\);\n\s+res\.json\(data\);\n\}\);/g,
  (match, p1) => {
    const table = p1.replace('-', '_');
    return `app.get('/api/${p1}', async (req, res) => {\n  const adminId = req.query.adminId || 1;\n  const data = await getQuery('SELECT * FROM ${table} WHERE adminId = ?', [adminId]);\n  res.json(data);\n});`;
  }
);

// We need to also manually replace POST/PUT endpoints to include adminId
// Too complex with regex. I will do multi replace for POST/PUT.
fs.writeFileSync('server/index.js', content);
