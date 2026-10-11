/**
 * 能力評估（雷達圖 + 指標長條圖）共用元件
 * 行政端「課程日誌詳情」與教師端「查看完整檔案」共用，搭配 css/ability-chart.css。
 * 需先載入 Chart.js。
 */

// 顏色與指標定義：兩端都引用這一份
const ABILITY_THEME = {
  radar: {
    fill: 'rgba(255, 219, 88, 0.3)',
    line: '#ffdb58',
    point: '#ffdb58',
    pointBorder: '#fff',
    grid: '#e5e7eb',
    label: '#6b7280',
    labelSize: 14
  },
  skills: [
    { key: 'programming', label: '程式', color: '#ffdb58', description: '學生的抽象思維、流程圖概念與程式碼邏輯建構' },
    { key: 'debugging', label: '除錯', color: '#5ada46', description: '面對失敗、系統卡關時的應變策略、耐心與獨立解決能力' },
    { key: 'creativity', label: '創意', color: '#ff7158', description: '作品是否有獨創性、能否跳脫框架，或在既有基礎上延伸出新功能' },
    { key: 'structure', label: '結構', color: '#58bcff', description: '學生將科學理論轉化為實體結構的動手做能力' },
    { key: 'teamwork', label: '團隊合作', color: '#ff58bc', description: '軟實力，包含與同儕的溝通協調、互助，以及對外展現作品的論述能力' }
  ]
};

// 更新時間文字，例：*更新時間：2026 / 10 / 07(三)
function formatAbilityUpdateDate(dateValue) {
  const date = dateValue ? new Date(dateValue) : null;
  if (!date || isNaN(date)) return '*更新時間：—';
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];
  return `*更新時間：${date.getFullYear()} / ${String(date.getMonth() + 1).padStart(2, '0')} / ${String(date.getDate()).padStart(2, '0')}(${dayNames[date.getDay()]})`;
}

// 單一指標：名稱、分數、說明圖示與長條
function renderAbilityItem(skill, rawScore) {
  const score = rawScore || 0;
  const percent = Math.max(0, Math.min(100, (score / 5) * 100));
  return `
    <div class="ability-item">
      <div class="ability-item__row">
        <span class="ability-item__name">${skill.label}</span>
        <span class="ability-item__score">${score} / 5</span>
        <span class="ability-item__help-wrap">
          <button type="button" class="ability-item__help" onclick="toggleAbilityTip(this)" aria-label="${skill.label}說明">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </button>
          <span class="ability-item__tip">${skill.description}</span>
        </span>
      </div>
      <div class="ability-item__bar">
        <span class="ability-item__bar-fill" style="width: ${percent}%; background: ${skill.color};"></span>
      </div>
    </div>
  `;
}

// 五個指標的長條圖；scores 以指標 key 對應分數（0~5）
function renderAbilityList(scores) {
  return ABILITY_THEME.skills.map(skill => renderAbilityItem(skill, scores?.[skill.key])).join('');
}

// 雷達圖 + 長條圖的完整區塊
function renderAbilitySection(canvasId, scores) {
  return `
    <div class="ability-section">
      <div class="ability-section__radar">
        <canvas id="${canvasId}"></canvas>
      </div>
      <div class="ability-list">
        ${renderAbilityList(scores)}
      </div>
    </div>
  `;
}

// 建立雷達圖；scores 以指標 key 對應分數（0~5）
function createAbilityRadarChart(canvasId, scores) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) return null;

  const { radar, skills } = ABILITY_THEME;
  return new Chart(ctx, {
    type: 'radar',
    data: {
      labels: skills.map(skill => skill.label),
      datasets: [{
        data: skills.map(skill => scores?.[skill.key] || 0),
        backgroundColor: radar.fill,
        borderColor: radar.line,
        borderWidth: 2,
        pointBackgroundColor: radar.point,
        pointBorderColor: radar.pointBorder,
        pointHoverBackgroundColor: radar.pointBorder,
        pointHoverBorderColor: radar.point
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      scales: {
        r: {
          beginAtZero: true,
          max: 5,
          ticks: { stepSize: 1, display: false },
          grid: { color: radar.grid },
          angleLines: { color: radar.grid },
          pointLabels: { font: { size: radar.labelSize }, color: radar.label }
        }
      },
      plugins: { legend: { display: false } }
    }
  });
}

// 指標說明提示：點問號開關，點其他地方關閉
function toggleAbilityTip(btn) {
  const wrap = btn.closest('.ability-item__help-wrap');
  if (!wrap) return;
  const wasOpen = wrap.classList.contains('tip-open');
  document.querySelectorAll('.ability-item__help-wrap.tip-open').forEach(el => el.classList.remove('tip-open'));
  if (!wasOpen) wrap.classList.add('tip-open');
}

document.addEventListener('click', (event) => {
  if (event.target.closest('.ability-item__help-wrap')) return;
  document.querySelectorAll('.ability-item__help-wrap.tip-open').forEach(el => el.classList.remove('tip-open'));
});
