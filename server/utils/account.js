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

module.exports = { generateUsername, birthdayPassword };
