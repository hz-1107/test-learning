// 學生端 - 圖表字體放大（需在 chart.js 之後載入）
// 包含座標軸刻度、圖例，以及滑鼠移到資料點時顯示的提示框
(function () {
  if (!window.Chart) return;
  const d = Chart.defaults;
  d.font.size = 15;
  d.plugins.tooltip.titleFont = { size: 17, weight: 'bold' };
  d.plugins.tooltip.bodyFont = { size: 16 };
  d.plugins.tooltip.footerFont = { size: 15 };
  d.plugins.tooltip.padding = 12;
  d.plugins.tooltip.boxWidth = 14;
  d.plugins.tooltip.boxHeight = 14;
  d.plugins.tooltip.boxPadding = 6;
})();
