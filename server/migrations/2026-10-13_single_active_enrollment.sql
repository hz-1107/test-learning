-- Migration: 每位學生同一時間只保留一個「在班」(enrolled) 的班級
--
-- 原因: 一位學生同時只會上一種課程，但示範資料（seed-teachers.js）把同一位學生
--       排進多個班級，造成同時有多筆 enrolled 的報名。
--
-- 作法: 每位學生保留一筆 enrolled 作為目前課程，其餘改為 completed（已結束）。
--       保留的順序與 studentsController 的「目前課程」判斷一致：
--       班級未刪除者優先 → 最近有上課紀錄（出席、補課）的課程 → 最近加入 → id 最大。
--       歷史課程是依上課紀錄顯示，不受此變更影響。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-10-13_single_active_enrollment.sql
--
-- 此檔可重複執行。

UPDATE course_enrollments ce
JOIN (
  SELECT s.id AS student_id, (
    SELECT ce2.id
    FROM course_enrollments ce2
    JOIN course_schedules cs2 ON ce2.schedule_id = cs2.id
    WHERE ce2.student_id = s.id AND ce2.status = 'enrolled'
    ORDER BY (cs2.deleted_at IS NULL) DESC, (
      SELECT MAX(cl.log_date)
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      WHERE slr.student_id = ce2.student_id AND cl.course_id = cs2.course_id
        AND slr.attendance IN ('present', 'late', 'makeup')
    ) DESC, ce2.enrolled_at DESC, ce2.id DESC
    LIMIT 1
  ) AS keep_id
  FROM students s
) k ON k.student_id = ce.student_id
SET ce.status = 'completed'
WHERE ce.status = 'enrolled' AND ce.id <> k.keep_id;
