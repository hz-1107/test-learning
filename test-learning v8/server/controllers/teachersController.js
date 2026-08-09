const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 取得所有教師
exports.getAll = async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT t.*, t.hire_date, u.username, u.name, u.email, u.phone, u.birthday, u.avatar, u.is_active
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND t.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (u.name LIKE ? OR u.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.name';

    const teachers = await db.query(sql, params);

    res.json({
      success: true,
      data: teachers
    });
  } catch (error) {
    console.error('取得教師列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得單一教師
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await db.queryOne(`
      SELECT t.*, u.username, u.name, u.email, u.phone, u.birthday, u.avatar, u.is_active
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE t.id = ?
    `, [id]);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '找不到教師'
      });
    }

    // 取得教師的課程
    const courses = await db.query(`
      SELECT c.*, ct.name as course_type, cr.name as classroom_name
      FROM courses c
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN classrooms cr ON c.classroom_id = cr.id
      WHERE c.teacher_id = ? AND c.status = 'active'
    `, [id]);

    teacher.courses = courses;

    res.json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('取得教師詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增教師
exports.create = async (req, res) => {
  try {
    const {
      name, school, line_id, phone, birthday, hire_date, notes
    } = req.body;

    if (!name || !line_id || !birthday) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位（姓名、LINE ID、生日）'
      });
    }

    // 使用 LINE ID 作為帳號
    const username = line_id;

    // 檢查帳號是否已存在
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

    // 使用生日作為密碼 (格式: YYYYMMDD)
    const password = birthday.replace(/-/g, '');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 建立使用者
    const userId = await db.insert(
      'INSERT INTO users (username, password, name, phone, birthday, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name, phone || null, birthday, 'teacher']
    );

    // 建立教師資料
    const teacherId = await db.insert(`
      INSERT INTO teachers (user_id, school, hire_date, notes)
      VALUES (?, ?, ?, ?)
    `, [userId, school || null, hire_date || null, notes || null]);

    res.status(201).json({
      success: true,
      message: '教師建立成功',
      data: { id: teacherId, userId }
    });
  } catch (error) {
    console.error('新增教師錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新教師
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, birthday, school, hire_date, notes } = req.body;

    const teacher = await db.queryOne('SELECT user_id FROM teachers WHERE id = ?', [id]);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '找不到教師'
      });
    }

    // 更新使用者資料
    await db.update(
      'UPDATE users SET name = ?, phone = ?, birthday = ? WHERE id = ?',
      [name, phone || null, birthday || null, teacher.user_id]
    );

    // 更新教師資料
    await db.update(`
      UPDATE teachers SET school = ?, hire_date = ?, notes = ?
      WHERE id = ?
    `, [school || null, hire_date || null, notes || null, id]);

    res.json({
      success: true,
      message: '教師資料更新成功'
    });
  } catch (error) {
    console.error('更新教師錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 刪除教師
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await db.queryOne('SELECT user_id FROM teachers WHERE id = ?', [id]);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '找不到教師'
      });
    }

    await db.update('DELETE FROM users WHERE id = ?', [teacher.user_id]);

    res.json({
      success: true,
      message: '教師刪除成功'
    });
  } catch (error) {
    console.error('刪除教師錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得教師的課程日誌
exports.getLogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date, status } = req.query;

    let sql = `
      SELECT cl.*, c.name as course_name, cr.name as classroom_name
      FROM course_logs cl
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN classrooms cr ON cl.classroom_id = cr.id
      WHERE cl.teacher_id = ?
    `;
    const params = [id];

    if (start_date) {
      sql += ' AND cl.log_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND cl.log_date <= ?';
      params.push(end_date);
    }

    if (status) {
      sql += ' AND cl.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY cl.log_date DESC, cl.start_time DESC';

    const logs = await db.query(sql, params);

    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    console.error('取得教師課程日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
