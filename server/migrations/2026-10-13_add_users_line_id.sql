-- Migration: users 表新增 line_id（LINE ID）欄位
--
-- 原因: 登入帳號改為「姓名」、密碼為西元生日（YYYYMMDD），LINE ID 不再作為帳號，
--       改為選填的聯絡資料，另以 line_id 欄位存放。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-10-13_add_users_line_id.sql
--
-- 注意: ADD COLUMN 不支援 IF NOT EXISTS，此檔只能執行一次；
--       若出現「Duplicate column name」代表已執行過。

ALTER TABLE users
  ADD COLUMN line_id VARCHAR(50) NULL COMMENT 'LINE ID（聯絡用，選填）' AFTER phone;

-- 既有資料：老師與行政人員原本以 LINE ID 作為帳號（username），帶入 line_id
UPDATE users SET line_id = username WHERE role IN ('teacher', 'staff') AND line_id IS NULL;
