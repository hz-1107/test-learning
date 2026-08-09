-- ============================================
-- 智慧學習歷程系統 資料庫結構
-- Database: learning_system
-- ============================================

CREATE DATABASE IF NOT EXISTS learning_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE learning_system;

-- ============================================
-- 使用者相關表格
-- ============================================

-- 使用者表
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role ENUM('admin', 'staff', 'teacher', 'student') NOT NULL DEFAULT 'student',
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 教師資料表
CREATE TABLE teachers (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    school VARCHAR(100) COMMENT '就讀/畢業學校',
    specialty VARCHAR(255) COMMENT '專長',
    hire_date DATE,
    status ENUM('active', 'inactive', 'on_leave') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 學生資料表
CREATE TABLE students (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    student_code VARCHAR(20) UNIQUE COMMENT '學生編號',
    birth_date DATE,
    gender ENUM('male', 'female', 'other'),
    school VARCHAR(100),
    grade VARCHAR(20) COMMENT '年級',
    parent_name VARCHAR(100),
    parent_phone VARCHAR(20),
    parent_email VARCHAR(100),
    address TEXT,
    enrollment_date DATE,
    status ENUM('active', 'inactive', 'graduated') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- 課程相關表格
-- ============================================

-- 教室表
CREATE TABLE classrooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    capacity INT DEFAULT 20,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 課程類型表
CREATE TABLE course_types (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) COMMENT '顯示顏色',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 課程表
CREATE TABLE courses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_type_id INT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    teacher_id INT,
    classroom_id INT,
    max_students INT DEFAULT 10,
    fee DECIMAL(10, 2) DEFAULT 0,
    status ENUM('active', 'inactive', 'completed') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_type_id) REFERENCES course_types(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id),
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);

-- 課程時段表 (每週固定時段)
CREATE TABLE course_schedules (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    day_of_week TINYINT NOT NULL COMMENT '0=週日, 1=週一, ..., 6=週六',
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    classroom_id INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
);

-- 學生選課表
CREATE TABLE course_enrollments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status ENUM('enrolled', 'dropped', 'completed') DEFAULT 'enrolled',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (course_id, student_id)
);

-- ============================================
-- 日誌相關表格
-- ============================================

-- 課程日誌表 (每堂課的日誌)
CREATE TABLE course_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    course_id INT NOT NULL,
    schedule_id INT,
    log_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    classroom_id INT,
    teacher_id INT NOT NULL COMMENT '實際授課教師',
    topic VARCHAR(255) COMMENT '課程主題',
    content TEXT COMMENT '課程內容',
    outline TEXT COMMENT '課程大綱 (JSON)',
    status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id),
    FOREIGN KEY (schedule_id) REFERENCES course_schedules(id),
    FOREIGN KEY (classroom_id) REFERENCES classrooms(id),
    FOREIGN KEY (teacher_id) REFERENCES teachers(id)
);

-- 日誌填寫權限表
CREATE TABLE log_permissions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    log_id INT NOT NULL,
    teacher_id INT NOT NULL,
    granted_by INT COMMENT '授權者 user_id',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (log_id) REFERENCES course_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
    UNIQUE KEY unique_permission (log_id, teacher_id)
);

-- 學生日誌記錄表 (每個學生在每堂課的表現)
CREATE TABLE student_log_records (
    id INT PRIMARY KEY AUTO_INCREMENT,
    log_id INT NOT NULL,
    student_id INT NOT NULL,
    attendance ENUM('present', 'absent', 'late', 'excused') DEFAULT 'present',
    performance TEXT COMMENT '課堂表現',
    notes TEXT COMMENT '備註',
    -- 能力評分 (1-5分)
    skill_programming TINYINT DEFAULT 0 COMMENT '程式能力',
    skill_debugging TINYINT DEFAULT 0 COMMENT '除錯能力',
    skill_creativity TINYINT DEFAULT 0 COMMENT '創意能力',
    skill_structure TINYINT DEFAULT 0 COMMENT '結構能力',
    skill_teamwork TINYINT DEFAULT 0 COMMENT '團隊合作',
    points_earned INT DEFAULT 0 COMMENT '獲得點數',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (log_id) REFERENCES course_logs(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY unique_student_log (log_id, student_id)
);

-- 學生日誌照片表
CREATE TABLE student_log_photos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    record_id INT NOT NULL,
    photo_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES student_log_records(id) ON DELETE CASCADE
);

-- ============================================
-- 點數系統表格
-- ============================================

-- 點數交易記錄表
CREATE TABLE point_transactions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    points INT NOT NULL COMMENT '正數為獲得，負數為扣除',
    type ENUM('earn', 'redeem', 'adjust', 'expire') NOT NULL,
    reason VARCHAR(255),
    reference_type VARCHAR(50) COMMENT '關聯類型: log, reward, etc.',
    reference_id INT COMMENT '關聯 ID',
    created_by INT COMMENT '操作者 user_id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

-- 獎品表
CREATE TABLE rewards (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    points_required INT NOT NULL,
    quantity INT DEFAULT 0 COMMENT '庫存數量',
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 獎品兌換記錄表
CREATE TABLE reward_redemptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    student_id INT NOT NULL,
    reward_id INT NOT NULL,
    points_used INT NOT NULL,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    redeemed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (reward_id) REFERENCES rewards(id)
);

-- ============================================
-- 系統設定表格
-- ============================================

-- 假日設定表
CREATE TABLE holidays (
    id INT PRIMARY KEY AUTO_INCREMENT,
    holiday_date DATE NOT NULL,
    name VARCHAR(100) NOT NULL,
    type ENUM('national', 'custom') DEFAULT 'custom',
    is_recurring BOOLEAN DEFAULT FALSE COMMENT '是否每年重複',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_holiday (holiday_date)
);

-- 系統設定表
CREATE TABLE system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value TEXT,
    description VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 通知設定表
CREATE TABLE notification_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    type VARCHAR(50) NOT NULL UNIQUE,
    is_enabled BOOLEAN DEFAULT TRUE,
    config JSON COMMENT '設定參數',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- 初始資料
-- ============================================

-- 插入預設教室
INSERT INTO classrooms (name, address) VALUES
('西屯教室', '台中市西屯區西屯路二段123號'),
('沙鹿教室', '台中市沙鹿區中山路456號');

-- 插入預設課程類型
INSERT INTO course_types (name, color) VALUES
('幼兒簡易機械', '#4CAF50'),
('動力機械', '#2196F3'),
('程式機械', '#FF9800'),
('科創機器人', '#9C27B0'),
('專題班', '#F44336');

-- 插入預設管理員帳號 (密碼: admin123，實際使用時請用 bcrypt 加密)
INSERT INTO users (username, password, email, role, name) VALUES
('admin', '$2b$10$rQZ8K1X5X5X5X5X5X5X5XuQZ8K1X5X5X5X5X5X5X5X5X5X5X5X5', 'admin@example.com', 'admin', '系統管理員');

-- 插入預設系統設定
INSERT INTO system_settings (setting_key, setting_value, description) VALUES
('system_name', '智慧學習歷程系統', '系統名稱'),
('organization_name', '樂高機器人教室', '機構名稱'),
('timezone', 'Asia/Taipei', '時區'),
('language', 'zh-TW', '預設語言');

-- 插入預設通知設定
INSERT INTO notification_settings (type, is_enabled, config) VALUES
('teacher_log_reminder', TRUE, '{"hours_after_class": 2}'),
('student_makeup_reminder', TRUE, '{"day_of_week": 5, "time": "10:00"}');

-- 插入預設國定假日 (2026年)
INSERT INTO holidays (holiday_date, name, type) VALUES
('2026-01-01', '元旦', 'national'),
('2026-01-28', '除夕', 'national'),
('2026-01-29', '春節', 'national'),
('2026-01-30', '春節', 'national'),
('2026-01-31', '春節', 'national'),
('2026-02-28', '和平紀念日', 'national'),
('2026-04-04', '兒童節', 'national'),
('2026-04-05', '清明節', 'national'),
('2026-05-01', '勞動節', 'national'),
('2026-05-31', '端午節', 'national'),
('2026-09-21', '中秋節', 'national'),
('2026-10-10', '國慶日', 'national');

-- ============================================
-- 索引優化
-- ============================================

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_students_status ON students(status);
CREATE INDEX idx_teachers_status ON teachers(status);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_course_logs_date ON course_logs(log_date);
CREATE INDEX idx_course_logs_status ON course_logs(status);
CREATE INDEX idx_point_transactions_student ON point_transactions(student_id);
CREATE INDEX idx_holidays_date ON holidays(holiday_date);
