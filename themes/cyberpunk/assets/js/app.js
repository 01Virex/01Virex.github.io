// 01Virex 主题交互脚本
(function () {
  'use strict';

  /* ---------- 1. 阅读进度条 ---------- */
  function initProgress() {
    var bar = document.getElementById('reading-progress');
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop || document.body.scrollTop) / max * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* ---------- 2. 代码块一键复制 ---------- */
  function initCopy() {
    // 新结构:.code-block(带语言标签栏);旧结构:裸 .prose pre
    var blocks = document.querySelectorAll('.prose .code-block, .prose > pre');
    blocks.forEach(function (block) {
      if (block.querySelector('.copy-btn')) return;
      var btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.type = 'button';
      btn.textContent = 'COPY';
      btn.addEventListener('click', function () {
        // 行号在表格里时,正文在最后一个单元格;否则取整块 code
        var codeCell = block.querySelector('.lntd:last-child code') ||
                       block.querySelector('code') || block;
        var text = codeCell.innerText;
        navigator.clipboard.writeText(text).then(function () {
          btn.textContent = 'COPIED!';
          btn.classList.add('copied');
          setTimeout(function () {
            btn.textContent = 'COPY';
            btn.classList.remove('copied');
          }, 1500);
        });
      });
      // 有标签栏放进栏内,否则贴在 pre 上
      var bar = block.querySelector('.code-bar');
      (bar || block).appendChild(btn);
    });
  }

  /* ---------- 3. 打字机效果 ---------- */
  function initTypewriter() {
    var el = document.querySelector('[data-typewriter]');
    if (!el) return;
    var full = el.getAttribute('data-typewriter');
    el.textContent = '';
    el.classList.add('typing');
    var i = 0;
    (function step() {
      if (i <= full.length) {
        el.textContent = full.slice(0, i);
        i++;
        setTimeout(step, 55);
      } else {
        el.classList.remove('typing');
        el.classList.add('typed');
      }
    })();
  }

  /* ---------- 4. 文章目录滚动高亮(scroll-spy) ---------- */
  function initToc() {
    var toc = document.getElementById('toc');
    if (!toc) return;
    var links = [].slice.call(toc.querySelectorAll('a'));
    if (!links.length) return;
    var map = links.map(function (a) {
      var id = decodeURIComponent((a.getAttribute('href') || '').replace(/^#/, ''));
      return { link: a, el: document.getElementById(id) };
    }).filter(function (m) { return m.el; });

    function onScroll() {
      var pos = window.scrollY + 120;
      var current = null;
      map.forEach(function (m) { if (m.el.offsetTop <= pos) current = m; });
      links.forEach(function (a) { a.classList.remove('active'); });
      if (current) current.link.classList.add('active');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 5. 全站搜索浮层 ---------- */
  function initSiteSearch() {
    var openBtn = document.getElementById('search-toggle');
    var overlay = document.getElementById('search-overlay');
    if (!openBtn || !overlay) return;
    var input = overlay.querySelector('#site-search-input');
    var results = overlay.querySelector('#site-search-results');
    var closeBtn = overlay.querySelector('#search-close');
    var indexUrl = overlay.getAttribute('data-index');
    var data = [];
    var loaded = false;

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function highlight(text, terms) {
      var safe = esc(text);
      var valid = terms.filter(Boolean).map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); });
      if (!valid.length) return safe;
      return safe.replace(new RegExp('(' + valid.join('|') + ')', 'gi'), '<mark class="hl">$1</mark>');
    }
    function load() {
      if (loaded) return;
      loaded = true;
      fetch(indexUrl).then(function (r) { return r.json(); }).then(function (j) { data = j; });
    }
    function open() {
      load();
      if (window.CyberConsole && window.CyberConsole.isOpen()) window.CyberConsole.close();
      overlay.hidden = false;
      document.body.style.overflow = 'hidden';
      setTimeout(function () { input.focus(); }, 50);
    }
    function close() {
      overlay.hidden = true;
      document.body.style.overflow = '';
      input.value = '';
      results.innerHTML = '';
    }
    function search() {
      var q = input.value.trim().toLowerCase();
      if (!q) { results.innerHTML = ''; return; }
      var terms = q.split(/\s+/);
      var matches = data.filter(function (p) {
        var hay = (p.title + ' ' + (p.tags || []).join(' ') + ' ' + p.summary).toLowerCase();
        return terms.every(function (t) { return hay.indexOf(t) !== -1; });
      });
      if (!matches.length) { results.innerHTML = '<div class="search-empty">// 无匹配结果: ' + esc(q) + '</div>'; return; }
      var html = '<div class="search-meta">// 命中 ' + matches.length + ' 条</div>';
      matches.forEach(function (p) {
        var hit = p.summary && terms.some(function (t) { return p.summary.toLowerCase().indexOf(t) !== -1; });
        html += '<a class="search-hit" href="' + p.url + '">' +
                  '<span class="search-hit-date">' + esc(p.date) + '</span>' +
                  '<span class="search-hit-title">' + highlight(p.title, terms) + '</span>' +
                  (hit ? '<span class="search-hit-summary">' + highlight(p.summary, terms) + '</span>' : '') +
                '</a>';
      });
      results.innerHTML = html;
    }

    openBtn.addEventListener('click', open);
    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', function (e) { if (e.target === overlay) close(); });
    input.addEventListener('input', search);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !overlay.hidden) close();
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); overlay.hidden ? open() : close(); }
    });
  }

  /* ---------- 图片放大 lightbox(全站通用) ---------- */
  function initLightbox() {
    var box = document.getElementById('lightbox');
    if (!box) return;
    var img = document.getElementById('lightbox-img');
    var closeBtn = box.querySelector('.lightbox-close');
    function open(src, alt) {
      img.src = src; img.alt = alt || '';
      box.hidden = false;
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.hidden = true; img.src = '';
      document.body.style.overflow = '';
    }
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-lightbox]');
      if (!a) return;
      e.preventDefault();
      var src = a.getAttribute('href') || (a.querySelector('img') && a.querySelector('img').src);
      var im = a.querySelector('img');
      open(src, im ? im.alt : '');
    });
    if (closeBtn) closeBtn.addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !box.hidden) close();
    });
  }

  /* ---------- 启动 ---------- */
  function init() {
    initProgress();
    initCopy();
    initTypewriter();
    initToc();
    initSiteSearch();
    initLightbox();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();


