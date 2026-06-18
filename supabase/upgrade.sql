-- UPGRADE for an existing boom Payroll database (adds contractor portal).
-- Paste into the Supabase SQL editor and Run. Safe to run once.

-- 1) Add the contractor column to users (if not already there)
ALTER TABLE users ADD COLUMN IF NOT EXISTS contractor TEXT;

-- 2) Make sure each contractor has at least one worker (spread the demo staff)
UPDATE employees SET contractor_id=(SELECT id FROM contractors WHERE code='C1') WHERE emp_code='EMP004';
UPDATE employees SET contractor_id=(SELECT id FROM contractors WHERE code='C2') WHERE emp_code='EMP005';
UPDATE employees SET contractor_id=(SELECT id FROM contractors WHERE code='C3') WHERE emp_code='EMP006';

-- 3) Add two contractor-portal logins (password = username)
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor)
VALUES ('secure','pbkdf2$100000$Do9AqvDvhVE3KXrjkp-mDg$4jJUf8d1E-yetfx6E4XD50SdovSfYryf6dZLSgGMX98','contractor','SecureForce Services',NULL,NULL,'C1')
ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='contractor', contractor='C1';
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor)
VALUES ('techman','pbkdf2$100000$3DRmwp75vmy9BY9V4u3uEA$qOuSePG_dfvPFBGlZvHgCnu9ubKsb7laTp_08XXwv_8','contractor','TechMan Staffing',NULL,NULL,'C3')
ON CONFLICT (username) DO UPDATE SET password_hash=EXCLUDED.password_hash, role='contractor', contractor='C3';
