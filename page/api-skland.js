// ========================================
// Skland API 模块（森空岛接口封装，core 层加载）
// 每个导出函数对应一个 HTTP 请求
// ========================================

var crypto = require('./api-crypto.js');

var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/118.0';

// 用鹰角账号 Token 换取森空岛 Cred 与签名 Token：
//   hgToken --(hypergryphOauth2)--> code --(sklandGetCredByCode)--> { cred, token }
// 注意：hgToken 是 https://web-api.skland.com/account/info/hg 的 content（鹰角账号 Token），
// 不是 localStorage 的 SK_TOKEN_CACHE_KEY（那是签名 token，无法换 cred）。
// 后续请求的 sign 必须使用本流程返回的 data.token，而不是 hgToken。
async function getCredAndToken(hgToken) {
  var oauth = await Tapp.api('hypergryphOauth2', { token: hgToken });
  if (!oauth || oauth.status !== 0 || !oauth.data || !oauth.data.code) {
    throw new Error('oauth2 grant failed' + (oauth && oauth.msg ? ': ' + oauth.msg : ''));
  }
  var timestamp = String(Math.floor(Date.now() / 1000));
  var res = await Tapp.api('sklandGetCredByCode', {
    code: oauth.data.code,
    platform: '3',
    timestamp: timestamp,
    dId: UA,
    vName: '1.2.0'
  });
  if (!res || res.code !== 0 || !res.data || !res.data.cred || !res.data.token) {
    throw new Error('generate cred failed' + (res && res.message ? ': ' + res.message : ''));
  }
  return { cred: res.data.cred, token: res.data.token };
}

// 会话内按 hgToken 缓存 cred 与签名 token，避免每次请求都重新换取
var _credCache = { hgToken: '', cred: '', token: '' };

async function resolveCreds(hgToken) {
  if (_credCache.hgToken === hgToken && _credCache.cred && _credCache.token) return _credCache;
  var c = await getCredAndToken(hgToken);
  _credCache = { hgToken: hgToken, cred: c.cred, token: c.token };
  return _credCache;
}

// 解析凭证：优先参数，其次 storage；storage 只存鹰角账号 token，cred / 签名 token 自动换取
async function getCreds(userToken) {
  var hgToken = userToken && typeof userToken === 'string' ? userToken.trim() : '';
  if (!hgToken) {
    try {
      var v = await Tapp.storage.get('sklandToken');
      if (v && typeof v === 'string') hgToken = v.trim();
    } catch (e) {}
  }
  if (!hgToken) throw new Error('skland token not configured');
  var c = await resolveCreds(hgToken);
  return { cred: c.cred, token: c.token };
}

function sign(path, params, timestamp, token) {
  var headers = {
    platform: '3',
    timestamp: timestamp,
    dId: UA,
    vName: '1.2.0'
  };
  var text = path + (params || '') + timestamp + JSON.stringify(headers);
  var hmacHex = crypto.hmacSha256(token, text);
  return crypto.md5(hmacHex);
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

async function getPlayerBinding(token) {
  var c = await getCreds(token);
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

/**
 * 获取玩家信息。
 *
 * 返回 JSON（森空岛统一包装）：
 * {
 *   code: 0,             // 0 = 成功
 *   message: "",         // 错误信息
 *   data: {
 *     currentTs: number, // 当前时间戳（秒）
 *     showConfig: { charSwitch: boolean, skinSwitch: boolean, standingsSwitch: boolean },
 *
 *     status: {                       // 玩家状态
 *       uid: string,
 *       name: string,                 // 昵称
 *       level: number,                // 博士等级
 *       avatar: { type: string, id: string, url: string },  // 头像
 *       registerTs: number,           // 入职时间戳（秒）
 *       mainStageProgress: string,    // 主线进度，例 "main_15-03"
 *       secretary: { charId: string, skinId: string },      // 看板干员
 *       resume: string,               // 签名
 *       subscriptionEnd: number,
 *       ap: { current: number, max: number, lastApAddTime: number, completeRecoveryTime: number },  // 理智
 *       storeTs: number,
 *       lastOnlineTs: number,
 *       charCnt: number,              // 干员数
 *       furnitureCnt: number,         // 家具数
 *       skinCnt: number,              // 时装数
 *       exp: { current: number, max: number },  // 博士经验
 *       serverName: string
 *     },
 *
 *     medal: {                        // 蚀刻章
 *       type: string,                 // 例 "TEMPLATE"
 *       template: string,             // 展示的章组模板 id
 *       templateMedalList: string[],
 *       customMedalLayout: [],
 *       total: number                 // 蚀刻章总数
 *     },
 *
 *     assistChars: [                  // 助战干员（最多 3 个）
 *       {
 *         charId: string,             // 例 "char_002_amiya"
 *         skinId: string,             // 例 "char_002_amiya#2"
 *         level: number,
 *         evolvePhase: number,        // 精英化 0/1/2
 *         potentialRank: number,      // 潜能 0-5
 *         skillId: string,            // 例 "skchr_turdus_1"
 *         mainSkillLvl: number,
 *         specializeLevel: number,
 *         equip: object|null
 *       }
 *     ],
 *
 *     chars: [                        // 全部干员
 *       {
 *         charId: string,
 *         skinId: string,
 *         level: number,
 *         evolvePhase: number,        // 精英化 0/1/2
 *         potentialRank: number,      // 潜能 0-5
 *         mainSkillLvl: number,
 *         skills: [{ id: string, specializeLevel: number }],
 *         equip: [{ id: string, level: number, locked: boolean }],
 *         favorPercent: number,       // 信赖
 *         defaultSkillId: string,     // 默认技能，例 "skchr_amiya_2"
 *         gainTime: number,
 *         defaultEquipId: string,
 *         sortId: number,
 *         exp: number,
 *         gold: number,
 *         rarity: number
 *       }
 *     ],
 *
 *     charInfoMap: {                  // 角色基础信息表（key = charId）
 *       [charId]: {
 *         id: string,
 *         name: string,               // 中文名，例 "阿米娅"
 *         nationId: string,
 *         groupId: string,
 *         displayNumber: string,
 *         rarity: number,             // 星级
 *         profession: string,         // 职业，例 "CASTER"
 *         subProfessionId: string,
 *         subProfessionName: string,
 *         appellation: string,
 *         sortId: number
 *       }
 *     },
 *
 *     skins: [{ id: string, ts: number }],  // 已拥有的皮肤
 *     skinInfoMap: {                  // 皮肤信息表（key = skinId）
 *       [skinId]: { id: string, name: string, brandId: string, sortId: number, displayTagId: string, charId: string }
 *     },
 *
  *     building: {                     // 基建
  *       tiredChars: [{ charId: string, ap: number, lastApAddTime: number, roomSlotId: string, index: number, bubble: object, workTime: number }],
  *       powers: ..., manufactures: ..., tradings: ..., dormitories: ...,
  *       meeting: ..., hire: ..., training: ..., labor: ...,
  *       furniture: { total: number },  // 家具总数（真正来源，status.furnitureCnt 不可靠）
  *       elevators: ..., corridors: ..., control: ...
  *     },
 *     recruit: [{ startTs: number, finishTs: number, state: number }],  // 公开招募
 *
 *     // ---- 游戏模式（records + 对应 InfoMap）----
 *     campaign: {                     // 剿灭
 *       records: [{ campaignId: string, maxKills: number }],
 *       reward: object
 *     },
 *     campaignInfoMap: { [id]: { id: string, name: string, campaignZoneId: string, picUrl: string } },
 *     campaignZoneInfoMap: { [id]: { id: string, name: string } },
 *     stageInfoMap: { [id]: { id: string, code: string, name: string, zoneId: string, diffGroup: string, stageType: string, dangerLevel: string, apCost: number, difficulty: string } },
 *
 *     tower: {                        // 保全派驻
 *       records: [{ towerId: string, best: number }],
 *       reward: object
 *     },
 *     towerInfoMap: { [id]: { id: string, name: string, subName: string, picUrl: string } },
 *
 *     rogue: {                        // 集成战略
 *       records: [{ rogueId: string, relicCnt: number, bank: object, clearTime: number, bpLevel: number, medal: object }]
 *     },
 *     rogueInfoMap: { [id]: { id: string, name: string, sort: number, picUrl: string } },
 *
 *     routine: { daily: { current: number, total: number }, weekly: { current: number, total: number } },  // 日常/周常
 *
 *     activity: [                     // 活动剧情
 *       { actId: string, actReplicaId: string, zones: [{ zoneId: string, zoneReplicaId: string, clearedStage: number, totalStage: number }] }
 *     ],
 *     activityInfoMap: { [id]: { id: string, name: string, startTime: number, endTime: number, rewardEndTime: number, isReplicate: boolean, type: string, dropItemIds: string[], shopGoodItemIds: string[], favorUpList: [], picUrl: string } },
 *
 *     sandbox: [                      // 生息演算
 *       { id: string, name: string, maxDay: number, maxDayChallenge: number, mainQuest: number, subQuest: object[], baseLv: number, unlockNode: number, enemyKill: number, createRift: number, fixRift: number[], picUrl: string }
 *     ],
 *     bossRush: [{ id: string, record: object, picUrl: string }],  // 险地
 *     bannerList: [{ id: string, sortId: number, imgUrl: string, link: string, startAtTs: number, endAtTs: number, status: number }],
 *
 *     equipmentInfoMap: { [id]: { id: string, name: string, typeIcon: string, shiningColor: string } },  // 模组
 *     manufactureFormulaInfoMap: { [id]: { id: string, itemId: string, count: number, weight: number, costs: [], costPoint: number } },
 *
 *     charAssets: [],                 // 空数组
 *     skinAssets: string[],           // 皮肤 id 列表
 *     skinAssetList: { ids: string[] },
 *     activityBannerList: { list: [] }
 *   }
 * }
 */
async function getPlayerInfo(uid, token) {
  var query = 'uid=' + uid;
  var c = await getCreds(token);
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

async function getCultivate(uid, token) {
  var query = 'uid=' + uid;
  var c = await getCreds(token);
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

module.exports = {
  getCredAndToken: getCredAndToken,
  getPlayerBinding: getPlayerBinding,
  getPlayerInfo: getPlayerInfo,
  getCultivate: getCultivate,
};
