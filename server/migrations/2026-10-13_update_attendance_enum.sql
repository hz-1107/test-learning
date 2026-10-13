-- Migration: student_log_records.attendance 補上「補課、未約課」
--
-- 原因: 教師日誌的出缺席為「出席、請假、補課、未約課」，
--       對應 present / absent / makeup / no_class；舊資料庫的 ENUM 缺少 makeup、no_class，
--       儲存補課或未約課時會失敗。late、excused 為舊資料保留。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-10-13_update_attendance_enum.sql
--
-- 此檔可重複執行。

ALTER TABLE student_log_records
  MODIFY COLUMN attendance ENUM('present','absent','late','excused','makeup','no_class')
  DEFAULT 'present' COMMENT '出勤狀態';
