const db = require('../config/db');

// 初始化標記
let isInitialized = false;

// 確保資料表存在
async function ensureTablesExist() {
  if (isInitialized) return;

  try {
    // 檢查 point_transactions 表是否存在
    const tables = await db.query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'point_transactions'
    `);

    if (tables.length === 0) {
      // 資料表不存在，建立新的
      await db.query(`
        CREATE TABLE point_transactions (
          id INT PRIMARY KEY AUTO_INCREMENT,
          student_id INT NOT NULL,
          amount INT NOT NULL,
          reason VARCHAR(50) NOT NULL,
          description VARCHAR(255),
          operator_id INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_student_id (student_id),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('✅ 已建立 point_transactions 資料表');
    } else {
      // 資料表存在，檢查是否有 amount 欄位
      const amountCol = await db.query(`
        SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'point_transactions'
        AND COLUMN_NAME = 'amount'
      `);

      if (amountCol.length === 0) {
        // 欄位不存在，刪除舊表重建
        console.log('⚠️ point_transactions 表結構不正確，重建中...');
        await db.query('DROP TABLE point_transactions');
        await db.query(`
          CREATE TABLE point_transactions (
            id INT PRIMARY KEY AUTO_INCREMENT,
            student_id INT NOT NULL,
            amount INT NOT NULL,
            reason VARCHAR(50) NOT NULL,
            description VARCHAR(255),
            operator_id INT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_student_id (student_id),
            INDEX idx_created_at (created_at)
          ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('✅ 已重建 point_transactions 資料表');
      }
    }

    // 檢查並新增 points_balance 欄位
    const columns = await db.query(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'students'
      AND COLUMN_NAME = 'points_balance'
    `);

    if (columns.length === 0) {
      await db.query(`
        ALTER TABLE students
        ADD COLUMN points_balance INT DEFAULT 80
      `);
      console.log('✅ 已新增 students.points_balance 欄位');
    }

    isInitialized = true;
    console.log('✅ 點數系統資料表已就緒');
  } catch (error) {
    console.error('初始化點數資料表錯誤:', error.message);
  }
}

// 啟動時初始化
ensureTablesExist();

// 取得學生點數餘額
exports.getBalance = async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await db.queryOne(
      'SELECT id, points_balance FROM students WHERE id = ?',
      [studentId]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到該學生'
      });
    }

    res.json({
      success: true,
      data: {
        student_id: student.id,
        balance: student.points_balance || 0
      }
    });
  } catch (error) {
    console.error('取得點數餘額錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得學生點數交易紀錄
exports.getHistory = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 確認學生存在
    const student = await db.queryOne(
      'SELECT id, points_balance FROM students WHERE id = ?',
      [studentId]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到該學生'
      });
    }

    // 取得交易紀錄
    const transactions = await db.query(`
      SELECT
        pt.*,
        u.name as operator_name
      FROM point_transactions pt
      LEFT JOIN users u ON pt.operator_id = u.id
      WHERE pt.student_id = ?
      ORDER BY pt.created_at DESC
      LIMIT ? OFFSET ?
    `, [studentId, parseInt(limit), parseInt(offset)]);

    // 取得總數
    const countResult = await db.queryOne(
      'SELECT COUNT(*) as total FROM point_transactions WHERE student_id = ?',
      [studentId]
    );

    res.json({
      success: true,
      data: {
        balance: student.points_balance || 0,
        transactions,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });
  } catch (error) {
    console.error('取得點數紀錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增點數交易（增加或扣除點數）
exports.addTransaction = async (req, res) => {
  try {
    await ensureTablesExist();
    const { studentId } = req.params;
    const { amount, reason, description } = req.body;
    const operatorId = req.user.id;

    // 驗證參數
    if (!amount || amount === 0) {
      return res.status(400).json({
        success: false,
        message: '點數變動量不可為零'
      });
    }

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: '請提供變動原因'
      });
    }

    // 確認學生存在
    const student = await db.queryOne(
      'SELECT id, points_balance FROM students WHERE id = ?',
      [studentId]
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到該學生'
      });
    }

    // 檢查扣除後是否會變成負數
    const newBalance = (student.points_balance || 0) + amount;
    if (newBalance < 0) {
      return res.status(400).json({
        success: false,
        message: `點數不足，目前餘額 ${student.points_balance || 0} 點`
      });
    }

    // 新增交易紀錄
    const transactionId = await db.insert(`
      INSERT INTO point_transactions (student_id, amount, reason, description, operator_id)
      VALUES (?, ?, ?, ?, ?)
    `, [studentId, amount, reason, description || reason, operatorId]);

    // 更新學生餘額
    await db.update(
      'UPDATE students SET points_balance = ? WHERE id = ?',
      [newBalance, studentId]
    );

    // 取得更新後的餘額確認
    const updatedStudent = await db.queryOne(
      'SELECT points_balance FROM students WHERE id = ?',
      [studentId]
    );

    res.json({
      success: true,
      message: amount > 0 ? '點數增加成功' : '點數扣除成功',
      data: {
        transaction_id: transactionId,
        amount,
        new_balance: updatedStudent.points_balance
      }
    });
  } catch (error) {
    console.error('新增點數交易錯誤:', error);
    res.status(500).json({
      success: false,
      message: error.message || '伺服器錯誤'
    });
  }
};

// 批量取得多位學生的點數餘額
exports.getBatchBalances = async (req, res) => {
  try {
    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供學生 ID 列表'
      });
    }

    const placeholders = studentIds.map(() => '?').join(',');
    const students = await db.query(
      `SELECT id, points_balance FROM students WHERE id IN (${placeholders})`,
      studentIds
    );

    const balanceMap = {};
    students.forEach(s => {
      balanceMap[s.id] = s.points_balance || 0;
    });

    res.json({
      success: true,
      data: balanceMap
    });
  } catch (error) {
    console.error('批量取得點數餘額錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
