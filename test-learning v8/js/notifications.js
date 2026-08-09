/**
 * 公告通知系統
 * 處理鈴鐺圖示點擊顯示公告面板的功能
 */

// 公告資料
const announcements = [
  {
    id: 1,
    title: 'Fun心學習歷程系統上線',
    content: '歡迎使用全新的智慧學習歷程系統，讓我們一起記錄學習的每一刻！',
    date: '2026-07-22',
    type: 'system',
    isNew: true
  },
  {
    id: 2,
    title: '暑期課程開放報名',
    content: '2026年暑期機器人營隊開始報名囉！名額有限，請盡早報名。',
    date: '2026-07-20',
    type: 'course',
    isNew: true
  },
  {
    id: 3,
    title: '系統維護通知',
    content: '本系統將於7月25日凌晨2:00-4:00進行例行維護，届時將暫停服務。',
    date: '2026-07-18',
    type: 'system',
    isNew: false
  },
  {
    id: 4,
    title: '機器人競賽報名截止提醒',
    content: '2026全國青少年機器人競賽報名即將於7月31日截止，請把握機會！',
    date: '2026-07-15',
    type: 'event',
    isNew: false
  },
  {
    id: 5,
    title: '新功能上線：學習歷程匯出',
    content: '現在可以將您的學習歷程匯出為PDF格式，方便列印與保存。',
    date: '2026-07-10',
    type: 'feature',
    isNew: false
  }
];

// 建立通知面板 HTML
function createNotificationPanel() {
  const panel = document.createElement('div');
  panel.className = 'notification-panel';
  panel.id = 'notificationPanel';

  const newCount = announcements.filter(a => a.isNew).length;

  panel.innerHTML = `
    <div class="notification-panel__header">
      <h3 class="notification-panel__title">公告消息</h3>
      <span class="notification-panel__count">${announcements.length} 則公告</span>
    </div>
    <div class="notification-panel__list">
      ${announcements.map(announcement => `
        <div class="notification-item ${announcement.isNew ? 'notification-item--new' : ''}" data-id="${announcement.id}">
          <div class="notification-item__icon notification-item__icon--${announcement.type}">
            ${getTypeIcon(announcement.type)}
          </div>
          <div class="notification-item__content">
            <div class="notification-item__header">
              <span class="notification-item__title">${announcement.title}</span>
              ${announcement.isNew ? '<span class="notification-item__badge">NEW</span>' : ''}
            </div>
            <p class="notification-item__text">${announcement.content}</p>
            <span class="notification-item__date">${formatNotificationDate(announcement.date)}</span>
          </div>
        </div>
      `).join('')}
    </div>
    <div class="notification-panel__footer">
      <a href="#" class="notification-panel__link">查看全部公告</a>
    </div>
  `;

  return panel;
}

// 取得類型圖示
function getTypeIcon(type) {
  const icons = {
    system: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`,
    course: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
    </svg>`,
    event: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>`,
    feature: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>`
  };
  return icons[type] || icons.system;
}

// 格式化日期 (接受字串日期或 Date 物件)
// 註: 特意用 formatNotificationDate 命名 (而非 formatDate)，避免與其他頁面
// (例如 js/main.js、各頁面內的 inline script) 全域同名的 formatDate 互相覆蓋，
// 導致呼叫到不相容的版本而出錯 (例如對字串直接呼叫 .getFullYear())
function formatNotificationDate(dateInput) {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 建立通知徽章
function createNotificationBadge() {
  const newCount = announcements.filter(a => a.isNew).length;
  if (newCount === 0) return null;

  const badge = document.createElement('span');
  badge.className = 'notification-badge';
  badge.textContent = newCount > 9 ? '9+' : newCount;
  return badge;
}

// 初始化通知系統
function initNotifications() {
  // 找到所有鈴鐺按鈕 (通過 SVG path 的 d 屬性來識別)
  const allPaths = document.querySelectorAll('svg path');
  let notificationBtn = null;

  allPaths.forEach(path => {
    const d = path.getAttribute('d');
    if (d && d.includes('M18 8A6 6 0 006 8c0 7-3 9-3 9')) {
      // 找到包含這個 path 的按鈕
      const btn = path.closest('button');
      if (btn) {
        notificationBtn = btn;
      }
    }
  });

  if (!notificationBtn) {
    console.log('Notification: 找不到鈴鐺按鈕');
    return;
  }

  console.log('Notification: 找到鈴鐺按鈕', notificationBtn);

  // 設置按鈕為相對定位
  notificationBtn.style.position = 'relative';

  // 添加通知徽章到按鈕
  const badge = createNotificationBadge();
  if (badge) {
    notificationBtn.appendChild(badge);
  }

  // 建立通知面板
  const panel = createNotificationPanel();

  // 將面板插入到按鈕後面
  notificationBtn.insertAdjacentElement('afterend', panel);

  // 點擊鈴鐺按鈕切換面板
  notificationBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopPropagation();
    panel.classList.toggle('notification-panel--active');
    console.log('Notification: 點擊鈴鐺，面板狀態:', panel.classList.contains('notification-panel--active'));
  });

  // 點擊面板外關閉
  document.addEventListener('click', function(e) {
    // 檢查點擊是否在按鈕內（包括SVG子元素）
    if (!panel.contains(e.target) && !notificationBtn.contains(e.target)) {
      panel.classList.remove('notification-panel--active');
    }
  });

  // 點擊通知項目
  panel.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      // 標記為已讀
      item.classList.remove('notification-item--new');
      const badgeEl = item.querySelector('.notification-item__badge');
      if (badgeEl) badgeEl.remove();

      // 更新徽章計數
      updateBadgeCount();
    });
  });
}

// 更新徽章計數
function updateBadgeCount() {
  const newItems = document.querySelectorAll('.notification-item--new');
  const badge = document.querySelector('.notification-badge');

  if (newItems.length === 0 && badge) {
    badge.remove();
  } else if (badge) {
    badge.textContent = newItems.length > 9 ? '9+' : newItems.length;
  }
}

// 添加通知面板樣式
function addNotificationStyles() {
  const style = document.createElement('style');
  style.textContent = `
    /* 通知徽章 */
    .notification-badge {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      background: #E53935;
      border-radius: 9px;
      font-size: 11px;
      font-weight: 600;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 2px solid var(--color-surface, #ffffff);
      z-index: 10;
      pointer-events: none;
    }

    /* 通知面板 */
    .notification-panel {
      position: fixed;
      top: 60px;
      right: 80px;
      width: 380px;
      max-height: 480px;
      background: var(--color-surface, #ffffff);
      border-radius: var(--radius-lg, 12px);
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transform: translateY(-10px);
      transition: all 0.2s ease;
      z-index: 9999;
      overflow: hidden;
    }

    .notification-panel--active {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .notification-panel__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--color-primary, #ffdb58);
      border-bottom: 1px solid var(--color-surface-alt, #f0f0f0);
    }

    .notification-panel__title {
      font-size: 16px;
      font-weight: 600;
      color: var(--color-primary-dark, #5a4a00);
      margin: 0;
    }

    .notification-panel__count {
      font-size: 12px;
      color: var(--color-primary-dark, #5a4a00);
      opacity: 0.8;
    }

    .notification-panel__list {
      max-height: 360px;
      overflow-y: auto;
      background: var(--color-surface, #ffffff);
    }

    /* 通知項目 */
    .notification-item {
      display: flex;
      gap: 12px;
      padding: 14px 20px;
      border-bottom: 1px solid var(--color-surface-alt, #f0f0f0);
      cursor: pointer;
      transition: background 0.2s;
      background: var(--color-surface, #ffffff);
    }

    .notification-item:hover {
      background: rgba(255, 219, 88, 0.08);
    }

    .notification-item--new {
      background: rgba(255, 219, 88, 0.12);
    }

    .notification-item__icon {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .notification-item__icon--system {
      background: #E3F2FD;
      color: #1565C0;
    }

    .notification-item__icon--course {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .notification-item__icon--event {
      background: #FFF3E0;
      color: #E65100;
    }

    .notification-item__icon--feature {
      background: var(--color-primary, #ffdb58);
      color: var(--color-primary-dark, #5a4a00);
    }

    .notification-item__content {
      flex: 1;
      min-width: 0;
    }

    .notification-item__header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }

    .notification-item__title {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-text-primary, #1a1c1c);
    }

    .notification-item__badge {
      padding: 2px 6px;
      background: #E53935;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      color: white;
    }

    .notification-item__text {
      font-size: 13px;
      color: var(--color-text-secondary, #5f6368);
      margin: 0 0 6px 0;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    .notification-item__date {
      font-size: 12px;
      color: var(--color-text-muted, #9aa0a6);
    }

    .notification-panel__footer {
      padding: 12px 20px;
      text-align: center;
      border-top: 1px solid var(--color-surface-alt, #f0f0f0);
      background: var(--color-surface, #ffffff);
    }

    .notification-panel__link {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-primary-dark, #5a4a00);
      text-decoration: none;
    }

    .notification-panel__link:hover {
      text-decoration: underline;
    }

    /* 響應式調整 */
    @media (max-width: 480px) {
      .notification-panel {
        width: calc(100vw - 32px);
        right: -60px;
      }
    }
  `;
  document.head.appendChild(style);
}

// DOM 載入完成後初始化
function init() {
  addNotificationStyles();
  initNotifications();
}

// 確保在 DOM 準備好後執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM 已經載入完成
  init();
}
