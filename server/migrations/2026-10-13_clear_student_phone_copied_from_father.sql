-- Migration: 清除學生帳號中由「家長電話(父)」帶入的電話
--
-- 原因: users.phone 是「學生本人電話」，與 students.parent_phone_father / parent_phone_mother
--       分開儲存。舊版在新增 / 編輯學生時會把家長電話(父)寫進 users.phone，
--       造成學生電話顯示成父親電話。此檔只清除「與家長電話(父)完全相同」的學生電話，
--       其餘（老師或學生自行填寫的電話）不受影響。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-10-13_clear_student_phone_copied_from_father.sql
--
-- 此檔可重複執行。

UPDATE users u
JOIN students s ON s.user_id = u.id
SET u.phone = NULL
WHERE u.role = 'student'
  AND u.phone IS NOT NULL
  AND u.phone = s.parent_phone_father;
