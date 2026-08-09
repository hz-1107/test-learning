/**
 * 全系統學生點數資料（單一資料來源）
 * 供 點數管理頁面使用，使用 localStorage 持久化
 */
const POINTS_STORAGE_KEY = 'slh_points_v1';
const DEFAULT_STUDENT_POINTS = 80;

const POINT_REASON_LIST = ['增加', '扣除', '兌換獎品', '其他'];

const POINT_REASON_META = {
  '增加': { sign: 1, confirmLabel: '確認增加', color: '#007A55', bg: 'rgba(0, 122, 85, 0.12)' },
  '扣除': { sign: -1, confirmLabel: '確認扣除', color: '#fe7560', bg: 'rgba(254, 117, 96, 0.12)' },
  '兌換獎品': { sign: -1, confirmLabel: '確認兌換', color: '#fe7560', bg: 'rgba(254, 117, 96, 0.12)' },
  '其他': { sign: 1, confirmLabel: '確認送出', color: '#007A55', bg: 'rgba(0, 122, 85, 0.12)' },
};

const SEED_POINTS = {
  '張小明': { points: 88, history: [
    { id: 1, reason: '增加', description: '出席獎勵', delta: 5, date: '2026-06-18 14:30', operator: '陳老師' },
    { id: 2, reason: '增加', description: '出席獎勵', delta: 5, date: '2026-06-15 14:30', operator: '陳老師' },
  ] },
  '李美華': { points: 90, history: [
    { id: 1, reason: '增加', description: '競賽加分', delta: 10, date: '2026-06-16 10:00', operator: '王老師' },
  ] },
  '王大明': { points: 120, history: [
    { id: 1, reason: '增加', description: '出席獎勵', delta: 20, date: '2026-06-10 17:30', operator: '顏老師' },
  ] },
  '陳小芳': { points: 94, history: [
    { id: 1, reason: '增加', description: '出席獎勵', delta: 4, date: '2026-06-17 17:00', operator: '陳老師' },
  ] },
  '林志豪': { points: 94, history: [
    { id: 1, reason: '增加', description: '出席獎勵', delta: 4, date: '2026-06-18 18:00', operator: '顏老師' },
  ] },
  '黃雅琪': { points: 88, history: [
    { id: 1, reason: '增加', description: '出席獎勵', delta: 8, date: '2026-06-17 17:00', operator: '羅老師' },
  ] },
};

function loadPoints() {
  try {
    const raw = localStorage.getItem(POINTS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') return parsed;
    }
  } catch (e) {
    console.warn('讀取點數資料失敗，改用預設資料', e);
  }
  return JSON.parse(JSON.stringify(SEED_POINTS));
}

function savePoints(pointsMap) {
  localStorage.setItem(POINTS_STORAGE_KEY, JSON.stringify(pointsMap));
}

function getStudentPointsRecord(pointsMap, name) {
  if (!pointsMap[name]) {
    pointsMap[name] = { points: DEFAULT_STUDENT_POINTS, history: [] };
  }
  return pointsMap[name];
}
