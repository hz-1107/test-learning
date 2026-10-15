const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateUsername, birthdayPassword, syncBirthdayPassword, checkLoginConflict } = require('../utils/account');
const { listScheduleLogs, groupLogsBySchedule, loadCalendar } = require('../utils/expectedLogs');

/**
 * 計算每位教師未完成的上課日誌數量
 * 依課表推算每一堂課（規則見 utils/expectedLogs，與「日誌管理」列表共用），
 * 該堂課沒有日誌或日誌尚未完成都算一則未完成
 * 回傳 { teacher_id: count }
 */
async function countIncompleteLogsByTeacher() {
  const schedules = await db.query(`
    SELECT cs.id, cs.teacher_id, cs.day_of_week, cs.start_time, cs.start_date, cs.created_at
    FROM course_schedules cs
    JOIN courses c ON cs.course_id = c.id
    WHERE cs.is_active = 1 AND c.status = 'active' AND cs.deleted_at IS NULL AND cs.teacher_id IS NOT NULL
  `);
  if (schedules.length === 0) return {};

  const logs = await db.query(
    'SELECT schedule_id, log_date, status FROM course_logs WHERE schedule_id IN (?)',
    [schedules.map(s => s.id)]
  );
  const logsBySchedule = groupLogsBySchedule(logs);
  const calendar = await loadCalendar();

  const counts = {};
  schedules.forEach(schedule => {
    listScheduleLogs(schedule, logsBySchedule.get(schedule.id) || new Map(), { calendar }).forEach(({ log }) => {
      if (!log || log.status !== 'completed') {
        counts[schedule.teacher_id] = (counts[schedule.teacher_id] || 0) + 1;
      }
    });
  });

  return counts;
}

// 取得所有教師
exports.getAll = async (req, res) => {
  try {
    const { status, search } = req.query;

    let sql = `
      SELECT t.*, t.hire_date, u.username, u.line_id, u.name, u.email, u.phone, u.birthday, u.avatar, u.is_active
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

    // 教師端只需要同事名單（例如日誌的「師資異動」選單），不提供電話、生日、備註等個資
    if (!['admin', 'staff'].includes(req.user.role)) {
      return res.json({
        success: true,
        data: teachers.map(t => ({
          id: t.id,
          name: t.name,
          avatar: t.avatar,
          is_active: t.is_active,
          status: t.status
        }))
      });
    }

    const incompleteCounts = await countIncompleteLogsByTeacher();
    teachers.forEach(t => {
      t.incomplete_logs_count = incompleteCounts[t.id] || 0;
    });

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
      SELECT t.*, u.username, u.line_id, u.name, u.email, u.phone, u.birthday, u.avatar, u.is_active
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

    // 取得教師的課程；教室取自該課程啟用中的班級（課程本身不綁定教室）
    const courses = await db.query(`
      SELECT c.*, ct.name as course_type,
        (SELECT GROUP_CONCAT(DISTINCT cr.name ORDER BY cr.name SEPARATOR '、')
         FROM course_schedules cs
         JOIN classrooms cr ON cs.classroom_id = cr.id
         WHERE cs.course_id = c.id AND cs.is_active = TRUE) as classroom_names
      FROM courses c
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
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

    if (!name || !birthday) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位（姓名、生日）'
      });
    }

    const conflict = await checkLoginConflict(name, birthday);
    if (conflict) {
      return res.status(400).json({ success: false, message: conflict });
    }

    // 登入帳號為姓名，密碼為西元生日 (格式: YYYYMMDD)
    const username = await generateUsername(name);
    const hashedPassword = await bcrypt.hash(birthdayPassword(birthday), 10);

    // 建立使用者
    const userId = await db.insert(
      'INSERT INTO users (username, password, name, phone, line_id, birthday, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name.trim(), phone || null, (line_id || '').trim() || null, birthday, 'teacher']
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
    const { name, phone, birthday, school, line_id, hire_date, notes, status } = req.body;

    const teacher = await db.queryOne('SELECT user_id FROM teachers WHERE id = ?', [id]);

    if (!teacher) {
      return res.status(404).json({
        success: false,
        message: '找不到教師'
      });
    }

    const conflict = await checkLoginConflict(name, birthday, teacher.user_id);
    if (conflict) {
      return res.status(400).json({ success: false, message: conflict });
    }

    // 更新使用者資料（生日有更動時，登入密碼同步更新）
    await syncBirthdayPassword(teacher.user_id, birthday);
    await db.update(
      'UPDATE users SET name = ?, phone = ?, birthday = ? WHERE id = ?',
      [name, phone || null, birthday || null, teacher.user_id]
    );

    // 有帶 LINE ID 欄位才更新，避免其他未送此欄位的表單把既有資料清空
    if (line_id !== undefined) {
      await db.update(
        'UPDATE users SET line_id = ? WHERE id = ?',
        [(line_id || '').trim() || null, teacher.user_id]
      );
    }

    // 更新教師資料（未傳 status 時保留原值）
    const hasStatus = ['active', 'inactive'].includes(status);
    await db.update(`
      UPDATE teachers SET school = ?, hire_date = ?, notes = ?, status = IF(?, ?, status)
      WHERE id = ?
    `, [school || null, hire_date || null, notes || null, hasStatus, status || 'active', id]);

    // 離職的老師停用帳號（無法登入）；改回在職則重新啟用
    if (hasStatus) {
      await db.update('UPDATE users SET is_active = ? WHERE id = ?', [status === 'active', teacher.user_id]);
    }

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
