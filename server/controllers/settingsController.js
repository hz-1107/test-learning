const db = require('../config/db');

// =====================
// 系統設定
// =====================

// 取得所有系統設定
exports.getSettings = async (req, res) => {
  try {
    const settings = await db.query('SELECT * FROM system_settings');

    // 轉換成 key-value 物件
    const settingsObj = {};
    for (const setting of settings) {
      settingsObj[setting.setting_key] = setting.setting_value;
    }

    res.json({
      success: true,
      data: settingsObj
    });
  } catch (error) {
    console.error('取得系統設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新系統設定
exports.updateSettings = async (req, res) => {
  try {
    const settings = req.body;

    for (const [key, value] of Object.entries(settings)) {
      await db.query(`
        INSERT INTO system_settings (setting_key, setting_value)
        VALUES (?, ?)
        ON DUPLICATE KEY UPDATE setting_value = ?
      `, [key, value, value]);
    }

    res.json({
      success: true,
      message: '設定更新成功'
    });
  } catch (error) {
    console.error('更新系統設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// =====================
// 假日設定
// =====================

// 取得所有假日
exports.getHolidays = async (req, res) => {
  try {
    const { year, type } = req.query;

    let sql = 'SELECT * FROM holidays WHERE 1=1';
    const params = [];

    if (year) {
      // 每年重複的假日不受年份限制
      sql += ' AND (YEAR(holiday_date) = ? OR is_recurring = 1)';
      params.push(year);
    }

    if (type) {
      sql += ' AND type = ?';
      params.push(type);
    }

    sql += ' ORDER BY holiday_date';

    const holidays = await db.query(sql, params);

    res.json({
      success: true,
      data: holidays
    });
  } catch (error) {
    console.error('取得假日列表錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 新增假日
exports.createHoliday = async (req, res) => {
  try {
    const { holiday_date, name, type, is_recurring } = req.body;

    if (!holiday_date || !name) {
      return res.status(400).json({
        success: false,
        message: '請提供日期和假日名稱'
      });
    }

    // 檢查是否已存在
    const existing = await db.queryOne(
      'SELECT id FROM holidays WHERE holiday_date = ?',
      [holiday_date]
    );

    if (existing) {
      return res.status(400).json({
        success: false,
        message: '此日期已有假日設定'
      });
    }

    const id = await db.insert(
      'INSERT INTO holidays (holiday_date, name, type, is_recurring) VALUES (?, ?, ?, ?)',
      [holiday_date, name, type || 'custom', is_recurring ? 1 : 0]
    );

    res.status(201).json({
      success: true,
      message: '假日新增成功',
      data: { id }
    });
  } catch (error) {
    console.error('新增假日錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 批次匯入假日
exports.importHolidays = async (req, res) => {
  try {
    const { holidays } = req.body;

    if (!holidays || !Array.isArray(holidays)) {
      return res.status(400).json({
        success: false,
        message: '請提供假日列表'
      });
    }

    let imported = 0;
    let skipped = 0;

    for (const holiday of holidays) {
      try {
        await db.insert(
          'INSERT INTO holidays (holiday_date, name, type, is_recurring) VALUES (?, ?, ?, ?)',
          [holiday.holiday_date, holiday.name, holiday.type || 'national', holiday.is_recurring ? 1 : 0]
        );
        imported++;
      } catch (err) {
        // 重複的日期會被跳過
        if (err.code === 'ER_DUP_ENTRY') {
          skipped++;
        } else {
          throw err;
        }
      }
    }

    res.json({
      success: true,
      message: `匯入完成：${imported} 個新增，${skipped} 個跳過（已存在）`,
      data: { imported, skipped }
    });
  } catch (error) {
    console.error('批次匯入假日錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新假日
exports.updateHoliday = async (req, res) => {
  try {
    const { id } = req.params;
    const { holiday_date, name, type, is_recurring } = req.body;

    await db.update(
      'UPDATE holidays SET holiday_date = ?, name = ?, type = ?, is_recurring = ? WHERE id = ?',
      [holiday_date, name, type || 'custom', is_recurring ? 1 : 0, id]
    );

    res.json({
      success: true,
      message: '假日更新成功'
    });
  } catch (error) {
    console.error('更新假日錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 刪除假日
exports.deleteHoliday = async (req, res) => {
  try {
    const { id } = req.params;

    await db.update('DELETE FROM holidays WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '假日刪除成功'
    });
  } catch (error) {
    console.error('刪除假日錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// =====================
// 通知設定
// =====================

// 取得通知設定
exports.getNotificationSettings = async (req, res) => {
  try {
    const settings = await db.query('SELECT * FROM notification_settings');

    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('取得通知設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新通知設定
exports.updateNotificationSetting = async (req, res) => {
  try {
    const { type } = req.params;
    const { is_enabled, config } = req.body;

    await db.query(`
      INSERT INTO notification_settings (type, is_enabled, config)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE is_enabled = ?, config = ?
    `, [
      type, is_enabled, JSON.stringify(config),
      is_enabled, JSON.stringify(config)
    ]);

    res.json({
      success: true,
      message: '通知設定更新成功'
    });
  } catch (error) {
    console.error('更新通知設定錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// =====================
// 教室管理
// =====================

// 取得所有教室（含使用中班級數，供刪除前判斷；教室由班級決定，課程不綁定教室）
exports.getClassrooms = async (req, res) => {
  try {
    const classrooms = await db.query(`
      SELECT cr.*,
        (SELECT COUNT(*) FROM course_schedules cs WHERE cs.classroom_id = cr.id AND cs.is_active = TRUE) AS active_classes_count
      FROM classrooms cr
      WHERE cr.is_active = TRUE
      ORDER BY cr.location, cr.name
    `);

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

// 檢查同名教室（僅比對啟用中的教室）
async function findDuplicateClassroom(name, excludeId = null) {
  let sql = 'SELECT id FROM classrooms WHERE name = ? AND is_active = TRUE';
  const params = [name];
  if (excludeId) {
    sql += ' AND id <> ?';
    params.push(excludeId);
  }
  return db.queryOne(sql, params);
}

// 新增教室
exports.createClassroom = async (req, res) => {
  try {
    const name = (req.body.name || '').trim();
    const location = (req.body.location || '').trim();

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: '請提供教室名稱和地點'
      });
    }

    if (await findDuplicateClassroom(name)) {
      return res.status(400).json({
        success: false,
        message: '已有相同名稱的教室'
      });
    }

    const id = await db.insert(
      'INSERT INTO classrooms (name, location) VALUES (?, ?)',
      [name, location]
    );

    res.status(201).json({
      success: true,
      message: '教室新增成功',
      data: { id }
    });
  } catch (error) {
    console.error('新增教室錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 更新教室
exports.updateClassroom = async (req, res) => {
  try {
    const { id } = req.params;
    const name = (req.body.name || '').trim();
    const location = (req.body.location || '').trim();

    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: '請提供教室名稱和地點'
      });
    }

    if (await findDuplicateClassroom(name, id)) {
      return res.status(400).json({
        success: false,
        message: '已有相同名稱的教室'
      });
    }

    const affected = await db.update(
      'UPDATE classrooms SET name = ?, location = ? WHERE id = ? AND is_active = TRUE',
      [name, location, id]
    );

    if (!affected) {
      return res.status(404).json({
        success: false,
        message: '找不到教室'
      });
    }

    res.json({
      success: true,
      message: '教室更新成功'
    });
  } catch (error) {
    console.error('更新教室錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};

// 刪除教室
exports.deleteClassroom = async (req, res) => {
  try {
    const { id } = req.params;

    // 仍有啟用中的班級使用此教室時不可刪除，避免班級與課表失去教室
    const inUse = await db.queryOne(
      'SELECT COUNT(*) AS count FROM course_schedules WHERE classroom_id = ? AND is_active = TRUE',
      [id]
    );

    if (inUse && inUse.count > 0) {
      return res.status(400).json({
        success: false,
        message: `此教室仍有 ${inUse.count} 個班級使用中，請先調整班級教室後再刪除`
      });
    }

    // 軟刪除：保留歷史日誌、課表對應的教室資料
    await db.update('UPDATE classrooms SET is_active = FALSE WHERE id = ?', [id]);

    res.json({
      success: true,
      message: '教室刪除成功'
    });
  } catch (error) {
    console.error('刪除教室錯誤:', error);
    res.status(500).json({
      success: false,
      message: '伺服器錯誤'
    });
  }
};
