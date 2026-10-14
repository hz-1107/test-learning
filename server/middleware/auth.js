const jwt = require('jsonwebtoken');
const db = require('../config/db');

// 驗證 JWT Token
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供認證 Token'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 帳號被停用（例如老師離職）後，已登入的 Token 也立即失效
    const user = await db.queryOne('SELECT is_active FROM users WHERE id = ?', [decoded.id]);
    if (!user || !user.is_active) {
      return res.status(401).json({
        success: false,
        message: '帳號已停用，請聯絡行政人員'
      });
    }

    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token 已過期，請重新登入'
      });
    }
    return res.status(401).json({
      success: false,
      message: '無效的 Token'
    });
  }
};

// 檢查角色權限
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '請先登入'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '您沒有權限執行此操作'
      });
    }

    next();
  };
};

// 可選的認證 (有 token 就驗證，沒有也可以通過)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
    }

    next();
  } catch (error) {
    // Token 無效時不阻擋，只是不設定 user
    next();
  }
};

module.exports = {
  authenticate,
  authorize,
  optionalAuth
};
