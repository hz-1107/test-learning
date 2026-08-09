const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// 建立連接池
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'learning_system',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  // 防止日期時區轉換問題：保持日期為字串格式
  dateStrings: true
});

// 測試連接
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ 資料庫連接成功');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ 資料庫連接失敗:', error.message);
    return false;
  }
}

// 執行查詢的輔助函數
async function query(sql, params = []) {
  const [results] = await pool.execute(sql, params);
  return results;
}

// 取得單一結果
async function queryOne(sql, params = []) {
  const results = await query(sql, params);
  return results[0] || null;
}

// 插入資料並返回 insertId
async function insert(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result.insertId;
}

// 更新/刪除資料並返回影響的行數
async function update(sql, params = []) {
  const [result] = await pool.execute(sql, params);
  return result.affectedRows;
}

module.exports = {
  pool,
  query,
  queryOne,
  insert,
  update,
  testConnection
};
