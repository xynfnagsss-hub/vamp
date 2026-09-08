import express from 'express';
import bodyParser from 'body-parser';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import licenseRoutes from './routes/license';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
app.use(helmet());
app.use(bodyParser.json());

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 60_000,
  max: Number(process.env.RATE_LIMIT_MAX) || 60
});
app.use(limiter);

app.use('/api/license', licenseRoutes);
app.use('/api/admin', adminRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

import './runtime/ws-runtime';

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`VAMP server listening on ${port}`));
