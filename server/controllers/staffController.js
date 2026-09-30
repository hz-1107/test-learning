const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 行政人員 = users.role 為 'staff' 的帳號；職稱等延伸資料存於 staff_profiles
const BASE_SELECT = `
  SELECT u.id, u.username, u.name, u.email, u.phone, u.birthday, u.avatar, u.is_active, u.created_at,
         sp.title, sp.hire_date, sp.notes
  FROM users u
  LEFT JOIN staff_profiles sp ON sp.user_id = u.id
  WHERE u.role = 'staff'
`;

async function findStaff(id) {
  return db.queryOne(`${BASE_SELECT} AND u.id = ?`, [id]);
}

// 取得所有行政人員
exports.getAll = async (req, res) => {
  try {
    const { search } = req.query;

    let sql = BASE_SELECT;
    const params = [];

    if (search) {
      sql += ' AND (u.name LIKE ? OR u.phone LIKE ? OR u.username LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.is_active DESC, u.name';

    const staff = await db.query(sql, params);

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('取得行政人員列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得單一行政人員
exports.getOne = async (req, res) => {
  try {
    const staff = await findStaff(req.params.id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: '找不到行政人員'
      });
    }

    res.json({
      success: true,
      data: staff
    });
  } catch (error) {
    console.error('取得行政人員詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增行政人員（比照教師：帳號 = LINE ID，預設密碼 = 生日 YYYYMMDD）
exports.create = async (req, res) => {
  try {
    const { name, line_id, phone, email, birthday, title, hire_date, notes } = req.body;

    if (!name || !line_id || !birthday) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位（姓名、LINE ID、生日）'
      });
    }

    const username = line_id.trim();

    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '此 LINE ID 已被使用'
      });
    }

    const hashedPassword = await bcrypt.hash(birthday.replace(/-/g, ''), 10);

    const userId = await db.insert(
      'INSERT INTO users (username, password, name, phone, email, birthday, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name, phone || null, email || null, birthday, 'staff']
    );

    await db.insert(
      'INSERT INTO staff_profiles (user_id, title, hire_date, notes) VALUES (?, ?, ?, ?)',
      [userId, title || null, hire_date || null, notes || null]
    );

    res.status(201).json({
      success: true,
      message: '行政人員建立成功',
      data: { id: userId }
    });
  } catch (error) {
    console.error('新增行政人員錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新行政人員
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, email, birthday, title, hire_date, notes, is_active } = req.body;

    const staff = await findStaff(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: '找不到行政人員'
      });
    }

    if (!name || !birthday) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位（姓名、生日）'
      });
    }

    // 避免把自己停用而被鎖在系統外
    const active = is_active === undefined ? !!staff.is_active : !!is_active;
    if (!active && Number(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '無法停用目前登入的帳號'
      });
    }

    await db.update(
      'UPDATE users SET name = ?, phone = ?, email = ?, birthday = ?, is_active = ? WHERE id = ?',
      [name, phone || null, email || null, birthday, active, id]
    );

    await db.query(`
      INSERT INTO staff_profiles (user_id, title, hire_date, notes)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE title = VALUES(title), hire_date = VALUES(hire_date), notes = VALUES(notes)
    `, [id, title || null, hire_date || null, notes || null]);

    res.json({
      success: true,
      message: '行政人員資料更新成功'
    });
  } catch (error) {
    console.error('更新行政人員錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 刪除行政人員
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (Number(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: '無法刪除目前登入的帳號'
      });
    }

    const staff = await findStaff(id);

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: '找不到行政人員'
      });
    }

    // staff_profiles 以 ON DELETE CASCADE 一併刪除
    await db.update("DELETE FROM users WHERE id = ? AND role = 'staff'", [id]);

    res.json({
      success: true,
      message: '行政人員刪除成功'
    });
  } catch (error) {
    // 帳號仍被其他資料參照（例如點數紀錄的操作人員）時無法刪除
    if (error.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(400).json({
        success: false,
        message: '此帳號仍有相關紀錄，無法刪除，建議改為停用'
      });
    }
    console.error('刪除行政人員錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
