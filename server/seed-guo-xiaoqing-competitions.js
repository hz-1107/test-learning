// 為學生「郭小晴」補競賽經歷（測試資料），學生端「競賽歷程」與教師端「學生管理」皆讀取同一張 competitions 資料表
// 執行方式：cd server && node seed-guo-xiaoqing-competitions.js
// 可重複執行：同名稱且同日期的競賽會略過，不會重複新增
const db = require('./config/db');

const STUDENT_NAME = '郭小晴';

// 每筆競賽：主辦單位、競賽名稱、日期、等級、名次、成績、隊伍名稱、競賽說明
// 時間與內容對應她的「科創機器人」上課紀錄（循線車 → 避障車 → 迷宮挑戰），由縣市賽逐步挑戰到國際賽
const competitions = [
  ['市政府教育局', '114學年度市長盃創意機器人競賽', '2026-07-25', 'county', '佳作', '82分', '晴空小隊',
    '小晴第一次參加校外機器人競賽，與隊友合作完成循序前進與碰撞感測任務。比賽中車子一度偏離路線，她冷靜檢查程式後找出轉彎秒數設定的問題並完成修正，最終獲得佳作，累積了寶貴的實戰經驗。'],
  ['台灣青少年機器人協會', '青少年機器人循線競速賽 北區初賽', '2026-08-15', 'regional', '第二名', '完賽時間 28.4 秒', '晴空小隊',
    '小晴運用課堂所學的循線感測技巧，反覆調整感測數值與轉彎速度，讓車子在彎道也能穩定前進。她在隊伍中負責程式撰寫與測試，與隊友分工明確，最終以穩定的表現拿下北區初賽第二名。'],
  ['全國科技教育推廣協會', '全國STEAM創客機器人大賽 避障挑戰組', '2026-09-05', 'national', '第一名', '96分', '晴空小隊',
    '小晴擔任隊伍的程式負責人，以超音波測距設計避障邏輯，並將程式拆分成副程式讓結構更清楚。決賽前她獨立找出感測距離設定的錯誤，車子順利通過全部障礙關卡，以全場最高分榮獲全國第一名。'],
  ['國際青少年機器人教育聯盟', '亞洲青少年機器人邀請賽 迷宮任務組', '2026-09-26', 'international', '優勝', '88分', 'Sunny Bots',
    '小晴首次挑戰國際賽事，與來自不同國家的隊伍同場競技。她提出獨特的迷宮轉向策略，並在比賽現場主動協助隊友除錯，展現良好的團隊合作與臨場應變能力，最終獲得優勝肯定。']
];

(async () => {
  const student = await db.queryOne(
    'SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.name = ?',
    [STUDENT_NAME]
  );
  if (!student) throw new Error(`找不到學生：${STUDENT_NAME}`);

  let created = 0;

  for (const [organizer, title, date, level, rankName, score, teamName, description] of competitions) {
    const exists = await db.queryOne(
      'SELECT id FROM competitions WHERE student_id = ? AND title = ? AND competition_date = ?',
      [student.id, title, date]
    );
    if (exists) {
      console.log(`略過 ${date}：已有競賽紀錄「${title}」`);
      continue;
    }

    await db.insert(`
      INSERT INTO competitions (student_id, organizer, title, competition_date, level, rank_name, score, team_name, description)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [student.id, organizer, title, date, level, rankName, score, teamName, description]);
    created++;
  }

  console.log(`完成：新增競賽紀錄 ${created} 筆`);
  process.exit(0);
})().catch(err => {
  console.error('執行失敗：', err);
  process.exit(1);
});
