/**
 * Chrome 桌面快捷方式（PWA 安装提示）。
 * 网页无法直接打开「创建此页面的快捷方式」菜单项，只能通过 beforeinstallprompt.prompt()。
 */

export function getDeferredInstallPrompt() {
  return window.__spdDeferredInstallPrompt || null;
}

export function clearDeferredInstallPrompt() {
  window.__spdDeferredInstallPrompt = null;
}

export function ensureDesktopShortcutSw() {
  if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) {
    return Promise.resolve(null);
  }
  const base = String(process.env.BASE_URL || "/");
  const swUrl = `${base.endsWith("/") ? base : base + "/"}sw-desktop-shortcut.js`;
  return navigator.serviceWorker
    .register(swUrl)
    .then(reg => navigator.serviceWorker.ready.then(() => reg))
    .catch(() => null);
}

/** 等待 beforeinstallprompt（刚注册 SW 后常需短暂等待） */
export function waitForInstallPrompt(timeoutMs = 2500) {
  const existing = getDeferredInstallPrompt();
  if (existing) return Promise.resolve(existing);
  return new Promise(resolve => {
    let done = false;
    const finish = event => {
      if (done) return;
      done = true;
      window.removeEventListener("beforeinstallprompt", onPrompt);
      clearTimeout(timer);
      resolve(event || getDeferredInstallPrompt());
    };
    const onPrompt = e => {
      e.preventDefault();
      window.__spdDeferredInstallPrompt = e;
      finish(e);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    const timer = setTimeout(() => finish(null), timeoutMs);
  });
}

/**
 * @returns {Promise<'accepted'|'dismissed'|'unavailable'>}
 */
export async function promptDesktopShortcut() {
  await ensureDesktopShortcutSw();
  let deferred = getDeferredInstallPrompt();
  if (!deferred) {
    deferred = await waitForInstallPrompt(2500);
  }
  if (!deferred || typeof deferred.prompt !== "function") {
    return "unavailable";
  }
  try {
    deferred.prompt();
    const choice = await deferred.userChoice;
    clearDeferredInstallPrompt();
    return choice && choice.outcome === "accepted" ? "accepted" : "dismissed";
  } catch (e) {
    clearDeferredInstallPrompt();
    return "unavailable";
  }
}
