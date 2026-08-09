/**
 * 全系統班級資料（單一資料來源）
 * 供 班級管理（課程資訊）、課表排程（課表 / 課程列表）共用
 * 使用 localStorage 持久化，讓任一頁面的編輯都能同步反映到其他頁面
 */
const CLASS_STORAGE_KEY = 'slh_classes_v1';
const TRASH_RETENTION_DAYS = 30;

const TEACHER_LIST = ['顏老師', '王老師', '陳老師', '廖老師', '何老師', '羅老師', '柯老師'];
const CLASSROOM_LIST = ['西屯', '沙鹿'];
const WEEKDAY_LIST = ['一', '二', '三', '四', '五', '六', '日'];

const DEFAULT_CLASSES = [
  // 週二
  { id: 1, name: '動力機械', teacher: '顏老師', room: '西屯', weekday: '二', startTime: '14:00', endTime: '16:00', active: true, studentNames: ['張小明'] },
  { id: 7, name: '程式機械', teacher: '王老師', room: '沙鹿', weekday: '二', startTime: '14:30', endTime: '16:30', active: true, studentNames: ['劉恩妤', '蔡宇翔'] },
  { id: 8, name: '動力機械', teacher: '羅老師', room: '西屯', weekday: '二', startTime: '16:00', endTime: '18:00', active: true, studentNames: ['鄭欣妍'] },
  { id: 9, name: '科創機器人', teacher: '廖老師', room: '西屯', weekday: '二', startTime: '17:00', endTime: '19:00', active: true, studentNames: ['郭子睿', '洪柔萱'] },
  { id: 10, name: '程式機械', teacher: '何老師', room: '西屯', weekday: '二', startTime: '17:00', endTime: '19:00', active: true, studentNames: ['曾昊平'] },
  { id: 11, name: '動力機械', teacher: '柯老師', room: '沙鹿', weekday: '二', startTime: '17:00', endTime: '19:00', active: true, studentNames: ['廖詩涵', '徐俊彥'] },
  { id: 12, name: '動力機械', teacher: '顏老師', room: '西屯', weekday: '二', startTime: '18:00', endTime: '20:00', active: true, studentNames: ['周芯妤'] },
  { id: 13, name: '程式機械', teacher: '陳老師', room: '西屯', weekday: '二', startTime: '18:00', endTime: '20:00', active: true, studentNames: ['葉家安', '蘇明霆'] },
  { id: 14, name: '動力機械', teacher: '羅老師', room: '西屯', weekday: '二', startTime: '19:00', endTime: '21:00', active: true, studentNames: ['莊怡珊'] },
  // 週三
  { id: 2, name: '程式機械', teacher: '陳老師', room: '西屯', weekday: '三', startTime: '17:00', endTime: '20:00', active: true, studentNames: ['李美華', '陳小芳'] },
  { id: 3, name: '程式機械', teacher: '王老師', room: '西屯', weekday: '三', startTime: '17:00', endTime: '20:00', active: true, studentNames: ['楊語婷', '謝冠霖'] },
  { id: 4, name: '科創機器人', teacher: '顏老師', room: '沙鹿', weekday: '三', startTime: '17:30', endTime: '20:00', active: false, studentNames: ['王大明'] },
  // 週四
  { id: 5, name: '幼兒簡易機械', teacher: '王老師', room: '西屯', weekday: '四', startTime: '16:00', endTime: '17:00', active: true, studentNames: ['林志豪', '賴宸翊', '王柔恩'] },
  { id: 15, name: '程式機械', teacher: '何老師', room: '西屯', weekday: '四', startTime: '17:00', endTime: '19:00', active: true, studentNames: ['呂建霖', '江宇恩'] },
  { id: 16, name: '動力機械', teacher: '柯老師', room: '沙鹿', weekday: '四', startTime: '18:00', endTime: '20:00', active: true, studentNames: ['何雅萱'] },
  // 週五
  { id: 6, name: '動力機械', teacher: '陳老師', room: '沙鹿', weekday: '五', startTime: '18:00', endTime: '20:00', active: true, studentNames: ['黃雅琪', '吳建宏'] },
  { id: 17, name: '科創機器人', teacher: '王老師', room: '西屯', weekday: '五', startTime: '17:00', endTime: '19:00', active: true, studentNames: ['蕭妍宇', '羅子霖'] },
];

const SCHEDULE_BLOCK_COLORS = {
  '動力機械': { bg: 'rgba(135, 206, 250, 0.3)', border: '#87CEEB' },
  '程式機械': { bg: 'rgba(255, 183, 120, 0.3)', border: '#ffb778' },
  '科創機器人': { bg: 'rgba(200, 180, 255, 0.3)', border: '#c8b4ff' },
  '幼兒簡易機械': { bg: 'rgba(255, 219, 88, 0.3)', border: '#ffdb58' },
  '專題班': { bg: 'rgba(134, 239, 172, 0.3)', border: '#4ade80' },
};

function getScheduleBlockColor(courseName) {
  return SCHEDULE_BLOCK_COLORS[courseName] || { bg: 'rgba(200, 200, 200, 0.3)', border: '#a3a3a3' };
}

function purgeExpiredTrash(classes) {
  const cutoff = Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000;
  const kept = classes.filter(c => !c.deletedAt || c.deletedAt > cutoff);
  return { classes: kept, purged: kept.length !== classes.length };
}

function getTrashDaysRemaining(deletedAt) {
  const elapsedDays = (Date.now() - deletedAt) / (24 * 60 * 60 * 1000);
  return Math.max(0, Math.ceil(TRASH_RETENTION_DAYS - elapsedDays));
}

function loadClasses() {
  let classes;
  try {
    const raw = localStorage.getItem(CLASS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      classes = Array.isArray(parsed) && parsed.length ? parsed : null;
    }
  } catch (e) {
    console.warn('讀取班級資料失敗，改用預設資料', e);
  }
  if (!classes) {
    classes = DEFAULT_CLASSES.map(c => ({ ...c, studentNames: [...c.studentNames], deletedAt: null }));
  }

  const { classes: kept, purged } = purgeExpiredTrash(classes);
  if (purged) saveClasses(kept);
  return kept;
}

function saveClasses(classes) {
  localStorage.setItem(CLASS_STORAGE_KEY, JSON.stringify(classes));
}
