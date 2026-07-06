var App = App || {};

(function () {
  'use strict';

  var calc = App.Calculator;

  function generate(allMonths) {
    var now = new Date();
    var dateStr = now.toLocaleDateString('pt-BR');
    var timeStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    var employeeName = App.Storage.getEmployeeName().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

    var monthKeys = Object.keys(allMonths).sort();
    var globalBalanceMin = 0;
    var totalWorkedMin = 0;
    var totalExpectedMin = 0;
    var totalDays = 0;
    var totalExcused = 0;
    var totalAbsent = 0;
    var totalVacation = 0;

    var monthRows = '';
    var monthDetails = '';

    for (var i = 0; i < monthKeys.length; i++) {
      var key = monthKeys[i];
      var monthData = allMonths[key];
      var config = monthData.config || { standardHoursPerDay: 8, saturdayHours: 4, sundayHours: 0, workingDays: [1,2,3,4,5] };
      var parts = key.split('-');
      var year = parseInt(parts[0], 10);
      var monthIdx = parseInt(parts[1], 10) - 1;
      var monthName = new Date(year, monthIdx, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
      var monthNameCap = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      var totals = calc.calcMonthTotals(key, monthData, config);
      globalBalanceMin += totals.balanceMinutes;
      totalWorkedMin += totals.totalMinutes;

      var days = monthData.days || {};
      var dayKeys = Object.keys(days);
      var daysFilled = 0;
      var daysExcused = 0;
      var daysAbsent = 0;
      var daysVacation = 0;
      var monthExpectedMin = 0;

      for (var j = 0; j < dayKeys.length; j++) {
        var d = days[dayKeys[j]];
        var date = new Date(year, monthIdx, parseInt(dayKeys[j]));
        var dow = date.getDay();
        var effStd = calc.getEffectiveStandardHours(dow, config, d.customHours);
        var effStdMin = effStd * 60;

        if (d.excused) {
          daysExcused++;
          monthExpectedMin += effStdMin;
        } else if (d.absent) {
          daysAbsent++;
          monthExpectedMin += effStdMin;
        } else if (d.vacation) {
          daysVacation++;
          monthExpectedMin += effStdMin;
        } else if (d.entry && d.exit) {
          daysFilled++;
          monthExpectedMin += effStdMin;
        }
      }

      totalDays += daysFilled;
      totalExcused += daysExcused;
      totalAbsent += daysAbsent;
      totalVacation += daysVacation;
      totalExpectedMin += monthExpectedMin;

      var balanceClass = totals.balanceDecimal > 0 ? 'positive' : totals.balanceDecimal < 0 ? 'negative' : '';
      var balanceDisplay = calc.formatBalance(totals.balanceDecimal);

      monthRows += '<tr>';
      monthRows += '<td>' + monthNameCap + '</td>';
      monthRows += '<td class="num">' + calc.formatHours(totals.totalHoursDecimal) + 'h</td>';
      monthRows += '<td class="num ' + balanceClass + '">' + balanceDisplay + 'h</td>';
      monthRows += '<td class="num">' + daysFilled + '</td>';
      monthRows += '<td class="num">' + daysExcused + '</td>';
      monthRows += '<td class="num">' + daysAbsent + '</td>';
      monthRows += '<td class="num">' + daysVacation + '</td>';
      monthRows += '<td class="num">' + config.standardHoursPerDay.toString().replace('.', ',') + 'h</td>';
      monthRows += '</tr>';
    }

    var globalBalanceDecimal = calc.minutesToHoursDecimal(globalBalanceMin);
    var globalBalanceClass = globalBalanceDecimal > 0 ? 'positive' : globalBalanceDecimal < 0 ? 'negative' : '';

    var html = '<!DOCTYPE html>\n<html lang="pt-BR">\n<head>\n<meta charset="UTF-8">\n';
    html += '<title>Relatório de Horas Trabalhadas</title>\n';
    html += '<style>\n';
    html += '  body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 20px; color: #2f3640; }\n';
    html += '  h1 { text-align: center; color: #4a69bd; font-size: 1.4rem; margin-bottom: 4px; }\n';
    html += '  .subtitle { text-align: center; color: #7f8fa6; font-size: 0.9rem; margin-bottom: 24px; }\n';
    html += '  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }\n';
    html += '  th { background: #4a69bd; color: #fff; padding: 10px 12px; text-align: left; font-size: 0.85rem; }\n';
    html += '  td { padding: 8px 12px; border-bottom: 1px solid #dcdde1; font-size: 0.9rem; }\n';
    html += '  .num { text-align: right; }\n';
    html += '  .positive { color: #27ae60; font-weight: 700; }\n';
    html += '  .negative { color: #e74c3c; font-weight: 700; }\n';
    html += '  .summary-cards { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }\n';
    html += '  .card { flex: 1; min-width: 140px; background: #f5f6fa; border-radius: 8px; padding: 16px; text-align: center; }\n';
    html += '  .card .card-value { font-size: 1.4rem; font-weight: 700; }\n';
    html += '  .card .card-label { font-size: 0.8rem; color: #7f8fa6; margin-top: 4px; }\n';
    html += '  .divider { border-top: 2px solid #4a69bd; margin: 20px 0; }\n';
    html += '  @media print { body { padding: 0; } .no-print { display: none; } }\n';
    html += '</style>\n</head>\n<body>\n';

    html += '<h1>Relatório de Horas Trabalhadas</h1>\n';
    if (employeeName) {
      html += '<p style="text-align:center;font-size:1.1rem;font-weight:600;color:#2f3640;margin-bottom:4px">Funcionário: ' + employeeName + '</p>\n';
    }
    html += '<p class="subtitle">Gerado em ' + dateStr + ' às ' + timeStr + '</p>\n';

    html += '<div class="summary-cards">\n';
    html += '<div class="card"><div class="card-value">' + monthKeys.length + '</div><div class="card-label">Meses registrados</div></div>\n';
    html += '<div class="card"><div class="card-value">' + calc.formatHours(calc.minutesToHoursDecimal(totalWorkedMin)) + 'h</div><div class="card-label">Horas trabalhadas</div></div>\n';
    html += '<div class="card"><div class="card-value ' + globalBalanceClass + '">' + calc.formatBalance(globalBalanceDecimal) + 'h</div><div class="card-label">Saldo total</div></div>\n';
    html += '<div class="card"><div class="card-value">' + totalDays + '</div><div class="card-label">Dias trabalhados</div></div>\n';
    html += '<div class="card"><div class="card-value">' + totalExcused + '</div><div class="card-label">Dias abonados</div></div>\n';
    html += '<div class="card"><div class="card-value">' + totalAbsent + '</div><div class="card-label">Faltas</div></div>\n';
    html += '<div class="card"><div class="card-value">' + totalVacation + '</div><div class="card-label">Férias</div></div>\n';
    html += '</div>\n';

    html += '<h2 style="font-size:1.1rem;margin-bottom:12px">Resumo por Mês</h2>\n';
    html += '<table>\n';
    html += '<thead><tr><th>Mês</th><th class="num">Horas</th><th class="num">Saldo</th><th class="num">Dias Trab.</th><th class="num">Abon.</th><th class="num">Faltas</th><th class="num">Férias</th><th class="num">Carga Diária</th></tr></thead>\n';
    html += '<tbody>' + monthRows + '</tbody>\n';
    html += '</table>\n';

    html += '<div class="divider"></div>\n';
    html += '<p style="text-align:right;font-size:1.1rem"><strong>Saldo Acumulado: <span class="' + globalBalanceClass + '">' + calc.formatBalance(globalBalanceDecimal) + 'h</span></strong></p>\n';

    html += '<p class="no-print" style="text-align:center;margin-top:24px"><button onclick="window.print()" style="padding:10px 24px;font-size:1rem;cursor:pointer;background:#4a69bd;color:#fff;border:none;border-radius:6px">Imprimir</button></p>\n';

    html += '</body>\n</html>';

    return html;
  }

  function openReport(allMonths) {
    if (Object.keys(allMonths).length === 0) {
      alert('Nenhum dado para gerar relatório.');
      return;
    }
    var html = generate(allMonths);
    var win = window.open('', '_blank', 'width=960,height=700');
    if (!win) {
      alert('Permita a abertura de pop-ups para visualizar o relatório.');
      return;
    }
    win.document.write(html);
    win.document.close();
  }

  App.Report = {
    generate: generate,
    openReport: openReport
  };
})();
