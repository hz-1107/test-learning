/**
 * 日誌應填寫日期推算工具
 *
 * 依課表推算每一堂課應有的日誌，並與既有日誌合併。
 * 行政端「老師管理」的未完成日誌數與「日誌管理」列表共用此規則，確保兩邊數字一致。
 */

// 以「當地時區」格式化日期字串（YYYY-MM-DD），避免 toISOString() 轉 UTC 造成日期差一天
function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 將資料庫日期（字串或 Date）轉成 YYYY-MM-DD
function toDateStr(value) {
  if (!value) return '';
  return value instanceof Date ? formatLocalDate(value) : String(value).slice(0, 10);
}

/**
 * 載入影響上課日期的設定：假日（停課）與調課紀錄
 * 回傳的 calendar 交給 listScheduleLogs 使用
 */
async function loadCalendar() {
  const db = require('../config/db');
  const [holidays, adjustments] = await Promise.all([
    db.query('SELECT holiday_date, is_recurring FROM holidays'),
    db.query('SELECT schedule_id, original_date, adjusted_date, adjusted_start_time, adjusted_end_time, adjustment_type FROM schedule_adjustments')
  ]);

  const holidayDates = new Set();
  const recurringMonthDays = new Set();
  holidays.forEach(h => {
    const dateStr = toDateStr(h.holiday_date);
    if (h.is_recurring) recurringMonthDays.add(dateStr.slice(5));
    else holidayDates.add(dateStr);
  });

  // 調課紀錄：key 為「排程ID_原上課日」
  const adjustmentsByKey = new Map();
  adjustments.forEach(a => {
    adjustmentsByKey.set(`${a.schedule_id}_${toDateStr(a.original_date)}`, {
      ...a,
      original_date: toDateStr(a.original_date),
      adjusted_date: toDateStr(a.adjusted_date)
    });
  });

  return { holidayDates, recurringMonthDays, adjustmentsByKey };
}

// 是否為假日（假日停課，不需填寫日誌）
function isHoliday(dateStr, calendar) {
  if (!calendar) return false;
  return calendar.holidayDates.has(dateStr) || calendar.recurringMonthDays.has(dateStr.slice(5));
}

// 班級開始產生日誌的日期：開課日期；未設定則以排程建立日起算
function getScheduleStart(schedule) {
  return toDateStr(schedule.start_date) || toDateStr(schedule.created_at);
}

/**
 * 列出單一排程在日期範圍內的每一堂課及其日誌
 * @param {Object} schedule - 需含 day_of_week、start_date、created_at；有 start_time 時，今天尚未開始的課不列入
 * @param {Map<string, Object>} logsByDate - 該排程的既有日誌（key 為 YYYY-MM-DD）
 * @param {Object} range - { from, to, calendar }，from 省略表示從開課日起算；to 不會超過今天；
 *   calendar 為 loadCalendar() 的結果，用來排除假日與取消的課；調到其他日期的課仍記在原日期
 * @returns {Array<{ log_date: string, log: Object|null }>}
 */
function listScheduleLogs(schedule, logsByDate, { from, to, calendar } = {}) {
  const today = formatLocalDate(new Date());
  const end = to && to < today ? to : today;
  const start = getScheduleStart(schedule);

  // 未指定起始日時，從開課日起算；若開課日以前已有開始填寫的日誌，也一併納入
  let lower = from;
  if (!lower) {
    lower = start;
    for (const [dateStr, log] of logsByDate) {
      if (log.status !== 'pending' && (!lower || dateStr < lower)) lower = dateStr;
    }
  }
  if (!lower) return [];

  // 從起始日找到第一個上課星期，之後每 7 天一堂
  const [y, m, d] = lower.split('-').map(Number);
  const current = new Date(y, m - 1, d);
  current.setDate(current.getDate() + ((schedule.day_of_week - current.getDay() + 7) % 7));

  const currentTime = new Date().toTimeString().split(' ')[0]; // HH:MM:SS
  const scheduleId = schedule.schedule_id ?? schedule.id;

  // 每一堂課的日期（skip 表示當天停課）
  const lessons = [];
  for (let dateStr = formatLocalDate(current); dateStr <= end; dateStr = formatLocalDate(current)) {
    const adjustment = calendar?.adjustmentsByKey.get(`${scheduleId}_${dateStr}`);
    current.setDate(current.getDate() + 7);

    // 假日停課、調課取消：這天不上課
    if (isHoliday(dateStr, calendar) || adjustment?.adjustment_type === 'cancel') {
      lessons.push({ log_date: dateStr, skip: true });
      continue;
    }

    // 調到其他日期或時段：日誌仍記在原上課日期與原時間，方便日後依原課表查閱；
    // 實際上課的日期時間由老師在課程備註（時段異動）註記
    lessons.push({ log_date: dateStr });
  }

  const result = [];
  for (const lesson of lessons) {
    const dateStr = lesson.log_date;
    const log = logsByDate.get(dateStr) || null;
    // 已開始填寫的日誌一律保留（例如假日仍有上課並填寫）；只排除沒寫內容的待填寫／未建立項目
    const unfilled = !log || log.status === 'pending';

    if (lesson.skip) {
      if (!unfilled) result.push({ log_date: dateStr, log });
      continue;
    }

    // 開課日期以前：只保留已開始填寫的日誌
    const beforeStart = start && dateStr < start && unfilled;
    // 今天的課尚未開始（且還沒有日誌）時不列入，與自動建立日誌的時機一致
    const upcomingToday = dateStr === today && schedule.start_time && currentTime < schedule.start_time && !log;
    if (!beforeStart && !upcomingToday) {
      result.push({ log_date: dateStr, log });
    }
  }

  return result;
}

/**
 * 將日誌依排程分組：Map<schedule_id, Map<YYYY-MM-DD, log>>
 */
function groupLogsBySchedule(logs) {
  const map = new Map();
  logs.forEach(log => {
    if (!map.has(log.schedule_id)) map.set(log.schedule_id, new Map());
    map.get(log.schedule_id).set(toDateStr(log.log_date), log);
  });
  return map;
}

module.exports = {
  loadCalendar,
  isHoliday,
  formatLocalDate,
  toDateStr,
  getScheduleStart,
  listScheduleLogs,
  groupLogsBySchedule
};
