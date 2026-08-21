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

module.exports = {
  PLAYER_DATA_KEY: PLAYER_DATA_KEY,
  t: t,
  applyI18n: applyI18n
};
