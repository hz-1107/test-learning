# 智慧學習歷程系統 - 資料庫架構說明

## 目錄

1. [概述](#概述)
2. [資料庫規格](#資料庫規格)
3. [ER 關聯圖](#er-關聯圖)
4. [資料表說明](#資料表說明)
5. [資料表關聯](#資料表關聯)
6. [索引設計](#索引設計)
7. [初始資料](#初始資料)
8. [常用查詢範例](#常用查詢範例)

---

## 概述

本系統採用 **MySQL 8.0** 作為資料庫管理系統，資料庫名稱為 `learning_system`。

系統主要管理以下資料：
- 使用者（管理員、行政人員、教師、學生）
- 課程與排程
- 課程日誌與學生表現記錄
- 點數與獎品兌換
- 系統設定（假日、通知、教室）

---

## 資料庫規格

| 項目 | 規格 |
|------|------|
| 資料庫系統 | MySQL 8.0+ |
| 字元集 | utf8mb4 |
| 排序規則 | utf8mb4_unicode_ci |
| 資料庫名稱 | learning_system |

---

## ER 關聯圖

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              使用者模組                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│    ┌──────────┐         ┌──────────┐         ┌──────────┐                  │
│    │  users   │────────▶│ teachers │         │ students │◀────────┐        │
│    │ (使用者) │         │  (教師)  │         │  (學生)  │         │        │
│    └──────────┘         └──────────┘         └──────────┘         │        │
│         │                    │                    │               │        │
│         │                    │                    │               │        │
└─────────┼────────────────────┼────────────────────┼───────────────┼────────┘
          │                    │                    │               │
          │                    ▼                    │               │
┌─────────┼───────────────────────────────────────────────────────────────────┐
│         │               課程模組                  │               │         │
├─────────┼───────────────────────────────────────────────────────────────────┤
│         │    ┌─────────────┐    ┌──────────────┐ │               │         │
│         │    │course_types │    │  classrooms  │ │               │         │
│         │    │ (課程類型)  │    │   (教室)     │ │               │         │
│         │    └─────────────┘    └──────────────┘ │               │         │
│         │           │                  │         │               │         │
│         │           ▼                  ▼         ▼               │         │
│         │    ┌─────────────────────────────┐    ┌────────────────┴───┐     │
│         │    │          courses            │    │ course_enrollments │     │
│         │    │          (課程)             │◀───│     (學生選課)     │     │
│         │    └─────────────────────────────┘    └────────────────────┘     │
│         │                   │                                              │
│         │                   ▼                                              │
│         │    ┌─────────────────────────────┐                               │
│         │    │     course_schedules        │                               │
│         │    │       (課程時段)            │                               │
│         │    └─────────────────────────────┘                               │
│         │                                                                  │
└─────────┼──────────────────────────────────────────────────────────────────┘
          │
          │
┌─────────┼──────────────────────────────────────────────────────────────────┐
│         │               日誌模組                                            │
├─────────┼──────────────────────────────────────────────────────────────────┤
│         │                                                                  │
│         │    ┌─────────────────────────────┐                               │
│         └───▶│        course_logs          │                               │
│              │        (課程日誌)           │                               │
│              └─────────────────────────────┘                               │
│                         │           │                                      │
│                         │           │                                      │
│                         ▼           ▼                                      │
│    ┌────────────────────────┐  ┌────────────────────────┐                  │
│    │    log_permissions     │  │  student_log_records   │                  │
│    │    (日誌填寫權限)      │  │   (學生日誌記錄)       │                  │
│    └────────────────────────┘  └────────────────────────┘                  │
│                                          │                                 │
│                                          ▼                                 │
│                                ┌────────────────────────┐                  │
│                                │  student_log_photos    │                  │
│                                │   (學生日誌照片)       │                  │
│                                └────────────────────────┘                  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                              點數模組                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│    ┌────────────────────────┐         ┌────────────────────────┐          │
│    │   point_transactions   │         │        rewards         │          │
│    │     (點數交易記錄)     │         │        (獎品)          │          │
│    └────────────────────────┘         └────────────────────────┘          │
│              ▲                                   │                         │
│              │                                   ▼                         │
│              │                        ┌────────────────────────┐          │
│              └────────────────────────│  reward_redemptions    │          │
│                                       │    (獎品兌換記錄)      │          │
│                                       └────────────────────────┘          │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────────┐
│                              系統設定模組                                   │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│    ┌────────────────┐  ┌────────────────┐  ┌────────────────────────┐     │
│    │    holidays    │  │system_settings │  │ notification_settings  │     │
│    │    (假日)      │  │  (系統設定)    │  │     (通知設定)         │     │
│    └────────────────┘  └────────────────┘  └────────────────────────┘     │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## 資料表說明

### 1. 使用者模組

#### `users` - 使用者表
所有使用者的基本帳號資訊。

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| username | VARCHAR(50) | 帳號 | NOT NULL, UNIQUE |
| password | VARCHAR(255) | 密碼 (bcrypt) | NOT NULL |
| email | VARCHAR(100) | 電子郵件 | |
| role | ENUM | 角色 | 'admin', 'staff', 'teacher', 'student' |
| name | VARCHAR(100) | 姓名 | NOT NULL |
| phone | VARCHAR(20) | 電話 | |
| avatar | VARCHAR(255) | 頭像 URL | |
| is_active | BOOLEAN | 是否啟用 | DEFAULT TRUE |
| created_at | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TIMESTAMP | 更新時間 | ON UPDATE CURRENT_TIMESTAMP |

#### `teachers` - 教師表
教師的額外資訊。

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| user_id | INT | 使用者 ID | FK → users.id |
| school | VARCHAR(100) | 就讀/畢業學校 | |
| specialty | VARCHAR(255) | 專長 | |
| hire_date | DATE | 到職日期 | |
| status | ENUM | 狀態 | 'active', 'inactive', 'on_leave' |
| notes | TEXT | 備註 | |

#### `students` - 學生表
學生的額外資訊。

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| user_id | INT | 使用者 ID | FK → users.id |
| student_code | VARCHAR(20) | 學生編號 | UNIQUE |
| birth_date | DATE | 生日 | |
| gender | ENUM | 性別 | 'male', 'female', 'other' |
| school | VARCHAR(100) | 就讀學校 | |
| grade | VARCHAR(20) | 年級 | |
| parent_name | VARCHAR(100) | 家長姓名 | |
| parent_phone | VARCHAR(20) | 家長電話 | |
| parent_email | VARCHAR(100) | 家長信箱 | |
| address | TEXT | 地址 | |
| enrollment_date | DATE | 入學日期 | |
| status | ENUM | 狀態 | 'active', 'inactive', 'graduated' |
| notes | TEXT | 備註 | |

---

### 2. 課程模組

#### `classrooms` - 教室表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| name | VARCHAR(100) | 教室名稱 | NOT NULL |
| address | TEXT | 地址 | |
| capacity | INT | 容納人數 | DEFAULT 20 |
| is_active | BOOLEAN | 是否啟用 | DEFAULT TRUE |

#### `course_types` - 課程類型表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| name | VARCHAR(100) | 類型名稱 | NOT NULL |
| description | TEXT | 說明 | |
| color | VARCHAR(20) | 顯示顏色 | HEX 色碼 |
| is_active | BOOLEAN | 是否啟用 | DEFAULT TRUE |

#### `courses` - 課程表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| course_type_id | INT | 課程類型 ID | FK → course_types.id |
| name | VARCHAR(200) | 課程名稱 | NOT NULL |
| description | TEXT | 課程說明 | |
| teacher_id | INT | 授課教師 ID | FK → teachers.id |
| classroom_id | INT | 教室 ID | FK → classrooms.id |
| max_students | INT | 最大學生數 | DEFAULT 10 |
| fee | DECIMAL(10,2) | 費用 | DEFAULT 0 |
| status | ENUM | 狀態 | 'active', 'inactive', 'completed' |

#### `course_schedules` - 課程時段表
每週固定的上課時段。

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| course_id | INT | 課程 ID | FK → courses.id |
| day_of_week | TINYINT | 星期幾 | 0=週日, 1=週一, ..., 6=週六 |
| start_time | TIME | 開始時間 | NOT NULL |
| end_time | TIME | 結束時間 | NOT NULL |
| classroom_id | INT | 教室 ID | FK → classrooms.id |
| is_active | BOOLEAN | 是否啟用 | DEFAULT TRUE |

#### `course_enrollments` - 學生選課表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| schedule_id | INT | 課程時段 ID | FK → course_schedules.id |
| student_id | INT | 學生 ID | FK → students.id |
| enrolled_at | TIMESTAMP | 選課時間 | DEFAULT CURRENT_TIMESTAMP |
| status | ENUM | 狀態 | 'enrolled', 'dropped', 'completed' |

**唯一索引：** (schedule_id, student_id)

> 注意：`course_enrollments` 沒有直接的 `course_id` 欄位，需透過 `schedule_id` → `course_schedules.course_id` 才能取得所屬課程。

#### `schedule_adjustments` - 調課記錄表

課表/調課功能 (`server/controllers/scheduleCalendarController.js`) 使用的資料表。

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| schedule_id | INT | 原始課程時段 ID | FK → course_schedules.id |
| original_date | DATE | 原始上課日期 | NOT NULL |
| adjusted_date | DATE | 調整後日期 | 取消課程時可為 NULL |
| adjusted_start_time | TIME | 調整後開始時間 | |
| adjusted_end_time | TIME | 調整後結束時間 | |
| adjusted_classroom_id | INT | 調整後教室 | FK → classrooms.id |
| adjustment_type | ENUM | 調課類型 | 'reschedule'(改期/補課), 'cancel'(取消) |
| reason | VARCHAR(255) | 調課原因 | |
| status | ENUM | 調課記錄狀態 | 'confirmed', 'cancelled' |
| created_by | INT | 建立者 | FK → users.id |
| created_at | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |

**唯一索引：** (schedule_id, original_date)

---

### 3. 日誌模組

#### `course_logs` - 課程日誌表
每堂課的日誌記錄。

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| course_id | INT | 課程 ID | FK → courses.id, NOT NULL |
| schedule_id | INT | 時段 ID | FK → course_schedules.id |
| log_date | DATE | 日誌日期 | NOT NULL |
| start_time | TIME | 開始時間 | |
| end_time | TIME | 結束時間 | |
| classroom_id | INT | 教室 ID | FK → classrooms.id |
| teacher_id | INT | 授課教師 ID | FK → teachers.id, NOT NULL |
| topic | VARCHAR(255) | 課程主題 | |
| content | TEXT | 課程內容 | |
| outline | TEXT | 課程大綱 | JSON 格式 |
| status | ENUM | 狀態 | 'pending', 'in_progress', 'completed' |

#### `log_permissions` - 日誌填寫權限表
允許其他教師填寫日誌的權限設定。

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| log_id | INT | 日誌 ID | FK → course_logs.id |
| teacher_id | INT | 教師 ID | FK → teachers.id |
| granted_by | INT | 授權者 | FK → users.id |
| granted_at | TIMESTAMP | 授權時間 | DEFAULT CURRENT_TIMESTAMP |

**唯一索引：** (log_id, teacher_id)

#### `student_log_records` - 學生日誌記錄表
每個學生在每堂課的表現記錄。

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| log_id | INT | 日誌 ID | FK → course_logs.id |
| student_id | INT | 學生 ID | FK → students.id |
| attendance | ENUM | 出席狀態 | 'present', 'absent', 'late', 'excused' |
| performance | TEXT | 課堂表現 | |
| notes | TEXT | 備註 | |
| skill_programming | TINYINT | 程式能力 | 1-5 分 |
| skill_debugging | TINYINT | 除錯能力 | 1-5 分 |
| skill_creativity | TINYINT | 創意能力 | 1-5 分 |
| skill_structure | TINYINT | 結構能力 | 1-5 分 |
| skill_teamwork | TINYINT | 團隊合作 | 1-5 分 |
| points_earned | INT | 獲得點數 | DEFAULT 0 |

**唯一索引：** (log_id, student_id)

#### `student_log_photos` - 學生日誌照片表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| record_id | INT | 學生記錄 ID | FK → student_log_records.id |
| photo_url | VARCHAR(500) | 照片 URL | NOT NULL |
| caption | VARCHAR(255) | 說明文字 | |
| uploaded_at | TIMESTAMP | 上傳時間 | DEFAULT CURRENT_TIMESTAMP |

---

### 4. 點數模組

#### `point_transactions` - 點數交易記錄表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| student_id | INT | 學生 ID | FK → students.id, NOT NULL |
| points | INT | 點數變化 | 正=獲得, 負=扣除 |
| type | ENUM | 類型 | 'earn', 'redeem', 'adjust', 'expire' |
| reason | VARCHAR(255) | 原因說明 | |
| reference_type | VARCHAR(50) | 關聯類型 | 'log', 'reward', etc. |
| reference_id | INT | 關聯 ID | |
| created_by | INT | 操作者 | FK → users.id |
| created_at | TIMESTAMP | 建立時間 | DEFAULT CURRENT_TIMESTAMP |

#### `rewards` - 獎品表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| name | VARCHAR(200) | 獎品名稱 | NOT NULL |
| description | TEXT | 說明 | |
| points_required | INT | 所需點數 | NOT NULL |
| quantity | INT | 庫存數量 | DEFAULT 0 |
| image_url | VARCHAR(500) | 圖片 URL | |
| is_active | BOOLEAN | 是否上架 | DEFAULT TRUE |

#### `reward_redemptions` - 獎品兌換記錄表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| student_id | INT | 學生 ID | FK → students.id |
| reward_id | INT | 獎品 ID | FK → rewards.id |
| points_used | INT | 使用點數 | NOT NULL |
| status | ENUM | 狀態 | 'pending', 'completed', 'cancelled' |
| redeemed_at | TIMESTAMP | 兌換時間 | DEFAULT CURRENT_TIMESTAMP |
| completed_at | TIMESTAMP | 完成時間 | |

---

### 5. 系統設定模組

#### `holidays` - 假日設定表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| holiday_date | DATE | 假日日期 | NOT NULL, UNIQUE |
| name | VARCHAR(100) | 假日名稱 | NOT NULL |
| type | ENUM | 類型 | 'national', 'custom' |
| is_recurring | BOOLEAN | 每年重複 | DEFAULT FALSE |

#### `system_settings` - 系統設定表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| setting_key | VARCHAR(100) | 設定鍵 | NOT NULL, UNIQUE |
| setting_value | TEXT | 設定值 | |
| description | VARCHAR(255) | 說明 | |
| updated_at | TIMESTAMP | 更新時間 | ON UPDATE CURRENT_TIMESTAMP |

#### `notification_settings` - 通知設定表

| 欄位 | 類型 | 說明 | 限制 |
|------|------|------|------|
| id | INT | 主鍵 | AUTO_INCREMENT |
| type | VARCHAR(50) | 通知類型 | NOT NULL, UNIQUE |
| is_enabled | BOOLEAN | 是否啟用 | DEFAULT TRUE |
| config | JSON | 設定參數 | |
| updated_at | TIMESTAMP | 更新時間 | ON UPDATE CURRENT_TIMESTAMP |

---

## 資料表關聯

### 外鍵關係

```
users (1) ──────────── (1) teachers
users (1) ──────────── (1) students

course_types (1) ───── (N) courses
teachers (1) ────────── (N) courses
classrooms (1) ──────── (N) courses

courses (1) ─────────── (N) course_schedules
course_schedules (1) ── (N) course_enrollments
students (1) ─────────── (N) course_enrollments
course_schedules (1) ── (N) schedule_adjustments
classrooms (1) ───────── (N) schedule_adjustments

courses (1) ─────────── (N) course_logs
teachers (1) ─────────── (N) course_logs
classrooms (1) ──────── (N) course_logs

course_logs (1) ──────── (N) log_permissions
course_logs (1) ──────── (N) student_log_records
teachers (1) ──────────── (N) log_permissions

student_log_records (1) ─ (N) student_log_photos

students (1) ──────────── (N) point_transactions
students (1) ──────────── (N) reward_redemptions
rewards (1) ────────────── (N) reward_redemptions
```

### 刪除級聯 (ON DELETE CASCADE)

以下關聯設定了刪除級聯，當父記錄被刪除時，子記錄會自動刪除：

- `users` → `teachers`, `students`
- `courses` → `course_schedules`
- `course_schedules` → `course_enrollments`, `schedule_adjustments`
- `course_logs` → `log_permissions`, `student_log_records`
- `student_log_records` → `student_log_photos`
- `students` → `point_transactions`

---

## 索引設計

### 主要索引

| 資料表 | 索引名稱 | 欄位 | 類型 |
|--------|----------|------|------|
| users | PRIMARY | id | 主鍵 |
| users | idx_users_role | role | 一般 |
| users | idx_users_username | username | 唯一 |
| students | idx_students_status | status | 一般 |
| teachers | idx_teachers_status | status | 一般 |
| courses | idx_courses_status | status | 一般 |
| course_logs | idx_course_logs_date | log_date | 一般 |
| course_logs | idx_course_logs_status | status | 一般 |
| point_transactions | idx_point_transactions_student | student_id | 一般 |
| holidays | idx_holidays_date | holiday_date | 一般 |

### 複合唯一索引

| 資料表 | 索引名稱 | 欄位 |
|--------|----------|------|
| course_enrollments | unique_enrollment | (schedule_id, student_id) |
| log_permissions | unique_permission | (log_id, teacher_id) |
| student_log_records | unique_student_log | (log_id, student_id) |

---

## 初始資料

### 預設教室

| 名稱 | 地址 |
|------|------|
| 西屯教室 | 台中市西屯區西屯路二段123號 |
| 沙鹿教室 | 台中市沙鹿區中山路456號 |

### 預設課程類型

| 名稱 | 顏色 |
|------|------|
| 幼兒簡易機械 | #4CAF50 |
| 動力機械 | #2196F3 |
| 程式機械 | #FF9800 |
| 科創機器人 | #9C27B0 |
| 專題班 | #F44336 |

### 預設管理員帳號

| 帳號 | 角色 | 姓名 |
|------|------|------|
| admin | admin | 系統管理員 |

> **注意：** 預設密碼需要使用 bcrypt 加密，首次部署請手動建立。

### 預設國定假日 (2026年)

- 01/01 元旦
- 01/28 除夕
- 01/29-31 春節
- 02/28 和平紀念日
- 04/04 兒童節
- 04/05 清明節
- 05/01 勞動節
- 05/31 端午節
- 09/21 中秋節
- 10/10 國慶日

---

## 常用查詢範例

### 1. 取得學生的點數餘額

```sql
SELECT
    s.id,
    u.name,
    COALESCE(SUM(pt.points), 0) as balance
FROM students s
JOIN users u ON s.user_id = u.id
LEFT JOIN point_transactions pt ON s.id = pt.student_id
WHERE s.id = 1
GROUP BY s.id, u.name;
```

### 2. 取得某日期的課程日誌列表

```sql
SELECT
    cl.*,
    c.name as course_name,
    cr.name as classroom_name,
    u.name as teacher_name
FROM course_logs cl
JOIN courses c ON cl.course_id = c.id
LEFT JOIN classrooms cr ON cl.classroom_id = cr.id
JOIN teachers t ON cl.teacher_id = t.id
JOIN users u ON t.user_id = u.id
WHERE cl.log_date = '2026-07-26'
ORDER BY cl.start_time;
```

### 3. 取得學生的能力雷達圖數據

```sql
SELECT
    AVG(skill_programming) as programming,
    AVG(skill_debugging) as debugging,
    AVG(skill_creativity) as creativity,
    AVG(skill_structure) as structure,
    AVG(skill_teamwork) as teamwork
FROM student_log_records
WHERE student_id = 1;
```

### 4. 取得教師的未填寫日誌數量

```sql
SELECT
    t.id,
    u.name,
    COUNT(cl.id) as pending_logs
FROM teachers t
JOIN users u ON t.user_id = u.id
LEFT JOIN course_logs cl ON t.id = cl.teacher_id AND cl.status = 'pending'
WHERE t.status = 'active'
GROUP BY t.id, u.name;
```

### 5. 取得課程的選課學生列表

```sql
SELECT
    s.id,
    s.student_code,
    u.name,
    u.phone,
    ce.enrolled_at
FROM course_enrollments ce
JOIN course_schedules cs ON ce.schedule_id = cs.id
JOIN students s ON ce.student_id = s.id
JOIN users u ON s.user_id = u.id
WHERE cs.course_id = 1 AND ce.status = 'enrolled'
ORDER BY u.name;
```

### 6. 檢查某日期是否為假日

```sql
SELECT EXISTS(
    SELECT 1 FROM holidays
    WHERE holiday_date = '2026-01-01'
) as is_holiday;
```

### 7. 取得本週的課程排程

```sql
SELECT
    cs.*,
    c.name as course_name,
    u.name as teacher_name,
    cr.name as classroom_name
FROM course_schedules cs
JOIN courses c ON cs.course_id = c.id
JOIN teachers t ON c.teacher_id = t.id
JOIN users u ON t.user_id = u.id
LEFT JOIN classrooms cr ON cs.classroom_id = cr.id
WHERE cs.is_active = TRUE AND c.status = 'active'
ORDER BY cs.day_of_week, cs.start_time;
```

---

## 維護建議

### 定期清理

1. **過期的點數交易記錄**：超過 2 年的記錄可考慮歸檔
2. **日誌照片**：定期清理未關聯的照片檔案
3. **已刪除使用者的相關資料**：確認級聯刪除正確執行

### 備份策略

```bash
# 每日完整備份
mysqldump -u root -p learning_system > backup_$(date +%Y%m%d).sql

# 壓縮備份
mysqldump -u root -p learning_system | gzip > backup_$(date +%Y%m%d).sql.gz
```

### 效能監控

監控以下查詢的執行時間：
- 日誌列表查詢（大量 JOIN）
- 點數餘額計算（SUM 聚合）
- 課程排程查詢（多表關聯）

---

## 版本歷史

| 版本 | 日期 | 說明 |
|------|------|------|
| 1.0.0 | 2026-07-27 | 初始版本 |
