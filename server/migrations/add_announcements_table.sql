-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL COMMENT '公告主旨',
  content LONGTEXT NOT NULL COMMENT '公告內容',
  publish_type VARCHAR(50) DEFAULT 'immediate' COMMENT '發布類型（immediate/scheduled）',
  target_group VARCHAR(50) DEFAULT 'all' COMMENT '目標群組（all/teachers/students）',
  target_classes JSON COMMENT '目標班級清單（JSON 格式）',
  scheduled_at DATETIME COMMENT '排程發布時間',
  published_at DATETIME COMMENT '實際發布時間',
  status VARCHAR(50) DEFAULT 'draft' COMMENT '狀態（draft/published/scheduled）',
  created_by INT COMMENT '建立者 user_id',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_target_group (target_group),
  INDEX idx_published_at (published_at),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 已讀紀錄表（追蹤使用者已讀的公告）
CREATE TABLE IF NOT EXISTS announcement_reads (
  id INT PRIMARY KEY AUTO_INCREMENT,
  announcement_id INT NOT NULL,
  user_id INT NOT NULL,
  read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_read (announcement_id, user_id),
  INDEX idx_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 插入測試公告
INSERT INTO announcements (title, content, publish_type, target_group, status, published_at, created_by) VALUES
('系統更新通知', '系統將於本週末進行例行維護，預計維護時間為 2 小時。維護期間系統將暫時無法使用，請各位老師提前做好準備。', 'immediate', 'all', 'published', NOW(), 1),
('教師研習活動', '本月將舉辦 AI 教學工具研習活動，歡迎各位教師踴躍報名參加。活動時間：下週三下午 2:00-4:00，地點：會議室 A。', 'immediate', 'teachers', 'published', NOW(), 1),
('暑期課程安排', '暑期課程即將開始，請各位教師確認自己的課表安排，如有問題請儘速與行政人員聯繫。', 'immediate', 'teachers', 'published', NOW(), 1);
