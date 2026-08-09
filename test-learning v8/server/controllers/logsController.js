const db = require('../config/db');

// 取得所有日誌
exports.getAll = async (req, res) => {
  try {
    const { start_date, end_date, teacher_id, course_id, classroom_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        cl.*,
        c.name as course_name,
        ct.name as course_type,
        cr.name as classroom_name,
        u.name as teacher_name,
        (SELECT GROUP_CONCAT(CONCAT(u2.name) SEPARATOR ', ')
         FROM log_permissions lp
         JOIN teachers t2 ON lp.teacher_id = t2.id
         JOIN users u2 ON t2.user_id = u2.id
         WHERE lp.log_id = cl.id) as additional_teachers
      FROM course_logs cl
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN classrooms cr ON cl.classroom_id = cr.id
      JOIN teachers t ON cl.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) {
      sql += ' AND cl.log_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND cl.log_date <= ?';
      params.push(end_date);
    }

    if (teacher_id) {
      sql += ' AND cl.teacher_id = ?';
      params.push(teacher_id);
    }

    if (course_id) {
      sql += ' AND cl.course_id = ?';
      params.push(course_id);
    }

    if (classroom_id) {
      sql += ' AND cl.classroom_id = ?';
      params.push(classroom_id);
    }

    if (status) {
      sql += ' AND cl.status = ?';
      params.push(status);
    }

    // 計算總數
    const countSql = sql.replace(/SELECT[\s\S]*?FROM course_logs/, 'SELECT COUNT(*) as total FROM course_logs');
    const countResult = await db.queryOne(countSql, params);
    const total = countResult ? countResult.total : 0;

    // 註: LIMIT/OFFSET 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    // (mysql2 prepared statement 對 LIMIT/OFFSET 使用佔位符在部分版本會出錯)
    sql += ` ORDER BY cl.log_date DESC, cl.start_time DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const logs = await db.query(sql, params);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('取得日誌列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得單一日誌
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const log = await db.queryOne(`
      SELECT
        cl.*,
        c.name as course_name,
        ct.name as course_type,
        cr.name as classroom_name,
        cr.address as classroom_address,
        u.name as teacher_name
      FROM course_logs cl
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN classrooms cr ON cl.classroom_id = cr.id
      JOIN teachers t ON cl.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE cl.id = ?
    `, [id]);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: '找不到日誌'
      });
    }

    // 取得學生記錄
    const studentRecords = await db.query(`
      SELECT
        slr.*,
        u.name as student_name,
        s.student_code
      FROM student_log_records slr
      JOIN students s ON slr.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE slr.log_id = ?
      ORDER BY u.name
    `, [id]);

    // 取得每個學生的照片
    for (const record of studentRecords) {
      const photos = await db.query(
        'SELECT * FROM student_log_photos WHERE record_id = ?',
        [record.id]
      );
      record.photos = photos;
    }

    log.student_records = studentRecords;

    // 取得權限設定
    const permissions = await db.query(`
      SELECT lp.*, u.name as teacher_name
      FROM log_permissions lp
      JOIN teachers t ON lp.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE lp.log_id = ?
    `, [id]);

    log.permissions = permissions;

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('取得日誌詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 建立日誌
exports.create = async (req, res) => {
  try {
    const {
      course_id, schedule_id, log_date, start_time, end_time,
      classroom_id, teacher_id, topic, content, outline
    } = req.body;

    if (!course_id || !log_date || !teacher_id) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位'
      });
    }

    const logId = await db.insert(`
      INSERT INTO course_logs (
        course_id, schedule_id, log_date, start_time, end_time,
        classroom_id, teacher_id, topic, content, outline, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `, [
      course_id, schedule_id || null, log_date, start_time || null,
      end_time || null, classroom_id || null, teacher_id,
      topic || null, content || null, outline ? JSON.stringify(outline) : null
    ]);

    res.status(201).json({
      success: true,
      message: '日誌建立成功',
      data: { id: logId }
    });
  } catch (error) {
    console.error('建立日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新日誌
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { topic, content, outline, status } = req.body;

    const log = await db.queryOne('SELECT id FROM course_logs WHERE id = ?', [id]);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: '找不到日誌'
      });
    }

    await db.update(`
      UPDATE course_logs SET
        topic = ?, content = ?, outline = ?, status = ?
      WHERE id = ?
    `, [
      topic || null, content || null,
      outline ? JSON.stringify(outline) : null,
      status || 'pending', id
    ]);

    res.json({
      success: true,
      message: '日誌更新成功'
    });
  } catch (error) {
    console.error('更新日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新日誌權限
exports.updatePermissions = async (req, res) => {
  try {
    const { id } = req.params;
    const { teacher_ids } = req.body;

    // 刪除舊的權限
    await db.update('DELETE FROM log_permissions WHERE log_id = ?', [id]);

    // 新增新的權限
    if (teacher_ids && teacher_ids.length > 0) {
      for (const teacherId of teacher_ids) {
        await db.insert(
          'INSERT INTO log_permissions (log_id, teacher_id, granted_by) VALUES (?, ?, ?)',
          [id, teacherId, req.user.id]
        );
      }
    }

    res.json({
      success: true,
      message: '權限更新成功'
    });
  } catch (error) {
    console.error('更新日誌權限錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增/更新學生日誌記錄
exports.updateStudentRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.params;
    const {
      attendance, performance, notes,
      skill_programming, skill_debugging, skill_creativity,
      skill_structure, skill_teamwork, points_earned
    } = req.body;

    // 檢查是否已有記錄
    const existingRecord = await db.queryOne(
      'SELECT id FROM student_log_records WHERE log_id = ? AND student_id = ?',
      [id, student_id]
    );

    if (existingRecord) {
      // 更新
      await db.update(`
        UPDATE student_log_records SET
          attendance = ?, performance = ?, notes = ?,
          skill_programming = ?, skill_debugging = ?, skill_creativity = ?,
          skill_structure = ?, skill_teamwork = ?, points_earned = ?
        WHERE id = ?
      `, [
        attendance || 'present', performance || null, notes || null,
        skill_programming || 0, skill_debugging || 0, skill_creativity || 0,
        skill_structure || 0, skill_teamwork || 0, points_earned || 0,
        existingRecord.id
      ]);
    } else {
      // 新增
      await db.insert(`
        INSERT INTO student_log_records (
          log_id, student_id, attendance, performance, notes,
          skill_programming, skill_debugging, skill_creativity,
          skill_structure, skill_teamwork, points_earned
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, student_id, attendance || 'present', performance || null, notes || null,
        skill_programming || 0, skill_debugging || 0, skill_creativity || 0,
        skill_structure || 0, skill_teamwork || 0, points_earned || 0
      ]);
    }

    // 如果有點數，新增點數交易記錄
    if (points_earned && points_earned > 0) {
      await db.insert(`
        INSERT INTO point_transactions (
          student_id, points, type, reason, reference_type, reference_id, created_by
        ) VALUES (?, ?, 'earn', '課堂表現', 'log', ?, ?)
      `, [student_id, points_earned, id, req.user.id]);
    }

    res.json({
      success: true,
      message: '學生記錄更新成功'
    });
  } catch (error) {
    console.error('更新學生日誌記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
