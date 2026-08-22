// ========================================
// Home Page
// ========================================

(function () {
  var PLAYER_DATA_KEY = 'arknights.player';
  var state = {
    credToken: '',
    binds: []
  };

  function render(container) {
    var homeSection = container.querySelector('[data-view="home"]');
    if (!homeSection) return;
    homeSection.innerHTML = '';

    var wrap = document.createElement('div');
    wrap.setAttribute('style', 'width:100%;max-width:720px;margin:0 auto;padding:24px 16px;font-family:system-ui,sans-serif;box-sizing:border-box;');

    var title = document.createElement('h1');
    title.setAttribute('style', 'font-size:20px;font-weight:600;margin:0 0 4px;color:#f5f5f5;');
    title.textContent = '明日方舟';
    wrap.appendChild(title);

    buildStep1(wrap);
    buildStep2(wrap);
    buildDisplay(wrap);

    homeSection.appendChild(wrap);

    var footer = document.createElement('div');
    footer.setAttribute('style', 'text-align:center;margin-top:24px;font-size:12px;color:rgba(255,255,255,0.5);');
    var debugLink = document.createElement('button');
    debugLink.type = 'button';
    debugLink.textContent = 'Debug';
    debugLink.setAttribute('data-nav', 'debug');
    debugLink.setAttribute(
      'style',
      'padding:4px 12px;font-size:12px;color:rgba(255,255,255,0.5);background:transparent;' +
        'border:1px solid rgba(255,255,255,0.3);border-radius:999px;cursor:pointer;'
    );
    footer.appendChild(debugLink);
    homeSection.appendChild(footer);

    initView(wrap);
  }

  async function initView(wrap) {
    var stored = null;
    try {
      stored = await Tapp.storage.get(PLAYER_DATA_KEY);
    } catch (e) {}

    if (stored && stored.data && stored.data.player) {
      showPage(wrap, 'display');
      renderDisplay(wrap, stored.data);
    } else {
      showPage(wrap, 'step1');
    }
  }

  function showPage(wrap, name) {
    var pages = {
      step1: wrap.querySelector('[data-page="step1"]'),
      step2: wrap.querySelector('[data-page="step2"]'),
      display: wrap.querySelector('[data-page="display"]')
    };
    for (var key in pages) {
      if (pages[key]) pages[key].style.display = key === name ? 'block' : 'none';
    }
  }

  // ==================== Step 1 · Token ====================

  function buildStep1(wrap) {
    var step = document.createElement('div');
    step.setAttribute('data-page', 'step1');
    step.setAttribute(
      'style',
      'margin-top:20px;padding:16px;border:1px solid rgba(255,255,255,0.3);border-radius:10px;display:none;'
    );

    var label = document.createElement('div');
    label.setAttribute('style', 'font-size:14px;font-weight:600;margin-bottom:8px;color:#f5f5f5;');
    label.textContent = '步骤 1 · 获取森空岛 Token';
    step.appendChild(label);

    var guide = document.createElement('div');
    guide.setAttribute('style', 'font-size:12px;line-height:1.7;color:rgba(255,255,255,0.5);margin-bottom:12px;');
    guide.textContent =
      '在森空岛官网（skland.com）已登录的控制台执行以下命令，把结果复制到下方输入框（格式：cred,token）';
    step.appendChild(guide);

    var code = document.createElement('div');
    code.setAttribute(
      'style',
      'font-family:monospace;font-size:11px;background:rgba(255,255,255,0.08);padding:8px 10px;border-radius:6px;' +
        'word-break:break-all;margin-bottom:12px;color:#f5f5f5;'
    );
    code.textContent =
      "copy(localStorage.getItem('SK_OAUTH_CRED_KEY')+','+localStorage.getItem('SK_TOKEN_CACHE_KEY'))";
    step.appendChild(code);

    var input = document.createElement('input');
    input.type = 'text';
    input.setAttribute(
      'style',
      'width:100%;box-sizing:border-box;padding:8px 10px;font-size:13px;border:1px solid rgba(255,255,255,0.35);' +
        'border-radius:6px;background:transparent;color:#f5f5f5;outline:none;'
    );
    input.placeholder = 'cred,token';
    step.appendChild(input);

    var navRow = document.createElement('div');
    navRow.setAttribute('style', 'display:flex;justify-content:flex-end;gap:8px;margin-top:12px;');

    var nextBtn = document.createElement('button');
    nextBtn.type = 'button';
    nextBtn.textContent = '下一步';
    nextBtn.setAttribute(
      'style',
      'padding:8px 18px;font-size:13px;font-weight:500;color:#fff;background:#6366f1;' +
        'border:none;border-radius:6px;cursor:pointer;'
    );
    navRow.appendChild(nextBtn);
    step.appendChild(navRow);

    loadSavedToken(input);

    nextBtn.addEventListener('click', function () {
      var credToken = input.value.trim();
      if (credToken.indexOf(',') === -1) {
        showError(step, '请输入格式为 cred,token 的值');
        return;
      }
      clearError(step);
      state.credToken = credToken;
      runBinding(wrap, step);
    });

    wrap.appendChild(step);
  }

  // ==================== Step 2 · 选择账号 ====================

  function buildStep2(wrap) {
    var step = document.createElement('div');
    step.setAttribute('data-page', 'step2');
    step.setAttribute(
      'style',
      'margin-top:20px;padding:16px;border:1px solid rgba(255,255,255,0.3);border-radius:10px;display:none;'
    );

    var label = document.createElement('div');
    label.setAttribute('style', 'font-size:14px;font-weight:600;margin-bottom:8px;color:#f5f5f5;');
    label.textContent = '步骤 2 · 选择账号';
    step.appendChild(label);

    var listBox = document.createElement('div');
    listBox.setAttribute('data-account-list', '1');
    step.appendChild(listBox);

    var navRow = document.createElement('div');
    navRow.setAttribute('style', 'display:flex;justify-content:space-between;gap:8px;margin-top:12px;');

    var prevBtn = document.createElement('button');
    prevBtn.type = 'button';
    prevBtn.textContent = '上一步';
    prevBtn.setAttribute(
      'style',
      'padding:8px 18px;font-size:13px;font-weight:500;color:#f5f5f5;background:transparent;' +
        'border:1px solid rgba(255,255,255,0.35);border-radius:6px;cursor:pointer;'
    );
    prevBtn.addEventListener('click', function () {
      showPage(wrap, 'step1');
    });
    navRow.appendChild(prevBtn);

    step.appendChild(navRow);
    wrap.appendChild(step);
  }

  function renderAccountList(wrap, step) {
    var listBox = step.querySelector('[data-account-list]');
    if (!listBox) return;
    listBox.innerHTML = '';

    if (!state.binds.length) {
      listBox.textContent = '无可用账号';
      return;
    }

    for (var i = 0; i < state.binds.length; i++) {
      (function (b) {
        var btn = document.createElement('button');
        btn.type = 'button';
        var name = b.nickName || '未知';
        var channel = b.channelName || '';
        btn.textContent = name + '（' + channel + '） UID:' + b.uid;
        btn.setAttribute(
          'style',
          'display:block;width:100%;text-align:left;margin-top:6px;padding:10px 12px;font-size:13px;' +
            'color:#f5f5f5;background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);' +
            'border-radius:6px;cursor:pointer;'
        );
        btn.addEventListener('click', function () {
          selectAccount(wrap, b);
        });
        listBox.appendChild(btn);
      })(state.binds[i]);
    }
  }

  // ==================== Display · 展示页 ====================

  function buildDisplay(wrap) {
    var page = document.createElement('div');
    page.setAttribute('data-page', 'display');
    page.setAttribute('style', 'margin-top:20px;display:flex;flex-direction:column;');

    var content = document.createElement('div');
    content.setAttribute('data-display-content', '1');
    content.setAttribute('style', 'flex:1;');
    page.appendChild(content);

    var navRow = document.createElement('div');
    navRow.setAttribute('style', 'display:flex;justify-content:flex-end;gap:8px;margin-top:32px;');

    var refreshBtn = document.createElement('button');
    refreshBtn.type = 'button';
    refreshBtn.textContent = '刷新数据';
    refreshBtn.setAttribute(
      'style',
      'padding:8px 18px;font-size:13px;font-weight:500;color:#fff;background:#6366f1;' +
        'border:none;border-radius:6px;cursor:pointer;'
    );
    refreshBtn.addEventListener('click', function () {
      showPage(wrap, 'step1');
    });
    navRow.appendChild(refreshBtn);
    page.appendChild(navRow);

    wrap.appendChild(page);
  }

  async function renderDisplay(wrap, data) {
    var page = wrap.querySelector('[data-page="display"]');
    var content = page.querySelector('[data-display-content]');
    if (!content) return;
    content.innerHTML = '';

    var player = data.player || {};
    var status = player.status;

    var nameRow = document.createElement('div');
    nameRow.setAttribute('style', 'display:flex;align-items:flex-start;gap:16px;margin-bottom:16px;');

    if (status && status.avatar && status.avatar.url) {
      var avatarBox = document.createElement('div');
      avatarBox.setAttribute('style', 'position:relative;width:var(--player-avatar);height:var(--player-avatar);flex-shrink:0;');

      var avatarImg = document.createElement('img');
      avatarImg.referrerPolicy = 'no-referrer';
      avatarImg.setAttribute(
        'style',
        'width:var(--player-avatar);height:var(--player-avatar);border:2px solid #fff;box-sizing:border-box;background:#000;' +
          'display:block;opacity:0;transition:opacity 0.25s ease;'
      );
      avatarImg.onload = function () {
        avatarImg.style.opacity = '1';
        var s = avatarBox.querySelector('.ark-spinner');
        if (s && s.parentNode) s.parentNode.remove();
      };
      avatarImg.onerror = function () {
        var s = avatarBox.querySelector('.ark-spinner');
        if (s && s.parentNode) s.parentNode.remove();
      };
      avatarBox.appendChild(avatarImg);
      avatarBox.appendChild(makeSpinner(16));

      if (status.level !== undefined) {
        var lvCircle = document.createElement('div');
        lvCircle.setAttribute(
          'style',
          'position:absolute;top:0;right:0;width:calc(var(--player-avatar) * 0.4375);height:calc(var(--player-avatar) * 0.4375);' +
            'border:2px solid #ffd700;border-radius:50%;transform:translate(50%,-50%);' +
            'background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;' +
            'font-size:calc(var(--player-avatar) * 0.1875);font-weight:600;color:#fff;'
        );
        lvCircle.textContent = String(status.level);
        avatarBox.appendChild(lvCircle);
      }

      nameRow.appendChild(avatarBox);
      avatarImg.src = status.avatar.url;
    }

    var nameBox = document.createElement('div');
    nameBox.setAttribute('style', 'display:flex;flex-direction:column;gap:4px;');

    var name = document.createElement('div');
    name.setAttribute('style', 'font-size:16px;font-weight:600;color:#f5f5f5;');
    name.textContent = status && status.name ? status.name : (data.nickName || '');
    nameBox.appendChild(name);

    if (status && status.registerTs) {
      var enrollRow = document.createElement('div');
      enrollRow.setAttribute('style', 'display:flex;align-items:center;gap:6px;');

      var enrollLabel = document.createElement('span');
      enrollLabel.setAttribute('style', 'font-size:11px;color:#000;background:#22bbff;padding:0 4px;');
      enrollLabel.textContent = '入职日';

      var enrollDate = document.createElement('span');
      enrollDate.setAttribute(
        'style',
        'font-size:11px;color:#000;background:#eeeeee;padding:0 4px;'
      );
      enrollDate.textContent = formatRegisterTs(status.registerTs);

      enrollRow.appendChild(enrollLabel);
      enrollRow.appendChild(enrollDate);
      nameBox.appendChild(enrollRow);
    }

    nameRow.appendChild(nameBox);
    content.appendChild(nameRow);

    var assist = player.assistChars;
    var assets = window.__arkAssets;

    if (!assets) return;

    var infoCard = assets.buildPlayerInfoCard(player);
    var gameDataCard = assets.buildGameDataCard(player);

    var layout = document.createElement('div');
    layout.setAttribute('class', 'ark-display-layout');

    var leftCol = document.createElement('div');
    leftCol.setAttribute('class', 'ark-display-left');
    leftCol.appendChild(infoCard);

    var rightCol = document.createElement('div');
    rightCol.setAttribute('class', 'ark-display-right');
    rightCol.appendChild(gameDataCard);

    var assistPlaceholder = makeSpinnerBox();
    leftCol.appendChild(assistPlaceholder);

    var myCharsPlaceholder = makeSpinnerBox();
    leftCol.appendChild(myCharsPlaceholder);

    layout.appendChild(leftCol);
    layout.appendChild(rightCol);
    content.appendChild(layout);

    assets.loadAssets().then(function () {
      assets.setCharInfoMap(player.charInfoMap);
      assistPlaceholder.replaceWith(assets.buildAssistUnit(assist));
      myCharsPlaceholder.replaceWith(assets.buildMyChars(player.chars, player.charInfoMap));
    }).catch(function () {
      var fail = document.createElement('div');
      fail.setAttribute('style', 'font-size:11px;color:rgba(255,255,255,0.5);padding:16px;text-align:center;');
      fail.textContent = '资源加载失败';
      assistPlaceholder.replaceWith(fail);
      myCharsPlaceholder.replaceWith(fail.cloneNode(true));
    });
  }

  // ==================== 共用 ====================

  function makeSpinner(size) {
    var holder = document.createElement('div');
    holder.setAttribute(
      'style',
      'position:absolute;left:0;top:0;width:100%;height:100%;display:flex;align-items:center;justify-content:center;'
    );
    var spinner = document.createElement('div');
    spinner.setAttribute('class', 'ark-spinner');
    if (size) {
      spinner.setAttribute('style', 'width:' + size + 'px;height:' + size + 'px;');
    }
    holder.appendChild(spinner);
    return holder;
  }

  function makeSpinnerBox() {
    var holder = document.createElement('div');
    holder.setAttribute('class', 'ark-spinner-box');
    var spinner = document.createElement('div');
    spinner.setAttribute('class', 'ark-spinner');
    holder.appendChild(spinner);
    return holder;
  }

  function formatRegisterTs(ts) {
    var d = new Date(Number(ts) * 1000);
    if (isNaN(d.getTime())) return String(ts);
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + day;
  }

  async function loadSavedToken(input) {
    try {
      var saved = await Tapp.settings.get('sklandToken');
      if (saved && typeof saved === 'string') input.value = saved;
    } catch (e) {}
  }

  function showError(step, msg) {
    var old = step.querySelector('[data-step-error]');
    if (old) old.remove();
    var err = document.createElement('div');
    err.setAttribute('data-step-error', '1');
    err.setAttribute('style', 'margin-top:8px;font-size:12px;color:#f85149;');
    err.textContent = msg;
    step.appendChild(err);
  }

  function clearError(step) {
    var old = step.querySelector('[data-step-error]');
    if (old) old.remove();
  }

  async function runBinding(wrap, step) {
    var skland = window.__arkSkland;
    if (!skland) {
      showError(step, 'skland 模块未加载');
      return;
    }

    try {
      var bindingRes = await skland.getPlayerBinding(state.credToken);
      var list = bindingRes && bindingRes.data && bindingRes.data.list;

      var ak = null;
      if (Array.isArray(list)) {
        for (var i = 0; i < list.length; i++) {
          if (list[i].appCode === 'arknights') { ak = list[i]; break; }
        }
      }

      var binds = ak && Array.isArray(ak.bindingList) ? ak.bindingList : [];
      if (!binds.length) {
        showError(step, '未找到明日方舟绑定账号，请检查 Token 是否有效');
        return;
      }

      state.binds = binds;
      if (binds.length === 1) {
        selectAccount(wrap, binds[0]);
        return;
      }

      var step2 = wrap.querySelector('[data-page="step2"]');
      renderAccountList(wrap, step2);
      showPage(wrap, 'step2');
    } catch (e) {
      showError(step, String((e && e.message) || e));
    }
  }

  async function selectAccount(wrap, binding) {
    var credToken = state.credToken;
    if (!credToken) {
      try { credToken = (await Tapp.settings.get('sklandToken')) || ''; } catch (e) {}
    }

    var skland = window.__arkSkland;
    if (!skland) return;

    try {
      var info = await skland.getPlayerInfo(binding.uid, credToken);
      var data = info && info.data ? info.data : null;
      await Tapp.storage.set(PLAYER_DATA_KEY, {
        ts: Date.now(),
        data: {
          uid: binding.uid,
          nickName: binding.nickName || '',
          channelName: binding.channelName || '',
          player: data
        }
      });
      showPage(wrap, 'display');
      renderDisplay(wrap, {
        uid: binding.uid,
        nickName: binding.nickName || '',
        player: data
      });
    } catch (e) {
      showError(wrap.querySelector('[data-page="step2"]'), String((e && e.message) || e));
    }
  }

  Tapp.pages['home'] = {
    render: render
  };
})();
