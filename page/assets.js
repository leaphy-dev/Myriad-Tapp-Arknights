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
      el.setAttribute('style', 'width:100%;height:100%;background:#000;');
      return el;
    }
    el.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:' + cell + 'px;height:' + cell + 'px;' +
        'background-color:#000;' +
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
    size = size || 48;
    var wrap = document.createElement('div');
    wrap.setAttribute(
      'style',
      'width:' + size + 'px;height:' + size + 'px;overflow:hidden;' +
        'position:relative;background:#000;' +
        'border:1px solid #fff;box-sizing:border-box;'
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
        'align-items:flex-start;line-height:1;pointer-events:none;'
    );
    var lvLabel = document.createElement('span');
    lvLabel.setAttribute('style', 'font-size:' + Math.max(6, Math.round(size * 0.12)) + 'px;color:#fff;opacity:0.85;letter-spacing:0.5px;');
    lvLabel.textContent = 'LV';
    var lvNum = document.createElement('span');
    lvNum.setAttribute(
      'style',
      'font-size:' + Math.round(size * 0.24) + 'px;font-weight:700;color:#fff;' +
        'text-shadow:0 0 2px #000,0 0 2px #000;'
    );
    lvNum.textContent = String(op.level || 0);
    lvBlock.appendChild(lvLabel);
    lvBlock.appendChild(lvNum);
    wrap.appendChild(lvBlock);

    return wrap;
  }

  function buildOperatorCard(op, size) {
    size = size || 48;
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

  window.__arkAssets = {
    loadAssets: loadAssets,
    buildOperatorAvatar: buildOperatorAvatar,
    buildOperatorCard: buildOperatorCard,
    operatorName: operatorName
  };
})();
