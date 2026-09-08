/**
 * 隨機新增示範學生資料，讓「學生管理」頁面出現第二頁（每頁 20 筆）。
 * 用法： node seed-students.js [目標總數，預設 30]
 * 清除： node seed-students.js --clean   （刪除本腳本建立的示範資料）
 *
 * 標記方式：users.email = 'seed-demo@example.local'，students.notes = '[seed-demo]'
 */
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const SEED_EMAIL = 'seed-demo@example.local';
const SEED_NOTE = '[seed-demo]';

const surnames = '陳林黃張李王吳劉蔡楊許鄭謝郭洪曾邱廖賴周葉'.split('');
const givenSafe = ['宇軒', '子涵', '欣妍', '承恩', '雨彤', '柏睿', '思妤', '冠廷', '品妍', '睿宸',
  '子晴', '彥廷', '詩涵', '祐霆', '若晴', '柏宇', '心怡', '家豪', '筱庭', '哲瑋',
  '亭妤', '奕辰', '婉婷', '珮瑜', '博文', '芷萱', '冠宇', '思彤', '宥辰', '恩綺'];
const schools = ['太平國小', '光復國小', '省三國小', '大元國小', '大進國小', '永春國小',
  '何厝國小', '惠文國小', '軍功國小', '東光國小', '文昌國小', '塗城國小'];
const grades = ['幼兒', '小一', '小二', '小三', '小四', '小五', '小六', '國一'];
const genders = ['male', 'female'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pad(n, len) { return String(n).padStart(len, '0'); }
function randDate(startYear, endYear) {
  const y = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
  const m = 1 + Math.floor(Math.random() * 12);
  const d = 1 + Math.floor(Math.random() * 28);
  return `${y}-${pad(m, 2)}-${pad(d, 2)}`;
}

async function clean() {
  const before = (await db.queryOne('SELECT COUNT(*) n FROM students')).n;
  const affected = await db.update(
    `DELETE u FROM users u WHERE u.email = ?`, [SEED_EMAIL]
  );
  const after = (await db.queryOne('SELECT COUNT(*) n FROM students')).n;
  console.log(`已刪除 ${affected} 位示範使用者（連帶學生）。學生數 ${before} → ${after}`);
}

async function seed(target) {
  const current = (await db.queryOne('SELECT COUNT(*) n FROM students')).n;
  console.log(`目前學生數：${current}，目標：${target}`);
  if (current >= target) {
    console.log('已達目標，無需新增。若要重設請先執行： node seed-students.js --clean');
    return;
  }

  const classrooms = (await db.query('SELECT id FROM classrooms')).map(r => r.id);
  const courseTypes = (await db.query('SELECT id FROM course_types')).map(r => r.id);
  const teachers = (await db.query('SELECT id FROM teachers')).map(r => r.id);
  if (!classrooms.length || !courseTypes.length) {
    throw new Error('缺少 classrooms 或 course_types 基礎資料，無法建立學生');
  }

  // 已使用的電話（帳號）
  const usedPhones = new Set((await db.query('SELECT username FROM users')).map(r => r.username));
  function newPhone() {
    let p;
    do { p = '09' + pad(Math.floor(Math.random() * 1e8), 8); } while (usedPhones.has(p));
    usedPhones.add(p);
    return p;
  }

  const toAdd = target - current;
  let ok = 0;
  for (let i = 0; i < toAdd; i++) {
    const name = rand(surnames) + rand(givenSafe);
    const birthday = randDate(2013, 2021);         // 5~13 歲
    const enrollment = randDate(2025, 2026);
    const fatherPhone = newPhone();
    const motherPhone = newPhone();
    const password = await bcrypt.hash(birthday.replace(/-/g, ''), 10);

    const conn = await db.pool.getConnection();
    try {
      await conn.beginTransaction();
      const [u] = await conn.execute(
        `INSERT INTO users (username, password, email, name, phone, birthday, role)
         VALUES (?, ?, ?, ?, ?, ?, 'student')`,
        [fatherPhone, password, SEED_EMAIL, name, fatherPhone, birthday]
      );
      await conn.execute(
        `INSERT INTO students
           (user_id, birth_date, gender, school, grade, enrollment_date,
            teacher_id, classroom_id, course_type_id,
            parent_name_father, parent_phone_father,
            parent_name_mother, parent_phone_mother,
            lesson_count, status, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          u.insertId, birthday, rand(genders), rand(schools), rand(grades), enrollment,
          teachers.length ? rand(teachers) : null, rand(classrooms), rand(courseTypes),
          rand(surnames) + '爸爸', fatherPhone,
          rand(surnames) + '媽媽', motherPhone,
          Math.floor(Math.random() * 24), SEED_NOTE
        ]
      );
      await conn.commit();
      ok++;
    } catch (e) {
      await conn.rollback();
      console.error(`第 ${i + 1} 筆失敗：`, e.message);
    } finally {
      conn.release();
    }
  }

  const finalCount = (await db.queryOne('SELECT COUNT(*) n FROM students')).n;
  console.log(`新增 ${ok} 位學生。學生數 ${current} → ${finalCount}（每頁 20 筆 → 共 ${Math.ceil(finalCount / 20)} 頁）`);
}

(async () => {
  try {
    if (!(await db.testConnection())) process.exit(1);
    if (process.argv.includes('--clean')) {
      await clean();
    } else {
      const target = parseInt(process.argv[2], 10) || 30;
      await seed(target);
    }
  } catch (e) {
    console.error('執行失敗：', e);
    process.exitCode = 1;
  } finally {
    await db.pool.end();
  }
})();
