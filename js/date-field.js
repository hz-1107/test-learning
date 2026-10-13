/**
 * 日期欄位統一以 yyyy/mm/dd 顯示與輸入
 *
 * 瀏覽器內建的 <input type="date"> 會依瀏覽器語系顯示（年/月/日、mm/dd/yyyy…），各台電腦不一致。
 * 這裡替每個日期欄位加上一個文字欄位負責顯示與輸入，原本的日期欄位保留但隱藏：
 * 它的 id、name、value（yyyy-mm-dd）、change 事件都照舊，各頁面既有的程式不需修改。
 * 由 js/main.js 載入，動態產生的日期欄位也會自動套用。
 */
(function () {
  const PLACEHOLDER = 'yyyy/mm/dd';
  const INVALID_MESSAGE = '請以 yyyy/mm/dd 格式輸入正確的日期';
  const ICON_ZONE = 34; // 文字欄位右側日曆圖示的可點擊寬度（px）
  const valueDescriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');

  const style = document.createElement('style');
  style.textContent = `
    input.date-text {
      padding-right: ${ICON_ZONE}px !important;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%236a7282' stroke-width='2'%3E%3Crect x='3' y='4' width='18' height='18' rx='2'/%3E%3Cpath d='M16 2v4M8 2v4M3 10h18'/%3E%3C/svg%3E") !important;
      background-repeat: no-repeat !important;
      background-position: right 10px center !important;
      background-size: 16px 16px !important;
    }
    input.date-native-hidden {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      min-width: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
      border: 0 !important;
      opacity: 0 !important;
      pointer-events: none !important;
    }
  `;
  document.head.appendChild(style);

  // yyyy/mm/dd → yyyy-mm-dd；格式不符或不是真實日期時回傳 ''
  function toIsoDate(text) {
    const match = /^(\d{4})\/(\d{2})\/(\d{2})$/.exec(text);
    if (!match) return '';
    const [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
    const date = new Date(y, m - 1, d);
    if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return '';
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  function enhance(native) {
    if (native.dataset.dateField) return;
    native.dataset.dateField = '1';

    const text = document.createElement('input');
    text.type = 'text';
    text.className = native.className;
    text.classList.add('date-text');
    text.style.cssText = native.style.cssText;
    text.placeholder = PLACEHOLDER;
    text.inputMode = 'numeric';
    text.maxLength = 10;
    text.autocomplete = 'off';
    const label = native.getAttribute('aria-label');
    if (label) text.setAttribute('aria-label', label);

    // 必填檢查改由看得見的文字欄位負責（隱藏欄位無法顯示瀏覽器的提示）
    text.required = native.required;
    native.required = false;

    const syncState = () => {
      text.disabled = native.disabled;
      text.readOnly = native.readOnly;
    };
    const syncText = () => {
      const iso = valueDescriptor.get.call(native);
      text.value = iso ? iso.replace(/-/g, '/') : '';
      text.setCustomValidity('');
    };

    native.parentNode.insertBefore(text, native);
    native.classList.add('date-native-hidden');
    native.tabIndex = -1;
    native.setAttribute('aria-hidden', 'true');
    syncState();
    syncText();

    // 既有程式以 input.value = '2026-10-13' 設定日期時，同步更新顯示
    Object.defineProperty(native, 'value', {
      configurable: true,
      get() { return valueDescriptor.get.call(this); },
      set(value) {
        valueDescriptor.set.call(this, value);
        syncText();
      }
    });
    if (native.form) native.form.addEventListener('reset', () => setTimeout(syncText));
    new MutationObserver(syncState).observe(native, { attributes: true, attributeFilter: ['disabled', 'readonly'] });

    // 日曆選到日期
    native.addEventListener('change', syncText);

    // 手動輸入：只取數字並自動補上斜線，輸入完整且正確的日期才寫回原欄位
    text.addEventListener('input', () => {
      const digits = text.value.replace(/\D/g, '').slice(0, 8);
      text.value = [digits.slice(0, 4), digits.slice(4, 6), digits.slice(6, 8)].filter(Boolean).join('/');

      const before = valueDescriptor.get.call(native);
      valueDescriptor.set.call(native, toIsoDate(text.value));
      const after = valueDescriptor.get.call(native);
      // 不是真實日期，或超出欄位的 min / max 範圍
      text.setCustomValidity(text.value && (!after || !native.validity.valid) ? INVALID_MESSAGE : '');

      if (after !== before) {
        native.dispatchEvent(new Event('input', { bubbles: true }));
        native.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });

    // 點右側日曆圖示（或按 Alt + ↓）開啟日曆
    const openPicker = () => {
      if (native.disabled || native.readOnly || !native.showPicker) return;
      try { native.showPicker(); } catch (e) { /* 瀏覽器不允許時維持手動輸入 */ }
    };
    const overIcon = (event) => event.offsetX >= text.clientWidth - ICON_ZONE;
    text.addEventListener('click', (event) => { if (overIcon(event)) openPicker(); });
    text.addEventListener('mousemove', (event) => {
      text.style.cursor = overIcon(event) && !native.disabled && !native.readOnly ? 'pointer' : '';
    });
    text.addEventListener('keydown', (event) => {
      if (event.altKey && event.key === 'ArrowDown') {
        event.preventDefault();
        openPicker();
      }
    });
  }

  function enhanceAll(root) {
    if (root.matches && root.matches('input[type="date"]')) enhance(root);
    if (root.querySelectorAll) root.querySelectorAll('input[type="date"]').forEach(enhance);
  }

  function init() {
    enhanceAll(document);
    new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType === 1) enhanceAll(node);
      }));
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
