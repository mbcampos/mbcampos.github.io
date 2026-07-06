var App = App || {};

(function () {
  'use strict';

  var STORAGE_KEY = 'horasTrabalhadas';

  var DEFAULT_CONFIG = {
    standardHoursPerDay: 8,
    saturdayHours: 4,
    sundayHours: 0,
    workingDays: [1, 2, 3, 4, 5]
  };

  var DEFAULT_DATA = {
    months: {},
    defaultConfig: JSON.parse(JSON.stringify(DEFAULT_CONFIG)),
    employeeName: ''
  };

  function copyConfig(cfg) {
    return {
      standardHoursPerDay: cfg.standardHoursPerDay,
      saturdayHours: cfg.saturdayHours,
      sundayHours: cfg.sundayHours,
      workingDays: cfg.workingDays.slice()
    };
  }

  function migrate(data) {
    if (!data.defaultConfig) {
      if (data.config) {
        data.defaultConfig = {
          standardHoursPerDay: data.config.standardHoursPerDay || 8,
          saturdayHours: data.config.saturdayHours || 4,
          sundayHours: data.config.sundayHours || 0,
          workingDays: (data.config.workingDays && data.config.workingDays.slice()) || [1, 2, 3, 4, 5]
        };
      } else {
        data.defaultConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
      }
      delete data.config;
    }

    var monthKeys = Object.keys(data.months);
    for (var i = 0; i < monthKeys.length; i++) {
      var m = data.months[monthKeys[i]];
      if (!m.config) {
        m.config = copyConfig(data.defaultConfig);
      }
      if (!m.days) m.days = {};
      delete m.standardHours;
    }
  }

  function load() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return JSON.parse(JSON.stringify(DEFAULT_DATA));
      }
      var data = JSON.parse(raw);
      if (!data.months) data.months = {};
      migrate(data);
      return data;
    } catch (e) {
      return JSON.parse(JSON.stringify(DEFAULT_DATA));
    }
  }

  function save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch (e) {
      return false;
    }
  }

  function getMonthData(monthKey) {
    var data = load();
    if (!data.months[monthKey]) {
      data.months[monthKey] = {
        config: copyConfig(data.defaultConfig),
        days: {}
      };
    }
    if (!data.months[monthKey].config) {
      data.months[monthKey].config = copyConfig(data.defaultConfig);
    }
    if (!data.months[monthKey].days) {
      data.months[monthKey].days = {};
    }
    return data.months[monthKey];
  }

  function setMonthDay(monthKey, day, entry, lunchOut, lunchReturn, exit, excused, absent, vacation, customHours) {
    var data = load();
    if (!data.months[monthKey]) {
      data.months[monthKey] = { config: copyConfig(data.defaultConfig), days: {} };
    }
    var dayStr = String(day);
    if (entry === '' && lunchOut === '' && lunchReturn === '' && exit === '' && !excused && !absent && !vacation && !customHours) {
      delete data.months[monthKey].days[dayStr];
    } else {
      data.months[monthKey].days[dayStr] = { entry: entry, lunchOut: lunchOut, lunchReturn: lunchReturn, exit: exit, excused: !!excused, absent: !!absent, vacation: !!vacation, customHours: customHours || null };
    }
    save(data);
  }

  function getMonthConfig(monthKey) {
    var monthData = getMonthData(monthKey);
    return monthData.config;
  }

  function setMonthConfig(monthKey, config) {
    var data = load();
    if (!data.months[monthKey]) {
      data.months[monthKey] = { config: config, days: {} };
    } else {
      data.months[monthKey].config = config;
    }
    save(data);
  }

  function getDefaultConfig() {
    var data = load();
    return data.defaultConfig;
  }

  function setDefaultConfig(config) {
    var data = load();
    data.defaultConfig = config;
    save(data);
  }

  function getAllMonths() {
    var data = load();
    return data.months;
  }

  function getAllMonthsWithConfig() {
    var data = load();
    var result = {};
    var keys = Object.keys(data.months);
    for (var i = 0; i < keys.length; i++) {
      var monthKey = keys[i];
      var month = data.months[monthKey];
      result[monthKey] = {
        config: month.config || copyConfig(data.defaultConfig),
        days: month.days || {}
      };
    }
    return result;
  }

  function replaceAllData(newData) {
    if (!newData.defaultConfig) {
      newData.defaultConfig = JSON.parse(JSON.stringify(DEFAULT_CONFIG));
    }
    save(newData);
  }

  function mergeData(importedMonths) {
    var data = load();
    var keys = Object.keys(importedMonths);
    for (var i = 0; i < keys.length; i++) {
      var monthKey = keys[i];
      var imported = importedMonths[monthKey];
      if (!data.months[monthKey]) {
        data.months[monthKey] = {
          config: imported.config || copyConfig(data.defaultConfig),
          days: imported.days || {}
        };
      } else {
        if (imported.config) {
          data.months[monthKey].config = imported.config;
        }
        var importedDays = imported.days || {};
        var dayKeys = Object.keys(importedDays);
        for (var j = 0; j < dayKeys.length; j++) {
          var dk = dayKeys[j];
          if (!data.months[monthKey].days[dk]) {
            data.months[monthKey].days[dk] = importedDays[dk];
          }
        }
      }
    }
    save(data);
    return data;
  }

  function clearMonth(monthKey) {
    var data = load();
    delete data.months[monthKey];
    save(data);
  }

  function getEmployeeName() {
    var data = load();
    return data.employeeName || '';
  }

  function setEmployeeName(name) {
    var data = load();
    data.employeeName = name;
    save(data);
  }

  App.Storage = {
    load: load,
    save: save,
    getMonthData: getMonthData,
    setMonthDay: setMonthDay,
    getMonthConfig: getMonthConfig,
    setMonthConfig: setMonthConfig,
    getDefaultConfig: getDefaultConfig,
    setDefaultConfig: setDefaultConfig,
    getAllMonths: getAllMonths,
    getAllMonthsWithConfig: getAllMonthsWithConfig,
    clearMonth: clearMonth,
    replaceAllData: replaceAllData,
    mergeData: mergeData,
    getEmployeeName: getEmployeeName,
    setEmployeeName: setEmployeeName
  };
})();
