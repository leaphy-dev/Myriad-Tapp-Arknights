// ========================================
// App 页面模块（路由 + 生命周期 + 工具，自包含）
// ========================================

(function () {
  var currentTheme = 'light';
  var PLAYER_DATA_KEY = 'arknights.player';

  function t(key) {
    try {
      return Tapp.i18n.t(key);
    } catch (e) {
      return key;
    }
  }

  function applyI18n(root) {
    var nodes = root.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      nodes[i].textContent = t(nodes[i].getAttribute('data-i18n'));
    }
    var placeholders = root.querySelectorAll('[data-i18n-placeholder]');
    for (var j = 0; j < placeholders.length; j++) {
      placeholders[j].setAttribute('placeholder', t(placeholders[j].getAttribute('data-i18n-placeholder')));
    }
  }

  async function refreshPlayerData() {
    var skland = window.__arkSkland;
    if (!skland) return;
    try {
      var stored = await Tapp.storage.get(PLAYER_DATA_KEY);
      var uid = stored && stored.data && stored.data.uid;
      if (!uid) return;

      var info = await skland.getPlayerInfo(uid);
      var data = info && info.data ? info.data : null;
      await Tapp.storage.set(PLAYER_DATA_KEY, {
        ts: Date.now(),
        data: {
          uid: uid,
          nickName: (stored.data && stored.data.nickName) || '',
          channelName: (stored.data && stored.data.channelName) || '',
          player: data
        }
      });
    } catch (e) {
      console.error('Failed to refresh player data:', e);
    }
  }

  // ========================================
  // View Router / 视图路由
  // ========================================

  var VIEW_NAMES = ['home', 'debug'];
  var DEFAULT_VIEW = 'home';

  function navigate(name) {
    if (VIEW_NAMES.indexOf(name) === -1) name = DEFAULT_VIEW;

    var container = document.getElementById('tapp-content');
    if (!container) return;

    var views = container.querySelectorAll('[data-view]');
    for (var i = 0; i < views.length; i++) {
      views[i].hidden = views[i].getAttribute('data-view') !== name;
    }

    var pages = (typeof Tapp !== 'undefined' && Tapp.pages) || {};
    var page = pages[name];
    if (page && typeof page.render === 'function') {
      page.render(container);
    }
  }

  function closestByAttr(el, selector) {
    var node = el;
    while (node && node !== document) {
      if (node.matches && node.matches(selector)) return node;
      node = node.parentNode;
    }
    return null;
  }

  // ========================================
  // Lifecycle / 生命周期
  // ========================================

  Tapp.lifecycle.onReady(async function () {
    var container = document.getElementById('tapp-content');

    if (container) {
      applyI18n(container);
      container.addEventListener('click', function (e) {
        var trigger = e.target && (e.target.closest ? e.target.closest('[data-nav]') : closestByAttr(e.target, '[data-nav]'));
        if (trigger) {
          navigate(trigger.getAttribute('data-nav'));
        }
      });
      navigate(DEFAULT_VIEW);
    }

    try {
      var theme = await Tapp.ui.getTheme();
      currentTheme = theme === 'dark' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', currentTheme === 'dark');
    } catch (e) {}

    try {
      Tapp.ui.onThemeChange(function (newTheme) {
        currentTheme = newTheme === 'dark' ? 'dark' : 'light';
        document.documentElement.classList.toggle('dark', currentTheme === 'dark');
      });
    } catch (e) {}

    refreshPlayerData().catch(function (e) {
      console.error('Failed to refresh player data:', e);
    });
  });
})();
