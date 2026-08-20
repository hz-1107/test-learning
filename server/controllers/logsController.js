const db = require('../config/db');

// 確保資料表存在
let tablesChecked = false;
async function ensureTablesExist() {
  if (tablesChecked) return;

  try {
    // 檢查 course_logs 表是否存在
    const tableExists = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'course_logs'
    `);

    if (!tableExists || tableExists.count === 0) {
      console.log('創建 course_logs 表...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS course_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          course_id INT NOT NULL,
          schedule_id INT,
          log_date DATE NOT NULL,
          start_time TIME,
          end_time TIME,
          classroom_id INT,
          teacher_id INT NOT NULL,
          topic VARCHAR(255),
          content TEXT,
          outline JSON,
          status ENUM('pending', 'progress', 'completed') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
          FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
        )
      `);
    }

    // 檢查 student_log_records 表是否存在
    const studentRecordsExists = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'student_log_records'
    `);

    if (!studentRecordsExists || studentRecordsExists.count === 0) {
      console.log('創建 student_log_records 表...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS student_log_records (
          id INT AUTO_INCREMENT PRIMARY KEY,
          log_id INT NOT NULL,
          student_id INT NOT NULL,
          attendance ENUM('present', 'absent', 'late', 'leave', 'makeup') DEFAULT 'present',
          performance TEXT,
          notes TEXT,
          skill_programming INT DEFAULT 0,
          skill_debugging INT DEFAULT 0,
          skill_creativity INT DEFAULT 0,
          skill_structure INT DEFAULT 0,
          skill_teamwork INT DEFAULT 0,
          points_earned INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (log_id) REFERENCES course_logs(id) ON DELETE CASCADE,
          FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
          UNIQUE KEY unique_log_student (log_id, student_id)
        )
      `);
    }

    // 檢查 student_log_photos 表是否存在
    const photosExists = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'student_log_photos'
    `);

    if (!photosExists || photosExists.count === 0) {
      console.log('創建 student_log_photos 表...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS student_log_photos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          record_id INT NOT NULL,
          photo_url VARCHAR(500) NOT NULL,
          caption VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (record_id) REFERENCES student_log_records(id) ON DELETE CASCADE
        )
      `);
    }

    // 檢查 course_log_photos 表是否存在（課堂活動照片）
    const coursePhotosExists = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'course_log_photos'
    `);

    if (!coursePhotosExists || coursePhotosExists.count === 0) {
      console.log('創建 course_log_photos 表...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS course_log_photos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          log_id INT NOT NULL,
          photo_url VARCHAR(500) NOT NULL,
          file_name VARCHAR(255),
          file_size INT,
          caption VARCHAR(255),
          uploaded_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (log_id) REFERENCES course_logs(id) ON DELETE CASCADE,
          FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `);
    }

    // 檢查 log_permissions 表是否存在
    const permissionsExists = await db.queryOne(`
      SELECT COUNT(*) as count
      FROM information_schema.tables
      WHERE table_schema = DATABASE()
      AND table_name = 'log_permissions'
    `);

    if (!permissionsExists || permissionsExists.count === 0) {
      console.log('創建 log_permissions 表...');
      await db.query(`
        CREATE TABLE IF NOT EXISTS log_permissions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          log_id INT NOT NULL,
          teacher_id INT NOT NULL,
          granted_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (log_id) REFERENCES course_logs(id) ON DELETE CASCADE,
          FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE,
          UNIQUE KEY unique_log_teacher (log_id, teacher_id)
        )
      `);
    }

    tablesChecked = true;
    console.log('日誌相關資料表檢查完成');
  } catch (error) {
    console.error('檢查/創建日誌資料表錯誤:', error);
  }
}

// 取得教師的課程日誌狀態（依日期範圍）
exports.getMyLogsStatus = async (req, res) => {
  await ensureTablesExist();
  try {
    const { start_date, end_date } = req.query;
    const userId = req.user.id;

    // 取得教師ID
    const teacher = await db.queryOne(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (!teacher) {
      return res.status(403).json({
        success: false,
        message: '非教師帳號'
      });
    }

    const teacherId = teacher.id;

    // 取得教師的課程排程
    const schedules = await db.query(`
      SELECT
        cs.id as schedule_id,
        cs.course_id,
        c.name as course_name,
        cs.classroom_id,
        cr.name as classroom_name,
        cs.day_of_week,
        cs.start_time,
        cs.end_time
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE cs.teacher_id = ?
      ORDER BY cs.day_of_week, cs.start_time
    `, [teacherId]);

    if (!start_date || !end_date) {
      return res.json({
        success: true,
        data: {
          schedules: schedules.map(s => ({
            ...s,
            log_status: 'pending',
            expected_logs: 0,
            completed_logs: 0,
            in_progress_logs: 0
          }))
        }
      });
    }

    // 計算每個排程在日期範圍內的預期日誌數和實際狀態
    const schedulesWithStatus = await Promise.all(schedules.map(async (schedule) => {
      // 計算在日期範圍內該排程應該有多少堂課
      const expectedDates = getExpectedDates(start_date, end_date, schedule.day_of_week);
      const expectedLogs = expectedDates.length;

      // 查詢已存在的日誌
      const logs = await db.query(`
        SELECT id, log_date, status
        FROM course_logs
        WHERE schedule_id = ? AND log_date >= ? AND log_date <= ?
      `, [schedule.schedule_id, start_date, end_date]);

      const completedLogs = logs.filter(l => l.status === 'completed').length;
      const inProgressLogs = logs.filter(l => l.status === 'progress').length;
      const pendingLogs = logs.filter(l => l.status === 'pending').length;
      const totalExistingLogs = logs.length;

      // 決定整體狀態
      let overallStatus = 'pending';
      if (expectedLogs > 0) {
        if (completedLogs >= expectedLogs) {
          overallStatus = 'completed';
        } else if (completedLogs > 0 || inProgressLogs > 0 || pendingLogs > 0) {
          // 有任何日誌記錄（不論狀態）都算進行中
          overallStatus = 'in-progress';
        }
      }

      return {
        ...schedule,
        log_status: overallStatus,
        expected_logs: expectedLogs,
        completed_logs: completedLogs,
        in_progress_logs: inProgressLogs,
        logs: logs
      };
    }));

    res.json({
      success: true,
      data: {
        schedules: schedulesWithStatus
      }
    });
  } catch (error) {
    console.error('取得日誌狀態錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 輔助函數：計算日期範圍內的特定星期幾有多少天
function getExpectedDates(startDate, endDate, dayOfWeek) {
  const dates = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  const current = new Date(start);

  while (current <= end) {
    if (current.getDay() === dayOfWeek) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// 取得所有日誌
exports.getAll = async (req, res) => {
  await ensureTablesExist();
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

    sql += ' ORDER BY cl.log_date DESC, cl.start_time DESC LIMIT ? OFFSET ?';
    params.push(parseInt(limit), offset);

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

// 根據 schedule_id 和日期取得日誌
exports.getByScheduleAndDate = async (req, res) => {
  await ensureTablesExist();
  try {
    const { schedule_id, log_date } = req.query;

    if (!schedule_id || !log_date) {
      return res.status(400).json({
        success: false,
        message: '請提供 schedule_id 和 log_date'
      });
    }

    // 查找該排程和日期的日誌
    const log = await db.queryOne(`
      SELECT
        cl.*,
        c.name as course_name,
        ct.name as course_type,
        cr.name as classroom_name,
        u.name as teacher_name
      FROM course_logs cl
      JOIN courses c ON cl.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN classrooms cr ON cl.classroom_id = cr.id
      JOIN teachers t ON cl.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE cl.schedule_id = ? AND cl.log_date = ?
    `, [schedule_id, log_date]);

    if (!log) {
      return res.json({
        success: true,
        data: null,
        message: '尚無日誌記錄'
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
    `, [log.id]);

    // 取得每個學生的照片
    for (const record of studentRecords) {
      const photos = await db.query(
        'SELECT * FROM student_log_photos WHERE record_id = ?',
        [record.id]
      );
      record.photos = photos;
    }

    log.student_records = studentRecords;

    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    console.error('取得日誌錯誤:', error);
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
      skill_structure, skill_teamwork, points_earned,
      photo_url
    } = req.body;

    let recordId;

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
      recordId = existingRecord.id;
    } else {
      // 新增
      recordId = await db.insert(`
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

    // 如果有照片 URL，保存到 student_log_photos 表
    if (photo_url) {
      // 先刪除舊照片記錄（每個學生記錄只保留一張照片）
      await db.update('DELETE FROM student_log_photos WHERE record_id = ?', [recordId]);

      // 新增照片記錄
      await db.insert(`
        INSERT INTO student_log_photos (record_id, photo_url)
        VALUES (?, ?)
      `, [recordId, photo_url]);
    }

    // 如果有點數，新增點數交易記錄
    if (points_earned && points_earned > 0) {
      // 檢查是否已有該日誌的點數記錄，避免重複
      const existingTransaction = await db.queryOne(`
        SELECT id FROM point_transactions
        WHERE student_id = ? AND description LIKE ? AND DATE(created_at) = CURDATE()
      `, [student_id, `%日誌ID:${id}%`]);

      if (!existingTransaction) {
        await db.insert(`
          INSERT INTO point_transactions (
            student_id, amount, reason, description, operator_id
          ) VALUES (?, ?, '課堂表現', ?, ?)
        `, [student_id, points_earned, `日誌記錄獎勵 (日誌ID:${id})`, req.user.id]);
      }
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

// =====================
// 課堂活動照片管理
// =====================

// 取得日誌的所有照片
exports.getPhotos = async (req, res) => {
  try {
    const { id } = req.params;

    const photos = await db.query(`
      SELECT clp.*, u.name as uploaded_by_name
      FROM course_log_photos clp
      LEFT JOIN users u ON clp.uploaded_by = u.id
      WHERE clp.log_id = ?
      ORDER BY clp.created_at DESC
    `, [id]);

    res.json({
      success: true,
      data: photos
    });
  } catch (error) {
    console.error('取得日誌照片錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增照片記錄
exports.addPhoto = async (req, res) => {
  try {
    await ensureTablesExist();

    const { id } = req.params;
    const { photo_url, file_name, file_size, caption } = req.body;

    if (!photo_url) {
      return res.status(400).json({
        success: false,
        message: '請提供照片 URL'
      });
    }

    // 檢查日誌是否存在
    const log = await db.queryOne('SELECT id FROM course_logs WHERE id = ?', [id]);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '找不到日誌'
      });
    }

    const photoId = await db.insert(`
      INSERT INTO course_log_photos (log_id, photo_url, file_name, file_size, caption, uploaded_by)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [id, photo_url, file_name || null, file_size || null, caption || null, req.user.id]);

    res.status(201).json({
      success: true,
      message: '照片新增成功',
      data: { id: photoId }
    });
  } catch (error) {
    console.error('新增日誌照片錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 批量新增照片記錄
exports.addPhotos = async (req, res) => {
  try {
    await ensureTablesExist();

    const { id } = req.params;
    const { photos } = req.body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({
        success: false,
        message: '請提供照片列表'
      });
    }

    // 檢查日誌是否存在
    const log = await db.queryOne('SELECT id FROM course_logs WHERE id = ?', [id]);
    if (!log) {
      return res.status(404).json({
        success: false,
        message: '找不到日誌'
      });
    }

    const insertedIds = [];
    for (const photo of photos) {
      if (photo.photo_url) {
        const photoId = await db.insert(`
          INSERT INTO course_log_photos (log_id, photo_url, file_name, file_size, caption, uploaded_by)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [id, photo.photo_url, photo.file_name || null, photo.file_size || null, photo.caption || null, req.user.id]);
        insertedIds.push(photoId);
      }
    }

    res.status(201).json({
      success: true,
      message: `已新增 ${insertedIds.length} 張照片`,
      data: { ids: insertedIds }
    });
  } catch (error) {
    console.error('批量新增日誌照片錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新照片說明
exports.updatePhoto = async (req, res) => {
  try {
    const { id, photoId } = req.params;
    const { caption } = req.body;

    const photo = await db.queryOne(
      'SELECT id FROM course_log_photos WHERE id = ? AND log_id = ?',
      [photoId, id]
    );

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '找不到照片'
      });
    }

    await db.update(
      'UPDATE course_log_photos SET caption = ? WHERE id = ?',
      [caption || null, photoId]
    );

    res.json({
      success: true,
      message: '照片說明更新成功'
    });
  } catch (error) {
    console.error('更新日誌照片錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 刪除照片
exports.deletePhoto = async (req, res) => {
  try {
    const { id, photoId } = req.params;

    const photo = await db.queryOne(
      'SELECT id, photo_url FROM course_log_photos WHERE id = ? AND log_id = ?',
      [photoId, id]
    );

    if (!photo) {
      return res.status(404).json({
        success: false,
        message: '找不到照片'
      });
    }

    await db.update('DELETE FROM course_log_photos WHERE id = ?', [photoId]);

    res.json({
      success: true,
      message: '照片刪除成功',
      data: { deleted_url: photo.photo_url }
    });
  } catch (error) {
    console.error('刪除日誌照片錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
