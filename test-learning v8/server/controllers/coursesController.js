const db = require('../config/db');

// 取得所有課程
exports.getAll = async (req, res) => {
  try {
    const { status, teacher_id, classroom_id, course_type_id } = req.query;

    let sql = `
      SELECT
        c.*,
        ct.name as course_type,
        ct.color as course_color,
        u.name as teacher_name,
        cr.name as classroom_name,
        (SELECT COUNT(*) FROM course_enrollments ce
         JOIN course_schedules cs ON ce.schedule_id = cs.id
         WHERE cs.course_id = c.id AND ce.status = 'enrolled') as enrolled_count
      FROM courses c
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON c.classroom_id = cr.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND c.status = ?';
      params.push(status);
    }

    if (teacher_id) {
      sql += ' AND c.teacher_id = ?';
      params.push(teacher_id);
    }

    if (classroom_id) {
      sql += ' AND c.classroom_id = ?';
      params.push(classroom_id);
    }

    if (course_type_id) {
      sql += ' AND c.course_type_id = ?';
      params.push(course_type_id);
    }

    sql += ' ORDER BY c.name';

    const courses = await db.query(sql, params);

    res.json({
      success: true,
      data: courses
    });
  } catch (error) {
    console.error('取得課程列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得單一課程
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await db.queryOne(`
      SELECT
        c.*,
        ct.name as course_type,
        ct.color as course_color,
        u.name as teacher_name,
        cr.name as classroom_name
      FROM courses c
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON c.classroom_id = cr.id
      WHERE c.id = ?
    `, [id]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '找不到課程'
      });
    }

    // 取得課程時段
    const schedules = await db.query(`
      SELECT cs.*, cr.name as classroom_name
      FROM course_schedules cs
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE cs.course_id = ? AND cs.is_active = TRUE
      ORDER BY cs.day_of_week, cs.start_time
    `, [id]);

    course.schedules = schedules;

    // 取得所有班級的學生（去重複）
    const students = await db.query(`
      SELECT DISTINCT ce.student_id, u.name as student_name, s.student_code
      FROM course_enrollments ce
      JOIN course_schedules cs ON ce.schedule_id = cs.id
      JOIN students s ON ce.student_id = s.id
      JOIN users u ON s.user_id = u.id
      WHERE cs.course_id = ? AND ce.status = 'enrolled'
      ORDER BY u.name
    `, [id]);

    course.students = students;

    res.json({
      success: true,
      data: course
    });
  } catch (error) {
    console.error('取得課程詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增課程
exports.create = async (req, res) => {
  try {
    console.log('收到的資料:', req.body); // 除錯用
    const {
      name, description, age_range, course_type_id, teacher_id,
      classroom_id, max_students, fee, status, schedules
    } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '請提供課程名稱'
      });
    }

    const courseId = await db.insert(`
      INSERT INTO courses (
        name, description, age_range, course_type_id, teacher_id,
        classroom_id, max_students, fee, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      name, description || null, age_range || null, course_type_id || null,
      teacher_id || null, classroom_id || null,
      max_students || 10, fee || 0, status || 'active'
    ]);

    // 新增課程時段
    if (schedules && schedules.length > 0) {
      for (const schedule of schedules) {
        await db.insert(`
          INSERT INTO course_schedules (
            course_id, day_of_week, start_time, end_time, classroom_id
          ) VALUES (?, ?, ?, ?, ?)
        `, [
          courseId, schedule.day_of_week, schedule.start_time,
          schedule.end_time, schedule.classroom_id || classroom_id || null
        ]);
      }
    }

    res.status(201).json({
      success: true,
      message: '課程建立成功',
      data: { id: courseId }
    });
  } catch (error) {
    console.error('新增課程錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新課程
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // 先取得現有課程資料
    const course = await db.queryOne('SELECT * FROM courses WHERE id = ?', [id]);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: '找不到課程'
      });
    }

    // 合併現有資料與更新資料
    const name = updates.name !== undefined ? updates.name : course.name;
    const description = updates.description !== undefined ? updates.description : course.description;
    const age_range = updates.age_range !== undefined ? updates.age_range : course.age_range;
    const course_type_id = updates.course_type_id !== undefined ? updates.course_type_id : course.course_type_id;
    const teacher_id = updates.teacher_id !== undefined ? updates.teacher_id : course.teacher_id;
    const classroom_id = updates.classroom_id !== undefined ? updates.classroom_id : course.classroom_id;
    const max_students = updates.max_students !== undefined ? updates.max_students : course.max_students;
    const fee = updates.fee !== undefined ? updates.fee : course.fee;
    const status = updates.status !== undefined ? updates.status : course.status;

    await db.update(`
      UPDATE courses SET
        name = ?, description = ?, age_range = ?, course_type_id = ?, teacher_id = ?,
        classroom_id = ?, max_students = ?, fee = ?, status = ?
      WHERE id = ?
    `, [
      name, description || null, age_range || null, course_type_id || null,
      teacher_id || null, classroom_id || null,
      max_students || 10, fee || 0, status || 'active', id
    ]);

    res.json({
      success: true,
      message: '課程更新成功'
    });
  } catch (error) {
    console.error('更新課程錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 刪除課程
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    await db.update('DELETE FROM courses WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '課程刪除成功'
    });
  } catch (error) {
    console.error('刪除課程錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得課程類型
exports.getTypes = async (req, res) => {
  try {
    const types = await db.query(
      'SELECT * FROM course_types WHERE is_active = TRUE ORDER BY name'
    );

    res.json({
      success: true,
      data: types
    });
  } catch (error) {
    console.error('取得課程類型錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 學生選課（已棄用 - 請使用班級管理的加入學生功能）
exports.enroll = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: '此功能已移至班級管理，請使用班級的「加入學生」功能'
  });
};

// 學生退選（已棄用 - 請使用班級管理的移除學生功能）
exports.unenroll = async (req, res) => {
  return res.status(400).json({
    success: false,
    message: '此功能已移至班級管理，請使用班級的「移除學生」功能'
  });
};
