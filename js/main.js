/**
 * 智慧學習歷程系統 - 主要 JavaScript 檔案
 */

// ========================================
// 工具函數
// ========================================

/**
 * 格式化日期為中文格式
 * @param {Date} date - 日期物件
 * @returns {string} 格式化後的日期字串
 */
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
  const weekDay = weekDays[date.getDay()];

  return `${year} / ${month} / ${day} (${weekDay})`;
}

/**
 * 顯示訊息提示
 * @param {string} message - 訊息內容
 * @param {string} type - 訊息類型 (success, error, warning)
 */
function showMessage(message, type = 'success') {
  // 移除舊的訊息
  const existingMessage = document.querySelector('.message-toast');
  if (existingMessage) {
    existingMessage.remove();
  }

  // 建立訊息元素
  const messageEl = document.createElement('div');
  messageEl.className = `message-toast message-toast--${type}`;
  messageEl.textContent = message;
  messageEl.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 12px 24px;
    border-radius: 8px;
    color: white;
    font-size: 14px;
    z-index: 1000;
    animation: slideIn 0.3s ease;
    background: ${type === 'success' ? '#41e654' : type === 'error' ? '#fe7560' : '#ffdb58'};
  `;

  document.body.appendChild(messageEl);

  // 3 秒後自動移除
  setTimeout(() => {
    messageEl.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => messageEl.remove(), 300);
  }, 3000);
}

// ========================================
// 登入頁面功能
// ========================================

/**
 * 初始化登入頁面
 */
function initLoginPage() {
  const loginForm = document.getElementById('loginForm');
  const togglePassword = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');

  if (!loginForm) return;

  // 密碼顯示/隱藏切換
  if (togglePassword && passwordInput) {
    togglePassword.addEventListener('click', function() {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;

      // 更新圖示狀態
      this.style.opacity = type === 'text' ? '1' : '0.6';
    });
  }

  // 表單提交處理由 login.html 中的 script 處理，這裡不重複

  // 自動填入記住的使用者
  const rememberedUser = localStorage.getItem('rememberedUser');
  if (rememberedUser) {
    document.getElementById('username').value = rememberedUser;
    document.getElementById('rememberMe').checked = true;
  }
}

// ========================================
// 儀表板頁面功能
// ========================================

/**
 * 初始化儀表板頁面
 */
function initDashboard() {
  const currentDateEl = document.getElementById('currentDate');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const coursesGrid = document.getElementById('coursesGrid');
  const addClassBtn = document.getElementById('addClassBtn');

  if (!currentDateEl) return;

  // 顯示當前日期
  currentDateEl.textContent = formatDate(new Date());

  // 課程篩選功能
  filterBtns.forEach(btn => {
    btn.addEventListener('click', function() {
      // 更新按鈕狀態
      filterBtns.forEach(b => b.classList.remove('filter-btn--active'));
      this.classList.add('filter-btn--active');

      // 篩選課程
      const filter = this.dataset.filter;
      filterCourses(filter);
    });
  });

  // 新增班級按鈕 - 已在 courses.html 中實作，此處不再處理

  // 初始化課程卡片點擊事件
  initCourseCards();
}

/**
 * 篩選課程
 * @param {string} filter - 篩選條件 (all, in-progress, pending)
 */
function filterCourses(filter) {
  const courseCards = document.querySelectorAll('.course-card');

  courseCards.forEach(card => {
    const status = card.dataset.status;

    if (filter === 'all') {
      card.style.display = '';
    } else if (filter === status) {
      card.style.display = '';
    } else {
      card.style.display = 'none';
    }
  });
}

/**
 * 初始化課程卡片互動
 */
function initCourseCards() {
  const courseCards = document.querySelectorAll('.course-card');

  courseCards.forEach(card => {
    // 卡片點擊效果
    card.addEventListener('click', function(e) {
      // 如果點擊的是連結，不處理
      if (e.target.closest('a')) return;

      // 視覺反饋
      this.style.transform = 'scale(0.98)';
      setTimeout(() => {
        this.style.transform = '';
      }, 150);
    });

    // 日誌連結點擊 - 讓連結正常跳轉
    const actionLink = card.querySelector('.course-card__action');
    if (actionLink) {
      actionLink.addEventListener('click', function(e) {
        // 不阻止預設行為，讓連結正常跳轉
        e.stopPropagation(); // 只阻止事件冒泡到卡片
      });
    }
  });
}

// ========================================
// 側邊欄功能
// ========================================

/**
 * 初始化側邊欄
 */
function initSidebar() {
  const navItems = document.querySelectorAll('.sidebar__nav-item');

  navItems.forEach(item => {
    item.addEventListener('click', function(e) {
      // 更新活動狀態
      navItems.forEach(nav => nav.classList.remove('sidebar__nav-item--active'));
      this.classList.add('sidebar__nav-item--active');
    });
  });
}

// ========================================
// 搜尋功能
// ========================================

/**
 * 初始化搜尋功能
 */
function initSearch() {
  const searchInput = document.querySelector('.header__search-input');

  if (!searchInput) return;

  let debounceTimer;

  searchInput.addEventListener('input', function() {
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      const query = this.value.trim();
      if (query.length >= 2) {
        console.log('搜尋:', query);
        // 這裡可以實作搜尋邏輯
      }
    }, 300);
  });

  // Enter 鍵搜尋
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const query = this.value.trim();
      if (query) {
        showMessage(`搜尋「${query}」...`, 'success');
      }
    }
  });
}

// ========================================
// 日誌功能
// ========================================

/**
 * 初始化日誌區塊
 */
function initJournalSection() {
  // 日誌按鈕現在使用正常的連結跳轉，不需要額外的 JavaScript 處理
}

// ========================================
// 動畫效果
// ========================================

// 添加 CSS 動畫
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(100%);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(100%);
      opacity: 0;
    }
  }

  .course-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
  }

  .course-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }

  .sidebar__nav-item {
    transition: all 0.2s ease;
  }

  .filter-btn {
    transition: all 0.2s ease;
  }

  .journal-item,
  .journal-progress {
    transition: transform 0.2s ease;
  }

  .journal-item:hover,
  .journal-progress:hover {
    transform: translateY(-2px);
  }
`;
document.head.appendChild(style);

// ========================================
// 應用程式初始化
// ========================================

/**
 * 更新頁面上的使用者姓名
 */
function updateUserName() {
  const userName = localStorage.getItem('userName');
  if (!userName) return;

  // 所有可能顯示姓名的 class
  const nameSelectors = [
    '.admin-sidebar__name',
    '.staff-sidebar__name',
    '.student-sidebar__name',
    '.sidebar__profile-name',
    '.teacher-sidebar__name',
    '.user-name'
  ];

  nameSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      el.textContent = userName;
    });
  });
}

/**
 * 檢查登入狀態，未登入則跳轉到登入頁
 */
function checkAuth() {
  const isLoginPage = window.location.href.includes('login.html');
  const token = localStorage.getItem('authToken');

  if (!isLoginPage && !token) {
    window.location.href = '/login.html';
  }
}

/**
 * 應用程式初始化
 */
function init() {
  // 判斷當前頁面並初始化對應功能
  const isLoginPage = document.getElementById('loginForm');
  const isDashboard = document.getElementById('currentDate');

  if (isLoginPage) {
    initLoginPage();
  } else {
    // 非登入頁面：檢查登入狀態並更新使用者姓名
    checkAuth();
    updateUserName();
  }

  if (isDashboard) {
    initDashboard();
    initSidebar();
    initSearch();
    initJournalSection();
  }

  console.log('智慧學習歷程系統已初始化');
}

// DOM 載入完成後初始化
document.addEventListener('DOMContentLoaded', init);
