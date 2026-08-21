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
// Data / 数据
// ========================================

async function refreshPlayerData() {
  var skland = window.__arkSkland;
  if (!skland) throw new Error('skland module not loaded');

  var result = await skland.getPlayerInfoAuto();
  var data = result.info && result.info.data ? result.info.data : null;

  await Tapp.storage.set(PLAYER_DATA_KEY, {
    ts: Date.now(),
    data: {
      uid: result.uid,
      nickName: result.nickName,
      channelName: result.channelName,
      player: data
    }
  });
  return data;
}

// ========== Page Code ==========
