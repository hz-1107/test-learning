// 為學生「郭小晴」補一門「歷史課程」（測試資料），用於檢視教師端「查看檔案 → 歷史課程 → 查看」
// 與學生端「歷史課程」的畫面：升上目前的科創機器人之前，先上過程式機械進階班
// 執行方式：cd server && node seed-guo-xiaoqing-history.js
// 可重複執行：已存在的報名 / 日誌 / 學生紀錄會略過，不會重複新增
const db = require('./config/db');

const STUDENT_NAME = '郭小晴';
const SCHEDULE_ID = 21; // 程式機械進階班，週六 10:00-11:30
const ENROLLED_AT = '2026-03-01 10:00:00';

// 每堂課：日期、主題、程式、除錯、創意、結構、團隊合作、點數、課堂表現
// 時間在目前課程（科創機器人，2026-06-30 起）之前，分數由低緩步上升
const lessons = [
  ['2026-03-07', '認識程式積木與主機', 1, 1, 2, 2, 2, 3, '第一次接觸圖控程式，能跟著步驟完成範例。'],
  ['2026-03-14', '馬達轉動與方向控制', 2, 1, 2, 2, 3, 3, '能讓馬達正反轉，接線位置還需要提醒。'],
  ['2026-03-21', '等待與時間控制', 2, 2, 3, 2, 3, 3, '理解等待積木的用途，嘗試調整秒數觀察差異。'],
  ['2026-03-28', '觸碰感應器：按下就啟動', 2, 2, 3, 3, 3, 4, '能用觸碰感應器啟動機構，機構組裝穩固。'],
  ['2026-04-11', '迴圈：重複執行的機關', 3, 2, 3, 3, 3, 4, '學會使用迴圈，作品能持續運轉。'],
  ['2026-04-18', '顏色感應器分類機', 3, 2, 4, 3, 3, 4, '分類機加入自己的顏色規則，很有想法。'],
  ['2026-04-25', '條件判斷：如果…就…', 3, 3, 3, 3, 4, 4, '能說出條件判斷的流程，與組員討論熱烈。'],
  ['2026-05-09', '齒輪傳動與速度變化', 3, 3, 4, 4, 3, 5, '理解大小齒輪對速度的影響，結構設計進步明顯。'],
  ['2026-05-16', '自動門專題（上）', 3, 3, 4, 4, 4, 5, '負責自動門的程式設計，能自己找出感應範圍的問題。'],
  ['2026-05-23', '自動門專題（下）', 4, 3, 4, 4, 4, 5, '完成自動門並上台說明運作方式，表達清楚。'],
  ['2026-06-06', '期末創作：我的機械裝置', 4, 3, 5, 4, 4, 6, '期末作品結合感應器與迴圈，創意與完成度都很好。'],
  ['2026-06-13', '期末成果發表', 4, 4, 5, 4, 5, 6, '成果發表表現穩健，並主動協助同學除錯，順利結業。']
];

(async () => {
  const student = await db.queryOne(
    'SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.name = ?',
    [STUDENT_NAME]
  );
  if (!student) throw new Error(`找不到學生：${STUDENT_NAME}`);

  const schedule = await db.queryOne('SELECT * FROM course_schedules WHERE id = ?', [SCHEDULE_ID]);
  if (!schedule) throw new Error(`找不到排程：${SCHEDULE_ID}`);

  // 報名紀錄：已結業（學生端「歷史課程」以報名紀錄顯示「已結業」）
  const enrollment = await db.queryOne(
    'SELECT id FROM course_enrollments WHERE schedule_id = ? AND student_id = ?',
    [SCHEDULE_ID, student.id]
  );
  if (enrollment) {
    console.log('略過報名紀錄：已存在');
  } else {
    await db.insert(
      "INSERT INTO course_enrollments (course_id, schedule_id, student_id, status, enrolled_at) VALUES (?, ?, ?, 'completed', ?)",
      [schedule.course_id, SCHEDULE_ID, student.id, ENROLLED_AT]
    );
    console.log('新增報名紀錄：已結業');
  }

  let logsCreated = 0;
  let recordsCreated = 0;

  for (const [date, topic, p, d, c, s, t, points, performance] of lessons) {
    let log = await db.queryOne(
      'SELECT id FROM course_logs WHERE schedule_id = ? AND log_date = ?',
      [SCHEDULE_ID, date]
    );

    if (!log) {
      const logId = await db.insert(`
        INSERT INTO course_logs (course_id, schedule_id, log_date, start_time, end_time,
          classroom_id, teacher_id, topic, content, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed')
      `, [schedule.course_id, SCHEDULE_ID, date, schedule.start_time, schedule.end_time,
          schedule.classroom_id, schedule.teacher_id, topic, `本堂課主題：${topic}`]);
      log = { id: logId };
      logsCreated++;
    }

    const exists = await db.queryOne(
      'SELECT id FROM student_log_records WHERE log_id = ? AND student_id = ?',
      [log.id, student.id]
    );
    if (exists) {
      console.log(`略過 ${date}：已有學生紀錄`);
      continue;
    }

    await db.insert(`
      INSERT INTO student_log_records (log_id, student_id, attendance, performance,
        skill_programming, skill_debugging, skill_creativity, skill_structure, skill_teamwork, points_earned)
      VALUES (?, ?, 'present', ?, ?, ?, ?, ?, ?, ?)
    `, [log.id, student.id, performance, p, d, c, s, t, points]);
    recordsCreated++;
  }

  console.log(`完成：新增日誌 ${logsCreated} 筆，新增學生紀錄 ${recordsCreated} 筆`);
  process.exit(0);
})().catch(err => {
  console.error('執行失敗：', err);
  process.exit(1);
});
