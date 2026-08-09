/**
 * 智慧學習歷程系統 - API 服務模組
 * 使用 Axios 進行 HTTP 請求
 */

// API 基礎設定
const API_BASE_URL = 'http://localhost:3000/api';

// 建立 Axios 實例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// =====================
// 請求攔截器
// =====================
apiClient.interceptors.request.use(
  (config) => {
    // 自動加入 Token
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 顯示載入中 (可選)
    if (typeof showLoading === 'function') {
      showLoading();
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// =====================
// 回應攔截器
// =====================
apiClient.interceptors.response.use(
  (response) => {
    // 隱藏載入中
    if (typeof hideLoading === 'function') {
      hideLoading();
    }

    return response.data;
  },
  (error) => {
    // 隱藏載入中
    if (typeof hideLoading === 'function') {
      hideLoading();
    }

    // 處理錯誤
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          // 判斷是否在登入頁面
          const isLoginPage = window.location.href.includes('login.html') ||
                              window.location.pathname.includes('login');

          if (!isLoginPage) {
            // Token 過期或無效，導向登入頁面
            localStorage.removeItem('authToken');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userName');
            alert('登入已過期，請重新登入');
            window.location.href = '/login.html';
          }
          // 登入頁面的錯誤由 catch 區塊處理，不彈出 alert
          break;

        case 403:
          alert('您沒有權限執行此操作');
          break;

        case 404:
          console.error('API 端點不存在:', error.config.url);
          break;

        case 500:
          alert('伺服器發生錯誤，請稍後再試');
          break;

        default:
          if (data && data.message) {
            alert(data.message);
          }
      }
    } else if (error.request) {
      // 請求已發送但沒有收到回應
      alert('無法連接到伺服器，請檢查網路連線');
    } else {
      console.error('請求錯誤:', error.message);
    }

    return Promise.reject(error);
  }
);

// =====================
// API 方法
// =====================

const api = {
  // =====================
  // 認證相關
  // =====================
  auth: {
    // 登入
    login: (credentials) => apiClient.post('/auth/login', credentials),

    // 註冊
    register: (userData) => apiClient.post('/auth/register', userData),

    // 取得當前使用者資訊
    getProfile: () => apiClient.get('/auth/profile'),

    // 更新密碼
    updatePassword: (data) => apiClient.put('/auth/password', data),

    // 登出 (前端處理)
    logout: () => {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      window.location.href = '/login.html';
    }
  },

  // =====================
  // 學生管理
  // =====================
  students: {
    // 取得所有學生
    getAll: (params = {}) => apiClient.get('/students', { params }),

    // 取得單一學生
    getOne: (id) => apiClient.get(`/students/${id}`),

    // 新增學生
    create: (data) => apiClient.post('/students', data),

    // 更新學生
    update: (id, data) => apiClient.put(`/students/${id}`, data),

    // 刪除學生
    delete: (id) => apiClient.delete(`/students/${id}`),

    // 取得學生點數記錄
    getPoints: (id, params = {}) => apiClient.get(`/students/${id}/points`, { params }),

    // 取得課程類型列表
    getCourseTypes: () => apiClient.get('/students/course-types'),

    // ===== 學生本人自助 (student 角色) =====
    // 取得本人完整檔案 (個人資料/點數/所屬班級/出缺勤/能力雷達)
    getMe: () => apiClient.get('/students/me'),

    // 更新本人可編輯的聯絡資料
    updateMe: (data) => apiClient.put('/students/me', data),

    // 取得本人課程紀錄 (學習成就列表)
    getMyRecords: (params = {}) => apiClient.get('/students/me/records', { params }),

    // 取得本人能力趨勢 (供趨勢圖使用)
    getMyTrend: (params = {}) => apiClient.get('/students/me/trend', { params })
  },

  // =====================
  // 教師管理
  // =====================
  teachers: {
    // 取得所有教師
    getAll: (params = {}) => apiClient.get('/teachers', { params }),

    // 取得單一教師
    getOne: (id) => apiClient.get(`/teachers/${id}`),

    // 新增教師
    create: (data) => apiClient.post('/teachers', data),

    // 更新教師
    update: (id, data) => apiClient.put(`/teachers/${id}`, data),

    // 刪除教師
    delete: (id) => apiClient.delete(`/teachers/${id}`),

    // 取得教師的課程日誌
    getLogs: (id, params = {}) => apiClient.get(`/teachers/${id}/logs`, { params })
  },

  // =====================
  // 課程管理
  // =====================
  courses: {
    // 取得課程類型
    getTypes: () => apiClient.get('/courses/types'),

    // 取得所有課程
    getAll: (params = {}) => apiClient.get('/courses', { params }),

    // 取得單一課程
    getOne: (id) => apiClient.get(`/courses/${id}`),

    // 新增課程
    create: (data) => apiClient.post('/courses', data),

    // 更新課程
    update: (id, data) => apiClient.put(`/courses/${id}`, data),

    // 刪除課程
    delete: (id) => apiClient.delete(`/courses/${id}`),

    // 學生選課
    enroll: (courseId, studentId) => apiClient.post(`/courses/${courseId}/enroll`, { student_id: studentId }),

    // 學生退選
    unenroll: (courseId, studentId) => apiClient.delete(`/courses/${courseId}/enroll/${studentId}`)
  },

  // =====================
  // 日誌管理
  // =====================
  logs: {
    // 取得所有日誌
    getAll: (params = {}) => apiClient.get('/logs', { params }),

    // 取得單一日誌
    getOne: (id) => apiClient.get(`/logs/${id}`),

    // 新增日誌
    create: (data) => apiClient.post('/logs', data),

    // 更新日誌
    update: (id, data) => apiClient.put(`/logs/${id}`, data),

    // 更新日誌權限
    updatePermissions: (id, teacherIds) => apiClient.put(`/logs/${id}/permissions`, { teacher_ids: teacherIds }),

    // 更新學生日誌記錄
    updateStudentRecord: (logId, studentId, data) => apiClient.put(`/logs/${logId}/students/${studentId}`, data)
  },

  // =====================
  // 班級時段管理
  // =====================
  schedules: {
    // 取得所有班級時段
    getAll: (params = {}) => apiClient.get('/schedules', { params }),

    // 取得單一班級時段
    getOne: (id) => apiClient.get(`/schedules/${id}`),

    // 新增班級時段
    create: (data) => apiClient.post('/schedules', data),

    // 更新班級時段
    update: (id, data) => apiClient.put(`/schedules/${id}`, data),

    // 刪除班級時段（移至垃圾桶）
    delete: (id) => apiClient.delete(`/schedules/${id}`),

    // 取得已刪除的班級（垃圾桶）
    getDeleted: () => apiClient.get('/schedules/deleted'),

    // 還原班級
    restore: (id) => apiClient.post(`/schedules/${id}/restore`),

    // 永久刪除班級
    permanentDelete: (id) => apiClient.delete(`/schedules/${id}/permanent`),

    // 取得教室列表
    getClassrooms: () => apiClient.get('/schedules/classrooms'),

    // 取得班級的學生列表
    getStudents: (id) => apiClient.get(`/schedules/${id}/students`),

    // 取得可加入班級的學生列表
    getAvailableStudents: (id, params = {}) => apiClient.get(`/schedules/${id}/available-students`, { params }),

    // 批量加入學生
    enrollStudents: (id, studentIds) => apiClient.post(`/schedules/${id}/students`, { student_ids: studentIds }),

    // 從班級移除學生
    removeStudent: (id, studentId) => apiClient.delete(`/schedules/${id}/students/${studentId}`)
  },

  // =====================
  // 系統設定
  // =====================
  settings: {
    // 取得系統設定
    get: () => apiClient.get('/settings'),

    // 更新系統設定
    update: (data) => apiClient.put('/settings', data),

    // 假日設定
    holidays: {
      getAll: (params = {}) => apiClient.get('/settings/holidays', { params }),
      create: (data) => apiClient.post('/settings/holidays', data),
      import: (holidays) => apiClient.post('/settings/holidays/import', { holidays }),
      update: (id, data) => apiClient.put(`/settings/holidays/${id}`, data),
      delete: (id) => apiClient.delete(`/settings/holidays/${id}`)
    },

    // 通知設定
    notifications: {
      getAll: () => apiClient.get('/settings/notifications'),
      update: (type, data) => apiClient.put(`/settings/notifications/${type}`, data)
    },

    // 教室設定
    classrooms: {
      getAll: () => apiClient.get('/settings/classrooms'),
      create: (data) => apiClient.post('/settings/classrooms', data),
      update: (id, data) => apiClient.put(`/settings/classrooms/${id}`, data),
      delete: (id) => apiClient.delete(`/settings/classrooms/${id}`)
    }
  },

  // =====================
  // 課表日曆
  // =====================
  scheduleCalendar: {
    // 取得週課表
    getWeekly: (params = {}) => apiClient.get('/schedule-calendar/weekly', { params }),

    // 取得日課表（以老師為欄位）
    getDaily: (params = {}) => apiClient.get('/schedule-calendar/daily', { params }),

    // 調課管理
    adjustments: {
      getAll: (params = {}) => apiClient.get('/schedule-calendar/adjustments', { params }),
      create: (data) => apiClient.post('/schedule-calendar/adjustments', data),
      update: (id, data) => apiClient.put(`/schedule-calendar/adjustments/${id}`, data),
      delete: (id) => apiClient.delete(`/schedule-calendar/adjustments/${id}`)
    }
  }
};

// =====================
// 工具函數
// =====================

// 檢查是否已登入
function isLoggedIn() {
  return !!localStorage.getItem('authToken');
}

// 取得當前使用者角色
function getUserRole() {
  return localStorage.getItem('userRole');
}

// 取得當前使用者名稱
function getUserName() {
  return localStorage.getItem('userName');
}

// 檢查是否有特定角色
function hasRole(...roles) {
  const userRole = getUserRole();
  return roles.includes(userRole);
}

// 導出 (供模組使用)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { api, apiClient, isLoggedIn, getUserRole, getUserName, hasRole };
}
