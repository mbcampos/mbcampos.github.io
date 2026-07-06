var App = App || {};

(function () {
  'use strict';

  var calc = App.Calculator;

  function exportToTxt(allMonths, defaultConfig, employeeName) {
    var lines = [];
    var now = new Date();
    var dateStr = now.toLocaleDateString('pt-BR') + ' ' + now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    lines.push('# SISTEMA DE HORAS TRABALHADAS - EXPORTACAO');
    lines.push('# Data: ' + dateStr);
    if (employeeName) {
      lines.push('# FUNCIONARIO: ' + employeeName);
    }
    lines.push('# ================================================');
    lines.push('# MES | DIA | DIA_SEMANA | ENTRADA | SAIDA_ALMOCO | RETORNO_ALMOCO | SAIDA | ABONADO | FALTA | FERIAS | CARGA | HORAS | SALDO');

    var monthKeys = Object.keys(allMonths).sort();
    var globalBalanceMin = 0;

    for (var i = 0; i < monthKeys.length; i++) {
      var key = monthKeys[i];
      var monthData = allMonths[key];
      var monthConfig = monthData.config || defaultConfig || { standardHoursPerDay: 8, saturdayHours: 4, sundayHours: 0, workingDays: [1,2,3,4,5] };

      lines.push('# CONFIG ' + key + ': cargaHoraria=' + monthConfig.standardHoursPerDay.toString().replace('.', ',') + 'h | sabado=' + (monthConfig.saturdayHours || 4).toString().replace('.', ',') + 'h | domingo=' + (monthConfig.sundayHours || 0).toString().replace('.', ',') + 'h');

      var parts = key.split('-');
      var year = parseInt(parts[0], 10);
      var month = parseInt(parts[1], 10) - 1;
      var totals = calc.calcMonthTotals(key, monthData, monthConfig);
      globalBalanceMin += totals.balanceMinutes;

      var dayKeys = Object.keys(monthData.days).sort(function (a, b) { return parseInt(a) - parseInt(b); });
      for (var j = 0; j < dayKeys.length; j++) {
        var dk = dayKeys[j];
        var dayData = monthData.days[dk];
        var date = new Date(year, month, parseInt(dk));
        var dayName = calc.getDayName(date, false);
        var dow = date.getDay();
        var dayStd = calc.getEffectiveStandardHours(dow, monthConfig, dayData.customHours);

        var result = calc.calcDay(dayData.entry, dayData.lunchOut, dayData.lunchReturn, dayData.exit, dayData.excused, dayData.absent, dayData.vacation, dayStd);
        var hoursDisplay = calc.formatHours(result.hoursDecimal);
        var balanceDisplay = calc.formatBalance(result.hoursDecimal - dayStd);
        var abonadoDisplay = dayData.excused ? 'Sim' : '';
        var faltaDisplay = dayData.absent ? 'Sim' : '';
        var feriasDisplay = dayData.vacation ? 'Sim' : '';
        var cargaDisplay = dayData.customHours ? dayData.customHours.toString().replace('.', ',') : '';

        lines.push(key + '|' + dk + '|' + dayName + '|' + (dayData.entry || '') + '|' + (dayData.lunchOut || '') + '|' + (dayData.lunchReturn || '') + '|' + (dayData.exit || '') + '|' + abonadoDisplay + '|' + faltaDisplay + '|' + feriasDisplay + '|' + cargaDisplay + '|' + hoursDisplay + '|' + balanceDisplay);
      }

      lines.push('# TOTAIS DO MES ' + key + ': ' + calc.formatHours(totals.totalHoursDecimal) + 'h | Saldo: ' + calc.formatBalance(totals.balanceDecimal) + 'h');
      lines.push('# ================================================');
    }

    var globalBalance = calc.minutesToHoursDecimal(globalBalanceMin);
    lines.push('# TOTALIZADOR GERAL: ' + calc.formatBalance(globalBalance) + 'h');

    return lines.join('\n');
  }

  function parseConfigLine(line) {
    var cfg = {
      standardHoursPerDay: 8,
      saturdayHours: 4,
      sundayHours: 0,
      workingDays: [1, 2, 3, 4, 5]
    };
    var cfgMatch = line.match(/cargaHoraria=([\d,]+)h/);
    if (cfgMatch) cfg.standardHoursPerDay = calc.parseDecimalHours(cfgMatch[1]);
    var satMatch = line.match(/sabado=([\d,]+)h/);
    if (satMatch) cfg.saturdayHours = calc.parseDecimalHours(satMatch[1]);
    var sunMatch = line.match(/domingo=([\d,]+)h/);
    if (sunMatch) cfg.sundayHours = calc.parseDecimalHours(sunMatch[1]);
    return cfg;
  }

  function parseTxt(content) {
    var lines = content.split('\n');
    var months = {};
    var defaultConfig = null;
    var errors = [];
    var currentMonthKey = null;
    var employeeName = '';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line) continue;

      if (line.startsWith('#')) {
        if (line.indexOf('FUNCIONARIO:') !== -1) {
          var nameMatch = line.match(/# FUNCIONARIO:\s*(.+)/);
          if (nameMatch) {
            employeeName = nameMatch[1].trim();
          }
          continue;
        }
        if (!defaultConfig && line.indexOf('CONFIG') === -1) {
          var dc = parseConfigLine(line);
          if (dc.standardHoursPerDay !== 8 || dc.saturdayHours !== 4 || dc.sundayHours !== 0) {
            defaultConfig = dc;
          }
        }
        var configKeyMatch = line.match(/# CONFIG (\d{4}-\d{2}):/);
        if (configKeyMatch) {
          currentMonthKey = configKeyMatch[1];
          if (!months[currentMonthKey]) {
            months[currentMonthKey] = { config: parseConfigLine(line), days: {} };
          } else {
            months[currentMonthKey].config = parseConfigLine(line);
          }
        }
        continue;
      }

      var fields = line.split('|');
      if (fields.length < 7) {
        errors.push('Linha ' + (i + 1) + ': formato invalido (menos de 7 campos)');
        continue;
      }

      var monthKey = fields[0].trim();
      var day = fields[1].trim();
      var entry = fields[3].trim();
      var lunchOut = fields.length > 4 ? fields[4].trim() : '';
      var lunchReturn = fields.length > 5 ? fields[5].trim() : '';
      var exit = fields.length > 6 ? fields[6].trim() : '';
      var excused = false;
      var absent = false;
      var vacation = false;
      var customHours = null;
      if (fields.length > 7 && (fields[7].trim() === 'Sim' || fields[7].trim() === 'sim')) {
        excused = true;
      }
      if (fields.length > 8 && (fields[8].trim() === 'Sim' || fields[8].trim() === 'sim')) {
        absent = true;
      }
      if (fields.length > 9 && (fields[9].trim() === 'Sim' || fields[9].trim() === 'sim')) {
        vacation = true;
      }
      if (fields.length > 10 && fields[10].trim() !== '') {
        var ch = calc.parseDecimalHours(fields[10].trim());
        if (!isNaN(ch) && ch > 0) customHours = ch;
      }

      if (!/^\d{4}-\d{2}$/.test(monthKey)) {
        errors.push('Linha ' + (i + 1) + ': mes/ano invalido "' + monthKey + '"');
        continue;
      }

      if (!months[monthKey]) {
        months[monthKey] = { config: parseConfigLine(''), days: {} };
      }

      months[monthKey].days[day] = {
        entry: entry,
        lunchOut: lunchOut,
        lunchReturn: lunchReturn,
        exit: exit,
        excused: excused,
        absent: absent,
        vacation: vacation,
        customHours: customHours
      };
    }

    return { months: months, defaultConfig: defaultConfig, errors: errors, employeeName: employeeName };
  }

  function downloadTxt(content, filename) {
    var blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importFile(file, mergeMode) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function (e) {
        try {
          var result = parseTxt(e.target.result);
          if (result.errors.length > 0) {
            reject(new Error('Erros no arquivo:\n' + result.errors.join('\n')));
            return;
          }

          if (mergeMode === 'replace') {
            var newData = {
              months: result.months,
              defaultConfig: result.defaultConfig || App.Storage.getDefaultConfig(),
              employeeName: result.employeeName || ''
            };
            App.Storage.replaceAllData(newData);
          } else {
            App.Storage.mergeData(result.months);
          }

          resolve();
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = function () {
        reject(new Error('Erro ao ler o arquivo.'));
      };
      reader.readAsText(file, 'UTF-8');
    });
  }

  App.IO = {
    exportToTxt: exportToTxt,
    parseTxt: parseTxt,
    downloadTxt: downloadTxt,
    importFile: importFile
  };
})();
