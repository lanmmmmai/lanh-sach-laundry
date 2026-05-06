const fs = require('fs');

let content = fs.readFileSync('server/index.js', 'utf8');

// Update all GET endpoints to filter by adminId
content = content.replace(
  /app\.get\('\/api\/(shifts|shift-templates|branches|services|customers|orders)', async \(req, res\) => \{\n\s+const data = await getQuery\('SELECT \* FROM \w+'\);\n\s+res\.json\(data\);\n\}\);/g,
  (match, p1) => {
    const table = p1.replace('-', '_'); // shift-templates -> shift_templates
    return `app.get('/api/${p1}', async (req, res) => {\n  const adminId = req.query.adminId || 1;\n  const data = await getQuery('SELECT * FROM ${table === 'shift-templates' ? 'shift_templates' : table} WHERE adminId = ?', [adminId]);\n  res.json(data);\n});`;
  }
);

// We need to also manually replace POST/PUT endpoints to include adminId
// Too complex with regex. Let's just output the file and write a script to replace the whole block.
