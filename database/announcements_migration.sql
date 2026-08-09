-- ============================================
-- 公告系統資料表
-- ============================================

-- 公告表
CREATE TABLE IF NOT EXISTS announcements (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(255) NOT NULL COMMENT '公告主旨',
    content TEXT NOT NULL COMMENT '公告詳細內容',
    publish_type ENUM('immediate', 'scheduled') NOT NULL DEFAULT 'immediate' COMMENT '發布類型：即時/定時',
    target_group ENUM('all', 'teachers', 'students') NOT NULL DEFAULT 'all' COMMENT '目標群組：全體/老師/學生',
    target_classes JSON COMMENT '目標班級 (當 target_group 為 students 時使用)',
    scheduled_at DATETIME COMMENT '預定發布時間 (當 publish_type 為 scheduled 時使用)',
    published_at DATETIME COMMENT '實際發布時間',
    status ENUM('draft', 'scheduled', 'published') NOT NULL DEFAULT 'draft' COMMENT '狀態',
    created_by INT COMMENT '建立者 user_id',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- 公告已讀記錄表
CREATE TABLE IF NOT EXISTS announcement_reads (
    id INT PRIMARY KEY AUTO_INCREMENT,
    announcement_id INT NOT NULL,
    user_id INT NOT NULL,
    read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (announcement_id) REFERENCES announcements(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_read (announcement_id, user_id)
);

-- 索引
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_target ON announcements(target_group);
CREATE INDEX idx_announcements_scheduled ON announcements(scheduled_at);
CREATE INDEX idx_announcements_published ON announcements(published_at);
