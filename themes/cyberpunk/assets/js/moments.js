// 动态页:相对时间 + 配图放大(lightbox)
(function () {
  'use strict';

  /* ---------- 相对时间 ---------- */
  function relTime(iso) {
    var then = new Date(iso).getTime();
    if (isNaN(then)) return '';
    var diff = Math.floor((Date.now() - then) / 1000);
    if (diff < 0) diff = 0;
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + ' 分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + ' 小时前';
    if (diff < 2592000) return Math.floor(diff / 86400) + ' 天前';
    if (diff < 31536000) return Math.floor(diff / 2592000) + ' 个月前';
    return Math.floor(diff / 31536000) + ' 年前';
  }
  function initRelTime() {
    var nodes = document.querySelectorAll('.moment-time[data-time]');
    nodes.forEach(function (el) {
      var iso = el.getAttribute('data-time');
      var abs = el.textContent.trim();
      var rel = relTime(iso);
      if (rel) {
        el.textContent = rel;
        el.title = abs;            // 悬停看绝对时间
        el.classList.add('is-rel');
      }
    });
  }

  /* ---------- 配图 lightbox 由全站 app.js 统一处理 ---------- */

  function init() { initRelTime(); }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
