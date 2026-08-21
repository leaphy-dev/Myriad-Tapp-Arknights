// ========================================
// Assets
// ========================================

(function () {
  var _avatarUrl = null;
  var avatarMeta = null;
  var characterTable = null;
  var _eliteUrls = {};

  function decodeBase64(b64) {
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(b64, 'base64').toString('utf8').replace(/^\uFEFF/, '');
    }
    if (typeof atob === 'function') {
      var bin = atob(b64);
      var bytes = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return new TextDecoder('utf-8').decode(bytes).replace(/^\uFEFF/, '');
    }
    throw new Error('no base64 decoder');
  }

  async function loadAssets() {
    try {
      if (!_avatarUrl) {
        var avatar = await Tapp.assets.getUrl('assets/avatar.webp');
        _avatarUrl = avatar.url;
      }
      if (!avatarMeta) {
        var am = await Tapp.assets.get('assets/avatar_map.json');
        avatarMeta = JSON.parse(decodeBase64(am.base64));
      }
      if (!characterTable) {
        var ct = await Tapp.assets.get('assets/character_table.json');
        characterTable = JSON.parse(decodeBase64(ct.base64));
      }
      for (var i = 0; i < 3; i++) {
        if (!_eliteUrls[i]) {
          var r = await Tapp.assets.getUrl('assets/rank/elite' + i + '.png');
          _eliteUrls[i] = r.url;
        }
      }
      return true;
    } catch (e) {
      console.error('[Assets] load failed:', e);
      return false;
    }
  }

  function buildSprite(meta, url, cell, size) {
    var el = document.createElement('div');
    if (!meta || !url) {
      el.setAttribute('style', 'width:100%;height:100%;background:transparent;');
      return el;
    }
    el.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:' + cell + 'px;height:' + cell + 'px;' +
        'background-color:transparent;' +
        'background-image:url("' + url + '");' +
        'background-position:' + meta.x + 'px ' + meta.y + 'px;' +
        'transform:scale(' + (size / cell) + ');transform-origin:0 0;'
    );
    return el;
  }

  function operatorName(charId) {
    var t = characterTable || {};
    var op = t[charId] || {};
    return op.name || charId;
  }

  function buildOperatorAvatar(op, size) {
    size = size ||64;
    var wrap = document.createElement('div');
    wrap.setAttribute(
      'style',
      'width:' + size + 'px;height:' + size + 'px;overflow:hidden;' +
        'position:relative;'
    );
    wrap.appendChild(buildSprite(avatarMeta && avatarMeta[op.id], _avatarUrl, 180, size));

    var elite = op.evolvePhase || 0;
    var eliteUrl = _eliteUrls[elite];
    if (eliteUrl) {
      var eliteImg = document.createElement('img');
      eliteImg.src = eliteUrl;
      eliteImg.setAttribute(
        'style',
        'position:absolute;top:-2px;right:-2px;width:' + Math.round(size * 0.32) + 'px;' +
          'height:' + Math.round(size * 0.32) + 'px;pointer-events:none;'
      );
      wrap.appendChild(eliteImg);
    }

    var lvBlock = document.createElement('div');
    lvBlock.setAttribute(
      'style',
      'position:absolute;left:2px;top:2px;display:flex;flex-direction:column;' +
        'align-items:center;line-height:1;pointer-events:none;'
    );
    var lvLabel = document.createElement('span');
    lvLabel.setAttribute('style', 'font-size:' + Math.max(2, Math.round(size * 0.1)) + 'px;color:#fff;opacity:0.85;letter-spacing:0.5px;');
    lvLabel.textContent = 'LV';
    var lvNum = document.createElement('span');
    lvNum.setAttribute(
      'style',
      'font-size:' + Math.round(size * 0.18) + 'px;font-weight:500;color:#fff;' +
        'text-shadow:0 0 2px #000,0 0 2px #000;'
    );
    lvNum.textContent = String(op.level || 0);
    lvBlock.appendChild(lvLabel);
    lvBlock.appendChild(lvNum);
    wrap.appendChild(lvBlock);

    return wrap;
  }

  function buildOperatorCard(op, size) {
    size = size || 64;
    var card = document.createElement('div');
    card.setAttribute(
      'style',
      'display:flex;flex-direction:column;align-items:center;gap:2px;padding:4px;' +
        'background:transparent;'
    );

    var avatar = buildOperatorAvatar(op, size);
    card.appendChild(avatar);

    var info = document.createElement('div');
    info.setAttribute(
      'style',
      'text-align:center;color:#e0e0e0;font-size:10px;max-width:' + (size + 4) + 'px;' +
        'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;display:none;'
    );
    info.textContent = operatorName(op.id);
    card.appendChild(info);

    card.addEventListener('mouseenter', function () {
      info.style.display = 'block';
    });
    card.addEventListener('mouseleave', function () {
      info.style.display = 'none';
    });

    return card;
  }

  function buildAssistUnit(assistList, size) {
    size = size || 64;
    var list = Array.isArray(assistList) ? assistList.slice(0, 3) : [];

    var wrap = document.createElement('div');
    wrap.setAttribute(
      'style',
      'margin-top:12px;padding:12px;background:#313131;border:1px solid rgba(128, 128, 128, 0);' +
        'width:100%;box-sizing:border-box;min-width:0;'
    );

    var header = document.createElement('div');
    header.setAttribute('style', 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;');

    var zh = document.createElement('span');
    zh.setAttribute('style', 'font-size:12px;font-weight:600;color:#f5f5f5;');
    zh.textContent = '助战干员';

    var en = document.createElement('span');
    en.setAttribute('style', 'font-size:9px;letter-spacing:0.5px;color:rgba(255,255,255,0.5);');
    en.textContent = '// SUPPORT UNITS';

    header.appendChild(zh);
    header.appendChild(en);
    wrap.appendChild(header);

    if (!list.length) {
      var empty = document.createElement('div');
      empty.setAttribute('style', 'font-size:11px;color:rgba(255,255,255,0.5);');
      empty.textContent = '暂无助战';
      wrap.appendChild(empty);
      return wrap;
    }

    var row = document.createElement('div');
    row.setAttribute('style', 'display:flex;gap:8px;flex-wrap:wrap;');

    for (var i = 0; i < list.length; i++) {
      var op = {
        id: list[i].charId,
        level: list[i].level,
        evolvePhase: list[i].evolvePhase
      };

      var unit = document.createElement('div');
      unit.setAttribute('style', 'display:flex;flex-direction:column;align-items:center;gap:3px;');

      var avatar = buildOperatorAvatar(op, size);
      unit.appendChild(avatar);

      var name = document.createElement('div');
      name.setAttribute(
        'style',
        'font-size:10px;color:#e0e0e0;max-width:' + (size + 8) + 'px;' +
          'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
      );
      name.textContent = operatorName(op.id);
      unit.appendChild(name);

      row.appendChild(unit);
    }

    wrap.appendChild(row);
    return wrap;
  }

  function countUniqueChars(player) {
    var chars = player && Array.isArray(player.chars) ? player.chars : [];
    var seen = {};
    var count = 0;
    for (var i = 0; i < chars.length; i++) {
      var id = chars[i] && (chars[i].charId || chars[i].id);
      if (id && !seen[id]) {
        seen[id] = true;
        count++;
      }
    }
    return count || null;
  }

  function buildPlayerInfoCard(player) {
    var status = player && player.status;
    var medal = player && player.medal;
    var charCount = countUniqueChars(player);

    var wrap = document.createElement('div');
    wrap.setAttribute(
      'style',
      'display:flex;gap:8px;margin-top:12px;padding:12px;background:#313131;' +
        'border:1px solid rgba(128,128,128,0.2);width:100%;box-sizing:border-box;min-width:0;'
    );

    var rows = [
      ['作战进度', status && status.mainStageProgress ? status.mainStageProgress : '-'],
      ['干员', charCount != null ? String(charCount) : (status && status.charCnt !== undefined ? String(status.charCnt) : '-')],
      ['时装', status && status.skinCnt !== undefined ? String(status.skinCnt) : '-'],
      ['家具', status && status.furnitureCnt !== undefined ? String(status.furnitureCnt) : '-'],
      ['蚀刻章', medalCount(medal)]
    ];

    for (var i = 0; i < rows.length; i++) {
      var cell = document.createElement('div');
      cell.setAttribute('style', 'flex:1;min-width:0;text-align:center;');
      var lab = document.createElement('div');
      lab.setAttribute('style', 'font-size:9px;color:rgba(255,255,255,0.5);white-space:nowrap;');
      lab.textContent = rows[i][0];
      var val = document.createElement('div');
      val.setAttribute(
        'style',
        'font-size:12px;font-weight:600;color:#f5f5f5;margin-top:2px;' +
          'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
      );
      val.textContent = rows[i][1];
      cell.appendChild(lab);
      cell.appendChild(val);
      wrap.appendChild(cell);
    }

    return wrap;
  }

  function medalCount(medal) {
    if (!medal) return '-';
    if (typeof medal === 'object') {
      if (medal.finishedMedalCount !== undefined) return String(medal.finishedMedalCount);
      if (medal.count !== undefined) return String(medal.count);
      var keys = Object.keys(medal);
      if (keys.length) return String(keys.length);
    }
    return String(medal);
  }

  function buildGameDataCard(player) {
    var wrap = document.createElement('div');
    wrap.setAttribute(
      'style',
      'margin-top:12px;padding:12px;background:#313131;border:1px solid rgba(128,128,128,0);' +
        'width:100%;box-sizing:border-box;min-width:0;'
    );

    var header = document.createElement('div');
    header.setAttribute('style', 'display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px;');

    var zh = document.createElement('span');
    zh.setAttribute('style', 'font-size:12px;font-weight:600;color:#f5f5f5;');
    zh.textContent = '游戏数据';

    var en = document.createElement('span');
    en.setAttribute('style', 'font-size:9px;letter-spacing:0.5px;color:rgba(255,255,255,0.5);');
    en.textContent = '// GAME DATA';

    header.appendChild(zh);
    header.appendChild(en);
    wrap.appendChild(header);

    var tabs = [
      ['sidestory', '活动剧情'],
      ['rogue', '集成战略'],
      ['campaign', '剿灭'],
      ['tower', '保全派驻'],
      ['sandbox', '生息演算']
    ];

    var tabBar = document.createElement('div');
    tabBar.setAttribute(
      'style',
      'display:flex;gap:6px;overflow-x:auto;padding-bottom:8px;margin-bottom:10px;'
    );

    var contentBox = document.createElement('div');
    contentBox.setAttribute('data-game-content', '1');
    contentBox.setAttribute('style', 'min-width:0;overflow:hidden;');
    wrap.appendChild(tabBar);
    wrap.appendChild(contentBox);

    for (var i = 0; i < tabs.length; i++) {
      (function (key, label) {
        var tab = document.createElement('button');
        tab.type = 'button';
        tab.textContent = label;
        tab.setAttribute(
          'style',
          'flex-shrink:0;padding:5px 12px;font-size:11px;color:#e0e0e0;background:rgba(255,255,255,0.06);' +
            'border:1px solid rgba(255,255,255,0.12);border-radius:6px;cursor:pointer;'
        );
        tab.addEventListener('click', function () {
          contentBox.innerHTML = '';
          renderGameMode(contentBox, key, player);
        });
        tabBar.appendChild(tab);
      })(tabs[i][0], tabs[i][1]);
    }

    // 默认显示第一个
    renderGameMode(contentBox, 'sidestory', player);

    return wrap;
  }

  function renderGameMode(contentBox, key, player) {
    if (key === 'sidestory') renderActivity(contentBox, player);
    else if (key === 'rogue') renderRogue(contentBox, player);
    else if (key === 'campaign') renderCampaign(contentBox, player);
    else if (key === 'tower') renderTower(contentBox, player);
    else if (key === 'sandbox') renderSandbox(contentBox, player);
  }

  function simpleRow(parent, label, value) {
    var row = document.createElement('div');
    row.setAttribute('style', 'display:flex;justify-content:space-between;gap:8px;padding:4px 0;');
    var l = document.createElement('span');
    l.setAttribute('style', 'font-size:11px;color:rgba(255,255,255,0.5);');
    l.textContent = label;
    var v = document.createElement('span');
    v.setAttribute('style', 'font-size:11px;color:#e0e0e0;');
    v.textContent = value;
    row.appendChild(l);
    row.appendChild(v);
    parent.appendChild(row);
  }

  function buildModeSubCard(picUrl, name, lines) {
    var box = document.createElement('div');
    box.setAttribute(
      'style',
      'position:relative;overflow:hidden;border-radius:8px;margin-bottom:8px;' +
        'height:72px;background:#222;box-sizing:border-box;'
    );

    if (picUrl) {
      var bg = document.createElement('div');
      bg.setAttribute(
        'style',
        'position:absolute;inset:0;background-image:url("' + picUrl + '");' +
          'background-size:cover;background-position:left center;' +
          '-webkit-mask-image:linear-gradient(to right, #000 0%, #000 40%, rgba(0,0,0,0.5) 70%, transparent 100%);' +
          'mask-image:linear-gradient(to right, #000 0%, #000 40%, rgba(0,0,0,0.5) 70%, transparent 100%);'
      );
      box.appendChild(bg);
    }

    var overlay = document.createElement('div');
    overlay.setAttribute(
      'style',
      'position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;' +
        'align-items:flex-end;padding:0 12px;text-align:right;'
    );

    var title = document.createElement('div');
    title.setAttribute('style', 'font-size:12px;font-weight:600;color:#fff;text-shadow:0 1px 2px #000;');
    title.textContent = name;
    overlay.appendChild(title);

    if (lines) {
      for (var i = 0; i < lines.length; i++) {
        var line = document.createElement('div');
        line.setAttribute('style', 'font-size:10px;color:#fff;text-shadow:0 1px 2px #000;margin-top:2px;');
        line.textContent = lines[i];
        overlay.appendChild(line);
      }
    }

    box.appendChild(overlay);
    return box;
  }

  function renderActivity(contentBox, player) {
    var list = player && Array.isArray(player.activity) ? player.activity : [];
    if (!list.length) {
      contentBox.textContent = '暂无活动';
      return;
    }
    var shown = 0;
    for (var i = 0; i < list.length; i++) {
      var act = list[i];
      var info = player.activityInfoMap && player.activityInfoMap[act.actId];
      var name = info && info.name ? info.name : (act.actId || '活动');
      var picUrl = info && info.picUrl;
      if (!picUrl) continue;

      var total = 0, cleared = 0;
      if (Array.isArray(act.zones)) {
        for (var z = 0; z < act.zones.length; z++) {
          total += act.zones[z].totalStage || 0;
          cleared += act.zones[z].clearedStage || 0;
        }
      }
      var lines = [total ? (cleared + '/' + total) : '--'];
      contentBox.appendChild(buildModeSubCard(picUrl, name, lines));
      shown++;
    }
    if (!shown) contentBox.textContent = '暂无活动';
  }

  function renderRogue(contentBox, player) {
    var records = player && player.rogue && Array.isArray(player.rogue.records) ? player.rogue.records : [];
    if (!records.length) {
      contentBox.textContent = '暂无集成战略';
      return;
    }
    var shown = 0;
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var info = player.rogueInfoMap && player.rogueInfoMap[r.rogueId];
      var name = info && info.name ? info.name : (r.rogueId || '主题');
      var picUrl = info && info.picUrl;
      if (!picUrl) continue;
      var lines = [
        '通关 ' + (r.clearTime || 0),
        '等级 ' + (r.bpLevel || 0),
        r.medal ? ('徽章 ' + (r.medal.current || 0) + '/' + (r.medal.total || 0)) : ''
      ];
      contentBox.appendChild(buildModeSubCard(picUrl, name, lines));
      shown++;
    }
    if (!shown) contentBox.textContent = '暂无集成战略';
  }

  function renderCampaign(contentBox, player) {
    var records = player && player.campaign && Array.isArray(player.campaign.records) ? player.campaign.records : [];
    if (!records.length) { contentBox.textContent = '暂无剿灭'; return; }
    var shown = 0;
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var info = player.campaignInfoMap && player.campaignInfoMap[r.campaignId];
      var picUrl = info && info.picUrl;
      if (!picUrl) continue;
      var name = info && info.name ? info.name : (r.campaignId || '剿灭');
      var lines = ['最大杀敌 ' + (r.maxKills || 0)];
      contentBox.appendChild(buildModeSubCard(picUrl, name, lines));
      shown++;
    }
    if (!shown) contentBox.textContent = '暂无剿灭';
  }

  function renderTower(contentBox, player) {
    var records = player && player.tower && Array.isArray(player.tower.records) ? player.tower.records : [];
    if (!records.length) { contentBox.textContent = '暂无保全派驻'; return; }
    var shown = 0;
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      var info = player.towerInfoMap && player.towerInfoMap[r.towerId];
      var picUrl = info && info.picUrl;
      if (!picUrl) continue;
      var name = info && info.name ? info.name : (r.towerId || ('层' + (i + 1)));
      var lines = ['最高 ' + (r.best || 0)];
      contentBox.appendChild(buildModeSubCard(picUrl, name, lines));
      shown++;
    }
    if (!shown) contentBox.textContent = '暂无保全派驻';
  }

  function renderSandbox(contentBox, player) {
    var list = player && Array.isArray(player.sandbox) ? player.sandbox : [];
    if (!list.length) { contentBox.textContent = '暂无生息演算'; return; }
    var shown = 0;
    for (var i = 0; i < list.length; i++) {
      var s = list[i];
      if (!s.picUrl) continue;
      var lines = ['第 ' + (s.maxDay || 0) + ' 天'];
      if (s.mainQuest !== undefined) lines.push('主线 ' + s.mainQuest);
      contentBox.appendChild(buildModeSubCard(s.picUrl, s.name || '生息演算', lines));
      shown++;
    }
    if (!shown) contentBox.textContent = '暂无生息演算';
  }

  window.__arkAssets = {
    loadAssets: loadAssets,
    buildOperatorAvatar: buildOperatorAvatar,
    buildOperatorCard: buildOperatorCard,
    buildAssistUnit: buildAssistUnit,
    buildPlayerInfoCard: buildPlayerInfoCard,
    buildGameDataCard: buildGameDataCard,
    operatorName: operatorName
  };
})();
