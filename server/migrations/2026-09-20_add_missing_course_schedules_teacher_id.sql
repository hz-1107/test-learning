-- Migration: course_schedules 表補上 teacher_id 欄位
--
-- 原因: server/controllers/schedulesController.js、
--       scheduleCalendarController.js、logsController.js
--       都用到 COALESCE(cs.teacher_id, c.teacher_id)，用來讓單一堂課
--       （相對於整個課程）可以指定不同的授課老師（例如代課），
--       但既有的 course_schedules 表沒有建立這個欄位，
--       導致課表相關 API 全部報錯
--       (Unknown column 'cs.teacher_id' in 'field list')。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-09-20_add_missing_course_schedules_teacher_id.sql
--
-- 注意: 標準 MySQL 的 ALTER TABLE ... ADD COLUMN 不支援 IF NOT EXISTS，
--       這份檔案只能執行一次；若欄位已存在，重複執行會噴
--       「Duplicate column name」，屬預期行為，代表不需要再跑。

ALTER TABLE course_schedules
  ADD COLUMN teacher_id INT NULL COMMENT '授課老師 (teachers.id)，若為 NULL 則沿用 courses.teacher_id' AFTER classroom_id;
