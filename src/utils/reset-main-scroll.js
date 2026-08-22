/**
 * 路由/页签切换后复位主内容区滚动。
 * keep-alive 缓存页在固定头（navbar + tags）下若残留 scrollTop，整页会上移顶住标签栏。
 */

const MAIN_SCROLL_SELECTORS = [
  '#app',
  '.app-wrapper',
  '.main-container',
  '.app-main'
]

export function resetMainContentScroll(rootEl) {
  if (typeof window !== 'undefined') {
    window.scrollTo(0, 0)
  }

  if (typeof document === 'undefined') {
    return
  }

  const docEl = document.documentElement
  if (docEl) docEl.scrollTop = 0

  const body = document.body
  if (body) {
    body.scrollTop = 0
    if (body.parentNode) body.parentNode.scrollTop = 0
  }

  MAIN_SCROLL_SELECTORS.forEach((selector) => {
    document.querySelectorAll(selector).forEach((el) => {
      el.scrollTop = 0
    })
  })

  if (rootEl) {
    rootEl.scrollTop = 0
  }

  // 复位当前激活页根容器（keep-alive 切回时偶发残留）
  const activeView = document.querySelector('.app-main .app-container')
  if (activeView) {
    activeView.scrollTop = 0
  }
}

/**
 * 立即复位，并在 rAF / 延迟帧重复执行，覆盖 fade-transform（约 500ms）尾帧。
 */
export function scheduleMainContentScrollReset(rootEl) {
  const run = () => resetMainContentScroll(rootEl)

  run()

  if (typeof window === 'undefined') {
    return
  }

  if (typeof window.requestAnimationFrame === 'function') {
    window.requestAnimationFrame(() => {
      run()
      window.requestAnimationFrame(run)
    })
  }

  ;[50, 120, 300, 560, 700].forEach((ms) => {
    window.setTimeout(run, ms)
  })
}
