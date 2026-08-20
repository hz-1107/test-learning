/**
 * 執行資料庫遷移腳本
 * 用法: node server/migrations/runMigration.js
 */
const db = require('../config/db');

async function runMigration() {
  console.log('開始執行資料庫遷移...\n');

  try {
    // 1. 建立 point_transactions 表
    console.log('1. 建立 point_transactions 表...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS point_transactions (
        id INT PRIMARY KEY AUTO_INCREMENT,
        student_id INT NOT NULL,
        amount INT NOT NULL COMMENT '點數變動量（正數增加，負數扣除）',
        reason VARCHAR(50) NOT NULL COMMENT '變動原因類型',
        description VARCHAR(255) COMMENT '詳細說明',
        operator_id INT COMMENT '操作人員 user_id',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (operator_id) REFERENCES users(id) ON DELETE SET NULL,
        INDEX idx_student_id (student_id),
        INDEX idx_created_at (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    console.log('   ✅ point_transactions 表已建立\n');

    // 2. 檢查並新增 points_balance 欄位
    console.log('2. 檢查 students 表的 points_balance 欄位...');
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
        ADD COLUMN points_balance INT DEFAULT 80 COMMENT '點數餘額'
      `);
      console.log('   ✅ points_balance 欄位已新增\n');
    } else {
      console.log('   ✅ points_balance 欄位已存在\n');
    }

    console.log('🎉 資料庫遷移完成！');
    process.exit(0);

  } catch (error) {
    console.error('❌ 遷移失敗:', error.message);
    process.exit(1);
  }
}

runMigration();
