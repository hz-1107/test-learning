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
      sql += ' AND YEAR(holiday_date) = ?';
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
    const { holiday_date, name, type } = req.body;

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
      'INSERT INTO holidays (holiday_date, name, type) VALUES (?, ?, ?)',
      [holiday_date, name, type || 'custom']
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
          'INSERT INTO holidays (holiday_date, name, type) VALUES (?, ?, ?)',
          [holiday.holiday_date, holiday.name, holiday.type || 'national']
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
    const { holiday_date, name, type } = req.body;

    await db.update(
      'UPDATE holidays SET holiday_date = ?, name = ?, type = ? WHERE id = ?',
      [holiday_date, name, type || 'custom', id]
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

// 新增教室
exports.createClassroom = async (req, res) => {
  try {
    const { name, address, capacity } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: '請提供教室名稱'
      });
    }

    const id = await db.insert(
      'INSERT INTO classrooms (name, address, capacity) VALUES (?, ?, ?)',
      [name, address || null, capacity || 20]
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
    const { name, address, capacity, is_active } = req.body;

    await db.update(
      'UPDATE classrooms SET name = ?, address = ?, capacity = ?, is_active = ? WHERE id = ?',
      [name, address || null, capacity || 20, is_active !== false, id]
    );

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

    // 軟刪除
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
