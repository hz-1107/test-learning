-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: learning_system
-- ------------------------------------------------------
-- Server version	8.0.46

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `announcements`
--

DROP TABLE IF EXISTS `announcements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `announcements` (
  `id` int NOT NULL AUTO_INCREMENT,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `content` text COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'published',
  `target_group` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'all',
  `created_by` int DEFAULT NULL,
  `published_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `announcements`
--

LOCK TABLES `announcements` WRITE;
/*!40000 ALTER TABLE `announcements` DISABLE KEYS */;
/*!40000 ALTER TABLE `announcements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `classrooms`
--

DROP TABLE IF EXISTS `classrooms`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `classrooms` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '地點（如 西屯、沙鹿）',
  `address` text COLLATE utf8mb4_unicode_ci,
  `capacity` int DEFAULT '20',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `classrooms`
--

LOCK TABLES `classrooms` WRITE;
/*!40000 ALTER TABLE `classrooms` DISABLE KEYS */;
INSERT INTO `classrooms` VALUES (1,'西屯263','西屯','台中市西屯區西屯路二段123號',20,1,'2026-08-27 10:00:58','2026-09-30 07:49:44'),(2,'沙鹿708','沙鹿','台中市沙鹿區中山路456號',20,1,'2026-08-27 10:00:58','2026-09-30 07:49:44'),(4,'測試UI202','沙鹿',NULL,20,0,'2026-09-30 07:41:04','2026-09-30 07:41:15');
/*!40000 ALTER TABLE `classrooms` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `competitions`
--

DROP TABLE IF EXISTS `competitions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `competitions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `organizer` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `subtitle` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `competition_date` date DEFAULT NULL,
  `level` enum('international','national','regional','county') COLLATE utf8mb4_unicode_ci DEFAULT 'county',
  `rank_name` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `score` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `team_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `certificate_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `photo_url_2` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_competition_date` (`competition_date`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `competitions`
--

LOCK TABLES `competitions` WRITE;
/*!40000 ALTER TABLE `competitions` DISABLE KEYS */;
INSERT INTO `competitions` VALUES (1,32,'市政府教育局','114學年度市長盃創意機器人競賽',NULL,'2026-07-25','county','佳作','82分','晴空小隊',NULL,'小晴第一次參加校外機器人競賽，與隊友合作完成循序前進與碰撞感測任務。比賽中車子一度偏離路線，她冷靜檢查程式後找出轉彎秒數設定的問題並完成修正，最終獲得佳作，累積了寶貴的實戰經驗。','2026-10-12 05:30:16','2026-10-12 07:34:43',NULL,NULL),(2,32,'台灣青少年機器人協會','青少年機器人循線競速賽 北區初賽',NULL,'2026-08-15','regional','第二名','完賽時間 28.4 秒','晴空小隊',NULL,'小晴運用課堂所學的循線感測技巧，反覆調整感測數值與轉彎速度，讓車子在彎道也能穩定前進。她在隊伍中負責程式撰寫與測試，與隊友分工明確，最終以穩定的表現拿下北區初賽第二名。','2026-10-12 05:30:16','2026-10-12 05:30:16',NULL,NULL),(3,32,'全國科技教育推廣協會','全國STEAM創客機器人大賽 避障挑戰組',NULL,'2026-09-05','national','第一名','96分','晴空小隊',NULL,'小晴擔任隊伍的程式負責人，以超音波測距設計避障邏輯，並將程式拆分成副程式讓結構更清楚。決賽前她獨立找出感測距離設定的錯誤，車子順利通過全部障礙關卡，以全場最高分榮獲全國第一名。','2026-10-12 05:30:16','2026-10-12 05:30:16',NULL,NULL),(4,32,'國際青少年機器人教育聯盟','亞洲青少年機器人邀請賽 迷宮任務組',NULL,'2026-09-26','international','優勝','88分','PAPAYA','/uploads/photos/1791783096383-967564021.jpg','我首次挑戰國際賽事，與來自不同國家的隊伍同場競技。我提出獨特的迷宮轉向策略，並在比賽現場主動協助隊友除錯，展現良好的團隊合作與臨場應變能力，最終獲得優勝肯定。','2026-10-12 05:30:16','2026-10-12 07:47:09','/uploads/photos/1791790512859-920928433.jpg','/uploads/photos/1791790778495-259055695.jpg');
/*!40000 ALTER TABLE `competitions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_enrollments`
--

DROP TABLE IF EXISTS `course_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_enrollments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `student_id` int NOT NULL,
  `enrolled_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `status` enum('enrolled','dropped','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'enrolled',
  `schedule_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_enrollment` (`course_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `course_enrollments_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_enrollments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_enrollments`
--

LOCK TABLES `course_enrollments` WRITE;
/*!40000 ALTER TABLE `course_enrollments` DISABLE KEYS */;
INSERT INTO `course_enrollments` VALUES (2,2,2,'2026-08-27 12:04:24','enrolled',2),(3,2,24,'2026-09-02 15:23:06','dropped',2),(4,2,11,'2026-09-02 15:23:06','dropped',2),(5,2,21,'2026-09-02 15:30:35','completed',2),(6,2,13,'2026-09-02 15:30:35','completed',2),(7,3,31,'2026-09-03 06:12:30','completed',18),(8,3,22,'2026-09-03 06:12:30','completed',18),(9,3,32,'2026-09-13 14:27:54','enrolled',19),(10,3,10,'2026-09-13 14:34:27','enrolled',19),(16,5,3,'2026-09-29 12:06:11','completed',20),(17,5,4,'2026-09-29 12:06:11','completed',20),(18,5,5,'2026-09-29 12:06:11','completed',20),(19,5,6,'2026-09-29 12:06:11','completed',20),(20,5,7,'2026-09-29 12:06:11','completed',20),(21,5,8,'2026-09-29 12:06:11','completed',21),(22,5,9,'2026-09-29 12:06:11','completed',21),(23,5,10,'2026-09-29 12:06:11','completed',21),(24,6,11,'2026-09-29 12:06:11','completed',22),(25,6,12,'2026-09-29 12:06:11','completed',22),(26,6,13,'2026-09-29 12:06:11','completed',22),(27,6,14,'2026-09-29 12:06:11','completed',22),(28,7,15,'2026-09-29 12:06:11','completed',23),(29,7,16,'2026-09-29 12:06:11','completed',23),(30,7,17,'2026-09-29 12:06:11','completed',23),(31,7,18,'2026-09-29 12:06:11','completed',23),(32,7,19,'2026-09-29 12:06:11','completed',23),(33,7,20,'2026-09-29 12:06:11','completed',24),(34,7,21,'2026-09-29 12:06:11','completed',24),(35,7,22,'2026-09-29 12:06:11','completed',24),(36,8,23,'2026-09-29 12:06:11','completed',25),(37,8,24,'2026-09-29 12:06:11','completed',25),(38,8,25,'2026-09-29 12:06:11','completed',25),(39,8,26,'2026-09-29 12:06:11','completed',25),(40,9,27,'2026-09-29 12:06:11','completed',26),(41,9,28,'2026-09-29 12:06:11','completed',26),(42,9,29,'2026-09-29 12:06:11','completed',26),(43,9,30,'2026-09-29 12:06:11','completed',26),(44,9,31,'2026-09-29 12:06:11','completed',26),(45,9,3,'2026-09-29 12:06:11','completed',27),(46,9,4,'2026-09-29 12:06:11','completed',27),(47,9,5,'2026-09-29 12:06:11','completed',27),(48,10,6,'2026-09-29 12:06:11','completed',28),(49,10,7,'2026-09-29 12:06:11','completed',28),(50,10,8,'2026-09-29 12:06:11','completed',28),(51,10,9,'2026-09-29 12:06:11','completed',28),(52,11,10,'2026-09-29 12:06:11','completed',29),(53,11,11,'2026-09-29 12:06:11','completed',29),(54,11,12,'2026-09-29 12:06:11','completed',29),(55,11,13,'2026-09-29 12:06:11','completed',29),(56,11,14,'2026-09-29 12:06:11','completed',29),(57,11,15,'2026-09-29 12:06:11','completed',30),(58,11,16,'2026-09-29 12:06:11','completed',30),(59,11,17,'2026-09-29 12:06:11','completed',30),(60,12,18,'2026-09-29 12:06:11','completed',31),(61,12,19,'2026-09-29 12:06:11','completed',31),(62,12,20,'2026-09-29 12:06:11','completed',31),(63,12,21,'2026-09-29 12:06:11','completed',31),(64,12,22,'2026-09-29 12:06:11','completed',32),(65,12,23,'2026-09-29 12:06:11','completed',32),(66,12,24,'2026-09-29 12:06:11','completed',32),(67,12,25,'2026-09-29 12:06:11','completed',32),(68,12,26,'2026-09-29 12:06:11','completed',32),(69,13,27,'2026-09-29 12:06:11','completed',33),(70,13,28,'2026-09-29 12:06:11','completed',33),(71,13,29,'2026-09-29 12:06:11','completed',33),(72,14,3,'2026-09-29 12:09:58','completed',34),(73,14,4,'2026-09-29 12:09:58','completed',34),(74,14,5,'2026-09-29 12:09:58','completed',34),(75,14,6,'2026-09-29 12:09:58','completed',34),(76,14,7,'2026-09-29 12:09:58','enrolled',35),(77,14,8,'2026-09-29 12:09:58','enrolled',35),(78,14,9,'2026-09-29 12:09:58','enrolled',35),(79,14,10,'2026-09-29 12:09:58','completed',35),(80,14,11,'2026-09-29 12:09:58','enrolled',35),(81,15,12,'2026-09-29 12:09:58','enrolled',36),(82,15,13,'2026-09-29 12:09:58','enrolled',36),(83,15,14,'2026-09-29 12:09:58','enrolled',36),(84,15,15,'2026-09-29 12:09:58','enrolled',37),(85,15,16,'2026-09-29 12:09:58','enrolled',37),(86,15,17,'2026-09-29 12:09:58','enrolled',37),(87,15,18,'2026-09-29 12:09:58','enrolled',37),(88,16,19,'2026-09-29 12:09:58','enrolled',38),(89,16,20,'2026-09-29 12:09:58','enrolled',38),(90,16,21,'2026-09-29 12:09:58','enrolled',38),(91,16,22,'2026-09-29 12:09:58','enrolled',38),(92,16,23,'2026-09-29 12:09:58','enrolled',38),(93,16,24,'2026-09-29 12:09:58','enrolled',39),(94,16,25,'2026-09-29 12:09:58','enrolled',39),(95,16,26,'2026-09-29 12:09:58','enrolled',39),(96,17,27,'2026-09-29 12:09:58','enrolled',40),(97,17,28,'2026-09-29 12:09:58','enrolled',40),(98,17,29,'2026-09-29 12:09:58','enrolled',40),(99,17,30,'2026-09-29 12:09:58','enrolled',40),(100,17,31,'2026-09-29 12:09:58','enrolled',41),(101,17,3,'2026-09-29 12:09:58','enrolled',41),(102,17,4,'2026-09-29 12:09:58','enrolled',41),(103,17,5,'2026-09-29 12:09:58','enrolled',41),(104,17,6,'2026-09-29 12:09:58','enrolled',41),(113,5,32,'2026-03-01 02:00:00','completed',21);
/*!40000 ALTER TABLE `course_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_log_photos`
--

DROP TABLE IF EXISTS `course_log_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_log_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `file_size` int DEFAULT NULL,
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_by` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `log_id` (`log_id`),
  KEY `uploaded_by` (`uploaded_by`),
  CONSTRAINT `course_log_photos_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `course_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_log_photos_ibfk_2` FOREIGN KEY (`uploaded_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_log_photos`
--

LOCK TABLES `course_log_photos` WRITE;
/*!40000 ALTER TABLE `course_log_photos` DISABLE KEYS */;
/*!40000 ALTER TABLE `course_log_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_logs`
--

DROP TABLE IF EXISTS `course_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `schedule_id` int DEFAULT NULL,
  `log_date` date NOT NULL,
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `classroom_id` int DEFAULT NULL,
  `teacher_id` int NOT NULL COMMENT '實際授課教師',
  `topic` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '課程主題',
  `content` text COLLATE utf8mb4_unicode_ci COMMENT '課程內容',
  `outline` text COLLATE utf8mb4_unicode_ci COMMENT '課程大綱 (JSON)',
  `status` enum('pending','in_progress','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
) ENGINE=InnoDB AUTO_INCREMENT=112 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_logs`
--

LOCK TABLES `course_logs` WRITE;
/*!40000 ALTER TABLE `course_logs` DISABLE KEYS */;
INSERT INTO `course_logs` VALUES (2,2,2,'2026-09-03','14:00:00','15:30:00',2,1,NULL,NULL,NULL,'pending','2026-09-08 10:22:51','2026-09-08 10:22:51'),(3,3,18,'2026-09-03','18:30:00','20:00:00',1,4,NULL,NULL,NULL,'pending','2026-09-08 10:22:51','2026-09-08 10:22:51'),(5,3,19,'2026-09-08','16:00:00','17:30:00',1,5,NULL,NULL,NULL,'completed','2026-09-13 14:47:02','2026-09-14 08:28:03'),(7,2,2,'2026-09-10','14:00:00','15:30:00',2,1,NULL,NULL,NULL,'pending','2026-09-14 08:57:30','2026-09-14 08:57:30'),(8,3,18,'2026-09-10','18:30:00','20:00:00',1,4,NULL,NULL,NULL,'pending','2026-09-14 08:57:30','2026-09-14 08:57:30'),(9,3,19,'2026-09-22','16:00:00','17:30:00',1,5,NULL,NULL,NULL,'pending','2026-09-22 08:00:51','2026-09-22 08:00:51'),(10,3,19,'2026-09-15','16:00:00','17:30:00',1,5,NULL,NULL,NULL,'pending','2026-09-22 08:00:51','2026-09-22 08:00:51'),(11,2,2,'2026-09-17','14:00:00','15:30:00',2,1,NULL,NULL,NULL,'pending','2026-09-23 01:27:19','2026-09-23 01:27:19'),(12,3,18,'2026-09-17','18:30:00','20:00:00',1,4,NULL,NULL,NULL,'pending','2026-09-23 01:27:19','2026-09-23 01:27:19'),(13,2,2,'2026-09-24','14:00:00','15:30:00',2,1,NULL,NULL,NULL,'pending','2026-09-29 07:57:13','2026-09-29 07:57:13'),(14,3,18,'2026-09-24','18:30:00','20:00:00',1,4,NULL,NULL,NULL,'pending','2026-09-29 07:57:13','2026-09-29 07:57:13'),(15,3,19,'2026-09-29','16:00:00','17:30:00',1,5,NULL,NULL,NULL,'pending','2026-09-29 08:11:14','2026-09-29 08:11:14'),(16,3,19,'2026-09-24','16:00:00','17:30:00',1,5,'距離檢測器','正常上課','【課程大綱】\n\n一、課程主題\n本堂課程以輪軸原理為核心，透過實作體驗讓學生理解基礎物理原理。\n\n二、教學目標\n1. 認識輪軸原理的基本概念\n2. 能夠動手組裝並調整機械結構\n3. 培養觀察力與問題解決能力\n\n三、課程內容\n透過積木組裝體驗力學原理，讓學生在實作中學習。\n\n四、學習成果\n學生能夠理解並應用所學原理，完成指定的機械作品。','completed','2026-09-29 08:32:35','2026-09-29 08:32:35'),(17,3,19,'2026-06-30','16:00:00','17:30:00',1,5,'認識機器人與感測器','本堂課主題：認識機器人與感測器',NULL,'completed','2026-09-29 08:38:01','2026-09-29 08:38:01'),(18,3,19,'2026-07-07','16:00:00','17:30:00',1,5,'馬達控制基礎','本堂課主題：馬達控制基礎',NULL,'completed','2026-09-29 08:38:01','2026-09-29 08:38:01'),(19,3,19,'2026-07-14','16:00:00','17:30:00',1,5,'循序結構：讓車子動起來','本堂課主題：循序結構：讓車子動起來',NULL,'completed','2026-09-29 08:38:01','2026-09-29 08:38:01'),(20,3,19,'2026-07-21','16:00:00','17:30:00',1,5,'條件判斷：碰撞感測','本堂課主題：條件判斷：碰撞感測',NULL,'completed','2026-09-29 08:38:01','2026-09-29 08:38:01'),(21,3,19,'2026-07-28','16:00:00','17:30:00',1,5,'迴圈：重複動作與巡邏','本堂課主題：迴圈：重複動作與巡邏',NULL,'completed','2026-09-29 08:38:01','2026-09-29 08:38:01'),(22,3,19,'2026-08-04','16:00:00','17:30:00',1,5,'循線車（上）','本堂課主題：循線車（上）',NULL,'completed','2026-09-29 08:38:01','2026-09-29 08:38:01'),(23,3,19,'2026-08-11','16:00:00','17:30:00',1,5,'循線車（下）','本堂課主題：循線車（下）',NULL,'completed','2026-09-29 08:38:01','2026-09-29 08:38:01'),(24,3,19,'2026-08-18','16:00:00','17:30:00',1,5,'超音波測距原理','本堂課主題：超音波測距原理',NULL,'completed','2026-09-29 08:38:02','2026-09-29 08:38:02'),(25,3,19,'2026-08-25','16:00:00','17:30:00',1,5,'避障車設計','本堂課主題：避障車設計',NULL,'completed','2026-09-29 08:38:02','2026-09-29 08:38:02'),(26,3,19,'2026-09-01','16:00:00','17:30:00',1,5,'小組任務：迷宮挑戰','本堂課主題：小組任務：迷宮挑戰',NULL,'completed','2026-09-29 08:38:02','2026-09-29 08:38:02'),(27,5,20,'2026-09-28','18:30:00','20:00:00',1,6,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(28,5,21,'2026-09-26','10:00:00','11:30:00',1,6,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(29,6,22,'2026-09-23','16:00:00','17:30:00',2,6,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(30,7,23,'2026-09-28','16:00:00','17:00:00',2,7,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(31,7,24,'2026-09-30','10:00:00','11:00:00',1,7,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(32,7,24,'2026-09-23','10:00:00','11:00:00',1,7,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(33,8,25,'2026-09-26','09:00:00','10:00:00',2,7,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(34,9,26,'2026-09-29','18:30:00','20:00:00',2,8,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(35,9,27,'2026-09-25','16:00:00','17:30:00',1,8,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(36,10,28,'2026-09-27','14:00:00','15:30:00',1,8,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(37,11,29,'2026-09-24','16:00:00','18:00:00',2,9,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(38,11,30,'2026-09-26','14:00:00','16:00:00',1,9,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(39,12,31,'2026-09-26','10:00:00','11:30:00',2,10,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(40,12,32,'2026-09-27','10:00:00','11:30:00',1,10,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(41,13,33,'2026-09-25','18:30:00','20:00:00',2,10,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(42,14,34,'2026-09-24','10:00:00','11:30:00',1,6,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(43,14,35,'2026-09-24','18:30:00','20:00:00',2,6,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(44,15,36,'2026-09-24','09:00:00','10:00:00',1,7,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(45,15,37,'2026-09-24','16:30:00','17:30:00',1,7,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(46,16,38,'2026-09-24','09:30:00','11:00:00',2,8,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(47,16,39,'2026-09-24','15:00:00','16:30:00',1,8,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(48,17,40,'2026-09-24','11:00:00','12:30:00',2,10,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(49,17,41,'2026-09-24','13:00:00','14:30:00',1,10,NULL,NULL,NULL,'pending','2026-09-30 06:31:19','2026-09-30 06:31:19'),(50,6,22,'2026-09-30','16:00:00','17:30:00',2,6,NULL,NULL,NULL,'pending','2026-09-30 08:02:22','2026-09-30 08:02:22'),(51,2,2,'2026-10-01','14:00:00','15:30:00',2,1,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(52,3,18,'2026-10-01','18:30:00','20:00:00',1,4,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(53,5,21,'2026-10-03','10:00:00','11:30:00',1,6,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(54,8,25,'2026-10-03','09:00:00','10:00:00',2,7,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(55,9,27,'2026-10-02','16:00:00','17:30:00',1,8,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(56,10,28,'2026-10-04','14:00:00','15:30:00',1,8,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(57,11,29,'2026-10-01','16:00:00','18:00:00',2,9,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(58,11,30,'2026-10-03','14:00:00','16:00:00',1,9,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(59,12,31,'2026-10-03','10:00:00','11:30:00',2,10,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(60,12,32,'2026-10-04','10:00:00','11:30:00',1,10,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(61,13,33,'2026-10-02','18:30:00','20:00:00',2,10,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(62,14,34,'2026-10-01','10:00:00','11:30:00',1,6,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(63,14,35,'2026-10-01','18:30:00','20:00:00',2,6,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(64,15,36,'2026-10-01','09:00:00','10:00:00',1,7,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(65,15,37,'2026-10-01','16:30:00','17:30:00',1,7,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(66,16,38,'2026-10-01','09:30:00','11:00:00',2,8,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(67,16,39,'2026-10-01','15:00:00','16:30:00',1,8,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(68,17,40,'2026-10-01','11:00:00','12:30:00',2,10,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(69,17,41,'2026-10-01','13:00:00','14:30:00',1,10,NULL,NULL,NULL,'pending','2026-10-04 16:14:39','2026-10-04 16:14:39'),(70,3,19,'2026-10-06','16:00:00','17:30:00',1,5,'距離檢測器','正常上課','學生能獨立完成超音波感測器的電路接線，撰寫出具備距離判斷與自動避障功能的程式，並成功讓實體小車順利通過障礙賽道。','completed','2026-10-12 05:26:46','2026-10-12 07:09:23'),(71,2,2,'2026-10-08','14:00:00','15:30:00',2,1,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(72,3,18,'2026-10-08','18:30:00','20:00:00',1,4,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(73,5,20,'2026-10-05','18:30:00','20:00:00',1,6,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(74,5,21,'2026-10-10','10:00:00','11:30:00',1,6,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(75,6,22,'2026-10-07','16:00:00','17:30:00',2,6,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(76,7,23,'2026-10-05','16:00:00','17:00:00',2,7,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(77,7,24,'2026-10-07','10:00:00','11:00:00',1,7,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(78,8,25,'2026-10-10','09:00:00','10:00:00',2,7,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(79,9,26,'2026-10-06','18:30:00','20:00:00',2,8,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(80,9,27,'2026-10-09','16:00:00','17:30:00',1,8,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(81,10,28,'2026-10-11','14:00:00','15:30:00',1,8,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(82,11,29,'2026-10-08','16:00:00','18:00:00',2,9,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(83,11,30,'2026-10-10','14:00:00','16:00:00',1,9,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(84,12,31,'2026-10-10','10:00:00','11:30:00',2,10,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(85,12,32,'2026-10-11','10:00:00','11:30:00',1,10,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(86,13,33,'2026-10-09','18:30:00','20:00:00',2,10,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(87,14,34,'2026-10-08','10:00:00','11:30:00',1,6,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(88,14,35,'2026-10-08','18:30:00','20:00:00',2,6,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(89,15,36,'2026-10-08','09:00:00','10:00:00',1,7,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(90,15,37,'2026-10-08','16:30:00','17:30:00',1,7,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(91,16,38,'2026-10-08','09:30:00','11:00:00',2,8,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(92,16,39,'2026-10-08','15:00:00','16:30:00',1,8,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(93,17,40,'2026-10-08','11:00:00','12:30:00',2,10,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(94,17,41,'2026-10-08','13:00:00','14:30:00',1,10,NULL,NULL,NULL,'pending','2026-10-12 05:56:39','2026-10-12 05:56:39'),(95,3,19,'2026-10-12','16:00:00','17:30:00',1,5,'距離檢測器','正常上課','學生能獨力或分組完成一具運用槓桿與齒輪機構的機械臂，並成功抓取指定重量的物品，展現對機構物理原理的實際應用能力。','completed','2026-10-12 08:27:28','2026-10-12 08:27:28'),(96,7,23,'2026-10-12','16:00:00','17:00:00',2,7,NULL,NULL,NULL,'pending','2026-10-12 08:33:45','2026-10-12 08:33:45'),(97,3,19,'2026-10-13','16:00:00','17:30:00',1,5,NULL,NULL,NULL,'pending','2026-10-13 13:57:07','2026-10-13 13:57:07'),(98,5,20,'2026-10-12','18:30:00','20:00:00',1,6,NULL,NULL,NULL,'pending','2026-10-13 13:57:07','2026-10-13 13:57:07'),(99,9,26,'2026-10-13','18:30:00','20:00:00',2,8,NULL,NULL,NULL,'pending','2026-10-13 13:57:07','2026-10-13 13:57:07'),(100,5,21,'2026-03-07','10:00:00','11:30:00',1,6,'認識程式積木與主機','本堂課主題：認識程式積木與主機',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(101,5,21,'2026-03-14','10:00:00','11:30:00',1,6,'馬達轉動與方向控制','本堂課主題：馬達轉動與方向控制',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(102,5,21,'2026-03-21','10:00:00','11:30:00',1,6,'等待與時間控制','本堂課主題：等待與時間控制',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(103,5,21,'2026-03-28','10:00:00','11:30:00',1,6,'觸碰感應器：按下就啟動','本堂課主題：觸碰感應器：按下就啟動',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(104,5,21,'2026-04-11','10:00:00','11:30:00',1,6,'迴圈：重複執行的機關','本堂課主題：迴圈：重複執行的機關',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(105,5,21,'2026-04-18','10:00:00','11:30:00',1,6,'顏色感應器分類機','本堂課主題：顏色感應器分類機',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(106,5,21,'2026-04-25','10:00:00','11:30:00',1,6,'條件判斷：如果…就…','本堂課主題：條件判斷：如果…就…',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(107,5,21,'2026-05-09','10:00:00','11:30:00',1,6,'齒輪傳動與速度變化','本堂課主題：齒輪傳動與速度變化',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(108,5,21,'2026-05-16','10:00:00','11:30:00',1,6,'自動門專題（上）','本堂課主題：自動門專題（上）',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(109,5,21,'2026-05-23','10:00:00','11:30:00',1,6,'自動門專題（下）','本堂課主題：自動門專題（下）',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(110,5,21,'2026-06-06','10:00:00','11:30:00',1,6,'期末創作：我的機械裝置','本堂課主題：期末創作：我的機械裝置',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00'),(111,5,21,'2026-06-13','10:00:00','11:30:00',1,6,'期末成果發表','本堂課主題：期末成果發表',NULL,'completed','2026-10-13 14:50:00','2026-10-13 14:50:00');
/*!40000 ALTER TABLE `course_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_schedules`
--

DROP TABLE IF EXISTS `course_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_schedules` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_id` int NOT NULL,
  `day_of_week` tinyint NOT NULL COMMENT '0=週日, 1=週一, ..., 6=週六',
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `classroom_id` int DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `deleted_at` datetime DEFAULT NULL,
  `teacher_id` int DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `course_id` (`course_id`),
  KEY `classroom_id` (`classroom_id`),
  CONSTRAINT `course_schedules_ibfk_1` FOREIGN KEY (`course_id`) REFERENCES `courses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `course_schedules_ibfk_2` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_schedules`
--

LOCK TABLES `course_schedules` WRITE;
/*!40000 ALTER TABLE `course_schedules` DISABLE KEYS */;
INSERT INTO `course_schedules` VALUES (2,2,4,'14:00:00','15:30:00',2,1,'2026-08-27 11:39:57',NULL,1),(18,3,4,'18:30:00','20:00:00',1,1,'2026-09-03 06:12:22',NULL,4),(19,3,2,'16:00:00','17:30:00',1,1,'2026-09-13 14:32:32',NULL,5),(20,5,1,'18:30:00','20:00:00',1,1,'2026-09-29 12:06:11',NULL,6),(21,5,6,'10:00:00','11:30:00',1,1,'2026-09-29 12:06:11',NULL,6),(22,6,3,'16:00:00','17:30:00',2,1,'2026-09-29 12:06:11',NULL,6),(23,7,1,'16:00:00','17:00:00',2,1,'2026-09-29 12:06:11',NULL,7),(24,7,3,'10:00:00','11:00:00',1,1,'2026-09-29 12:06:11',NULL,7),(25,8,6,'09:00:00','10:00:00',2,1,'2026-09-29 12:06:11',NULL,7),(26,9,2,'18:30:00','20:00:00',2,1,'2026-09-29 12:06:11',NULL,8),(27,9,5,'16:00:00','17:30:00',1,1,'2026-09-29 12:06:11',NULL,8),(28,10,0,'14:00:00','15:30:00',1,1,'2026-09-29 12:06:11',NULL,8),(29,11,4,'16:00:00','18:00:00',2,1,'2026-09-29 12:06:11',NULL,9),(30,11,6,'14:00:00','16:00:00',1,1,'2026-09-29 12:06:11',NULL,9),(31,12,6,'10:00:00','11:30:00',2,1,'2026-09-29 12:06:11',NULL,10),(32,12,0,'10:00:00','11:30:00',1,1,'2026-09-29 12:06:11',NULL,10),(33,13,5,'18:30:00','20:00:00',2,1,'2026-09-29 12:06:11',NULL,10),(34,14,4,'10:00:00','11:30:00',1,1,'2026-09-29 12:09:58',NULL,6),(35,14,4,'18:30:00','20:00:00',2,1,'2026-09-29 12:09:58',NULL,6),(36,15,4,'09:00:00','10:00:00',1,1,'2026-09-29 12:09:58',NULL,7),(37,15,4,'16:30:00','17:30:00',1,1,'2026-09-29 12:09:58',NULL,7),(38,16,4,'09:30:00','11:00:00',2,1,'2026-09-29 12:09:58',NULL,8),(39,16,4,'15:00:00','16:30:00',1,1,'2026-09-29 12:09:58',NULL,8),(40,17,4,'11:00:00','12:30:00',2,1,'2026-09-29 12:09:58',NULL,10),(41,17,4,'13:00:00','14:30:00',1,1,'2026-09-29 12:09:58',NULL,10);
/*!40000 ALTER TABLE `course_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `course_types`
--

DROP TABLE IF EXISTS `course_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `course_types` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '顯示顏色',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `course_types`
--

LOCK TABLES `course_types` WRITE;
/*!40000 ALTER TABLE `course_types` DISABLE KEYS */;
INSERT INTO `course_types` VALUES (1,'幼兒簡易機械',NULL,'#4CAF50',1,'2026-08-27 10:00:58'),(2,'動力機械',NULL,'#2196F3',1,'2026-08-27 10:00:58'),(3,'程式機械',NULL,'#FF9800',1,'2026-08-27 10:00:58'),(4,'科創機器人',NULL,'#9C27B0',1,'2026-08-27 10:00:58'),(5,'專題班',NULL,'#F44336',1,'2026-08-27 10:00:58');
/*!40000 ALTER TABLE `course_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `courses`
--

DROP TABLE IF EXISTS `courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `courses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `course_type_id` int DEFAULT NULL,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `age_range` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '適合年齡',
  `teacher_id` int DEFAULT NULL,
  `classroom_id` int DEFAULT NULL,
  `max_students` int DEFAULT '10',
  `fee` decimal(10,2) DEFAULT '0.00',
  `status` enum('active','inactive','completed') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `course_type_id` (`course_type_id`),
  KEY `teacher_id` (`teacher_id`),
  KEY `classroom_id` (`classroom_id`),
  KEY `idx_courses_status` (`status`),
  CONSTRAINT `courses_ibfk_1` FOREIGN KEY (`course_type_id`) REFERENCES `course_types` (`id`),
  CONSTRAINT `courses_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`),
  CONSTRAINT `courses_ibfk_3` FOREIGN KEY (`classroom_id`) REFERENCES `classrooms` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `courses`
--

LOCK TABLES `courses` WRITE;
/*!40000 ALTER TABLE `courses` DISABLE KEYS */;
INSERT INTO `courses` VALUES (2,NULL,'動力機械','動力機械','7-8',NULL,NULL,10,0.00,'active','2026-08-27 11:34:08','2026-09-03 06:03:16'),(3,4,'科創機器人','科創機器人','10-13',NULL,NULL,10,0.00,'active','2026-09-03 06:11:32','2026-09-29 08:44:42'),(4,3,'程式機械基礎班','洪大寶老師負責之程式機械課程','9-12',NULL,1,10,0.00,'inactive','2026-09-13 14:32:32','2026-09-13 14:34:54'),(5,3,'程式機械進階班','[seed-demo] 示範課程','10-12歲',6,1,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(6,3,'程式機械入門班','[seed-demo] 示範課程','8-10歲',6,2,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(7,1,'幼兒簡易機械A班','[seed-demo] 示範課程','4-6歲',7,2,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(8,1,'幼兒簡易機械B班','[seed-demo] 示範課程','5-7歲',7,2,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(9,2,'動力機械B班','[seed-demo] 示範課程','9-12歲',8,2,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(10,2,'動力機械假日班','[seed-demo] 示範課程','9-12歲',8,1,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(11,5,'專題實作班','[seed-demo] 示範課程','11-15歲',9,2,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(12,4,'科創機器人週末班','[seed-demo] 示範課程','8-12歲',10,2,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(13,4,'科創機器人晚間班','[seed-demo] 示範課程','10-13歲',10,2,10,0.00,'active','2026-09-29 12:06:11','2026-09-29 12:06:11'),(14,3,'程式機械平日班','[seed-demo] 示範課程','9-12歲',6,1,10,0.00,'active','2026-09-29 12:09:58','2026-09-29 12:09:58'),(15,1,'幼兒簡易機械C班','[seed-demo] 示範課程','4-6歲',7,1,10,0.00,'active','2026-09-29 12:09:58','2026-09-29 12:09:58'),(16,2,'動力機械C班','[seed-demo] 示範課程','9-12歲',8,2,10,0.00,'active','2026-09-29 12:09:58','2026-09-29 12:09:58'),(17,4,'科創機器人平日班','[seed-demo] 示範課程','8-12歲',10,2,10,0.00,'active','2026-09-29 12:09:58','2026-09-29 12:09:58');
/*!40000 ALTER TABLE `courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `department_recommendations`
--

DROP TABLE IF EXISTS `department_recommendations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `department_recommendations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `department` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '推薦科系',
  `reason` text COLLATE utf8mb4_unicode_ci COMMENT '推薦理由',
  `introduction` text COLLATE utf8mb4_unicode_ci COMMENT '學類介紹',
  `career_directions` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '就業方向',
  `career_salary` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '薪資範圍',
  `suggestion` text COLLATE utf8mb4_unicode_ci COMMENT '學習建議',
  `generated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP COMMENT '生成時間',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_student` (`student_id`),
  KEY `idx_generated_at` (`generated_at`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='AI科系推薦紀錄';
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `department_recommendations`
--

LOCK TABLES `department_recommendations` WRITE;
/*!40000 ALTER TABLE `department_recommendations` DISABLE KEYS */;
INSERT INTO `department_recommendations` VALUES (5,32,'電機工程學系','小晴具備頂尖的程式與團隊合作能力，且在機器人競賽中屢創佳績，特別是在全國STEAM機器人賽勇奪第一。機器人技術高度依賴電機工程中的自動控制、感測器整合與嵌入式系統。小晴極佳的除錯與結構組織能力，非常適合投入電機領域進行軟硬體整合的深度學習。','電機工程學類為現代科技的核心樞紐，學習範疇涵蓋自動控制、嵌入式系統、微電子學、訊號處理與人工智慧應用。學生將學習如何結合硬體電路設計與軟體程式編程，使機器或系統具備智慧化運作的能力，是推進智慧製造、機器人及物聯網發展不可或缺的學科。','機器人工程師、嵌入式系統工程師、自動控制工程師、韌體研發工程師、半導體工程師','學士畢業約 45,000 - 55,000 元，碩士畢業約 60,000 - 80,000 元','小晴在程式與實作表現極為優異，建議未來可著重提升「創意表現」。平時可多接觸跨','2026-10-12 08:33:21');
/*!40000 ALTER TABLE `department_recommendations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `holidays` (
  `id` int NOT NULL AUTO_INCREMENT,
  `holiday_date` date NOT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('national','custom') COLLATE utf8mb4_unicode_ci DEFAULT 'custom',
  `is_recurring` tinyint(1) DEFAULT '0' COMMENT '是否每年重複',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_holiday` (`holiday_date`),
  KEY `idx_holidays_date` (`holiday_date`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
INSERT INTO `holidays` VALUES (1,'2026-01-01','元旦','national',0,'2026-08-27 10:00:58'),(2,'2026-01-28','除夕','national',0,'2026-08-27 10:00:58'),(3,'2026-01-29','春節','national',0,'2026-08-27 10:00:58'),(4,'2026-01-30','春節','national',0,'2026-08-27 10:00:58'),(5,'2026-01-31','春節','national',0,'2026-08-27 10:00:58'),(6,'2026-02-28','和平紀念日','national',0,'2026-08-27 10:00:58'),(7,'2026-04-04','兒童節','national',0,'2026-08-27 10:00:58'),(8,'2026-04-05','清明節','national',0,'2026-08-27 10:00:58'),(9,'2026-05-01','勞動節','national',0,'2026-08-27 10:00:58'),(10,'2026-05-31','端午節','national',0,'2026-08-27 10:00:58'),(11,'2026-09-21','中秋節','national',0,'2026-08-27 10:00:58'),(12,'2026-10-10','國慶日','national',0,'2026-08-27 10:00:58');
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `log_permissions`
--

DROP TABLE IF EXISTS `log_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `log_permissions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `teacher_id` int NOT NULL,
  `granted_by` int DEFAULT NULL COMMENT '授權者 user_id',
  `granted_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_enabled` tinyint(1) DEFAULT '1',
  `config` json DEFAULT NULL COMMENT '設定參數',
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `type` (`type`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_settings`
--

LOCK TABLES `notification_settings` WRITE;
/*!40000 ALTER TABLE `notification_settings` DISABLE KEYS */;
INSERT INTO `notification_settings` VALUES (1,'teacher_log_reminder',1,'{\"hours_after_class\": 2}','2026-08-27 10:00:58'),(2,'student_makeup_reminder',1,'{\"time\": \"10:00\", \"day_of_week\": 5}','2026-08-27 10:00:58');
/*!40000 ALTER TABLE `notification_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `point_transactions`
--

DROP TABLE IF EXISTS `point_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `point_transactions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `amount` int NOT NULL,
  `reason` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `operator_id` int DEFAULT NULL,
  `reference_type` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reference_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_student_id` (`student_id`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `point_transactions`
--

LOCK TABLES `point_transactions` WRITE;
/*!40000 ALTER TABLE `point_transactions` DISABLE KEYS */;
INSERT INTO `point_transactions` VALUES (1,32,10,'課堂表現','日誌記錄獎勵 (日誌ID:5)',1,NULL,NULL,'2026-09-13 14:27:54','2026-09-22 08:09:27'),(4,10,1,'課堂表現','日誌記錄獎勵 (日誌ID:5)',44,NULL,NULL,'2026-09-14 08:28:02','2026-09-22 08:09:27'),(5,10,1,'課堂表現','日誌記錄獎勵 (日誌ID:16)',44,'log',16,'2026-09-29 08:32:35','2026-09-29 08:32:35'),(6,32,1,'課堂表現','日誌記錄獎勵 (日誌ID:16)',44,'log',16,'2026-09-29 08:32:35','2026-09-29 08:32:35'),(7,32,3,'課堂表現','日誌記錄獎勵 (日誌ID:70)',44,'log',70,'2026-10-12 06:48:18','2026-10-12 06:48:18'),(8,10,3,'課堂表現','日誌記錄獎勵 (日誌ID:70)',44,'log',70,'2026-10-12 06:48:18','2026-10-12 06:48:18'),(9,10,1,'課堂表現','日誌記錄獎勵 (日誌ID:95)',44,'log',95,'2026-10-12 08:27:28','2026-10-12 08:27:28');
/*!40000 ALTER TABLE `point_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reward_redemptions`
--

DROP TABLE IF EXISTS `reward_redemptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reward_redemptions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `student_id` int NOT NULL,
  `reward_id` int NOT NULL,
  `points_used` int NOT NULL,
  `status` enum('pending','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `redeemed_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rewards` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `points_required` int NOT NULL,
  `quantity` int DEFAULT '0' COMMENT '庫存數量',
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `schedule_adjustments` (
  `id` int NOT NULL AUTO_INCREMENT,
  `schedule_id` int NOT NULL,
  `original_date` date DEFAULT NULL,
  `adjusted_date` date DEFAULT NULL,
  `adjusted_start_time` time DEFAULT NULL,
  `adjusted_end_time` time DEFAULT NULL,
  `adjusted_classroom_id` int DEFAULT NULL,
  `adjusted_teacher_id` int DEFAULT NULL COMMENT '代課老師 (teachers.id)',
  `adjustment_type` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'time' COMMENT '調課類型: time/teacher/time_teacher (相容舊值 cancel/reschedule/makeup)',
  `status` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'adjusted',
  `created_by` int DEFAULT NULL COMMENT '建立者 (users.id)',
  `reason` text COLLATE utf8mb4_unicode_ci,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `schedule_adjustments`
--

LOCK TABLES `schedule_adjustments` WRITE;
/*!40000 ALTER TABLE `schedule_adjustments` DISABLE KEYS */;
INSERT INTO `schedule_adjustments` VALUES (5,2,'2026-09-03','2026-09-04','14:00:00','15:30:00',NULL,NULL,'time','adjusted',2,NULL,'2026-09-02 21:36:52','2026-09-02 21:36:52');
/*!40000 ALTER TABLE `schedule_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff_profiles`
--

DROP TABLE IF EXISTS `staff_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff_profiles` (
  `user_id` int NOT NULL,
  `title` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '職稱',
  `hire_date` date DEFAULT NULL COMMENT '到職日',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT '備註',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`),
  CONSTRAINT `staff_profiles_user_fk` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff_profiles`
--

LOCK TABLES `staff_profiles` WRITE;
/*!40000 ALTER TABLE `staff_profiles` DISABLE KEYS */;
/*!40000 ALTER TABLE `staff_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_log_photos`
--

DROP TABLE IF EXISTS `student_log_photos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_log_photos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `record_id` int NOT NULL,
  `photo_url` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `caption` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uploaded_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `record_id` (`record_id`),
  CONSTRAINT `student_log_photos_ibfk_1` FOREIGN KEY (`record_id`) REFERENCES `student_log_records` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_log_photos`
--

LOCK TABLES `student_log_photos` WRITE;
/*!40000 ALTER TABLE `student_log_photos` DISABLE KEYS */;
INSERT INTO `student_log_photos` VALUES (1,5,'/uploads/photos/1790670722415-28784326.jpg',NULL,'2026-09-29 08:32:35'),(2,6,'/uploads/photos/1790670727603-438447908.jpg',NULL,'2026-09-29 08:32:35'),(5,20,'/uploads/photos/1791787661510-490144804.jpg',NULL,'2026-10-12 07:09:23'),(6,19,'/uploads/photos/1791787694595-596255818.jpg',NULL,'2026-10-12 07:09:23'),(7,21,'/uploads/photos/1791793572950-42970831.jpg',NULL,'2026-10-12 08:27:28');
/*!40000 ALTER TABLE `student_log_photos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_log_records`
--

DROP TABLE IF EXISTS `student_log_records`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `student_log_records` (
  `id` int NOT NULL AUTO_INCREMENT,
  `log_id` int NOT NULL,
  `student_id` int NOT NULL,
  `attendance` enum('present','absent','late','excused','makeup','no_class') COLLATE utf8mb4_unicode_ci DEFAULT 'present' COMMENT '出勤狀態',
  `performance` text COLLATE utf8mb4_unicode_ci COMMENT '課堂表現',
  `notes` text COLLATE utf8mb4_unicode_ci COMMENT '備註',
  `skill_programming` tinyint DEFAULT '0' COMMENT '程式能力',
  `skill_debugging` tinyint DEFAULT '0' COMMENT '除錯能力',
  `skill_creativity` tinyint DEFAULT '0' COMMENT '創意能力',
  `skill_structure` tinyint DEFAULT '0' COMMENT '結構能力',
  `skill_teamwork` tinyint DEFAULT '0' COMMENT '團隊合作',
  `points_earned` int DEFAULT '0' COMMENT '獲得點數',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_student_log` (`log_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `student_log_records_ibfk_1` FOREIGN KEY (`log_id`) REFERENCES `course_logs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_log_records_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_log_records`
--

LOCK TABLES `student_log_records` WRITE;
/*!40000 ALTER TABLE `student_log_records` DISABLE KEYS */;
INSERT INTO `student_log_records` VALUES (1,5,32,'present','能專注參與課程，主動嘗試除錯並完成避障車任務','第一次上課，適應良好',3,3,4,3,4,10,'2026-09-13 14:27:54','2026-09-13 14:53:39'),(4,5,10,'present','郭宇軒同學在本次課程中表現優異，展現出抗挫折力強、思維邏輯靈活等特質。在團隊合作環節中積極參與，能夠獨立完成機器人組裝任務，展現出良好的邏輯思維能力。在偏好獨立探索方面持續成長中，建議持續關注與引導。',NULL,5,4,4,4,2,1,'2026-09-14 08:28:02','2026-09-14 08:28:02'),(5,16,10,'present','郭宇軒同學在本次課程中表現優異，展現出組裝效率高等特質。在團隊合作環節中積極參與，能夠獨立完成機器人組裝任務，展現出良好的邏輯思維能力。建議繼續保持這樣的學習態度。',NULL,4,4,4,5,4,1,'2026-09-29 08:32:35','2026-09-29 08:32:35'),(6,16,32,'present','郭小晴同學在本次課程中表現優異，展現出組裝效率高等特質。在團隊合作環節中積極參與，能夠獨立完成機器人組裝任務，展現出良好的邏輯思維能力。建議繼續保持這樣的學習態度。',NULL,4,4,4,5,4,1,'2026-09-29 08:32:35','2026-09-29 08:32:35'),(7,17,32,'present','初次接觸機器人，對感測器很好奇，操作上仍需協助。',NULL,2,1,3,2,3,3,'2026-09-29 08:38:01','2026-09-29 08:38:01'),(8,18,32,'present','能依步驟完成馬達接線，程式需在老師提示下完成。',NULL,2,2,3,2,3,3,'2026-09-29 08:38:01','2026-09-29 08:38:01'),(9,19,32,'present','理解循序執行概念，能讓車子依指令前進與轉彎。',NULL,3,2,3,2,3,4,'2026-09-29 08:38:01','2026-09-29 08:38:01'),(10,20,32,'present','能使用條件判斷處理碰撞，並自行加入聲音回饋的創意。',NULL,3,2,4,3,3,4,'2026-09-29 08:38:01','2026-09-29 08:38:01'),(11,21,32,'present','能用迴圈簡化重複指令，偶爾忘記設定結束條件。',NULL,3,3,3,3,3,4,'2026-09-29 08:38:01','2026-09-29 08:38:01'),(12,22,32,'present','循線感測數值調整有耐心，與組員分工良好。',NULL,3,3,3,3,4,4,'2026-09-29 08:38:01','2026-09-29 08:38:01'),(13,23,32,'present','成功完成循線車，並嘗試優化轉彎速度。',NULL,3,3,4,3,4,5,'2026-09-29 08:38:02','2026-09-29 08:38:02'),(14,24,32,'present','理解超音波測距原理，能讀取並顯示距離數值。',NULL,4,3,4,3,3,5,'2026-09-29 08:38:02','2026-09-29 08:38:02'),(15,25,32,'present','避障車邏輯清楚，能獨立找出感測距離設定錯誤。',NULL,4,4,4,4,4,5,'2026-09-29 08:38:02','2026-09-29 08:38:02'),(16,26,32,'present','迷宮挑戰中擔任程式負責人，提出獨特的轉向策略。',NULL,4,3,5,4,5,6,'2026-09-29 08:38:02','2026-09-29 08:38:02'),(17,10,32,'present','能將程式拆分成副程式，結構更清楚。',NULL,4,4,4,4,4,5,'2026-09-29 08:38:02','2026-09-29 08:38:02'),(18,9,32,'present','主動協助同學除錯，作品完成度高。',NULL,5,4,5,4,4,6,'2026-09-29 08:38:02','2026-09-29 08:38:02'),(19,70,10,'present','宇軒對創客與程式設計充滿好奇與熱忱，課堂上總閃耀著探索的光芒。憑著敏銳的觀察力，他常能注意到許多微小細節，並主動嘗試各種解決方案，展現出豐沛的學習動能。隨著本學期的成長，若能持續將飛揚豐富的思緒聚焦於眼前專案，發揮細心優勢，相信宇軒未來一定能在創客領域展現更耀眼的成果！',NULL,4,4,4,3,3,3,'2026-10-12 06:48:18','2026-10-12 06:48:18'),(20,70,32,'present','小晴那雙閃耀著極高專注力的眼睛，是課堂上最美的風景。分析程式邏輯時，她總能精準拆解複雜的指令；帶領團隊時，她熱情地穿梭在同儕之間，耐心引導大家共同解決難題。小晴充沛的社交能量總是能活絡課堂氣氛，若能適時拿捏這份熱情，在熱絡互動與深思熟慮間找到最佳平衡，相信小晴一定能在未來的創客旅程中飛得更高更遠！',NULL,5,4,3,4,5,3,'2026-10-12 06:48:18','2026-10-12 06:48:18'),(21,95,10,'present','宇軒身上最耀眼的就是那股越挫越勇的韌性。面對複雜的機器人結構與程式邏輯，他總能迅速拆解空間脈絡，眼神閃爍著探索的熱情，一遍遍調整零件與程式碼直至完美運作。課堂上的宇軒活力四射，若能將這份充沛的社交能量適度轉化為專注於專案的定力，相信他在創客領域的表現絕對不可限量！',NULL,4,5,4,5,3,1,'2026-10-12 08:27:28','2026-10-12 08:27:28'),(24,100,32,'present','第一次接觸圖控程式，能跟著步驟完成範例。',NULL,1,1,2,2,2,3,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(25,101,32,'present','能讓馬達正反轉，接線位置還需要提醒。',NULL,2,1,2,2,3,3,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(26,102,32,'present','理解等待積木的用途，嘗試調整秒數觀察差異。',NULL,2,2,3,2,3,3,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(27,103,32,'present','能用觸碰感應器啟動機構，機構組裝穩固。',NULL,2,2,3,3,3,4,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(28,104,32,'present','學會使用迴圈，作品能持續運轉。',NULL,3,2,3,3,3,4,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(29,105,32,'present','分類機加入自己的顏色規則，很有想法。',NULL,3,2,4,3,3,4,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(30,106,32,'present','能說出條件判斷的流程，與組員討論熱烈。',NULL,3,3,3,3,4,4,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(31,107,32,'present','理解大小齒輪對速度的影響，結構設計進步明顯。',NULL,3,3,4,4,3,5,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(32,108,32,'present','負責自動門的程式設計，能自己找出感應範圍的問題。',NULL,3,3,4,4,4,5,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(33,109,32,'present','完成自動門並上台說明運作方式，表達清楚。',NULL,4,3,4,4,4,5,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(34,110,32,'present','期末作品結合感應器與迴圈，創意與完成度都很好。',NULL,4,3,5,4,4,6,'2026-10-13 14:50:00','2026-10-13 14:50:00'),(35,111,32,'present','成果發表表現穩健，並主動協助同學除錯，順利結業。',NULL,4,4,5,4,5,6,'2026-10-13 14:50:00','2026-10-13 14:50:00');
/*!40000 ALTER TABLE `student_log_records` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `students` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `student_code` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '學生編號',
  `birth_date` date DEFAULT NULL,
  `gender` enum('male','female','other') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `school` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `grade` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '年級',
  `parent_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `parent_email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` text COLLATE utf8mb4_unicode_ci,
  `enrollment_date` date DEFAULT NULL,
  `status` enum('active','inactive','graduated') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `course_type_id` int DEFAULT NULL,
  `classroom_id` int DEFAULT NULL,
  `teacher_id` int DEFAULT NULL COMMENT '授課老師',
  `trial_teacher_id` int DEFAULT NULL COMMENT '體驗課老師',
  `trial_topic` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '體驗課主題',
  `parent_name_father` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '父親姓名',
  `parent_phone_father` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '父親電話',
  `parent_name_mother` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '母親姓名',
  `parent_phone_mother` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '母親電話',
  `lesson_count` int NOT NULL DEFAULT '0' COMMENT '堂數',
  `points_balance` int DEFAULT '80',
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_code` (`student_code`),
  KEY `user_id` (`user_id`),
  KEY `idx_students_status` (`status`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=43 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES (2,8,NULL,'2026-08-13',NULL,'太平國小',NULL,NULL,NULL,NULL,NULL,'2026-08-27','active',NULL,'2026-08-27 11:30:51','2026-08-27 11:30:51',2,2,1,NULL,NULL,'王大明','0970637133',NULL,NULL,0,80),(3,11,NULL,'2017-03-05','female','何厝國小','小三',NULL,NULL,NULL,NULL,'2026-04-25','active','[seed-demo]','2026-09-02 15:21:39','2026-09-02 15:21:39',1,1,1,NULL,NULL,'洪爸爸','0915115327','劉媽媽','0907970056',17,80),(4,12,NULL,'2013-12-09','female','太平國小','小三',NULL,NULL,NULL,NULL,'2025-05-12','active','[seed-demo]','2026-09-02 15:21:39','2026-09-02 15:21:39',3,2,1,NULL,NULL,'賴爸爸','0902358010','吳媽媽','0926531101',0,80),(5,13,NULL,'2018-11-05','female','塗城國小','小六',NULL,NULL,NULL,NULL,'2025-10-04','active','[seed-demo]','2026-09-02 15:21:39','2026-09-02 15:21:39',3,2,1,NULL,NULL,'邱爸爸','0987279236','楊媽媽','0900902649',17,80),(6,14,NULL,'2016-07-24','female','軍功國小','小一',NULL,NULL,NULL,NULL,'2026-12-15','active','[seed-demo]','2026-09-02 15:21:39','2026-09-02 15:21:39',1,1,1,NULL,NULL,'林爸爸','0994858106','黃媽媽','0954177832',1,80),(7,15,NULL,'2015-03-16','female','東光國小','小五',NULL,NULL,NULL,NULL,'2025-04-05','active','[seed-demo]','2026-09-02 15:21:39','2026-09-02 15:21:39',4,1,1,NULL,NULL,'曾爸爸','0995221729','曾媽媽','0915058219',10,80),(8,16,NULL,'2018-01-17','male','大進國小','小六',NULL,NULL,NULL,NULL,'2026-10-03','active','[seed-demo]','2026-09-02 15:21:40','2026-09-02 15:21:40',3,1,1,NULL,NULL,'劉爸爸','0923322569','葉媽媽','0974369545',14,80),(9,17,NULL,'2014-11-04','female','東光國小','小三',NULL,NULL,NULL,NULL,'2026-05-25','active','[seed-demo]','2026-09-02 15:21:40','2026-09-02 15:21:40',5,1,1,NULL,NULL,'陳爸爸','0990957359','李媽媽','0989020131',4,80),(10,18,NULL,'2019-11-17','male','大進國小','幼兒',NULL,NULL,NULL,NULL,'2025-12-01','active','[seed-demo]','2026-09-02 15:21:40','2026-10-12 08:27:28',4,2,1,NULL,NULL,'張爸爸','0928210362','楊媽媽','0928835475',12,86),(11,19,NULL,'2013-08-24','female','何厝國小','小五',NULL,NULL,NULL,NULL,'2026-01-05','active','[seed-demo]','2026-09-02 15:21:40','2026-09-02 15:21:40',5,1,1,NULL,NULL,'林爸爸','0900246813','陳媽媽','0953784044',5,80),(12,20,NULL,'2020-10-13','female','文昌國小','小四',NULL,NULL,NULL,NULL,'2026-11-08','active','[seed-demo]','2026-09-02 15:21:40','2026-09-02 15:21:40',3,1,1,NULL,NULL,'洪爸爸','0982432001','周媽媽','0913649293',4,80),(13,21,NULL,'2017-03-25','female','永春國小','小五',NULL,NULL,NULL,NULL,'2025-02-20','active','[seed-demo]','2026-09-02 15:21:40','2026-09-02 15:21:40',2,1,1,NULL,NULL,'周爸爸','0966222992','曾媽媽','0951962895',23,80),(14,22,NULL,'2019-11-22','male','太平國小','小一',NULL,NULL,NULL,NULL,'2026-11-14','active','[seed-demo]','2026-09-02 15:21:40','2026-09-02 15:21:40',5,1,1,NULL,NULL,'楊爸爸','0916856642','洪媽媽','0905387835',13,80),(15,23,NULL,'2017-09-07','male','省三國小','小二',NULL,NULL,NULL,NULL,'2026-12-23','active','[seed-demo]','2026-09-02 15:21:40','2026-09-02 15:21:40',3,2,1,NULL,NULL,'周爸爸','0911039820','王媽媽','0913326620',14,80),(16,24,NULL,'2016-09-09','male','惠文國小','小五',NULL,NULL,NULL,NULL,'2026-01-23','active','[seed-demo]','2026-09-02 15:21:40','2026-09-02 15:21:40',2,1,1,NULL,NULL,'洪爸爸','0958602265','吳媽媽','0916680298',8,80),(17,25,NULL,'2020-04-25','male','大進國小','小二',NULL,NULL,NULL,NULL,'2025-02-03','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',5,1,1,NULL,NULL,'林爸爸','0972244461','葉媽媽','0959789123',15,80),(18,26,NULL,'2017-11-18','male','永春國小','幼兒',NULL,NULL,NULL,NULL,'2026-02-16','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',1,2,1,NULL,NULL,'李爸爸','0947308217','陳媽媽','0975152447',11,80),(19,27,NULL,'2019-09-11','female','太平國小','小五',NULL,NULL,NULL,NULL,'2025-03-04','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',1,2,1,NULL,NULL,'林爸爸','0947365206','陳媽媽','0931675351',6,80),(20,28,NULL,'2013-07-14','female','軍功國小','小六',NULL,NULL,NULL,NULL,'2025-09-09','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',1,1,1,NULL,NULL,'郭爸爸','0994949460','吳媽媽','0965468670',20,80),(21,29,NULL,'2014-09-10','female','何厝國小','小六',NULL,NULL,NULL,NULL,'2026-08-05','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',2,2,1,NULL,NULL,'林爸爸','0954392459','吳媽媽','0947258756',14,80),(22,30,NULL,'2014-06-21','male','太平國小','小二',NULL,NULL,NULL,NULL,'2026-05-15','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',4,2,1,NULL,NULL,'賴爸爸','0935475820','黃媽媽','0920364986',1,80),(23,31,NULL,'2014-11-12','female','軍功國小','小二',NULL,NULL,NULL,NULL,'2025-12-25','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',5,2,1,NULL,NULL,'王爸爸','0995708772','邱媽媽','0904303111',5,80),(24,32,NULL,'2014-02-28','male','文昌國小','小四',NULL,NULL,NULL,NULL,'2026-03-14','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',1,1,1,NULL,NULL,'邱爸爸','0943077745','廖媽媽','0989126038',19,80),(25,33,NULL,'2016-02-13','male','塗城國小','小六',NULL,NULL,NULL,NULL,'2025-04-05','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',2,1,1,NULL,NULL,'邱爸爸','0932973470','林媽媽','0900139278',21,80),(26,34,NULL,'2021-11-28','male','惠文國小','小二',NULL,NULL,NULL,NULL,'2026-07-19','active','[seed-demo]','2026-09-02 15:21:41','2026-09-02 15:21:41',3,2,1,NULL,NULL,'鄭爸爸','0978521024','周媽媽','0971002850',20,80),(27,35,NULL,'2020-01-18','female','省三國小','幼兒',NULL,NULL,NULL,NULL,'2026-08-22','active','[seed-demo]','2026-09-02 15:21:42','2026-09-02 15:21:42',4,2,1,NULL,NULL,'李爸爸','0993580442','黃媽媽','0920659495',14,80),(28,36,NULL,'2016-11-19','male','文昌國小','小三',NULL,NULL,NULL,NULL,'2026-07-10','active','[seed-demo]','2026-09-02 15:21:42','2026-09-02 15:21:42',5,1,1,NULL,NULL,'鄭爸爸','0927401906','賴媽媽','0923147632',23,80),(29,37,NULL,'2017-09-09','female','大進國小','幼兒',NULL,NULL,NULL,NULL,'2025-02-21','active','[seed-demo]','2026-09-02 15:21:42','2026-09-02 15:21:42',5,1,1,NULL,NULL,'林爸爸','0953238511','許媽媽','0939292709',13,80),(30,38,NULL,'2017-05-12','female','永春國小','小三',NULL,NULL,NULL,NULL,'2025-10-16','active','[seed-demo]','2026-09-02 15:21:42','2026-09-02 15:21:42',1,1,1,NULL,NULL,'陳爸爸','0976964026','郭媽媽','0987850471',11,80),(31,39,NULL,'2019-01-14','male','大元國小','小五',NULL,NULL,NULL,NULL,'2026-11-13','active','[seed-demo]','2026-09-02 15:21:42','2026-09-02 15:21:42',4,2,1,NULL,NULL,'賴爸爸','0979034607','廖媽媽','0969372547',10,80),(32,43,NULL,'2020-10-10','female','新明高中',NULL,NULL,NULL,NULL,NULL,'2026-09-13','active',NULL,'2026-09-13 14:27:54','2026-10-12 06:48:18',4,1,5,NULL,NULL,NULL,NULL,NULL,NULL,3,94);
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `system_settings`
--

DROP TABLE IF EXISTS `system_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `system_settings` (
  `id` int NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `setting_value` text COLLATE utf8mb4_unicode_ci,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `setting_key` (`setting_key`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `system_settings`
--

LOCK TABLES `system_settings` WRITE;
/*!40000 ALTER TABLE `system_settings` DISABLE KEYS */;
INSERT INTO `system_settings` VALUES (1,'system_name','智慧學習歷程系統','系統名稱','2026-08-27 10:00:58'),(2,'organization_name','樂高機器人教室','機構名稱','2026-08-27 10:00:58'),(3,'timezone','Asia/Taipei','時區','2026-08-27 10:00:58'),(4,'language','zh-TW','預設語言','2026-08-27 10:00:58');
/*!40000 ALTER TABLE `system_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `teachers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `school` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '就讀/畢業學校',
  `specialty` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT '專長',
  `hire_date` date DEFAULT NULL,
  `status` enum('active','inactive','on_leave') COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `notes` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `idx_teachers_status` (`status`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES (1,3,'逢甲大學',NULL,'2026-08-27','active',NULL,'2026-08-27 10:55:19','2026-08-27 10:55:19'),(4,40,'台北科大',NULL,'2026-09-02','active',NULL,'2026-09-03 06:10:45','2026-09-03 06:10:45'),(5,44,NULL,NULL,'2026-09-13','active',NULL,'2026-09-13 14:32:32','2026-09-13 14:32:32'),(6,45,'台中教育大學',NULL,'2024-02-01','active','[seed-demo] 程式機械主教，擅長引導孩子拆解問題','2026-09-29 12:06:11','2026-09-29 12:06:11'),(7,46,'靜宜大學',NULL,'2025-03-15','active','[seed-demo] 幼兒班老師，親切有耐心','2026-09-29 12:06:11','2026-09-29 12:06:11'),(8,47,'勤益科大',NULL,'2023-09-01','active','[seed-demo] 動力機械專長，帶過多屆競賽','2026-09-29 12:06:11','2026-09-29 12:06:11'),(9,48,'中興大學',NULL,'2024-08-01','active','[seed-demo] 專題班指導，負責競賽作品','2026-09-29 12:06:11','2026-09-29 12:06:11'),(10,49,'逢甲大學',NULL,'2025-07-01','active','[seed-demo] 科創機器人老師，熟悉感測器應用','2026-09-29 12:06:11','2026-09-29 12:06:11');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `role` enum('admin','staff','teacher','student') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'student',
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `line_id` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'LINE ID（聯絡用，選填）',
  `avatar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `birthday` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  KEY `idx_users_role` (`role`),
  KEY `idx_users_username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2a$10$VRYAP/aMT7G9GdSbRb.KlOAA.GRuI/prIa05TBc3GCwICZFYEE0Yi','admin@example.com','admin','系統管理員',NULL,NULL,NULL,1,'2026-08-27 10:00:58','2026-08-27 10:27:58',NULL),(2,'staff','$2a$10$EXiItqMIolsjPsFQugtqROv9vTeQb8C2D5wEOA76l/bckVj1EPWp6',NULL,'staff','行政測試員',NULL,'staff',NULL,1,'2026-08-27 10:37:39','2026-10-13 14:02:55',NULL),(3,'abc123','$2a$10$trrNWqu5R2IRihQx8n5afeAEvE1uvt4XeZIjWiOIVBiFCuRfucTsC',NULL,'teacher','謝老師','09123456','abc123',NULL,1,'2026-08-27 10:55:19','2026-10-13 14:02:55','2026-08-27'),(8,'0970637133','$2a$10$u.sBgcv2HZvjp7fRVcWCs.327ePb6MnALXfaV1Qc.CjQWc0cob3S.',NULL,'student','王小明',NULL,NULL,NULL,1,'2026-08-27 11:30:51','2026-10-13 15:10:28','2026-08-13'),(11,'0915115327','$2a$10$kAnomP94gm8jdTW.seIshu8VbCMyXA45XE8qTwSeHtdZ/2DzU1LD6','seed-demo@example.local','student','蔡彥廷',NULL,NULL,NULL,1,'2026-09-02 15:21:39','2026-10-13 15:10:28','2017-03-05'),(12,'0902358010','$2a$10$tTbn.ywtjfcvDUx3aVc38u8.9tjOcYJ9/HW8gDnB70ChA7HKZ8SfG','seed-demo@example.local','student','吳承恩',NULL,NULL,NULL,1,'2026-09-02 15:21:39','2026-10-13 15:10:28','2013-12-09'),(13,'0987279236','$2a$10$cWZQxNmp4RjH88OrSdKveeiMHv18qsBCaV5zE1JAbrBIeUamCuYG6','seed-demo@example.local','student','黃品妍',NULL,NULL,NULL,1,'2026-09-02 15:21:39','2026-10-13 15:10:28','2018-11-05'),(14,'0994858106','$2a$10$nqGVEQE/H5Ebj0mNMFKq/.gyWHguR9MlCmYJv9bwj.Ial0HPrjU6u','seed-demo@example.local','student','劉欣妍',NULL,NULL,NULL,1,'2026-09-02 15:21:39','2026-10-13 15:10:28','2016-07-24'),(15,'0995221729','$2a$10$KdoC98xdzEig/aT55oQiW.p.s/Xk3zPbpfBlXCp8MTiUoybSnYZfS','seed-demo@example.local','student','賴品妍',NULL,NULL,NULL,1,'2026-09-02 15:21:39','2026-10-13 15:10:28','2015-03-16'),(16,'0923322569','$2a$10$Mq0ZR2HO1cUkXXVSa4Xf3.Orx47xGbab5CC.ueyn9y5RwjzcT.UYS','seed-demo@example.local','student','葉冠宇',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2018-01-17'),(17,'0990957359','$2a$10$UDHLaoe7F.3GK.33emXtKOivvTNyAa8EzWJs61hmjENoJ6ip1moYK','seed-demo@example.local','student','曾若晴',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2014-11-04'),(18,'0928210362','$2a$10$Qvl7/H6F1KA8c80Q3vKDR.MVm9ifMFlXCytpDGt/cFxuuDG6YWJSO','seed-demo@example.local','student','郭宇軒',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2019-11-17'),(19,'0900246813','$2a$10$WdhXOScV6wfkvtQwi2XF2Orr9CQPWusNJbvbynw1Ul45K2LggDVqO','seed-demo@example.local','student','劉柏宇',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2013-08-24'),(20,'0982432001','$2a$10$ydzZnYf2.Z/BexiEFD7qwOaoQmb8MZx1Z1sZTbZUy7oMfaESDuyra','seed-demo@example.local','student','陳心怡',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2020-10-13'),(21,'0966222992','$2a$10$qGEItbPdyWCQ8on3jV7WUuF6G5K5RbFXNlxU4mucBUlRp2yh9qMwm','seed-demo@example.local','student','林博文',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2017-03-25'),(22,'0916856642','$2a$10$0EW.UlrMiq87acqiqRXDXufMZT.3tyrYzAb0RHngGDQYq4mqHARRi','seed-demo@example.local','student','劉雨彤',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2019-11-22'),(23,'0911039820','$2a$10$ZSajO3gRjlbt1T/rZCrf9.umlBIjo.bOU4CiYhf5OG3SK.pZzqUKu','seed-demo@example.local','student','李恩綺',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2017-09-07'),(24,'0958602265','$2a$10$1v2b4KECj.Wb2yQ.hbQ7A.xwzaBJ4AwuU6HvE22yCT5FcDqkdmpvq','seed-demo@example.local','student','陳子涵',NULL,NULL,NULL,1,'2026-09-02 15:21:40','2026-10-13 15:10:28','2016-09-09'),(25,'0972244461','$2a$10$3Vuz.byB4BGkISWmA9stFOvi6C2vFZXg7d1A0KIQdRgP97MAJgqCq','seed-demo@example.local','student','邱詩涵',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2020-04-25'),(26,'0947308217','$2a$10$YifYIL2tEG/qyZMnZa.Mu.NH5g11EUnp6meaj8o.BWS8DxKHvKHDC','seed-demo@example.local','student','郭柏睿',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2017-11-18'),(27,'0947365206','$2a$10$dMx9ncgVzyvMGBwpp/MpQu/8tksrNiHSu1aaEVQ6HsV9dAJjXZfIC','seed-demo@example.local','student','周亭妤',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2019-09-11'),(28,'0994949460','$2a$10$5zKIKOMqUq1A9x5ffatmZu65QS.SRghQkm2iAsOHv8IMkQURO28lm','seed-demo@example.local','student','李承恩',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2013-07-14'),(29,'0954392459','$2a$10$on35Rmz/9bVHiOMQfTh2KunabsnHKDSpuF9dnv5vJ5HybFcSVup1.','seed-demo@example.local','student','曾冠宇',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2014-09-10'),(30,'0935475820','$2a$10$S4FKv60ZIocxYxaBrF31R.LL3rJuuTKh4sp8AOoipg39yY8SWMUTW','seed-demo@example.local','student','楊心怡',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2014-06-21'),(31,'0995708772','$2a$10$9VwIy2N/Qri8Rk/NDrjX0uLLCLdbH6lprRktMa646NpN84OGHzKmm','seed-demo@example.local','student','黃珮瑜',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2014-11-12'),(32,'0943077745','$2a$10$sJVydz2aGMMARIGRdM/Nb.MtWHXY7weLYs7avhBo9QXyaIvb3bP.q','seed-demo@example.local','student','劉哲瑋',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2014-02-28'),(33,'0932973470','$2a$10$WQm.8fpNot1c5bv3Af8jK.Zrxev6a7TRMPk8lKpGIFABlzCDl9zPG','seed-demo@example.local','student','許芷萱',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2016-02-13'),(34,'0978521024','$2a$10$er4FgVR./BM8e95SXP51kOpfPxWhXa9rUrbUNaEJFuArqVv4fMde6','seed-demo@example.local','student','吳婉婷',NULL,NULL,NULL,1,'2026-09-02 15:21:41','2026-10-13 15:10:28','2021-11-28'),(35,'0993580442','$2a$10$qHAXrsTjEV3yrMormxlUeu9oLHeXI7Mr6BhEAaGswWBx5o.ecwie.','seed-demo@example.local','student','洪婉婷',NULL,NULL,NULL,1,'2026-09-02 15:21:42','2026-10-13 15:10:28','2020-01-18'),(36,'0927401906','$2a$10$tgTS5Tin5pvdLh7vYygk5eNKiW7EbIIg9R6ujD/rXyZ99tPJWw6ZK','seed-demo@example.local','student','鄭品妍',NULL,NULL,NULL,1,'2026-09-02 15:21:42','2026-10-13 15:10:28','2016-11-19'),(37,'0953238511','$2a$10$zcoAVnZrgmyzeX81yTO17erVb1WTfHpgp5PTLgtB9EZkeEY4DYQIy','seed-demo@example.local','student','郭子晴',NULL,NULL,NULL,1,'2026-09-02 15:21:42','2026-10-13 15:10:28','2017-09-09'),(38,'0976964026','$2a$10$x4mXJ/m7CgBwP1OTzUiwk.1lwpiYBK4/oskbOibL19m.48.h7rkzi','seed-demo@example.local','student','李家豪',NULL,NULL,NULL,1,'2026-09-02 15:21:42','2026-10-13 15:10:28','2017-05-12'),(39,'0979034607','$2a$10$0uQ976rz26eeeUYFT6a3d.WWz8m2G6Etm7j.uQrvWP331t2yFQHjK','seed-demo@example.local','student','楊家豪',NULL,NULL,NULL,1,'2026-09-02 15:21:42','2026-10-13 15:10:28','2019-01-14'),(40,'lab123','$2a$10$BwxN2NnU5cVXY/q3.JUw4.uQC9Bbp9ge2dyQIUZgfH1Ii3mKELopy',NULL,'teacher','莊老師','0986754399','lab123',NULL,1,'2026-09-03 06:10:45','2026-10-13 14:02:55','1996-10-14'),(41,'student','$2a$10$2rGip2EHbLNfpc55t3SV2e5nciEqwP6Ipkjfq7CBmmdOhyTi.WWm2',NULL,'student','學生',NULL,NULL,NULL,1,'2026-09-13 14:12:37','2026-09-13 14:12:37',NULL),(42,'teacher','$2a$10$v9Z4VWVaY4rdXv0CauO0u.Y0kRZkSRXpmp4wH.q5UjT5txXE0yGY6',NULL,'teacher','老師',NULL,'teacher',NULL,1,'2026-09-13 14:14:58','2026-10-13 14:02:55',NULL),(43,'郭小晴','$2a$10$RQmj4OQFmYR7X9JPkCWkXefqedtaUmgALVLw..ACEIlNO4fn.UmeO',NULL,'student','郭小晴',NULL,NULL,NULL,1,'2026-09-13 14:27:54','2026-09-13 14:27:54','2020-10-10'),(44,'洪大寶','$2a$10$CXhjpRUAbc8YqEFhgu7Kl.LSDVs07Bi5oF648BXL2Vmy2M2n4.xkC',NULL,'teacher','洪大寶',NULL,'洪大寶',NULL,1,'2026-09-13 14:32:32','2026-10-13 14:02:55','1987-03-13'),(45,'lin_teacher','$2a$10$ZarUOMPgGvDQcghnJwW7aO9KtC.FIFyJtlril7tvuqF5sOSjienei','seed-demo@example.local','teacher','林老師','0911-222-333','lin_teacher',NULL,1,'2026-09-29 12:06:11','2026-10-13 14:02:55','1989-04-12'),(46,'huang_kids','$2a$10$BP7XlicrtlEDWRlJrq2Fi.nFAhbsaUsCcZ/GMHyGrX3nmBsPQFEGm','seed-demo@example.local','teacher','黃老師','0922-333-444','huang_kids',NULL,1,'2026-09-29 12:06:11','2026-10-13 14:02:55','1993-07-08'),(47,'wu_power','$2a$10$dzzkgEFKPjoapgn9dr6zr.yjToBa1p.hIba9KTH9VmgTBIH12vvTm','seed-demo@example.local','teacher','吳老師','0933-444-555','wu_power',NULL,1,'2026-09-29 12:06:11','2026-10-13 14:02:55','1987-11-20'),(48,'tsai_project','$2a$10$psSbWYCrb.FdvkPlK/970OqmKkhgxqeg/IkF2on/uZqnuDpkewDe6','seed-demo@example.local','teacher','蔡老師','0944-555-666','tsai_project',NULL,1,'2026-09-29 12:06:11','2026-10-13 14:02:55','1991-02-27'),(49,'yang_robot','$2a$10$c79qPNP1tmfClZMsl3G7pu.j.FaPoVMzuTML/LpRdsZX.IwwXmcVK','seed-demo@example.local','teacher','楊老師','0955-666-777','yang_robot',NULL,1,'2026-09-29 12:06:11','2026-10-13 14:02:55','1995-05-03');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'learning_system'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-14 15:09:45
