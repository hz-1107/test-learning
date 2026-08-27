-- 新增學生學習歷程測試資料
-- 執行前請確認已有學生和課程日誌資料

USE learning_system;

-- 首先查看現有的學生和課程日誌
-- SELECT s.id as student_id, u.name as student_name FROM students s JOIN users u ON s.user_id = u.id LIMIT 5;
-- SELECT id as log_id, course_id, log_date, topic FROM course_logs ORDER BY log_date DESC LIMIT 5;

-- 使用變數儲存 ID (請根據實際資料調整)
SET @student_id = (SELECT id FROM students LIMIT 1);
SET @log_id_1 = (SELECT id FROM course_logs ORDER BY log_date DESC LIMIT 1);
SET @log_id_2 = (SELECT id FROM course_logs ORDER BY log_date DESC LIMIT 1 OFFSET 1);
SET @log_id_3 = (SELECT id FROM course_logs ORDER BY log_date DESC LIMIT 1 OFFSET 2);

-- 如果沒有找到資料，顯示訊息
SELECT
  CASE WHEN @student_id IS NULL THEN '警告: 沒有找到學生資料' ELSE CONCAT('學生 ID: ', @student_id) END AS student_status,
  CASE WHEN @log_id_1 IS NULL THEN '警告: 沒有找到課程日誌' ELSE CONCAT('日誌 ID: ', @log_id_1) END AS log_status;

-- 新增測試學習歷程記錄
INSERT INTO student_log_records (log_id, student_id, attendance, performance, notes, skill_programming, skill_debugging, skill_creativity, skill_structure, skill_teamwork, points_earned)
SELECT @log_id_1, @student_id, 'present',
  '本堂課表現優異，積極參與討論，程式碼撰寫流暢，能夠獨立解決問題。',
  '已完成基礎練習和進階挑戰',
  4, 3, 4, 3, 5, 15
WHERE @log_id_1 IS NOT NULL AND @student_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM student_log_records WHERE log_id = @log_id_1 AND student_id = @student_id);

INSERT INTO student_log_records (log_id, student_id, attendance, performance, notes, skill_programming, skill_debugging, skill_creativity, skill_structure, skill_teamwork, points_earned)
SELECT @log_id_2, @student_id, 'present',
  '學習態度認真，能夠理解課堂內容，在小組合作中表現良好。',
  '需要加強迴圈概念的理解',
  3, 3, 4, 4, 4, 12
WHERE @log_id_2 IS NOT NULL AND @student_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM student_log_records WHERE log_id = @log_id_2 AND student_id = @student_id);

INSERT INTO student_log_records (log_id, student_id, attendance, performance, notes, skill_programming, skill_debugging, skill_creativity, skill_structure, skill_teamwork, points_earned)
SELECT @log_id_3, @student_id, 'present',
  '今天的專案創意十足，展現了獨特的問題解決思維，程式結構清晰。',
  '完成個人專案展示',
  4, 4, 5, 4, 4, 18
WHERE @log_id_3 IS NOT NULL AND @student_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM student_log_records WHERE log_id = @log_id_3 AND student_id = @student_id);

-- 顯示新增結果
SELECT slr.id, cl.log_date, c.name as course_name, cl.topic, slr.performance, slr.points_earned
FROM student_log_records slr
JOIN course_logs cl ON slr.log_id = cl.id
JOIN courses c ON cl.course_id = c.id
WHERE slr.student_id = @student_id
ORDER BY cl.log_date DESC
LIMIT 5;
