/// <reference path="./types/tapp-sdk.d.ts" />

// ========================================
// Core / 共享层（Widget、Page、Headless 三模式均加载）
// ========================================

//TODO
var PLAYER_DATA_KEY = 'arknights.player';

var PLAYER_DATA_CACHE = null;
var _playerDataPromise = null;

// ========================================
// i18
// ========================================
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
// 玩家数据（纯数据，无 DOM 依赖，Page / Widget 共用）
// ========================================

// 读取：首次调用从 shared 触发加载并返回 Promise<record|null>；之后复用同一
// Promise（resolve 后同步写回 PLAYER_DATA_CACHE，供渲染期同步读取函数使用）。
// 传 force=true 可强制重读 shared（跨沙箱场景下获取最新数据）
function loadPlayerData(force) {
  if (force || !_playerDataPromise) {
    _playerDataPromise = (async function () {
      try {
        var data = await Tapp.shared.get(PLAYER_DATA_KEY);
        PLAYER_DATA_CACHE = data || null;
      } catch (e) {
        PLAYER_DATA_CACHE = null;
      }
      return PLAYER_DATA_CACHE;
    })();
  }
  return _playerDataPromise;
}

// 模块加载时自动预读缓存（异步、非阻塞）
// loadPlayerData();

async function setPlayerData(map, uid) {
  var record = { ts: Date.now(), data: map };
  PLAYER_DATA_CACHE = record;
  _playerDataPromise = Promise.resolve(record);
  await Tapp.shared.set(PLAYER_DATA_KEY, record);
}

function getDataUpdateTs(uid) {
  var data = PLAYER_DATA_CACHE;
  return data?.ts;
}

function getPlayerStatus(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.status) || {};
}

function getPlayerMedal(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.medal) || {};
}

function getPlayerAssistChars(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.assistChars) || {};
}

function getPlayerChars(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.chars) || {};
}

function getPlayerSkins(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.skins) || {};
}

function getPlayerBuilding(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.building) || {};
}

function getPlayerRecruit(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.recruit) || {};
}

function getPlayerCampaign(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.campaign) || {};
}

function getPlayerTower(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.tower) || {};
}

function getPlayerRogue(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.rogue) || {};
}

function getPlayerRoutine(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.routine) || {};
}

function getPlayerActivity(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.activity) || {};
}

function getCharInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.charInfoMap) || {};
}

function getSkinInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.skinInfoMap) || {};
}

function getStageInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.stageInfoMap) || {};
}

function getActivityInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.activityInfoMap) || {};
}

function getTowerInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.towerInfoMap) || {};
}

function getRogueInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.rogueInfoMap) || {};
}

function getCampaignInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.campaignInfoMap) || {};
}

function getCampaignZoneInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.campaignZoneInfoMap) || {};
}

function getEquipmentInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.equipmentInfoMap) || {};
}

function getManufactureFormulaInfoMap(uid) {
  var data = PLAYER_DATA_CACHE;
  var player = data && data.data ? data.data.player : null;
  return (player && player.manufactureFormulaInfoMap) || {};
}

function getOperatorName(charId, uid) {
  var info = getCharInfoMap(uid)[charId];
  var locale = Tapp.i18n.getLocale();
  // console.debug(Tapp.i18n.getLocale())；
  if (locale == "zh-CN"){
    return (info && info.name) || charId;
  }else{
    return (info && info.appellation) || charId;
  }
}

function countUniqueChars(chars, charInfoMap) {
  var seen = new Set();
  for (let i = 0; i < chars.length; i++) {
    let id = chars[i] && chars[i].charId;
    let appellation = charInfoMap[id] && charInfoMap[id].appellation
    if (appellation){
      seen.add(appellation)
    }
  }
  // console.debug(seen)
  return  seen.size > 0 ? seen.size : null;
}

// 从存储的玩家数据（{ player, nickName, ... }）生成概要，供主页与小组件共用
function generatePlayerSummary(uid) {
  var status = getPlayerStatus(uid)
  var name = status.name || '';
  var avatar = (status.avatar && isHttpsUrl(status.avatar.url)) ? status.avatar.url : '';
  var level = status.level !== undefined ? String(status.level) : '';
  var charCount = countUniqueChars(getPlayerChars(uid), getCharInfoMap(uid));
  var operators = charCount != null
    ? String(charCount)
    : (status.charCnt !== undefined ? String(status.charCnt) : '-');
  var furnitureNum = getPlayerBuilding(uid)?.furniture?.total;
  var medalNum = getPlayerMedal(uid)?.total;
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
      ['assets.furniture', furnitureNum !== undefined ? String(furnitureNum) : '-'],
      ['assets.medals', medalNum !== undefined ? String(medalNum) : '-']
    ]
  };
}

// ========================================
// 资源仓库与助战干员（供pages+widgets等复用）
// ========================================

var _repoBaseCache = '';

// 校验绝对 https:// URL（trim + 协议/hostname 校验）；拒绝 http: / javascript: / data: / 相对路径等
function isHttpsUrl(v) {
  if (typeof v !== 'string') return false;
  var s = v.trim();
  if (!s || !/^https:\/\//i.test(s)) return false;
  if (typeof URL === 'function') {
    try {
      var u = new URL(s);
      if (u.protocol !== 'https:' || !u.hostname) return false;
    } catch (e) {
      return false;
    }
  }
  return true;
}

// 校验素材仓库基址：仅接受绝对 https://（trim、去尾 /），否则返回 '' 回退默认仓
function sanitizeRepoBase(v) {
  if (!isHttpsUrl(v)) return '';
  return v.trim().replace(/\/+$/, '');
}

async function getRepoBase() {
  if (_repoBaseCache) return _repoBaseCache;
  var base = 'https://raw.githubusercontent.com/leaphy-dev/ArknightsGameResource/main';
  try {
    var cleaned = sanitizeRepoBase(await Tapp.settings.get('resourceBaseUrl'));
    if (cleaned) base = cleaned;
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
  return skinAvatarUrl(repoBase, op.skinId) || avatarUrl(repoBase, op.charId, op.evolvePhase);
}

var _eliteUrlsCache = null;

// 精英化标识图片（包内资源 → blob URL），缓存
async function getEliteUrls() {
  if (_eliteUrlsCache) return _eliteUrlsCache;
  var urls = {};
  try {
    urls[0] = (await Tapp.assets.getUrl('assets/rank/elite0.png')).url;
    urls[1] = (await Tapp.assets.getUrl('assets/rank/elite1.png')).url;
    urls[2] = (await Tapp.assets.getUrl('assets/rank/elite2.png')).url;
  } catch (e) {
    // urls = {};
    console.error('Failed to load elite URLs:', e);
  }
  _eliteUrlsCache = urls;
  return urls;
}

// 助战干员（前 3 个），含名称 / 头像 / 精英化标识；异步（需读取资源仓库地址）
async function getAssistUnits(uid) {
  var assistChars = getPlayerAssistChars(uid)
  var list = Array.isArray(assistChars) ? assistChars.slice(0, 3) : [];
  if (!list.length) return [];
  var repoBase = await getRepoBase();
  var eliteUrls = await getEliteUrls();
  var units = [];
  for (var i = 0; i < list.length; i++) {
    var c = list[i];
    // var id = c.charId;
    // var info = getCharInfoMap[id];
    var phase = c.evolvePhase || 0;
    units.push({
      id: c.charId,
      // name: (info && info.name) || id,
      level: c.level,
      evolvePhase: phase,
      avatarUrl: assistAvatarUrl(repoBase, {charId: c.charId, skinId: c.skinId, evolvePhase: phase }),
      eliteUrl: eliteUrls[phase] || ''
    });
  }
  return units;
}

// ========================================
// exports
// ========================================

module.exports = {
  PLAYER_DATA_KEY: PLAYER_DATA_KEY,

  t: t,
  applyI18n: applyI18n,


  countUniqueChars: countUniqueChars,
  loadPlayerData: loadPlayerData,
  setPlayerData: setPlayerData,
  getDataUpdateTs: getDataUpdateTs,

  getPlayerStatus: getPlayerStatus,
  getPlayerMedal: getPlayerMedal,
  getPlayerAssistChars: getPlayerAssistChars,
  getPlayerChars: getPlayerChars,
  getPlayerBuilding: getPlayerBuilding,
  getPlayerRecruit: getPlayerRecruit,
  getPlayerCampaign: getPlayerCampaign,
  getPlayerTower: getPlayerTower,
  getPlayerRogue: getPlayerRogue,
  getPlayerRoutine: getPlayerRoutine,
  getPlayerActivity: getPlayerActivity,
  getCharInfoMap: getCharInfoMap,
  getSkinInfoMap: getSkinInfoMap,
  getStageInfoMap: getStageInfoMap,
  getActivityInfoMap: getActivityInfoMap,
  getTowerInfoMap: getTowerInfoMap,
  getRogueInfoMap: getRogueInfoMap,
  getCampaignInfoMap: getCampaignInfoMap,
  getCampaignZoneInfoMap: getCampaignZoneInfoMap,
  getEquipmentInfoMap: getEquipmentInfoMap,
  getManufactureFormulaInfoMap: getManufactureFormulaInfoMap,

  generatePlayerSummary: generatePlayerSummary,

  getOperatorName: getOperatorName,

  isHttpsUrl: isHttpsUrl,
  sanitizeRepoBase: sanitizeRepoBase,
  getRepoBase: getRepoBase,
  avatarUrl: avatarUrl,
  skinAvatarUrl: skinAvatarUrl,
  assistAvatarUrl: assistAvatarUrl,
  getEliteUrls: getEliteUrls,
  getAssistUnits: getAssistUnits
};
