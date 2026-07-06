var App = App || {};

(function () {
  'use strict';

  function timeToMinutes(timeStr) {
    if (!timeStr) return 0;
    var parts = timeStr.split(':');
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }

  function minutesToTime(totalMinutes) {
    if (totalMinutes < 0) totalMinutes = 0;
    var h = Math.floor(totalMinutes / 60);
    var m = Math.round(totalMinutes % 60);
    return String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  }

  function minutesToHoursDecimal(totalMinutes) {
    return Math.round((totalMinutes / 60) * 10) / 10;
  }

  function formatBalance(hoursDecimal) {
    if (hoursDecimal >= 0) {
      return '+' + hoursDecimal.toFixed(1).replace('.', ',');
    }
    return hoursDecimal.toFixed(1).replace('.', ',');
  }

  function formatHours(hoursDecimal) {
    return hoursDecimal.toFixed(1).replace('.', ',');
  }

  function parseDecimalHours(str) {
    return parseFloat(str.replace(',', '.'));
  }

  function calcDay(entry, lunchOut, lunchReturn, exit, excused, absent, vacation, standardHoursForDay) {
    if (excused || vacation) {
      var stdMin = (standardHoursForDay || 0) * 60;
      return {
        minutes: stdMin,
        hours: minutesToTime(stdMin),
        hoursDecimal: standardHoursForDay || 0
      };
    }

    if (absent) {
      return { minutes: 0, hours: '00:00', hoursDecimal: 0 };
    }

    if (!entry || !exit) {
      return { minutes: 0, hours: '00:00', hoursDecimal: 0 };
    }

    var entryMin = timeToMinutes(entry);
    var exitMin = timeToMinutes(exit);

    if (exitMin <= entryMin) exitMin += 24 * 60;

    var hasLunch = lunchOut && lunchReturn;

    if (hasLunch) {
      var lunchOutMin = timeToMinutes(lunchOut);
      var lunchReturnMin = timeToMinutes(lunchReturn);

      if (lunchOutMin <= entryMin) lunchOutMin += 24 * 60;
      if (lunchReturnMin <= lunchOutMin) lunchReturnMin += 24 * 60;
      if (exitMin <= lunchReturnMin) exitMin += 24 * 60;

      var morning = Math.max(0, lunchOutMin - entryMin);
      var afternoon = Math.max(0, exitMin - lunchReturnMin);
      var worked = morning + afternoon;

      return {
        minutes: worked,
        hours: minutesToTime(worked),
        hoursDecimal: minutesToHoursDecimal(worked)
      };
    }

    var worked = Math.max(0, exitMin - entryMin);

    return {
      minutes: worked,
      hours: minutesToTime(worked),
      hoursDecimal: minutesToHoursDecimal(worked)
    };
  }

  function getStandardHoursForDay(dayOfWeek, config) {
    if (dayOfWeek === 6) return config.saturdayHours || 4;
    if (dayOfWeek === 0) return config.sundayHours || 0;
    return config.standardHoursPerDay;
  }

  function getEffectiveStandardHours(dayOfWeek, config, customHours) {
    if (customHours && customHours > 0) return customHours;
    return getStandardHoursForDay(dayOfWeek, config);
  }

  function calcMonthTotals(monthKey, monthData, config) {
    var totalMinutes = 0;
    var totalBalanceMinutes = 0;

    if (!monthData || !monthData.days) {
      return { totalHours: 0, balanceMinutes: 0, totalHoursDecimal: 0 };
    }

    var parts = monthKey.split('-');
    var year = parseInt(parts[0], 10);
    var month = parseInt(parts[1], 10) - 1;

    var days = monthData.days;
    var dayKeys = Object.keys(days);
    for (var i = 0; i < dayKeys.length; i++) {
      var day = days[dayKeys[i]];
      var date = new Date(year, month, parseInt(dayKeys[i]));
      var dow = date.getDay();
      var dayStd = getEffectiveStandardHours(dow, config, day.customHours);
      var result = calcDay(day.entry, day.lunchOut, day.lunchReturn, day.exit, day.excused, day.absent, day.vacation, dayStd);
      if (result.minutes > 0 || day.excused || day.absent || day.vacation) {
        var standardMin = dayStd * 60;
        totalMinutes += result.minutes;
        totalBalanceMinutes += (result.minutes - standardMin);
      }
    }

    return {
      totalMinutes: totalMinutes,
      totalHours: minutesToTime(totalMinutes),
      totalHoursDecimal: minutesToHoursDecimal(totalMinutes),
      balanceMinutes: totalBalanceMinutes,
      balanceDecimal: minutesToHoursDecimal(totalBalanceMinutes)
    };
  }

  function calcGlobalTotal(allMonths) {
    var totalBalanceMin = 0;
    var monthKeys = Object.keys(allMonths);
    for (var i = 0; i < monthKeys.length; i++) {
      var monthKey = monthKeys[i];
      var monthData = allMonths[monthKey];
      var config = monthData.config || { standardHoursPerDay: 8, saturdayHours: 4, sundayHours: 0, workingDays: [1,2,3,4,5] };
      var totals = calcMonthTotals(monthKey, monthData, config);
      totalBalanceMin += totals.balanceMinutes;
    }
    return minutesToHoursDecimal(totalBalanceMin);
  }

  function getDayName(date, abbreviate) {
    var names = abbreviate
      ? ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      : ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    return names[date.getDay()];
  }

  function getDaysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  App.Calculator = {
    timeToMinutes: timeToMinutes,
    minutesToTime: minutesToTime,
    minutesToHoursDecimal: minutesToHoursDecimal,
    formatBalance: formatBalance,
    formatHours: formatHours,
    parseDecimalHours: parseDecimalHours,
    calcDay: calcDay,
    calcMonthTotals: calcMonthTotals,
    calcGlobalTotal: calcGlobalTotal,
    getStandardHoursForDay: getStandardHoursForDay,
    getEffectiveStandardHours: getEffectiveStandardHours,
    getDayName: getDayName,
    getDaysInMonth: getDaysInMonth
  };
})();
