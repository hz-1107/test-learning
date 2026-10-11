/**
 * 智慧學習歷程系統 - 課表看板（ScheduleBoard）
 * 行政端「課表排程」與教師端「課表」共用的篩選列 + 課表格線。
 * 需先載入 js/api.js，樣式見 css/schedule-board.css。
 *
 * 用法：
 *   const board = ScheduleBoard.mount(document.getElementById('scheduleBoard'), {
 *     title: '課表排程',          // 頁面標題；null＝不顯示
 *     showAdjustButton: true,     // 是否顯示「調課」按鈕
 *     showViewToggle: true,       // 是否顯示「課表／課程列表」切換鈕
 *     onAdjustClick: () => {},    // 點「調課」按鈕
 *     onBlockClick: (schedule, dateISO) => {},  // 點課程方塊（dateISO＝該堂課日期）；未提供＝方塊不可點
 *     onViewChange: (view) => {}, // 切換檢視：'calendar' | 'list'
 *     onFiltersLoaded: ({ teachers, classrooms }) => {}
 *   });
 *   board.reload();               // 重新載入課表
 *   board.getCurrentDateISO();    // 目前選定日期 yyyy-mm-dd
 */
(function (global) {
  const SCHEDULE_TIMES = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'];
  const DAY_NAMES = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

  // 轉民國年格式，例：115/05/26(二)
  function toROCDate(date) {
    const y = date.getFullYear() - 1911;
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const w = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
    return `${y}/${m}/${d}(${w})`;
  }

  // 取得週一日期
  function getWeekStart(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // 以「本地」時間輸出 yyyy-mm-dd（避免 toISOString 因時區偏移到前一天）
  function formatDateISO(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  // 取得課程顏色
  function getColorClass(name) {
    if (!name) return 'yellow';
    if (name.includes('動力')) return 'yellow';
    if (name.includes('程式')) return 'orange';
    if (name.includes('科創')) return 'purple';
    if (name.includes('幼兒')) return 'blue';
    return 'green';
  }

  // 時間欄
  function buildTimeCell(time, hour) {
    const timeCell = document.createElement('div');
    timeCell.className = 'schedule-time';
    timeCell.innerHTML = `<span class="schedule-time__main">${time}</span><span class="schedule-time__sub">${hour}:30</span>`;
    return timeCell;
  }

  function buildTemplate(opts) {
    const header = (opts.title || opts.showAdjustButton) ? `
      <div class="page-header">
        ${opts.title ? `<h2 class="page-title">${opts.title}</h2>` : ''}
        ${opts.showAdjustButton ? `
        <button class="btn-primary schedule-board__adjust" data-sb="adjustBtn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          調課
        </button>` : ''}
      </div>` : '';

    const viewToggle = opts.showViewToggle ? `
        <div class="view-toggle" data-sb="viewToggle">
          <button type="button" class="view-toggle__btn view-toggle__btn--active" data-view="calendar">課表</button>
          <button type="button" class="view-toggle__btn" data-view="list">課程列表</button>
        </div>` : '';

    return `${header}
      <div class="schedule-filters">${viewToggle}
        <select class="filter-select" data-sb="filterTeacher">
          <option value="">全部老師</option>
        </select>
        <select class="filter-select" data-sb="filterClassroom">
          <option value="">全部教室</option>
        </select>
        <div class="date-nav" data-sb="dateNav">
          <button class="date-nav__btn" data-sb="prevBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button type="button" class="date-nav__current" data-sb="dateField" title="選擇日期">
            <span data-sb="weekDisplay"></span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </button>
          <button class="date-nav__btn" data-sb="nextBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
          <button class="btn-secondary" data-sb="todayBtn">今天</button>
          <div class="cal-popup" data-sb="calendarPopup" hidden>
            <div class="cal-popup__head">
              <button type="button" class="cal-popup__nav" data-sb="calPrev" aria-label="上個月">&#8249;</button>
              <span class="cal-popup__title" data-sb="calTitle"></span>
              <button type="button" class="cal-popup__nav" data-sb="calNext" aria-label="下個月">&#8250;</button>
            </div>
            <div class="cal-popup__weekdays"><span>日</span><span>一</span><span>二</span><span>三</span><span>四</span><span>五</span><span>六</span></div>
            <div class="cal-popup__grid" data-sb="calGrid"></div>
          </div>
        </div>
        <div class="weekday-tabs" data-sb="weekdayTabs">
          <button class="weekday-tab" data-day="1">週一</button>
          <button class="weekday-tab" data-day="2">週二</button>
          <button class="weekday-tab" data-day="3">週三</button>
          <button class="weekday-tab" data-day="4">週四</button>
          <button class="weekday-tab" data-day="5">週五</button>
          <button class="weekday-tab" data-day="6">週六</button>
          <button class="weekday-tab" data-day="0">週日</button>
        </div>
      </div>

      <div class="schedule-grid" data-sb="grid">
        <div class="schedule-header" data-sb="scheduleHeader"></div>
        <div class="schedule-body" data-sb="scheduleBody">
          <div class="loading">載入中...</div>
        </div>
      </div>`;
  }

  function mount(container, options = {}) {
    const opts = Object.assign({
      title: null,
      showAdjustButton: false,
      showViewToggle: false,
      onAdjustClick: null,
      onBlockClick: null,
      onViewChange: null,
      onFiltersLoaded: null
    }, options);

    container.classList.add('schedule-board');
    container.innerHTML = buildTemplate(opts);
    const $ = (name) => container.querySelector(`[data-sb="${name}"]`);

    // 狀態
    let currentDate = new Date();
    let currentDayOfWeek = currentDate.getDay(); // 0=週日
    let currentViewMode = 'daily'; // 'daily'=全部老師當日課表；'weekly'=單一老師當週課表
    let weeklyAnchor = null;       // 週課表起始日：null=顯示 currentDate 所在的週一～週日；有值=顯示該日往後 7 天
    let calMonth = null;           // 日期選擇彈窗目前顯示的月份（該月 1 號）
    let scheduleView = 'calendar'; // 'calendar'=課表；'list'=課程列表（由頁面自行呈現）

    // 假日（系統設定）：date → 名稱；每年重複者以 MM-DD 比對
    let holidayByDate = {};
    let recurringHolidayByMD = {};

    async function loadHolidays() {
      try {
        const result = await api.settings.holidays.getAll();
        holidayByDate = {};
        recurringHolidayByMD = {};
        (result.data || []).forEach(h => {
          const iso = String(h.holiday_date).slice(0, 10);
          // 名稱會以 innerHTML 輸出，先跳脫
          const name = String(h.name).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
          if (Number(h.is_recurring)) recurringHolidayByMD[iso.slice(5)] = name;
          else holidayByDate[iso] = name;
        });
      } catch (error) {
        console.error('載入假日失敗:', error);
      }
    }

    function getHolidayName(iso) {
      return holidayByDate[iso] || recurringHolidayByMD[iso.slice(5)] || '';
    }

    // 移除當日外框
    function clearTodayFrame() {
      const frame = $('grid').querySelector('.today-frame');
      if (frame) frame.remove();
    }

    // 於單一老師週課表，在「當日」整欄外圍畫一個發光外框
    function positionTodayFrame() {
      clearTodayFrame();
      if (currentViewMode !== 'weekly') return;
      const grid = $('grid');
      const cell = grid.querySelector('.schedule-header__cell--today');
      if (!cell) return;
      const frame = document.createElement('div');
      frame.className = 'today-frame';
      frame.style.left = cell.offsetLeft + 'px';
      frame.style.width = cell.offsetWidth + 'px';
      grid.appendChild(frame);
    }

    // 週課表起始日：未指定日期時＝該週週一；由日曆選定日期後＝該日
    function weeklyWindowStart() {
      return weeklyAnchor ? new Date(weeklyAnchor) : getWeekStart(currentDate);
    }

    // 依檢視模式更新日期／週次顯示
    function updateDateDisplay() {
      const label = $('weekDisplay');
      if (currentViewMode === 'weekly') {
        const weekStart = weeklyWindowStart();
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        label.textContent = `${toROCDate(weekStart)} ~${toROCDate(weekEnd)}`;
      } else {
        const holidayName = getHolidayName(formatDateISO(currentDate));
        label.innerHTML = toROCDate(currentDate) +
          (holidayName ? `<span class="date-holiday-tag">${holidayName}</span>` : '');
      }
    }

    // 載入篩選器選項
    async function loadFilters() {
      try {
        // 載入老師
        const teachersResult = await api.teachers.getAll();
        const teachers = teachersResult.data || [];
        const teacherSelect = $('filterTeacher');
        teachers.forEach(t => {
          teacherSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        });

        // 載入教室
        const classroomsResult = await api.schedules.getClassrooms();
        const classrooms = classroomsResult.data || [];
        const classroomSelect = $('filterClassroom');
        classrooms.forEach(c => {
          classroomSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });

        if (opts.onFiltersLoaded) await opts.onFiltersLoaded({ teachers, classrooms });
      } catch (error) {
        console.error('載入篩選器失敗:', error);
      }
    }

    // 若課程於這個時段開始，產生課程方塊並加入欄位
    function appendBlockIfStartsAt(cell, schedule, hour, dateISO) {
      const startHour = parseInt(schedule.start_time.split(':')[0]);
      const endHour = parseInt(schedule.end_time.split(':')[0]);
      if (startHour !== hour) return;

      const duration = Math.max(1, endHour - startHour);
      const block = document.createElement('div');
      const colorClass = getColorClass(schedule.course_type_name || schedule.course_name);
      block.className = `schedule-block schedule-block--${colorClass}${schedule.is_adjusted ? ' schedule-block--adjusted' : ''}`;
      block.style.top = '2px';
      block.style.height = `${duration * 50 - 4}px`;

      const locationName = schedule.classroom_name ? `[${schedule.classroom_name}]` : '';
      block.innerHTML = `
        <div class="schedule-block__title">${schedule.course_name} ${locationName}</div>
        <div class="schedule-block__teacher">${schedule.teacher_name || ''}</div>
        ${schedule.is_adjusted ? '<span class="schedule-block__badge">調</span>' : ''}
      `;
      if (opts.onBlockClick) {
        block.onclick = () => opts.onBlockClick(schedule, dateISO);
      } else {
        block.classList.add('schedule-block--static');
      }
      cell.appendChild(block);
    }

    // 載入課表（下拉選單「全部老師」＝當日課表；選單「單一老師」＝該老師當週課表）
    async function loadSchedule() {
      const teacherId = $('filterTeacher').value;
      currentViewMode = teacherId ? 'weekly' : 'daily';
      if (currentViewMode === 'daily') weeklyAnchor = null;
      updateFilterBarMode();
      updateDateDisplay();

      if (currentViewMode === 'weekly') {
        await renderWeeklyView(teacherId);
      } else {
        await renderDailyView();
        updateWeekdayTabs();
      }
    }

    // 依檢視模式切換篩選列（週檢視隱藏星期分頁與「今天」）
    function updateFilterBarMode() {
      const weekly = currentViewMode === 'weekly';
      $('weekdayTabs').style.display = weekly ? 'none' : 'flex';
      $('todayBtn').style.display = weekly ? 'none' : '';
      closeCalendarPopup();
    }

    // 上一頁／下一頁（週檢視移動一週＝7 天，日檢視移動一天）
    function navigate(delta) {
      if (currentViewMode === 'weekly' && weeklyAnchor) {
        weeklyAnchor.setDate(weeklyAnchor.getDate() + delta * 7);
        currentDate = new Date(weeklyAnchor);
      } else {
        currentDate.setDate(currentDate.getDate() + delta * (currentViewMode === 'weekly' ? 7 : 1));
      }
      currentDayOfWeek = currentDate.getDay();
      updateDateDisplay();
      loadSchedule();
      updateWeekdayTabs();
    }

    // 全部老師：當日課表（欄位＝老師）
    async function renderDailyView() {
      const scheduleBody = $('scheduleBody');
      const scheduleHeader = $('scheduleHeader');
      clearTodayFrame();
      scheduleBody.innerHTML = '<div class="loading">載入中...</div>';

      try {
        const classroomId = $('filterClassroom').value;

        const result = await api.scheduleCalendar.getDaily({
          date: formatDateISO(currentDate),
          classroom_id: classroomId || undefined
        });

        const displayTeachers = (result.data.teachers || []).slice(0, 7);
        const dateISO = formatDateISO(currentDate);

        scheduleHeader.style.gridTemplateColumns = `60px repeat(${displayTeachers.length}, 1fr)`;
        scheduleHeader.innerHTML = '<div class="schedule-header__cell"></div>' +
          displayTeachers.map(t => `<div class="schedule-header__cell">${t.teacher_name}</div>`).join('');

        scheduleBody.style.gridTemplateColumns = `60px repeat(${displayTeachers.length}, 1fr)`;
        scheduleBody.innerHTML = '';

        SCHEDULE_TIMES.forEach((time) => {
          const hour = parseInt(time);
          scheduleBody.appendChild(buildTimeCell(time, hour));

          displayTeachers.forEach((teacher) => {
            const cell = document.createElement('div');
            cell.className = 'schedule-cell';
            teacher.schedules.forEach(schedule => appendBlockIfStartsAt(cell, schedule, hour, dateISO));
            scheduleBody.appendChild(cell);
          });
        });

        if (displayTeachers.length === 0) {
          scheduleBody.innerHTML = '<div class="loading">今日無排課</div>';
        }
      } catch (error) {
        console.error('載入課表失敗:', error);
        scheduleBody.innerHTML = '<div class="loading">載入失敗</div>';
      }
    }

    // 取得「起始日往後 7 天」的每日課程資料。後端週課表以週一～週日為單位，
    // 若起始日非週一，視窗會跨到下一週，因此需再取一次下一週再依日期挑出所需 7 天。
    async function fetchWindowDays(startDate, teacherId, classroomId) {
      const wanted = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        wanted.push(formatDateISO(d));
      }
      const calls = [api.scheduleCalendar.getWeekly({ date: wanted[0], teacher_id: teacherId, classroom_id: classroomId || undefined })];
      if (startDate.getDay() !== 1) {
        calls.push(api.scheduleCalendar.getWeekly({ date: wanted[6], teacher_id: teacherId, classroom_id: classroomId || undefined }));
      }
      const results = await Promise.all(calls);
      const byDate = {};
      results.forEach(r => (r.data.schedules || []).forEach(day => { byDate[day.date] = day; }));
      return wanted.map(iso => byDate[iso] || { date: iso, schedules: [] });
    }

    // 單一老師：當週課表（欄位＝起始日往後 7 天，當日欄位以發光邊框標記）
    async function renderWeeklyView(teacherId) {
      const scheduleBody = $('scheduleBody');
      const scheduleHeader = $('scheduleHeader');
      scheduleBody.innerHTML = '<div class="loading">載入中...</div>';

      try {
        const classroomId = $('filterClassroom').value;
        const days = await fetchWindowDays(weeklyWindowStart(), teacherId, classroomId);
        const todayISO = formatDateISO(new Date());

        scheduleHeader.style.gridTemplateColumns = `60px repeat(7, 1fr)`;
        scheduleHeader.innerHTML = '<div class="schedule-header__cell"></div>' +
          days.map(d => {
            const dayName = DAY_NAMES[new Date(d.date + 'T00:00:00').getDay()];
            const todayCls = d.date === todayISO ? ' schedule-header__cell--today' : '';
            const holidayName = getHolidayName(d.date);
            const holidayCls = holidayName ? ' schedule-header__cell--holiday' : '';
            return `<div class="schedule-header__cell${todayCls}${holidayCls}">` +
              `<span class="schedule-header__day">${dayName}</span>` +
              `<span class="schedule-header__date">${d.date.replace(/-/g, '/')}</span>` +
              (holidayName ? `<span class="schedule-header__holiday">${holidayName}</span>` : '') + `</div>`;
          }).join('');

        scheduleBody.style.gridTemplateColumns = `60px repeat(7, 1fr)`;
        scheduleBody.innerHTML = '';

        SCHEDULE_TIMES.forEach((time) => {
          const hour = parseInt(time);
          scheduleBody.appendChild(buildTimeCell(time, hour));

          days.forEach(day => {
            const isToday = day.date === todayISO;
            const cell = document.createElement('div');
            cell.className = 'schedule-cell' + (isToday ? ' schedule-cell--today' : '');
            day.schedules.forEach(schedule => appendBlockIfStartsAt(cell, schedule, hour, day.date));
            scheduleBody.appendChild(cell);
          });
        });

        positionTodayFrame();
      } catch (error) {
        console.error('載入週課表失敗:', error);
        scheduleBody.innerHTML = '<div class="loading">載入失敗</div>';
      }
    }

    // ========== 日期選擇彈窗 ==========
    function toggleCalendarPopup(evt) {
      if (evt) evt.stopPropagation();
      if ($('calendarPopup').hidden) openCalendarPopup(); else closeCalendarPopup();
    }

    function openCalendarPopup() {
      const base = currentViewMode === 'weekly' ? weeklyWindowStart() : currentDate;
      calMonth = new Date(base.getFullYear(), base.getMonth(), 1);
      renderCalendar();
      $('calendarPopup').hidden = false;
    }

    function closeCalendarPopup() {
      $('calendarPopup').hidden = true;
    }

    function calShiftMonth(delta) {
      calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + delta, 1);
      renderCalendar();
    }

    function renderCalendar() {
      $('calTitle').textContent =
        `${calMonth.getFullYear() - 1911} 年 ${calMonth.getMonth() + 1} 月`;

      const grid = $('calGrid');
      grid.innerHTML = '';

      const year = calMonth.getFullYear();
      const month = calMonth.getMonth();
      const firstWeekday = new Date(year, month, 1).getDay();      // 0=週日
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      // 週檢視：標示 7 天視窗；日檢視：僅標示當前選定日
      const weekly = currentViewMode === 'weekly';
      const start = weekly ? weeklyWindowStart() : currentDate;
      const startT = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime();
      const endT = weekly ? startT + 6 * 86400000 : startT;

      for (let i = 0; i < firstWeekday; i++) {
        const e = document.createElement('div');
        e.className = 'cal-day cal-day--empty';
        grid.appendChild(e);
      }
      for (let d = 1; d <= daysInMonth; d++) {
        const cellDate = new Date(year, month, d);
        const t = cellDate.getTime();
        const cell = document.createElement('div');
        cell.className = 'cal-day';
        cell.textContent = d;
        const holidayName = getHolidayName(formatDateISO(cellDate));
        if (holidayName) {
          cell.classList.add('cal-day--holiday');
          cell.title = holidayName;
        }
        if (t >= startT && t <= endT) {
          const col = cellDate.getDay();
          cell.classList.add('cal-day--range');
          if (t === startT || col === 0) cell.classList.add('cal-day--range-start');
          if (t === endT || col === 6) cell.classList.add('cal-day--range-end');
          if (t === startT) cell.classList.add('cal-day--anchor');
        }
        cell.addEventListener('click', () => pickCalendarDate(cellDate));
        grid.appendChild(cell);
      }
    }

    // 選定單日：週檢視 → 以該日往後 7 天為視窗；日檢視 → 跳至該日
    function pickCalendarDate(date) {
      closeCalendarPopup();
      if (currentViewMode === 'weekly') {
        weeklyAnchor = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        currentDate = new Date(weeklyAnchor);
      } else {
        currentDate = new Date(date);
      }
      currentDayOfWeek = currentDate.getDay();
      updateDateDisplay();
      loadSchedule();
      updateWeekdayTabs();
    }

    // 跳到今天
    function goToToday() {
      weeklyAnchor = null;
      currentDate = new Date();
      currentDayOfWeek = currentDate.getDay();
      updateDateDisplay();
      loadSchedule();
      updateWeekdayTabs();
    }

    // 設置星期標籤
    function setupWeekdayTabs() {
      container.querySelectorAll('.weekday-tab').forEach(tab => {
        tab.addEventListener('click', () => {
          const day = parseInt(tab.dataset.day);
          // 計算目標日期
          const weekStart = getWeekStart(currentDate);
          const targetDate = new Date(weekStart);
          targetDate.setDate(weekStart.getDate() + (day === 0 ? 6 : day - 1));
          currentDate = targetDate;
          currentDayOfWeek = day;
          updateDateDisplay();
          loadSchedule();
          updateWeekdayTabs();
        });
      });
      updateWeekdayTabs();
    }

    // 更新星期標籤狀態
    function updateWeekdayTabs() {
      container.querySelectorAll('.weekday-tab').forEach(tab => {
        tab.classList.toggle('weekday-tab--active', parseInt(tab.dataset.day) === currentDayOfWeek);
      });
    }

    // ========== 課表 / 課程列表 切換 ==========
    function setView(view) {
      scheduleView = view;
      container.querySelectorAll('.view-toggle__btn').forEach(b => {
        b.classList.toggle('view-toggle__btn--active', b.dataset.view === view);
      });

      const isList = view === 'list';
      // 課程列表僅需切換鈕，其餘篩選控制項僅在課表檢視顯示
      ['filterTeacher', 'filterClassroom', 'dateNav', 'weekdayTabs'].forEach(name => {
        $(name).style.display = isList ? 'none' : '';
      });
      $('grid').hidden = isList;

      if (isList) {
        closeCalendarPopup();
      } else {
        updateFilterBarMode(); // 還原課表檢視下各控制項的顯示狀態
      }
      if (opts.onViewChange) opts.onViewChange(view);
    }

    // ========== 事件綁定 ==========
    $('filterTeacher').addEventListener('change', loadSchedule);
    $('filterClassroom').addEventListener('change', loadSchedule);
    $('prevBtn').addEventListener('click', () => navigate(-1));
    $('nextBtn').addEventListener('click', () => navigate(1));
    $('todayBtn').addEventListener('click', goToToday);
    $('dateField').addEventListener('click', toggleCalendarPopup);
    $('calPrev').addEventListener('click', () => calShiftMonth(-1));
    $('calNext').addEventListener('click', () => calShiftMonth(1));
    if (opts.showAdjustButton) {
      $('adjustBtn').addEventListener('click', () => { if (opts.onAdjustClick) opts.onAdjustClick(); });
    }
    if (opts.showViewToggle) {
      $('viewToggle').querySelectorAll('.view-toggle__btn').forEach(b => {
        b.addEventListener('click', () => setView(b.dataset.view));
      });
    }

    // 點彈窗以外處關閉
    document.addEventListener('click', (e) => {
      const pop = $('calendarPopup');
      if (!pop || pop.hidden) return;
      if (pop.contains(e.target) || e.target.closest('[data-sb="dateField"]')) return;
      closeCalendarPopup();
    });

    window.addEventListener('resize', positionTodayFrame);

    // 初始化
    updateDateDisplay();
    setupWeekdayTabs();
    const ready = Promise.all([loadFilters(), loadHolidays()]).then(loadSchedule);

    return {
      ready,
      reload: loadSchedule,
      getView: () => scheduleView,
      getCurrentDateISO: () => formatDateISO(currentDate)
    };
  }

  global.ScheduleBoard = { mount, formatDateISO, DAY_NAMES };
})(window);
