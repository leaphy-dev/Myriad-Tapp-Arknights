// ========================================
// Debug 页面模块
// 依赖 assets.js 的 __arkAssets（loadAssets / buildOperatorCard）
// ========================================

(function () {
  function initDebug(container) {
    var tokenInput = container.querySelector('[data-debug-token]');
    var urlInput = container.querySelector('[data-debug-url]');
    var sendBtn = container.querySelector('[data-debug-send]');
    var responsePanel = container.querySelector('[data-debug-response]');

    loadSavedToken(tokenInput);

    if (sendBtn) {
      sendBtn.addEventListener('click', function () {
        runRequest(tokenInput, urlInput, responsePanel);
      });
    }
  }

  async function loadSavedToken(input) {
    if (!input) return;
    try {
      var saved = await Tapp.settings.get('apiToken');
      if (saved && typeof saved === 'string') {
        input.value = saved;
      }
    } catch (e) {}
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

  async function runRequest(tokenInput, urlInput, panel) {
    if (!panel) return;
    panel.innerHTML = '';

    var token = tokenInput ? tokenInput.value.trim() : '';
    var url = urlInput ? urlInput.value : '';

    var summary = document.createElement('div');
    summary.setAttribute(
      'style',
      'background:#14181d;border:1px solid #2c333a;border-radius:4px;padding:10px;margin-top:8px;'
    );
    renderSummaryRow(summary, 'Request URL', url);
    renderSummaryRow(summary, 'Method', 'GET');
    renderSummaryRow(summary, 'Authorization', token ? token.slice(0, 8) + '…' : '(empty)');
    panel.appendChild(summary);

    try {
      var res = await Tapp.api('operatorData', { apiToken: token });
      renderOperators(panel, res);
      renderResponse(panel, res);
    } catch (e) {
      renderResponse(panel, { code: -1, msg: String((e && e.message) || e), data: null });
    }
  }

  async function renderOperators(panel, res) {
    var list = res && Array.isArray(res.data) ? res.data : null;
    if (!list || !list.length) return;

    var assets = window.__arkAssets;
    if (!assets) return;

    var assetsReady = await assets.loadAssets();
    if (!assetsReady) return;

    var block = document.createElement('div');
    block.setAttribute(
      'style',
      'background:#0d1117;border:1px solid #2c333a;border-radius:4px;padding:10px;margin-top:8px;'
    );

    var row = document.createElement('div');
    row.setAttribute('style', 'display:flex;gap:12px;flex-wrap:wrap;');

    // for (var i = 0; i < Math.min(3, list.length); i++) {
    //   row.appendChild(assets.buildOperatorCard(list[i]));
    // }

    for (var i = 0; i < list.length; i++) {
      row.appendChild(assets.buildOperatorCard(list[i]));
    }

    block.appendChild(row);
    panel.appendChild(block);
  }

  function renderResponse(panel, res) {
    var block = document.createElement('div');
    block.setAttribute(
      'style',
      'background:#0d1117;border:1px solid #2c333a;border-radius:4px;padding:10px;margin-top:8px;'
    );

    var code = (res && res.code) || '?';
    var color = code === 200 ? '#3fb950' : code === -1 ? '#f85149' : '#d29922';
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
