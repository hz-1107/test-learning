-- Migration: 補上 courses 表缺少的 age_range 欄位
-- 原因: server/controllers/coursesController.js 的新增/更新課程邏輯，
--       以及行政人員端「新增課程」表單都會送出 age_range（適合年齡）欄位，
--       但既有的 courses 表未建立此欄位，導致新增課程時 SQL 報錯
--       (Unknown column 'age_range' in 'field list')。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-08-27_add_missing_course_age_range.sql
--
-- 注意: 標準 MySQL 的 ALTER TABLE ... ADD COLUMN 不支援 IF NOT EXISTS，
--       所以這份檔案只能執行一次；若欄位已存在，重複執行會噴
--       「Duplicate column name」錯誤 —— 這是預期行為，代表不需要再跑。

ALTER TABLE courses
  ADD COLUMN age_range VARCHAR(50) NULL COMMENT '適合年齡' AFTER description;
