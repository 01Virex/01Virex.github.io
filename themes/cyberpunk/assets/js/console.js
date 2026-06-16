// 控制台(模拟终端)—— 命令行操控网站,历史存 localStorage
(function () {
  'use strict';
  var overlay = document.getElementById('console-overlay');
  if (!overlay) return;
  var out = document.getElementById('console-output');
  var input = document.getElementById('console-input');
  var closeBtn = document.getElementById('console-close');
  var openBtn = document.getElementById('console-toggle');

  var siteTitle = overlay.getAttribute('data-title') || '01Virex';
  var baseURL = overlay.getAttribute('data-baseurl') || '/';
  var indexUrl = overlay.getAttribute('data-index');
  var LS_OUT = 'cyber_console_out';
  var LS_HIST = 'cyber_console_hist';

  var posts = [];
  var loaded = false;
  var cmdHistory = [];   // 方向键回溯
  var histPos = -1;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  function save() {
    try {
      localStorage.setItem(LS_OUT, out.innerHTML);
      localStorage.setItem(LS_HIST, JSON.stringify(cmdHistory.slice(-100)));
    } catch (e) { /* 隐私模式等忽略 */ }
  }
  function restore() {
    try {
      var o = localStorage.getItem(LS_OUT);
      var h = localStorage.getItem(LS_HIST);
      if (o) out.innerHTML = o;
      if (h) cmdHistory = JSON.parse(h) || [];
    } catch (e) { /* 忽略 */ }
  }

  function print(html, cls) {
    var div = document.createElement('div');
    div.className = 'console-line' + (cls ? ' ' + cls : '');
    div.innerHTML = html;
    out.appendChild(div);
    out.scrollTop = out.scrollHeight;
    save();
  }
  function echoCmd(cmd) {
    print('<span class="console-ps1">root@01virex:~#</span> ' + esc(cmd), 'echo');
  }

  function loadIndex(cb) {
    if (loaded) { cb && cb(); return; }
    fetch(indexUrl).then(function (r) { return r.json(); }).then(function (j) {
      posts = j || []; loaded = true; cb && cb();
    }).catch(function () { loaded = true; cb && cb(); });
  }

  /* ---------- 命令实现 ---------- */
  var COMMANDS = {
    help: function () {
      print([
        '可用命令:',
        '  <span class="c-cmd">help</span>              显示本帮助',
        '  <span class="c-cmd">ls</span>                列出全部文章',
        '  <span class="c-cmd">open</span> &lt;关键词&gt;     打开标题匹配的文章',
        '  <span class="c-cmd">search</span> &lt;关键词&gt;   搜索文章',
        '  <span class="c-cmd">goto</span> &lt;页面&gt;       跳转: home/posts/about/archives/friends/tags',
        '  <span class="c-cmd">home</span>              回首页',
        '  <span class="c-cmd">back</span>              浏览器后退',
        '  <span class="c-cmd">whoami</span>            身份信息',
        '  <span class="c-cmd">date</span>              当前时间',
        '  <span class="c-cmd">neofetch</span>          系统信息面板',
        '  <span class="c-cmd">matrix</span>            进入矩阵',
        '  <span class="c-cmd">theme</span> rain on|off  开关背景数据雨',
        '  <span class="c-cmd">theme</span> color &lt;#色&gt;  改数据雨颜色',
        '  <span class="c-cmd">reboot</span>            重启终端(清屏+重显启动文案)',
        '  <span class="c-cmd">clear</span>             清屏'
      ].join('\n'));
    },
    ls: function () {
      loadIndex(function () {
        if (!posts.length) { print('// 暂无文章'); return; }
        var lines = posts.map(function (p) {
          return '  <span class="c-date">' + esc(p.date) + '</span>  ' +
                 '<a class="c-link" href="' + p.url + '">' + esc(p.title) + '</a>';
        });
        print('共 ' + posts.length + ' 篇:\n' + lines.join('\n'));
      });
    },
    open: function (args) {
      var kw = args.join(' ').toLowerCase();
      if (!kw) { print('用法: open &lt;关键词&gt;', 'c-err'); return; }
      loadIndex(function () {
        var hit = posts.find(function (p) { return p.title.toLowerCase().indexOf(kw) !== -1; });
        if (hit) { print('正在打开: ' + esc(hit.title) + ' …', 'c-ok'); location.href = hit.url; }
        else print('未找到标题包含 "' + esc(kw) + '" 的文章', 'c-err');
      });
    },
    search: function (args) {
      var kw = args.join(' ').toLowerCase();
      if (!kw) { print('用法: search &lt;关键词&gt;', 'c-err'); return; }
      loadIndex(function () {
        var terms = kw.split(/\s+/);
        var res = posts.filter(function (p) {
          var hay = (p.title + ' ' + (p.tags || []).join(' ') + ' ' + p.summary).toLowerCase();
          return terms.every(function (t) { return hay.indexOf(t) !== -1; });
        });
        if (!res.length) { print('// 无匹配结果: ' + esc(kw), 'c-err'); return; }
        var lines = res.map(function (p) {
          return '  <a class="c-link" href="' + p.url + '">' + esc(p.title) + '</a>';
        });
        print('命中 ' + res.length + ' 条:\n' + lines.join('\n'));
      });
    }
  };

  var PAGES = {
    home: '', posts: 'posts/', about: 'about/',
    archives: 'archives/', friends: 'friends/', tags: 'tags/'
  };
  COMMANDS.goto = function (args) {
    var key = (args[0] || '').toLowerCase();
    if (!(key in PAGES)) { print('未知页面: ' + esc(key || '(空)') + ' — 可选: ' + Object.keys(PAGES).join('/'), 'c-err'); return; }
    print('跳转到 /' + PAGES[key] + ' …', 'c-ok');
    location.href = baseURL.replace(/\/$/, '') + '/' + PAGES[key];
  };
  COMMANDS.home = function () { print('回首页 …', 'c-ok'); location.href = baseURL; };
  COMMANDS.back = function () { print('后退 …', 'c-ok'); history.back(); };

  COMMANDS.whoami = function () {
    print('<span class="c-ok">' + esc(siteTitle) + '</span> // NETRUNNER\n身份已验证。欢迎回到夜之城,武士。');
  };
  COMMANDS.date = function () {
    print(new Date().toString());
  };
  COMMANDS.neofetch = function () {
    var art = [
      '<span class="c-art">      ▟█████▙      </span>  <span class="c-cmd">user</span>@<span class="c-cmd">' + esc(siteTitle) + '</span>',
      '<span class="c-art">    ▟██▛  ▜██▙    </span>  -----------------',
      '<span class="c-art">   ██▛  ██  ▜██   </span>  <span class="c-cmd">OS</span>:     UnnamedOS v2.077',
      '<span class="c-art">   ██   ██   ██   </span>  <span class="c-cmd">Host</span>:   Hugo Static Site',
      '<span class="c-art">   ▜██  ██  ██▛   </span>  <span class="c-cmd">Shell</span>:  /bin/cybersh',
      '<span class="c-art">    ▜██▙  ▟██▛    </span>  <span class="c-cmd">Theme</span>:  Cyberpunk 2077',
      '<span class="c-art">      ▜█████▛      </span>  <span class="c-cmd">CPU</span>:    Running on Coca-Cola',
      '<span class="c-art">                  </span>  <span class="c-cmd">Status</span>: <span class="c-ok">● ONLINE</span>'
    ];
    print(art.join('\n'));
  };
  COMMANDS.matrix = function () {
    if (window.DataRain && window.DataRain.available) {
      window.DataRain.matrix();
      print('进入矩阵 … 跟着白兔走。', 'c-ok');
    } else {
      print('数据雨未启用,无法进入矩阵。在 hugo.toml 里打开 dataRain。', 'c-err');
    }
  };
  COMMANDS.clear = function () {
    out.innerHTML = '';
    save();
  };
  COMMANDS.reboot = function () {
    out.innerHTML = '';
    print('正在重启系统 …', 'c-ok');
    setTimeout(function () {
      out.innerHTML = '';
      banner();
    }, 600);
  };
  COMMANDS.theme = function (args) {
    var sub = (args[0] || '').toLowerCase();
    if (!window.DataRain || !window.DataRain.available) { print('数据雨未启用(hugo.toml 里 dataRain.enable = false)', 'c-err'); return; }
    if (sub === 'rain') {
      var st = (args[1] || '').toLowerCase();
      if (st === 'on') { window.DataRain.on(); print('数据雨: 开', 'c-ok'); }
      else if (st === 'off') { window.DataRain.off(); print('数据雨: 关', 'c-ok'); }
      else print('用法: theme rain on|off', 'c-err');
    } else if (sub === 'color') {
      var col = args[1];
      if (/^#[0-9a-fA-F]{3,8}$/.test(col || '')) { window.DataRain.setColor(col); print('数据雨颜色 → ' + esc(col), 'c-ok'); }
      else print('用法: theme color #00F0FF', 'c-err');
    } else {
      print('theme 命令: \n  theme rain on|off\n  theme color &lt;#色值&gt;');
    }
  };

  // 隐藏彩蛋
  COMMANDS.uent26 = function () {
    print('What?');
    print('看起来你找到我的小号了(', 'c-egg');
  };

  /* ---------- 命令分发 ---------- */
  function run(raw) {
    var line = raw.trim();
    if (!line) return;
    echoCmd(line);
    cmdHistory.push(line);
    histPos = cmdHistory.length;
    var parts = line.split(/\s+/);
    var name = parts[0].toLowerCase();
    var args = parts.slice(1);
    if (COMMANDS[name]) {
      try { COMMANDS[name](args); }
      catch (e) { print('执行出错: ' + esc(String(e)), 'c-err'); }
    } else {
      print('command not found: ' + esc(parts[0]) + ' — 输入 <span class="c-cmd">help</span> 查看可用命令', 'c-err');
    }
    save();
  }

  /* ---------- 开关 ---------- */
  function isOpen() { return !overlay.hidden; }
  function open() {
    // 与搜索浮层互斥
    var so = document.getElementById('search-overlay');
    if (so && !so.hidden) { so.hidden = true; document.body.style.overflow = ''; }
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    setTimeout(function () { input.focus(); }, 50);
    out.scrollTop = out.scrollHeight;
  }
  function close() {
    overlay.hidden = true;
    document.body.style.overflow = '';
  }
  function toggle() { isOpen() ? close() : open(); }
  window.CyberConsole = { open: open, close: close, toggle: toggle, isOpen: isOpen };

  /* ---------- 事件 ---------- */
  input.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
      run(input.value);
      input.value = '';
      histPos = cmdHistory.length;
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (histPos > 0) { histPos--; input.value = cmdHistory[histPos] || ''; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histPos < cmdHistory.length - 1) { histPos++; input.value = cmdHistory[histPos] || ''; }
      else { histPos = cmdHistory.length; input.value = ''; }
    }
  });
  if (closeBtn) closeBtn.addEventListener('click', close);
  if (openBtn) openBtn.addEventListener('click', open);
  overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
  // 点输出区任意处聚焦到输入框,像真终端
  overlay.querySelector('.console-window').addEventListener('click', function (e) {
    if (e.target.tagName !== 'A' && e.target.id !== 'console-close') input.focus();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && isOpen()) { close(); return; }
    var tag = (e.target.tagName || '').toLowerCase();
    var typing = tag === 'input' || tag === 'textarea';
    // Ctrl/Cmd + J 或 Ctrl/Cmd + ` 随时开关
    if ((e.ctrlKey || e.metaKey) && (e.key === 'j' || e.key === '`')) {
      e.preventDefault(); toggle(); return;
    }
    // 裸反引号:仅在没在输入框打字时开关(避免挡住输入 `)
    if (e.key === '`' && !typing && !e.ctrlKey && !e.metaKey && !e.altKey) {
      e.preventDefault(); toggle();
    }
  });

  /* ---------- 启动横幅(可复用) ---------- */
  function banner() {
    print('UnnamedOS v2.077 — 终端已就绪。', 'c-boot');
    print('(c) 2026 01Virex. 保留所有权利。', 'c-boot');
    print('输入 <span class="c-cmd">help</span> 查看命令。', 'c-boot');
    print('提示: 按 <span class="c-cmd">`</span> 或 <span class="c-cmd">Ctrl/Cmd + J</span> 随时开关本终端。', 'c-boot');
  }

  /* ---------- 启动 ---------- */
  restore();
  if (!out.innerHTML.trim()) {
    banner();
  }
})();



