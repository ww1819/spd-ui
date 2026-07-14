/**
 * C-Lodop 本机打印（绕过浏览器 window.print）
 * 客户端需安装并启动 CLodop 服务（默认 localhost:8000 / 18000）
 */

const CLODOP_SCRIPT_URLS = [
  'http://localhost:8000/CLodopfuncs.js',
  'http://localhost:18000/CLodopfuncs.js'
]

const INSTALL_HINT =
  '未检测到 C-Lodop 打印服务。请在本机安装并启动 CLodop 后刷新页面再试（官网：http://www.c-lodop.com ）。'

let loadPromise = null

function tryGetCLodop() {
  try {
    if (typeof window.getCLodop === 'function') {
      const lodop = window.getCLodop()
      if (lodop) return lodop
    }
  } catch (e) {
    /* 服务未就绪 */
  }
  return null
}

function loadScript(url) {
  return new Promise((resolve, reject) => {
    const existed = document.querySelector(`script[data-clodop-src="${url}"]`)
    if (existed) {
      resolve()
      return
    }
    const script = document.createElement('script')
    script.src = url
    script.setAttribute('data-clodop-src', url)
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('load fail: ' + url))
    document.head.appendChild(script)
  })
}

/**
 * 加载并返回 LODOP 对象
 * @returns {Promise<object>}
 */
export function loadCLodop() {
  const ready = tryGetCLodop()
  if (ready) return Promise.resolve(ready)

  if (loadPromise) return loadPromise

  loadPromise = (async () => {
    let lastErr = null
    for (let i = 0; i < CLODOP_SCRIPT_URLS.length; i++) {
      const base = CLODOP_SCRIPT_URLS[i]
      const url = base + (base.indexOf('?') >= 0 ? '&' : '?') + 't=' + Date.now()
      try {
        await loadScript(url)
        // CLodop 脚本加载后可能需短暂等待
        for (let w = 0; w < 8; w++) {
          const lodop = tryGetCLodop()
          if (lodop) return lodop
          await new Promise(r => setTimeout(r, 50))
        }
      } catch (e) {
        lastErr = e
      }
    }
    loadPromise = null
    const err = new Error(INSTALL_HINT)
    err.cause = lastErr
    throw err
  })()

  return loadPromise
}

/**
 * 收集与打印根节点相关的 style（含 Vue scoped），尽量还原屏上预览
 */
export function collectStylesForElement(el) {
  if (!el || typeof document === 'undefined') return ''

  const scopeIds = []
  const collectScope = (node) => {
    if (!node || node.nodeType !== 1) return
    const attrs = node.attributes
    if (attrs) {
      for (let i = 0; i < attrs.length; i++) {
        const name = attrs[i].name
        if (name && name.indexOf('data-v-') === 0 && scopeIds.indexOf(name) < 0) {
          scopeIds.push(name)
        }
      }
    }
    const children = node.children
    if (children) {
      for (let i = 0; i < children.length; i++) collectScope(children[i])
    }
  }
  collectScope(el)

  const styleNodes = document.querySelectorAll('style')
  const parts = []
  for (let i = 0; i < styleNodes.length; i++) {
    const node = styleNodes[i]
    // 与屏上预览一致：不带入 @media print 专用样式
    const media = (node.getAttribute('media') || '').toLowerCase()
    if (media && media.indexOf('print') >= 0 && media.indexOf('screen') < 0) {
      continue
    }
    const text = node.textContent || ''
    if (!text) continue
    let hit = false
    for (let s = 0; s < scopeIds.length; s++) {
      const sid = scopeIds[s]
      if (text.indexOf(sid) >= 0 || text.indexOf('[' + sid + ']') >= 0) {
        hit = true
        break
      }
    }
    if (!hit) {
      // 组件内非 scoped 的预览样式
      if (
        /receipt-print|out-order-print|print-copy-block|detail-table|print-head|print-sign|browser-print-root/.test(
          text
        )
      ) {
        hit = true
      }
    }
    if (hit) parts.push(node.outerHTML)
  }
  return parts.join('\n')
}

/**
 * 用当前预览 DOM 拼完整 HTML，供 ADD_PRINT_HTM 使用（与屏上预览一致）
 */
export function buildDocumentHtmlFromElement(el, extraCss) {
  if (!el) return ''
  const styles = collectStylesForElement(el)
  const bodyHtml = el.outerHTML
  const extra = extraCss || ''
  return (
    '<!DOCTYPE html><html><head><meta charset="utf-8">' +
    styles +
    '<style>' +
    'html,body{margin:0!important;padding:0!important;background:#fff!important;}' +
    '.no-print{display:none!important;}' +
    /* 列表直打屏外占位在 Lodop 中恢复为正常流 */
    '.print-root-offscreen{position:relative!important;left:auto!important;top:auto!important;' +
    'z-index:auto!important;visibility:visible!important;}' +
    extra +
    '</style></head><body>' +
    bodyHtml +
    '</body></html>'
  )
}

/**
 * 用 HTML 调 Lodop 预览/打印
 * @param {object} options
 * @param {string} options.html
 * @param {string} [options.taskName]
 * @param {1|2} [options.orient] 1 纵向 2 横向
 * @param {number} [options.pageWidthMm]
 * @param {number} [options.pageHeightMm]
 * @param {string} [options.pageName] 如 A4；与宽高同时传时宽高优先
 * @param {string} [options.printerName] 打印机名称（可选）
 * @param {boolean} [options.preview=true] true=Lodop 预览，false=直接打印
 * @param {number} [options.marginTopMm]
 * @param {number} [options.marginLeftMm]
 * @param {number} [options.marginRightMm]
 * @param {number} [options.marginBottomMm]
 */
export async function lodopPrintHtml(options) {
  const opts = options || {}
  const LODOP = await loadCLodop()
  const taskName = opts.taskName || '打印'
  const orient = opts.orient === 2 ? 2 : 1
  const preview = opts.preview !== false

  LODOP.PRINT_INIT(taskName)

  // 纸张：优先自定义 mm（Lodop 内部单位 0.1mm）。自定义纸需带名称，部分 CLodop 版本才认尺寸
  if (opts.pageWidthMm != null && opts.pageHeightMm != null) {
    const w = Math.round(Number(opts.pageWidthMm) * 10)
    const h = Math.round(Number(opts.pageHeightMm) * 10)
    const customName = opts.pageName && String(opts.pageName).trim() ? opts.pageName : 'LodopCustomPage'
    LODOP.SET_PRINT_PAGESIZE(orient, w, h, customName)
  } else if (opts.pageName) {
    LODOP.SET_PRINT_PAGESIZE(orient, 0, 0, opts.pageName)
  } else {
    LODOP.SET_PRINT_PAGESIZE(orient, 0, 0, 'A4')
  }

  if (opts.printerName) {
    try {
      LODOP.SET_PRINTER_INDEXA(opts.printerName)
    } catch (e) {
      /* 名称不匹配时忽略，由预览里手选 */
    }
  }

  // 不设 Full-Page：避免 Lodop 再缩放导致与屏上预览比例不一致
  const top = opts.marginTopMm != null ? opts.marginTopMm : 2
  const left = opts.marginLeftMm != null ? opts.marginLeftMm : 2
  const right = opts.marginRightMm != null ? opts.marginRightMm : 2
  const bottom = opts.marginBottomMm != null ? opts.marginBottomMm : 2

  LODOP.ADD_PRINT_HTM(
    top + 'mm',
    left + 'mm',
    'RightMargin:' + right + 'mm',
    'BottomMargin:' + bottom + 'mm',
    opts.html || ''
  )

  if (preview) {
    LODOP.PREVIEW()
  } else {
    LODOP.PRINT()
  }
  return LODOP
}

export { INSTALL_HINT }
