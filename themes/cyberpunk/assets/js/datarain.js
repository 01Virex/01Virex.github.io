// 背景数据雨(Matrix 字符雨)—— 参数由 hugo.toml 注入
// 暴露 window.DataRain 控制接口,供控制台 theme 命令调用
(function () {
  'use strict';
  var canvas = document.getElementById('data-rain');
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 即使数据雨未启用,也提供一个"占位"接口,让控制台命令有统一反馈
  if (!canvas) {
    window.DataRain = {
      available: false,
      on: function () { return false; },
      off: function () { return false; },
      setColor: function () { return false; },
      matrix: function () { return false; }
    };
    return;
  }

  var cfg = {
    color: canvas.getAttribute('data-color') || '#00F0FF',
    chars: canvas.getAttribute('data-chars') || '01',
    fontSize: parseInt(canvas.getAttribute('data-fontsize'), 10) || 16,
    speed: parseInt(canvas.getAttribute('data-speed'), 10) || 55
  };
  var ctx = canvas.getContext('2d');
  var chars = cfg.chars.split('');
  var cols, drops, timer = null;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    cols = Math.floor(canvas.width / cfg.fontSize);
    drops = [];
    for (var i = 0; i < cols; i++) {
      drops[i] = Math.floor(Math.random() * canvas.height / cfg.fontSize);
    }
  }

  function draw() {
    ctx.fillStyle = 'rgba(10, 10, 10, 0.08)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = cfg.color;
    ctx.font = cfg.fontSize + 'px monospace';
    for (var i = 0; i < drops.length; i++) {
      var ch = chars[Math.floor(Math.random() * chars.length)];
      ctx.fillText(ch, i * cfg.fontSize, drops[i] * cfg.fontSize);
      if (drops[i] * cfg.fontSize > canvas.height && Math.random() > 0.975) {
        drops[i] = 0;
      }
      drops[i]++;
    }
  }

  function start(interval) {
    if (timer) clearInterval(timer);
    timer = setInterval(draw, interval || cfg.speed);
    canvas.style.display = '';
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.style.display = 'none';
  }

  // 控制接口
  window.DataRain = {
    available: true,
    on: function () { start(); return true; },
    off: function () { stop(); return true; },
    setColor: function (c) { cfg.color = c; return true; },
    matrix: function () {
      // 临时强化:更快 + 经典绿,8 秒后恢复
      var oldColor = cfg.color;
      cfg.color = '#00FF41';
      start(28);
      setTimeout(function () { cfg.color = oldColor; start(); }, 8000);
      return true;
    }
  };

  resize();
  window.addEventListener('resize', resize);
  if (!reduce) start();
  else canvas.style.display = 'none';
})();
