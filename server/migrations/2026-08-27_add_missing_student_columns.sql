-- Migration: 補上 students 表缺少的欄位
-- 原因: server/controllers/studentsController.js 的新增/查詢/更新學生邏輯
--       用到 teacher_id、trial_teacher_id、trial_topic、
--       parent_name_father、parent_phone_father、
--       parent_name_mother、parent_phone_mother、lesson_count
--       這些欄位，但既有的 students 表未建立它們，
--       導致行政人員端「新增學生」時 SQL 報錯 (Unknown column 'teacher_id' ...)。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-08-27_add_missing_student_columns.sql
--
-- 注意: 標準 MySQL 的 ALTER TABLE ... ADD COLUMN 不支援 IF NOT EXISTS
--       (那是 MariaDB 的擴充語法)，所以這份檔案只能執行一次；
--       若欄位已存在（例如已跑過一次），重複執行會噴
--       「Duplicate column name」錯誤 —— 這是預期行為，代表不需要再跑。

ALTER TABLE students
  ADD COLUMN teacher_id INT NULL COMMENT '授課老師' AFTER classroom_id,
  ADD COLUMN trial_teacher_id INT NULL COMMENT '體驗課老師' AFTER teacher_id,
  ADD COLUMN trial_topic VARCHAR(255) NULL COMMENT '體驗課主題' AFTER trial_teacher_id,
  ADD COLUMN parent_name_father VARCHAR(100) NULL COMMENT '父親姓名' AFTER trial_topic,
  ADD COLUMN parent_phone_father VARCHAR(20) NULL COMMENT '父親電話' AFTER parent_name_father,
  ADD COLUMN parent_name_mother VARCHAR(100) NULL COMMENT '母親姓名' AFTER parent_phone_father,
  ADD COLUMN parent_phone_mother VARCHAR(20) NULL COMMENT '母親電話' AFTER parent_name_mother,
  ADD COLUMN lesson_count INT NOT NULL DEFAULT 0 COMMENT '堂數' AFTER parent_phone_mother;
