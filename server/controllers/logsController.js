const db = require('../config/db');
const { listScheduleLogs, groupLogsBySchedule, loadCalendar } = require('../utils/expectedLogs');

// 以「當地時區」格式化日期字串（YYYY-MM-DD）。
// 不可用 date.toISOString().split('T')[0]：toISOString() 會先轉成 UTC，
// 在台灣時區（UTC+8）的凌晨 00:00-07:59 執行時會誤算成前一天。
function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// =====================
// 自動建立日誌記錄
// =====================

// 自動建立日誌時要用到的排程欄位
const AUTO_CREATE_SCHEDULES_SQL = `
  SELECT
    cs.id as schedule_id,
    cs.course_id,
    cs.teacher_id,
    cs.classroom_id,
    cs.day_of_week,
    cs.start_time,
    cs.end_time,
    cs.start_date,
    cs.created_at,
    c.name as course_name
  FROM course_schedules cs
  JOIN courses c ON cs.course_id = c.id
  WHERE cs.is_active = 1 AND c.status = 'active'
    AND cs.deleted_at IS NULL
    AND cs.teacher_id IS NOT NULL
`;

/**
 * 為排程補建所有缺少的待填寫日誌
 * 範圍為開課日期起至今天（規則見 utils/expectedLogs），今天的課需已開始才建立
 * 回傳建立的筆數
 */
async function createMissingLogs(schedules) {
  if (schedules.length === 0) return 0;

  const now = new Date();
  const today = formatLocalDate(now);
  const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

  const logs = await db.query(
    'SELECT schedule_id, log_date, status FROM course_logs WHERE schedule_id IN (?)',
    [schedules.map(s => s.schedule_id)]
  );
  const logsBySchedule = groupLogsBySchedule(logs);
  const calendar = await loadCalendar();

  let createdCount = 0;

  for (const schedule of schedules) {
    const entries = listScheduleLogs(schedule, logsBySchedule.get(schedule.schedule_id) || new Map(), { calendar });

    for (const { log_date: logDate, log } of entries) {
      if (log) continue;
      // 今天的課尚未開始則不建立
      if (logDate === today && !(schedule.start_time && currentTime >= schedule.start_time)) continue;

      await db.insert(`
        INSERT INTO course_logs (
          course_id, schedule_id, log_date, start_time, end_time,
          classroom_id, teacher_id, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        schedule.course_id,
        schedule.schedule_id,
        logDate,
        schedule.start_time,
        schedule.end_time,
        schedule.classroom_id,
        schedule.teacher_id
      ]);

      createdCount++;
      console.log(`  ✓ 自動建立日誌: ${schedule.course_name} (${logDate})`);
    }
  }

  return createdCount;
}

// 自動為已開始的課程建立待填寫日誌
exports.autoCreatePendingLogs = async () => {
  try {
    console.log(`[${new Date().toISOString()}] 執行自動建立日誌檢查...`);

    // 取得所有啟用中且有指定教師的課程排程
    const schedules = await db.query(AUTO_CREATE_SCHEDULES_SQL);
    const createdCount = await createMissingLogs(schedules);

    if (createdCount > 0) {
      console.log(`[自動建立日誌] 共建立 ${createdCount} 筆待填寫日誌`);
    } else {
      console.log(`[自動建立日誌] 無需建立新日誌`);
    }

    return { success: true, created: createdCount };
  } catch (error) {
    console.error('[自動建立日誌] 錯誤:', error);
    return { success: false, error: error.message };
  }
};

// 手動觸發自動建立日誌的 API（行政端用，建立所有教師的日誌）
exports.triggerAutoCreate = async (req, res) => {
  try {
    const result = await exports.autoCreatePendingLogs();
    res.json({
      success: true,
      message: `已自動建立 ${result.created} 筆待填寫日誌`,
      data: result
    });
  } catch (error) {
    console.error('手動觸發自動建立日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 為當前登入教師自動建立日誌的 API（教師端用）
exports.autoCreateMyLogs = async (req, res) => {
  try {
    const userId = req.user.id;

    // 取得該使用者對應的教師 ID
    const teacher = await db.queryOne(
      'SELECT id FROM teachers WHERE user_id = ?',
      [userId]
    );

    if (!teacher) {
      return res.json({ success: true, message: '非教師身分', created: 0 });
    }

    // 取得該教師的課程排程
    const schedules = await db.query(AUTO_CREATE_SCHEDULES_SQL + ' AND cs.teacher_id = ?', [teacher.id]);
    const createdCount = await createMissingLogs(schedules);

    res.json({
      success: true,
      message: createdCount > 0 ? `已建立 ${createdCount} 筆日誌` : '無需建立新日誌',
      created: createdCount
    });
  } catch (error) {
    console.error('自動建立教師日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

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
          outline TEXT,
          status ENUM('pending', 'in_progress', 'completed') DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
          FOREIGN KEY (classroom_id) REFERENCES classrooms(id) ON DELETE SET NULL,
          FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
        )
      `);
    } else {
      // 資料表已存在，檢查是否缺少 topic 和 outline 欄位
      const topicColumn = await db.queryOne(`
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'course_logs'
        AND column_name = 'topic'
      `);

      if (!topicColumn || topicColumn.count === 0) {
        console.log('新增 course_logs.topic 欄位...');
        await db.query(`ALTER TABLE course_logs ADD COLUMN topic VARCHAR(255) AFTER teacher_id`);
      }

      const outlineColumn = await db.queryOne(`
        SELECT COUNT(*) as count
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        AND table_name = 'course_logs'
        AND column_name = 'outline'
      `);

      if (!outlineColumn || outlineColumn.count === 0) {
        console.log('新增 course_logs.outline 欄位...');
        await db.query(`ALTER TABLE course_logs ADD COLUMN outline TEXT AFTER content`);
      }
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

    tablesChecked = true;
    console.log('日誌相關資料表檢查完成');
  } catch (error) {
    console.error('檢查/創建日誌資料表錯誤:', error);
  }
}

// 取得當前教師未完成的日誌（教師端首頁用）
// 與行政端「老師管理」未完成數、「日誌管理」列表共用 utils/expectedLogs 的規則：
// 自開課日期起至今天，每一堂課沒有日誌或日誌尚未完成都算一則未完成
exports.getMyIncompleteLogs = async (req, res) => {
  try {
    const teacher = await db.queryOne('SELECT id FROM teachers WHERE user_id = ?', [req.user.id]);
    if (!teacher) {
      return res.json({ success: true, data: { logs: [], total: 0, in_progress: 0 } });
    }

    const schedules = await db.query(`
      SELECT
        cs.id as schedule_id,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.start_date,
        cs.created_at,
        c.name as course_name
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      WHERE cs.is_active = 1 AND c.status = 'active' AND cs.deleted_at IS NULL AND cs.teacher_id = ?
    `, [teacher.id]);

    const logs = schedules.length > 0
      ? await db.query(
        'SELECT id, schedule_id, log_date, status FROM course_logs WHERE schedule_id IN (?)',
        [schedules.map(s => s.schedule_id)]
      )
      : [];
    const logsBySchedule = groupLogsBySchedule(logs);
    const calendar = await loadCalendar();

    const incomplete = [];
    for (const schedule of schedules) {
      const entries = listScheduleLogs(schedule, logsBySchedule.get(schedule.schedule_id) || new Map(), { calendar });
      for (const { log_date: logDate, log } of entries) {
        if (log && log.status === 'completed') continue;
        incomplete.push({
          schedule_id: schedule.schedule_id,
          course_name: schedule.course_name,
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          log_date: logDate,
          log_id: log ? log.id : null,
          status: log ? log.status : 'not_filled'
        });
      }
    }

    // 依日期、時間由近到遠排序
    incomplete.sort((a, b) =>
      b.log_date.localeCompare(a.log_date) || (b.start_time || '').localeCompare(a.start_time || '')
    );

    res.json({
      success: true,
      data: {
        logs: incomplete,
        total: incomplete.length,
        in_progress: incomplete.filter(l => l.status === 'in_progress' || l.status === 'progress').length
      }
    });
  } catch (error) {
    console.error('取得未完成日誌錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得教師的課程日誌狀態（依日期範圍）
exports.getMyLogsStatus = async (req, res) => {
  await ensureTablesExist();
  try {
    const { start_date, end_date, all } = req.query;
    const userId = req.user.id;

    // 取得教師ID（用於驗證權限）
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

    // 根據 all 參數決定是否取得所有教師的排程
    const fetchAll = all === 'true' || all === '1';

    // 取得課程排程
    let schedulesSql = `
      SELECT
        cs.id as schedule_id,
        cs.course_id,
        c.name as course_name,
        cs.classroom_id,
        cr.name as classroom_name,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.start_date,
        cs.created_at,
        cs.teacher_id,
        u.name as teacher_name
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      JOIN teachers t ON cs.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE cs.is_active = 1 AND c.status = 'active' AND cs.deleted_at IS NULL
    `;
    const scheduleParams = [];

    if (!fetchAll) {
      schedulesSql += ' AND cs.teacher_id = ?';
      scheduleParams.push(teacher.id);
    }

    schedulesSql += ' ORDER BY u.name, cs.day_of_week, cs.start_time';

    const schedules = await db.query(schedulesSql, scheduleParams);

    // 依課表推算每一堂課並合併既有日誌（規則見 utils/expectedLogs，與首頁、行政端共用）
    // 未指定起始日則從各班開課日起算；結束日不超過今天，今天的課開始後才列入
    const logs = schedules.length > 0
      ? await db.query(
        'SELECT id, schedule_id, log_date, status FROM course_logs WHERE schedule_id IN (?)',
        [schedules.map(s => s.schedule_id)]
      )
      : [];
    const logsBySchedule = groupLogsBySchedule(logs);
    const calendar = await loadCalendar();

    const schedulesWithStatus = schedules.map(schedule => {
      const entries = listScheduleLogs(schedule, logsBySchedule.get(schedule.schedule_id) || new Map(), {
        from: start_date || undefined,
        to: end_date || undefined,
        calendar
      });
      const dates = entries.map(({ log_date: logDate, log }) => ({
        log_date: logDate,
        log_id: log ? log.id : null,
        status: log ? log.status : 'pending'
      }));

      const completedLogs = dates.filter(d => d.status === 'completed').length;
      const inProgressLogs = dates.filter(d => d.status === 'in_progress' || d.status === 'progress').length;

      // 決定整體狀態
      let overallStatus = 'pending';
      if (dates.length > 0 && completedLogs === dates.length) {
        overallStatus = 'completed';
      } else if (completedLogs > 0 || inProgressLogs > 0) {
        overallStatus = 'in-progress';
      }

      return {
        ...schedule,
        log_status: overallStatus,
        expected_logs: dates.length,
        completed_logs: completedLogs,
        in_progress_logs: inProgressLogs,
        // 每一堂課及其日誌狀態（status: pending / in_progress / completed）
        dates
      };
    });

    res.json({
      success: true,
      data: {
        // 登入教師的 ID，前端用來把自己的日誌排在最上面
        teacher_id: teacher.id,
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

// 取得特定班級的上課日期列表（含日誌狀態）
exports.getScheduleDates = async (req, res) => {
  await ensureTablesExist();
  try {
    const { schedule_id, start_date, end_date } = req.query;

    if (!schedule_id) {
      return res.status(400).json({
        success: false,
        message: '缺少 schedule_id 參數'
      });
    }

    // 取得排程資訊
    const schedule = await db.queryOne(`
      SELECT
        cs.id as schedule_id,
        cs.course_id,
        c.name as course_name,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.start_date,
        cs.created_at,
        cs.classroom_id,
        cr.name as classroom_name,
        cs.teacher_id
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      WHERE cs.id = ? AND cs.is_active = 1 AND cs.deleted_at IS NULL
    `, [schedule_id]);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到該排程'
      });
    }

    // 依課表推算每一堂課並合併既有日誌（規則見 utils/expectedLogs，與首頁、行政端共用）
    // 未指定起始日則從開課日起算；結束日不超過今天，今天的課開始後才列入
    const logs = await db.query(
      'SELECT id, schedule_id, log_date, topic, status, created_at, updated_at FROM course_logs WHERE schedule_id = ?',
      [schedule_id]
    );
    const entries = listScheduleLogs(schedule, groupLogsBySchedule(logs).get(schedule.schedule_id) || new Map(), {
      from: start_date || undefined,
      to: end_date || undefined,
      calendar: await loadCalendar()
    });

    // 組合日期列表（依日期降序）
    const dateList = entries.map(({ log_date: logDate, log }) => ({
      date: logDate,
      day_of_week: schedule.day_of_week,
      is_past: true,
      has_log: !!log,
      log_id: log ? log.id : null,
      log_status: log ? log.status : 'pending',
      topic: log ? log.topic : null
    })).reverse();

    res.json({
      success: true,
      data: {
        schedule,
        dates: dateList,
        total_dates: dateList.length,
        completed_count: dateList.filter(d => d.log_status === 'completed').length,
        in_progress_count: dateList.filter(d => d.log_status === 'in_progress' || d.log_status === 'progress').length,
        pending_count: dateList.filter(d => d.log_status === 'pending').length
      }
    });
  } catch (error) {
    console.error('取得上課日期列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 取得所有日誌（包含未填寫的排程）
exports.getAll = async (req, res) => {
  await ensureTablesExist();
  try {
    const { start_date, end_date, log_date, teacher_id, course_id, classroom_id, status, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    // 設定日期範圍：未指定起始日則從各班開課日起算（與老師管理的未完成日誌數一致）
    const startDateStr = log_date || start_date || null;
    const endDateStr = log_date || end_date || formatLocalDate(new Date());

    // 步驟1: 取得所有啟用中的排程
    let schedulesSql = `
      SELECT
        cs.id as schedule_id,
        cs.course_id,
        cs.teacher_id,
        cs.classroom_id,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.start_date,
        cs.created_at,
        c.name as course_name,
        ct.name as course_type,
        cr.name as classroom_name,
        u.name as teacher_name
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      JOIN teachers t ON cs.teacher_id = t.id
      JOIN users u ON t.user_id = u.id
      WHERE cs.is_active = 1 AND c.status = 'active' AND cs.deleted_at IS NULL
    `;
    const scheduleParams = [];

    if (teacher_id) {
      schedulesSql += ' AND cs.teacher_id = ?';
      scheduleParams.push(teacher_id);
    }
    if (course_id) {
      schedulesSql += ' AND cs.course_id = ?';
      scheduleParams.push(course_id);
    }
    if (classroom_id) {
      schedulesSql += ' AND cs.classroom_id = ?';
      scheduleParams.push(classroom_id);
    }

    const schedules = await db.query(schedulesSql, scheduleParams);

    // 步驟2: 取得這些排程已存在的日誌
    // 以排程比對（不以日誌的 teacher_id 篩選），換過老師的班級也能對上原本的日誌
    const scheduleIds = schedules.map(s => s.schedule_id);
    const logsSql = `
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
      LEFT JOIN teachers t ON cl.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      WHERE cl.schedule_id IN (?) AND cl.log_date <= ?
    `;
    const existingLogs = scheduleIds.length > 0
      ? await db.query(logsSql, [scheduleIds, endDateStr])
      : [];
    const logsBySchedule = groupLogsBySchedule(existingLogs);

    // 步驟3: 依課表推算每一堂課並合併既有日誌（規則見 utils/expectedLogs）
    // 沒有日誌記錄的課堂（尚未自動建立）一律列為「待填寫」，與已建立的空白日誌視為同一狀態
    const combinedLogs = [];
    const calendar = await loadCalendar();

    for (const schedule of schedules) {
      const entries = listScheduleLogs(schedule, logsBySchedule.get(schedule.schedule_id) || new Map(), {
        from: startDateStr,
        to: endDateStr,
        calendar
      });

      for (const { log_date: logDate, log: existingLog } of entries) {
        if (existingLog) {
          // 有日誌記錄
          combinedLogs.push({
            ...existingLog,
            log_date: logDate,
            has_log: true
          });
        } else {
          // 尚未建立日誌記錄，狀態同樣視為待填寫
          combinedLogs.push({
            id: null,
            schedule_id: schedule.schedule_id,
            course_id: schedule.course_id,
            teacher_id: schedule.teacher_id,
            classroom_id: schedule.classroom_id,
            course_name: schedule.course_name,
            course_type: schedule.course_type,
            classroom_name: schedule.classroom_name,
            teacher_name: schedule.teacher_name,
            start_time: schedule.start_time,
            end_time: schedule.end_time,
            log_date: logDate,
            status: 'pending',
            topic: null,
            content: null,
            has_log: false
          });
        }
      }
    }

    // 步驟6: 依狀態篩選
    let filteredLogs = combinedLogs;
    if (status) {
      if (status === 'pending' || status === 'not_filled') {
        // 待填寫：狀態為 pending（含尚未建立日誌記錄的課堂）
        filteredLogs = combinedLogs.filter(log => log.status === 'pending');
      } else if (status === 'progress' || status === 'in_progress') {
        // 填寫中
        filteredLogs = combinedLogs.filter(log => log.status === 'progress' || log.status === 'in_progress');
      } else if (status === 'completed') {
        // 已完成
        filteredLogs = combinedLogs.filter(log => log.status === 'completed');
      } else if (status === 'incomplete') {
        // 未完成：待填寫＋填寫中（與老師管理的未完成日誌數一致）
        filteredLogs = combinedLogs.filter(log => log.status !== 'completed');
      }
    }

    // 步驟7: 排序（依日期降序、時間降序）
    filteredLogs.sort((a, b) => {
      const dateCompare = new Date(b.log_date) - new Date(a.log_date);
      if (dateCompare !== 0) return dateCompare;
      // 比較時間
      const timeA = a.start_time || '00:00:00';
      const timeB = b.start_time || '00:00:00';
      return timeB.localeCompare(timeA);
    });

    // 步驟8: 分頁
    const total = filteredLogs.length;
    const paginatedLogs = filteredLogs.slice(offset, offset + parseInt(limit));

    res.json({
      success: true,
      data: {
        logs: paginatedLogs,
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
        'SELECT * FROM student_log_photos WHERE record_id = ? ORDER BY id',
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

// 學生本人在指定日誌中的紀錄（學生帳號存取日誌時用來確認權限）
async function findOwnLogRecord(userId, logId) {
  return db.queryOne(`
    SELECT slr.*
    FROM student_log_records slr
    JOIN students s ON slr.student_id = s.id
    WHERE s.user_id = ? AND slr.log_id = ?
  `, [userId, logId]);
}

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

    // 學生只能查看自己有上課紀錄的日誌，且只回傳本人的紀錄（不含同學資料與教師備註）
    if (req.user.role === 'student') {
      const ownRecord = await findOwnLogRecord(req.user.id, id);
      if (!ownRecord) {
        return res.status(403).json({ success: false, message: '無權限查看此日誌' });
      }
      delete ownRecord.notes;
      ownRecord.photos = await db.query(
        'SELECT * FROM student_log_photos WHERE record_id = ? ORDER BY id',
        [ownRecord.id]
      );
      log.student_records = [ownRecord];
      return res.json({ success: true, data: log });
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
        'SELECT * FROM student_log_photos WHERE record_id = ? ORDER BY id',
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

    // 檢查是否已存在相同 schedule_id 和 log_date 的日誌
    let existingLog = null;
    if (schedule_id) {
      existingLog = await db.queryOne(
        'SELECT id FROM course_logs WHERE schedule_id = ? AND log_date = ?',
        [schedule_id, log_date]
      );
    }

    let logId;

    if (existingLog) {
      // 更新現有日誌
      await db.update(`
        UPDATE course_logs SET
          topic = ?, content = ?, outline = ?,
          start_time = ?, end_time = ?, classroom_id = ?
        WHERE id = ?
      `, [
        topic || null, content || null,
        outline || null,
        start_time || null, end_time || null, classroom_id || null,
        existingLog.id
      ]);
      logId = existingLog.id;

      res.json({
        success: true,
        message: '日誌更新成功',
        data: { id: logId, updated: true }
      });
    } else {
      // 建立新日誌
      logId = await db.insert(`
        INSERT INTO course_logs (
          course_id, schedule_id, log_date, start_time, end_time,
          classroom_id, teacher_id, topic, content, outline, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `, [
        course_id, schedule_id || null, log_date, start_time || null,
        end_time || null, classroom_id || null, teacher_id,
        topic || null, content || null, outline || null
      ]);

      res.status(201).json({
        success: true,
        message: '日誌建立成功',
        data: { id: logId, updated: false }
      });
    }
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

    // 動態建立 UPDATE 語句，只更新有提供的欄位
    const updates = [];
    const params = [];

    if (topic !== undefined) {
      updates.push('topic = ?');
      params.push(topic || null);
    }
    if (content !== undefined) {
      updates.push('content = ?');
      params.push(content || null);
    }
    if (outline !== undefined) {
      updates.push('outline = ?');
      params.push(outline || null);
    }
    if (status !== undefined) {
      updates.push('status = ?');
      params.push(status);
    }

    if (updates.length === 0) {
      return res.json({
        success: true,
        message: '沒有需要更新的欄位'
      });
    }

    params.push(id);
    await db.update(`UPDATE course_logs SET ${updates.join(', ')} WHERE id = ?`, params);

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

// 每位學生每篇日誌最多可上傳的照片數
const MAX_STUDENT_LOG_PHOTOS = 2;

// 新增/更新學生日誌記錄
exports.updateStudentRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const { student_id } = req.params;
    const {
      attendance, performance, notes,
      skill_programming, skill_debugging, skill_creativity,
      skill_structure, skill_teamwork, points_earned,
      photo_url, photo_urls
    } = req.body;

    if (points_earned !== undefined && points_earned !== null && (points_earned < 0 || points_earned > 7)) {
      return res.status(400).json({
        success: false,
        message: '給予點數需介於 0 至 7 之間'
      });
    }

    let recordId;
    const newAttendance = attendance || 'present';
    // 上課堂數計算規則：出席、補課（遲到為舊資料）算有上到課；缺席、未約課不算
    // 需與 studentsController 的 ATTENDED_SQL 一致
    const ATTENDED_STATUSES = ['present', 'late', 'makeup'];
    const newAttended = ATTENDED_STATUSES.includes(newAttendance);

    // 檢查是否已有記錄
    const existingRecord = await db.queryOne(
      'SELECT id, attendance FROM student_log_records WHERE log_id = ? AND student_id = ?',
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
        newAttendance, performance || null, notes || null,
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
        id, student_id, newAttendance, performance || null, notes || null,
        skill_programming || 0, skill_debugging || 0, skill_creativity || 0,
        skill_structure || 0, skill_teamwork || 0, points_earned || 0
      ]);
    }

    // 出缺席狀態變更時，同步更新學生的上課堂數
    const oldAttended = existingRecord ? ATTENDED_STATUSES.includes(existingRecord.attendance) : false;
    if (newAttended !== oldAttended) {
      await db.update(
        'UPDATE students SET lesson_count = GREATEST(0, COALESCE(lesson_count, 0) + ?) WHERE id = ?',
        [newAttended ? 1 : -1, student_id]
      );
    }

    // 照片：photo_urls（陣列，每位學生最多 2 張）會整批取代既有照片；
    // 未提供 photo_urls 時沿用舊的單張 photo_url 行為
    if (Array.isArray(photo_urls)) {
      const urls = photo_urls
        .filter(u => typeof u === 'string' && u.trim())
        .slice(0, MAX_STUDENT_LOG_PHOTOS);

      await db.update('DELETE FROM student_log_photos WHERE record_id = ?', [recordId]);
      for (const url of urls) {
        await db.insert(`
          INSERT INTO student_log_photos (record_id, photo_url)
          VALUES (?, ?)
        `, [recordId, url]);
      }
    } else if (photo_url) {
      // 先刪除舊照片記錄（每個學生記錄只保留一張照片）
      await db.update('DELETE FROM student_log_photos WHERE record_id = ?', [recordId]);

      // 新增照片記錄
      await db.insert(`
        INSERT INTO student_log_photos (record_id, photo_url)
        VALUES (?, ?)
      `, [recordId, photo_url]);
    }

    // 如果有點數，新增或更新點數交易記錄
    if (points_earned !== undefined) {
      // 檢查是否已有該日誌+學生的點數記錄
      const existingTransaction = await db.queryOne(`
        SELECT id, amount FROM point_transactions
        WHERE student_id = ? AND reference_type = 'log' AND reference_id = ?
      `, [student_id, id]);

      if (existingTransaction) {
        // 已有記錄，檢查點數是否有變化
        const oldAmount = existingTransaction.amount || 0;
        const newAmount = points_earned || 0;
        const diff = newAmount - oldAmount;

        if (diff !== 0) {
          // 點數有變化，更新交易記錄
          await db.update(`
            UPDATE point_transactions SET amount = ?, updated_at = NOW()
            WHERE id = ?
          `, [newAmount, existingTransaction.id]);

          // 更新學生點數餘額（加上差額）
          await db.update(`
            UPDATE students SET points_balance = COALESCE(points_balance, 0) + ?
            WHERE id = ?
          `, [diff, student_id]);
        }
        // 點數沒變化則不做任何事
      } else if (points_earned > 0) {
        // 沒有記錄且點數大於0，新增記錄
        await db.insert(`
          INSERT INTO point_transactions (
            student_id, amount, reason, description, operator_id, reference_type, reference_id
          ) VALUES (?, ?, '課堂表現', ?, ?, 'log', ?)
        `, [student_id, points_earned, `日誌記錄獎勵 (日誌ID:${id})`, req.user.id, id]);

        // 更新學生點數餘額
        await db.update(`
          UPDATE students SET points_balance = COALESCE(points_balance, 0) + ?
          WHERE id = ?
        `, [points_earned, student_id]);
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

    if (req.user.role === 'student' && !(await findOwnLogRecord(req.user.id, id))) {
      return res.status(403).json({ success: false, message: '無權限查看此日誌' });
    }

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
