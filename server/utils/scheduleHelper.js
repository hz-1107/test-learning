/**
 * 課表調課處理工具
 *
 * 用於檢查課程是否有調課/代課，並返回最終顯示資料
 */
const db = require('../config/db');

/**
 * 調課類型說明：
 * - cancel: 取消（當天不上課）
 * - time: 改時段（可能換日期、時間、教室）
 * - teacher: 換代課老師（日期時間不變）
 * - time_teacher: 改時段 + 換代課老師
 * - reschedule: 調課（舊值，相容用）
 * - makeup: 補課（舊值，相容用）
 */

/**
 * 取得指定日期範圍的調課記錄
 * @param {string} startDate - 開始日期 (YYYY-MM-DD)
 * @param {string} endDate - 結束日期 (YYYY-MM-DD)
 * @returns {Promise<Array>} 調課記錄陣列
 */
async function getAdjustments(startDate, endDate) {
  return db.query(`
    SELECT
      sa.*,
      cr.name as adjusted_classroom_name,
      su.name as adjusted_teacher_name
    FROM schedule_adjustments sa
    LEFT JOIN classrooms cr ON sa.adjusted_classroom_id = cr.id
    LEFT JOIN teachers st ON sa.adjusted_teacher_id = st.id
    LEFT JOIN users su ON st.user_id = su.id
    WHERE (sa.original_date BETWEEN ? AND ?)
       OR (sa.adjusted_date BETWEEN ? AND ?)
  `, [startDate, endDate, startDate, endDate]);
}

/**
 * 取得單一課程在指定日期的調課記錄
 * @param {number} scheduleId - 課程時段 ID
 * @param {string} date - 日期 (YYYY-MM-DD)
 * @returns {Promise<Object|null>} 調課記錄或 null
 */
async function getAdjustmentForSchedule(scheduleId, date) {
  return db.queryOne(`
    SELECT
      sa.*,
      cr.name as adjusted_classroom_name,
      su.name as adjusted_teacher_name
    FROM schedule_adjustments sa
    LEFT JOIN classrooms cr ON sa.adjusted_classroom_id = cr.id
    LEFT JOIN teachers st ON sa.adjusted_teacher_id = st.id
    LEFT JOIN users su ON st.user_id = su.id
    WHERE sa.schedule_id = ? AND sa.original_date = ?
  `, [scheduleId, date]);
}

/**
 * 檢查課程在指定日期是否應該顯示
 * @param {Object} adjustment - 調課記錄
 * @param {string} checkDate - 要檢查的日期
 * @returns {Object} { show: boolean, reason: string }
 */
function shouldShowSchedule(adjustment, checkDate) {
  if (!adjustment) {
    return { show: true, reason: null };
  }

  const { adjustment_type, original_date, adjusted_date } = adjustment;

  // 取消：不顯示
  if (adjustment_type === 'cancel') {
    return { show: false, reason: '課程已取消' };
  }

  // 調到其他日期：原日期不顯示
  const movedToAnotherDay = adjusted_date && adjusted_date !== original_date;
  if (movedToAnotherDay && checkDate === original_date) {
    return { show: false, reason: `課程已調至 ${adjusted_date}` };
  }

  return { show: true, reason: null };
}

/**
 * 套用調課資訊到課程
 * @param {Object} schedule - 原始課程資料
 * @param {Object} adjustment - 調課記錄
 * @returns {Object} 套用調課後的課程資料
 */
function applyAdjustment(schedule, adjustment) {
  if (!adjustment) {
    return {
      ...schedule,
      is_adjusted: false,
      adjustment_type: null,
      adjustment_reason: null,
      has_substitute_teacher: false
    };
  }

  const {
    adjustment_type,
    adjusted_date,
    adjusted_start_time,
    adjusted_end_time,
    adjusted_classroom_id,
    adjusted_classroom_name,
    adjusted_teacher_id,
    adjusted_teacher_name,
    reason
  } = adjustment;

  // 判斷是否有代課老師
  const hasSubstituteTeacher = ['teacher', 'time_teacher'].includes(adjustment_type)
    && adjusted_teacher_id;

  // 判斷是否有調整時段
  const hasTimeChange = ['time', 'time_teacher', 'reschedule', 'makeup'].includes(adjustment_type);

  return {
    ...schedule,
    // 時段調整
    start_time: hasTimeChange && adjusted_start_time ? adjusted_start_time : schedule.start_time,
    end_time: hasTimeChange && adjusted_end_time ? adjusted_end_time : schedule.end_time,
    // 教室調整
    classroom_id: adjusted_classroom_id || schedule.classroom_id,
    classroom_name: adjusted_classroom_name || schedule.classroom_name,
    // 代課老師
    teacher_id: hasSubstituteTeacher ? adjusted_teacher_id : schedule.teacher_id,
    teacher_name: hasSubstituteTeacher ? adjusted_teacher_name : schedule.teacher_name,
    original_teacher_id: hasSubstituteTeacher ? schedule.teacher_id : null,
    original_teacher_name: hasSubstituteTeacher ? schedule.teacher_name : null,
    // 調課標記
    is_adjusted: true,
    adjustment_type,
    adjustment_reason: reason,
    has_substitute_teacher: hasSubstituteTeacher,
    // 如果是調日期，記錄原始日期
    original_date: adjusted_date !== adjustment.original_date ? adjustment.original_date : null
  };
}

/**
 * 處理一天的課表（含調課邏輯）
 * @param {Array} schedules - 原始課程列表
 * @param {Array} adjustments - 該日期範圍的調課記錄
 * @param {string} date - 要處理的日期
 * @returns {Array} 處理後的課程列表
 */
function processSchedulesForDate(schedules, adjustments, date) {
  const result = [];

  // 建立調課映射 (schedule_id_date -> adjustment)
  const adjustmentMap = {};
  adjustments.forEach(adj => {
    adjustmentMap[`${adj.schedule_id}_${adj.original_date}`] = adj;
  });

  // 處理原始課表
  schedules.forEach(schedule => {
    const key = `${schedule.schedule_id}_${date}`;
    const adjustment = adjustmentMap[key];

    // 檢查是否應該顯示
    const { show } = shouldShowSchedule(adjustment, date);
    if (!show) return;

    // 套用調課資訊
    const processedSchedule = applyAdjustment(schedule, adjustment);
    processedSchedule.date = date;
    result.push(processedSchedule);
  });

  // 加入調課到這天的課程（從其他日期調過來的）
  adjustments.forEach(adj => {
    const movedToThisDay = adj.adjusted_date === date
      && adj.adjusted_date !== adj.original_date
      && adj.adjustment_type !== 'cancel';

    if (movedToThisDay) {
      // 找到原始課程
      const originalSchedule = schedules.find(s => s.schedule_id === adj.schedule_id);
      if (originalSchedule) {
        const processedSchedule = applyAdjustment(originalSchedule, adj);
        processedSchedule.date = date;
        processedSchedule.original_date = adj.original_date;
        result.push(processedSchedule);
      }
    }
  });

  // 按時間排序
  return result.sort((a, b) => a.start_time.localeCompare(b.start_time));
}

/**
 * 取得課程的調課狀態摘要（用於前端顯示標籤）
 * @param {Object} schedule - 處理後的課程資料
 * @returns {Object} { label: string, color: string, icon: string }
 */
function getAdjustmentLabel(schedule) {
  if (!schedule.is_adjusted) {
    return null;
  }

  const { adjustment_type, has_substitute_teacher } = schedule;

  switch (adjustment_type) {
    case 'cancel':
      return { label: '已取消', color: '#ff6b6b', icon: 'x-circle' };
    case 'teacher':
      return { label: '代課', color: '#ffa94d', icon: 'user-check' };
    case 'time':
      return { label: '調課', color: '#69db7c', icon: 'clock' };
    case 'time_teacher':
      return { label: '調課+代課', color: '#748ffc', icon: 'refresh-cw' };
    case 'reschedule':
    case 'makeup':
      return { label: '補課', color: '#69db7c', icon: 'calendar-plus' };
    default:
      return { label: '已調整', color: '#adb5bd', icon: 'edit' };
  }
}

module.exports = {
  getAdjustments,
  getAdjustmentForSchedule,
  shouldShowSchedule,
  applyAdjustment,
  processSchedulesForDate,
  getAdjustmentLabel
};
