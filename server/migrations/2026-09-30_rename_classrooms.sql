-- Migration: 既有教室改名為「地點＋編號」
--
-- 原因: 教室管理改以「教室名稱（如 西屯263）＋ 地點（西屯）」管理。
--       各資料表皆以 classroom_id 參照教室，名稱只存在 classrooms.name，
--       改名後所有頁面（課程、課表、日誌、學生）會一致顯示新名稱。
--
-- 需先執行 2026-09-30_add_classrooms_location.sql。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-09-30_rename_classrooms.sql

UPDATE classrooms SET name = '西屯263' WHERE name = '西屯教室';
UPDATE classrooms SET name = '沙鹿708' WHERE name = '沙鹿教室';
