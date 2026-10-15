const bcrypt = require('bcryptjs');
const db = require('../config/db');

// 登入以「姓名 + 生日」驗證（見 authController.login），users.username 僅作為內部唯一識別。
// 以姓名產生不重複的 username；同名時依序加上 2、3…
async function generateUsername(name) {
  const base = String(name).trim().slice(0, 44);
  let username = base;
  let n = 1;
  while (await db.queryOne('SELECT id FROM users WHERE username = ?', [username])) {
    n += 1;
    username = `${base}${n}`;
  }
  return username;
}

// 預設密碼：西元生日 YYYYMMDD
function birthdayPassword(birthday) {
  return String(birthday).slice(0, 10).replace(/-/g, '');
}

// 生日有更動時，登入密碼同步改為新生日（登入以「姓名 + 生日」驗證）。
// 需在更新 users.birthday「之前」呼叫，才能比對出是否有更動。
async function syncBirthdayPassword(userId, newBirthday) {
  if (!newBirthday) return;
  const user = await db.queryOne('SELECT birthday FROM users WHERE id = ?', [userId]);
  if (!user) return;

  const newPassword = birthdayPassword(newBirthday);
  if (user.birthday && birthdayPassword(user.birthday) === newPassword) return;

  const hashedPassword = await bcrypt.hash(newPassword, 10);
  await db.update('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
}

// 登入以「姓名 + 生日」辨識帳號，同名又同生日（密碼相同）時會登入到錯誤的帳號。
// 檢查是否已有其他帳號的姓名與生日密碼完全相同；有衝突時回傳錯誤訊息，否則回傳 null。
// name / birthday 未提供時沿用該帳號目前的資料（供部分欄位更新使用）。
async function checkLoginConflict(name, birthday, excludeUserId = null) {
  if (excludeUserId && (!name || !birthday)) {
    const current = await db.queryOne('SELECT name, birthday FROM users WHERE id = ?', [excludeUserId]);
    if (current) {
      name = name || current.name;
      birthday = birthday || current.birthday;
    }
  }
  if (!name || !birthday) return null;

  const account = String(name).trim();
  const password = birthdayPassword(birthday);
  const others = await db.query(
    'SELECT id, password FROM users WHERE (name = ? OR username = ?) AND id <> ?',
    [account, account, excludeUserId || 0]
  );
  for (const other of others) {
    if (await bcrypt.compare(password, other.password)) {
      return `已有同名且同生日的帳號「${account}」，登入時無法區分，請在姓名加註以區別（例如：${account}(老師)）`;
    }
  }
  return null;
}

module.exports = { generateUsername, birthdayPassword, syncBirthdayPassword, checkLoginConflict };
