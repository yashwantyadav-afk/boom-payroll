-- boom Payroll demo seed (passwords hashed; demo password = username).
-- Paste this AFTER schema.sql in the Supabase SQL editor, then click Run.

INSERT INTO plants(code,name) VALUES ('P1','Pune'),('P2','Bengaluru'),('P3','Chennai') ON CONFLICT DO NOTHING;
INSERT INTO departments(code,name) VALUES ('D1','Production'),('D2','Quality'),('D3','Maintenance'),('D4','Stores'),('D5','Admin & HR') ON CONFLICT DO NOTHING;
INSERT INTO banks(id,name) VALUES ('B1','HDFC Bank'),('B2','ICICI Bank'),('B3','State Bank of India'),('B4','Axis Bank') ON CONFLICT DO NOTHING;

INSERT INTO config(key,value) VALUES ('statutory', '{"basicPct":0.5,"monthDays":30,"metro":true,"wageMinPct":0.5,"lwfOn":true,"pf":{"on":true,"eeRate":12,"erRate":12,"ceiling":15000,"epsCap":1250,"admin":0.5},"esi":{"on":true,"eeRate":0.75,"erRate":3.25,"threshold":21000},"pt":{"on":true},"bonus":{"on":true,"pct":8.33,"wageCap":7000,"eligibilityGross":21000},"tds":{"regime":"new","sd":75000,"sdOld":50000,"rebateNew":1200000,"rebateOld":500000,"cess":4}}'::jsonb) ON CONFLICT (key) DO NOTHING;

INSERT INTO contractors(code,name,plant,status) VALUES ('C0','On Roll (Direct)','P1','Active'),('C1','SecureForce Services','P1','Active'),('C2','CleanCo Facilities','P2','Active'),('C3','TechMan Staffing','P3','Active') ON CONFLICT (code) DO NOTHING;

INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP001','Priya Sharma','Senior Engineer',2400000,'Karnataka','P2','D2',(SELECT id FROM contractors WHERE code='C0'),'B1','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP002','Rahul Verma','Production Lead',1800000,'Maharashtra','P1','D1',(SELECT id FROM contractors WHERE code='C0'),'B1','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP003','Anita Desai','HR Executive',900000,'Maharashtra','P1','D5',(SELECT id FROM contractors WHERE code='C0'),'B2','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP004','Vikram Iyer','Maintenance Tech',600000,'Tamil Nadu','P3','D3',(SELECT id FROM contractors WHERE code='C1'),'B3','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP005','Sneha Patil','Quality Analyst',1200000,'Karnataka','P2','D2',(SELECT id FROM contractors WHERE code='C2'),'B1','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;
INSERT INTO employees(emp_code,name,role,ctc,state,plant,dept,contractor_id,bank_id,doj) VALUES ('EMP006','Arjun Nair','Operator',240000,'Tamil Nadu','P3','D1',(SELECT id FROM contractors WHERE code='C3'),'B4','2023-04-01') ON CONFLICT (emp_code) DO NOTHING;

INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP001'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP002'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP003'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP004'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP005'),'May',2025,30,0) ON CONFLICT DO NOTHING;
INSERT INTO attendance(emp_id,period_month,period_year,total_days,lop) VALUES ((SELECT id FROM employees WHERE emp_code='EMP006'),'May',2025,30,0) ON CONFLICT DO NOTHING;

INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor) VALUES ('admin','pbkdf2$100000$jIE8gsRxpi-bbhsFy0gH5g$ir6Z8rqzI1OMee1Sk0U4gHwEg7UM2Sbwb38sXh11Luw','sysadmin','System Admin',NULL,NULL,NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor) VALUES ('payroll','pbkdf2$100000$SVsG68Yk2E4VZiu9TYsBbQ$evV24r84ZPRqEDmCZ8E1sUAO7Eqp-sX6tSQzKwgbzaQ','payroll','Payroll Manager',NULL,NULL,NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor) VALUES ('pune','pbkdf2$100000$vT4aTlhTSLa_Dbv-Pa2glQ$L4QSNYcnUisQ9M9ki85Zt3TbDGRs7PaC9hjXq8lxF_M','hr','HR — Pune','P1',NULL,NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor) VALUES ('mgr','pbkdf2$100000$pA5v8pUYkEyY4ICTaBMxkA$o9ryRW57q1zGRbchuWgGEcwzVQ2mNKHD80u6_-694oM','manager','Plant Manager','P1',NULL,NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor) VALUES ('finance','pbkdf2$100000$BNimkutZvEj6uQhLWi5gfA$vT0Rf4Fe3G6TEPnIGVnTATiMsYCK3UfHGN9fylsyu1k','finance','Finance',NULL,NULL,NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor) VALUES ('priya','pbkdf2$100000$Fvy8nnC_ANv03t5L5wVktA$u4V_w1KyEV_unJFvvW1gUKxoDfFXJFT1qPieBds5ImU','ess','Priya Sharma',NULL,(SELECT id FROM employees WHERE emp_code='EMP001'),NULL) ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor) VALUES ('secure','pbkdf2$100000$CPlZ1eJwvH-fcr4wQiFYuA$0VaJow2v-NCmbvlN1ZFehXdM2y6h6Oml6ypmxeW9jwM','contractor','SecureForce Services',NULL,NULL,'C1') ON CONFLICT (username) DO NOTHING;
INSERT INTO users(username,password_hash,role,name,plant,emp_id,contractor) VALUES ('techman','pbkdf2$100000$FP8SjXxebFodsa4U4ijozw$KAp0sE_v0fy_dB1NJrz6Q6Q2nCx_LTCI-G4hG_JXTRA','contractor','TechMan Staffing',NULL,NULL,'C3') ON CONFLICT (username) DO NOTHING;
