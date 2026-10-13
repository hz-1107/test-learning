// 學生頭像：依性別顯示男生／女生圖示，未填寫性別時顯示中性圖示
(function () {
  const SVG_OPEN = '<svg viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%;display:block;border-radius:50%;"';
  const BODY_PATH = 'M6 40c0-8 6-12 14-12s14 4 14 12z';
  const FACE = `
    <circle cx="20" cy="17" r="8.5" fill="#fcd9b8"/>
    <circle cx="17" cy="18" r="1" fill="#4b3621"/>
    <circle cx="23" cy="18" r="1" fill="#4b3621"/>
    <path d="M17.5 21.5q2.5 2 5 0" fill="none" stroke="#4b3621" stroke-width="1" stroke-linecap="round"/>`;

  const AVATARS = {
    male: `${SVG_OPEN} role="img" aria-label="男生"><title>男生</title>
    <rect width="40" height="40" fill="#dbeafe"/>
    <path d="${BODY_PATH}" fill="#3b82f6"/>${FACE}
    <path d="M11 17c-1-7 3-11.5 9-11.5s10 4.5 9 11.5c-1.5-3.5-4-5.5-9-5.5s-7.5 2-9 5.5z" fill="#4b3621"/>
  </svg>`,
    female: `${SVG_OPEN} role="img" aria-label="女生"><title>女生</title>
    <rect width="40" height="40" fill="#fce7f3"/>
    <path d="M9.5 30c-2-14 2-24.5 10.5-24.5S32.5 16 30.5 30z" fill="#6b3f2a"/>
    <path d="${BODY_PATH}" fill="#ec4899"/>${FACE}
    <path d="M11.5 16c0-6 3.5-9.5 8.5-9.5s8.5 3.5 8.5 9.5c-3-1-6-3-8.5-6-2.5 3-5.5 5-8.5 6z" fill="#6b3f2a"/>
    <path d="M28 8l-4-2.5v5zM28 8l4-2.5v5z" fill="#ec4899"/>
    <circle cx="28" cy="8" r="1.2" fill="#be185d"/>
  </svg>`,
    unknown: `${SVG_OPEN} role="img" aria-label="學生">
    <rect width="40" height="40" fill="#f3f4f6"/>
    <g transform="translate(8 8)" fill="none" stroke="#9ca3af" stroke-width="1.5">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </g>
  </svg>`
  };

  // 接受資料庫的 male/female 與畫面上的 男/女，其餘回傳 null
  function studentGenderKey(gender) {
    if (gender === 'male' || gender === '男') return 'male';
    if (gender === 'female' || gender === '女') return 'female';
    return null;
  }

  function studentAvatarSvg(gender) {
    return AVATARS[studentGenderKey(gender) || 'unknown'];
  }

  window.studentGenderKey = studentGenderKey;
  window.studentAvatarSvg = studentAvatarSvg;
})();
