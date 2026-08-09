const db = require('../config/db');

/**
 * 取得指定日期範圍的課表資料（含調課處理）
 */
exports.getWeeklySchedule = async (req, res) => {
  try {
    const { date, teacher_id, classroom_id } = req.query;

    // 計算週的開始和結束日期
    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.getDay(); // 0=週日, 1=週一...
    const startOfWeek = new Date(targetDate);
    startOfWeek.setDate(targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1)); // 週一開始
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // 格式化日期
    const formatDate = (d) => d.toISOString().split('T')[0];
    const weekStart = formatDate(startOfWeek);
    const weekEnd = formatDate(endOfWeek);

    // 取得基礎課表
    let scheduleSql = `
      SELECT
        cs.id as schedule_id,
        cs.course_id,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.classroom_id,
        c.name as course_name,
        c.teacher_id,
        u.name as teacher_name,
        cr.name as classroom_name,
        ct.name as course_type_name,
        ct.color as course_type_color
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      WHERE cs.deleted_at IS NULL AND cs.is_active = TRUE
    `;
    const params = [];

    if (teacher_id) {
      scheduleSql += ' AND c.teacher_id = ?';
      params.push(teacher_id);
    }

    if (classroom_id) {
      scheduleSql += ' AND cs.classroom_id = ?';
      params.push(classroom_id);
    }

    scheduleSql += ' ORDER BY cs.day_of_week, cs.start_time';

    const schedules = await db.query(scheduleSql, params);

    // 取得這週的調課記錄
    const adjustments = await db.query(`
      SELECT
        sa.*,
        cr.name as adjusted_classroom_name
      FROM schedule_adjustments sa
      LEFT JOIN classrooms cr ON sa.adjusted_classroom_id = cr.id
      WHERE (sa.original_date BETWEEN ? AND ?)
         OR (sa.adjusted_date BETWEEN ? AND ?)
    `, [weekStart, weekEnd, weekStart, weekEnd]);

    // 建立調課映射
    const adjustmentsByScheduleDate = {};
    adjustments.forEach(adj => {
      const key = `${adj.schedule_id}_${adj.original_date}`;
      adjustmentsByScheduleDate[key] = adj;
    });

    // 生成一週的課表（含調課處理）
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      weekDates.push({
        date: formatDate(d),
        dayOfWeek: i + 1, // 1=週一, 7=週日
        dayName: ['週一', '週二', '週三', '週四', '週五', '週六', '週日'][i]
      });
    }

    // 處理每天的課程
    const weeklyData = weekDates.map(day => {
      const daySchedules = [];

      schedules.forEach(schedule => {
        // 檢查這個課程是否在這天有課
        const scheduleDayOfWeek = schedule.day_of_week === 0 ? 7 : schedule.day_of_week; // 轉換：0=週日變成7
        if (scheduleDayOfWeek !== day.dayOfWeek) return;

        const adjustmentKey = `${schedule.schedule_id}_${day.date}`;
        const adjustment = adjustmentsByScheduleDate[adjustmentKey];

        // 如果這天被取消，跳過
        if (adjustment && adjustment.adjustment_type === 'cancel') {
          return;
        }

        // 如果這天有調課，使用調課資訊
        const finalSchedule = {
          ...schedule,
          date: day.date,
          start_time: adjustment?.adjusted_start_time || schedule.start_time,
          end_time: adjustment?.adjusted_end_time || schedule.end_time,
          classroom_id: adjustment?.adjusted_classroom_id || schedule.classroom_id,
          classroom_name: adjustment?.adjusted_classroom_name || schedule.classroom_name,
          is_adjusted: !!adjustment,
          adjustment_type: adjustment?.adjustment_type || null,
          adjustment_reason: adjustment?.reason || null
        };

        daySchedules.push(finalSchedule);
      });

      // 檢查是否有補課移到這天
      adjustments.forEach(adj => {
        if (adj.adjusted_date === day.date && adj.adjustment_type === 'reschedule') {
          // 找到原本的課程資訊
          const originalSchedule = schedules.find(s => s.schedule_id === adj.schedule_id);
          if (originalSchedule) {
            // 檢查是否已經加入（避免重複）
            const exists = daySchedules.some(s =>
              s.schedule_id === adj.schedule_id && s.is_adjusted
            );
            if (!exists) {
              daySchedules.push({
                ...originalSchedule,
                date: day.date,
                start_time: adj.adjusted_start_time || originalSchedule.start_time,
                end_time: adj.adjusted_end_time || originalSchedule.end_time,
                classroom_id: adj.adjusted_classroom_id || originalSchedule.classroom_id,
                classroom_name: adj.adjusted_classroom_name || originalSchedule.classroom_name,
                is_adjusted: true,
                adjustment_type: 'makeup',
                adjustment_reason: adj.reason,
                original_date: adj.original_date
              });
            }
          }
        }
      });

      return {
        ...day,
        schedules: daySchedules.sort((a, b) => a.start_time.localeCompare(b.start_time))
      };
    });

    res.json({
      success: true,
      data: {
        weekStart,
        weekEnd,
        weekDates,
        schedules: weeklyData
      }
    });
  } catch (error) {
    console.error('取得週課表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 取得指定日期的課表（以老師為欄位）
 */
exports.getDailyScheduleByTeacher = async (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date) : new Date();
    const dayOfWeek = targetDate.getDay(); // 0=週日
    const formattedDate = targetDate.toISOString().split('T')[0];

    // 取得所有教師
    const teachers = await db.query(`
      SELECT t.id, u.name
      FROM teachers t
      JOIN users u ON t.user_id = u.id
      WHERE u.is_active = TRUE
      ORDER BY u.name
    `);

    // 取得這天的基礎課表
    const schedules = await db.query(`
      SELECT
        cs.id as schedule_id,
        cs.course_id,
        cs.day_of_week,
        cs.start_time,
        cs.end_time,
        cs.classroom_id,
        c.name as course_name,
        c.teacher_id,
        u.name as teacher_name,
        cr.name as classroom_name,
        ct.name as course_type_name,
        ct.color as course_type_color
      FROM course_schedules cs
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
      LEFT JOIN course_types ct ON c.course_type_id = ct.id
      WHERE cs.deleted_at IS NULL
        AND cs.is_active = TRUE
        AND cs.day_of_week = ?
      ORDER BY cs.start_time
    `, [dayOfWeek]);

    // 取得這天的調課記錄
    const adjustments = await db.query(`
      SELECT
        sa.*,
        cr.name as adjusted_classroom_name
      FROM schedule_adjustments sa
      LEFT JOIN classrooms cr ON sa.adjusted_classroom_id = cr.id
      WHERE sa.original_date = ? OR sa.adjusted_date = ?
    `, [formattedDate, formattedDate]);

    // 建立調課映射
    const cancelledSchedules = new Set();
    const adjustedSchedules = {};
    const makeupSchedules = [];

    adjustments.forEach(adj => {
      if (adj.original_date === formattedDate) {
        if (adj.adjustment_type === 'cancel') {
          cancelledSchedules.add(adj.schedule_id);
        } else if (adj.adjustment_type === 'reschedule') {
          // 原日期的課程被移走
          cancelledSchedules.add(adj.schedule_id);
        }
      }
      if (adj.adjusted_date === formattedDate) {
        // 有課程移到這天
        makeupSchedules.push(adj);
      }
    });

    // 過濾掉被取消/調走的課程
    let finalSchedules = schedules.filter(s => !cancelledSchedules.has(s.schedule_id));

    // 加入補課/調課到這天的課程
    for (const adj of makeupSchedules) {
      const originalSchedule = await db.queryOne(`
        SELECT
          cs.id as schedule_id,
          cs.course_id,
          cs.day_of_week,
          c.name as course_name,
          c.teacher_id,
          u.name as teacher_name,
          ct.name as course_type_name,
          ct.color as course_type_color
        FROM course_schedules cs
        JOIN courses c ON cs.course_id = c.id
        LEFT JOIN teachers t ON c.teacher_id = t.id
        LEFT JOIN users u ON t.user_id = u.id
        LEFT JOIN course_types ct ON c.course_type_id = ct.id
        WHERE cs.id = ?
      `, [adj.schedule_id]);

      if (originalSchedule) {
        finalSchedules.push({
          ...originalSchedule,
          start_time: adj.adjusted_start_time,
          end_time: adj.adjusted_end_time,
          classroom_id: adj.adjusted_classroom_id,
          classroom_name: adj.adjusted_classroom_name,
          is_adjusted: true,
          adjustment_type: adj.adjustment_type,
          original_date: adj.original_date
        });
      }
    }

    // 按老師分組
    const schedulesByTeacher = {};
    teachers.forEach(teacher => {
      schedulesByTeacher[teacher.id] = {
        teacher_id: teacher.id,
        teacher_name: teacher.name,
        schedules: []
      };
    });

    finalSchedules.forEach(schedule => {
      if (schedule.teacher_id && schedulesByTeacher[schedule.teacher_id]) {
        schedulesByTeacher[schedule.teacher_id].schedules.push(schedule);
      }
    });

    res.json({
      success: true,
      data: {
        date: formattedDate,
        dayOfWeek,
        dayName: ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][dayOfWeek],
        teachers: Object.values(schedulesByTeacher)
      }
    });
  } catch (error) {
    console.error('取得日課表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 取得調課記錄
 */
exports.getAdjustments = async (req, res) => {
  try {
    const { schedule_id, start_date, end_date, status } = req.query;

    let sql = `
      SELECT
        sa.*,
        cs.day_of_week as original_day_of_week,
        cs.start_time as original_start_time,
        cs.end_time as original_end_time,
        c.name as course_name,
        u.name as teacher_name,
        cr1.name as original_classroom_name,
        cr2.name as adjusted_classroom_name,
        cu.name as created_by_name
      FROM schedule_adjustments sa
      JOIN course_schedules cs ON sa.schedule_id = cs.id
      JOIN courses c ON cs.course_id = c.id
      LEFT JOIN teachers t ON c.teacher_id = t.id
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN classrooms cr1 ON cs.classroom_id = cr1.id
      LEFT JOIN classrooms cr2 ON sa.adjusted_classroom_id = cr2.id
      LEFT JOIN users cu ON sa.created_by = cu.id
      WHERE 1=1
    `;
    const params = [];

    if (schedule_id) {
      sql += ' AND sa.schedule_id = ?';
      params.push(schedule_id);
    }

    if (start_date) {
      sql += ' AND sa.original_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      sql += ' AND sa.original_date <= ?';
      params.push(end_date);
    }

    if (status) {
      sql += ' AND sa.status = ?';
      params.push(status);
    }

    sql += ' ORDER BY sa.original_date DESC, sa.created_at DESC';

    const adjustments = await db.query(sql, params);

    res.json({
      success: true,
      data: adjustments
    });
  } catch (error) {
    console.error('取得調課記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 新增調課
 */
exports.createAdjustment = async (req, res) => {
  try {
    const {
      schedule_id,
      original_date,
      adjusted_date,
      adjusted_start_time,
      adjusted_end_time,
      adjusted_classroom_id,
      adjustment_type,
      reason
    } = req.body;

    // 驗證必要欄位
    if (!schedule_id || !original_date || !adjustment_type) {
      return res.status(400).json({
        success: false,
        message: '請提供必要欄位'
      });
    }

    // 檢查班級是否存在
    const schedule = await db.queryOne(
      'SELECT id FROM course_schedules WHERE id = ? AND deleted_at IS NULL',
      [schedule_id]
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: '找不到班級'
      });
    }

    // 檢查是否已有調課記錄
    const existing = await db.queryOne(
      'SELECT id FROM schedule_adjustments WHERE schedule_id = ? AND original_date = ?',
      [schedule_id, original_date]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '該日期已有調課記錄'
      });
    }

    // 新增調課記錄
    const adjustmentId = await db.insert(`
      INSERT INTO schedule_adjustments (
        schedule_id, original_date, adjusted_date,
        adjusted_start_time, adjusted_end_time, adjusted_classroom_id,
        adjustment_type, reason, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      schedule_id,
      original_date,
      adjusted_date || null,
      adjusted_start_time || null,
      adjusted_end_time || null,
      adjusted_classroom_id || null,
      adjustment_type,
      reason || null,
      req.user?.id || null
    ]);

    res.status(201).json({
      success: true,
      message: '調課建立成功',
      data: { id: adjustmentId }
    });
  } catch (error) {
    console.error('新增調課錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 更新調課
 */
exports.updateAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      adjusted_date,
      adjusted_start_time,
      adjusted_end_time,
      adjusted_classroom_id,
      adjustment_type,
      reason,
      status
    } = req.body;

    const adjustment = await db.queryOne(
      'SELECT id FROM schedule_adjustments WHERE id = ?',
      [id]
    );

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: '找不到調課記錄'
      });
    }

    await db.update(`
      UPDATE schedule_adjustments SET
        adjusted_date = ?,
        adjusted_start_time = ?,
        adjusted_end_time = ?,
        adjusted_classroom_id = ?,
        adjustment_type = ?,
        reason = ?,
        status = ?
      WHERE id = ?
    `, [
      adjusted_date || null,
      adjusted_start_time || null,
      adjusted_end_time || null,
      adjusted_classroom_id || null,
      adjustment_type,
      reason || null,
      status || 'confirmed',
      id
    ]);

    res.json({
      success: true,
      message: '調課更新成功'
    });
  } catch (error) {
    console.error('更新調課錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

/**
 * 刪除調課
 */
exports.deleteAdjustment = async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await db.queryOne(
      'SELECT id FROM schedule_adjustments WHERE id = ?',
      [id]
    );

    if (!adjustment) {
      return res.status(404).json({
        success: false,
        message: '找不到調課記錄'
      });
    }

    await db.update('DELETE FROM schedule_adjustments WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '調課已刪除'
    });
  } catch (error) {
    console.error('刪除調課錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
