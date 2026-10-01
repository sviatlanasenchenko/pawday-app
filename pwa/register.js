(() => {
  const words = {
    en: ['Install Pawday', 'On iPhone/iPad: open in Safari, tap Share → Add to Home Screen.', 'Offline quiz ready. Previously viewed photos are available.', 'Offline mode — some photos may be unavailable.', 'A new version is ready. Close all Pawday windows and reopen to update.'],
    ru: ['Установить Pawday', 'На iPhone/iPad: открой в Safari → Поделиться → На экран «Домой».', 'Анкета готова к работе офлайн. Доступны просмотренные фото.', 'Офлайн-режим — некоторые фото могут быть недоступны.', 'Доступна новая версия. Закрой все окна Pawday и открой приложение снова.'],
    zh: ['安装 Pawday', '在 iPhone/iPad 上：用 Safari 打开，点“分享”→“添加到主屏幕”。', '问卷已可离线使用。已浏览的照片可用。', '离线模式：部分照片可能不可用。', '新版本已就绪。关闭所有 Pawday 窗口后重新打开。']
  };
  const ui = document.createElement('aside');
  ui.className = 'pwa-controls';
  ui.innerHTML = '<button type="button" hidden></button><small></small><p role="status" aria-live="polite"></p>';
  document.body.append(ui);
  const button = ui.querySelector('button'), hint = ui.querySelector('small'), status = ui.querySelector('p');
  let promptEvent, ready = false, updated = false;
  function refresh() {
    const l = document.documentElement.lang.slice(0, 2), w = words[l] || words.en;
    const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
    button.textContent = w[0]; button.hidden = !promptEvent || standalone;
    hint.textContent = !standalone && (/iPad|iPhone|iPod/.test(navigator.userAgent) || navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? w[1] : '';
    status.textContent = !navigator.onLine ? w[3] : updated ? w[4] : ready ? w[2] : '';
  }
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); promptEvent = e; refresh(); });
  button.onclick = async () => { if (!promptEvent) return; await promptEvent.prompt(); await promptEvent.userChoice; promptEvent = null; refresh(); };
  window.addEventListener('appinstalled', () => { promptEvent = null; refresh(); });
  new MutationObserver(refresh).observe(document.documentElement, {attributes:true, attributeFilter:['lang']});
  for (const name of ['online', 'offline']) window.addEventListener(name, refresh);
  refresh();
  if ('serviceWorker' in navigator && window.isSecureContext) {
    window.addEventListener('load', async () => {
      try {
        const reg = await navigator.serviceWorker.register(new URL('sw.js', document.baseURI), {scope: new URL('./', document.baseURI).pathname, updateViaCache:'none'});
        const check = () => { updated = !!reg.waiting; refresh(); };
        check();
        reg.addEventListener('updatefound', () => reg.installing?.addEventListener('statechange', check));
        await navigator.serviceWorker.ready; ready = true; refresh();
      } catch (error) { console.error('Pawday offline setup failed', error); }
    });
  }
})();
