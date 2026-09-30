// 為學生「郭小晴」補上課紀錄（測試資料），用於檢視近6週/近12週學習趨勢圖
// 執行方式：cd server && node seed-guo-xiaoqing-records.js
// 可重複執行：已存在的日誌 / 學生紀錄會略過，不會重複新增
const db = require('./config/db');

const STUDENT_NAME = '郭小晴';
const SCHEDULE_ID = 19; // 科創機器人，週二 16:00-17:30

// 每堂課：日期、主題（新建日誌用）、程式、除錯、創意、結構、團隊合作、點數、課堂表現
// 分數整體緩步上升並帶些起伏，讓趨勢圖較真實
const lessons = [
  ['2026-06-30', '認識機器人與感測器', 2, 1, 3, 2, 3, 3, '初次接觸機器人，對感測器很好奇，操作上仍需協助。'],
  ['2026-07-07', '馬達控制基礎', 2, 2, 3, 2, 3, 3, '能依步驟完成馬達接線，程式需在老師提示下完成。'],
  ['2026-07-14', '循序結構：讓車子動起來', 3, 2, 3, 2, 3, 4, '理解循序執行概念，能讓車子依指令前進與轉彎。'],
  ['2026-07-21', '條件判斷：碰撞感測', 3, 2, 4, 3, 3, 4, '能使用條件判斷處理碰撞，並自行加入聲音回饋的創意。'],
  ['2026-07-28', '迴圈：重複動作與巡邏', 3, 3, 3, 3, 3, 4, '能用迴圈簡化重複指令，偶爾忘記設定結束條件。'],
  ['2026-08-04', '循線車（上）', 3, 3, 3, 3, 4, 4, '循線感測數值調整有耐心，與組員分工良好。'],
  ['2026-08-11', '循線車（下）', 3, 3, 4, 3, 4, 5, '成功完成循線車，並嘗試優化轉彎速度。'],
  ['2026-08-18', '超音波測距原理', 4, 3, 4, 3, 3, 5, '理解超音波測距原理，能讀取並顯示距離數值。'],
  ['2026-08-25', '避障車設計', 4, 4, 4, 4, 4, 5, '避障車邏輯清楚，能獨立找出感測距離設定錯誤。'],
  ['2026-09-01', '小組任務：迷宮挑戰', 4, 3, 5, 4, 5, 6, '迷宮挑戰中擔任程式負責人，提出獨特的轉向策略。'],
  // 以下兩堂日誌已存在（狀態維持不變），只補學生紀錄
  ['2026-09-15', null, 4, 4, 4, 4, 4, 5, '能將程式拆分成副程式，結構更清楚。'],
  ['2026-09-22', null, 5, 4, 5, 4, 4, 6, '主動協助同學除錯，作品完成度高。']
];

(async () => {
  const student = await db.queryOne(
    'SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.name = ?',
    [STUDENT_NAME]
  );
  if (!student) throw new Error(`找不到學生：${STUDENT_NAME}`);

  const schedule = await db.queryOne('SELECT * FROM course_schedules WHERE id = ?', [SCHEDULE_ID]);
  if (!schedule) throw new Error(`找不到排程：${SCHEDULE_ID}`);

  let logsCreated = 0;
  let recordsCreated = 0;

  for (const [date, topic, p, d, c, s, t, points, performance] of lessons) {
    let log = await db.queryOne(
      'SELECT id FROM course_logs WHERE schedule_id = ? AND log_date = ?',
      [SCHEDULE_ID, date]
    );

    if (!log) {
      if (!topic) {
        console.log(`略過 ${date}：日誌不存在`);
        continue;
      }
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
