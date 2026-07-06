var App = App || {};

(function () {
  'use strict';

  var calc = App.Calculator;

  function renderMonthGrid(monthKey, monthData, config) {
    var tbody = document.getElementById('month-tbody');
    var parts = monthKey.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    var daysInMonth = calc.getDaysInMonth(year, month);
    var workingDays = config.workingDays;

    var html = '';
    for (var d = 1; d <= daysInMonth; d++) {
      var date = new Date(year, month, d);
      var dayOfWeek = date.getDay();
      var dayName = calc.getDayName(date, true);
      var isWorkingDay = workingDays.indexOf(dayOfWeek) !== -1;
      var dayStandard = calc.getStandardHoursForDay(dayOfWeek, config);
      var dayStandardMin = dayStandard * 60;

      var dayStr = String(d);
      var dayData = (monthData && monthData.days && monthData.days[dayStr]) || { entry: '', lunchOut: '', lunchReturn: '', exit: '', excused: false, absent: false, vacation: false, customHours: null };
      var entry = dayData.entry || '';
      var lunchOut = dayData.lunchOut || '';
      var lunchReturn = dayData.lunchReturn || '';
      var exit = dayData.exit || '';
      var excused = !!dayData.excused;
      var absent = !!dayData.absent;
      var vacation = !!dayData.vacation;
      var customHours = dayData.customHours || null;
      var effectiveStandard = calc.getEffectiveStandardHours(dayOfWeek, config, customHours);
      var effectiveStandardMin = effectiveStandard * 60;

      var hasStatus = excused || absent || vacation;
      var result = { minutes: 0, hoursDecimal: 0 };
      var balanceClass = '';
      var rowClass = '';
      var allFilled = entry && exit;

      if (allFilled || hasStatus) {
        result = calc.calcDay(entry, lunchOut, lunchReturn, exit, excused, absent, vacation, effectiveStandard);
      }

      if (!isWorkingDay) {
        rowClass = 'weekend';
      }

      if (allFilled || hasStatus) {
        var balanceMin = result.minutes - effectiveStandardMin;
        if (balanceMin > 0) {
          balanceClass = 'positive';
        } else if (balanceMin < 0) {
          balanceClass = 'negative';
        }
      }

      var hasAny = entry || lunchOut || lunchReturn || exit;
      var hoursDisplay = (allFilled || hasStatus)
        ? calc.formatHours(result.hoursDecimal)
        : hasAny
          ? '—'
          : '—';

      var balanceDisplay = (allFilled || hasStatus)
        ? calc.formatBalance(result.hoursDecimal - effectiveStandard)
        : hasAny
          ? '—'
          : '—';

      var disabledAttr = hasStatus ? ' disabled' : '';
      var statusValue = vacation ? 'vacation' : absent ? 'absent' : excused ? 'excused' : '';

      html += '<tr class="' + rowClass + '">';
      html += '<td class="day-col">' + d + '</td>';
      html += '<td class="weekday-col">' + dayName + '</td>';

      html += '<td class="entry-col"><input type="text" class="time-input time-entry" data-day="' + d + '" placeholder="08:00" maxlength="5" value="' + entry + '"' + disabledAttr + '></td>';
      html += '<td class="lunch-out-col"><input type="text" class="time-input time-lunch-out" data-day="' + d + '" placeholder="12:00" maxlength="5" value="' + lunchOut + '"' + disabledAttr + '></td>';
      html += '<td class="lunch-return-col"><input type="text" class="time-input time-lunch-return" data-day="' + d + '" placeholder="13:00" maxlength="5" value="' + lunchReturn + '"' + disabledAttr + '></td>';
      html += '<td class="exit-col"><input type="text" class="time-input time-exit" data-day="' + d + '" placeholder="17:00" maxlength="5" value="' + exit + '"' + disabledAttr + '></td>';

      html += '<td class="status-col"><select class="status-select" data-day="' + d + '">';
      html += '<option value=""' + (statusValue === '' ? ' selected' : '') + '>—</option>';
      html += '<option value="excused"' + (statusValue === 'excused' ? ' selected' : '') + '>Abon.</option>';
      html += '<option value="absent"' + (statusValue === 'absent' ? ' selected' : '') + '>Falta</option>';
      html += '<option value="vacation"' + (statusValue === 'vacation' ? ' selected' : '') + '>Férias</option>';
      html += '</select></td>';

      var customVal = customHours ? customHours.toString().replace('.', ',') : '';
      html += '<td class="carga-col"><input type="text" class="carga-input" data-day="' + d + '" placeholder="' + dayStandard.toString().replace('.', ',') + '" value="' + customVal + '"' + disabledAttr + '></td>';

      html += '<td class="hours-col">' + hoursDisplay + '</td>';
      html += '<td class="balance-col balance-cell ' + balanceClass + '">' + balanceDisplay + '</td>';
      html += '</tr>';
    }

    tbody.innerHTML = html;
  }

  function renderMonthSummary(monthKey, monthData, config) {
    var totals = calc.calcMonthTotals(monthKey, monthData, config);

    var hoursEl = document.getElementById('month-total-hours');
    var balanceEl = document.getElementById('month-balance');

    hoursEl.textContent = calc.formatHours(totals.totalHoursDecimal) + 'h';

    var balanceDisplay = calc.formatBalance(totals.balanceDecimal);
    balanceEl.textContent = balanceDisplay + 'h';
    balanceEl.classList.remove('positive', 'negative');
    if (totals.balanceDecimal > 0) balanceEl.classList.add('positive');
    else if (totals.balanceDecimal < 0) balanceEl.classList.add('negative');
  }

  function renderGlobalTotalizer(total) {
    var el = document.getElementById('global-balance');
    var display = calc.formatBalance(total);
    el.textContent = display + 'h';
    el.classList.remove('positive', 'negative');
    if (total > 0) el.classList.add('positive');
    else if (total < 0) el.classList.add('negative');
  }

  function renderSavedMonthsList(allMonths) {
    var container = document.getElementById('saved-months-list');
    var keys = Object.keys(allMonths).sort();

    if (keys.length === 0) {
      container.innerHTML = '<span class="no-months">Nenhum mês salvo.</span>';
      return;
    }

    var html = '';
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var monthConfig = allMonths[key].config || { standardHoursPerDay: 8, saturdayHours: 4, sundayHours: 0, workingDays: [1,2,3,4,5] };
      var totals = calc.calcMonthTotals(key, allMonths[key], monthConfig);
      var displayKey = key.split('-').reverse().join('/');
      var balanceDisplay = calc.formatBalance(totals.balanceDecimal);
      var balClass = totals.balanceDecimal > 0 ? 'positive' : totals.balanceDecimal < 0 ? 'negative' : '';

      html += '<span class="month-badge" data-month="' + key + '">';
      html += '<span class="badge-label">' + displayKey + '</span>';
      html += '<span class="badge-balance ' + balClass + '">' + balanceDisplay + 'h</span>';
      html += '</span>';
    }

    container.innerHTML = html;
  }

  App.Renderer = {
    renderMonthGrid: renderMonthGrid,
    renderMonthSummary: renderMonthSummary,
    renderGlobalTotalizer: renderGlobalTotalizer,
    renderSavedMonthsList: renderSavedMonthsList
  };
})();
