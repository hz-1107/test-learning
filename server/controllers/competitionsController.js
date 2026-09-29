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
          organizer VARCHAR(255),
          title VARCHAR(255) NOT NULL,
          subtitle VARCHAR(255),
          competition_date DATE,
          level ENUM('international', 'national', 'regional', 'county') DEFAULT 'county',
          rank_name VARCHAR(50),
          score VARCHAR(50),
          team_name VARCHAR(255),
          certificate_url VARCHAR(500),
          photo_url VARCHAR(500),
          photo_url_2 VARCHAR(500),
          description TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          INDEX idx_student_id (student_id),
          INDEX idx_competition_date (competition_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ 已建立 competitions 資料表');
    } else {
      // 資料表已存在，檢查是否缺少必要欄位（舊版資料表可能只有 competition_name/result/points_earned）
      // 注意：MySQL 的 ALTER TABLE ADD COLUMN 不支援 IF NOT EXISTS 語法，需先查詢 information_schema
      const requiredColumns = [
        { name: 'title', ddl: 'VARCHAR(255)' },
        { name: 'subtitle', ddl: 'VARCHAR(255)' },
        { name: 'level', ddl: "ENUM('international', 'national', 'regional', 'county') DEFAULT 'county'" },
        { name: 'rank_name', ddl: 'VARCHAR(50)' },
        { name: 'score', ddl: 'VARCHAR(50)' },
        { name: 'team_name', ddl: 'VARCHAR(255)' },
        { name: 'certificate_url', ddl: 'VARCHAR(500)' },
        { name: 'photo_url', ddl: 'VARCHAR(500)' },
        { name: 'photo_url_2', ddl: 'VARCHAR(500)' },
        { name: 'organizer', ddl: 'VARCHAR(255)' }
      ];

      const existingColumns = await db.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'competitions'
      `);
      const existingNames = new Set(existingColumns.map(c => c.COLUMN_NAME));

      for (const col of requiredColumns) {
        if (!existingNames.has(col.name)) {
          try {
            await db.query(`ALTER TABLE competitions ADD COLUMN ${col.name} ${col.ddl}`);
            console.log(`✅ 已新增 competitions.${col.name} 欄位`);
          } catch (e) {
            console.error(`新增 competitions.${col.name} 欄位失敗:`, e.message);
          }
        }
      }

      // 舊版資料表的 competition_date 同樣是 NOT NULL 且無預設值，但競賽日期非必填，需放寬限制避免 INSERT 失敗
      try {
        await db.query(`ALTER TABLE competitions MODIFY COLUMN competition_date DATE NULL`);
      } catch (e) {
        console.error('放寬 competitions.competition_date NOT NULL 限制失敗:', e.message);
      }

      // 舊版資料表遺留的 competition_name / result / points_earned 欄位：
      // 目前程式完全不會寫入這三個欄位，但 competition_name 是 NOT NULL 且無預設值，
      // 只要它還存在，INSERT 就會直接失敗（ER_NO_DEFAULT_FOR_FIELD）。
      // 先把舊資料回填到新欄位，再把這三個舊欄位整個移除，徹底根除此問題，
      // 而不是每次都只放寬限制（避免資料表被重建、或其他流程動到欄位定義時問題又重現）。
      if (existingNames.has('competition_name')) {
        try {
          await db.query(`UPDATE competitions SET title = competition_name WHERE title IS NULL AND competition_name IS NOT NULL`);
        } catch (e) {
          // 忽略回填失敗（例如 title 欄位尚未成功建立）
        }
      }
      if (existingNames.has('result')) {
        try {
          await db.query(`UPDATE competitions SET rank_name = result WHERE rank_name IS NULL AND result IS NOT NULL`);
        } catch (e) {
          // 忽略
        }
      }
      if (existingNames.has('points_earned')) {
        try {
          await db.query(`UPDATE competitions SET score = points_earned WHERE score IS NULL AND points_earned IS NOT NULL`);
        } catch (e) {
          // 忽略
        }
      }

      for (const legacyCol of ['competition_name', 'result', 'points_earned']) {
        if (existingNames.has(legacyCol)) {
          try {
            await db.query(`ALTER TABLE competitions DROP COLUMN ${legacyCol}`);
            console.log(`✅ 已移除 competitions.${legacyCol} 舊欄位`);
          } catch (e) {
            console.error(`移除 competitions.${legacyCol} 舊欄位失敗:`, e.message);
          }
        }
      }
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
    const limit = Math.max(1, parseInt(req.query.limit) || 20);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;

    // 註: LIMIT/OFFSET 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    const competitions = await db.query(`
      SELECT * FROM competitions
      WHERE student_id = ?
      ORDER BY competition_date DESC
      LIMIT ${limit} OFFSET ${offset}
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
    const { student_id, organizer, title, competition_date, level, rank_name, score, team_name, certificate_url, photo_url, description } = req.body;

    if (!student_id) {
      return res.status(400).json({
        success: false,
        message: '請提供學生 ID'
      });
    }

    if (!organizer) {
      return res.status(400).json({
        success: false,
        message: '請提供主辦單位'
      });
    }

    const id = await db.insert(`
      INSERT INTO competitions (student_id, organizer, title, competition_date, level, rank_name, score, team_name, certificate_url, photo_url, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student_id, organizer, title || null, competition_date || null, level || 'county', rank_name || null, score || null, team_name || null, certificate_url || null, photo_url || null, description || null]);

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
    const { title, subtitle, organizer, competition_date, level, rank_name, score, team_name, certificate_url, photo_url, description } = req.body;

    await db.update(`
      UPDATE competitions SET
        title = COALESCE(?, title),
        subtitle = ?,
        organizer = COALESCE(?, organizer),
        competition_date = ?,
        level = COALESCE(?, level),
        rank_name = ?,
        score = ?,
        team_name = ?,
        certificate_url = COALESCE(?, certificate_url),
        photo_url = COALESCE(?, photo_url),
        description = ?
      WHERE id = ?
    `, [title, subtitle, organizer, competition_date, level, rank_name, score, team_name, certificate_url, photo_url, description, id]);

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

// 學生自行填寫競賽簡述與上傳照片（最多 2 張）
// 僅允許學生編輯自己的競賽記錄的 description / photo_url / photo_url_2，
// 不可更動主辦單位、名次、成績等由教職員登錄的事實欄位
exports.studentUpdate = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: '僅限學生角色使用此端點'
      });
    }

    const { id } = req.params;
    const { description, photo_url, photo_url_2 } = req.body;

    const student = await db.queryOne(
      'SELECT id FROM students WHERE user_id = ?',
      [req.user.id]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到學生資料'
      });
    }

    const competition = await db.queryOne(
      'SELECT id, student_id FROM competitions WHERE id = ?',
      [id]
    );

    if (!competition) {
      return res.status(404).json({
        success: false,
        message: '找不到競賽記錄'
      });
    }

    if (competition.student_id !== student.id) {
      return res.status(403).json({
        success: false,
        message: '無權限編輯此競賽記錄'
      });
    }

    await db.update(`
      UPDATE competitions SET
        description = ?,
        photo_url = ?,
        photo_url_2 = ?
      WHERE id = ?
    `, [description || null, photo_url || null, photo_url_2 || null, id]);

    res.json({
      success: true,
      message: '競賽簡述已更新'
    });
  } catch (error) {
    console.error('學生更新競賽簡述錯誤:', error);
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
