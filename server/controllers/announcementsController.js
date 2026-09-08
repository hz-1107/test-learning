const db = require('../config/db');

// 取得公告列表
exports.getAnnouncements = async (req, res) => {
  try {
    const { status, target_group, limit = 50 } = req.query;

    let sql = `
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND a.status = ?';
      params.push(status);
    }

    if (target_group) {
      sql += ' AND a.target_group = ?';
      params.push(target_group);
    }

    sql += ' ORDER BY a.created_at DESC LIMIT ?';
    params.push(parseInt(limit));

    const announcements = await db.query(sql, params);

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('取得公告列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '取得公告列表失敗'
    });
  }
};

// 取得已發布公告（給前端通知面板使用）
exports.getPublishedAnnouncements = async (req, res) => {
  try {
    const { role, limit = 20 } = req.query;

    let sql = `
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.status = 'published'
        AND (a.target_group = 'all'
    `;
    const params = [];

    // 根據使用者角色篩選
    if (role === 'teacher') {
      sql += ` OR a.target_group = 'teachers'`;
    } else if (role === 'student') {
      sql += ` OR a.target_group = 'students'`;
    }

   sql += `) ORDER BY a.published_at DESC LIMIT ${parseInt(limit) || 5}`;

    const announcements = await db.query(sql, params);

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    console.error('取得已發布公告錯誤:', error);
    res.status(500).json({
      success: false,
      message: '取得已發布公告失敗'
    });
  }
};

// 取得單一公告
exports.getAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const announcement = await db.queryOne(`
      SELECT a.*, u.name as author_name
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      WHERE a.id = ?
    `, [id]);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '找不到此公告'
      });
    }

    res.json({
      success: true,
      data: announcement
    });
  } catch (error) {
    console.error('取得公告錯誤:', error);
    res.status(500).json({
      success: false,
      message: '取得公告失敗'
    });
  }
};

// 建立新公告
exports.createAnnouncement = async (req, res) => {
  try {
    const {
      title,
      content,
      publish_type = 'immediate',
      target_group = 'all',
      target_classes = null,
      scheduled_at = null
    } = req.body;

    // 驗證必填欄位
    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '請填寫公告主旨與內容'
      });
    }

    // 定時發布需要指定時間
    if (publish_type === 'scheduled' && !scheduled_at) {
      return res.status(400).json({
        success: false,
        message: '定時發布需要指定發布時間'
      });
    }

    // 決定狀態與發布時間
    let status, published_at;
    if (publish_type === 'immediate') {
      status = 'published';
      published_at = new Date();
    } else {
      status = 'scheduled';
      published_at = null;
    }

    const sql = `
      INSERT INTO announcements
      (title, content, publish_type, target_group, target_classes, scheduled_at, published_at, status, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const id = await db.insert(sql, [
      title,
      content,
      publish_type,
      target_group,
      target_classes ? JSON.stringify(target_classes) : null,
      scheduled_at || null,
      published_at,
      status,
      req.user?.id || null
    ]);

    res.status(201).json({
      success: true,
      message: publish_type === 'immediate' ? '公告已發布' : '定時公告已建立',
      data: { id }
    });
  } catch (error) {
    console.error('建立公告錯誤:', error);
    res.status(500).json({
      success: false,
      message: '建立公告失敗'
    });
  }
};

// 更新公告
exports.updateAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      content,
      publish_type,
      target_group,
      target_classes,
      scheduled_at
    } = req.body;

    // 檢查公告是否存在
    const existing = await db.queryOne('SELECT * FROM announcements WHERE id = ?', [id]);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: '找不到此公告'
      });
    }

    const updates = [];
    const params = [];

    if (title !== undefined) {
      updates.push('title = ?');
      params.push(title);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content);
    }
    if (publish_type !== undefined) {
      updates.push('publish_type = ?');
      params.push(publish_type);
    }
    if (target_group !== undefined) {
      updates.push('target_group = ?');
      params.push(target_group);
    }
    if (target_classes !== undefined) {
      updates.push('target_classes = ?');
      params.push(target_classes ? JSON.stringify(target_classes) : null);
    }
    if (scheduled_at !== undefined) {
      updates.push('scheduled_at = ?');
      params.push(scheduled_at || null);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: '沒有要更新的欄位'
      });
    }

    params.push(id);
    await db.update(`UPDATE announcements SET ${updates.join(', ')} WHERE id = ?`, params);

    res.json({
      success: true,
      message: '公告已更新'
    });
  } catch (error) {
    console.error('更新公告錯誤:', error);
    res.status(500).json({
      success: false,
      message: '更新公告失敗'
    });
  }
};

// 刪除公告
exports.deleteAnnouncement = async (req, res) => {
  try {
    const { id } = req.params;

    const affected = await db.update('DELETE FROM announcements WHERE id = ?', [id]);

    if (affected === 0) {
      return res.status(404).json({
        success: false,
        message: '找不到此公告'
      });
    }

    res.json({
      success: true,
      message: '公告已刪除'
    });
  } catch (error) {
    console.error('刪除公告錯誤:', error);
    res.status(500).json({
      success: false,
      message: '刪除公告失敗'
    });
  }
};

// 發布定時公告（由排程任務呼叫）
exports.publishScheduledAnnouncements = async (req, res) => {
  try {
    const now = new Date();

    const result = await db.update(`
      UPDATE announcements
      SET status = 'published', published_at = ?
      WHERE status = 'scheduled'
        AND scheduled_at <= ?
    `, [now, now]);

    res.json({
      success: true,
      message: `已發布 ${result} 則定時公告`
    });
  } catch (error) {
    console.error('發布定時公告錯誤:', error);
    res.status(500).json({
      success: false,
      message: '發布定時公告失敗'
    });
  }
};

// 取得使用者的公告（含已讀狀態）
exports.getMyAnnouncements = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const { limit = 20 } = req.query;

    // 根據使用者角色篩選公告
    let targetFilter = `(a.target_group = 'all'`;
    if (userRole === 'teacher') {
      targetFilter += ` OR a.target_group = 'teachers'`;
    } else if (userRole === 'student') {
      targetFilter += ` OR a.target_group = 'students'`;
    } else if (userRole === 'admin' || userRole === 'staff') {
      targetFilter += ` OR a.target_group = 'teachers' OR a.target_group = 'students'`;
    }
    targetFilter += `)`;

    const sql = `
      SELECT
        a.*,
        u.name as author_name,
        CASE WHEN ar.id IS NOT NULL THEN 1 ELSE 0 END as is_read
      FROM announcements a
      LEFT JOIN users u ON a.created_by = u.id
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
      WHERE a.status = 'published' AND ${targetFilter}
      ORDER BY a.published_at DESC
      LIMIT ?
    `;

    const announcements = await db.query(sql, [userId, parseInt(limit)]);

    // 計算未讀數量
    const unreadCount = announcements.filter(a => !a.is_read).length;

    res.json({
      success: true,
      data: {
        announcements,
        unreadCount
      }
    });
  } catch (error) {
    console.error('取得我的公告錯誤:', error);
    res.status(500).json({
      success: false,
      message: '取得公告失敗'
    });
  }
};

// 標記公告為已讀
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // 檢查公告是否存在
    const announcement = await db.queryOne('SELECT id FROM announcements WHERE id = ?', [id]);
    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: '找不到此公告'
      });
    }

    // 插入已讀紀錄（如果已存在則忽略）
    await db.query(`
      INSERT IGNORE INTO announcement_reads (announcement_id, user_id)
      VALUES (?, ?)
    `, [id, userId]);

    res.json({
      success: true,
      message: '已標記為已讀'
    });
  } catch (error) {
    console.error('標記已讀錯誤:', error);
    res.status(500).json({
      success: false,
      message: '標記已讀失敗'
    });
  }
};

// 標記所有公告為已讀
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    // 根據使用者角色篩選公告
    let targetFilter = `(target_group = 'all'`;
    if (userRole === 'teacher') {
      targetFilter += ` OR target_group = 'teachers'`;
    } else if (userRole === 'student') {
      targetFilter += ` OR target_group = 'students'`;
    } else if (userRole === 'admin' || userRole === 'staff') {
      targetFilter += ` OR target_group = 'teachers' OR target_group = 'students'`;
    }
    targetFilter += `)`;

    // 取得所有未讀的公告 ID
    const unreadAnnouncements = await db.query(`
      SELECT a.id FROM announcements a
      LEFT JOIN announcement_reads ar ON a.id = ar.announcement_id AND ar.user_id = ?
      WHERE a.status = 'published' AND ${targetFilter} AND ar.id IS NULL
    `, [userId]);

    // 批次插入已讀紀錄
    if (unreadAnnouncements.length > 0) {
      const values = unreadAnnouncements.map(a => `(${a.id}, ${userId})`).join(',');
      await db.query(`
        INSERT IGNORE INTO announcement_reads (announcement_id, user_id)
        VALUES ${values}
      `);
    }

    res.json({
      success: true,
      message: `已將 ${unreadAnnouncements.length} 則公告標記為已讀`
    });
  } catch (error) {
    console.error('標記全部已讀錯誤:', error);
    res.status(500).json({
      success: false,
      message: '標記全部已讀失敗'
    });
  }
};
