/// <reference path="./types/tapp-sdk.d.ts" />

// ========================================
// Core / 共享层（Widget、Page、Headless 三模式均加载）
// ========================================

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

// ========================================
// 玩家数据计算（纯数据，无 DOM 依赖，Page / Widget 共用）
// ========================================

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

function countMedals(medal) {
  if (!medal) return '-';
  if (typeof medal === 'object') {
    if (medal.total !== undefined) return String(medal.total);
    var keys = Object.keys(medal);
    if (keys.length) return String(keys.length);
  }
  return String(medal);
}

// 从存储的玩家数据（{ player, nickName, ... }）生成概要，供主页与小组件共用
function getPlayerSummary(data) {
  var player = (data && data.player) || {};
  var status = player.status || {};
  var name = status.name || (data && data.nickName) || '';
  var avatar = (status.avatar && status.avatar.url) || '';
  var level = status.level !== undefined ? String(status.level) : '';
  var charCount = countUniqueChars(player);
  var operators = charCount != null
    ? String(charCount)
    : (status.charCnt !== undefined ? String(status.charCnt) : '-');
  var furniture = player.building && player.building.furniture && player.building.furniture.total;
  var progress = status.mainStageProgress;
  var progressVal = progress
    ? (typeof progress === 'string' ? progress.replace(/^main_/i, '') : progress)
    : '-';

  return {
    name: name,
    avatar: avatar,
    level: level,
    registerTs: status.registerTs,
    // 每项 [i18n key, value]；标签文本由调用方翻译
    items: [
      ['assets.progress', progressVal],
      ['assets.operators', operators],
      ['assets.skins', status.skinCnt !== undefined ? String(status.skinCnt) : '-'],
      ['assets.furniture', furniture !== undefined ? String(furniture) : '-'],
      ['assets.medals', countMedals(player.medal)]
    ]
  };
}

// ========================================
// 资源仓库与助战干员（供小组件等复用）
// ========================================

var _repoBaseCache = '';

async function getRepoBase() {
  if (_repoBaseCache) return _repoBaseCache;
  var base = 'https://raw.githubusercontent.com/leaphy-dev/ArknightsGameResource/main';
  try {
    var v = await Tapp.settings.get('resourceBaseUrl');
    if (v && typeof v === 'string') {
      v = v.trim().replace(/\/+$/, '');
      if (v) base = v;
    }
  } catch (e) {}
  _repoBaseCache = base;
  return base;
}

function avatarUrl(repoBase, charId, evolvePhase) {
  var suffix = (evolvePhase || 0) >= 2 ? '_2' : '';
  return repoBase + '/avatar/' + charId + suffix + '.png';
}

function skinAvatarUrl(repoBase, skinId) {
  if (!skinId || skinId.indexOf('@') === -1) return '';
  return repoBase + '/avatar/' + skinId.replace(/@/g, '_').replace(/#/g, '%23') + '.png';
}

function assistAvatarUrl(repoBase, op) {
  return skinAvatarUrl(repoBase, op.skinId) || avatarUrl(repoBase, op.id || op.charId, op.evolvePhase);
}

// 助战干员（前 3 个），含名称与头像 URL；异步（需读取资源仓库地址）
async function getAssistUnits(data) {
  var player = (data && data.player) || {};
  var list = Array.isArray(player.assistChars) ? player.assistChars.slice(0, 3) : [];
  if (!list.length) return [];
  var charInfoMap = player.charInfoMap || {};
  var repoBase = await getRepoBase();
  var units = [];
  for (var i = 0; i < list.length; i++) {
    var c = list[i];
    var id = c.charId;
    var info = charInfoMap && charInfoMap[id];
    units.push({
      id: id,
      name: (info && info.name) || id,
      level: c.level,
      evolvePhase: c.evolvePhase || 0,
      avatarUrl: assistAvatarUrl(repoBase, { id: id, charId: id, skinId: c.skinId, evolvePhase: c.evolvePhase })
    });
  }
  return units;
}

module.exports = {
  PLAYER_DATA_KEY: PLAYER_DATA_KEY,
  t: t,
  applyI18n: applyI18n,
  countUniqueChars: countUniqueChars,
  countMedals: countMedals,
  getPlayerSummary: getPlayerSummary,
  getRepoBase: getRepoBase,
  avatarUrl: avatarUrl,
  skinAvatarUrl: skinAvatarUrl,
  assistAvatarUrl: assistAvatarUrl,
  getAssistUnits: getAssistUnits
};
