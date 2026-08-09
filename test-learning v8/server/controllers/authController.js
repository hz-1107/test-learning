const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

// 登入
exports.login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // 驗證輸入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '請提供帳號和密碼'
      });
    }

    // 查詢使用者
    const user = await db.queryOne(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: '帳號或密碼錯誤'
      });
    }

    // 驗證密碼
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '帳號或密碼錯誤'
      });
    }

    // 不驗證角色，直接使用資料庫中的角色

    // 產生 JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        role: user.role,
        name: user.name
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // 決定重導向路徑
    let redirectUrl = '/student/dashboard.html';
    switch (user.role) {
      case 'admin':
        redirectUrl = '/admin/dashboard.html';
        break;
      case 'staff':
        redirectUrl = '/staff/schedule.html';
        break;
      case 'teacher':
        redirectUrl = '/teacher/dashboard.html';
        break;
    }

    res.json({
      success: true,
      message: '登入成功',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role,
          email: user.email,
          avatar: user.avatar
        },
        redirectUrl
      }
    });
  } catch (error) {
    console.error('登入錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 註冊
exports.register = async (req, res) => {
  try {
    const { username, password, name, email, role } = req.body;

    // 驗證輸入
    if (!username || !password || !name) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位'
      });
    }

    // 檢查使用者名稱是否已存在
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '此帳號已被使用'
      });
    }

    // 加密密碼
    const hashedPassword = await bcrypt.hash(password, 10);

    // 建立使用者
    const userId = await db.insert(
      'INSERT INTO users (username, password, name, email, role) VALUES (?, ?, ?, ?, ?)',
      [username, hashedPassword, name, email || null, role || 'student']
    );

    res.status(201).json({
      success: true,
      message: '註冊成功',
      data: { userId }
    });
  } catch (error) {
    console.error('註冊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得當前使用者資訊
exports.getProfile = async (req, res) => {
  try {
    const user = await db.queryOne(
      'SELECT id, username, name, email, role, phone, avatar, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: '找不到使用者'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('取得使用者資訊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新密碼
exports.updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // 驗證輸入
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '請提供目前密碼和新密碼'
      });
    }

    // 取得使用者
    const user = await db.queryOne(
      'SELECT password FROM users WHERE id = ?',
      [req.user.id]
    );

    // 驗證目前密碼
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({
        success: false,
        message: '目前密碼錯誤'
      });
    }

    // 加密新密碼
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密碼
    await db.update(
      'UPDATE users SET password = ? WHERE id = ?',
      [hashedPassword, req.user.id]
    );

    res.json({
      success: true,
      message: '密碼更新成功'
    });
  } catch (error) {
    console.error('更新密碼錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
