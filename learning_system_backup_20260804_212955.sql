/*M!999999\- enable the sandbox mode */ 
-- MariaDB dump 10.19  Distrib 10.11.14-MariaDB, for debian-linux-gnu (x86_64)
--
-- Host: localhost    Database: learning_system
-- ------------------------------------------------------
-- Server version	10.11.14-MariaDB-0ubuntu0.24.04.1

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `classrooms`
--

DROP TABLE IF EXISTS `classrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `classrooms` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `address` text DEFAULT NULL,
  `capacity` int(11) DEFAULT 20,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classrooms`
--

LOCK TABLES `classrooms` WRITE;
/*!40000 ALTER TABLE `classrooms` DISABLE KEYS */;
INSERT INTO `classrooms` VALUES
(1,'西屯教室','台中市西屯區西屯路二段123號',20,1,'2026-07-28 13:16:06','2026-07-28 13:16:06'),
(2,'沙鹿教室','台中市沙鹿區中山路456號',20,1,'2026-07-28 13:16:06','2026-07-28 13:16:06');
/*!40000 ALTER TABLE `classrooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_enrollments`
--

DROP TABLE IF EXISTS `course_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_enrollments` (
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_enrollments`
--

LOCK TABLES `course_enrollments` WRITE;
/*!40000 ALTER TABLE `course_enrollments` DISABLE KEYS */;
INSERT INTO `course_enrollments` VALUES
(9,1,1,'2026-07-31 16:38:07','enrolled'),
(10,1,2,'2026-07-31 16:38:22','enrolled');
/*!40000 ALTER TABLE `course_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_logs`
--

DROP TABLE IF EXISTS `course_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_logs` (
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
  `outline` text DEFAULT NULL COMMENT '課程大綱 (JSON)',
  `status` enum('pending','in_progress','completed') DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  KEY `schedule_id` (`schedule_id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `idx_course_logs_date` (`log_date`),
  KEY `idx_course_logs_status` (`status`),
  CONSTRAINT `course_logs_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`),
  CONSTRAINT `course_logs_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `course_schedules` (`id`),
  CONSTRAINT `course_logs_ibfk_3` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`),
  CONSTRAINT `course_logs_ibfk_4` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_logs`
--

LOCK TABLES `course_logs` WRITE;
/*!40000 ALTER TABLE `course_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_schedules`
--

DROP TABLE IF EXISTS `course_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `course_id` int(11) NOT NULL,
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
  CONSTRAINT `course_schedules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_schedules_ibfk_2` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_schedules`
--

LOCK TABLES `course_schedules` WRITE;
/*!40000 ALTER TABLE `course_schedules` DISABLE KEYS */;
INSERT INTO `course_schedules` VALUES
(1,1,1,'09:00:00','10:30:00',1,1,'2026-07-30 15:28:36',NULL),
(2,2,3,'14:00:00','15:30:00',1,1,'2026-07-30 15:29:31',NULL),
(3,4,5,'10:00:00','11:30:00',2,1,'2026-07-30 15:29:31',NULL),
(4,1,1,'12:45:00','14:45:00',2,1,'2026-07-30 15:45:59',NULL),
(7,1,5,'04:05:00','03:05:00',2,1,'2026-07-30 16:05:57','2026-07-30 16:08:58'),
(8,1,5,'01:09:00','03:09:00',2,1,'2026-07-30 16:09:21','2026-08-02 07:34:09'),
(9,2,3,'01:20:00','02:20:00',1,1,'2026-07-31 16:20:48','2026-08-02 07:33:55');
/*!40000 ALTER TABLE `course_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_types`
--

DROP TABLE IF EXISTS `course_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `description` text DEFAULT NULL,
  `color` varchar(20) DEFAULT NULL COMMENT '顯示顏色',
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_types`
--

LOCK TABLES `course_types` WRITE;
/*!40000 ALTER TABLE `course_types` DISABLE KEYS */;
INSERT INTO `course_types` VALUES
(1,'幼兒簡易機械',NULL,'#4CAF50',1,'2026-07-28 13:16:06'),
(2,'動力機械',NULL,'#2196F3',1,'2026-07-28 13:16:06'),
(3,'程式機械',NULL,'#FF9800',1,'2026-07-28 13:16:06'),
(4,'科創機器人',NULL,'#9C27B0',1,'2026-07-28 13:16:06'),
(5,'專題班',NULL,'#F44336',1,'2026-07-28 13:16:06');
/*!40000 ALTER TABLE `course_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
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
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES
(1,NULL,'動力機械',NULL,NULL,1,NULL,10,0.00,'inactive','2026-07-29 15:13:37','2026-07-30 16:09:21'),
(2,NULL,'程式機械',NULL,NULL,2,NULL,10,0.00,'active','2026-07-29 15:16:39','2026-07-30 15:29:31'),
(3,NULL,'科創機器人','科技領域程式課程， 以高階機械原理、提供更多感應器使用、物理原理與程式邏輯上應互相搭配。','10歲+',NULL,NULL,10,0.00,'inactive','2026-07-29 15:20:21','2026-07-29 15:40:17'),
(4,NULL,'電腦教室',NULL,NULL,4,NULL,10,0.00,'active','2026-07-30 13:23:54','2026-07-30 15:29:31'),
(5,NULL,'普通教室','fasdfsa','9-10歲',NULL,NULL,10,0.00,'active','2026-07-31 16:26:05','2026-07-31 16:26:05');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `holiday_date` date NOT NULL,
  `name` varchar(100) NOT NULL,
  `type` enum('national','custom') DEFAULT 'custom',
  `is_recurring` tinyint(1) DEFAULT 0 COMMENT '是否每年重複',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_holiday` (`holiday_date`),
  KEY `idx_holidays_date` (`holiday_date`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
INSERT INTO `holidays` VALUES
(1,'2026-01-01','元旦','national',0,'2026-07-28 13:16:06'),
(2,'2026-01-28','除夕','national',0,'2026-07-28 13:16:06'),
(3,'2026-01-29','春節','national',0,'2026-07-28 13:16:06'),
(4,'2026-01-30','春節','national',0,'2026-07-28 13:16:06'),
(5,'2026-01-31','春節','national',0,'2026-07-28 13:16:06'),
(6,'2026-02-28','和平紀念日','national',0,'2026-07-28 13:16:06'),
(7,'2026-04-04','兒童節','national',0,'2026-07-28 13:16:06'),
(8,'2026-04-05','清明節','national',0,'2026-07-28 13:16:06'),
(9,'2026-05-01','勞動節','national',0,'2026-07-28 13:16:06'),
(10,'2026-05-31','端午節','national',0,'2026-07-28 13:16:06'),
(11,'2026-09-21','中秋節','national',0,'2026-07-28 13:16:06'),
(12,'2026-10-10','國慶日','national',0,'2026-07-28 13:16:06');
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_permissions`
--

DROP TABLE IF EXISTS `log_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_permissions` (
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
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `log_permissions`
--

LOCK TABLES `log_permissions` WRITE;
/*!40000 ALTER TABLE `log_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `log_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_settings`
--

DROP TABLE IF EXISTS `notification_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(50) NOT NULL,
  `is_enabled` tinyint(1) DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL COMMENT '設定參數' CHECK (json_valid(`config`)),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_settings`
--

LOCK TABLES `notification_settings` WRITE;
/*!40000 ALTER TABLE `notification_settings` DISABLE KEYS */;
INSERT INTO `notification_settings` VALUES
(1,'teacher_log_reminder',1,'{\"hours_after_class\": 2}','2026-07-28 13:16:06'),
(2,'student_makeup_reminder',1,'{\"day_of_week\": 5, \"time\": \"10:00\"}','2026-07-28 13:16:06');
/*!40000 ALTER TABLE `notification_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `point_transactions`
--

DROP TABLE IF EXISTS `point_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `point_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `points` int(11) NOT NULL COMMENT '正數為獲得，負數為扣除',
  `type` enum('earn','redeem','adjust','expire') NOT NULL,
  `reason` varchar(255) DEFAULT NULL,
  `reference_type` varchar(50) DEFAULT NULL COMMENT '關聯類型: log, reward, etc.',
  `reference_id` int(11) DEFAULT NULL COMMENT '關聯 ID',
  `created_by` int(11) DEFAULT NULL COMMENT '操作者 user_id',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_point_transactions_student` (`student_id`),
  CONSTRAINT `point_transactions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `point_transactions`
--

LOCK TABLES `point_transactions` WRITE;
/*!40000 ALTER TABLE `point_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `point_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reward_redemptions`
--

DROP TABLE IF EXISTS `reward_redemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `reward_redemptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `student_id` int(11) NOT NULL,
  `reward_id` int(11) NOT NULL,
  `points_used` int(11) NOT NULL,
  `status` enum('pending','completed','cancelled') DEFAULT 'pending',
  `redeemed_at` timestamp NULL DEFAULT current_timestamp(),
  `completed_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `reward_id` (`reward_id`),
  CONSTRAINT `reward_redemptions_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`),
  CONSTRAINT `reward_redemptions_ibfk_2` FOREIGN KEY (`reward_id`) REFERENCES `rewards` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reward_redemptions`
--

LOCK TABLES `reward_redemptions` WRITE;
/*!40000 ALTER TABLE `reward_redemptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `reward_redemptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rewards`
--

DROP TABLE IF EXISTS `rewards`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `rewards` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(200) NOT NULL,
  `description` text DEFAULT NULL,
  `points_required` int(11) NOT NULL,
  `quantity` int(11) DEFAULT 0 COMMENT '庫存數量',
  `image_url` varchar(500) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rewards`
--

LOCK TABLES `rewards` WRITE;
/*!40000 ALTER TABLE `rewards` DISABLE KEYS */;
/*!40000 ALTER TABLE `rewards` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `schedule_adjustments`
--

DROP TABLE IF EXISTS `schedule_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `schedule_id` int(11) NOT NULL,
  `original_date` date NOT NULL,
  `adjusted_date` date DEFAULT NULL,
  `adjusted_start_time` time DEFAULT NULL,
  `adjusted_end_time` time DEFAULT NULL,
  `adjusted_classroom_id` int(11) DEFAULT NULL,
  `adjustment_type` enum('reschedule','cancel','makeup') NOT NULL DEFAULT 'reschedule',
  `reason` varchar(255) DEFAULT NULL,
  `status` enum('pending','confirmed','completed') DEFAULT 'confirmed',
  `created_by` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `adjusted_classroom_id` (`adjusted_classroom_id`),
  KEY `created_by` (`created_by`),
  KEY `idx_schedule_date` (`schedule_id`,`original_date`),
  KEY `idx_adjusted_date` (`adjusted_date`),
  CONSTRAINT `schedule_adjustments_ibfk_1` FOREIGN KEY (`schedule_id`) REFERENCES `course_schedules` (`id`) ON DELETE CASCADE,
  CONSTRAINT `schedule_adjustments_ibfk_2` FOREIGN KEY (`adjusted_classroom_id`) REFERENCES `classrooms` (`id`) ON DELETE SET NULL,
  CONSTRAINT `schedule_adjustments_ibfk_3` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedule_adjustments`
--

LOCK TABLES `schedule_adjustments` WRITE;
/*!40000 ALTER TABLE `schedule_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `schedule_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_log_photos`
--

DROP TABLE IF EXISTS `student_log_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_log_photos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `record_id` int(11) NOT NULL,
  `photo_url` varchar(500) NOT NULL,
  `caption` varchar(255) DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `record_id` (`record_id`),
  CONSTRAINT `student_log_photos_ibfk_1` FOREIGN KEY (`record_id`) REFERENCES `student_log_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_log_photos`
--

LOCK TABLES `student_log_photos` WRITE;
/*!40000 ALTER TABLE `student_log_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_log_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_log_records`
--

DROP TABLE IF EXISTS `student_log_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_log_records` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `log_id` int(11) NOT NULL,
  `student_id` int(11) NOT NULL,
  `attendance` enum('present','absent','late','excused') DEFAULT 'present',
  `performance` text DEFAULT NULL COMMENT '課堂表現',
  `notes` text DEFAULT NULL COMMENT '備註',
  `skill_programming` tinyint(4) DEFAULT 0 COMMENT '程式能力',
  `skill_debugging` tinyint(4) DEFAULT 0 COMMENT '除錯能力',
  `skill_creativity` tinyint(4) DEFAULT 0 COMMENT '創意能力',
  `skill_structure` tinyint(4) DEFAULT 0 COMMENT '結構能力',
  `skill_teamwork` tinyint(4) DEFAULT 0 COMMENT '團隊合作',
  `points_earned` int(11) DEFAULT 0 COMMENT '獲得點數',
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_log` (`log_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_log_records_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `course_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_log_records_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_log_records`
--

LOCK TABLES `student_log_records` WRITE;
/*!40000 ALTER TABLE `student_log_records` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_log_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
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
  `teacher_id` int(11) DEFAULT NULL,
  `trial_teacher_id` int(11) DEFAULT NULL,
  `trial_topic` varchar(100) DEFAULT NULL,
  `classroom_id` int(11) DEFAULT NULL,
  `course_type_id` int(11) DEFAULT NULL,
  `lesson_count` int(11) DEFAULT 0,
  `status` enum('active','inactive','graduated') DEFAULT 'active',
  `notes` text DEFAULT NULL,
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
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES
(1,9,NULL,'2015-05-15',NULL,'西屯國小','六年級',NULL,NULL,'測試爸爸','0912345678',NULL,NULL,NULL,NULL,'2026-08-01',2,NULL,NULL,1,2,0,'active',NULL,'2026-07-31 15:35:29','2026-07-31 15:35:54'),
(2,10,NULL,'2005-07-21',NULL,'台中科技大學','大四',NULL,NULL,NULL,'0900000000',NULL,NULL,NULL,NULL,'2026-07-30',1,1,NULL,2,2,0,'active',NULL,'2026-07-31 15:40:17','2026-07-31 15:40:34');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES
(1,'system_name','智慧學習歷程系統','系統名稱','2026-07-28 13:16:06'),
(2,'organization_name','樂高機器人教室','機構名稱','2026-07-28 13:16:06'),
(3,'timezone','Asia/Taipei','時區','2026-07-28 13:16:06'),
(4,'language','zh-TW','預設語言','2026-07-28 13:16:06');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
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
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES
(1,2,NULL,NULL,NULL,'active',NULL,'2026-07-29 14:29:44','2026-07-29 14:29:44'),
(2,5,NULL,NULL,NULL,'active',NULL,'2026-07-29 14:29:44','2026-07-29 14:29:44'),
(4,6,'台中科技大學',NULL,'2026-07-29','active',NULL,'2026-07-29 15:56:19','2026-07-29 15:56:19'),
(5,7,'台中科技大學',NULL,'2026-07-30','active',NULL,'2026-07-30 12:35:58','2026-07-30 12:35:58'),
(6,8,'台中科技大學',NULL,'2026-07-29','active','1231','2026-07-30 13:24:30','2026-07-30 15:11:29');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
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
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES
(1,'admin','$2a$10$REvFtXkUSodSkrfURQWV/e2i4CX3NFAKkLL247EGM0JeZ7Rk5NA3O','admin@example.com','admin','系統管理員',NULL,NULL,NULL,1,'2026-07-28 13:16:06','2026-07-28 13:55:12'),
(2,'teacher1','$2a$10$zEQTs2kN6UG6jXODuzWmMO9tuMVE6Zwb2Eu/rK1S0/iNxVgpVEilu','teacher1@example.com','teacher','王老師',NULL,NULL,NULL,1,'2026-07-29 12:17:53','2026-07-29 12:17:53'),
(3,'staff1','$2a$10$zEQTs2kN6UG6jXODuzWmMO9tuMVE6Zwb2Eu/rK1S0/iNxVgpVEilu','staff1@example.com','staff','李小姐',NULL,NULL,NULL,1,'2026-07-29 12:17:53','2026-07-29 12:17:53'),
(4,'student1','$2a$10$zEQTs2kN6UG6jXODuzWmMO9tuMVE6Zwb2Eu/rK1S0/iNxVgpVEilu','student1@example.com','student','陳同學',NULL,NULL,NULL,1,'2026-07-29 12:17:53','2026-07-29 12:17:53'),
(5,'teacher2','$2a$10$XKhhNRLnL/RoqgOfnGgk7.veBYxU/NpIIIPuJ7SGWzp6Q5Wcv3Stm','teacher2@example.com','teacher','林老師',NULL,NULL,NULL,1,'2026-07-29 14:18:50','2026-07-29 14:18:50'),
(6,'Yan','$2a$10$yl3ZX.KmZ17RIzC66IoeIuX6FSxyid8GKfAhKR.WyyAtrUG6T4cx6',NULL,'teacher','顏老師','0901206667','2026-11-30',NULL,1,'2026-07-29 15:56:19','2026-07-29 15:56:19'),
(7,'chen','$2a$10$9MdraaJIdCIE3kiM7S4u4OKIHAtFDNsRXZEkGLo84.31jH9Y2WVbO',NULL,'teacher','陳老師','0912345678','2004-10-29',NULL,1,'2026-07-30 12:35:58','2026-07-30 12:35:58'),
(8,'line','$2a$10$iGKkJQDGCMznat3HQwqZ.u8p5iHacId07BJdNJtK/FYxRgw2rzF.y',NULL,'teacher','何子嫻','0905805107','2026-07-29',NULL,1,'2026-07-30 13:24:30','2026-07-30 15:11:29'),
(9,'0912345678','$2a$10$fZTLxWxX/qYVTqfaedbutOjE2pAYbZrdaI3vONK5TTraubTs33lam',NULL,'student','測試學生(已修改)','0912345678','2015-05-15',NULL,1,'2026-07-31 15:35:29','2026-07-31 15:35:54'),
(10,'0900000000','$2a$10$VfzfffuisYmDQ.EJstIMtO9Pg2T83h8pJlUopyWHoYRHaIQLIsXRO',NULL,'student','羅子軒','0900000000','2005-07-21',NULL,1,'2026-07-31 15:40:17','2026-07-31 15:40:34');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-08-04 21:29:55
