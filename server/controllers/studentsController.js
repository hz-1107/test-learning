const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { generateUsername, birthdayPassword, syncBirthdayPassword, checkLoginConflict } = require('../utils/account');

// 「實際上過課」的出勤狀態（出席、補課；late 為舊資料）
const ATTENDED_SQL = "('present', 'late', 'makeup')";

// 同時在多個班級時（正常情況下一位學生只會在一個班級），目前課程的排序：
// 以「最近有上課紀錄」的課程為準，都沒上過課才取最近加入的。需搭配別名 ce / c 使用。
const CURRENT_COURSE_ORDER = `
  ORDER BY (
    SELECT MAX(cl2.log_date)
    FROM student_log_records slr2
    JOIN course_logs cl2 ON slr2.log_id = cl2.id
    WHERE slr2.student_id = ce.student_id AND cl2.course_id = c.id
      AND slr2.attendance IN ${ATTENDED_SQL}
  ) DESC, ce.enrolled_at DESC, ce.id DESC
`;

// 學生「目前班級」的報名紀錄 id（相依子查詢，studentRef 為外層的學生 id 欄位，如 's.id'）。
// 課程名稱、教室、授課老師、上課時間一律由目前班級帶出，行政端與教師端才會一致。
const currentEnrollmentIdSql = (studentRef) => `(
  SELECT ce.id
  FROM course_enrollments ce
  JOIN course_schedules cs ON ce.schedule_id = cs.id
  JOIN courses c ON cs.course_id = c.id
  WHERE ce.student_id = ${studentRef} AND ce.status = 'enrolled' AND cs.deleted_at IS NULL
  ${CURRENT_COURSE_ORDER}
  LIMIT 1
)`;

// 上課堂數：由日誌中的出席／補課紀錄即時計算，不另外累計
const lessonCountSql = (studentRef) => `(
  SELECT COUNT(*) FROM student_log_records slr
  WHERE slr.student_id = ${studentRef} AND slr.attendance IN ${ATTENDED_SQL}
)`;

// 學生上過課的課程（老師日誌中有出席或補課紀錄），最近上課的排前面。
// 歷史課程以此為準：加錯班級後被移除、從未上過課的課程不會列入；換班升階後自動留存。
async function getAttendedCourses(studentId) {
  return db.query(`
    SELECT c.id as course_id, c.name as course_name,
      DATE_FORMAT(MIN(cl.log_date), '%Y-%m-%d') as started_at,
      DATE_FORMAT(MAX(cl.log_date), '%Y-%m-%d') as last_date,
      COUNT(*) as lesson_count
    FROM student_log_records slr
    JOIN course_logs cl ON slr.log_id = cl.id
    JOIN courses c ON cl.course_id = c.id
    WHERE slr.student_id = ? AND slr.attendance IN ${ATTENDED_SQL}
    GROUP BY c.id, c.name
    ORDER BY MAX(cl.log_date) DESC
  `, [studentId]);
}

// 取得所有學生
exports.getAll = async (req, res) => {
  try {
    const { status, search, classroom_id, course_type_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 課程、教室、授課老師、上課時間以「目前班級」為準；尚未加入班級時才用學生資料上的設定
    const fromSql = `
      FROM students s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN course_enrollments cur ON cur.id = ${currentEnrollmentIdSql('s.id')}
      LEFT JOIN course_schedules ccs ON ccs.id = cur.schedule_id
      LEFT JOIN courses cc ON cc.id = ccs.course_id
      LEFT JOIN teachers t ON t.id = COALESCE(ccs.teacher_id, cc.teacher_id, s.teacher_id)
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN classrooms cr ON cr.id = COALESCE(ccs.classroom_id, s.classroom_id)
      LEFT JOIN course_types ct ON ct.id = COALESCE(cc.course_type_id, s.course_type_id)
      WHERE 1=1
    `;
    let whereSql = '';
    const params = [];

    if (status) {
      whereSql += ' AND s.status = ?';
      params.push(status);
    }

    if (search) {
      whereSql += ' AND (u.name LIKE ? OR s.student_code LIKE ? OR u.phone LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (classroom_id) {
      whereSql += ' AND cr.id = ?';
      params.push(classroom_id);
    }

    if (course_type_id) {
      whereSql += ' AND ct.id = ?';
      params.push(course_type_id);
    }

    // 計算總數
    const countResult = await db.query(`SELECT COUNT(*) as total ${fromSql}${whereSql}`, params);
    const total = countResult[0]?.total || 0;

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
        COALESCE(cc.name, ct.name) as course_name,
        ccs.id as current_schedule_id,
        ccs.start_time as class_start_time,
        ccs.end_time as class_end_time,
        ccs.day_of_week as class_day,
        ${lessonCountSql('s.id')} as lesson_count
      ${fromSql}${whereSql}
    `;

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

    // 取得學生的點數餘額 (使用 students.points_balance 欄位)
    student.total_points = student.points_balance || 0;

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

    // 目前班級：課程、教室、授課老師以此為準（與學生列表、教師端一致）
    const currentClass = await db.queryOne(`
      SELECT c.id as course_id, c.name as course_name,
        DATE_FORMAT(ce.enrolled_at, '%Y-%m-%d') as started_at,
        cs.id as schedule_id,
        t.id as teacher_id, tu.name as teacher_name,
        cr.id as classroom_id, cr.name as classroom_name,
        ct.id as course_type_id, ct.name as course_type_name
      FROM course_enrollments ce
      JOIN course_schedules cs ON ce.schedule_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON t.id = COALESCE(cs.teacher_id, c.teacher_id)
      LEFT JOIN users tu ON t.user_id = tu.id
      LEFT JOIN classrooms cr ON cr.id = cs.classroom_id
      LEFT JOIN course_types ct ON ct.id = c.course_type_id
      WHERE ce.student_id = ? AND ce.status = 'enrolled' AND cs.deleted_at IS NULL
      ${CURRENT_COURSE_ORDER}
      LIMIT 1
    `, [id]);

    student.current_schedule_id = currentClass ? currentClass.schedule_id : null;
    if (currentClass) {
      // 班級有設定的項目覆蓋學生資料上的設定；班級沒設定的（例如課程未分類）維持原值
      ['teacher', 'classroom', 'course_type'].forEach(key => {
        if (currentClass[`${key}_id`]) {
          student[`${key}_id`] = currentClass[`${key}_id`];
          student[`${key}_name`] = currentClass[`${key}_name`];
        }
      });
    }

    const lessonCount = await db.queryOne(`SELECT ${lessonCountSql('?')} as lesson_count`, [id]);
    student.lesson_count = lessonCount.lesson_count;

    const current = currentClass
      ? { course_id: currentClass.course_id, course_name: currentClass.course_name, started_at: currentClass.started_at }
      : null;

    // 歷史課程：以「實際上過課」為準
    const attended = await getAttendedCourses(id);

    student.current_course_name = current ? current.course_name : null;
    student.course_history = [
      ...(current ? [{ ...current, is_current: true }] : []),
      ...attended
        .filter(row => !current || row.course_id !== current.course_id)
        .map(row => ({ ...row, is_current: false }))
    ];

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

// 學生電子郵件（選填）：檢查格式與是否已被其他帳號使用。
// 回傳 { email }（未填為 null）或 { error }
async function checkStudentEmail(rawEmail, excludeUserId = null) {
  const email = String(rawEmail || '').trim() || null;
  if (!email) return { email: null };
  if (!email.includes('@')) return { error: '電子郵件格式不正確' };
  const owner = await db.queryOne(
    'SELECT id FROM users WHERE email = ? AND id <> ?',
    [email, excludeUserId || 0]
  );
  if (owner) return { error: '此電子郵件已被其他帳號使用' };
  return { email };
}

// 學生加入班級後，學生資料上的授課老師／教室／上課類別一併對齊該班級
// （班級沒設定的項目維持原值），避免兩處各存一份而不一致
async function syncStudentWithSchedule(studentId, scheduleId) {
  await db.update(`
    UPDATE students s
    JOIN course_schedules cs ON cs.id = ?
    JOIN courses c ON c.id = cs.course_id
    SET s.teacher_id = COALESCE(cs.teacher_id, c.teacher_id, s.teacher_id),
        s.classroom_id = COALESCE(cs.classroom_id, s.classroom_id),
        s.course_type_id = COALESCE(c.course_type_id, s.course_type_id)
    WHERE s.id = ?
  `, [scheduleId, studentId]);
}

// 性別僅接受 students.gender 的 ENUM 值，其餘（含未填寫）一律存 NULL
const normalizeGender = (gender) => (['male', 'female', 'other'].includes(gender) ? gender : null);

// 新增學生
exports.create = async (req, res) => {
  try {
    const {
      name, birthday, school, grade, enrollment_date,
      teacher_id, parent_name_father, parent_phone_father,
      parent_name_mother, parent_phone_mother,
      trial_teacher_id, trial_topic,
      classroom_id, course_type_id, schedule_id, gender, phone, email
    } = req.body;

    // 驗證必要欄位
    // 家長姓名／電話、學校、教室、上課類別皆為選填
    if (!name || !birthday || !enrollment_date) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位（姓名、生日、到班日期）'
      });
    }

    // 登入帳號為姓名，密碼為西元生日 (格式: YYYYMMDD)
    const emailCheck = await checkStudentEmail(email);
    if (emailCheck.error) {
      return res.status(400).json({ success: false, message: emailCheck.error });
    }

    const conflict = await checkLoginConflict(name, birthday);
    if (conflict) {
      return res.status(400).json({ success: false, message: conflict });
    }

    const username = await generateUsername(name);
    const hashedPassword = await bcrypt.hash(birthdayPassword(birthday), 10);

    // 建立使用者。users.phone 為「學生本人電話」，與家長電話（父／母）分開儲存，互不帶入
    const userId = await db.insert(
      'INSERT INTO users (username, password, name, phone, email, birthday, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hashedPassword, name.trim(), String(phone || '').trim() || null, emailCheck.email, birthday, 'student']
    );

    // 建立學生資料
    const studentId = await db.insert(`
      INSERT INTO students (
        user_id, birth_date, gender, school, grade, enrollment_date,
        teacher_id, parent_name_father, parent_phone_father,
        parent_name_mother, parent_phone_mother,
        trial_teacher_id, trial_topic,
        classroom_id, course_type_id, lesson_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      userId, birthday, normalizeGender(gender), school || null, grade || null, enrollment_date,
      teacher_id || null, parent_name_father || null, parent_phone_father || null,
      parent_name_mother || null, parent_phone_mother || null,
      trial_teacher_id || null, trial_topic || null,
      classroom_id || null, course_type_id || null, 0
    ]);

    // 如果有選擇班級，自動加入班級
    if (schedule_id) {
      const schedule = await db.queryOne('SELECT id, course_id FROM course_schedules WHERE id = ?', [schedule_id]);
      if (schedule) {
        await db.insert(
          'INSERT INTO course_enrollments (course_id, schedule_id, student_id, status) VALUES (?, ?, ?, ?)',
          [schedule.course_id, schedule_id, studentId, 'enrolled']
        );
        await syncStudentWithSchedule(studentId, schedule_id);
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
      classroom_id, course_type_id, schedule_id, status, gender, phone, email
    } = req.body;

    // 取得學生資料
    const student = await db.queryOne('SELECT user_id FROM students WHERE id = ?', [id]);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到學生'
      });
    }

    // 電子郵件（選填）：有帶此欄位才檢查與更新
    let emailCheck = null;
    if (email !== undefined) {
      emailCheck = await checkStudentEmail(email, student.user_id);
      if (emailCheck.error) {
        return res.status(400).json({ success: false, message: emailCheck.error });
      }
    }

    const conflict = await checkLoginConflict(name, birthday, student.user_id);
    if (conflict) {
      return res.status(400).json({ success: false, message: conflict });
    }

    // 更新使用者資料（生日有更動時，登入密碼同步更新）
    await syncBirthdayPassword(student.user_id, birthday);
    await db.update(
      'UPDATE users SET name = ?, birthday = ? WHERE id = ?',
      [name, birthday || null, student.user_id]
    );

    // users.phone 為「學生本人電話」，與家長電話分開儲存；
    // 有帶此欄位才更新，避免未送此欄位的表單把既有電話清空或以家長電話覆蓋
    if (phone !== undefined) {
      await db.update(
        'UPDATE users SET phone = ? WHERE id = ?',
        [String(phone || '').trim() || null, student.user_id]
      );
    }

    if (emailCheck) {
      await db.update('UPDATE users SET email = ? WHERE id = ?', [emailCheck.email, student.user_id]);
    }

    // 更新學生資料
    await db.update(`
      UPDATE students SET
        birth_date = ?, school = ?, grade = ?, enrollment_date = ?,
        teacher_id = ?, parent_name_father = ?, parent_phone_father = ?,
        parent_name_mother = ?, parent_phone_mother = ?,
        trial_teacher_id = ?, trial_topic = ?,
        classroom_id = ?, course_type_id = ?, status = IF(?, ?, status)
      WHERE id = ?
    `, [
      birthday || null, school || null, grade || null, enrollment_date || null,
      teacher_id || null, parent_name_father || null, parent_phone_father || null,
      parent_name_mother || null, parent_phone_mother || null,
      trial_teacher_id || null, trial_topic || null,
      classroom_id || null, course_type_id || null,
      // 未傳 status 時保留原值，避免其他表單把結業的學生改回在學
      status !== undefined, status || 'active', id
    ]);

    // 改為結業：結束目前的班級（從班級名單移除，歷史紀錄保留）
    const isLeaving = status !== undefined && status !== 'active';
    if (isLeaving) {
      await db.update(
        'UPDATE course_enrollments SET status = "completed" WHERE student_id = ? AND status = "enrolled"',
        [id]
      );
    }

    // 有帶性別欄位才更新，避免其他未送此欄位的表單把既有性別清空
    if (gender !== undefined) {
      await db.update('UPDATE students SET gender = ? WHERE id = ?', [normalizeGender(gender), id]);
    }

    // 如果有更新班級（結業的學生不再加入班級）
    if (schedule_id && !isLeaving) {
      const schedule = await db.queryOne('SELECT id, course_id FROM course_schedules WHERE id = ?', [schedule_id]);
      if (schedule) {
        // 一位學生同時只會在一個班級：換班時原班級的報名標記為已結束（歷史紀錄保留）
        await db.update(
          'UPDATE course_enrollments SET status = "completed" WHERE student_id = ? AND schedule_id <> ? AND status = "enrolled"',
          [id, schedule_id]
        );
        // 新增新的班級
        const existing = await db.queryOne(
          'SELECT id FROM course_enrollments WHERE schedule_id = ? AND student_id = ?',
          [schedule_id, id]
        );
        if (existing) {
          await db.update(
            'UPDATE course_enrollments SET status = "enrolled", course_id = ? WHERE id = ?',
            [schedule.course_id, existing.id]
          );
        } else {
          await db.insert(
            'INSERT INTO course_enrollments (course_id, schedule_id, student_id, status) VALUES (?, ?, ?, ?)',
            [schedule.course_id, schedule_id, id, 'enrolled']
          );
        }
        await syncStudentWithSchedule(id, schedule_id);
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

// 更新學生的個人／家長資訊（教師端「查看完整檔案」的編輯用）
// 只更新請求中有帶的欄位，且僅限個人與家長欄位，不會動到授課老師、教室、班級等設定
exports.updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const has = (key) => body[key] !== undefined;

    const student = await db.queryOne('SELECT user_id FROM students WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({ success: false, message: '找不到學生' });
    }

    // 與新增學生相同：姓名、生日為必填（學校為選填）
    const required = { name: '姓名', birthday: '生日' };
    for (const [key, label] of Object.entries(required)) {
      if (has(key) && !String(body[key] || '').trim()) {
        return res.status(400).json({ success: false, message: `請填寫${label}` });
      }
    }

    const userFields = {};
    const studentFields = {};

    if (has('name')) userFields.name = body.name.trim();
    if (has('birthday')) {
      userFields.birthday = body.birthday;
      studentFields.birth_date = body.birthday;
    }
    if (has('gender')) studentFields.gender = normalizeGender(body.gender);
    if (has('school')) studentFields.school = String(body.school || '').trim() || null;
    if (has('grade')) studentFields.grade = body.grade || null;
    if (has('parent_name_father')) studentFields.parent_name_father = body.parent_name_father || null;
    if (has('phone')) userFields.phone = body.phone || null;
    if (has('email')) {
      const email = String(body.email || '').trim() || null;
      if (email) {
        if (!email.includes('@')) {
          return res.status(400).json({ success: false, message: '電子郵件格式不正確' });
        }
        const emailOwner = await db.queryOne(
          'SELECT id FROM users WHERE email = ? AND id <> ?',
          [email, student.user_id]
        );
        if (emailOwner) {
          return res.status(400).json({ success: false, message: '此電子郵件已被其他帳號使用' });
        }
      }
      userFields.email = email;
    }
    if (has('parent_phone_father')) studentFields.parent_phone_father = body.parent_phone_father || null;
    if (has('parent_name_mother')) studentFields.parent_name_mother = body.parent_name_mother || null;
    if (has('parent_phone_mother')) studentFields.parent_phone_mother = body.parent_phone_mother || null;

    // 欄位名稱皆為上方寫死的白名單，可安全組進 SQL
    const updateTable = async (table, fields, rowId) => {
      const keys = Object.keys(fields);
      if (keys.length === 0) return;
      await db.update(
        `UPDATE ${table} SET ${keys.map(k => `${k} = ?`).join(', ')} WHERE id = ?`,
        [...keys.map(k => fields[k]), rowId]
      );
    };

    if (userFields.name !== undefined || userFields.birthday !== undefined) {
      const conflict = await checkLoginConflict(userFields.name, userFields.birthday, student.user_id);
      if (conflict) {
        return res.status(400).json({ success: false, message: conflict });
      }
    }

    // 生日有更動時，登入密碼同步更新
    await syncBirthdayPassword(student.user_id, userFields.birthday);
    await updateTable('users', userFields, student.user_id);
    await updateTable('students', studentFields, id);

    res.json({ success: true, message: '學生資料更新成功' });
  } catch (error) {
    console.error('更新學生個人資料錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
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

    // 取得學生的點數餘額 (使用 students.points_balance 欄位)
    const student = await db.queryOne('SELECT points_balance FROM students WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: '找不到學生'
      });
    }

    // 註: LIMIT/OFFSET 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    // (mysql2 prepared statement 對 LIMIT/OFFSET 使用佔位符在部分版本會出錯)
    const transactions = await db.query(`
      SELECT pt.*, u.name as operator_name
      FROM point_transactions pt
      LEFT JOIN users u ON pt.operator_id = u.id
      WHERE pt.student_id = ?
      ORDER BY pt.created_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `, [id]);

    res.json({
      success: true,
      data: {
        transactions,
        balance: student.points_balance || 0
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

// 取得指定學生的課程紀錄 (教職員用，例如教師端學生檔案彈窗的學習成就分頁)
exports.getStudentRecords = async (req, res) => {
  try {
    const { id } = req.params;
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;

    const student = await db.queryOne('SELECT id FROM students WHERE id = ?', [id]);
    if (!student) {
      return res.status(404).json({ success: false, message: '找不到學生' });
    }

    // 可指定 course_id 只看單一課程的紀錄（教師端依查看中的課程顯示）
    const courseId = parseInt(req.query.course_id) || null;
    const courseSql = courseId ? ' AND cl.course_id = ?' : '';
    const params = courseId ? [id, courseId] : [id];

    // 註: LIMIT/OFFSET 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    // (mysql2 prepared statement 對 LIMIT/OFFSET 使用佔位符在部分版本會出錯)
    const records = await db.query(`
      SELECT
        slr.id, slr.log_id, slr.attendance, slr.performance, slr.notes, slr.points_earned,
        slr.skill_programming, slr.skill_debugging, slr.skill_creativity,
        slr.skill_structure, slr.skill_teamwork,
        DATE_FORMAT(cl.log_date, '%Y-%m-%d') as log_date, cl.topic, cl.content,
        c.name as course_name, ct.name as course_type_name,
        u.name as teacher_name
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN teachers t ON cl.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE slr.student_id = ?${courseSql}
      ORDER BY cl.log_date DESC
      LIMIT ${limit} OFFSET ${offset}
    `, params);

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
      WHERE slr.student_id = ?${courseSql}
    `, params);

    res.json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total: countResult.total,
          totalPages: Math.ceil(countResult.total / limit)
        }
      }
    });
  } catch (error) {
    console.error('取得學生課程紀錄錯誤:', error);
    res.status(500).json({ success: false, message: '伺服器錯誤' });
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

    // 點數餘額與最近交易紀錄 (使用 students.points_balance 欄位)
    const pointsBalance = student.points_balance || 0;
    const recentTransactions = await db.query(
      'SELECT id, amount, reason, description, created_at FROM point_transactions WHERE student_id = ? ORDER BY created_at DESC LIMIT 20',
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
      ${CURRENT_COURSE_ORDER}
      LIMIT 1
    `, [student.id]);

    // 歷史課程：目前課程 + 實際上過課的過去課程（與教師端相同規則）
    const attendedCourses = await getAttendedCourses(student.id);
    const courseHistory = [
      ...(enrollment ? [{ course_id: enrollment.course_id, course_name: enrollment.course_name, status: 'enrolled' }] : []),
      ...attendedCourses
        .filter(row => !enrollment || row.course_id !== enrollment.course_id)
        .map(row => ({ course_id: row.course_id, course_name: row.course_name, status: 'completed' }))
    ];

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
    const attendanceStats = { present: 0, absent: 0, late: 0, leave: 0, excused: 0, makeup: 0, no_class: 0 };
    attendanceRows.forEach(row => { if (attendanceStats.hasOwnProperty(row.attendance)) attendanceStats[row.attendance] = Number(row.count); });
    const totalLessons = Object.values(attendanceStats).reduce((sum, n) => sum + n, 0);
    // 教師日誌的「請假」存為 absent（excused、leave 為舊資料），補課後改為 makeup：
    // 待補課 = 仍是請假狀態的堂數；請假 = 待補課 + 已補課
    const pendingMakeup = attendanceStats.absent + attendanceStats.excused + attendanceStats.leave;
    const leaveCount = pendingMakeup + attendanceStats.makeup;
    // 上課堂數與行政端學生列表一致（出席＋補課，跨所有課程）
    const lessonCountRow = await db.queryOne(`SELECT ${lessonCountSql('?')} as lesson_count`, [student.id]);
    const lessonCount = Number(lessonCountRow.lesson_count) || 0;

    // 最新一筆有能力數據的課堂紀錄 (用於能力雷達圖)
    // 過濾掉所有能力值都是 0 或 NULL 的紀錄
    const latestSkillRecord = await db.queryOne(`
      SELECT DATE_FORMAT(cl.log_date, '%Y-%m-%d') as log_date,
        slr.skill_programming, slr.skill_debugging, slr.skill_creativity,
        slr.skill_structure, slr.skill_teamwork
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      WHERE slr.student_id = ?
        AND (COALESCE(slr.skill_programming, 0) > 0
          OR COALESCE(slr.skill_debugging, 0) > 0
          OR COALESCE(slr.skill_creativity, 0) > 0
          OR COALESCE(slr.skill_structure, 0) > 0
          OR COALESCE(slr.skill_teamwork, 0) > 0)
      ORDER BY cl.log_date DESC
      LIMIT 1
    `, [student.id]);

    // 最新一筆課堂表現紀錄 (用於首頁翻轉卡，不論能力值是否為 0)
    const latestPerformanceRecord = await db.queryOne(`
      SELECT DATE_FORMAT(cl.log_date, '%Y-%m-%d') as log_date, slr.performance
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      WHERE slr.student_id = ?
        AND slr.performance IS NOT NULL
        AND slr.performance != ''
      ORDER BY cl.log_date DESC
      LIMIT 1
    `, [student.id]);

    // 能力雷達 (取最新一筆有數據的課堂紀錄，沒有紀錄則全部為 0)
    const skills = {
      programming: Number(latestSkillRecord?.skill_programming) || 0,
      debugging: Number(latestSkillRecord?.skill_debugging) || 0,
      creativity: Number(latestSkillRecord?.skill_creativity) || 0,
      structure: Number(latestSkillRecord?.skill_structure) || 0,
      teamwork: Number(latestSkillRecord?.skill_teamwork) || 0
    };

    // 能力評估更新時間：老師最新一次評分的課堂日期（尚未評分則為 null）
    const skillsUpdatedAt = latestSkillRecord?.log_date || null;

    // 最近一筆課堂表現 (用於首頁翻轉卡)
    const recentRecord = latestPerformanceRecord
      ? { log_date: latestPerformanceRecord.log_date, performance: latestPerformanceRecord.performance }
      : null;

    res.json({
      success: true,
      data: {
        student,
        points: {
          balance: pointsBalance,
          transactions: recentTransactions
        },
        skills,
        skillsUpdatedAt,
        enrollment,
        courseHistory,
        attendance: {
          stats: attendanceStats,
          totalLessons,
          lessonCount,
          leaveCount,
          pendingMakeup
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

    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit) || 10));
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const offset = (page - 1) * limit;
    const { course_type_id, start_date, end_date, search, record_id, log_id, attended } = req.query;

    const studentId = await getSelfStudentId(req.user.id);
    if (!studentId) {
      return res.status(404).json({ success: false, message: '找不到學生資料' });
    }

    let filterSql = ' WHERE slr.student_id = ?';
    const filterParams = [studentId];

    // 指定單筆紀錄（匯出頁使用，避免只在最近 N 筆裡找而找不到較舊的紀錄）
    if (record_id) {
      filterSql += ' AND slr.id = ?';
      filterParams.push(record_id);
    }
    if (log_id) {
      filterSql += ' AND slr.log_id = ?';
      filterParams.push(log_id);
    }

    // 只列出實際上過課（出席、補課）的紀錄，學習歷程不列入請假、未約課
    if (attended === '1' || attended === 'true') {
      filterSql += ` AND slr.attendance IN ${ATTENDED_SQL}`;
    }

    if (course_type_id) {
      filterSql += ' AND c.course_type_id = ?';
      filterParams.push(course_type_id);
    }

    if (start_date && end_date) {
      filterSql += ' AND cl.log_date BETWEEN ? AND ?';
      filterParams.push(start_date, end_date);
    }

    if (search) {
      filterSql += ' AND (c.name LIKE ? OR cl.topic LIKE ? OR slr.performance LIKE ?)';
      filterParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    // 註: LIMIT/OFFSET 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
    // (mysql2 prepared statement 對 LIMIT/OFFSET 使用佔位符在部分版本會出錯)
    // 備註 (slr.notes) 僅限教師/行政端查閱，不回傳給學生
    const records = await db.query(`
      SELECT
        slr.id, slr.log_id, slr.attendance, slr.performance, slr.points_earned,
        slr.skill_programming, slr.skill_debugging, slr.skill_creativity,
        slr.skill_structure, slr.skill_teamwork,
        DATE_FORMAT(cl.log_date, '%Y-%m-%d') as log_date, cl.topic, cl.content, cl.outline,
        cl.start_time, cl.end_time,
        c.name as course_name, ct.name as course_type_name,
        u.name as teacher_name
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN teachers t ON cl.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
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
      WHERE slr.student_id = ? AND slr.attendance IN ${ATTENDED_SQL}
        AND (COALESCE(slr.skill_programming, 0) > 0
          OR COALESCE(slr.skill_debugging, 0) > 0
          OR COALESCE(slr.skill_creativity, 0) > 0
          OR COALESCE(slr.skill_structure, 0) > 0
          OR COALESCE(slr.skill_teamwork, 0) > 0)
    `;
    const params = [studentId];

    // 只看單一課程（儀表板的課程下拉選單）
    const courseId = parseInt(req.query.course_id) || null;
    if (courseId) {
      sql += ' AND cl.course_id = ?';
      params.push(courseId);
    }

    if (start_date && end_date) {
      sql += ' AND cl.log_date BETWEEN ? AND ?';
      params.push(start_date, end_date);
    } else {
      // 「近 N 週」以日期區間計算（過去是取最近 N 筆，與按鈕文字不符）
      // 註: weeks 已用 parseInt 驗證為安全整數，故直接內嵌於 SQL 字串
      const safeWeeks = Math.min(104, Math.max(1, parseInt(weeks) || 6));
      sql += ` AND cl.log_date > DATE_SUB(CURDATE(), INTERVAL ${safeWeeks} WEEK) AND cl.log_date <= CURDATE()`;
    }

    sql += ' ORDER BY cl.log_date DESC';

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

// 取得學生平均技能分數
exports.getSkillAverages = async (req, res) => {
  try {
    const { id } = req.params;

    // 可指定 course_id 只看單一課程（教師端「歷史課程 → 查看」）
    const courseId = parseInt(req.query.course_id) || null;
    const courseSql = courseId ? ' AND cl.course_id = ?' : '';
    const params = courseId ? [id, courseId] : [id];

    // 取得該學生所有課堂的技能分數平均值
    const result = await db.queryOne(`
      SELECT
        ROUND(AVG(NULLIF(slr.skill_programming, 0)), 1) as avg_programming,
        ROUND(AVG(NULLIF(slr.skill_debugging, 0)), 1) as avg_debugging,
        ROUND(AVG(NULLIF(slr.skill_creativity, 0)), 1) as avg_creativity,
        ROUND(AVG(NULLIF(slr.skill_structure, 0)), 1) as avg_structure,
        ROUND(AVG(NULLIF(slr.skill_teamwork, 0)), 1) as avg_teamwork,
        COUNT(*) as total_records,
        COUNT(CASE WHEN slr.skill_programming > 0 OR slr.skill_debugging > 0 OR
                        slr.skill_creativity > 0 OR slr.skill_structure > 0 OR
                        slr.skill_teamwork > 0 THEN 1 END) as records_with_skills
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      WHERE slr.student_id = ?${courseSql}
    `, params);

    // 取得最近 10 堂課的技能分數（用於趨勢圖）
    const recentRecords = await db.query(`
      SELECT
        slr.skill_programming,
        slr.skill_debugging,
        slr.skill_creativity,
        slr.skill_structure,
        slr.skill_teamwork,
        cl.log_date,
        c.name as course_name
      FROM student_log_records slr
      JOIN course_logs cl ON slr.log_id = cl.id
      JOIN courses c ON cl.course_id = c.id
      WHERE slr.student_id = ?${courseSql}
        AND (slr.skill_programming > 0 OR slr.skill_debugging > 0 OR
             slr.skill_creativity > 0 OR slr.skill_structure > 0 OR
             slr.skill_teamwork > 0)
      ORDER BY cl.log_date DESC
      LIMIT 10
    `, params);

    res.json({
      success: true,
      data: {
        averages: {
          programming: result.avg_programming || 0,
          debugging: result.avg_debugging || 0,
          creativity: result.avg_creativity || 0,
          structure: result.avg_structure || 0,
          teamwork: result.avg_teamwork || 0
        },
        total_records: result.total_records || 0,
        records_with_skills: result.records_with_skills || 0,
        recent_records: recentRecords.reverse() // 按日期正序
      }
    });
  } catch (error) {
    console.error('取得學生技能平均分數錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
