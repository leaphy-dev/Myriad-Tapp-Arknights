// ========================================
// Assets
// ========================================

(function () {
  var _charInfoMap = null;
  var _eliteUrls = {};
  var _professionUrls = {};
  var _potentialUrls = {};
  var _loadPromise = null;
  var _repoBase = 'https://raw.githubusercontent.com/leaphy-dev/ArknightsGameResource/main';

  var PROFESSIONS = ['pioneer', 'warrior', 'tank', 'sniper', 'caster', 'medic', 'support', 'special'];

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

  function loadAssets() {
    if (_loadPromise) return _loadPromise;
    _loadPromise = (async function () {
      try {
        try {
          var base = await Tapp.settings.get('resourceBaseUrl');
          if (base && typeof base === 'string') {
            base = base.trim().replace(/\/+$/, '');
            if (base) _repoBase = base;
          }
        } catch (e) {}

        var jobs = [
          Tapp.assets.getUrl('assets/rank/elite0.png'),
          Tapp.assets.getUrl('assets/rank/elite1.png'),
          Tapp.assets.getUrl('assets/rank/elite2.png')
        ];
        for (var i = 0; i < PROFESSIONS.length; i++) {
          jobs.push(Tapp.assets.getUrl('assets/profession/' + PROFESSIONS[i] + '.png'));
        }
        for (var p = 0; p < 6; p++) {
          jobs.push(Tapp.assets.getUrl('assets/potential/potential_' + p + '.png'));
        }

        var results = await Promise.all(jobs);
        _eliteUrls[0] = results[0].url;
        _eliteUrls[1] = results[1].url;
        _eliteUrls[2] = results[2].url;
        var idx = 3;
        for (var j = 0; j < PROFESSIONS.length; j++) {
          _professionUrls[PROFESSIONS[j]] = results[idx + j].url;
        }
        idx += PROFESSIONS.length;
        for (var k = 0; k < 6; k++) {
          _potentialUrls[k] = results[idx + k].url;
        }
        return true;
      } catch (e) {
        _loadPromise = null;
        console.error('[Assets] load failed:', e);
        return false;
      }
    })();
    return _loadPromise;
  }

  function avatarUrl(charId) {
    return _repoBase + '/avatar/' + charId + '.png';
  }

  function skillUrl(skillId) {
    return _repoBase + '/skill/skill_icon_' + skillId + '.png';
  }

  function portraitUrl(charId, evolvePhase) {
    // TODO: 根据潜能识别皮肤，以后解析skin字段
    var suffix = evolvePhase === 2 ? '_2' : '_1';
    return _repoBase + '/portrait/' + charId + suffix + '.png';
  }

  function setCharInfoMap(map) {
    _charInfoMap = map || null;
  }

  function operatorName(charId) {
    var info = _charInfoMap && _charInfoMap[charId];
    return (info && info.name) || charId;
  }

  function buildOperatorAvatar(op) {
    var wrap = document.createElement('div');
    wrap.setAttribute(
      'style',
      'width:var(--assist-avatar);height:var(--assist-avatar);overflow:hidden;position:relative;'
    );

    var img = document.createElement('img');
    img.referrerPolicy = 'no-referrer';
    img.alt = '';
    img.setAttribute(
      'style',
      'width:var(--assist-avatar);height:var(--assist-avatar);object-fit:cover;display:block;' +
        'opacity:0;transition:opacity 0.25s ease;'
    );

    var spinner = document.createElement('div');
    spinner.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;'
    );
    var spinnerEl = document.createElement('div');
    spinnerEl.setAttribute('class', 'ark-spinner');
    spinnerEl.setAttribute('style', 'width:calc(var(--assist-avatar) * 0.3);height:calc(var(--assist-avatar) * 0.3);');
    spinner.appendChild(spinnerEl);

    img.onload = function () {
      img.style.opacity = '1';
      spinner.remove();
    };
    img.onerror = function () {
      spinner.remove();
    };

    wrap.appendChild(img);
    wrap.appendChild(spinner);

    var elite = op.evolvePhase || 0;
    var eliteUrl = _eliteUrls[elite];
    if (eliteUrl) {
      var eliteImg = document.createElement('img');
      eliteImg.src = eliteUrl;
      eliteImg.setAttribute(
        'style',
        'position:absolute;top:-2px;right:-2px;width:calc(var(--assist-avatar) * 0.32);' +
          'height:calc(var(--assist-avatar) * 0.32);pointer-events:none;'
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
    lvLabel.setAttribute('style', 'font-size:calc(var(--assist-avatar) * 0.1);color:#fff;opacity:0.85;letter-spacing:0.5px;');
    lvLabel.textContent = 'LV';
    var lvNum = document.createElement('span');
    lvNum.setAttribute(
      'style',
      'font-size:calc(var(--assist-avatar) * 0.18);font-weight:500;color:#fff;' +
        'text-shadow:0 0 2px #000,0 0 2px #000;'
    );
    lvNum.textContent = String(op.level || 0);
    lvBlock.appendChild(lvLabel);
    lvBlock.appendChild(lvNum);
    wrap.appendChild(lvBlock);

    img.src = avatarUrl(op.id);

    return wrap;
  }

  function buildAssistUnit(assistList) {
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
    row.setAttribute('style', 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;');

    for (var i = 0; i < list.length; i++) {
      var op = {
        id: list[i].charId,
        level: list[i].level,
        evolvePhase: list[i].evolvePhase,
        skillId: list[i].skillId
      };

      var unit = document.createElement('div');
      unit.setAttribute('style', 'display:flex;flex-direction:column;align-items:center;gap:3px;');

      var avatar = buildOperatorAvatar(op);
      unit.appendChild(avatar);

      var name = document.createElement('div');
      name.setAttribute(
        'style',
        'font-size:10px;color:#e0e0e0;max-width:calc(var(--assist-avatar) + 8px);' +
          'overflow:hidden;text-overflow:ellipsis;white-space:nowrap;'
      );
      name.textContent = operatorName(op.id);
      unit.appendChild(name);

      row.appendChild(unit);
    }

    wrap.appendChild(row);
    return wrap;
  }

  function buildMyChars(chars, charInfoMap) {
    var list = Array.isArray(chars) ? chars.slice() : [];
    list.sort(function (a, b) { return (b.level || 0) - (a.level || 0); });
    list = list.slice(0, 10);

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
    zh.textContent = '我的干员';

    var en = document.createElement('span');
    en.setAttribute('style', 'font-size:9px;letter-spacing:0.5px;color:rgba(255,255,255,0.5);');
    en.textContent = '// MY OPERATORS';

    header.appendChild(zh);
    header.appendChild(en);
    wrap.appendChild(header);

    if (!list.length) {
      var empty = document.createElement('div');
      empty.setAttribute('style', 'font-size:11px;color:rgba(255,255,255,0.5);');
      empty.textContent = '暂无干员';
      wrap.appendChild(empty);
      return wrap;
    }

    var grid = document.createElement('div');
    grid.setAttribute('class', 'ark-my-chars-scroll');
    grid.setAttribute(
      'style',
      'display:flex;gap:12px;overflow-x:auto;overflow-y:hidden;padding-bottom:6px;'
    );
    grid.addEventListener('scroll', function () {
      grid.classList.add('scrolling');
      if (grid._scrollTimer) clearTimeout(grid._scrollTimer);
      grid._scrollTimer = setTimeout(function () {
        grid.classList.remove('scrolling');
      }, 400);
    });
    grid.addEventListener('wheel', function (e) {
      if (grid.scrollWidth > grid.clientWidth) {
        grid.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

    for (var i = 0; i < list.length; i++) {
      var info = charInfoMap && charInfoMap[list[i].charId];
      grid.appendChild(buildCharCard(list[i], info));
    }

    wrap.appendChild(grid);
    return wrap;
  }

  function buildCharCard(char, info) {
    var card = document.createElement('div');
    card.setAttribute(
      'style',
      'position:relative;width:var(--char-card-w);height:var(--char-card-h);overflow:hidden;' +
        'background:#222;flex-shrink:0;'
    );

    var bg = document.createElement('img');
    bg.referrerPolicy = 'no-referrer';
    bg.alt = '';
    bg.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:100%;height:100%;object-fit:cover;' +
        'opacity:0;transition:opacity 0.3s ease;'
    );

    var spinner = document.createElement('div');
    spinner.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;'
    );
    var spinnerEl = document.createElement('div');
    spinnerEl.setAttribute('class', 'ark-spinner');
    spinnerEl.setAttribute('style', 'width:calc(var(--char-card-w) * 0.16);height:calc(var(--char-card-w) * 0.16);');
    spinner.appendChild(spinnerEl);

    bg.onload = function () {
      bg.style.opacity = '1';
      spinner.remove();
    };
    bg.onerror = function () {
      spinner.remove();
    };

    card.appendChild(bg);
    card.appendChild(spinner);

    var profKey = info && info.profession ? info.profession.toLowerCase() : '';
    var profUrl = _professionUrls[profKey];
    if (profUrl) {
      var profImg = document.createElement('img');
      profImg.src = profUrl;
      profImg.setAttribute(
        'style',
        'position:absolute;top:calc(var(--char-card-w) * 0.06);left:calc(var(--char-card-w) * 0.06);' +
          'width:calc(var(--char-card-w) * 0.2);height:calc(var(--char-card-w) * 0.2);pointer-events:none;'
      );
      card.appendChild(profImg);
    }

    var leftBottom = document.createElement('div');
    leftBottom.setAttribute(
      'style',
      'position:absolute;left:calc(var(--char-card-w) * 0.06);bottom:calc(var(--char-card-w) * 0.2);' +
        'display:flex;flex-direction:column;align-items:center;gap:calc(var(--char-card-w) * 0.02);'
    );

    var rankUrl = _eliteUrls[char.evolvePhase || 0];
    if (rankUrl) {
      var rankImg = document.createElement('img');
      rankImg.src = rankUrl;
      rankImg.setAttribute('style', 'width:calc(var(--char-card-w) * 0.14);height:calc(var(--char-card-w) * 0.14);pointer-events:none;');
      leftBottom.appendChild(rankImg);
    }

    var lvCircle = document.createElement('div');
    lvCircle.setAttribute(
      'style',
      'width:calc(var(--char-card-w) * 0.2);height:calc(var(--char-card-w) * 0.2);' +
        'border:1px solid #ffd700;border-radius:50%;' +
        'background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;' +
        'font-size:calc(var(--char-card-w) * 0.09);font-weight:600;color:#fff;'
    );
    lvCircle.textContent = String(char.level || 0);
    leftBottom.appendChild(lvCircle);

    card.appendChild(leftBottom);

    var rightBottom = document.createElement('div');
    rightBottom.setAttribute(
      'style',
      'position:absolute;right:calc(var(--char-card-w) * 0.06);bottom:calc(var(--char-card-w) * 0.2);' +
        'display:flex;flex-direction:column;align-items:center;gap:calc(var(--char-card-w) * 0.02);'
    );

    var potentialUrl = _potentialUrls[char.potentialRank || 0];
    if (potentialUrl) {
      var potImg = document.createElement('img');
      potImg.src = potentialUrl;
      potImg.setAttribute('style', 'width:calc(var(--char-card-w) * 0.12);height:calc(var(--char-card-w) * 0.12);pointer-events:none;');
      rightBottom.appendChild(potImg);
    }

    if (char.defaultSkillId) {
      var skillImg = document.createElement('img');
      skillImg.referrerPolicy = 'no-referrer';
      skillImg.alt = '';
      skillImg.onerror = function () {
        skillImg.remove();
      };
      skillImg.setAttribute('style', 'width:calc(var(--char-card-w) * 0.18);height:calc(var(--char-card-w) * 0.18);pointer-events:none;object-fit:contain;');
      skillImg.src = skillUrl(char.defaultSkillId);
      rightBottom.appendChild(skillImg);
    }

    card.appendChild(rightBottom);

    var nameBar = document.createElement('div');
    nameBar.setAttribute(
      'style',
      'position:absolute;left:0;right:0;bottom:0;' +
        'padding:calc(var(--char-card-w) * 0.04) calc(var(--char-card-w) * 0.03);background:rgba(0,0,0,0.55);'
    );
    var name = document.createElement('span');
    name.setAttribute(
      'style',
      'font-size:calc(var(--char-card-w) * 0.09);color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;display:block;text-align:center;'
    );
    name.textContent = operatorName(char.charId);
    nameBar.appendChild(name);
    card.appendChild(nameBar);

    bg.src = portraitUrl(char.charId, char.evolvePhase || 0);

    return card;
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
    var furnitureTotal = player && player.building && player.building.furniture && player.building.furniture.total;

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
      ['家具', furnitureTotal !== undefined ? String(furnitureTotal) : '-'],
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
      if (medal.total !== undefined) return String(medal.total);
      var keys = Object.keys(medal);
      if (keys.length) return String(keys.length);
    }
    return String(medal);
  }

  function buildGameDataCard(player) {
    var wrap = document.createElement('div');
    wrap.setAttribute('class', 'ark-game-data');
    wrap.setAttribute(
      'style',
      'margin-top:12px;padding:12px;background:#313131;border:1px solid rgba(128,128,128,0);' +
        'width:100%;box-sizing:border-box;min-width:0;'
    );

    wrap.addEventListener('scroll', function () {
      wrap.classList.add('scrolling');
      if (wrap._scrollTimer) clearTimeout(wrap._scrollTimer);
      wrap._scrollTimer = setTimeout(function () {
        wrap.classList.remove('scrolling');
      }, 400);
    });
    wrap.addEventListener('wheel', function (e) {
      var down = wrap.scrollTop + wrap.clientHeight < wrap.scrollHeight;
      var up = wrap.scrollTop > 0;
      if ((e.deltaY > 0 && down) || (e.deltaY < 0 && up)) {
        wrap.scrollTop += e.deltaY;
        e.preventDefault();
      }
    }, { passive: false });

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
      ['tower', '保全派驻']
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

  function createSpinnerBox() {
    var holder = document.createElement('div');
    holder.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;'
    );
    var spinner = document.createElement('div');
    spinner.setAttribute('class', 'ark-spinner');
    holder.appendChild(spinner);
    return holder;
  }

  function buildModeSubCard(picUrl, name, lines) {
    var box = document.createElement('div');
    box.setAttribute(
      'style',
      'position:relative;overflow:hidden;border-radius:8px;margin-bottom:8px;' +
        'width:100%;height:72px;background:#222;box-sizing:border-box;'
    );

    var bg = document.createElement('div');
    bg.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:100%;height:100%;' +
        'background-size:cover;background-position:left center;opacity:0;' +
        '-webkit-mask-image:linear-gradient(to right, #000 0%, #000 40%, rgba(0,0,0,0.5) 70%, transparent 100%);' +
        'mask-image:linear-gradient(to right, #000 0%, #000 40%, rgba(0,0,0,0.5) 70%, transparent 100%);' +
        'transition:opacity 0.25s ease;'
    );
    box.appendChild(bg);

    var spinner = createSpinnerBox();
    box.appendChild(spinner);

    var overlay = document.createElement('div');
    overlay.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:100%;height:100%;display:flex;flex-direction:column;justify-content:center;' +
        'align-items:flex-end;padding:0 12px;text-align:right;box-sizing:border-box;'
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

    if (picUrl) {
      var img = new Image();
      img.onload = function () {
        bg.style.backgroundImage = 'url("' + picUrl + '")';
        bg.style.opacity = '1';
        spinner.remove();
      };
      img.onerror = function () {
        spinner.remove();
      };
      img.src = picUrl;
    } else {
      spinner.remove();
    }

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

  window.__arkAssets = {
    loadAssets: loadAssets,
    setCharInfoMap: setCharInfoMap,
    buildOperatorAvatar: buildOperatorAvatar,
    buildAssistUnit: buildAssistUnit,
    buildMyChars: buildMyChars,
    buildPlayerInfoCard: buildPlayerInfoCard,
    buildGameDataCard: buildGameDataCard,
    operatorName: operatorName
  };
})();
