-- Mock HR & COMMON Tables for standalone testing
CREATE TABLE IF NOT EXISTS com_employee (
    emp_id BIGSERIAL PRIMARY KEY,
    emp_code VARCHAR(20) UNIQUE,
    emp_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS hr_leave_request (
    request_id BIGSERIAL PRIMARY KEY,
    emp_id BIGINT REFERENCES com_employee(emp_id),
    leave_type VARCHAR(50),
    start_date DATE,
    end_date DATE,
    total_days DECIMAL(4,2),
    status VARCHAR(20) DEFAULT 'APPROVED'
);

-- Insert mock employees
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP001', 'Thuannguyen', 'Thuannguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP002', 'Anhthu', 'anhthu@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP003', 'Byun', 'byun@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP004', 'Cuong', 'cuong@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP005', 'Cuongnguyen', 'cuongnguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP006', 'Danglong', 'danglong@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP007', 'Dao', 'dao@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP008', 'Daothingoc', 'daothingoc@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP009', 'Gianghi', 'gianghi@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP010', 'Giangvo', 'giangvo@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP011', 'Ha', 'ha@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP012', 'Hanguyen', 'hanguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP013', 'Hien', 'hien@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP014', 'Hoabui', 'hoabui@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP015', 'Hoailinh', 'hoailinh@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP016', 'Huyen', 'huyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP017', 'Huyentran', 'huyentran@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP018', 'Huyenvu', 'huyenvu@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP019', 'Keyty', 'keyty@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP020', 'Khoahuynh', 'khoahuynh@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP021', 'Kienle', 'kienle@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP022', 'Kim Ld', 'kim.ld@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP023', 'Lamnguyen', 'lamnguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP024', 'Lan', 'lan@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP025', 'Lengoc', 'lengoc@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP026', 'Lien', 'lien@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP027', 'Mai', 'mai@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP028', 'Maihan', 'maihan@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP029', 'Minhanh', 'minhanh@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP030', 'Minhthu', 'minhthu@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP031', 'Minhtran', 'minhtran@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP032', 'Mynguyen', 'mynguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP033', 'Nga', 'nga@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP034', 'Nganntt', 'nganntt@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP035', 'Ngocmai', 'ngocmai@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP036', 'Ngocvu', 'ngocvu@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP037', 'Nhungle', 'nhungle@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP038', 'Nhuquynh', 'nhuquynh@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP039', 'Phamgiau', 'phamgiau@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP040', 'Phuong', 'phuong@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP041', 'Phuongnguyen', 'phuongnguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP042', 'Sangtran', 'sangtran@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP043', 'Solomon', 'solomon@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP044', 'Tam', 'tam@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP045', 'Tanhuy', 'tanhuy@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP046', 'Thainguyen', 'thainguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP047', 'Thanhdat', 'thanhdat@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP048', 'Thanhtam', 'thanhtam@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP049', 'Thanhtruc', 'thanhtruc@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP050', 'Thaole', 'thaole@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP051', 'Thaouyen', 'thaouyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP052', 'Thaovan', 'thaovan@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP053', 'Thuannguyen', 'thuannguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP054', 'Thuylinh', 'thuylinh@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP055', 'Thuytien', 'thuytien@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP056', 'Trangnm', 'trangnm@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP057', 'Trangthu', 'trangthu@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP058', 'Tranminhtrang', 'tranminhtrang@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP059', 'Tridung', 'tridung@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP060', 'Trungvo', 'trungvo@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP061', 'Tuan', 'tuan@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP062', 'Tunguyen', 'tunguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP063', 'Tuongvi', 'tuongvi@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP064', 'Vantruc', 'vantruc@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP065', 'Vinhnguyen', 'vinhnguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP066', 'Vy', 'vy@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP067', 'Xuanhoa', 'xuanhoa@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP068', 'Yennguyen', 'yennguyen@eximuni.com') ON CONFLICT DO NOTHING;
INSERT INTO com_employee (emp_code, emp_name, email) VALUES ('EMP069', 'Yennhi', 'yennhi@eximuni.com') ON CONFLICT DO NOTHING;

-- Assign default schedule to all mock employees (Shift ID 1: Standard)
INSERT INTO atd_employee_schedule (emp_id, shift_id, start_date, work_days_mask)
SELECT emp_id, 1, '2024-01-01', 62 FROM com_employee
ON CONFLICT DO NOTHING;
