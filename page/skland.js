// ========================================
// Skland 页面模块（森空岛 API 封装）
// 每个导出函数对应一个 HTTP 请求
// ========================================

(function () {
  var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0';

  async function getCreds(credToken) {
    var saved = '';
    if (credToken && typeof credToken === 'string' && credToken.indexOf(',') !== -1) {
      saved = credToken;
    } else {
      try {
        var v = await Tapp.settings.get('sklandToken');
        if (v && typeof v === 'string') saved = v;
      } catch (e) {}
    }
    var parts = saved.split(',');
    if (parts.length < 2) {
      throw new Error('skland token not configured');
    }
    return { cred: parts[0].trim(), token: parts[1].trim() };
  }

  function sign(path, params, timestamp, token) {
    var headers = {
      platform: '3',
      timestamp: timestamp,
      dId: UA,
      vName: '1.2.0'
    };
    var text = path + (params || '') + timestamp + JSON.stringify(headers);
    var hmacHex = window.__arkCrypto.hmacSha256(token, text);
    return window.__arkCrypto.md5(hmacHex);
  }

  function buildHeaders(path, params, cred, token) {
    var timestamp = String(Math.floor((new Date().getTime() - 300) / 1000));
    var s = sign(path, params, timestamp, token);
    return {
      platform: '3',
      timestamp: timestamp,
      dId: UA,
      vName: '1.2.0',
      cred: cred,
      sign: s
    };
  }

  async function getPlayerBinding(credToken) {
    var c = await getCreds(credToken);
    var h = buildHeaders('/api/v1/game/player/binding', '', c.cred, c.token);
    return await Tapp.api('sklandPlayerBinding', {
      platform: h.platform,
      timestamp: h.timestamp,
      dId: h.dId,
      vName: h.vName,
      cred: h.cred,
      sign: h.sign
    });
  }

  async function getPlayerInfo(uid, credToken) {
    var query = 'uid=' + uid;
    var c = await getCreds(credToken);
    var h = buildHeaders('/api/v1/game/player/info', query, c.cred, c.token);
    return await Tapp.api('sklandPlayerInfo', {
      uid: uid,
      platform: h.platform,
      timestamp: h.timestamp,
      dId: h.dId,
      vName: h.vName,
      cred: h.cred,
      sign: h.sign
    });
  }

  async function getCultivate(uid, credToken) {
    var query = 'uid=' + uid;
    var c = await getCreds(credToken);
    var h = buildHeaders('/api/v1/game/cultivate/player', query, c.cred, c.token);
    return await Tapp.api('sklandCultivate', {
      uid: uid,
      platform: h.platform,
      timestamp: h.timestamp,
      dId: h.dId,
      vName: h.vName,
      cred: h.cred,
      sign: h.sign
    });
  }

  window.__arkSkland = {
    getPlayerBinding: getPlayerBinding,
    getPlayerInfo: getPlayerInfo,
    getCultivate: getCultivate,
  };
})();
