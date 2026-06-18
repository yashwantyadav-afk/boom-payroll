-- boom Payroll (India) — PostgreSQL schema
-- Run via:  npm run migrate   (scripts/migrate.js executes this file)

CREATE TABLE IF NOT EXISTS plants (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS departments (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS banks (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL
);

-- Statutory + system configuration as key/value JSON (versionable).
CREATE TABLE IF NOT EXISTS config (
  key         TEXT PRIMARY KEY,
  value       JSONB NOT NULL,
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  username      TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL,                 -- sysadmin|payroll|hr|manager|finance|ess
  name          TEXT,
  plant         TEXT REFERENCES plants(code),  -- null = all plants
  emp_id        INTEGER,                       -- for ESS self-scope
  contractor    TEXT,                          -- for contractor-portal scope (contractor code)
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contractors (
  id           SERIAL PRIMARY KEY,
  code         TEXT UNIQUE NOT NULL,
  name         TEXT NOT NULL,
  addr1        TEXT, addr2 TEXT,
  state        TEXT, city TEXT, pin TEXT,
  reg_no       TEXT, tan TEXT, pan TEXT, gst TEXT,
  license_no   TEXT, license_valid_to DATE,    -- CLRA licence tracking
  bank_name    TEXT, bank_acc TEXT, ifsc TEXT,
  contact_name TEXT, contact_no TEXT, email TEXT,
  plant        TEXT REFERENCES plants(code),
  dept         TEXT REFERENCES departments(code),
  sap_code     TEXT,
  photo_ref    TEXT,
  status       TEXT NOT NULL DEFAULT 'Active',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS employees (
  id            SERIAL PRIMARY KEY,
  emp_code      TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT,
  ctc           NUMERIC(14,2) NOT NULL DEFAULT 0,
  state         TEXT,                            -- work state (PT)
  plant         TEXT REFERENCES plants(code),
  dept          TEXT REFERENCES departments(code),
  contractor_id INTEGER REFERENCES contractors(id),
  bank_id       TEXT REFERENCES banks(id),
  bank_acc      TEXT, ifsc TEXT,
  gender        TEXT, dob DATE, doj DATE, marital TEXT,
  mobile        TEXT, email TEXT,
  grade         TEXT, category TEXT, skill TEXT, func_area TEXT,
  qual          TEXT, country TEXT, state_code TEXT, city_code TEXT,
  pan           TEXT, uan TEXT,
  aadhaar_ref   TEXT,                            -- tokenised reference, never raw Aadhaar
  sap_code      TEXT,
  regime        TEXT,                            -- null=use global default
  decl80c       NUMERIC(12,2) DEFAULT 0,
  photo_ref     TEXT,
  active        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_emp_plant ON employees(plant);
CREATE INDEX IF NOT EXISTS idx_emp_contractor ON employees(contractor_id);
CREATE INDEX IF NOT EXISTS idx_emp_name ON employees(name);

CREATE TABLE IF NOT EXISTS attendance (
  emp_id       INTEGER NOT NULL REFERENCES employees(id),
  period_month TEXT NOT NULL,
  period_year  INTEGER NOT NULL,
  total_days   INTEGER NOT NULL DEFAULT 30,
  lop          NUMERIC(5,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (emp_id, period_month, period_year)
);

CREATE TABLE IF NOT EXISTS leave_balances (
  emp_id   INTEGER NOT NULL REFERENCES employees(id),
  type     TEXT NOT NULL,
  accrued  NUMERIC(6,2) NOT NULL DEFAULT 0,
  used     NUMERIC(6,2) NOT NULL DEFAULT 0,
  enc      NUMERIC(6,2) NOT NULL DEFAULT 0,
  PRIMARY KEY (emp_id, type)
);

CREATE TABLE IF NOT EXISTS payroll_runs (
  id           SERIAL PRIMARY KEY,
  period_month TEXT NOT NULL,
  period_year  INTEGER NOT NULL,
  status       TEXT NOT NULL DEFAULT 'Draft',   -- Draft|Locked|Paid
  run_by       INTEGER REFERENCES users(id),
  run_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  totals       JSONB
);

CREATE TABLE IF NOT EXISTS payslips (
  id        SERIAL PRIMARY KEY,
  run_id    INTEGER NOT NULL REFERENCES payroll_runs(id),
  emp_id    INTEGER NOT NULL REFERENCES employees(id),
  net       NUMERIC(14,2) NOT NULL DEFAULT 0,
  breakdown JSONB NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_payslip_run ON payslips(run_id);

CREATE TABLE IF NOT EXISTS challans (
  id            SERIAL PRIMARY KEY,
  contractor_id INTEGER REFERENCES contractors(id),
  type          TEXT NOT NULL,                  -- PF|ESI|LWF|PT
  period_month  TEXT, period_year INTEGER,
  no            TEXT NOT NULL,
  amount        NUMERIC(14,2) NOT NULL DEFAULT 0,
  paid_date     DATE,
  status        TEXT NOT NULL DEFAULT 'Paid',
  doc_ref       TEXT,                           -- document reference (object storage)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_challan_contractor ON challans(contractor_id);

-- Object-storage metadata. Files themselves live on disk/S3; DB holds only refs.
CREATE TABLE IF NOT EXISTS documents (
  id          SERIAL PRIMARY KEY,
  owner_type  TEXT NOT NULL,                    -- employee|contractor|challan
  owner_id    INTEGER NOT NULL,
  doc_type    TEXT,
  filename    TEXT,
  storage_ref TEXT NOT NULL,
  mime        TEXT,
  size        INTEGER,
  uploaded_by INTEGER REFERENCES users(id),
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_doc_owner ON documents(owner_type, owner_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id     SERIAL PRIMARY KEY,
  ts     TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor  TEXT,
  action TEXT NOT NULL,
  detail JSONB
);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_log(ts);
