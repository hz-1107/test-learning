-- Migration: 補上 course_enrollments 表缺少的 course_id 欄位
--
-- 原因: server/controllers/studentsController.js 與
--       server/controllers/schedulesController.js 的選課/加選班級邏輯，
--       都會在 INSERT/UPDATE course_enrollments 時一併寫入 course_id
--       （從 course_schedules.course_id 查得），但既有的
--       course_enrollments 表只有 schedule_id，沒有建立 course_id 欄位，
--       導致新增學生、幫學生排入班級時 SQL 報錯
--       (Unknown column 'course_id' in 'field list')。
--
--       推測是資料表設計從「以課程(course_id)為單位選課」改成
--       「以班級時段(schedule_id)為單位選課」時，course_id 被誤刪，
--       但程式邏輯仍會一併帶入 course_id 作為冗餘欄位方便查詢。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-09-19_add_missing_course_enrollments_course_id.sql
--
-- 注意: 標準 MySQL 的 ALTER TABLE ... ADD COLUMN 不支援 IF NOT EXISTS，
--       這份檔案只能執行一次；若欄位已存在，重複執行會噴
--       「Duplicate column name」，屬預期行為，代表不需要再跑。

ALTER TABLE course_enrollments
  ADD COLUMN course_id INT NULL COMMENT '課程 (courses.id)，從 schedule 對應的課程帶入' AFTER id,
  ADD CONSTRAINT fk_course_enrollments_course_id FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE;
