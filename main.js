/// <reference path="./types/tapp-sdk.d.ts" />

// ========================================
// Core / 核心
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
// Settings / 设置
// ========================================

async function getApiToken() {
  var token = '';
  try {
    var saved = await Tapp.settings.get('apiToken');
    if (saved && typeof saved === 'string') {
      token = saved;
    }
  } catch (e) {}
  return token;
}

// ========================================
// Data / 数据
// ========================================

async function fetchOperatorData() {
  var token = await getApiToken();
  if (!token) {
    throw new Error('apiToken not configured');
  }
  var res = await Tapp.api('operatorData', { apiToken: token });
  if (res && res.code === 200) {
    return res.data;
  }
  throw new Error((res && res.msg) || 'fetch operator data failed');
}

async function refreshPlayerData() {
  var data = await fetchOperatorData();
  await Tapp.storage.set(PLAYER_DATA_KEY, {
    ts: Date.now(),
    data: data
  });
  return data;
}

// ========== Page Code ==========
