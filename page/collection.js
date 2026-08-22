// ========================================
// Collection Page（干员资产 / 皮肤资产）
// ========================================

(function () {
  var PLAYER_DATA_KEY = 'arknights.player';

  function render(container) {
    var section = container.querySelector('[data-view="assets"]');
    if (!section) return;
    section.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.setAttribute(
      'style',
      'width:100%;max-width:720px;margin:0 auto;padding:24px 16px;' +
        'font-family:system-ui,sans-serif;box-sizing:border-box;'
    );

    var topBar = document.createElement('div');
    topBar.setAttribute('style', 'display:flex;align-items:center;gap:12px;margin-bottom:16px;');

    var back = document.createElement('button');
    back.type = 'button';
    back.textContent = '← 返回';
    back.setAttribute('data-nav', 'home');
    back.setAttribute(
      'style',
      'padding:6px 14px;font-size:13px;color:#f5f5f5;background:transparent;' +
        'border:1px solid rgba(255,255,255,0.35);border-radius:6px;cursor:pointer;'
    );

    var title = document.createElement('h1');
    title.setAttribute('style', 'font-size:18px;font-weight:600;margin:0;color:#f5f5f5;');
    title.textContent = '我的方舟';

    topBar.appendChild(back);
    topBar.appendChild(title);
    wrap.appendChild(topBar);

    section.appendChild(wrap);

    var assets = window.__arkAssets;
    if (!assets) return;

    Tapp.storage.get(PLAYER_DATA_KEY).then(function (stored) {
      var player = stored && stored.data && stored.data.player ? stored.data.player : {};
      return assets.loadAssets().then(function () {
        assets.setCharInfoMap(player.charInfoMap);
        renderContent(wrap, player, assets);
      });
    }).catch(function () {
      renderContent(wrap, {}, assets);
    });
  }

  function renderContent(wrap, player, assets) {
    var charInfoMap = (player && player.charInfoMap) || {};
    var skinInfoMap = (player && player.skinInfoMap) || {};

    var tabs = document.createElement('div');
    tabs.setAttribute('style', 'display:flex;gap:8px;margin-bottom:16px;');

    var tabChar = makeTab('干员', 'char', true);
    var tabSkin = makeTab('时装', 'skin', false);
    tabs.appendChild(tabChar);
    tabs.appendChild(tabSkin);
    wrap.appendChild(tabs);

    var charPanel = renderCharPanel(player, assets);
    var skinPanel = renderSkinPanel(skinInfoMap);
    wrap.appendChild(charPanel);
    wrap.appendChild(skinPanel);

    tabChar.addEventListener('click', function () {
      charPanel.style.display = 'block';
      skinPanel.style.display = 'none';
      tabChar.style.background = '#6366f1';
      tabChar.style.color = '#fff';
      tabSkin.style.background = 'transparent';
      tabSkin.style.color = '#f5f5f5';
    });
    tabSkin.addEventListener('click', function () {
      charPanel.style.display = 'none';
      skinPanel.style.display = 'block';
      tabSkin.style.background = '#6366f1';
      tabSkin.style.color = '#fff';
      tabChar.style.background = 'transparent';
      tabChar.style.color = '#f5f5f5';
    });

    skinPanel.style.display = 'none';
  }

  function makeTab(label, key, active) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.setAttribute(
      'style',
      'padding:6px 18px;font-size:13px;font-weight:500;border-radius:6px;cursor:pointer;border:1px solid rgba(255,255,255,0.25);' +
        (active ? 'background:#6366f1;color:#fff;' : 'background:transparent;color:#f5f5f5;')
    );
    return btn;
  }

  function renderCharPanel(player, assets) {
    var panel = document.createElement('div');

    var charInfoMap = (player && player.charInfoMap) || {};
    var owned = {};
    var chars = (player && Array.isArray(player.chars)) ? player.chars : [];
    for (var i = 0; i < chars.length; i++) {
      owned[chars[i].charId] = chars[i];
    }

    var list = [];
    for (var charId in charInfoMap) {
      if (!Object.prototype.hasOwnProperty.call(charInfoMap, charId)) continue;
      var info = charInfoMap[charId];
      list.push({
        info: info,
        char: owned[charId] || {
          charId: charId, level: 1, evolvePhase: 0, potentialRank: 0,
          defaultSkillId: '', skinId: ''
        }
      });
    }

    list.sort(function (a, b) {
      var ra = (a.info && a.info.rarity) || 0;
      var rb = (b.info && b.info.rarity) || 0;
      if (ra !== rb) return rb - ra;
      return ((a.info && a.info.sortId) || 0) - ((b.info && b.info.sortId) || 0);
    });

    if (!list.length) {
      panel.setAttribute('style', 'font-size:12px;color:rgba(255,255,255,0.5);');
      panel.textContent = '暂无干员数据';
      return panel;
    }

    var grid = document.createElement('div');
    grid.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:12px;');
    panel.appendChild(grid);

    var cards = [];
    for (var j = 0; j < list.length; j++) {
      var card = assets.buildCharCard(list[j].char, list[j].info);
      grid.appendChild(card);
      cards.push(card);
    }

    requestAnimationFrame(function () {
      for (var k = 0; k < cards.length; k++) {
        cards[k].style.opacity = '1';
      }
    });

    return panel;
  }

  function renderSkinPanel(skinInfoMap) {
    var panel = document.createElement('div');
    panel.setAttribute(
      'style',
      'padding:32px;text-align:center;font-size:13px;color:rgba(255,255,255,0.5);' +
        'border:1px dashed rgba(255,255,255,0.2);border-radius:8px;'
    );
    panel.textContent = '时装资产 · TODO（' + Object.keys(skinInfoMap || {}).length + ' 个皮肤）';
    return panel;
  }

  Tapp.pages['assets'] = {
    render: render
  };
})();
