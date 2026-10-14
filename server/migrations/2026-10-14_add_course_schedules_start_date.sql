-- Migration: course_schedules 表新增 start_date（開課日期）欄位
--
-- 原因: 日誌會依班級的上課星期自動產生「待填寫」項目，
--       沒有開課日期時，班級成立前的日期也會被算進去，導致大量未填寫日誌。
--       設定開課日期後，該日期以前不會再產生日誌；NULL 代表不限制（沿用舊行為）。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-10-14_add_course_schedules_start_date.sql
--
-- 注意: 這份檔案只能執行一次；若欄位已存在，重複執行會噴「Duplicate column name」，屬預期行為。

ALTER TABLE course_schedules
  ADD COLUMN start_date DATE NULL COMMENT '開課日期，此日期以前不產生日誌；NULL 表示不限制' AFTER end_time;
