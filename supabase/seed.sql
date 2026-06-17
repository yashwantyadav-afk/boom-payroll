-- boom Payroll demo seed (passwords hashed; demo password = username).
-- Paste this AFTER schema.sql in the Supabase SQL editor, then click Run.

INSERT INTO plants(code,name) VALUES ('P1','Pune'),('P2','Bengaluru'),('P3','Chennai') ON CONFLICT DO NOTHING;
INSERT INTO departments(code,name) VALUES ('D1','Production'),('D2','Quality'),('D3','Maintenance'),('D4','Stores'),('D5','Admin & HR') ON CONFLICT DO NOTHING;
INSERT INTO banks(id,name) VALUES ('B1','HDFC Bank'),('B2','ICICI Bank'),('B3','State Bank of India'),('B4','Axis Bank') ON CONFLICT DO NOTHING;

INSERT INTO config(key,value) VALUES ('statutory', '{"basicPct":0.5,"monthDays":30,"metro":true,"wageMinPct":0.5,"lwfOn":true,"pf":{"on":true,"eeRate":12,"erRate":12,"ceiling":15000,"epsCap":1250,"admin":0.5},"esi":{"on":true,"eeRate":0.75,"erRate":3.25,"threshold":21000},"pt":{"on":true},"bonus":{"on":true,"pct":8.33,"wageCap":7000,"eligibilityGross":21000},"tds":{"regime":"new","sd":75000,"sdOld":50000,"rebateNew":1200000,"rebateOld":500000,"cess":4}}'::jsonb) ON CONFLICT (key) DO NOTHING;

INSERT INTO contractors(code,name,plant,status) VALUES ('C0','On Roll (Direct)','P1','Active'),('C1','Sai Manpower Services','P1','Active'),('C2','Bharat Facility Co.','P2','Active'),('C3','Reliable Staffing LLP','P3','Active') ON CONFLICT (code) DO NOTHING;

INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP001','Priya Sharma','Senior Engineer',2400000,'Karnataka','P2','D2',(SELECT id FROM contractors WHERE code='C0'),'B1','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP002','Rahul Verma','Production Lead',1800000,'Maharashtra','P1','D1',(SELECT id FROM contractors WHERE code='C0'),'B1','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP003','Anita Desai','HR Executive',900000,'Maharashtra','P1','D5',(SELECT id FROM contractors WHERE code='C0'),'B2','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP004','Vikram Iyer','Maintenance Tech',600000,'Tamil Nadu','P3','D3',(SELECT id FROM contractors WHERE code='C3'),'B3','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP005','Sneha Patil','Quality Analyst',1200000,'Karnataka','P2','D2',(SELECT id FROM contractors WHERE code='C2'),'B1','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP006','Arjun Nair','Operator',240000,'Tamil Nadu','P3','D1',(SELECT id FROM contractors WHERE code='C3'),'B4','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;

INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP001'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP002'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP003'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP004'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP005'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP006'),'May',2025,30,0) ON CONFLICT DO NOTHING;

INSERT INTO users(username,password_hash,role,name,plant,emp_id) VALUES ('admin','pbkdf2$100000$df2hfXcnJ8BL0_VhOcspNQ$rHqrG8XOUFxVhLW0ifojcq3Yj6q-Li53GuFEX6FI_tg','sysadmin','System Admin',NULL,NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id) VALUES ('payroll','pbkdf2$100000$tbJWYAe_QtUBmV7piic2yw$Gr9Ag4lgsRcev3iE5oGu-kGzCsi-7e3yIF1A4IKhNlQ','payroll','Payroll Manager',NULL,NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id) VALUES ('pune','pbkdf2$100000$2JD585DrH1omRQgros9uKg$xFJuN32Vd7e8sDhPlikvI5WXImlYeCjQ_8yPmdeOuyQ','hr','HR — Pune','P1',NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id) VALUES ('mgr','pbkdf2$100000$vw9ukQ6hf0XIKyI_dpCzwA$hb_MH2FT1DnDUTMo0zOjFkaWGeh844a23KJHsCvAQFA','manager','Plant Manager','P1',NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id) VALUES ('finance','pbkdf2$100000$8M7K36kkEM_-zKpSwBuPdg$mex0Sjw_bQX0fYm9P5I-dWm4Q4EeS4ObyFt04wqGRhk','finance','Finance',NULL,NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id) VALUES ('priya','pbkdf2$100000$gNCVV4c2GoZ3I92A0XOvaw$GphX1zJDr6992sVIop01bPbLI_XFqtfzULwjFl3YxnY','ess','Priya Sharma',NULL,(SELECT id FROM employees WHERE emp_code='EMP001')) ON CONFLICT (username) DO NOTHING;
