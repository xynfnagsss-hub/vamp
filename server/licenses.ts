import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import store from './store';
import { v4 as uuidv4 } from 'uuid';

function generateKey(): string {
  const bytes = crypto.randomBytes(10);
  const parts: string[] = [];
  for (let i = 0; i < 4; i++) {
    parts.push(bytes.slice(i * 2, i * 2 + 2).toString('hex').toUpperCase());
  }
  return `VAMP-${parts.join('-')}`;
}

function hashKey(key: string) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(key, salt, 200000, 64, 'sha512').toString('hex');
  return { salt, hash };
}

export function createLicense(duration: '1d' | '1w' | '1y' | 'lifetime', deviceLimit = 3) {
  const key = generateKey();
  const id = uuidv4();
  const created = new Date().toISOString();
  let expires: string | null = null;
  if (duration === '1d') expires = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
  if (duration === '1w') expires = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
  if (duration === '1y') expires = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString();
  const { salt, hash } = hashKey(key);
  const lic = { id, key_hash: hash, salt, created_at: created, expires_at: expires, duration, status: 'active', activation_count: 0, device_limit: deviceLimit, last_activation_at: null, last_device_info: null };
  store.withStore((s:any)=>{ s.licenses.unshift(lic); return lic; });
  return { id, key, created, expires, duration };
}

export function findLicenseByKey(key: string) {
  const s = store.load();
  for (const r of s.licenses) {
    const hash = crypto.pbkdf2Sync(key, r.salt, 200000, 64, 'sha512').toString('hex');
    if (hash === r.key_hash) return r;
  }
  return null;
}

export function getLicenseById(id: string) {
  const s = store.load();
  return s.licenses.find((l:any)=>l.id===id) || null;
}

export function listLicenses() {
  const s = store.load();
  return s.licenses.map((l:any)=>({ id: l.id, created_at: l.created_at, expires_at: l.expires_at, duration: l.duration, status: l.status, activation_count: l.activation_count }));
}

export function revokeLicense(id: string) {
  store.withStore((s:any)=>{ const l = s.licenses.find((x:any)=>x.id===id); if (l) l.status='revoked'; s.audit_logs.unshift({ id: uuidv4(), action:'revoke', details:id, created_at:new Date().toISOString() }); return null; });
}

export function activateLicense(id: string, deviceInfo: string) {
  const s = store.load();
  const lic = s.licenses.find((x:any)=>x.id===id);
  if (!lic) throw new Error('Not found');
  if (lic.status !== 'active') throw new Error('License not active');
  if (lic.expires_at && new Date(lic.expires_at) < new Date()) throw new Error('Expired');
  const actId = uuidv4();
  s.activations.unshift({ id: actId, license_id: id, device_info: deviceInfo, activated_at: new Date().toISOString() });
  lic.activation_count = (lic.activation_count || 0) + 1;
  lic.last_activation_at = new Date().toISOString();
  lic.last_device_info = deviceInfo;
  s.audit_logs.unshift({ id: uuidv4(), action:'activate', details:`${id}|${deviceInfo}`, created_at: new Date().toISOString() });
  store.save(s);
  return { activated: true };
}

export function resetDevice(id: string) {
  store.withStore((s:any)=>{ s.activations = s.activations.filter((a:any)=>a.license_id !== id); const l = s.licenses.find((x:any)=>x.id===id); if (l) { l.activation_count=0; l.last_device_info=null;} s.audit_logs.unshift({ id: uuidv4(), action:'reset-device', details:id, created_at:new Date().toISOString() }); return null; });
}
