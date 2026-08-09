const db = require('../config/db');

// 取得所有班級時段（不含已刪除）
exports.getAll = async (req, res) => {
  try {
    const { course_id, teacher_id, classroom_id, status } = req.query;

    let sql = `
      SELECT
        cs.*,
        c.name as course_name,
        c.status as course_status,
        c.teacher_id,
        u.name as teacher_name,
        cr.name as classroom_name,
        (SELECT COUNT(*) FROM course_enrollments WHERE schedule_id = cs.id AND status = 'enrolled') as student_count
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE cs.deleted_at IS NULL
    `;
    const params = [];

    if (course_id) {
      sql += ' AND cs.course_id = ?';
      params.push(course_id);
    }

    if (teacher_id) {
      sql += ' AND c.teacher_id = ?';
      params.push(teacher_id);
    }

    if (classroom_id) {
      sql += ' AND cs.classroom_id = ?';
      params.push(classroom_id);
    }

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY cs.day_of_week, cs.start_time';

    const schedules = await db.query(sql, params);

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('取得班級列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得已刪除的班級（垃圾桶）
exports.getDeleted = async (req, res) => {
  try {
    const sql = `
      SELECT
        cs.*,
        c.name as course_name,
        c.status as course_status,
        c.teacher_id,
        u.name as teacher_name,
        cr.name as classroom_name,
        (SELECT COUNT(*) FROM course_enrollments WHERE schedule_id = cs.id AND status = 'enrolled') as student_count,
        DATEDIFF(DATE_ADD(cs.deleted_at, INTERVAL 30 DAY), NOW()) as days_until_permanent_delete
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE cs.deleted_at IS NOT NULL
      ORDER BY cs.deleted_at DESC
    `;

    const schedules = await db.query(sql);

    res.json({
      success: true,
      data: schedules
    });
  } catch (error) {
    console.error('取得已刪除班級錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得單一班級時段
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await db.queryOne(`
      SELECT
        cs.*,
        c.name as course_name,
        c.status as course_status,
        c.teacher_id,
        u.name as teacher_name,
        cr.name as classroom_name
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE cs.id = ?
    `, [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到班級'
      });
    }

    res.json({
      success: true,
      data: schedule
    });
  } catch (error) {
    console.error('取得班級詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增班級時段
exports.create = async (req, res) => {
  try {
    const { course_id, day_of_week, start_time, end_time, classroom_id } = req.body;

    if (!course_id || day_of_week === undefined || !start_time || !end_time) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位（課程、星期、開始時間、結束時間）'
      });
    }

    const scheduleId = await db.insert(`
      INSERT INTO course_schedules (course_id, day_of_week, start_time, end_time, classroom_id, is_active)
      VALUES (?, ?, ?, ?, ?, TRUE)
    `, [course_id, day_of_week, start_time, end_time, classroom_id || null]);

    res.status(201).json({
      success: true,
      message: '班級建立成功',
      data: { id: scheduleId }
    });
  } catch (error) {
    console.error('新增班級錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新班級時段
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { course_id, day_of_week, start_time, end_time, classroom_id, is_active } = req.body;

    const schedule = await db.queryOne('SELECT id FROM course_schedules WHERE id = ?', [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到班級'
      });
    }

    await db.update(`
      UPDATE course_schedules SET
        course_id = ?, day_of_week = ?, start_time = ?, end_time = ?,
        classroom_id = ?, is_active = ?
      WHERE id = ?
    `, [
      course_id, day_of_week, start_time, end_time,
      classroom_id || null, is_active !== undefined ? is_active : true, id
    ]);

    res.json({
      success: true,
      message: '班級更新成功'
    });
  } catch (error) {
    console.error('更新班級錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 軟刪除班級時段（移至垃圾桶）
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await db.queryOne('SELECT id FROM course_schedules WHERE id = ? AND deleted_at IS NULL', [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到班級'
      });
    }

    await db.update('UPDATE course_schedules SET deleted_at = NOW() WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '班級已移至垃圾桶'
    });
  } catch (error) {
    console.error('刪除班級錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 還原班級時段
exports.restore = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await db.queryOne('SELECT id FROM course_schedules WHERE id = ? AND deleted_at IS NOT NULL', [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到已刪除的班級'
      });
    }

    await db.update('UPDATE course_schedules SET deleted_at = NULL WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '班級已還原'
    });
  } catch (error) {
    console.error('還原班級錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 永久刪除班級時段
exports.permanentDelete = async (req, res) => {
  try {
    const { id } = req.params;

    await db.update('DELETE FROM course_schedules WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '班級已永久刪除'
    });
  } catch (error) {
    console.error('永久刪除班級錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得所有教室
exports.getClassrooms = async (req, res) => {
  try {
    const classrooms = await db.query(
      'SELECT * FROM classrooms WHERE is_active = TRUE ORDER BY name'
    );

    res.json({
      success: true,
      data: classrooms
    });
  } catch (error) {
    console.error('取得教室列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得班級的學生列表
exports.getStudents = async (req, res) => {
  try {
    const { id } = req.params;

    // 先取得班級資訊
    const schedule = await db.queryOne(`
      SELECT cs.*, c.name as course_name, c.teacher_id,
        u.name as teacher_name, cr.name as classroom_name
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE cs.id = ?
    `, [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到班級'
      });
    }

    // 取得該班級的學生
    const students = await db.query(`
      SELECT
        s.id, s.school, s.grade,
        u.name,
        ct.name as course_type_name, ct.color as course_type_color
      FROM course_enrollments ce
      JOIN students s ON ce.student_id = s.id
      JOIN users u ON s.user_id = u.id
      LEFT JOIN course_types ct ON s.course_type_id = ct.id
      WHERE ce.schedule_id = ? AND ce.status = 'enrolled'
      ORDER BY u.name
    `, [id]);

    res.json({
      success: true,
      data: {
        schedule,
        students
      }
    });
  } catch (error) {
    console.error('取得班級學生列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得可加入班級的學生列表
exports.getAvailableStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { search } = req.query;

    // 先取得班級資訊
    const schedule = await db.queryOne(`
      SELECT cs.id as schedule_id, c.name as course_name, c.teacher_id,
        u.name as teacher_name, cr.name as classroom_name,
        (SELECT COUNT(*) FROM course_enrollments WHERE schedule_id = cs.id AND status = 'enrolled') as student_count
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE cs.id = ?
    `, [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到班級'
      });
    }

    // 取得所有學生（標記已加入此班級的）
    let sql = `
      SELECT
        s.id, s.school, s.grade,
        u.name,
        ct.name as course_type_name, ct.color as course_type_color,
        CASE WHEN ce.id IS NOT NULL THEN 1 ELSE 0 END as is_enrolled
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN course_types ct ON s.course_type_id = ct.id
      LEFT JOIN course_enrollments ce ON ce.student_id = s.id AND ce.schedule_id = ? AND ce.status = 'enrolled'
      WHERE s.status = 'active'
    `;
    const params = [id];

    if (search) {
      sql += ' AND (u.name LIKE ? OR s.school LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }

    sql += ' ORDER BY u.name';

    const students = await db.query(sql, params);

    res.json({
      success: true,
      data: {
        schedule,
        students
      }
    });
  } catch (error) {
    console.error('取得可加入學生列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 批量加入學生
exports.enrollStudents = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_ids } = req.body;

    if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請選擇要加入的學生'
      });
    }

    // 確認班級存在
    const schedule = await db.queryOne('SELECT id FROM course_schedules WHERE id = ?', [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到班級'
      });
    }

    const scheduleId = id;
    let enrolledCount = 0;

    for (const studentId of student_ids) {
      // 檢查是否已加入此班級
      const existing = await db.queryOne(
        'SELECT id, status FROM course_enrollments WHERE schedule_id = ? AND student_id = ?',
        [scheduleId, studentId]
      );

      if (existing) {
        if (existing.status !== 'enrolled') {
          await db.update(
            'UPDATE course_enrollments SET status = "enrolled" WHERE id = ?',
            [existing.id]
          );
          enrolledCount++;
        }
      } else {
        await db.insert(
          'INSERT INTO course_enrollments (schedule_id, student_id, status) VALUES (?, ?, "enrolled")',
          [scheduleId, studentId]
        );
        enrolledCount++;
      }
    }

    res.json({
      success: true,
      message: `已成功加入 ${enrolledCount} 名學生`
    });
  } catch (error) {
    console.error('批量加入學生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 從班級移除學生
exports.removeStudent = async (req, res) => {
  try {
    const { id, student_id } = req.params;

    // 確認班級存在
    const schedule = await db.queryOne('SELECT id FROM course_schedules WHERE id = ?', [id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到班級'
      });
    }

    await db.update(
      'UPDATE course_enrollments SET status = "dropped" WHERE schedule_id = ? AND student_id = ?',
      [id, student_id]
    );

    res.json({
      success: true,
      message: '學生已從班級移除'
    });
  } catch (error) {
    console.error('移除學生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
