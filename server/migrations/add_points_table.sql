-- 點數交易紀錄表
CREATE TABLE IF NOT EXISTS point_transactions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  amount INT NOT NULL COMMENT '點數變動量（正數增加，負數扣除）',
  reason VARCHAR(50) NOT NULL COMMENT '變動原因類型（增加、扣除、兌換獎品、其他）',
  description VARCHAR(255) COMMENT '詳細說明',
  operator_id INT COMMENT '操作人員 user_id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 在 students 表新增點數餘額欄位（如果不存在）
-- 注意：MySQL 的 IF NOT EXISTS 不支援 ADD COLUMN，需要手動檢查
-- 如果欄位已存在會報錯，可以忽略該錯誤
ALTER TABLE students ADD COLUMN points_balance INT DEFAULT 80 COMMENT '點數餘額';
