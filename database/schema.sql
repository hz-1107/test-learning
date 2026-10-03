-- =============================================
-- 智慧學習歷程系統 - 資料庫結構
-- Database: learning_system
-- 更新日期: 2026-10-03
-- =============================================

CREATE DATABASE IF NOT EXISTS learning_system
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE learning_system;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- 使用者表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `role` enum('admin','staff','teacher','student') NOT NULL DEFAULT 'student',
  `name` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `birthday` date DEFAULT NULL,
  `avatar` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 行政人員延伸資料表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `staff_profiles` (
  `user_id` int(11) NOT NULL,
  `title` varchar(50) DEFAULT NULL COMMENT '職稱',
  `hire_date` date DEFAULT NULL COMMENT '到職日',
  `notes` text DEFAULT NULL COMMENT '備註',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`user_id`),
  CONSTRAINT `staff_profiles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 教師表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `school` varchar(100) DEFAULT NULL COMMENT '就讀/畢業學校',
  `specialty` varchar(255) DEFAULT NULL COMMENT '專長',
  `hire_date` date DEFAULT NULL,
  `status` enum('active','inactive','on_leave') DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_teachers_status` (`status`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 教室表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `classrooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `location` varchar(50) DEFAULT NULL COMMENT '地點（如 西屯、沙鹿）',
  `address` text DEFAULT NULL,
  `capacity` int(11) DEFAULT 20,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 課程類型表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `course_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL COMMENT '顯示顏色',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 課程表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `courses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_type_id` int(11) DEFAULT NULL,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `age_range` varchar(50) DEFAULT NULL COMMENT '適合年齡',
  `teacher_id` int(11) DEFAULT NULL,
  `classroom_id` int(11) DEFAULT NULL,
  `max_students` int(11) DEFAULT 10,
  `fee` decimal(10,2) DEFAULT 0.00,
  `status` enum('active','inactive','completed') DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `course_type_id` (`course_type_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `idx_courses_status` (`status`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`course_type_id`) REFERENCES `course_types` (`id`),
  CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`),
  CONSTRAINT `courses_ibfk_3` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 課程時段表 (每週固定時段)
-- ----------------------------
CREATE TABLE IF NOT EXISTS `course_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `teacher_id` int(11) DEFAULT NULL COMMENT '時段專屬教師（可覆蓋 courses.teacher_id）',
  `day_of_week` tinyint(4) NOT NULL COMMENT '0=週日, 1=週一, ..., 6=週六',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `classroom_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `deleted_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `course_schedules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_schedules_ibfk_2` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `course_schedules_ibfk_3` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 調課記錄表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `schedule_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `original_date` date NOT NULL COMMENT '原始日期',
  `adjusted_date` date DEFAULT NULL COMMENT '調整後日期',
  `adjusted_start_time` time DEFAULT NULL COMMENT '調整後開始時間',
  `adjusted_end_time` time DEFAULT NULL COMMENT '調整後結束時間',
  `adjusted_classroom_id` int(11) DEFAULT NULL COMMENT '調整後教室',
  `adjusted_teacher_id` int(11) DEFAULT NULL COMMENT '代課老師 (teachers.id)',
  `adjustment_type` enum('time','teacher','time_teacher','cancel','reschedule','makeup') NOT NULL DEFAULT 'reschedule' COMMENT '調課類型: time=改時段, teacher=換代課老師, time_teacher=兩者皆調, cancel=取消, reschedule=調課(舊), makeup=補課(舊)',
  `reason` varchar(255) DEFAULT NULL COMMENT '調課原因',
  `status` enum('pending','confirmed','completed') DEFAULT 'confirmed',
  `created_by` int(11) DEFAULT NULL COMMENT '建立者 (users.id)',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `adjusted_classroom_id` (`adjusted_classroom_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_schedule_date` (`schedule_id`,`original_date`),
  KEY `idx_adjusted_date` (`adjusted_date`),
  KEY `schedule_adjustments_teacher_fk` (`adjusted_teacher_id`),
  CONSTRAINT `schedule_adjustments_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `course_schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedule_adjustments_ibfk_2` FOREIGN KEY (`adjusted_classroom_id`) REFERENCES `classrooms` (`id`) ON DELETE SET NULL,
  CONSTRAINT `schedule_adjustments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `schedule_adjustments_teacher_fk` FOREIGN KEY (`adjusted_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 學生表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `students` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `student_code` varchar(20) DEFAULT NULL COMMENT '學生編號',
  `birth_date` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `school` varchar(100) DEFAULT NULL,
  `grade` varchar(20) DEFAULT NULL COMMENT '年級',
  `parent_name` varchar(100) DEFAULT NULL,
  `parent_phone` varchar(20) DEFAULT NULL,
  `parent_name_father` varchar(100) DEFAULT NULL,
  `parent_phone_father` varchar(20) DEFAULT NULL,
  `parent_name_mother` varchar(100) DEFAULT NULL,
  `parent_phone_mother` varchar(20) DEFAULT NULL,
  `parent_email` varchar(100) DEFAULT NULL,
  `address` text DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `teacher_id` int(11) DEFAULT NULL COMMENT '負責教師',
  `trial_teacher_id` int(11) DEFAULT NULL COMMENT '試聽教師',
  `trial_topic` varchar(100) DEFAULT NULL COMMENT '試聽主題',
  `classroom_id` int(11) DEFAULT NULL,
  `course_type_id` int(11) DEFAULT NULL,
  `lesson_count` int(11) DEFAULT 0 COMMENT '累計上課堂數',
  `status` enum('active','inactive','graduated') DEFAULT 'active',
  `notes` text DEFAULT NULL,
  `points_balance` int(11) DEFAULT 80 COMMENT '點數餘額',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_code` (`student_code`),
  KEY `user_id` (`user_id`),
  KEY `idx_students_status` (`status`),
  KEY `teacher_id` (`teacher_id`),
  KEY `trial_teacher_id` (`trial_teacher_id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `course_type_id` (`course_type_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_3` FOREIGN KEY (`trial_teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_4` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`) ON DELETE SET NULL,
  CONSTRAINT `students_ibfk_5` FOREIGN KEY (`course_type_id`) REFERENCES `course_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 課程選課表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `course_enrollments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `enrolled_at` timestamp NULL DEFAULT current_timestamp(),
  `status` enum('enrolled','dropped','completed') DEFAULT 'enrolled',
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`schedule_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `course_enrollments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_enrollments_schedule_fk` FOREIGN KEY (`schedule_id`) REFERENCES `course_schedules` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 課程日誌表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `course_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `log_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `classroom_id` int(11) DEFAULT NULL,
  `teacher_id` int(11) NOT NULL COMMENT '實際授課教師',
  `topic` varchar(255) DEFAULT NULL COMMENT '課程主題',
  `content` text DEFAULT NULL COMMENT '課程內容',
  `outline` text DEFAULT NULL COMMENT '課程大綱',
  `status` enum('pending','in_progress','completed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_schedule_date` (`schedule_id`,`log_date`),
  KEY `course_id` (`course_id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `idx_course_logs_date` (`log_date`),
  KEY `idx_course_logs_status` (`status`),
  CONSTRAINT `course_logs_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `course_logs_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `course_schedules` (`id`),
  CONSTRAINT `course_logs_ibfk_3` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `course_logs_ibfk_4` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 課程日誌照片表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `course_log_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `log_id` int(11) NOT NULL,
  `photo_url` varchar(500) NOT NULL,
  `file_name` varchar(255) DEFAULT NULL,
  `file_size` int(11) DEFAULT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `uploaded_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `log_id` (`log_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `course_log_photos_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `course_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_log_photos_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 日誌編輯權限表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `log_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `log_id` int(11) NOT NULL,
  `teacher_id` int(11) NOT NULL,
  `granted_by` int(11) DEFAULT NULL COMMENT '授權者 user_id',
  `granted_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_permission` (`log_id`,`teacher_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `log_permissions_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `course_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `log_permissions_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 學生課堂記錄表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `student_log_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `log_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `attendance` enum('present','absent','late','excused','makeup','no_class') DEFAULT 'present' COMMENT '出勤狀態',
  `performance` text DEFAULT NULL COMMENT '課堂表現',
  `notes` text DEFAULT NULL COMMENT '備註',
  `skill_programming` tinyint(4) DEFAULT 0 COMMENT '程式能力 (1-5)',
  `skill_debugging` tinyint(4) DEFAULT 0 COMMENT '除錯能力 (1-5)',
  `skill_creativity` tinyint(4) DEFAULT 0 COMMENT '創意能力 (1-5)',
  `skill_structure` tinyint(4) DEFAULT 0 COMMENT '結構能力 (1-5)',
  `skill_teamwork` tinyint(4) DEFAULT 0 COMMENT '團隊合作 (1-5)',
  `points_earned` int(11) DEFAULT 0 COMMENT '獲得點數',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_log` (`log_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_log_records_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `course_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_log_records_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 學生課堂照片表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `student_log_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `record_id` int(11) NOT NULL,
  `photo_url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `record_id` (`record_id`),
  CONSTRAINT `student_log_photos_ibfk_1` FOREIGN KEY (`record_id`) REFERENCES `student_log_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 競賽記錄表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `competitions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `title` varchar(255) NOT NULL COMMENT '競賽名稱',
  `subtitle` varchar(255) DEFAULT NULL,
  `organizer` varchar(255) DEFAULT NULL COMMENT '主辦單位',
  `competition_date` date DEFAULT NULL COMMENT '競賽日期',
  `level` enum('national','regional','county','school') DEFAULT 'school' COMMENT '競賽等級',
  `rank_type` enum('gold','silver','bronze','merit','participant') DEFAULT 'participant',
  `rank_name` varchar(50) DEFAULT NULL COMMENT '名次',
  `score` varchar(50) DEFAULT NULL COMMENT '成績',
  `team_name` varchar(255) DEFAULT NULL COMMENT '隊伍名稱',
  `team_members` text DEFAULT NULL COMMENT '隊伍成員',
  `description` text DEFAULT NULL COMMENT '競賽說明',
  `certificate_url` varchar(500) DEFAULT NULL COMMENT '證書檔案',
  `photo_url` varchar(500) DEFAULT NULL COMMENT '照片1',
  `photo_url_2` varchar(500) DEFAULT NULL COMMENT '照片2',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_competition_date` (`competition_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 點數交易記錄表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `point_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `amount` int(11) NOT NULL COMMENT '點數變動量（正數=獲得，負數=扣除）',
  `reason` varchar(50) NOT NULL COMMENT '變動原因分類',
  `description` varchar(255) DEFAULT NULL COMMENT '詳細說明',
  `operator_id` int(11) DEFAULT NULL COMMENT '操作人員',
  `reference_type` varchar(50) DEFAULT NULL COMMENT '關聯類型',
  `reference_id` int(11) DEFAULT NULL COMMENT '關聯 ID',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_created_at` (`created_at`),
  KEY `idx_reference` (`reference_type`,`reference_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 獎勵商品表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `rewards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `points_required` int(11) NOT NULL COMMENT '所需點數',
  `quantity` int(11) DEFAULT 0 COMMENT '庫存數量',
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 獎勵兌換記錄表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `reward_redemptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `reward_id` int(11) NOT NULL,
  `points_used` int(11) NOT NULL COMMENT '使用點數',
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `redeemed_at` timestamp NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `reward_id` (`reward_id`),
  CONSTRAINT `reward_redemptions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `reward_redemptions_ibfk_2` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 公告表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `announcements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL COMMENT '公告主旨',
  `content` text NOT NULL COMMENT '公告詳細內容',
  `publish_type` enum('immediate','scheduled') NOT NULL DEFAULT 'immediate' COMMENT '發布類型：即時/定時',
  `target_group` enum('all','teachers','students') NOT NULL DEFAULT 'all' COMMENT '目標群組：全體/老師/學生',
  `target_classes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '目標班級 JSON' CHECK (json_valid(`target_classes`)),
  `scheduled_at` datetime DEFAULT NULL COMMENT '預定發布時間',
  `published_at` datetime DEFAULT NULL COMMENT '實際發布時間',
  `status` enum('draft','scheduled','published') NOT NULL DEFAULT 'draft',
  `created_by` int(11) DEFAULT NULL COMMENT '建立者 user_id',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  KEY `idx_announcements_status` (`status`),
  KEY `idx_announcements_target` (`target_group`),
  KEY `idx_announcements_scheduled` (`scheduled_at`),
  KEY `idx_announcements_published` (`published_at`),
  CONSTRAINT `announcements_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 公告已讀記錄表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `announcement_reads` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `announcement_id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `read_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_read` (`announcement_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `announcement_reads_ibfk_1` FOREIGN KEY (`announcement_id`) REFERENCES `announcements` (`id`) ON DELETE CASCADE,
  CONSTRAINT `announcement_reads_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 假日設定表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `holiday_date` date NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('national','custom') DEFAULT 'custom',
  `is_recurring` tinyint(1) DEFAULT 0 COMMENT '是否每年重複',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_holiday` (`holiday_date`),
  KEY `idx_holidays_date` (`holiday_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 通知設定表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `notification_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '設定參數 JSON' CHECK (json_valid(`config`)),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- 系統設定表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------
-- AI 科系推薦記錄表
-- ----------------------------
CREATE TABLE IF NOT EXISTS `department_recommendations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `department` varchar(100) NOT NULL COMMENT '推薦科系',
  `reason` text DEFAULT NULL COMMENT '推薦理由',
  `introduction` text DEFAULT NULL COMMENT '學類介紹',
  `career_directions` varchar(500) DEFAULT NULL COMMENT '就業方向',
  `career_salary` varchar(100) DEFAULT NULL COMMENT '薪資範圍',
  `suggestion` text DEFAULT NULL COMMENT '學習建議',
  `generated_at` timestamp NULL DEFAULT current_timestamp() COMMENT '生成時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_student` (`student_id`),
  KEY `idx_generated_at` (`generated_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI科系推薦紀錄';

SET FOREIGN_KEY_CHECKS = 1;
