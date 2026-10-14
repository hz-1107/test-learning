/**
 * 前端共用設定：後端 API 位址
 *
 * - 頁面由後端伺服器開啟（上架後、或本機 http://localhost:3000）：使用目前網址，同一來源
 * - 本機用其他靜態伺服器預覽（例如 Live Server :5500）或直接開檔案：連到本機後端 http://localhost:3000
 *
 * 需在各頁面 <head> 最前面載入，其他程式以 window.API_ORIGIN 取得後端位址。
 * 若後端與前端分開部署，可在載入本檔前設定 window.API_ORIGIN 覆寫。
 */
(function () {
  if (window.API_ORIGIN) return;

  const LOCAL_BACKEND = 'http://localhost:3000';
  const isLocalHost = ['localhost', '127.0.0.1'].includes(location.hostname);
  const servedByBackend = location.protocol !== 'file:' && (!isLocalHost || location.port === '3000');

  window.API_ORIGIN = servedByBackend ? location.origin : LOCAL_BACKEND;
})();
