var App = App || {};

(function () {
  'use strict';

  var overlay = document.getElementById('config-overlay');
  var inputStandardHours = document.getElementById('cfg-standard-hours');
  var inputSaturdayHours = document.getElementById('cfg-saturday-hours');
  var inputSundayHours = document.getElementById('cfg-sunday-hours');
  var weekdayCheckboxes = document.querySelectorAll('.cfg-weekday');

  function getCurrentMonthKey() {
    return document.getElementById('month-selector').value;
  }

  function open() {
    var monthKey = getCurrentMonthKey();
    var config = App.Storage.getMonthConfig(monthKey);
    inputStandardHours.value = config.standardHoursPerDay;
    inputSaturdayHours.value = config.saturdayHours || 4;
    inputSundayHours.value = config.sundayHours || 0;

    for (var i = 0; i < weekdayCheckboxes.length; i++) {
      var val = parseInt(weekdayCheckboxes[i].value, 10);
      weekdayCheckboxes[i].checked = config.workingDays.indexOf(val) !== -1;
    }

    overlay.classList.remove('hidden');
  }

  function close() {
    overlay.classList.add('hidden');
  }

  function save() {
    var workingDays = [];
    for (var i = 0; i < weekdayCheckboxes.length; i++) {
      if (weekdayCheckboxes[i].checked) {
        workingDays.push(parseInt(weekdayCheckboxes[i].value, 10));
      }
    }

    var config = {
      standardHoursPerDay: parseFloat(inputStandardHours.value) || 8,
      saturdayHours: parseFloat(inputSaturdayHours.value) || 4,
      sundayHours: parseFloat(inputSundayHours.value) || 0,
      workingDays: workingDays.length > 0 ? workingDays : [1, 2, 3, 4, 5]
    };

    var monthKey = getCurrentMonthKey();
    App.Storage.setMonthConfig(monthKey, config);
    close();
    App.refresh();
  }

  document.getElementById('btn-config').addEventListener('click', open);
  document.getElementById('btn-config-close').addEventListener('click', close);
  document.getElementById('btn-config-cancel').addEventListener('click', close);
  document.getElementById('btn-config-save').addEventListener('click', save);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) close();
  });
})();
