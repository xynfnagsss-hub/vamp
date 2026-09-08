import express from 'express';
import { findLicenseByKey, activateLicense } from '../licenses';

const router = express.Router();

router.post('/activate', async (req, res) => {
  try {
    const { key, deviceInfo } = req.body;
    const lic = findLicenseByKey(key);
    if (!lic) return res.status(404).json({ error: 'invalid' });
    if (lic.status !== 'active') return res.status(400).json({ error: 'not_active' });
    if (lic.expires_at && new Date(lic.expires_at) < new Date()) return res.status(400).json({ error: 'expired' });
    activateLicense(lic.id, deviceInfo || 'unknown');
    return res.json({ ok: true, id: lic.id, expires_at: lic.expires_at });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'server_error' });
  }
});

router.post('/validate', async (req, res) => {
  try {
    const { key } = req.body;
    const lic = findLicenseByKey(key);
    if (!lic) return res.status(404).json({ valid: false });
    if (lic.status !== 'active') return res.json({ valid: false, reason: 'not_active' });
    if (lic.expires_at && new Date(lic.expires_at) < new Date()) return res.json({ valid: false, reason: 'expired' });
    return res.json({ valid: true, id: lic.id, expires_at: lic.expires_at });
  } catch (err) {
    return res.status(500).json({ valid: false, error: 'server_error' });
  }
});

router.post('/revoke', async (req, res) => {
  return res.status(501).json({ error: 'not_implemented' });
});

router.post('/reset-device', async (req, res) => {
  return res.status(501).json({ error: 'not_implemented' });
});

export default router;
