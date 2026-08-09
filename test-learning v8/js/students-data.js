/**
 * 全系統學生名單與課程標籤設定（單一資料來源）
 * 供 學生管理、班級管理、課表排程 等頁面共用
 */
const STUDENT_ROSTER = [
  { name: '張小明', course: '動力機械', day: '週二', time: '17:00~19:00', room: '沙鹿', teacher: '柯老師', school: '沙鹿國小', grade: '3年級' },
  { name: '李美華', course: '程式機械', day: '週二', time: '17:00~19:00', room: '西屯', teacher: '陳老師', school: '西屯國小', grade: '5年級' },
  { name: '王大明', course: '科創機器人', day: '週三', time: '17:30~19:00', room: '沙鹿', teacher: '顏老師', school: '大肚國中', grade: '國一' },
  { name: '陳小芳', course: '程式機械', day: '週三', time: '17:00~18:00', room: '西屯', teacher: '陳老師', school: '永安國小', grade: '4年級' },
  { name: '林志豪', course: '幼兒簡易機械', day: '週三', time: '18:00~19:00', room: '沙鹿', teacher: '顏老師', school: '沙鹿幼兒園', grade: '大班' },
  { name: '黃雅琪', course: '動力機械', day: '週三', time: '17:00~18:00', room: '西屯', teacher: '羅老師', school: '西屯國小', grade: '6年級' },
  { name: '吳建宏', course: '動力機械', day: '週五', time: '18:00~20:00', room: '沙鹿', teacher: '陳老師', school: '大同國小', grade: '4年級' },
  { name: '劉恩妤', course: '程式機械', day: '週二', time: '17:00~19:00', room: '西屯', teacher: '何老師', school: '四箴國小', grade: '5年級' },
  { name: '蔡宇翔', course: '科創機器人', day: '週二', time: '17:00~19:00', room: '西屯', teacher: '廖老師', school: '弘文國中', grade: '國二' },
  { name: '楊語婷', course: '程式機械', day: '週三', time: '17:00~20:00', room: '西屯', teacher: '王老師', school: '安和國小', grade: '6年級' },
  { name: '許承恩', course: '動力機械', day: '週二', time: '16:00~18:00', room: '沙鹿', teacher: '羅老師', school: '西屯國小', grade: '5年級' },
  { name: '鄭欣妍', course: '幼兒簡易機械', day: '週四', time: '16:00~17:00', room: '西屯', teacher: '王老師', school: '弘光幼兒園', grade: '中班' },
  { name: '謝冠霖', course: '程式機械', day: '週三', time: '17:00~20:00', room: '西屯', teacher: '王老師', school: '沙鹿國小', grade: '4年級' },
  { name: '郭子睿', course: '動力機械', day: '週二', time: '16:00~18:00', room: '沙鹿', teacher: '羅老師', school: '大道國中', grade: '國一' },
  { name: '洪柔萱', course: '科創機器人', day: '週二', time: '17:00~19:00', room: '西屯', teacher: '廖老師', school: '西屯國小', grade: '6年級' },
  { name: '曾昊平', course: '動力機械', day: '週二', time: '18:00~20:00', room: '西屯', teacher: '顏老師', school: '福科國中', grade: '國二' },
  { name: '廖詩涵', course: '程式機械', day: '週二', time: '17:00~19:00', room: '西屯', teacher: '何老師', school: '永安國小', grade: '3年級' },
  { name: '賴宸翊', course: '幼兒簡易機械', day: '週二', time: '18:00~20:00', room: '西屯', teacher: '顏老師', school: '大墩幼兒園', grade: '大班' },
  { name: '徐俊彥', course: '動力機械', day: '週二', time: '18:00~20:00', room: '西屯', teacher: '顏老師', school: '沙鹿國小', grade: '6年級' },
  { name: '周芯妤', course: '程式機械', day: '週二', time: '18:00~20:00', room: '西屯', teacher: '陳老師', school: '安和國小', grade: '5年級' },
  { name: '葉家安', course: '科創機器人', day: '週二', time: '19:00~21:00', room: '沙鹿', teacher: '羅老師', school: '大肚國中', grade: '國三' },
  { name: '蘇明霆', course: '動力機械', day: '週二', time: '14:00~16:00', room: '西屯', teacher: '顏老師', school: '西屯國小', grade: '4年級' },
  { name: '莊怡珊', course: '程式機械', day: '週二', time: '18:30~20:30', room: '沙鹿', teacher: '王老師', school: '四箴國小', grade: '3年級' },
  { name: '呂建霖', course: '動力機械', day: '週二', time: '19:00~21:00', room: '沙鹿', teacher: '羅老師', school: '沙鹿國小', grade: '5年級' },
  { name: '江宇恩', course: '科創機器人', day: '週三', time: '17:30~19:00', room: '西屯', teacher: '顏老師', school: '弘文國中', grade: '國一' },
  { name: '何雅萱', course: '程式機械', day: '週三', time: '17:00~18:00', room: '西屯', teacher: '陳老師', school: '永安國小', grade: '6年級' },
  { name: '蕭妍宇', course: '動力機械', day: '週二', time: '14:00~16:00', room: '西屯', teacher: '顏老師', school: '大同國小', grade: '4年級' },
  { name: '羅子霖', course: '幼兒簡易機械', day: '週四', time: '18:00~20:00', room: '沙鹿', teacher: '柯老師', school: '沙鹿幼兒園', grade: '小班' },
  { name: '高詩宸', course: '程式機械', day: '週二', time: '18:30~20:30', room: '沙鹿', teacher: '王老師', school: '西屯國小', grade: '5年級' },
  { name: '潘怡安', course: '科創機器人', day: '週五', time: '17:00~19:00', room: '西屯', teacher: '王老師', school: '大道國中', grade: '國二' },
  { name: '陳建昊', course: '動力機械', day: '週二', time: '19:00~21:00', room: '沙鹿', teacher: '羅老師', school: '沙鹿國小', grade: '3年級' },
  { name: '林雅琪', course: '程式機械', day: '週三', time: '17:00~18:00', room: '西屯', teacher: '陳老師', school: '安和國小', grade: '4年級' },
  { name: '黃承翔', course: '動力機械', day: '週四', time: '18:00~20:00', room: '沙鹿', teacher: '柯老師', school: '西屯國小', grade: '6年級' },
  { name: '張詩妍', course: '科創機器人', day: '週五', time: '17:00~19:00', room: '西屯', teacher: '王老師', school: '大肚國中', grade: '國一' },
  { name: '李冠宇', course: '程式機械', day: '週六', time: '09:00~11:00', room: '沙鹿', teacher: '陳老師', school: '四箴國小', grade: '5年級' },
  { name: '王柔恩', course: '幼兒簡易機械', day: '週三', time: '18:00~19:00', room: '沙鹿', teacher: '顏老師', school: '弘光幼兒園', grade: '中班' },
];

const COURSE_TAG_META = {
  '動力機械': { tag: '動力', bg: '#FFEDD4', color: '#CA3500' },
  '程式機械': { tag: '程式', bg: '#D0FAE5', color: '#007A55' },
  '科創機器人': { tag: '科創', bg: '#EDE9FE', color: '#7008E7' },
  '幼兒簡易機械': { tag: '幼兒', bg: '#FCE7F3', color: '#BE185D' },
  '專題班': { tag: '專題', bg: '#CCFBF1', color: '#0F766E' },
};

function getCourseTagMeta(courseName) {
  return COURSE_TAG_META[courseName] || { tag: courseName.slice(0, 2), bg: '#FFF3C4', color: '#755F00' };
}

function findStudentByName(name) {
  return STUDENT_ROSTER.find(s => s.name === name);
}
