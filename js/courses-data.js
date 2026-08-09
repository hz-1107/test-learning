/**
 * 全系統課程資料（單一資料來源）
 * 供 課程資訊 > 課程管理 使用，課程名稱同步供 班級管理 選課下拉選單使用
 */
const COURSE_STORAGE_KEY = 'slh_courses_v1';

const DEFAULT_COURSES = [
  { id: 1, name: '幼兒簡易機械', description: '搭配工程機械積木的組裝，以顏色認知、簡易數理計算、3D空間概念，孩子的創作思維、建構組裝能力及手部肌肉操作等。', active: true, ageRange: '3~6歲' },
  { id: 2, name: '動力機械', description: '搭配樂高教育系列積木的組裝，以基礎機械原理建構、齒輪滑輪、邏輯思考組裝能力、創作技巧等。', active: true, ageRange: '7~8歲' },
  { id: 3, name: '程式機械', description: '搭配樂高教育系列積木的組裝，以進階機械原理、簡易邏輯程式編程、圖控程式應用、機構組裝等。', active: true, ageRange: '9~10歲' },
  { id: 4, name: '科創機器人', description: '科技領域程式課程，以商用機械機構原理、提供更多多感應器應用、物理原理與程式邏輯上應互相搭配。', active: false, ageRange: '10歲+' },
];

function loadCourses() {
  try {
    const raw = localStorage.getItem(COURSE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch (e) {
    console.warn('讀取課程資料失敗，改用預設資料', e);
  }
  return DEFAULT_COURSES.map(c => ({ ...c }));
}

function saveCourses(courses) {
  localStorage.setItem(COURSE_STORAGE_KEY, JSON.stringify(courses));
}
