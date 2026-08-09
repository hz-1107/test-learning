# 智慧學習歷程系統

一個完整的學習管理系統，專為機器人教室/補習班設計，用於管理學生、教師、課程、日誌和點數系統。

## 功能特色

- **學生管理**：學生資料、選課、點數、學習歷程
- **教師管理**：教師資料、課程安排、日誌填寫
- **課程管理**：課程類型、時段排程、選課管理
- **日誌系統**：課程日誌、學生表現記錄、能力評分
- **點數系統**：點數獲得、兌換獎品
- **系統設定**：假日管理、通知設定、教室管理

## 系統架構

```
test-learning/
├── index.html              # 首頁
├── login.html              # 登入頁面
├── api-tester.html         # API 測試工具
├── css/
│   └── styles.css          # 全域樣式
├── js/
│   ├── main.js             # 主要 JavaScript
│   └── api.js              # API 服務模組 (Axios)
├── admin/                  # 管理員端頁面
├── staff/                  # 行政人員端頁面
├── teacher/                # 教師端頁面
├── student/                # 學生端頁面
├── server/                 # Node.js 後端
│   ├── server.js           # 伺服器主程式
│   ├── package.json        # 套件設定
│   ├── config/             # 設定檔
│   ├── routes/             # API 路由
│   ├── controllers/        # 控制器
│   └── middleware/         # 中介軟體
├── database/
│   └── schema.sql          # 資料庫結構
└── docs/
    └── API.md              # API 文件
```

## 快速開始

### 1. 安裝資料庫

1. 安裝 MySQL 8.0 或以上版本
2. 建立資料庫並匯入結構：

```bash
mysql -u root -p < database/schema.sql
```

### 2. 設定後端

```bash
# 進入 server 目錄
cd server

# 安裝依賴套件
npm install

# 複製環境變數範例檔
cp .env.example .env

# 編輯 .env 檔案，設定資料庫連線資訊
```

**.env 檔案設定：**

```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的密碼
DB_NAME=learning_system

JWT_SECRET=你的JWT密鑰
JWT_EXPIRES_IN=7d
```

### 3. 啟動後端伺服器

```bash
# 開發模式 (自動重啟)
npm run dev

# 或正式模式
npm start
```

伺服器會在 `http://localhost:3000` 啟動。

### 4. 開啟前端頁面

直接在瀏覽器開啟 `login.html` 或使用 Live Server。

## 預設帳號

| 角色 | 帳號 | 密碼 |
|------|------|------|
| 管理員 | admin | admin123 |

> 注意：首次使用請先透過 API 建立其他使用者帳號。

## API 測試

開啟 `api-tester.html` 可以使用視覺化的 API 測試工具：

1. 在瀏覽器開啟 `api-tester.html`
2. 使用「快速登入」取得 Token
3. 點擊左側 API 項目測試各端點

## 技術棧

### 前端
- HTML5 / CSS3 / JavaScript (ES6+)
- Axios (HTTP 請求)
- Chart.js (圖表)
- BEM 命名規範

### 後端
- Node.js
- Express.js
- MySQL 8.0
- JWT 認證
- bcrypt 密碼加密

## 開發說明

### 新增 API 端點

1. 在 `server/controllers/` 建立或修改控制器
2. 在 `server/routes/` 設定路由
3. 在 `server/routes/index.js` 註冊路由
4. 在 `js/api.js` 新增前端 API 方法

### CSS 變數

專案使用 CSS 變數管理主題色彩：

```css
:root {
  --color-primary: #FFD700;
  --color-primary-dark: #755F00;
  --color-surface: #FFFFFF;
  --color-background: #F5F5F5;
}
```

## 授權

MIT License
