const jwt = require('jsonwebtoken');

// 驗證 JWT Token
const authenticate = (req, res, next) => {
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
