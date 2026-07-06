var App = App || {};

(function () {
  'use strict';

  var Storage = App.Storage;
  var Calculator = App.Calculator;
  var Renderer = App.Renderer;

  var monthSelector = document.getElementById('month-selector');
  var tbody = document.getElementById('month-tbody');
  var importFileInput = document.getElementById('import-file');
  var importOverlay = document.getElementById('import-overlay');

  var currentMonthKey = '';
  var pendingImportFile = null;

  function getCurrentMonthKey() {
    return monthSelector.value;
  }

  function refresh() {
    var monthKey = getCurrentMonthKey();
    currentMonthKey = monthKey;

    var config = Storage.getMonthConfig(monthKey);
    var monthData = Storage.getMonthData(monthKey);
    var allMonths = Storage.getAllMonthsWithConfig();

    Renderer.renderMonthGrid(monthKey, monthData, config);
    Renderer.renderMonthSummary(monthKey, monthData, config);

    var globalTotal = Calculator.calcGlobalTotal(allMonths);
    Renderer.renderGlobalTotalizer(globalTotal);

    Renderer.renderSavedMonthsList(allMonths);

    attachTableEvents();
  }

  function attachTableEvents() {
    var timeInputs = tbody.querySelectorAll('.time-entry, .time-lunch-out, .time-lunch-return, .time-exit');
    for (var i = 0; i < timeInputs.length; i++) {
      timeInputs[i].addEventListener('change', onTimeChange);
      timeInputs[i].addEventListener('blur', onTimeBlur);
      timeInputs[i].addEventListener('input', onTimeInput);
    }
    var statusSelects = tbody.querySelectorAll('.status-select');
    for (var j = 0; j < statusSelects.length; j++) {
      statusSelects[j].addEventListener('change', onStatusChange);
    }
    var cargaInputs = tbody.querySelectorAll('.carga-input');
    for (var m = 0; m < cargaInputs.length; m++) {
      cargaInputs[m].addEventListener('change', onCargaChange);
      cargaInputs[m].addEventListener('blur', onCargaBlur);
    }
  }

  function onTimeInput(e) {
    var input = e.target;
    var val = input.value.replace(/[^0-9:]/g, '');
    if (val.length === 2 && input.value.length === 2) {
      val += ':';
    }
    input.value = val.slice(0, 5);
  }

  function onTimeBlur(e) {
    var input = e.target;
    var val = input.value.trim();
    if (!val) return;
    var digits = val.replace(/[^0-9]/g, '');
    if (digits.length === 0) {
      input.value = '';
      return;
    }
    if (digits.length <= 2) {
      var h = parseInt(digits, 10);
      if (h > 23) h = 23;
      input.value = String(h).padStart(2, '0') + ':00';
    } else if (digits.length === 3) {
      var h3 = parseInt(digits.slice(0, 1), 10);
      var m3 = parseInt(digits.slice(1), 10);
      if (m3 > 59) m3 = 59;
      input.value = String(h3).padStart(2, '0') + ':' + String(m3).padStart(2, '0');
    } else {
      var h4 = parseInt(digits.slice(0, 2), 10);
      var m4 = parseInt(digits.slice(2, 4), 10);
      if (h4 > 23) h4 = 23;
      if (m4 > 59) m4 = 59;
      input.value = String(h4).padStart(2, '0') + ':' + String(m4).padStart(2, '0');
    }
    input.dispatchEvent(new Event('change'));
  }

  function updateDayDisplay(row, day, entry, lunchOut, lunchReturn, exit, excused, absent, vacation, customHours) {
    var config = Storage.getMonthConfig(currentMonthKey);
    var parts = currentMonthKey.split('-');
    var date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(day));
    var dayOfWeek = date.getDay();
    var effectiveStandard = Calculator.getEffectiveStandardHours(dayOfWeek, config, customHours);

    var cellResult = Calculator.calcDay(entry, lunchOut, lunchReturn, exit, excused, absent, vacation, effectiveStandard);
    var standardMin = effectiveStandard * 60;
    var balanceMin = cellResult.minutes - standardMin;

    var hoursCell = row.querySelector('.hours-col');
    var balanceCell = row.querySelector('.balance-col');

    var hasStatus = excused || absent || vacation;

    if (hasStatus || (entry && exit)) {
      hoursCell.textContent = Calculator.formatHours(cellResult.hoursDecimal);
      balanceCell.textContent = Calculator.formatBalance(cellResult.hoursDecimal - effectiveStandard);
      balanceCell.classList.remove('positive', 'negative');
      if (balanceMin > 0) balanceCell.classList.add('positive');
      else if (balanceMin < 0) balanceCell.classList.add('negative');
    } else {
      hoursCell.textContent = '—';
      balanceCell.textContent = '—';
      balanceCell.classList.remove('positive', 'negative');
    }
  }

  function refreshRowAfterChange(row, day) {
    var monthData = Storage.getMonthData(currentMonthKey);
    var config = Storage.getMonthConfig(currentMonthKey);
    Renderer.renderMonthSummary(currentMonthKey, monthData, config);
    var allMonths = Storage.getAllMonthsWithConfig();
    var globalTotal = Calculator.calcGlobalTotal(allMonths);
    Renderer.renderGlobalTotalizer(globalTotal);
    Renderer.renderSavedMonthsList(allMonths);
    attachBadgeEvents();
  }

  function getRowValues(row) {
    var entryInput = row.querySelector('.time-entry');
    var lunchOutInput = row.querySelector('.time-lunch-out');
    var lunchReturnInput = row.querySelector('.time-lunch-return');
    var exitInput = row.querySelector('.time-exit');
    var statusSelect = row.querySelector('.status-select');
    var cargaInput = row.querySelector('.carga-input');

    var entry = entryInput ? entryInput.value : '';
    var lunchOut = lunchOutInput ? lunchOutInput.value : '';
    var lunchReturn = lunchReturnInput ? lunchReturnInput.value : '';
    var exit = exitInput ? exitInput.value : '';
    var statusVal = statusSelect ? statusSelect.value : '';
    var excused = statusVal === 'excused';
    var absent = statusVal === 'absent';
    var vacation = statusVal === 'vacation';
    var customHours = parseCargaValue(cargaInput ? cargaInput.value : '');

    return { entry: entry, lunchOut: lunchOut, lunchReturn: lunchReturn, exit: exit, excused: excused, absent: absent, vacation: vacation, customHours: customHours };
  }

  function parseCargaValue(val) {
    if (!val || val.trim() === '') return null;
    var num = parseFloat(val.trim().replace(',', '.'));
    if (isNaN(num) || num <= 0) return null;
    return Math.round(num * 10) / 10;
  }

  function formatCargaValue(val) {
    if (val === null || val === undefined) return '';
    return val.toString().replace('.', ',');
  }

  function onCargaBlur(e) {
    var input = e.target;
    var val = parseCargaValue(input.value);
    input.value = formatCargaValue(val);
    input.dispatchEvent(new Event('change'));
  }

  function onCargaChange(e) {
    var input = e.target;
    var day = input.getAttribute('data-day');
    var row = input.closest('tr');
    var vals = getRowValues(row);

    saveAndUpdateRow(row, day, vals);
  }

  function saveAndUpdateRow(row, day, vals) {
    Storage.setMonthDay(currentMonthKey, day, vals.entry, vals.lunchOut, vals.lunchReturn, vals.exit, vals.excused, vals.absent, vals.vacation, vals.customHours);
    updateDayDisplay(row, day, vals.entry, vals.lunchOut, vals.lunchReturn, vals.exit, vals.excused, vals.absent, vals.vacation, vals.customHours);
    refreshRowAfterChange(row, day);
  }

  function setInputsDisabled(row, disabled) {
    var inputs = row.querySelectorAll('.time-entry, .time-lunch-out, .time-lunch-return, .time-exit, .carga-input');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].disabled = disabled;
    }
  }

  function onStatusChange(e) {
    var select = e.target;
    var row = select.closest('tr');
    var vals = getRowValues(row);
    var hasStatus = vals.excused || vals.absent || vals.vacation;

    setInputsDisabled(row, hasStatus);

    var day = select.getAttribute('data-day');
    saveAndUpdateRow(row, day, vals);
  }

  function isValidTime(val) {
    if (!val) return true;
    return /^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(val);
  }

  function onTimeChange(e) {
    var input = e.target;
    var day = input.getAttribute('data-day');
    var row = input.closest('tr');
    var vals = getRowValues(row);

    if (!isValidTime(vals.entry)) vals.entry = '';
    if (!isValidTime(vals.lunchOut)) vals.lunchOut = '';
    if (!isValidTime(vals.lunchReturn)) vals.lunchReturn = '';
    if (!isValidTime(vals.exit)) vals.exit = '';

    saveAndUpdateRow(row, day, vals);
  }

  function attachBadgeEvents() {
    var badges = document.querySelectorAll('.month-badge');
    for (var i = 0; i < badges.length; i++) {
      badges[i].addEventListener('click', function () {
        var monthKey = this.getAttribute('data-month');
        monthSelector.value = monthKey;
        refresh();
      });
    }
  }

  document.getElementById('btn-prev').addEventListener('click', function () {
    var parts = monthSelector.value.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    month -= 1;
    if (month < 0) { month = 11; year -= 1; }
    monthSelector.value = year + '-' + String(month + 1).padStart(2, '0');
    refresh();
  });

  document.getElementById('btn-next').addEventListener('click', function () {
    var parts = monthSelector.value.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;
    month += 1;
    if (month > 11) { month = 0; year += 1; }
    monthSelector.value = year + '-' + String(month + 1).padStart(2, '0');
    refresh();
  });

  monthSelector.addEventListener('change', refresh);

  function sanitizeNamePart(str) {
    return str.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
  }

  function getFirstLastName(fullName) {
    var parts = fullName.trim().split(/\s+/);
    if (parts.length === 0 || fullName.trim() === '') return '';
    var first = sanitizeNamePart(parts[0]);
    var last = parts.length > 1 ? sanitizeNamePart(parts[parts.length - 1]) : '';
    if (last) {
      return first + '_' + last;
    }
    return first;
  }

  document.getElementById('btn-export').addEventListener('click', function () {
    var allMonths = Storage.getAllMonthsWithConfig();
    if (Object.keys(allMonths).length === 0) {
      alert('Nenhum dado para exportar.');
      return;
    }
    var defaultConfig = Storage.getDefaultConfig();
    var employeeName = Storage.getEmployeeName();
    var content = App.IO.exportToTxt(allMonths, defaultConfig, employeeName);
    var namePrefix = getFirstLastName(employeeName);
    var filename = namePrefix ? 'horas_' + namePrefix + '.txt' : 'horas.txt';
    App.IO.downloadTxt(content, filename);
  });

  document.getElementById('btn-report').addEventListener('click', function () {
    var allMonths = Storage.getAllMonthsWithConfig();
    App.Report.openReport(allMonths);
  });

  document.getElementById('btn-clear').addEventListener('click', function () {
    var monthData = Storage.getMonthData(currentMonthKey);
    var hasData = monthData && monthData.days && Object.keys(monthData.days).length > 0;
    if (!hasData) {
      alert('O mês atual não possui dados para limpar.');
      return;
    }
    if (!confirm('Tem certeza que deseja limpar todas as horas do mês atual?')) return;
    Storage.clearMonth(currentMonthKey);
    refresh();
  });

  document.getElementById('btn-import').addEventListener('click', function () {
    importFileInput.click();
  });

  importFileInput.addEventListener('change', function () {
    var file = importFileInput.files[0];
    if (!file) return;
    pendingImportFile = file;
    document.getElementById('import-error').classList.add('hidden');
    document.getElementById('import-error').textContent = '';
    importOverlay.classList.remove('hidden');
    importFileInput.value = '';
  });

  function refreshEmployeeNameInput() {
    var input = document.getElementById('employee-name');
    input.value = Storage.getEmployeeName();
  }

  document.getElementById('btn-import-replace').addEventListener('click', function () {
    if (!pendingImportFile) return;
    App.IO.importFile(pendingImportFile, 'replace').then(function () {
      importOverlay.classList.add('hidden');
      pendingImportFile = null;
      refreshEmployeeNameInput();
      initMonthSelector();
      refresh();
    }).catch(function (err) {
      document.getElementById('import-error').textContent = err.message;
      document.getElementById('import-error').classList.remove('hidden');
    });
  });

  document.getElementById('btn-import-merge').addEventListener('click', function () {
    if (!pendingImportFile) return;
    App.IO.importFile(pendingImportFile, 'merge').then(function () {
      importOverlay.classList.add('hidden');
      pendingImportFile = null;
      refresh();
    }).catch(function (err) {
      document.getElementById('import-error').textContent = err.message;
      document.getElementById('import-error').classList.remove('hidden');
    });
  });

  document.getElementById('btn-import-close').addEventListener('click', function () {
    importOverlay.classList.add('hidden');
    pendingImportFile = null;
  });

  importOverlay.addEventListener('click', function (e) {
    if (e.target === importOverlay) {
      importOverlay.classList.add('hidden');
      pendingImportFile = null;
    }
  });

  function initMonthSelector() {
    var now = new Date();
    var currentValue = monthSelector.value;
    if (currentValue) return;
    monthSelector.value = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  }

  function initEmployeeName() {
    var input = document.getElementById('employee-name');
    input.value = Storage.getEmployeeName();
    input.addEventListener('change', function () {
      Storage.setEmployeeName(input.value.trim());
    });
  }

  function init() {
    initMonthSelector();
    initEmployeeName();
    refresh();
    attachBadgeEvents();
  }

  App.refresh = refresh;
  init();
})();
