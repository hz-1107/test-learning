-- Migration: course_enrollments 的唯一鍵改為「班級 + 學生」
--
-- 原因: 原本唯一鍵為 (course_id, student_id)，同一門課程底下有多個班級時，
--       學生從 A 班轉到同課程的 B 班會因唯一鍵衝突而新增失敗，
--       且原班級的報名已先被標記為「已結束」，導致學生同時被移出兩個班級。
--       一門課程可有多個班級，報名應以班級為單位。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-10-14_enrollment_unique_per_schedule.sql
--
-- 注意: 只能執行一次；先建立 course_id 的獨立索引，外鍵才能在移除舊唯一鍵後繼續使用。

ALTER TABLE course_enrollments ADD INDEX idx_course_enrollments_course_id (course_id);
ALTER TABLE course_enrollments DROP INDEX unique_enrollment;
ALTER TABLE course_enrollments ADD UNIQUE KEY unique_enrollment (schedule_id, student_id);
