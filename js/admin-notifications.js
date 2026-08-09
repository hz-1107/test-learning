// ============================================
// 行政端通知公告系統
// ============================================

const API_BASE = 'http://localhost:3000/api';

// 公告資料快取
let announcementsCache = [];

// ============================================
// 通知面板功能
// ============================================

// 初始化通知面板
function initNotificationPanel() {
  console.log('[AdminNotifications] 初始化開始');

  // 建立通知面板 DOM
  createNotificationPanelDOM();
  console.log('[AdminNotifications] DOM 已建立');

  // 綁定鈴鐺按鈕事件（支援 admin 和 staff 頁面）
  const bellBtn = document.querySelector('[data-notification-btn]') ||
                  document.querySelector('.admin-header__icon-btn:has(path[d*="18 8A6 6"])') ||
                  document.querySelector('.staff-header__icon-btn:has(path[d*="18 8A6 6"])');

  console.log('[AdminNotifications] 找到鈴鐺按鈕:', bellBtn);

  if (bellBtn) {
    bellBtn.setAttribute('data-notification-btn', 'true');
    bellBtn.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      console.log('[AdminNotifications] 鈴鐺被點擊');
      toggleNotificationPanel(e);
    });
    console.log('[AdminNotifications] 事件已綁定');
  } else {
    console.error('[AdminNotifications] 找不到鈴鐺按鈕！');
  }

  // 點擊外部關閉面板
  document.addEventListener('click', (e) => {
    const panel = document.getElementById('notificationPanel');
    const bellBtn = document.querySelector('[data-notification-btn]');
    if (panel && !panel.contains(e.target) && !bellBtn?.contains(e.target)) {
      closeNotificationPanel();
    }
  });

  // 載入公告
  loadAnnouncements();
}

// 建立通知面板 DOM
function createNotificationPanelDOM() {
  // 移除舊的面板
  const existingPanel = document.getElementById('notificationPanel');
  if (existingPanel) existingPanel.remove();

  const existingModal = document.getElementById('newAnnouncementModal');
  if (existingModal) existingModal.remove();

  // 通知面板 - 按照 Figma 設計
  const panelHTML = `
    <div id="notificationPanel" class="notification-panel">
      <div class="notification-panel__container">
        <div class="notification-panel__header">
          <span class="notification-panel__title">公告</span>
          <button class="notification-panel__add-btn" onclick="openNewAnnouncementModal()">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
        </div>
        <div class="notification-panel__list" id="notificationList">
          <div class="notification-panel__empty">載入中...</div>
        </div>
      </div>
    </div>
  `;

  // 新增公告彈窗 - 按照 Figma 設計
  const modalHTML = `
    <div id="newAnnouncementModal" class="announcement-modal-overlay">
      <div class="announcement-modal">
        <div class="announcement-modal__header">
          <span class="announcement-modal__title">發布新公告</span>
          <button class="announcement-modal__close" onclick="closeNewAnnouncementModal()">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="announcement-modal__body">
          <!-- 發布時間設定 -->
          <div class="announcement-form-group">
            <label class="announcement-form-label">發布時間設定</label>
            <div class="announcement-radio-group">
              <label class="announcement-radio">
                <input type="radio" name="publishType" value="immediate" checked onchange="toggleScheduledFields()">
                <span class="announcement-radio__mark"></span>
                <span class="announcement-radio__text">即時發布</span>
              </label>
              <label class="announcement-radio">
                <input type="radio" name="publishType" value="scheduled" onchange="toggleScheduledFields()">
                <span class="announcement-radio__mark"></span>
                <span class="announcement-radio__text">定時發布</span>
              </label>
            </div>
          </div>

          <!-- 定時發布時間選擇 -->
          <div class="announcement-form-group announcement-scheduled-fields" id="scheduledFields" style="display: none;">
            <div class="announcement-datetime-row">
              <div class="announcement-date-picker">
                <input type="date" id="scheduledDate" class="announcement-date-input">
              </div>
              <div class="announcement-time-picker">
                <input type="time" id="scheduledTime" value="09:00" class="announcement-time-input">
              </div>
            </div>
          </div>

          <!-- 發送目標群組 -->
          <div class="announcement-form-group">
            <label class="announcement-form-label">發送目標群組</label>
            <div class="announcement-radio-group">
              <label class="announcement-radio">
                <input type="radio" name="targetGroup" value="all" checked onchange="toggleClassFields()">
                <span class="announcement-radio__mark"></span>
                <span class="announcement-radio__text">全體人員</span>
              </label>
              <label class="announcement-radio">
                <input type="radio" name="targetGroup" value="teachers" onchange="toggleClassFields()">
                <span class="announcement-radio__mark"></span>
                <span class="announcement-radio__text">老師</span>
              </label>
              <label class="announcement-radio">
                <input type="radio" name="targetGroup" value="students" onchange="toggleClassFields()">
                <span class="announcement-radio__mark"></span>
                <span class="announcement-radio__text">學生</span>
              </label>
            </div>
          </div>

          <!-- 目標班級選擇 -->
          <div class="announcement-form-group" id="classFields" style="display: none;">
            <label class="announcement-form-label">目標班級</label>
            <div class="announcement-select-wrapper">
              <select id="targetClassSelect" class="announcement-select">
                <option value="">搜尋或選擇班級</option>
                <option value="程式機械">程式機械</option>
                <option value="動力機械">動力機械</option>
                <option value="科創機器人">科創機器人</option>
                <option value="幼兒簡易機械">幼兒簡易機械</option>
              </select>
              <svg class="announcement-select-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

          <!-- 公告主旨 -->
          <div class="announcement-form-group">
            <label class="announcement-form-label">公告主旨</label>
            <input type="text" id="announcementSubject" class="announcement-input" placeholder="請輸入公告主旨">
          </div>

          <!-- 公告詳細內容 -->
          <div class="announcement-form-group">
            <label class="announcement-form-label">公告詳細內容</label>
            <textarea id="announcementContent" class="announcement-textarea" placeholder="請輸入公告詳細內容…"></textarea>
          </div>
        </div>
        <div class="announcement-modal__footer">
          <button class="announcement-btn announcement-btn--cancel" onclick="closeNewAnnouncementModal()">取消</button>
          <button class="announcement-btn announcement-btn--confirm" id="confirmPublishBtn" onclick="submitAnnouncement()" disabled>確認發布</button>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', panelHTML);
  document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// 切換通知面板顯示
function toggleNotificationPanel(e) {
  e?.stopPropagation();
  const panel = document.getElementById('notificationPanel');
  console.log('[AdminNotifications] 面板元素:', panel);
  if (panel) {
    panel.classList.toggle('active');
    console.log('[AdminNotifications] 面板狀態:', panel.classList.contains('active') ? '開啟' : '關閉');
    if (panel.classList.contains('active')) {
      loadAnnouncements();
    }
  } else {
    console.error('[AdminNotifications] 找不到面板元素！');
  }
}

// 關閉通知面板
function closeNotificationPanel() {
  const panel = document.getElementById('notificationPanel');
  if (panel) {
    panel.classList.remove('active');
  }
}

// 載入公告列表
async function loadAnnouncements() {
  const listEl = document.getElementById('notificationList');
  if (!listEl) return;

  try {
    const response = await fetch(`${API_BASE}/announcements/published?limit=20`);
    const result = await response.json();

    if (result.success && result.data) {
      announcementsCache = result.data;
      renderAnnouncementList(result.data);
    } else {
      listEl.innerHTML = '<div class="notification-panel__empty">載入公告失敗</div>';
    }
  } catch (error) {
    console.error('載入公告失敗:', error);
    // 如果 API 失敗，使用本地資料
    if (typeof ANNOUNCEMENTS !== 'undefined') {
      announcementsCache = ANNOUNCEMENTS;
      renderAnnouncementList(ANNOUNCEMENTS);
    } else {
      listEl.innerHTML = '<div class="notification-panel__empty">暫無公告</div>';
    }
  }
}

// 渲染公告列表
function renderAnnouncementList(announcements) {
  const listEl = document.getElementById('notificationList');
  if (!listEl) return;

  if (!announcements || announcements.length === 0) {
    listEl.innerHTML = '<div class="notification-panel__empty">暫無公告</div>';
    return;
  }

  const html = announcements.map(item => {
    const dateStr = formatAnnouncementDate(item.published_at || item.publishedAt || item.created_at);
    const title = item.title || '';
    const content = item.content || '';
    // 組合標題和內容預覽
    const displayText = title + (content ? '：' + (content.length > 20 ? content.substring(0, 20) + '...' : content) : '');

    return `
      <div class="notification-panel__item">
        <div class="notification-panel__item-date">${dateStr}</div>
        <div class="notification-panel__item-title">${displayText}</div>
      </div>
    `;
  }).join('');

  listEl.innerHTML = html;
}

// 格式化日期
function formatAnnouncementDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}/${month}/${day} ${hours}:${minutes}`;
}

// ============================================
// 新增公告彈窗功能
// ============================================

// 開啟新增公告彈窗
function openNewAnnouncementModal() {
  closeNotificationPanel();
  const modal = document.getElementById('newAnnouncementModal');
  if (modal) {
    // 重置表單
    resetAnnouncementForm();
    modal.classList.add('active');
  }
}

// 關閉新增公告彈窗
function closeNewAnnouncementModal() {
  const modal = document.getElementById('newAnnouncementModal');
  if (modal) {
    modal.classList.remove('active');
  }
}

// 重置表單
function resetAnnouncementForm() {
  const immediateRadio = document.querySelector('input[name="publishType"][value="immediate"]');
  const allRadio = document.querySelector('input[name="targetGroup"][value="all"]');

  if (immediateRadio) immediateRadio.checked = true;
  if (allRadio) allRadio.checked = true;

  const scheduledFields = document.getElementById('scheduledFields');
  const classFields = document.getElementById('classFields');
  const scheduledDate = document.getElementById('scheduledDate');
  const scheduledTime = document.getElementById('scheduledTime');
  const targetClassSelect = document.getElementById('targetClassSelect');
  const announcementSubject = document.getElementById('announcementSubject');
  const announcementContent = document.getElementById('announcementContent');

  if (scheduledFields) scheduledFields.style.display = 'none';
  if (classFields) classFields.style.display = 'none';
  if (scheduledDate) scheduledDate.value = '';
  if (scheduledTime) scheduledTime.value = '09:00';
  if (targetClassSelect) targetClassSelect.value = '';
  if (announcementSubject) announcementSubject.value = '';
  if (announcementContent) announcementContent.value = '';

  updateConfirmButton();
}

// 切換定時發布欄位
function toggleScheduledFields() {
  const publishTypeRadio = document.querySelector('input[name="publishType"]:checked');
  const isScheduled = publishTypeRadio && publishTypeRadio.value === 'scheduled';
  const scheduledFields = document.getElementById('scheduledFields');

  if (scheduledFields) {
    scheduledFields.style.display = isScheduled ? 'flex' : 'none';
  }

  // 設定預設日期為明天
  if (isScheduled) {
    const scheduledDate = document.getElementById('scheduledDate');
    if (scheduledDate && !scheduledDate.value) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      scheduledDate.value = tomorrow.toISOString().split('T')[0];
    }
  }
}

// 切換班級選擇欄位
function toggleClassFields() {
  const targetGroupRadio = document.querySelector('input[name="targetGroup"]:checked');
  const targetGroup = targetGroupRadio ? targetGroupRadio.value : 'all';
  const classFields = document.getElementById('classFields');

  if (classFields) {
    classFields.style.display = targetGroup === 'students' ? 'block' : 'none';
  }
}

// 更新確認按鈕狀態
function updateConfirmButton() {
  const subjectEl = document.getElementById('announcementSubject');
  const contentEl = document.getElementById('announcementContent');
  const btn = document.getElementById('confirmPublishBtn');

  if (btn && subjectEl && contentEl) {
    const subject = subjectEl.value.trim();
    const content = contentEl.value.trim();
    const isValid = subject && content;
    btn.disabled = !isValid;
  }
}

// 監聽表單輸入
document.addEventListener('input', (e) => {
  if (e.target.id === 'announcementSubject' || e.target.id === 'announcementContent') {
    updateConfirmButton();
  }
});

// 提交公告
async function submitAnnouncement() {
  const publishTypeRadio = document.querySelector('input[name="publishType"]:checked');
  const targetGroupRadio = document.querySelector('input[name="targetGroup"]:checked');
  const publishType = publishTypeRadio ? publishTypeRadio.value : 'immediate';
  const targetGroup = targetGroupRadio ? targetGroupRadio.value : 'all';
  const subject = document.getElementById('announcementSubject').value.trim();
  const content = document.getElementById('announcementContent').value.trim();

  if (!subject || !content) {
    alert('請填寫公告主旨與內容');
    return;
  }

  // 準備資料
  const data = {
    title: subject,
    content: content,
    publish_type: publishType,
    target_group: targetGroup
  };

  // 定時發布
  if (publishType === 'scheduled') {
    const date = document.getElementById('scheduledDate').value;
    const time = document.getElementById('scheduledTime').value;
    if (!date || !time) {
      alert('請選擇發布日期和時間');
      return;
    }
    data.scheduled_at = `${date}T${time}:00`;
  }

  // 學生目標需要班級
  if (targetGroup === 'students') {
    const targetClass = document.getElementById('targetClassSelect').value;
    if (targetClass) {
      data.target_classes = [targetClass];
    }
  }

  try {
    const response = await fetch(`${API_BASE}/announcements`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (result.success) {
      alert(publishType === 'immediate' ? '公告已發布！' : '定時公告已建立！');
      closeNewAnnouncementModal();
      loadAnnouncements();

      // 如果在公告管理頁面，重新載入列表
      if (typeof renderAnnouncementHistory === 'function') {
        renderAnnouncementHistory();
      }
    } else {
      alert(result.message || '發布失敗');
    }
  } catch (error) {
    console.error('發布公告失敗:', error);

    // 如果 API 失敗，使用本地資料模式
    if (typeof ANNOUNCEMENTS !== 'undefined') {
      const newAnnouncement = {
        id: `a-${Date.now()}`,
        title: subject,
        content: content,
        type: '一般',
        scope: targetGroup === 'all' ? '全校' : (targetGroup === 'teachers' ? '特定身分' : '特定班級'),
        scopeDetail: targetGroup === 'students' ? [document.getElementById('targetClassSelect').value || '全部班級'] : (targetGroup === 'teachers' ? ['教師'] : []),
        isPinned: false,
        publishedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
        author: '管理員'
      };

      if (publishType === 'immediate') {
        ANNOUNCEMENTS.unshift(newAnnouncement);
        alert('公告已發布！（本地模式）');
      } else {
        if (typeof SCHEDULED_ANNOUNCEMENTS !== 'undefined') {
          SCHEDULED_ANNOUNCEMENTS.push({
            ...newAnnouncement,
            id: `s-${Date.now()}`,
            scheduledAt: `${document.getElementById('scheduledDate').value}T${document.getElementById('scheduledTime').value}`
          });
        }
        alert('定時公告已建立！（本地模式）');
      }

      closeNewAnnouncementModal();
      loadAnnouncements();

      if (typeof renderAnnouncementHistory === 'function') {
        renderAnnouncementHistory();
      }
      if (typeof renderScheduledAnnouncements === 'function') {
        renderScheduledAnnouncements();
      }
    }
  }
}

// 初始化
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNotificationPanel);
} else {
  // DOM 已經載入完成
  initNotificationPanel();
}

console.log('[AdminNotifications] 腳本已載入');
