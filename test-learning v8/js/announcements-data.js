// 公告管理 (admin/announcements.html) 使用的共用資料與邏輯：公告類型、發送對象範圍、公告歷史、定時公告存取。

const ANNOUNCEMENT_TYPES = ['一般', '緊急'];
const AUDIENCE_SCOPES = ['全校', '特定班級', '特定身分'];
const AUDIENCE_CLASSES = ['程式機械', '動力機械', '科創機器人', '幼兒簡易機械'];
const AUDIENCE_ROLES = ['學生', '教師', '行政'];

// 公告歷史（已發布的公告）
const ANNOUNCEMENTS = [
  {
    id: 'a1',
    title: '期末發表會場地異動通知',
    content: '因場地維修，本週六科創機器人課程期末發表會改至沙鹿校區3樓大教室，請留意時間地點變更。',
    type: '緊急',
    scope: '特定班級',
    scopeDetail: ['科創機器人'],
    isPinned: true,
    publishedAt: '2026-07-25 09:00',
    author: '嚴大明 老師'
  },
  {
    id: 'a2',
    title: '系統暑期維護公告',
    content: '系統將於 8/3 凌晨 2:00-4:00 進行例行維護，期間可能無法登入，造成不便敬請見諒。',
    type: '一般',
    scope: '全校',
    scopeDetail: [],
    isPinned: false,
    publishedAt: '2026-07-20 14:30',
    author: '嚴大明 老師'
  },
  {
    id: 'a3',
    title: '教師日誌填寫提醒',
    content: '請各位教師記得於每週五前完成教師日誌填寫，逾期將影響月結作業。',
    type: '一般',
    scope: '特定身分',
    scopeDetail: ['教師'],
    isPinned: false,
    publishedAt: '2026-07-15 10:00',
    author: '嚴大明 老師'
  }
];

// 定時公告（尚未發布，排定於未來時間自動發布）
const SCHEDULED_ANNOUNCEMENTS = [
  {
    id: 's1',
    title: '新學期課程異動預告',
    content: '下學期起動力機械班將新增假日班，詳細資訊將於開學前一週公布。',
    type: '一般',
    scope: '全校',
    scopeDetail: [],
    isPinned: false,
    scheduledAt: '2026-08-15T09:00',
    author: '嚴大明 老師'
  },
  {
    id: 's2',
    title: '颱風停課準備通知',
    content: '如遇颱風假，將以此系統公告最新停課資訊，請隨時關注。',
    type: '緊急',
    scope: '全校',
    scopeDetail: [],
    isPinned: true,
    scheduledAt: '2026-09-01T08:00',
    author: '嚴大明 老師'
  }
];

// 產生下一個公告 / 定時公告 id
function generateAnnouncementId(prefix) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

// 將發送對象組成可讀文字，例如「特定班級：程式機械、動力機械」
function formatAudienceScope(item) {
  if (item.scope === '全校') return '全校';
  if (!item.scopeDetail || item.scopeDetail.length === 0) return item.scope;
  return `${item.scope}：${item.scopeDetail.join('、')}`;
}
