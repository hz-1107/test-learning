-- Migration: schedule_adjustments 表補上調課功能所需欄位
--
-- 原因: server/controllers/scheduleCalendarController.js 的
--       createAdjustment / updateAdjustment / getWeeklySchedule 等邏輯
--       用到 adjustment_type、created_by 欄位，但既有的
--       schedule_adjustments 表沒有建立它們，導致行政人員端
--       「課表排程 → 調課」送出時 SQL 報錯
--       (Unknown column 'adjustment_type' ...)，調課功能形同無法使用。
--
--       另外，「調課」表單改版後調課類型分為
--       time（改時段）、teacher（換代課老師）、time_teacher（兩者皆調），
--       其中「換代課老師」需記錄代課的 teachers.id，
--       因此新增 adjusted_teacher_id 欄位。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-09-02_add_adjustment_type_and_adjusted_teacher.sql
--
-- 注意: 標準 MySQL 的 ALTER TABLE ... ADD COLUMN 不支援 IF NOT EXISTS，
--       這份檔案只能執行一次；若欄位已存在，重複執行會噴
--       「Duplicate column name」，屬預期行為，代表不需要再跑。

ALTER TABLE schedule_adjustments
  ADD COLUMN adjusted_teacher_id INT NULL COMMENT '代課老師 (teachers.id)' AFTER adjusted_classroom_id,
  ADD COLUMN adjustment_type VARCHAR(20) NOT NULL DEFAULT 'time'
    COMMENT '調課類型: time/teacher/time_teacher (相容舊值 cancel/reschedule/makeup)' AFTER adjusted_teacher_id,
  ADD COLUMN created_by INT NULL COMMENT '建立者 (users.id)' AFTER status;
