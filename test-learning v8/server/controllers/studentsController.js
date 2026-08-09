const db = require('../config/db');
const bcrypt = require('bcryptjs');

// 取得所有學生
exports.getAll = async (req, res) => {
  try {
    const { status, search, classroom_id, course_type_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let sql = `
      SELECT
        s.*,
        u.username, u.name, u.email, u.phone, u.avatar, u.is_active,
        t.id as teacher_id,
        tu.name as teacher_name,
        cr.id as classroom_id,
        cr.name as classroom_name,
        ct.id as course_type_id,
        ct.name as course_type_name,
        (SELECT cs.start_time FROM course_schedules cs
         JOIN course_enrollments ce ON cs.id = ce.schedule_id
         WHERE ce.student_id = s.id AND ce.status = 'enrolled' AND cs.deleted_at IS NULL
         LIMIT 1) as class_start_time,
        (SELECT cs.end_time FROM course_schedules cs
         JOIN course_enrollments ce ON cs.id = ce.schedule_id
         WHERE ce.student_id = s.id AND ce.status = 'enrolled' AND cs.deleted_at IS NULL
         LIMIT 1) as class_end_time,
        (SELECT cs.day_of_week FROM course_schedules cs
         JOIN course_enrollments ce ON cs.id = ce.schedule_id
         WHERE ce.student_id = s.id AND ce.status = 'enrolled' AND cs.deleted_at IS NULL
         LIMIT 1) as class_day
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN classrooms cr ON s.classroom_id = cr.id
      LEFT JOIN course_types ct ON s.course_type_id = ct.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      sql += ' AND s.status = ?';
      params.push(status);
    }

    if (search) {
      sql += ' AND (u.name LIKE ? OR s.student_code LIKE ? OR u.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (classroom_id) {
      sql += ' AND s.classroom_id = ?';
      params.push(classroom_id);
    }

    if (course_type_id) {
      sql += ' AND s.course_type_id = ?';
      params.push(course_type_id);
    }

    // 計算總數
    const countSql = sql.replace(/SELECT[\s\S]*?FROM students/, 'SELECT COUNT(*) as total FROM students');
    const countResult = await db.query(countSql, params);
    const total = countResult[0]?.total || 0;

    // 加入分頁
    // 註: LIMIT/OFFSET 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    // (mysql2 prepared statement 對 LIMIT/OFFSET 使用佔位符在部分版本會出錯)
    sql += ` ORDER BY s.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

    const students = await db.query(sql, params);

    res.json({
      success: true,
      data: {
        students,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('取得學生列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得單一學生
exports.getOne = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await db.queryOne(`
      SELECT
        s.*,
        u.username, u.name, u.email, u.phone, u.birthday, u.avatar, u.is_active,
        t.id as assigned_teacher_id,
        tu.name as teacher_name,
        tt.id as assigned_trial_teacher_id,
        ttu.name as trial_teacher_name,
        cr.name as classroom_name,
        ct.name as course_type_name
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN teachers t ON s.teacher_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN teachers tt ON s.trial_teacher_id = tt.id
      LEFT JOIN users ttu ON tt.user_id = ttu.id
      LEFT JOIN classrooms cr ON s.classroom_id = cr.id
      LEFT JOIN course_types ct ON s.course_type_id = ct.id
      WHERE s.id = ?
    `, [id]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到學生'
      });
    }

    // 取得學生的點數餘額
    const pointsResult = await db.queryOne(`
      SELECT COALESCE(SUM(points), 0) as total_points
      FROM point_transactions
      WHERE student_id = ?
    `, [id]);

    student.total_points = pointsResult.total_points;

    // 取得學生的班級
    const enrollments = await db.query(`
      SELECT ce.*, c.name as course_name, ct.name as course_type,
        cs.day_of_week, cs.start_time, cs.end_time, cr.name as classroom_name
      FROM course_enrollments ce
      JOIN course_schedules cs ON ce.schedule_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE ce.student_id = ? AND ce.status = 'enrolled' AND cs.deleted_at IS NULL
    `, [id]);

    student.enrollments = enrollments;

    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    console.error('取得學生詳情錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增學生
exports.create = async (req, res) => {
  try {
    const {
      name, birthday, school, grade, enrollment_date,
      teacher_id, parent_name_father, parent_phone_father,
      parent_name_mother, parent_phone_mother,
      trial_teacher_id, trial_topic,
      classroom_id, course_type_id, schedule_id
    } = req.body;

    // 驗證必要欄位
    if (!name || !birthday || !school || !enrollment_date || !classroom_id || !course_type_id) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位（姓名、生日、學校、到班日期、教室、上課類別）'
      });
    }

    // 使用父親電話作為帳號
    const username = parent_phone_father ? parent_phone_father.replace(/-/g, '') : null;
    if (!username) {
      return res.status(400).json({
        success: false,
        message: '請提供家長電話(父)作為登入帳號'
      });
    }

    // 檢查帳號是否已存在
    const existingUser = await db.queryOne(
      'SELECT id FROM users WHERE username = ?',
      [username]
    );

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '此電話號碼已被使用作為帳號'
      });
    }

    // 使用生日作為密碼 (格式: YYYYMMDD)
    const password = birthday.replace(/-/g, '');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 建立使用者
    const userId = await db.insert(
      'INSERT INTO users (username, password, name, phone, birthday, role) VALUES (?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name, parent_phone_father || null, birthday, 'student']
    );

    // 建立學生資料
    const studentId = await db.insert(`
      INSERT INTO students (
        user_id, birth_date, school, grade, enrollment_date,
        teacher_id, parent_name_father, parent_phone_father,
        parent_name_mother, parent_phone_mother,
        trial_teacher_id, trial_topic,
        classroom_id, course_type_id, lesson_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, birthday, school, grade || null, enrollment_date,
      teacher_id || null, parent_name_father || null, parent_phone_father || null,
      parent_name_mother || null, parent_phone_mother || null,
      trial_teacher_id || null, trial_topic || null,
      classroom_id, course_type_id, 0
    ]);

    // 如果有選擇班級，自動加入班級
    if (schedule_id) {
      const schedule = await db.queryOne('SELECT id FROM course_schedules WHERE id = ?', [schedule_id]);
      if (schedule) {
        await db.insert(
          'INSERT INTO course_enrollments (schedule_id, student_id, status) VALUES (?, ?, ?)',
          [schedule_id, studentId, 'enrolled']
        );
      }
    }

    res.status(201).json({
      success: true,
      message: '學生建立成功',
      data: { id: studentId, userId }
    });
  } catch (error) {
    console.error('新增學生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新學生
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name, birthday, school, grade, enrollment_date,
      teacher_id, parent_name_father, parent_phone_father,
      parent_name_mother, parent_phone_mother,
      trial_teacher_id, trial_topic,
      classroom_id, course_type_id, schedule_id, status
    } = req.body;

    // 取得學生資料
    const student = await db.queryOne('SELECT user_id FROM students WHERE id = ?', [id]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到學生'
      });
    }

    // 更新使用者資料
    await db.update(
      'UPDATE users SET name = ?, birthday = ?, phone = ? WHERE id = ?',
      [name, birthday || null, parent_phone_father || null, student.user_id]
    );

    // 更新學生資料
    await db.update(`
      UPDATE students SET
        birth_date = ?, school = ?, grade = ?, enrollment_date = ?,
        teacher_id = ?, parent_name_father = ?, parent_phone_father = ?,
        parent_name_mother = ?, parent_phone_mother = ?,
        trial_teacher_id = ?, trial_topic = ?,
        classroom_id = ?, course_type_id = ?, status = ?
      WHERE id = ?
    `, [
      birthday || null, school || null, grade || null, enrollment_date || null,
      teacher_id || null, parent_name_father || null, parent_phone_father || null,
      parent_name_mother || null, parent_phone_mother || null,
      trial_teacher_id || null, trial_topic || null,
      classroom_id || null, course_type_id || null, status || 'active', id
    ]);

    // 如果有更新班級
    if (schedule_id) {
      const schedule = await db.queryOne('SELECT id FROM course_schedules WHERE id = ?', [schedule_id]);
      if (schedule) {
        // 先取消之前的所有班級
        await db.update(
          'UPDATE course_enrollments SET status = "dropped" WHERE student_id = ?',
          [id]
        );
        // 新增新的班級
        const existing = await db.queryOne(
          'SELECT id FROM course_enrollments WHERE schedule_id = ? AND student_id = ?',
          [schedule_id, id]
        );
        if (existing) {
          await db.update(
            'UPDATE course_enrollments SET status = "enrolled" WHERE id = ?',
            [existing.id]
          );
        } else {
          await db.insert(
            'INSERT INTO course_enrollments (schedule_id, student_id, status) VALUES (?, ?, ?)',
            [schedule_id, id, 'enrolled']
          );
        }
      }
    }

    res.json({
      success: true,
      message: '學生資料更新成功'
    });
  } catch (error) {
    console.error('更新學生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 刪除學生
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await db.queryOne('SELECT user_id FROM students WHERE id = ?', [id]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到學生'
      });
    }

    // 刪除使用者 (會連帶刪除學生資料，因為有 CASCADE)
    await db.update('DELETE FROM users WHERE id = ?', [student.user_id]);

    res.json({
      success: true,
      message: '學生刪除成功'
    });
  } catch (error) {
    console.error('刪除學生錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得學生點數記錄
exports.getPoints = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 註: LIMIT/OFFSET 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    // (mysql2 prepared statement 對 LIMIT/OFFSET 使用佔位符在部分版本會出錯)
    const transactions = await db.query(`
      SELECT pt.*, u.name as created_by_name
      FROM point_transactions pt
      LEFT JOIN users u ON pt.created_by = u.id
      WHERE pt.student_id = ?
      ORDER BY pt.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, [id]);

    const balance = await db.queryOne(`
      SELECT COALESCE(SUM(points), 0) as balance
      FROM point_transactions
      WHERE student_id = ?
    `, [id]);

    res.json({
      success: true,
      data: {
        transactions,
        balance: balance.balance
      }
    });
  } catch (error) {
    console.error('取得學生點數記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// =====================
// 學生本人自助功能
// =====================

// 取得目前登入學生的 students.id (內部輔助函式)
async function getSelfStudentId(userId) {
  const student = await db.queryOne('SELECT id FROM students WHERE user_id = ?', [userId]);
  return student ? student.id : null;
}

// 取得本人完整檔案 (個人資料 + 點數 + 所屬班級 + 出缺勤統計 + 能力雷達)
exports.getMe = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: '僅限學生角色使用此端點' });
    }

    const student = await db.queryOne(`
      SELECT s.*, u.username, u.name, u.email, u.phone, u.avatar,
        DATE_FORMAT(s.birth_date, '%Y-%m-%d') as birth_date,
        DATE_FORMAT(s.enrollment_date, '%Y-%m-%d') as enrollment_date
      FROM students s
      JOIN users u ON s.user_id = u.id
      WHERE s.user_id = ?
    `, [req.user.id]);

    if (!student) {
      return res.status(404).json({ success: false, message: '找不到學生資料，請聯絡管理人員建立學生檔案' });
    }

    // 點數餘額與最近交易紀錄
    const balanceResult = await db.queryOne(
      'SELECT COALESCE(SUM(points), 0) as balance FROM point_transactions WHERE student_id = ?',
      [student.id]
    );
    const recentTransactions = await db.query(
      'SELECT id, points, type, reason, created_at FROM point_transactions WHERE student_id = ? ORDER BY created_at DESC LIMIT 20',
      [student.id]
    );

    // 目前所屬班級 (取最新一筆已選讀的課程，含教師/教室/課程類型等關聯資料)
    // 註: course_enrollments 是透過 schedule_id 關聯到 course_schedules，
    // 課程 (courses) 要再透過 course_schedules.course_id 才能取得，並無直接的 ce.course_id 欄位
    const enrollment = await db.queryOne(`
      SELECT
        c.id as course_id, c.name as course_name,
        ct.id as course_type_id, ct.name as course_type_name,
        tu.name as teacher_name,
        cr.name as classroom_name,
        cs.day_of_week, cs.start_time, cs.end_time
      FROM course_enrollments ce
      JOIN course_schedules cs ON ce.schedule_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE ce.student_id = ? AND ce.status = 'enrolled' AND cs.deleted_at IS NULL
      ORDER BY ce.enrolled_at DESC
      LIMIT 1
    `, [student.id]);

    // 歷史課程 (含目前與過去選讀過的課程)
    const courseHistory = await db.query(`
      SELECT DISTINCT c.id as course_id, c.name as course_name, ce.status
      FROM course_enrollments ce
      JOIN course_schedules cs ON ce.schedule_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      WHERE ce.student_id = ?
      ORDER BY c.id
    `, [student.id]);

    // 出缺勤統計 (以目前班級課程為主，若無班級則統計全部)
    const attendanceParams = [student.id];
    let attendanceSql = `
      SELECT slr.attendance, COUNT(*) as count
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      WHERE slr.student_id = ?
    `;
    if (enrollment) {
      attendanceSql += ' AND cl.course_id = ?';
      attendanceParams.push(enrollment.course_id);
    }
    attendanceSql += ' GROUP BY slr.attendance';
    const attendanceRows = await db.query(attendanceSql, attendanceParams);
    const attendanceStats = { present: 0, absent: 0, late: 0, excused: 0 };
    attendanceRows.forEach(row => { attendanceStats[row.attendance] = row.count; });
    const totalLessons = Object.values(attendanceStats).reduce((sum, n) => sum + n, 0);

    // 最新一筆課堂紀錄 (能力雷達與首頁翻轉卡皆取自同一筆最新紀錄)
    const latestRecord = await db.queryOne(`
      SELECT DATE_FORMAT(cl.log_date, '%Y-%m-%d') as log_date, slr.performance,
        slr.skill_programming, slr.skill_debugging, slr.skill_creativity,
        slr.skill_structure, slr.skill_teamwork
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      WHERE slr.student_id = ?
      ORDER BY cl.log_date DESC
      LIMIT 1
    `, [student.id]);

    // 能力雷達 (取最新一筆課堂紀錄的五項能力值，沒有紀錄則全部為 0)
    const skills = {
      programming: Number(latestRecord?.skill_programming) || 0,
      debugging: Number(latestRecord?.skill_debugging) || 0,
      creativity: Number(latestRecord?.skill_creativity) || 0,
      structure: Number(latestRecord?.skill_structure) || 0,
      teamwork: Number(latestRecord?.skill_teamwork) || 0
    };

    // 最近一筆課堂表現 (用於首頁翻轉卡)
    const recentRecord = latestRecord
      ? { log_date: latestRecord.log_date, performance: latestRecord.performance }
      : null;

    res.json({
      success: true,
      data: {
        student,
        points: {
          balance: balanceResult.balance,
          transactions: recentTransactions
        },
        skills,
        enrollment,
        courseHistory,
        attendance: {
          stats: attendanceStats,
          totalLessons
        },
        recentRecord
      }
    });
  } catch (error) {
    console.error('取得本人學生資料錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// 更新本人可編輯的個人資料 (聯絡方式)
exports.updateMe = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: '僅限學生角色使用此端點' });
    }

    const {
      email, phone, address,
      parent_name_father, parent_phone_father,
      parent_name_mother, parent_phone_mother
    } = req.body;

    await db.update('UPDATE users SET email = COALESCE(?, email), phone = COALESCE(?, phone) WHERE id = ?', [
      email ?? null, phone ?? null, req.user.id
    ]);

    // 註: students 表沒有通用的 parent_name/parent_phone/parent_email 欄位，
    // 家長資訊是父母分開存的 (parent_name_father/mother, parent_phone_father/mother)，
    // 也沒有 parent_email 欄位 (更新前這裡寫的是不存在的欄位，執行時會直接 SQL 報錯)
    await db.update(`
      UPDATE students SET
        address = COALESCE(?, address),
        parent_name_father = COALESCE(?, parent_name_father),
        parent_phone_father = COALESCE(?, parent_phone_father),
        parent_name_mother = COALESCE(?, parent_name_mother),
        parent_phone_mother = COALESCE(?, parent_phone_mother)
      WHERE user_id = ?
    `, [
      address ?? null,
      parent_name_father ?? null, parent_phone_father ?? null,
      parent_name_mother ?? null, parent_phone_mother ?? null,
      req.user.id
    ]);

    res.json({ success: true, message: '個人資料更新成功' });
  } catch (error) {
    console.error('更新本人學生資料錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// 取得本人課程紀錄 (學習成就 / 課程紀錄列表)
exports.getMyRecords = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: '僅限學生角色使用此端點' });
    }

    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const { course_type_id, start_date, end_date, search } = req.query;

    const studentId = await getSelfStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: '找不到學生資料' });
    }

    let filterSql = ' WHERE slr.student_id = ?';
    const filterParams = [studentId];

    if (course_type_id) {
      filterSql += ' AND c.course_type_id = ?';
      filterParams.push(course_type_id);
    }

    if (start_date && end_date) {
      filterSql += ' AND cl.log_date BETWEEN ? AND ?';
      filterParams.push(start_date, end_date);
    }

    if (search) {
      filterSql += ' AND (c.name LIKE ? OR cl.topic LIKE ? OR slr.notes LIKE ? OR slr.performance LIKE ?)';
      filterParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 註: LIMIT/OFFSET 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    // (mysql2 prepared statement 對 LIMIT/OFFSET 使用佔位符在部分版本會出錯)
    const records = await db.query(`
      SELECT
        slr.id, slr.attendance, slr.performance, slr.notes, slr.points_earned,
        slr.skill_programming, slr.skill_debugging, slr.skill_creativity,
        slr.skill_structure, slr.skill_teamwork,
        DATE_FORMAT(cl.log_date, '%Y-%m-%d') as log_date, cl.topic, c.name as course_name
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      ${filterSql}
      ORDER BY cl.log_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `, filterParams);

    for (const record of records) {
      record.photos = await db.query(
        'SELECT id, photo_url, caption FROM student_log_photos WHERE record_id = ?',
        [record.id]
      );
    }

    const countResult = await db.queryOne(`
      SELECT COUNT(*) as total
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      ${filterSql}
    `, filterParams);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });
  } catch (error) {
    console.error('取得本人課程紀錄錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// 取得本人能力趨勢 (依堂次列出五項能力分數，供趨勢圖使用)
exports.getMyTrend = async (req, res) => {
  try {
    if (req.user.role !== 'student') {
      return res.status(403).json({ success: false, message: '僅限學生角色使用此端點' });
    }

    const { weeks = 6, start_date, end_date } = req.query;

    const studentId = await getSelfStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: '找不到學生資料' });
    }

    let sql = `
      SELECT DATE_FORMAT(cl.log_date, '%Y-%m-%d') as log_date,
        slr.skill_programming, slr.skill_debugging, slr.skill_creativity,
        slr.skill_structure, slr.skill_teamwork
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      WHERE slr.student_id = ? AND slr.attendance != 'excused'
    `;
    const params = [studentId];

    if (start_date && end_date) {
      sql += ' AND cl.log_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    }

    // 註: LIMIT 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    const safeLimit = start_date && end_date ? 1000 : (Math.max(1, parseInt(weeks) || 6));
    sql += ` ORDER BY cl.log_date DESC LIMIT ${safeLimit}`;

    const rows = await db.query(sql, params);
    rows.reverse();

    res.json({
      success: true,
      data: {
        labels: rows.map(r => r.log_date),
        程式: rows.map(r => r.skill_programming),
        除錯: rows.map(r => r.skill_debugging),
        創意: rows.map(r => r.skill_creativity),
        結構: rows.map(r => r.skill_structure),
        團隊合作: rows.map(r => r.skill_teamwork)
      }
    });
  } catch (error) {
    console.error('取得本人能力趨勢錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
  }
};

// 取得課程類型列表
exports.getCourseTypes = async (req, res) => {
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
