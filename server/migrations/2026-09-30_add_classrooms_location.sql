-- Migration: classrooms 表新增 location（地點）欄位
--
-- 原因: 系統設定「教室管理」以「教室名稱（如 西屯201）＋ 地點（如 西屯）」
--       管理教室；既有 address 欄位為完整地址，另以 location 存放地點。
--
-- 使用方式:
--   mysql -u <user> -p learning_system < server/migrations/2026-09-30_add_classrooms_location.sql
--
-- 注意: ADD COLUMN 不支援 IF NOT EXISTS，此檔只能執行一次；
--       若出現「Duplicate column name」代表已執行過。

ALTER TABLE classrooms
  ADD COLUMN location VARCHAR(50) NULL COMMENT '地點（如 西屯、沙鹿）' AFTER name;

-- 既有資料：以名稱去掉「教室」作為地點（西屯教室 → 西屯）
UPDATE classrooms SET location = REPLACE(name, '教室', '') WHERE location IS NULL;
