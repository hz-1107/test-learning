/**
 * 批量匯出 PDF 共用工具
 *
 * 不是直接把畫面上的卡片截圖丟進 PDF，而是另外組一份「報告書」版型
 * （品牌標頭、學生資訊、統計摘要、條列式紀錄、頁尾頁碼），
 * 用 html2canvas 把版型渲染成圖片，再用 jsPDF 依 A4 分頁組成 PDF 檔下載。
 * 依賴：html2canvas、jsPDF（見各頁面 </body> 前引入的 CDN script）
 */

const PDF_BRAND = {
  primary: '#ffdb58',
  primaryDark: '#755f00',
  primaryLight: '#ffeca6',
  textPrimary: '#1a1c1c',
  textSecondary: '#4c4635',
  textMuted: '#7e7763',
  border: '#cfc6af',
  surfaceAlt: '#f9f9f9'
};

/**
 * 組出報告書 HTML（品牌標頭 + 學生資訊 + 統計摘要 + 條列式紀錄）
 * @param {Object} opts
 * @param {string} opts.docTitle - 文件標題，例如「學習歷程報告書」
 * @param {string} opts.studentName - 學生姓名
 * @param {string} opts.generatedAt - 匯出時間字串
 * @param {number} opts.totalCount - 資料筆數
 * @param {{label:string, value:string}[]} opts.summaryStats - 統計摘要卡片
 * @param {string} opts.entriesHtml - 已組好的條列式紀錄 HTML
 */
function buildPdfReportContainer({ docTitle, studentName, generatedAt, totalCount, summaryStats, entriesHtml }) {
  const container = document.createElement('div');
  container.style.cssText = [
    'position:fixed',
    'left:-10000px',
    'top:0',
    'width:794px',
    'background:#ffffff',
    'padding:40px',
    'box-sizing:border-box',
    'font-family:"Noto Sans TC","Inter",sans-serif',
    'color:' + PDF_BRAND.textPrimary
  ].join(';');

  const statsHtml = summaryStats.map(stat => `
    <div style="flex:1;background:${PDF_BRAND.primaryLight};border-radius:10px;padding:14px 12px;text-align:center;">
      <div style="font-size:24px;font-weight:700;color:${PDF_BRAND.primaryDark};line-height:1.2;">${stat.value}</div>
      <div style="font-size:11px;color:${PDF_BRAND.textSecondary};margin-top:4px;">${stat.label}</div>
    </div>
  `).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <svg width="20" height="18" viewBox="0 0 33 29" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M16.5 0L33 29H0L16.5 0Z" fill="${PDF_BRAND.primaryDark}"/>
        </svg>
        <span style="font-size:13px;font-weight:600;color:${PDF_BRAND.primaryDark};">FUN學科技教育中心</span>
      </div>
      <span style="font-size:12px;color:${PDF_BRAND.textMuted};">智慧學習歷程系統</span>
    </div>

    <div style="border-bottom:3px solid ${PDF_BRAND.primary};padding-bottom:14px;margin-bottom:18px;">
      <h1 style="font-size:26px;font-weight:700;margin:0;color:${PDF_BRAND.textPrimary};">${docTitle}</h1>
    </div>

    <div style="display:flex;gap:24px;margin-bottom:20px;">
      <div>
        <div style="font-size:11px;color:${PDF_BRAND.textMuted};margin-bottom:2px;">學生姓名</div>
        <div style="font-size:14px;font-weight:600;">${studentName}</div>
      </div>
      <div>
        <div style="font-size:11px;color:${PDF_BRAND.textMuted};margin-bottom:2px;">匯出時間</div>
        <div style="font-size:14px;font-weight:600;">${generatedAt}</div>
      </div>
      <div>
        <div style="font-size:11px;color:${PDF_BRAND.textMuted};margin-bottom:2px;">資料筆數</div>
        <div style="font-size:14px;font-weight:600;">共 ${totalCount} 筆</div>
      </div>
    </div>

    <div style="display:flex;gap:12px;margin-bottom:24px;">
      ${statsHtml}
    </div>

    <div style="display:flex;flex-direction:column;gap:14px;">
      ${entriesHtml}
    </div>
  `;

  document.body.appendChild(container);
  return container;
}

/**
 * 組出單筆紀錄的條列式區塊（標頭列 index+title+badge，meta 列，說明區塊）
 * @param {Object} row
 * @param {number} row.index
 * @param {string} row.title
 * @param {string} [row.subtitle]
 * @param {string} [row.badge] - 右上角徽章文字（例如名次、課程分類）
 * @param {string} [row.badgeColor] - 徽章文字顏色
 * @param {string} [row.badgeBg] - 徽章背景色
 * @param {string[]} row.metaFields - 例如 ['日期：2026-05-15', '等級：全國賽']
 * @param {string} [row.description]
 */
function buildPdfEntryHtml(row) {
  const badgeHtml = row.badge ? `
    <span style="flex-shrink:0;font-size:12px;font-weight:600;padding:3px 10px;border-radius:20px;
      background:${row.badgeBg || PDF_BRAND.primaryLight};color:${row.badgeColor || PDF_BRAND.primaryDark};">
      ${row.badge}
    </span>` : '';

  const subtitleHtml = row.subtitle ? `
    <div style="font-size:12px;color:${PDF_BRAND.textSecondary};margin-top:2px;">${row.subtitle}</div>` : '';

  const metaHtml = (row.metaFields || []).length ? `
    <div style="font-size:11.5px;color:${PDF_BRAND.textMuted};margin-top:8px;">
      ${row.metaFields.join('　｜　')}
    </div>` : '';

  const descHtml = row.description ? `
    <div style="font-size:12px;color:${PDF_BRAND.textSecondary};line-height:1.7;margin-top:10px;
      background:${PDF_BRAND.surfaceAlt};border-left:3px solid ${PDF_BRAND.primary};padding:8px 12px;border-radius:0 6px 6px 0;">
      ${row.description}
    </div>` : '';

  return `
    <div style="border:1px solid ${PDF_BRAND.border};border-radius:10px;padding:16px 18px;break-inside:avoid;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;">
        <div style="display:flex;align-items:flex-start;gap:10px;">
          <span style="flex-shrink:0;width:24px;height:24px;border-radius:50%;background:${PDF_BRAND.primaryDark};color:#fff;
            font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;">${String(row.index).padStart(2, '0')}</span>
          <div>
            <div style="font-size:15px;font-weight:700;color:${PDF_BRAND.textPrimary};">${row.title}</div>
            ${subtitleHtml}
          </div>
        </div>
        ${badgeHtml}
      </div>
      ${metaHtml}
      ${descHtml}
    </div>
  `;
}

/**
 * 產生並下載報告書 PDF
 * @param {Object} opts
 * @param {string} opts.docTitle
 * @param {string} opts.studentName
 * @param {{label:string, value:string}[]} opts.summaryStats
 * @param {Object[]} opts.rows - 傳給 buildPdfEntryHtml 的資料列
 * @param {string} opts.filename
 */
async function exportReportToPDF({ docTitle, studentName, summaryStats, rows, filename }) {
  if (typeof html2canvas === 'undefined' || typeof window.jspdf === 'undefined') {
    showMessage('PDF 匯出元件載入失敗，請檢查網路連線後重試', 'error');
    return false;
  }

  const generatedAt = new Date().toLocaleString('zh-TW');
  const entriesHtml = rows.map(buildPdfEntryHtml).join('');

  const container = buildPdfReportContainer({
    docTitle,
    studentName,
    generatedAt,
    totalCount: rows.length,
    summaryStats,
    entriesHtml
  });

  try {
    if (document.fonts && document.fonts.ready) {
      await document.fonts.ready;
    }

    const canvas = await html2canvas(container, { scale: 2, backgroundColor: '#ffffff', useCORS: true });
    // 用 JPEG（搭配 compress）而非 PNG：jsPDF 內嵌 PNG 時會把圖片解碼成未壓縮點陣資料再寫入，
    // 一份報告就可能膨脹到 10MB 以上，導致下載失敗或檔案開不起來。JPEG 由瀏覽器直接編碼，
    // jsPDF 可原樣嵌入（DCTDecode），檔案大小只有原本的 1~2%。
    const imgData = canvas.toDataURL('image/jpeg', 0.92);

    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    const totalPages = Math.max(1, Math.ceil(imgHeight / pageHeight));
    const footerY = pageHeight - 8;

    const drawFooter = (pageNum) => {
      pdf.setFontSize(8.5);
      pdf.setTextColor(126, 119, 99); // --color-text-muted
      pdf.text('智慧學習歷程系統 自動產生', 10, footerY);
      pdf.text(`第 ${pageNum} 頁，共 ${totalPages} 頁`, pageWidth - 10, footerY, { align: 'right' });
    };

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    drawFooter(1);
    heightLeft -= pageHeight;

    let pageNum = 1;
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pageNum += 1;
      pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      drawFooter(pageNum);
      heightLeft -= pageHeight;
    }

    pdf.save(filename);
    return true;
  } catch (err) {
    console.error('PDF 匯出失敗：', err);
    showMessage('PDF 匯出失敗，請稍後再試', 'error');
    return false;
  } finally {
    document.body.removeChild(container);
  }
}
