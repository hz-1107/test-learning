const db = require('../config/db');

// 確保資料表存在
async function ensureTableExists() {
  try {
    const tables = await db.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competitions'
    `);

    if (tables.length === 0) {
      await db.query(`
        CREATE TABLE competitions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          student_id INT NOT NULL,
          title VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255),
          competition_date DATE,
          level ENUM('national', 'regional', 'county', 'school') DEFAULT 'school',
          rank_type ENUM('gold', 'silver', 'bronze', 'merit', 'participant') DEFAULT 'participant',
          rank_name VARCHAR(50),
          score VARCHAR(50),
          team_members TEXT,
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_student_id (student_id),
          INDEX idx_competition_date (competition_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ 已建立 competitions 資料表');
    }
  } catch (error) {
    console.error('初始化競賽資料表錯誤:', error.message);
  }
}

ensureTableExists();

// 取得學生的競賽記錄
exports.getMyCompetitions = async (req, res) => {
  try {
    const userId = req.user.id;

    // 取得學生 ID
    const student = await db.queryOne(
      'SELECT id FROM students WHERE user_id = ?',
      [userId]
    );

    if (!student) {
      return res.json({
        success: true,
        data: []
      });
    }

    const competitions = await db.query(`
      SELECT * FROM competitions
      WHERE student_id = ?
      ORDER BY competition_date DESC
    `, [student.id]);

    res.json({
      success: true,
      data: competitions
    });
  } catch (error) {
    console.error('取得競賽記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得指定學生的競賽記錄 (管理員/職員用)
exports.getStudentCompetitions = async (req, res) => {
  try {
    const { studentId } = req.params;

    const competitions = await db.query(`
      SELECT * FROM competitions
      WHERE student_id = ?
      ORDER BY competition_date DESC
    `, [studentId]);

    res.json({
      success: true,
      data: competitions
    });
  } catch (error) {
    console.error('取得學生競賽記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增競賽記錄
exports.create = async (req, res) => {
  try {
    const { student_id, title, subtitle, competition_date, level, rank_type, rank_name, score, team_members, description } = req.body;

    if (!student_id || !title) {
      return res.status(400).json({
        success: false,
        message: '請提供學生 ID 和競賽名稱'
      });
    }

    const id = await db.insert(`
      INSERT INTO competitions (student_id, title, subtitle, competition_date, level, rank_type, rank_name, score, team_members, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, title, subtitle || null, competition_date || null, level || 'school', rank_type || 'participant', rank_name || null, score || null, team_members || null, description || null]);

    res.json({
      success: true,
      message: '競賽記錄新增成功',
      data: { id }
    });
  } catch (error) {
    console.error('新增競賽記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新競賽記錄
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, subtitle, competition_date, level, rank_type, rank_name, score, team_members, description } = req.body;

    await db.update(`
      UPDATE competitions SET
        title = COALESCE(?, title),
        subtitle = ?,
        competition_date = ?,
        level = COALESCE(?, level),
        rank_type = COALESCE(?, rank_type),
        rank_name = ?,
        score = ?,
        team_members = ?,
        description = ?
      WHERE id = ?
    `, [title, subtitle, competition_date, level, rank_type, rank_name, score, team_members, description, id]);

    res.json({
      success: true,
      message: '競賽記錄更新成功'
    });
  } catch (error) {
    console.error('更新競賽記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 刪除競賽記錄
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    await db.update('DELETE FROM competitions WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '競賽記錄已刪除'
    });
  } catch (error) {
    console.error('刪除競賽記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
