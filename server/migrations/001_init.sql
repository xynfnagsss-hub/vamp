-- migrations for vamp license DB
CREATE TABLE IF NOT EXISTS licenses (
  id TEXT PRIMARY KEY,
  key_hash TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT,
  duration TEXT NOT NULL,
  status TEXT NOT NULL,
  activation_count INTEGER DEFAULT 0,
  device_limit INTEGER DEFAULT 1,
  last_activation_at TEXT,
  last_device_info TEXT
);

CREATE TABLE IF NOT EXISTS activations (
  id TEXT PRIMARY KEY,
  license_id TEXT NOT NULL,
  device_info TEXT,
  activated_at TEXT NOT NULL,
  FOREIGN KEY(license_id) REFERENCES licenses(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  details TEXT,
  created_at TEXT NOT NULL
);
