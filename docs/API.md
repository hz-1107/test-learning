# 智慧學習歷程系統 API 文件

## 基本資訊

- **Base URL**: `http://localhost:3000/api`
- **資料格式**: JSON
- **認證方式**: Bearer Token (JWT)

## 認證

除了登入和註冊以外，所有 API 都需要在請求標頭中帶入 Token：

```
Authorization: Bearer <your_token>
```

---

## 認證 API `/api/auth`

### 登入

```http
POST /api/auth/login
```

**請求體：**
```json
{
  "username": "admin",
  "password": "admin123",
  "role": "admin"  // 可選：admin, staff, teacher, student
}
```

**回應：**
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "系統管理員",
      "role": "admin",
      "email": "admin@example.com"
    },
    "redirectUrl": "/admin/dashboard.html"
  }
}
```

### 註冊

```http
POST /api/auth/register
```

**請求體：**
```json
{
  "username": "newuser",
  "password": "password123",
  "name": "新使用者",
  "email": "user@example.com",
  "role": "student"
}
```

### 取得使用者資訊

```http
GET /api/auth/profile
```

**需要認證**

### 更新密碼

```http
PUT /api/auth/password
```

**需要認證**

**請求體：**
```json
{
  "currentPassword": "舊密碼",
  "newPassword": "新密碼"
}
```

---

## 學生 API `/api/students`

### 取得學生列表

```http
GET /api/students
```

**需要認證**

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| status | string | 狀態篩選：active, inactive, graduated |
| search | string | 搜尋姓名、學號、電話 |
| page | number | 頁碼 (預設 1) |
| limit | number | 每頁筆數 (預設 20) |

**回應：**
```json
{
  "success": true,
  "data": {
    "students": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "totalPages": 5
    }
  }
}
```

### 取得單一學生

```http
GET /api/students/:id
```

### 新增學生

```http
POST /api/students
```

**權限：** admin, staff

**請求體：**
```json
{
  "username": "student1",
  "password": "123456",
  "name": "王小明",
  "email": "student@example.com",
  "phone": "0912345678",
  "student_code": "S2024001",
  "birth_date": "2015-01-15",
  "gender": "male",
  "school": "台中國小",
  "grade": "三年級",
  "parent_name": "王大明",
  "parent_phone": "0923456789",
  "parent_email": "parent@example.com",
  "address": "台中市西屯區..."
}
```

### 更新學生

```http
PUT /api/students/:id
```

**權限：** admin, staff

### 刪除學生

```http
DELETE /api/students/:id
```

**權限：** admin, staff

### 取得學生點數記錄

```http
GET /api/students/:id/points
```

---

## 教師 API `/api/teachers`

### 取得教師列表

```http
GET /api/teachers
```

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| status | string | 狀態：active, inactive, on_leave |
| search | string | 搜尋姓名、電話 |

### 取得單一教師

```http
GET /api/teachers/:id
```

### 新增教師

```http
POST /api/teachers
```

**權限：** admin, staff

**請求體：**
```json
{
  "username": "teacher1",
  "password": "123456",
  "name": "陳老師",
  "email": "teacher@example.com",
  "phone": "0934567890",
  "school": "台中教育大學",
  "specialty": "程式教育、機器人",
  "hire_date": "2024-01-01",
  "notes": "備註"
}
```

### 更新教師

```http
PUT /api/teachers/:id
```

### 刪除教師

```http
DELETE /api/teachers/:id
```

### 取得教師的課程日誌

```http
GET /api/teachers/:id/logs
```

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| start_date | date | 開始日期 |
| end_date | date | 結束日期 |
| status | string | 狀態：pending, in_progress, completed |

---

## 課程 API `/api/courses`

### 取得課程類型

```http
GET /api/courses/types
```

### 取得課程列表

```http
GET /api/courses
```

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| status | string | 狀態：active, inactive, completed |
| teacher_id | number | 教師 ID |
| classroom_id | number | 教室 ID |
| course_type_id | number | 課程類型 ID |

### 取得單一課程

```http
GET /api/courses/:id
```

### 新增課程

```http
POST /api/courses
```

**權限：** admin, staff

**請求體：**
```json
{
  "name": "動力機械初階班",
  "description": "課程說明",
  "course_type_id": 2,
  "teacher_id": 1,
  "classroom_id": 1,
  "max_students": 8,
  "fee": 3000,
  "schedules": [
    {
      "day_of_week": 3,
      "start_time": "14:00",
      "end_time": "16:00"
    }
  ]
}
```

### 更新課程

```http
PUT /api/courses/:id
```

### 刪除課程

```http
DELETE /api/courses/:id
```

### 學生選課

```http
POST /api/courses/:id/enroll
```

**請求體：**
```json
{
  "student_id": 1
}
```

### 學生退選

```http
DELETE /api/courses/:id/enroll/:student_id
```

---

## 日誌 API `/api/logs`

### 取得日誌列表

```http
GET /api/logs
```

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| start_date | date | 開始日期 |
| end_date | date | 結束日期 |
| teacher_id | number | 教師 ID |
| course_id | number | 課程 ID |
| classroom_id | number | 教室 ID |
| status | string | 狀態：pending, in_progress, completed |
| page | number | 頁碼 |
| limit | number | 每頁筆數 |

### 取得單一日誌

```http
GET /api/logs/:id
```

### 新增日誌

```http
POST /api/logs
```

**權限：** admin, staff, teacher

**請求體：**
```json
{
  "course_id": 1,
  "log_date": "2026-07-26",
  "start_time": "14:00",
  "end_time": "16:00",
  "classroom_id": 1,
  "teacher_id": 1,
  "topic": "課程主題",
  "content": "課程內容",
  "outline": ["大綱1", "大綱2"]
}
```

### 更新日誌

```http
PUT /api/logs/:id
```

**請求體：**
```json
{
  "topic": "更新的主題",
  "content": "更新的內容",
  "status": "completed"
}
```

### 更新日誌權限

```http
PUT /api/logs/:id/permissions
```

**權限：** admin, staff

**請求體：**
```json
{
  "teacher_ids": [1, 2, 3]
}
```

### 更新學生日誌記錄

```http
PUT /api/logs/:log_id/students/:student_id
```

**權限：** admin, staff, teacher

**請求體：**
```json
{
  "attendance": "present",
  "performance": "表現優良",
  "notes": "備註",
  "skill_programming": 4,
  "skill_debugging": 3,
  "skill_creativity": 5,
  "skill_structure": 4,
  "skill_teamwork": 4,
  "points_earned": 10
}
```

---

## 設定 API `/api/settings`

### 取得系統設定

```http
GET /api/settings
```

### 更新系統設定

```http
PUT /api/settings
```

**權限：** admin, staff

**請求體：**
```json
{
  "system_name": "智慧學習歷程系統",
  "organization_name": "樂高機器人教室"
}
```

### 取得假日列表

```http
GET /api/settings/holidays
```

**查詢參數：**
| 參數 | 類型 | 說明 |
|------|------|------|
| year | number | 年份 |
| type | string | 類型：national, custom |

### 新增假日

```http
POST /api/settings/holidays
```

**請求體：**
```json
{
  "holiday_date": "2026-12-31",
  "name": "跨年假",
  "type": "custom"
}
```

### 批次匯入假日

```http
POST /api/settings/holidays/import
```

**請求體：**
```json
{
  "holidays": [
    { "holiday_date": "2026-01-01", "name": "元旦", "type": "national" },
    { "holiday_date": "2026-01-28", "name": "除夕", "type": "national" }
  ]
}
```

### 更新假日

```http
PUT /api/settings/holidays/:id
```

### 刪除假日

```http
DELETE /api/settings/holidays/:id
```

### 取得通知設定

```http
GET /api/settings/notifications
```

### 更新通知設定

```http
PUT /api/settings/notifications/:type
```

**請求體：**
```json
{
  "is_enabled": true,
  "config": {
    "hours_after_class": 2
  }
}
```

### 取得教室列表

```http
GET /api/settings/classrooms
```

### 新增教室

```http
POST /api/settings/classrooms
```

**請求體：**
```json
{
  "name": "新教室",
  "address": "地址",
  "capacity": 15
}
```

### 更新教室

```http
PUT /api/settings/classrooms/:id
```

### 刪除教室

```http
DELETE /api/settings/classrooms/:id
```

---

## 錯誤回應

所有 API 的錯誤回應格式：

```json
{
  "success": false,
  "message": "錯誤訊息"
}
```

### HTTP 狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 200 | 成功 |
| 201 | 建立成功 |
| 400 | 請求參數錯誤 |
| 401 | 未認證或 Token 無效 |
| 403 | 沒有權限 |
| 404 | 找不到資源 |
| 500 | 伺服器錯誤 |

---

## 前端使用範例

### 使用 api.js

```html
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script src="js/api.js"></script>
<script>
// 登入
async function login() {
  try {
    const result = await api.auth.login({
      username: 'admin',
      password: 'admin123'
    });

    if (result.success) {
      localStorage.setItem('authToken', result.data.token);
      window.location.href = result.data.redirectUrl;
    }
  } catch (error) {
    console.error('登入失敗');
  }
}

// 取得學生列表
async function loadStudents() {
  const result = await api.students.getAll({ page: 1, limit: 10 });
  console.log(result.data.students);
}

// 新增假日
async function addHoliday() {
  await api.settings.holidays.create({
    holiday_date: '2026-12-25',
    name: '聖誕節',
    type: 'custom'
  });
}
</script>
```

### 直接使用 Axios

```javascript
const token = localStorage.getItem('authToken');

axios.get('http://localhost:3000/api/students', {
  headers: {
    'Authorization': `Bearer ${token}`
  },
  params: {
    status: 'active',
    page: 1
  }
}).then(response => {
  console.log(response.data);
});
```
