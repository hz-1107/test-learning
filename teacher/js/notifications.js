/**
 * 通知鈴鐺組件
 * 用於顯示系統公告
 */

// 通知面板 HTML 模板
const notificationPanelTemplate = `
<div class="notification-panel" id="notificationPanel">
  <div class="notification-panel__header">
    <h3 class="notification-panel__title">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
        <path d="M13.73 21a2 2 0 01-3.46 0"/>
      </svg>
      系統公告
    </h3>
    <button class="notification-panel__mark-all" id="markAllReadBtn" title="全部標為已讀">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 11 12 14 22 4"/>
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
      </svg>
    </button>
  </div>
  <div class="notification-panel__body" id="notificationList">
    <div class="notification-panel__loading">載入中...</div>
  </div>
</div>
`;

// 通知面板 CSS
const notificationStyles = `
<style id="notificationStyles">
  /* 通知鈴鐺 */
  .notification-bell {
    position: relative;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    color: #6a7282;
    cursor: pointer;
    transition: background 0.2s;
    background: transparent;
    border: none;
  }

  .notification-bell:hover {
    background: #f3f4f6;
  }

  .notification-bell__badge {
    position: absolute;
    top: 6px;
    right: 6px;
    min-width: 16px;
    height: 16px;
    padding: 0 4px;
    background: #ef4444;
    border-radius: 8px;
    font-size: 10px;
    font-weight: 600;
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .notification-bell__badge:empty,
  .notification-bell__badge[data-count="0"] {
    display: none;
  }

  /* 通知面板 */
  .notification-panel {
    position: fixed;
    top: 68px;
    right: 20px;
    width: 380px;
    max-height: calc(100vh - 100px);
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    display: none;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(0, 0, 0, 0.08);
  }

  .notification-panel.active {
    display: flex;
  }

  .notification-panel__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #e5e7eb;
    background: #f9fafb;
  }

  .notification-panel__title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: #101828;
    margin: 0;
  }

  .notification-panel__title svg {
    color: #FFDB58;
  }

  .notification-panel__mark-all {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    background: transparent;
    border: none;
    border-radius: 6px;
    color: #6a7282;
    cursor: pointer;
    transition: all 0.2s;
  }

  .notification-panel__mark-all:hover {
    background: #e5e7eb;
    color: #101828;
  }

  .notification-panel__body {
    flex: 1;
    overflow-y: auto;
    max-height: 400px;
  }

  .notification-panel__loading,
  .notification-panel__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #6a7282;
    font-size: 14px;
  }

  .notification-panel__empty svg {
    width: 48px;
    height: 48px;
    margin-bottom: 12px;
    color: #d1d5db;
  }

  /* 公告項目 */
  .notification-item {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    border-bottom: 1px solid #f3f4f6;
    cursor: pointer;
    transition: background 0.2s;
  }

  .notification-item:hover {
    background: #f9fafb;
  }

  .notification-item:last-child {
    border-bottom: none;
  }

  .notification-item--unread {
    background: #fffbeb;
  }

  .notification-item--unread:hover {
    background: #fef3c7;
  }

  .notification-item__indicator {
    width: 8px;
    height: 8px;
    background: #FFDB58;
    border-radius: 50%;
    flex-shrink: 0;
    margin-top: 6px;
  }

  .notification-item--read .notification-item__indicator {
    background: transparent;
  }

  .notification-item__content {
    flex: 1;
    min-width: 0;
  }

  .notification-item__title {
    font-size: 14px;
    font-weight: 600;
    color: #101828;
    margin: 0 0 4px 0;
    line-height: 1.4;
  }

  .notification-item__preview {
    font-size: 13px;
    color: #6a7282;
    margin: 0 0 8px 0;
    line-height: 1.5;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .notification-item__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 12px;
    color: #9ca3af;
  }

  .notification-item__tag {
    padding: 2px 8px;
    background: #e0f2fe;
    color: #0369a1;
    border-radius: 4px;
    font-weight: 500;
  }

  .notification-item__tag--teachers {
    background: #fef3c7;
    color: #92400e;
  }

  .notification-item__tag--all {
    background: #dcfce7;
    color: #166534;
  }

  /* 公告詳情 Modal */
  .notification-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: none;
    align-items: center;
    justify-content: center;
    z-index: 1100;
  }

  .notification-modal.active {
    display: flex;
  }

  .notification-modal__content {
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .notification-modal__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 24px;
    border-bottom: 1px solid #e5e7eb;
  }

  .notification-modal__title {
    font-size: 20px;
    font-weight: 600;
    color: #101828;
    margin: 0 0 8px 0;
  }

  .notification-modal__meta {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 13px;
    color: #6a7282;
  }

  .notification-modal__close {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: #6a7282;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .notification-modal__close:hover {
    background: #f3f4f6;
    color: #101828;
  }

  .notification-modal__body {
    padding: 24px;
    overflow-y: auto;
    flex: 1;
  }

  .notification-modal__text {
    font-size: 15px;
    line-height: 1.7;
    color: #374151;
    white-space: pre-wrap;
  }

  /* 遮罩層 */
  .notification-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 999;
    display: none;
  }

  .notification-overlay.active {
    display: block;
  }
</style>
`;

// 公告詳情 Modal 模板
const notificationModalTemplate = `
<div class="notification-modal" id="notificationModal">
  <div class="notification-modal__content">
    <div class="notification-modal__header">
      <div>
        <h2 class="notification-modal__title" id="modalTitle"></h2>
        <div class="notification-modal__meta">
          <span id="modalAuthor"></span>
          <span>•</span>
          <span id="modalDate"></span>
        </div>
      </div>
      <button class="notification-modal__close" onclick="closeNotificationModal()">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="notification-modal__body">
      <div class="notification-modal__text" id="modalContent"></div>
    </div>
  </div>
</div>
`;

// 遮罩層模板
const overlayTemplate = `<div class="notification-overlay" id="notificationOverlay"></div>`;

// 全域變數
let announcements = [];
let unreadCount = 0;

// 初始化通知系統
function initNotifications() {
  // 注入 CSS
  if (!document.getElementById('notificationStyles')) {
    document.head.insertAdjacentHTML('beforeend', notificationStyles);
  }

  // 注入面板和 Modal
  if (!document.getElementById('notificationPanel')) {
    document.body.insertAdjacentHTML('beforeend', overlayTemplate);
    document.body.insertAdjacentHTML('beforeend', notificationPanelTemplate);
    document.body.insertAdjacentHTML('beforeend', notificationModalTemplate);
  }

  // 更新鈴鐺按鈕
  updateBellButton();

  // 綁定事件
  bindNotificationEvents();

  // 載入公告
  loadAnnouncements();
}

// 更新鈴鐺按鈕 HTML
function updateBellButton() {
  const bellBtn = document.querySelector('.header__icon-btn[aria-label="通知"]');
  if (bellBtn) {
    bellBtn.classList.add('notification-bell');
    bellBtn.id = 'notificationBell';

    // 添加未讀數量標記
    if (!bellBtn.querySelector('.notification-bell__badge')) {
      bellBtn.insertAdjacentHTML('beforeend', '<span class="notification-bell__badge" id="notificationBadge"></span>');
    }
  }
}

// 綁定事件
function bindNotificationEvents() {
  // 鈴鐺點擊
  const bellBtn = document.getElementById('notificationBell');
  if (bellBtn) {
    bellBtn.addEventListener('click', toggleNotificationPanel);
  }

  // 遮罩層點擊
  const overlay = document.getElementById('notificationOverlay');
  if (overlay) {
    overlay.addEventListener('click', closeNotificationPanel);
  }

  // 全部標為已讀
  const markAllBtn = document.getElementById('markAllReadBtn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', markAllAsRead);
  }

  // ESC 鍵關閉
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeNotificationPanel();
      closeNotificationModal();
    }
  });
}

// 載入公告
async function loadAnnouncements() {
  try {
    const token = localStorage.getItem('authToken');
    if (!token) return;

    const response = await fetch('/api/announcements/my', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      announcements = result.data.announcements;
      unreadCount = result.data.unreadCount;
      updateBadge();
      renderNotificationList();
    }
  } catch (error) {
    console.error('載入公告失敗:', error);
  }
}

// 更新未讀數量標記
function updateBadge() {
  const badge = document.getElementById('notificationBadge');
  if (badge) {
    badge.textContent = unreadCount > 99 ? '99+' : unreadCount;
    badge.dataset.count = unreadCount;
  }
}

// 渲染公告列表
function renderNotificationList() {
  const listEl = document.getElementById('notificationList');
  if (!listEl) return;

  if (announcements.length === 0) {
    listEl.innerHTML = `
      <div class="notification-panel__empty">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 01-3.46 0"/>
        </svg>
        目前沒有公告
      </div>
    `;
    return;
  }

  listEl.innerHTML = announcements.map(a => {
    const isRead = a.is_read;
    const date = new Date(a.published_at);
    const dateStr = formatDate(date);
    const tagClass = a.target_group === 'teachers' ? 'notification-item__tag--teachers' :
                     a.target_group === 'all' ? 'notification-item__tag--all' : '';
    const tagText = a.target_group === 'teachers' ? '教師' :
                    a.target_group === 'students' ? '學生' : '全體';

    return `
      <div class="notification-item ${isRead ? 'notification-item--read' : 'notification-item--unread'}"
           onclick="openAnnouncement(${a.id})">
        <div class="notification-item__indicator"></div>
        <div class="notification-item__content">
          <h4 class="notification-item__title">${escapeHtml(a.title)}</h4>
          <p class="notification-item__preview">${escapeHtml(a.content)}</p>
          <div class="notification-item__meta">
            <span class="notification-item__tag ${tagClass}">${tagText}</span>
            <span>${dateStr}</span>
            ${a.author_name ? `<span>by ${escapeHtml(a.author_name)}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// 切換通知面板
function toggleNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  const overlay = document.getElementById('notificationOverlay');

  if (panel.classList.contains('active')) {
    closeNotificationPanel();
  } else {
    panel.classList.add('active');
    overlay.classList.add('active');
  }
}

// 關閉通知面板
function closeNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  const overlay = document.getElementById('notificationOverlay');

  panel?.classList.remove('active');
  overlay?.classList.remove('active');
}

// 開啟公告詳情
async function openAnnouncement(id) {
  const announcement = announcements.find(a => a.id === id);
  if (!announcement) return;

  // 標記為已讀
  if (!announcement.is_read) {
    await markAsRead(id);
  }

  // 顯示詳情
  document.getElementById('modalTitle').textContent = announcement.title;
  document.getElementById('modalAuthor').textContent = announcement.author_name || '系統';
  document.getElementById('modalDate').textContent = formatDate(new Date(announcement.published_at));
  document.getElementById('modalContent').textContent = announcement.content;

  document.getElementById('notificationModal').classList.add('active');
  closeNotificationPanel();
}

// 關閉公告詳情
function closeNotificationModal() {
  document.getElementById('notificationModal')?.classList.remove('active');
}

// 標記單一公告為已讀
async function markAsRead(id) {
  try {
    const token = localStorage.getItem('authToken');
    await fetch(`/api/announcements/${id}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // 更新本地狀態
    const announcement = announcements.find(a => a.id === id);
    if (announcement && !announcement.is_read) {
      announcement.is_read = 1;
      unreadCount = Math.max(0, unreadCount - 1);
      updateBadge();
      renderNotificationList();
    }
  } catch (error) {
    console.error('標記已讀失敗:', error);
  }
}

// 全部標為已讀
async function markAllAsRead() {
  try {
    const token = localStorage.getItem('authToken');
    await fetch('/api/announcements/read-all', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // 更新本地狀態
    announcements.forEach(a => a.is_read = 1);
    unreadCount = 0;
    updateBadge();
    renderNotificationList();
  } catch (error) {
    console.error('標記全部已讀失敗:', error);
  }
}

// 格式化日期
function formatDate(date) {
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '剛剛';
  if (minutes < 60) return `${minutes} 分鐘前`;
  if (hours < 24) return `${hours} 小時前`;
  if (days < 7) return `${days} 天前`;

  return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
}

// HTML 轉義
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// 頁面載入時初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotifications);
} else {
  // DOM 已經載入完成，直接初始化
  initNotifications();
}
