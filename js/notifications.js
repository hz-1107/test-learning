/**
 * 公告通知系統
 * 處理鈴鐺圖示點擊顯示公告面板的功能
 * 從資料庫 API 載入公告
 */

// API 基底路徑
const NOTIFICATION_API_BASE = window.API_BASE || 'http://localhost:3000';

// 公告資料
let announcements = [];
let unreadCount = 0;

// 取得認證 Token
function getAuthToken() {
  return localStorage.getItem('authToken');
}

// 從 API 載入公告
async function loadAnnouncements() {
  const token = getAuthToken();
  if (!token) {
    console.log('Notification: 未登入，無法載入公告');
    return;
  }

  try {
    const response = await fetch(`${NOTIFICATION_API_BASE}/api/announcements/my`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('載入公告失敗');
    }

    const result = await response.json();
    if (result.success) {
      announcements = result.data.announcements || [];
      unreadCount = result.data.unreadCount || 0;
      console.log('Notification: 載入公告成功，共', announcements.length, '則，未讀', unreadCount, '則');
    }
  } catch (error) {
    console.error('Notification: 載入公告錯誤:', error);
    // 保持空陣列
    announcements = [];
    unreadCount = 0;
  }
}

// 標記公告為已讀
async function markAnnouncementAsRead(id) {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch(`${NOTIFICATION_API_BASE}/api/announcements/${id}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
  } catch (error) {
    console.error('Notification: 標記已讀錯誤:', error);
  }
}

// 標記所有公告為已讀
async function markAllAsRead() {
  const token = getAuthToken();
  if (!token) return;

  try {
    await fetch(`${NOTIFICATION_API_BASE}/api/announcements/read-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // 更新本地狀態
    announcements.forEach(a => a.is_read = 1);
    unreadCount = 0;

    // 更新 UI
    document.querySelectorAll('.notification-item--new').forEach(item => {
      item.classList.remove('notification-item--new');
      const badge = item.querySelector('.notification-item__badge');
      if (badge) badge.remove();
    });

    updateBadgeCount();
    updatePanelCount();
  } catch (error) {
    console.error('Notification: 標記全部已讀錯誤:', error);
  }
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
    </svg>`,
    all: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 00-3-3.87"/>
      <path d="M16 3.13a4 4 0 010 7.75"/>
    </svg>`,
    students: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5"/>
    </svg>`,
    teachers: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`
  };
  return icons[type] || icons.system;
}

// 格式化日期
function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffTime = now - date;
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return '今天';
  if (diffDays === 1) return '昨天';
  if (diffDays < 7) return `${diffDays} 天前`;

  return `${date.getMonth() + 1}/${date.getDate()}`;
}

// 建立通知面板 HTML
function createNotificationPanel() {
  const panel = document.createElement('div');
  panel.className = 'notification-panel';
  panel.id = 'notificationPanel';

  updatePanelContent(panel);

  return panel;
}

// 更新面板內容
function updatePanelContent(panel) {
  if (!panel) panel = document.getElementById('notificationPanel');
  if (!panel) return;

  if (announcements.length === 0) {
    panel.innerHTML = `
      <div class="notification-panel__header">
        <h3 class="notification-panel__title">公告消息</h3>
        <span class="notification-panel__count">0 則公告</span>
      </div>
      <div class="notification-panel__list">
        <div class="notification-panel__empty">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 01-3.46 0"/>
          </svg>
          <p>目前沒有公告</p>
        </div>
      </div>
    `;
    return;
  }

  panel.innerHTML = `
    <div class="notification-panel__header">
      <h3 class="notification-panel__title">公告消息</h3>
      <div class="notification-panel__header-right">
        ${unreadCount > 0 ? `<button class="notification-panel__mark-all" onclick="markAllAsRead()">全部已讀</button>` : ''}
        <span class="notification-panel__count">${announcements.length} 則公告</span>
      </div>
    </div>
    <div class="notification-panel__list">
      ${announcements.map(announcement => {
        const isNew = !announcement.is_read;
        const type = announcement.target_group || 'system';
        const dateStr = announcement.published_at || announcement.created_at;

        return `
          <div class="notification-item ${isNew ? 'notification-item--new' : ''}" data-id="${announcement.id}">
            <div class="notification-item__icon notification-item__icon--${type}">
              ${getTypeIcon(type)}
            </div>
            <div class="notification-item__content">
              <div class="notification-item__header">
                <span class="notification-item__title">${announcement.title}</span>
                ${isNew ? '<span class="notification-item__badge">NEW</span>' : ''}
              </div>
              <p class="notification-item__text">${announcement.content || ''}</p>
              <div class="notification-item__footer">
                <span class="notification-item__date">${formatDate(dateStr)}</span>
                ${announcement.author_name ? `<span class="notification-item__author">${announcement.author_name}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
    <div class="notification-panel__footer">
      <span class="notification-panel__refresh" onclick="refreshAnnouncements()">重新整理</span>
    </div>
  `;

  // 重新綁定點擊事件
  bindNotificationItemEvents(panel);
}

// 綁定通知項目事件
function bindNotificationItemEvents(panel) {
  panel.querySelectorAll('.notification-item').forEach(item => {
    item.addEventListener('click', async () => {
      const id = item.dataset.id;

      // 如果是未讀，標記為已讀
      if (item.classList.contains('notification-item--new')) {
        await markAnnouncementAsRead(id);

        // 更新本地狀態
        const announcement = announcements.find(a => a.id == id);
        if (announcement) {
          announcement.is_read = 1;
          unreadCount = Math.max(0, unreadCount - 1);
        }

        // 更新 UI
        item.classList.remove('notification-item--new');
        const badgeEl = item.querySelector('.notification-item__badge');
        if (badgeEl) badgeEl.remove();

        updateBadgeCount();
        updatePanelCount();
      }

      // 顯示公告詳情 (可擴展)
      showAnnouncementDetail(id);
    });
  });
}

// 顯示公告詳情
function showAnnouncementDetail(id) {
  const announcement = announcements.find(a => a.id == id);
  if (!announcement) return;

  // 建立詳情對話框
  const existingModal = document.querySelector('.announcement-modal');
  if (existingModal) existingModal.remove();

  const modal = document.createElement('div');
  modal.className = 'announcement-modal';
  modal.innerHTML = `
    <div class="announcement-modal__backdrop"></div>
    <div class="announcement-modal__content">
      <div class="announcement-modal__header">
        <h3>${announcement.title}</h3>
        <button class="announcement-modal__close">&times;</button>
      </div>
      <div class="announcement-modal__body">
        <p>${announcement.content || ''}</p>
      </div>
      <div class="announcement-modal__footer">
        <span>${formatDate(announcement.published_at || announcement.created_at)}</span>
        ${announcement.author_name ? `<span>發布者: ${announcement.author_name}</span>` : ''}
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // 關閉事件
  modal.querySelector('.announcement-modal__backdrop').addEventListener('click', () => modal.remove());
  modal.querySelector('.announcement-modal__close').addEventListener('click', () => modal.remove());

  // 動畫顯示
  requestAnimationFrame(() => modal.classList.add('announcement-modal--active'));
}

// 重新整理公告
async function refreshAnnouncements() {
  await loadAnnouncements();
  updatePanelContent();
  updateBadgeCount();
}

// 建立通知徽章
function createNotificationBadge() {
  if (unreadCount === 0) return null;

  const badge = document.createElement('span');
  badge.className = 'notification-badge';
  badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
  return badge;
}

// 更新徽章計數
function updateBadgeCount() {
  const badge = document.querySelector('.notification-badge');
  const btn = document.querySelector('[data-notification-btn]');

  if (unreadCount === 0) {
    if (badge) badge.remove();
  } else if (badge) {
    badge.textContent = unreadCount > 9 ? '9+' : unreadCount;
  } else if (btn) {
    const newBadge = createNotificationBadge();
    if (newBadge) btn.appendChild(newBadge);
  }
}

// 更新面板計數
function updatePanelCount() {
  const countEl = document.querySelector('.notification-panel__count');
  if (countEl) {
    countEl.textContent = `${announcements.length} 則公告`;
  }

  // 更新全部已讀按鈕顯示
  const headerRight = document.querySelector('.notification-panel__header-right');
  if (headerRight) {
    const markAllBtn = headerRight.querySelector('.notification-panel__mark-all');
    if (unreadCount === 0 && markAllBtn) {
      markAllBtn.remove();
    } else if (unreadCount > 0 && !markAllBtn) {
      const btn = document.createElement('button');
      btn.className = 'notification-panel__mark-all';
      btn.textContent = '全部已讀';
      btn.onclick = markAllAsRead;
      headerRight.insertBefore(btn, headerRight.firstChild);
    }
  }
}

// 初始化通知系統
async function initNotifications() {
  // 先載入公告
  await loadAnnouncements();

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

  // 設置按鈕為相對定位並標記
  notificationBtn.style.position = 'relative';
  notificationBtn.setAttribute('data-notification-btn', 'true');

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
      width: 400px;
      max-height: 520px;
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

    .notification-panel__header-right {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .notification-panel__mark-all {
      padding: 4px 10px;
      background: rgba(90, 74, 0, 0.1);
      border: none;
      border-radius: 4px;
      font-size: 12px;
      color: var(--color-primary-dark, #5a4a00);
      cursor: pointer;
      transition: background 0.2s;
    }

    .notification-panel__mark-all:hover {
      background: rgba(90, 74, 0, 0.2);
    }

    .notification-panel__count {
      font-size: 12px;
      color: var(--color-primary-dark, #5a4a00);
      opacity: 0.8;
    }

    .notification-panel__list {
      max-height: 400px;
      overflow-y: auto;
      background: var(--color-surface, #ffffff);
    }

    .notification-panel__empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 60px 20px;
      color: var(--color-text-muted, #9aa0a6);
    }

    .notification-panel__empty svg {
      margin-bottom: 16px;
      opacity: 0.5;
    }

    .notification-panel__empty p {
      margin: 0;
      font-size: 14px;
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

    .notification-item__icon--system,
    .notification-item__icon--all {
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

    .notification-item__icon--students {
      background: #E8F5E9;
      color: #2E7D32;
    }

    .notification-item__icon--teachers {
      background: #E3F2FD;
      color: #1565C0;
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

    .notification-item__footer {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .notification-item__date {
      font-size: 12px;
      color: var(--color-text-muted, #9aa0a6);
    }

    .notification-item__author {
      font-size: 12px;
      color: var(--color-text-muted, #9aa0a6);
    }

    .notification-panel__footer {
      padding: 12px 20px;
      text-align: center;
      border-top: 1px solid var(--color-surface-alt, #f0f0f0);
      background: var(--color-surface, #ffffff);
    }

    .notification-panel__refresh {
      font-size: 14px;
      font-weight: 500;
      color: var(--color-primary-dark, #5a4a00);
      cursor: pointer;
    }

    .notification-panel__refresh:hover {
      text-decoration: underline;
    }

    /* 公告詳情對話框 */
    .announcement-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      transition: opacity 0.2s;
    }

    .announcement-modal--active {
      opacity: 1;
    }

    .announcement-modal__backdrop {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
    }

    .announcement-modal__content {
      position: relative;
      width: 90%;
      max-width: 500px;
      background: var(--color-surface, #ffffff);
      border-radius: var(--radius-lg, 12px);
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      overflow: hidden;
    }

    .announcement-modal__header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      background: var(--color-primary, #ffdb58);
    }

    .announcement-modal__header h3 {
      margin: 0;
      font-size: 16px;
      font-weight: 600;
      color: var(--color-primary-dark, #5a4a00);
    }

    .announcement-modal__close {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      font-size: 24px;
      color: var(--color-primary-dark, #5a4a00);
      cursor: pointer;
      border-radius: 50%;
      transition: background 0.2s;
    }

    .announcement-modal__close:hover {
      background: rgba(90, 74, 0, 0.1);
    }

    .announcement-modal__body {
      padding: 20px;
      max-height: 300px;
      overflow-y: auto;
    }

    .announcement-modal__body p {
      margin: 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--color-text-primary, #1a1c1c);
      white-space: pre-wrap;
    }

    .announcement-modal__footer {
      display: flex;
      justify-content: space-between;
      padding: 12px 20px;
      background: var(--color-background, #f8f9fa);
      font-size: 12px;
      color: var(--color-text-muted, #9aa0a6);
    }

    /* 響應式調整 */
    @media (max-width: 480px) {
      .notification-panel {
        width: calc(100vw - 32px);
        right: 16px;
        left: 16px;
      }
    }
  `;
  document.head.appendChild(style);
}

// DOM 載入完成後初始化
async function init() {
  addNotificationStyles();
  await initNotifications();
}

// 確保在 DOM 準備好後執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  // DOM 已經載入完成
  init();
}
