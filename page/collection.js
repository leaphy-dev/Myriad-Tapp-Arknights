// ========================================
// Collection Page（干员资产 / 皮肤资产）
// ========================================

(function () {
  var PLAYER_DATA_KEY = 'arknights.player';

  var PROFESSIONS = ['pioneer', 'warrior', 'tank', 'sniper', 'caster', 'medic', 'support', 'special'];
  var RARITY_OPTIONS = [
    { key: '6', label: '6星', min: 5 },
    { key: '5', label: '5星', min: 4 },
    { key: '4', label: '4星', min: 3 },
    { key: '1-3', label: '1-3星', min: 0 }
  ];
  var SORT_OPTIONS = [
    { key: 'level', label: '角色等级' },
    { key: 'skill', label: '技能专精' },
    { key: 'gain', label: '获取时间' },
    { key: 'name', label: '角色名称' }
  ];

  function rarityCategory(rarity) {
    if (rarity >= 5) return '6';
    if (rarity >= 4) return '5';
    if (rarity >= 3) return '4';
    return '1-3';
  }

  function specSum(c) {
    var s = 0;
    if (c && Array.isArray(c.skills)) {
      for (var i = 0; i < c.skills.length; i++) s += c.skills[i].specializeLevel || 0;
    }
    return s;
  }

  function render(container) {
    var section = container.querySelector('[data-view="collection"]');
    if (!section) return;
    section.innerHTML = '';

    var wrap = section;

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
    var chars = (player && Array.isArray(player.chars)) ? player.chars.slice() : [];

    var filterState = { professions: [], rarities: [], sortBy: 'rarity' };

    var tabBar = document.createElement('div');
    tabBar.setAttribute('style', 'position:relative;display:flex;justify-content:center;gap:64px;margin-bottom:20px;');

    var tabChar = makeTabText('干员');
    var tabSkin = makeTabText('时装');
    tabBar.appendChild(tabChar);
    tabBar.appendChild(tabSkin);

    var indicator = document.createElement('div');
    indicator.setAttribute('style', 'position:absolute;bottom:-8px;left:0;width:0;transition:left 0.25s ease;pointer-events:none;');
    var arrow = document.createElement('div');
    arrow.setAttribute('style', 'width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-bottom:5px solid #fff;margin:0 auto;');
    var line = document.createElement('div');
    line.setAttribute('style', 'height:2px;background:#fff;');
    indicator.appendChild(arrow);
    indicator.appendChild(line);
    tabBar.appendChild(indicator);
    wrap.appendChild(tabBar);

    var charPanel = renderCharPanel(chars, charInfoMap, assets, filterState);
    var skinPanel = renderSkinPanel(skinInfoMap);
    wrap.appendChild(charPanel);
    wrap.appendChild(skinPanel);
    skinPanel.style.display = 'none';

    function positionIndicator(target) {
      indicator.style.left = target.offsetLeft + 'px';
      indicator.style.width = target.offsetWidth + 'px';
    }

    function setActiveTab(active) {
      if (active === 'char') {
        charPanel.style.display = 'block';
        skinPanel.style.display = 'none';
        tabChar.style.color = '#fff';
        tabSkin.style.color = 'rgba(255,255,255,0.5)';
        positionIndicator(tabChar);
      } else {
        charPanel.style.display = 'none';
        skinPanel.style.display = 'block';
        tabSkin.style.color = '#fff';
        tabChar.style.color = 'rgba(255,255,255,0.5)';
        positionIndicator(tabSkin);
      }
    }

    tabChar.addEventListener('click', function () { setActiveTab('char'); });
    tabSkin.addEventListener('click', function () { setActiveTab('skin'); });
    setActiveTab('char');

    var filterTool = buildFilterTool(assets, filterState, function () {
      var newPanel = renderCharPanel(chars, charInfoMap, assets, filterState);
      charPanel.replaceWith(newPanel);
      charPanel = newPanel;
      if (skinPanel.style.display !== 'none') newPanel.style.display = 'none';
    });
    wrap.insertBefore(filterTool, charPanel);
  }

  function makeTabText(label) {
    var span = document.createElement('span');
    span.textContent = label;
    span.setAttribute('style', 'cursor:pointer;color:#fff;font-size:15px;font-weight:600;user-select:none;');
    return span;
  }

  function buildFilterTool(assets, filterState, onChange) {
    var container = document.createElement('div');
    container.setAttribute('style', 'position:relative;margin-bottom:12px;z-index:50;');

    var toggle = document.createElement('div');
    toggle.setAttribute('style', 'cursor:pointer;color:#fff;font-size:14px;padding:6px 0;user-select:none;text-align:center;');
    toggle.textContent = '筛选 ▾';
    container.appendChild(toggle);

    var panel = document.createElement('div');
    panel.setAttribute(
      'style',
      'position:absolute;top:100%;left:0;width:100%;background:#1a1a1a;border:1px solid rgba(255,255,255,0.18);' +
        'padding:14px;box-sizing:border-box;opacity:0;transform:translateY(-8px);visibility:hidden;' +
        'transition:opacity 0.22s ease, transform 0.22s ease, visibility 0.22s;'
    );

    function sectionTitle(text) {
      var t = document.createElement('div');
      t.setAttribute('style', 'font-size:12px;color:#fff;margin-bottom:8px;text-align:center;');
      t.textContent = text;
      return t;
    }

    panel.appendChild(sectionTitle('职业'));
    var profRow = document.createElement('div');
    profRow.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:10px;margin-bottom:14px;justify-content:center;');
    for (var p = 0; p < PROFESSIONS.length; p++) {
      (function (key) {
        var icon = document.createElement('img');
        icon.src = assets.professionUrl(key);
        icon.alt = '';
        icon.setAttribute('style', 'width:44px;height:44px;cursor:pointer;padding:4px;box-sizing:border-box;opacity:0.4;');
        icon.addEventListener('click', function () {
          var i = filterState.professions.indexOf(key);
          var on = i === -1;
          if (on) filterState.professions.push(key); else filterState.professions.splice(i, 1);
          icon.style.opacity = on ? '1' : '0.4';
          onChange();
        });
        profRow.appendChild(icon);
      })(PROFESSIONS[p]);
    }
    panel.appendChild(profRow);

    panel.appendChild(sectionTitle('稀有度'));
    var rarityRow = document.createElement('div');
    rarityRow.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;justify-content:center;');
    for (var r = 0; r < RARITY_OPTIONS.length; r++) {
      (function (opt) {
        var chip = document.createElement('div');
        chip.textContent = opt.label;
        chip.setAttribute('style', 'padding:4px 14px;font-size:12px;color:#fff;cursor:pointer;border:1px solid rgba(255,255,255,0.35);user-select:none;opacity:0.5;');
        chip.addEventListener('click', function () {
          var i = filterState.rarities.indexOf(opt.key);
          var on = i === -1;
          if (on) filterState.rarities.push(opt.key); else filterState.rarities.splice(i, 1);
          chip.style.opacity = on ? '1' : '0.5';
          onChange();
        });
        rarityRow.appendChild(chip);
      })(RARITY_OPTIONS[r]);
    }
    panel.appendChild(rarityRow);

    panel.appendChild(sectionTitle('类型'));
    var sortRow = document.createElement('div');
    sortRow.setAttribute('style', 'display:flex;flex-wrap:wrap;gap:8px;justify-content:center;');
    var sortChips = [];
    for (var s = 0; s < SORT_OPTIONS.length; s++) {
      (function (opt) {
        var chip = document.createElement('div');
        chip.textContent = opt.label;
        chip.setAttribute('style', 'padding:4px 14px;font-size:12px;color:#fff;cursor:pointer;border:1px solid rgba(255,255,255,0.35);user-select:none;opacity:0.5;');
        chip.addEventListener('click', function () {
          filterState.sortBy = (filterState.sortBy === opt.key) ? 'rarity' : opt.key;
          refreshSort();
          onChange();
        });
        sortRow.appendChild(chip);
        sortChips.push(chip);
      })(SORT_OPTIONS[s]);
    }
    function refreshSort() {
      for (var c = 0; c < sortChips.length; c++) {
        sortChips[c].style.opacity = (SORT_OPTIONS[c].key === filterState.sortBy) ? '1' : '0.5';
      }
    }
    panel.appendChild(sortRow);

    container.appendChild(panel);

    var isOpen = false;
    toggle.addEventListener('click', function () {
      isOpen = !isOpen;
      if (isOpen) {
        panel.style.opacity = '1';
        panel.style.transform = 'translateY(0)';
        panel.style.visibility = 'visible';
      } else {
        panel.style.opacity = '0';
        panel.style.transform = 'translateY(-8px)';
        panel.style.visibility = 'hidden';
      }
      toggle.textContent = isOpen ? '筛选 ▴' : '筛选 ▾';
    });

    return container;
  }

  function renderCharPanel(chars, charInfoMap, assets, filterState) {
    var panel = document.createElement('div');

    var list = chars.slice();

    if (filterState) {
      if (filterState.professions.length) {
        list = list.filter(function (c) {
          var info = charInfoMap[c.charId];
          return info && filterState.professions.indexOf(String(info.profession).toLowerCase()) !== -1;
        });
      }
      if (filterState.rarities.length) {
        list = list.filter(function (c) {
          var info = charInfoMap[c.charId];
          var r = info ? (info.rarity || 0) : 0;
          return filterState.rarities.indexOf(rarityCategory(r)) !== -1;
        });
      }
    }

    sortChars(list, charInfoMap, filterState ? filterState.sortBy : 'rarity');

    if (!list.length) {
      panel.setAttribute('style', 'font-size:12px;color:rgba(255,255,255,0.5);');
      panel.textContent = '暂无干员数据';
      return panel;
    }

    var grid = document.createElement('div');
    grid.setAttribute('style', 'display:grid;grid-template-columns:repeat(auto-fill, var(--char-card-w));gap:14px;justify-content:center;');
    panel.appendChild(grid);

    var cards = [];
    for (var j = 0; j < list.length; j++) {
      var info = charInfoMap[list[j].charId];
      var card = assets.buildCharCard(list[j], info);
      grid.appendChild(card);
      cards.push(card);
    }

    requestAnimationFrame(function () {
      for (var k = 0; k < cards.length; k++) cards[k].style.opacity = '1';
    });

    return panel;
  }

  function sortChars(list, charInfoMap, sortBy) {
    if (sortBy === 'skill') {
      list.sort(function (a, b) { return specSum(b) - specSum(a); });
    } else if (sortBy === 'gain') {
      list.sort(function (a, b) { return (b.gainTime || 0) - (a.gainTime || 0); });
    } else if (sortBy === 'name') {
      list.sort(function (a, b) {
        var na = (charInfoMap[a.charId] && charInfoMap[a.charId].name) || a.charId;
        var nb = (charInfoMap[b.charId] && charInfoMap[b.charId].name) || b.charId;
        return na.localeCompare(nb);
      });
    } else if (sortBy === 'level') {
      list.sort(function (a, b) { return (b.level || 0) - (a.level || 0); });
    } else {
      list.sort(function (a, b) {
        var ra = (charInfoMap[a.charId] && charInfoMap[a.charId].rarity) || 0;
        var rb = (charInfoMap[b.charId] && charInfoMap[b.charId].rarity) || 0;
        if (ra !== rb) return rb - ra;
        if ((b.evolvePhase || 0) !== (a.evolvePhase || 0)) return (b.evolvePhase || 0) - (a.evolvePhase || 0);
        return (b.level || 0) - (a.level || 0);
      });
    }
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

  Tapp.pages['collection'] = {
    render: render
  };
})();
