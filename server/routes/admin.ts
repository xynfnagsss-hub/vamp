import express from 'express';
import { createLicense, listLicenses, revokeLicense, resetDevice } from '../licenses';

const router = express.Router();

router.post('/licenses', (req, res) => {
  try {
    const { duration, deviceLimit } = req.body;
    const lic = createLicense(duration || '1y', deviceLimit || 3);
    return res.json({ ok: true, license: lic });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

router.get('/licenses', (req, res) => {
  try {
    const results = listLicenses();
    return res.json({ ok: true, licenses: results });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

router.post('/licenses/:id/revoke', (req, res) => {
  try {
    revokeLicense(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

router.post('/licenses/:id/reset-device', (req, res) => {
  try {
    resetDevice(req.params.id);
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'server_error' });
  }
});

export default router;
