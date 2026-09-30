/**
 * 新增示範老師、課程與固定課表，讓行政端「課表」頁面有足夠資料呈現。
 * 用法： node seed-teachers.js          （已建立過的會略過，可重複執行）
 * 清除： node seed-teachers.js --clean  （刪除本腳本建立的示範資料）
 *
 * 標記方式：users.email = 'seed-demo@example.local'，teachers.notes / courses.description 以 '[seed-demo]' 開頭
 * 老師帳號為 LINE ID，密碼為生日（YYYYMMDD），與行政端「新增老師」規則相同
 */
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const SEED_EMAIL = 'seed-demo@example.local';
const SEED_NOTE = '[seed-demo]';

// 教室：1 = 西屯教室，2 = 沙鹿教室
// 課程類型：1 幼兒簡易機械、2 動力機械、3 程式機械、4 科創機器人、5 專題班
const teachers = [
  {
    name: '林老師', line_id: 'lin_teacher', phone: '0911-222-333', birthday: '1989-04-12',
    school: '台中教育大學', hire_date: '2024-02-01', notes: '程式機械主教，擅長引導孩子拆解問題',
    courses: [
      { name: '程式機械進階班', type: 3, age: '10-12歲', schedules: [[1, '18:30', '20:00', 1], [6, '10:00', '11:30', 1]] },
      { name: '程式機械入門班', type: 3, age: '8-10歲', schedules: [[3, '16:00', '17:30', 2]] },
      { name: '程式機械平日班', type: 3, age: '9-12歲', schedules: [[4, '10:00', '11:30', 1], [4, '18:30', '20:00', 2]] }
    ]
  },
  {
    name: '黃老師', line_id: 'huang_kids', phone: '0922-333-444', birthday: '1993-07-08',
    school: '靜宜大學', hire_date: '2025-03-15', notes: '幼兒班老師，親切有耐心',
    courses: [
      { name: '幼兒簡易機械A班', type: 1, age: '4-6歲', schedules: [[1, '16:00', '17:00', 2], [3, '10:00', '11:00', 1]] },
      { name: '幼兒簡易機械B班', type: 1, age: '5-7歲', schedules: [[6, '09:00', '10:00', 2]] },
      { name: '幼兒簡易機械C班', type: 1, age: '4-6歲', schedules: [[4, '09:00', '10:00', 1], [4, '16:30', '17:30', 1]] }
    ]
  },
  {
    name: '吳老師', line_id: 'wu_power', phone: '0933-444-555', birthday: '1987-11-20',
    school: '勤益科大', hire_date: '2023-09-01', notes: '動力機械專長，帶過多屆競賽',
    courses: [
      { name: '動力機械B班', type: 2, age: '9-12歲', schedules: [[2, '18:30', '20:00', 2], [5, '16:00', '17:30', 1]] },
      { name: '動力機械假日班', type: 2, age: '9-12歲', schedules: [[0, '14:00', '15:30', 1]] },
      { name: '動力機械C班', type: 2, age: '9-12歲', schedules: [[4, '09:30', '11:00', 2], [4, '15:00', '16:30', 1]] }
    ]
  },
  {
    name: '蔡老師', line_id: 'tsai_project', phone: '0944-555-666', birthday: '1991-02-27',
    school: '中興大學', hire_date: '2024-08-01', notes: '專題班指導，負責競賽作品',
    courses: [
      { name: '專題實作班', type: 5, age: '11-15歲', schedules: [[4, '16:00', '18:00', 2], [6, '14:00', '16:00', 1]] }
    ]
  },
  {
    name: '楊老師', line_id: 'yang_robot', phone: '0955-666-777', birthday: '1995-05-03',
    school: '逢甲大學', hire_date: '2025-07-01', notes: '科創機器人老師，熟悉感測器應用',
    courses: [
      { name: '科創機器人週末班', type: 4, age: '8-12歲', schedules: [[6, '10:00', '11:30', 2], [0, '10:00', '11:30', 1]] },
      { name: '科創機器人晚間班', type: 4, age: '10-13歲', schedules: [[5, '18:30', '20:00', 2]] },
      { name: '科創機器人平日班', type: 4, age: '8-12歲', schedules: [[4, '11:00', '12:30', 2], [4, '13:00', '14:30', 1]] }
    ]
  }
];

async function clean() {
  const courses = await db.query(`SELECT id FROM courses WHERE description LIKE ?`, [`${SEED_NOTE}%`]);
  const courseIds = courses.map(c => c.id);
  if (courseIds.length) {
    const inList = courseIds.join(',');
    // 依外鍵順序刪除：日誌 → 調課 → 選課 → 課表 → 課程
    await db.update(`DELETE FROM course_logs WHERE course_id IN (${inList})`);
    await db.update(`DELETE sa FROM schedule_adjustments sa JOIN course_schedules cs ON sa.schedule_id = cs.id WHERE cs.course_id IN (${inList})`);
    await db.update(`DELETE FROM course_enrollments WHERE course_id IN (${inList})`);
    await db.update(`DELETE FROM course_schedules WHERE course_id IN (${inList})`);
    await db.update(`DELETE FROM courses WHERE id IN (${inList})`);
  }
  const users = await db.query(
    `SELECT u.id FROM users u JOIN teachers t ON t.user_id = u.id WHERE u.email = ? AND t.notes LIKE ?`,
    [SEED_EMAIL, `${SEED_NOTE}%`]
  );
  for (const u of users) {
    await db.update('DELETE FROM users WHERE id = ?', [u.id]); // teachers 以 ON DELETE CASCADE 一併刪除
  }
  console.log(`已清除：課程 ${courseIds.length} 門、老師 ${users.length} 位`);
}

async function seed() {
  const demoStudents = (await db.query(
    `SELECT id FROM students WHERE notes = ? ORDER BY id`, [SEED_NOTE]
  )).map(s => s.id);

  let teacherCount = 0, courseCount = 0, scheduleCount = 0, enrollCount = 0;
  let studentCursor = 0;

  for (const t of teachers) {
    let user = await db.queryOne('SELECT id FROM users WHERE username = ?', [t.line_id]);
    let teacherId;
    if (user) {
      const row = await db.queryOne('SELECT id FROM teachers WHERE user_id = ?', [user.id]);
      teacherId = row.id;
    } else {
      const hashed = await bcrypt.hash(t.birthday.replace(/-/g, ''), 10);
      const userId = await db.insert(
        'INSERT INTO users (username, password, name, email, phone, birthday, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [t.line_id, hashed, t.name, SEED_EMAIL, t.phone, t.birthday, 'teacher']
      );
      teacherId = await db.insert(
        'INSERT INTO teachers (user_id, school, hire_date, notes) VALUES (?, ?, ?, ?)',
        [userId, t.school, t.hire_date, `${SEED_NOTE} ${t.notes}`]
      );
      teacherCount++;
    }

    for (const c of t.courses) {
      const existing = await db.queryOne(
        'SELECT id FROM courses WHERE name = ? AND description LIKE ?', [c.name, `${SEED_NOTE}%`]
      );
      if (existing) continue;

      const firstRoom = c.schedules[0][3];
      const courseId = await db.insert(`
        INSERT INTO courses (course_type_id, name, description, age_range, teacher_id, classroom_id, max_students, status)
        VALUES (?, ?, ?, ?, ?, ?, 10, 'active')
      `, [c.type, c.name, `${SEED_NOTE} 示範課程`, c.age, teacherId, firstRoom]);
      courseCount++;

      for (const [day, start, end, room] of c.schedules) {
        const scheduleId = await db.insert(`
          INSERT INTO course_schedules (course_id, teacher_id, classroom_id, day_of_week, start_time, end_time, is_active)
          VALUES (?, ?, ?, ?, ?, ?, 1)
        `, [courseId, teacherId, room, day, `${start}:00`, `${end}:00`]);
        scheduleCount++;

        // 每個時段分配 3~5 位示範學生（同一門課內學生不重複）
        const size = 3 + (scheduleId % 3);
        for (let i = 0; i < size && demoStudents.length; i++) {
          const studentId = demoStudents[studentCursor % demoStudents.length];
          studentCursor++;
          const dup = await db.queryOne(
            'SELECT id FROM course_enrollments WHERE course_id = ? AND student_id = ?', [courseId, studentId]
          );
          if (dup) continue;
          await db.insert(
            `INSERT INTO course_enrollments (course_id, student_id, schedule_id, status) VALUES (?, ?, ?, 'enrolled')`,
            [courseId, studentId, scheduleId]
          );
          enrollCount++;
        }
      }
    }
  }

  console.log(`完成：新增老師 ${teacherCount} 位、課程 ${courseCount} 門、課表時段 ${scheduleCount} 筆、選課 ${enrollCount} 筆`);
}

(async () => {
  if (process.argv.includes('--clean')) await clean();
  else await seed();
  process.exit(0);
})().catch(err => {
  console.error('執行失敗：', err);
  process.exit(1);
});
