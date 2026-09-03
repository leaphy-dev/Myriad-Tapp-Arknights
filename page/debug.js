// ========================================
// Debug Page（API 测试）
// ========================================

(function () {
  function initDebug(container) {
    var tokenInput = container.querySelector('[data-debug-token]');
    var endpointSelect = container.querySelector('[data-debug-endpoint]');
    var paramsBox = container.querySelector('[data-debug-params]');
    var uidInput = container.querySelector('[data-debug-uid]');
    var sendBtn = container.querySelector('[data-debug-send]');
    var responsePanel = container.querySelector('[data-debug-response]');

    loadSavedToken(tokenInput);

    function updateParams() {
      var v = endpointSelect ? endpointSelect.value : '';
      if (paramsBox) {
        paramsBox.style.display = (v === 'binding') ? 'none' : 'flex';
      }
    }
    updateParams();

    if (endpointSelect) {
      endpointSelect.addEventListener('change', updateParams);
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        runRequest(tokenInput, endpointSelect, uidInput, responsePanel);
      });
    }
  }

  async function loadSavedToken(input) {
    if (!input) return;
    try {
      var saved = await Tapp.settings.get('sklandToken');
      if (saved && typeof saved === 'string') {
        input.value = saved;
      }
    } catch (e) {}
  }

  async function runRequest(tokenInput, endpointSelect, uidInput, panel) {
    if (!panel) return;
    panel.innerHTML = '';

    var endpoint = endpointSelect ? endpointSelect.value : 'binding';
    var uid = uidInput ? uidInput.value.trim() : '';
    var credToken = tokenInput ? tokenInput.value.trim() : '';

    var summary = document.createElement('div');
    summary.setAttribute(
      'style',
      'background:#14181d;border:1px solid #2c333a;border-radius:4px;padding:10px;margin-top:8px;'
    );
    renderSummaryRow(summary, 'Request URL', 'https://zonai.skland.com' + endpointPath(endpoint));
    renderSummaryRow(summary, 'Method', 'GET');
    renderSummaryRow(summary, 'Auth', 'skland cred+sign');
    panel.appendChild(summary);

    try {
      var skland = window.__arkSkland;
      if (!skland) throw new Error('skland module not loaded');

      var res;
      if (endpoint === 'info') {
        if (!uid) throw new Error('uid required');
        res = await skland.getPlayerInfo(uid, credToken);
      } else if (endpoint === 'cultivate') {
        if (!uid) throw new Error('uid required');
        res = await skland.getCultivate(uid, credToken);
      } else {
        res = await skland.getPlayerBinding(credToken);
      }
      renderResponse(panel, res);
    } catch (e) {
      renderResponse(panel, { code: -1, msg: String((e && e.message) || e), data: null });
    }
  }

  function endpointPath(ep) {
    if (ep === 'info') return '/api/v1/game/player/info';
    if (ep === 'cultivate') return '/api/v1/game/cultivate/player';
    return '/api/v1/game/player/binding';
  }

  function renderSummaryRow(panel, label, value) {
    var row = document.createElement('div');
    row.setAttribute('style', 'display:flex;gap:8px;margin-top:4px;');

    var lab = document.createElement('span');
    lab.setAttribute('style', 'color:#8b95a1;min-width:90px;font-size:11px;');
    lab.textContent = label;

    var val = document.createElement('span');
    val.setAttribute('style', 'color:#e0e0e0;font-size:12px;word-break:break-all;');
    val.textContent = value;

    row.appendChild(lab);
    row.appendChild(val);
    panel.appendChild(row);
  }

  function renderResponse(panel, res) {
    var block = document.createElement('div');
    block.setAttribute(
      'style',
      'background:#0d1117;border:1px solid #2c333a;border-radius:4px;padding:10px;margin-top:8px;'
    );

    var hasCode = res && res.code !== undefined && res.code !== null;
    var code = hasCode ? res.code : '?';
    var color = code === 0 || code === 200 ? '#3fb950' : code === -1 ? '#f85149' : '#d29922';
    var codeLine = document.createElement('div');
    codeLine.setAttribute('style', 'font-size:12px;color:' + color + ';margin-bottom:6px;');
    codeLine.textContent = 'code: ' + code + (res && res.msg ? ' — ' + res.msg : '');
    block.appendChild(codeLine);

    var pre = document.createElement('pre');
    pre.setAttribute(
      'style',
      'margin:0;white-space:pre-wrap;word-break:break-all;color:#e0e0e0;font-size:12px;max-height:360px;overflow:auto;'
    );
    pre.textContent = JSON.stringify(res, null, 2);
    block.appendChild(pre);
    panel.appendChild(block);
  }

  Tapp.pages['debug'] = {
    render: initDebug
  };
})();
