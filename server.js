import express from 'express';
import cors from 'cors';
import { execSync } from 'child_process';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Path to a local backup of leads in case team-db fails or isn't available
const LEADS_FILE = path.join(__dirname, 'leads.json');

app.post('/api/leads', (req, res) => {
  const { name, email, service, message } = req.body;
  const id = uuidv4();
  const timestamp = new Date().toISOString();
  
  const leadData = { id, name, email, service, message, created_at: timestamp };

  // 1. Try saving to team-db
  try {
    const sql = `INSERT INTO leads (id, name, email, service, message) VALUES ('${id}', '${name.replace(/'/g, "''")}', '${email.replace(/'/g, "''")}', '${service.replace(/'/g, "''")}', '${message.replace(/'/g, "''")}')`;
    execSync(`team-db "${sql}"`);
    console.log(`Lead ${id} saved to team-db`);
  } catch (error) {
    console.warn('team-db sync failed, falling back to local storage:', error.message);
  }

  // 2. Always save to local backup
  try {
    let leads = [];
    if (fs.existsSync(LEADS_FILE)) {
      const content = fs.readFileSync(LEADS_FILE, 'utf8');
      leads = JSON.parse(content);
    }
    leads.push(leadData);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
  } catch (err) {
    console.error('Local storage failed:', err.message);
  }

  res.status(200).json({ success: true, id });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Server listening on port ${PORT}`);
});
