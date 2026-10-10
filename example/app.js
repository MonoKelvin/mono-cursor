(function () {
  'use strict';

  var doc = document;
  var root = doc.documentElement;
  var $ = function (sel) { return doc.querySelector(sel); };
  var all = function (sel) { return Array.prototype.slice.call(doc.querySelectorAll(sel)); };
  var store = {
    get: function (key) { try { return localStorage.getItem(key) } catch (error) { return null } },
    set: function (key, value) { try { localStorage.setItem(key, value) } catch (error) {} },
  };

  var hasLib = typeof window.MonoCursor !== 'undefined';
  if (!hasLib) root.classList.add('no-bundle');

  // ── Copy ───────────────────────────────────────────────────────────────
  var copy = {
    en: {
      h1: 'A small cursor, beautifully made.',
      lede: 'An arrow over empty space. A ring over anything clickable. An I-beam over anything you can type in. One transform write per pointer event — no easing queue — so it lands on the same frame as your mouse.',
      copy: 'Copy',
      copied: 'Copied',
      copyManual: 'Press ⌘C',
      zoneArrow: 'Arrow',
      zoneArrowHint: 'The resting state',
      zoneArrowProse: 'Hover this paragraph and nothing changes. Prose, empty divs and dead ends all get the arrow — the cursor only reacts to things that actually do something.',
      zoneRing: 'Ring',
      zoneRingHint: 'Links, buttons, controls',
      zoneText: 'I-beam',
      zoneTextHint: 'Inputs and editable text',
      demoLink: 'Read the docs →',
      demoButton: 'Get started',
      demoPlaceholder: 'Type something…',
      demoPlaceholder2: 'Or here…',
      playgroundTitle: 'Playground',
      playgroundBody: 'Every option is a CSS variable, and this page reads the same one — the accent you are looking at is the cursor colour you pick.',
      ctrlColour: 'Colour',
      ctrlArrow: 'Arrow',
      ctrlRing: 'Ring',
      ctrlBorder: 'Ring border',
      ctrlOptions: 'Options',
      optHideDefault: 'Hide system cursor',
      optShadow: 'Shadow',
      optRing: 'Ring',
      optClick: 'Click effect',
      optEnabled: 'Enabled',
      usageTitle: 'Usage',
      usageBody: 'Init once at startup, then call the static methods from anywhere. No refs, no context, no re-render.',
      tabVanilla: 'Vanilla',
      tabBrowser: 'Script tag',
      apiTitle: 'API',
      apiBody: 'The whole surface. Instance methods mirror the static ones.',
      apiNote: 'Prefer markup? <code>data-cursor="text"</code> forces the I-beam, <code>data-cursor="circle"</code> and <code>data-cursor="interactive"</code> force the ring — whatever the element actually is.',
      apiRows: [
        ['init(options?)', 'Create the singleton. Safe to call repeatedly.'],
        ['configure(options)', 'Merge options at runtime and re-apply.'],
        ['setColor(value)', 'Arrow, ring and I-beam colour.'],
        ['setArrowSize(px)', 'Arrow width and height.'],
        ['setRingSize(px)', 'Ring diameter.'],
        ['setRingBorderWidth(px)', 'Ring stroke thickness.'],
        ['setEnableCircle(bool)', 'Draw the ring, or keep the arrow everywhere.'],
        ['setShadow(bool)', 'Drop shadow under the arrow and ring.'],
        ['setClickEffect(bool)', 'Scale the cursor down while pressed.'],
        ['setHideDefaultCursor(bool)', 'Hide the native pointer while active.'],
        ['setState(state)', 'Force “default”, “pointer” or “text”.'],
        ['enable() / disable()', 'Pause and resume without losing the DOM.'],
        ['destroy()', 'Detach every listener and remove the layer.'],
        ['createCursor(options?)', 'Alias for init().'],
      ],
    },
    zh: {
      h1: '一个小巧美观的光标。',
      lede: '空白处是箭头，可点击的地方是圆环，能输入的地方是 I 形光标。每次指针事件只写一次 transform，没有缓动队列，和鼠标落在同一帧。',
      copy: '复制',
      copied: '已复制',
      copyManual: '按 ⌘C',
      zoneArrow: '箭头',
      zoneArrowHint: '静默状态',
      zoneArrowProse: '把指针放在这段文字上，什么都不会发生。正文、空 div、没有交互的地方都是箭头 —— 光标只对真正有行为的东西作出反应。',
      zoneRing: '圆环',
      zoneRingHint: '链接、按钮、控件',
      zoneText: '光标',
      zoneTextHint: '输入框与可编辑文本',
      demoLink: '阅读文档 →',
      demoButton: '开始使用',
      demoPlaceholder: '在这里输入…',
      demoPlaceholder2: '或者这里…',
      playgroundTitle: '试一试',
      playgroundBody: '每个选项都是 CSS 变量，本页也读取同一个变量 —— 你看到的强调色就是你选的光标颜色。',
      ctrlColour: '颜色',
      ctrlArrow: '箭头',
      ctrlRing: '圆环',
      ctrlBorder: '圆环描边',
      ctrlOptions: '选项',
      optHideDefault: '隐藏系统光标',
      optShadow: '阴影',
      optRing: '圆环',
      optClick: '点击反馈',
      optEnabled: '启用',
      usageTitle: '用法',
      usageBody: '启动时初始化一次，之后在任何地方调用静态方法即可。不需要 ref，不需要 context，也不会触发重渲染。',
      tabVanilla: '原生 JS',
      tabBrowser: '脚本标签',
      apiTitle: 'API',
      apiBody: '全部接口。实例方法与静态方法一一对应。',
      apiNote: '更想用标记？<code>data-cursor="text"</code> 强制 I 形光标，<code>data-cursor="circle"</code> 与 <code>data-cursor="interactive"</code> 强制圆环 —— 无论这个元素本身是什么。',
      apiRows: [
        ['init(options?)', '创建单例，可重复调用。'],
        ['configure(options)', '运行时合并选项并重新应用。'],
        ['setColor(value)', '箭头、圆环、I 形光标的颜色。'],
        ['setArrowSize(px)', '箭头的宽高。'],
        ['setRingSize(px)', '圆环直径。'],
        ['setRingBorderWidth(px)', '圆环描边粗细。'],
        ['setEnableCircle(bool)', '是否绘制圆环；关闭后所有状态都保持箭头。'],
        ['setShadow(bool)', '箭头与圆环的投影。'],
        ['setClickEffect(bool)', '按下时光标缩小一下。'],
        ['setHideDefaultCursor(bool)', '激活时隐藏系统光标。'],
        ['setState(state)', '强制 “default”、“pointer” 或 “text”。'],
        ['enable() / disable()', '暂停与恢复，DOM 不会丢失。'],
        ['destroy()', '移除全部监听并删除光标层。'],
        ['createCursor(options?)', 'init() 的别名。'],
      ],
    },
  };

  var lang = root.dataset.lang === 'zh' ? 'zh' : 'en';
  var dict = copy[lang];
  var installAction = $('#install-action');
  var idleLabel = dict.copy;

  function applyLang(next) {
    lang = next;
    dict = copy[next];
    idleLabel = dict.copy;
    root.dataset.lang = next;
    root.lang = next === 'zh' ? 'zh-CN' : 'en';

    all('[data-i18n]').forEach(function (node) {
      var value = dict[node.getAttribute('data-i18n')];
      if (value != null) node.textContent = value;
    });
    all('[data-i18n-html]').forEach(function (node) {
      var value = dict[node.getAttribute('data-i18n-html')];
      if (value != null) node.innerHTML = value;
    });
    all('[data-i18n-placeholder]').forEach(function (node) {
      var value = dict[node.getAttribute('data-i18n-placeholder')];
      if (value != null) node.setAttribute('placeholder', value);
    });
    all('[data-lang-btn]').forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.getAttribute('data-lang-btn') === next));
    });

    renderApi();
    installAction.textContent = idleLabel;
  }

  applyLang(lang);

  all('[data-lang-btn]').forEach(function (button) {
    button.addEventListener('click', function () {
      var next = button.getAttribute('data-lang-btn');
      store.set('mono-cursor-lang', next);
      applyLang(next);
    });
  });

  /* Language resolution, in order: an explicit choice (stored), the browser's
     own preference (already applied above the fold), then — only when neither
     said "Chinese" — a single cached IP lookup. Silent on every failure. */
  var CHINESE_REGIONS = ['CN', 'TW', 'HK', 'MO'];

  if (!store.get('mono-cursor-lang')) {
    var region = store.get('mono-cursor-region');

    if (region) {
      if (CHINESE_REGIONS.indexOf(region) !== -1) applyLang('zh');
    } else if (lang === 'en' && window.fetch) {
      Promise.race([
        fetch('https://ipwho.is/').then(function (response) { return response.json(); }),
        new Promise(function (_, reject) { setTimeout(reject, 2500); }),
      ])
        .then(function (data) { return data && data.country_code; })
        .catch(function () { return null; })
        .then(function (code) {
          if (!code) return;
          store.set('mono-cursor-region', code);
          if (CHINESE_REGIONS.indexOf(code) !== -1 && !store.get('mono-cursor-lang')) applyLang('zh');
        });
    }
  }

  // ── Theme ──────────────────────────────────────────────────────────────
  $('#theme').addEventListener('click', function () {
    var next = root.dataset.theme === 'light' ? 'dark' : 'light';
    root.dataset.theme = next;
    store.set('mono-cursor-theme', next);
  });

  // ── Boot the cursor ────────────────────────────────────────────────────
  if (hasLib) {
    window.MonoCursor.init({
      color: '#6366f1',
      arrowSize: 26,
      ringSize: 24,
      ringBorderWidth: 1.8,
      shadow: true,
      clickEffect: true,
    });
  }

  // ── Demos that must not navigate ───────────────────────────────────────
  doc.addEventListener('click', function (event) {
    var target = event.target;
    if (!(target instanceof Element)) return;
    var link = target.closest('a[href="#"]');
    if (link) event.preventDefault();
  });

  // ── Syntax highlighting ────────────────────────────────────────────────
  var TOKEN = new RegExp([
    "('[^']*'|\"[^\"]*\")",                       // 1 string
    '(&lt;!--[\\s\\S]*?--&gt;|//[^\\n]*)',         // 2 comment
    '(&lt;/?)([A-Za-z][\\w.-]*)',                  // 3 + 4 tag
    '(\\b(?:import|from|export|function|return|const|let|new|true|false|null|typeof)\\b)', // 5 keyword
    '([A-Za-z_$][\\w$]*(?=\\())',                  // 6 call
    '\\b(\\d+(?:\\.\\d+)?)\\b',                    // 7 number
  ].join('|'), 'g');

  function highlight(source) {
    var escaped = source.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return escaped.replace(TOKEN, function (match, str, com, open, tag, kw, fn, num) {
      if (str) return '<span class="t-str">' + str + '</span>';
      if (com) return '<span class="t-com">' + com + '</span>';
      if (tag) return '<span class="t-tag">' + open + tag + '</span>';
      if (kw)  return '<span class="t-key">' + kw + '</span>';
      if (fn)  return '<span class="t-fn">' + fn + '</span>';
      if (num) return '<span class="t-num">' + num + '</span>';
      return match;
    });
  }

  all('pre[data-panel]').forEach(function (pre) {
    pre.innerHTML = highlight(pre.textContent.replace(/^\n/, '').replace(/\s+$/, ''));
  });

  // ── Tabs ───────────────────────────────────────────────────────────────
  var tabs = all('.tab');
  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () {
      tabs.forEach(function (other) { other.setAttribute('aria-selected', String(other === tab)); });
      all('pre[data-panel]').forEach(function (pre) {
        pre.hidden = pre.getAttribute('data-panel') !== tab.getAttribute('data-tab');
      });
    });
  });

  // ── Install strip ──────────────────────────────────────────────────────
  var install = $('#install');

  install.addEventListener('click', function () {
    var command = 'npm i mono-cursor';

    function done() {
      install.classList.add('copied');
      installAction.textContent = dict.copied;
      setTimeout(function () {
        install.classList.remove('copied');
        installAction.textContent = idleLabel;
      }, 1600);
    }

    // Offline / file:// fallback: select the command so ⌘C works.
    function selectCommand() {
      var range = doc.createRange();
      range.selectNodeContents(install.children[1]);
      var selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);
      installAction.textContent = dict.copyManual;
    }

    if (navigator.clipboard) navigator.clipboard.writeText(command).then(done, selectCommand);
    else selectCommand();
  });

  // ── Controls ───────────────────────────────────────────────────────────
  var Cursor = window.MonoCursor || {
    setColor: function () {}, setArrowSize: function () {}, setRingSize: function () {},
    setRingBorderWidth: function () {}, setEnableCircle: function () {}, setShadow: function () {},
    setClickEffect: function () {}, setHideDefaultCursor: function () {},
    enable: function () {}, disable: function () {},
  };

  var presets = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];
  var presetList = $('#presets');

  presets.forEach(function (colour) {
    var dot = doc.createElement('button');
    dot.type = 'button';
    dot.className = 'preset';
    dot.style.background = colour;
    dot.style.color = colour;
    dot.title = colour;
    dot.setAttribute('aria-pressed', String(colour === '#6366f1'));
    dot.addEventListener('click', function () { applyColour(colour); });
    presetList.appendChild(dot);
  });

  function applyColour(colour) {
    $('#colour').value = colour;
    Cursor.setColor(colour);
    all('#presets > *').forEach(function (dot) {
      dot.setAttribute('aria-pressed', String(dot.title === colour));
    });
  }

  $('#colour').addEventListener('input', function (event) { applyColour(event.target.value); });

  function bindSlider(id, output, apply, format) {
    var input = $('#' + id);
    var out = $('#' + output);
    input.addEventListener('input', function () {
      var value = parseFloat(input.value);
      apply(value);
      out.textContent = (format ? format(value) : value) + 'px';
    });
  }

  bindSlider('arrow', 'v-arrow', Cursor.setArrowSize);
  bindSlider('ring', 'v-ring', Cursor.setRingSize);
  bindSlider('border', 'v-border', Cursor.setRingBorderWidth, function (v) { return v.toFixed(1); });

  var switches = {
    'hide-default': Cursor.setHideDefaultCursor,
    'shadow': Cursor.setShadow,
    'ring-on': Cursor.setEnableCircle,
    'click-effect': Cursor.setClickEffect,
  };

  Object.keys(switches).forEach(function (id) {
    var box = $('#' + id);
    box.addEventListener('change', function () { switches[id](box.checked); });
  });

  $('#active').addEventListener('change', function (event) {
    if (event.target.checked) Cursor.enable();
    else Cursor.disable();
  });

  // ── API table ──────────────────────────────────────────────────────────
  function renderApi() {
    var list = $('#api');
    list.textContent = '';
    dict.apiRows.forEach(function (row) {
      var item = doc.createElement('li');
      var name = doc.createElement('code');
      name.textContent = row[0];
      var description = doc.createElement('span');
      description.textContent = row[1];
      item.append(name, description);
      list.appendChild(item);
    });
  }
})();
