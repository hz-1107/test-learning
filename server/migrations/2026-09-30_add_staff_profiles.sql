-- Migration: 新增 staff_profiles 表（行政人員資料）
--
-- 原因: 行政人員帳號存於 users (role = 'staff')，但 users 沒有
--       職稱、到職日、備註等欄位；比照 teachers 以獨立表延伸。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-09-30_add_staff_profiles.sql
--
-- 可重複執行（CREATE TABLE IF NOT EXISTS）。

CREATE TABLE IF NOT EXISTS staff_profiles (
  user_id INT NOT NULL PRIMARY KEY,
  title VARCHAR(50) NULL COMMENT '職稱',
  hire_date DATE NULL COMMENT '到職日',
  notes TEXT NULL COMMENT '備註',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT staff_profiles_user_fk FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
