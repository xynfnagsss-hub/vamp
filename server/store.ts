import fs from 'fs';
import path from 'path';

const STORE_PATH = process.env.DB_PATH || path.join(__dirname, '../data/store.json');
const dir = path.dirname(STORE_PATH);
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

function load() {
  try {
    const raw = fs.readFileSync(STORE_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (e) {
    return { licenses: [], activations: [], audit_logs: [], trusted_tokens: [] };
  }
}

function save(data: any) {
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), 'utf8');
}

export function withStore(fn: (s: any) => any) {
  const s = load();
  const res = fn(s);
  save(s);
  return res;
}

export default { load, save, withStore };
