/**
* v-dialogDrag 弹窗拖拽
* Copyright (c) 2019 SPD
*/

function parseOffset(value, fullSize) {
  if (value == null || value === '' || value === 'auto') {
    return 0
  }
  const str = String(value)
  if (str.includes('%')) {
    return fullSize * (+str.replace(/%/g, '') / 100)
  }
  const n = parseFloat(str)
  return Number.isFinite(n) ? n : 0
}

function isWrapperVisible(el) {
  if (!el) return false
  if (el.style && el.style.display === 'none') return false
  const cs = window.getComputedStyle(el)
  return cs.display !== 'none' && cs.visibility !== 'hidden'
}

export default {
  bind(el, binding) {
    const value = binding.value
    if (value == false) return
    // 获取拖拽内容头部
    const dialogHeaderEl = el.querySelector('.el-dialog__header')
    const dragDom = el.querySelector('.el-dialog')
    if (!dialogHeaderEl || !dragDom) return
    dialogHeaderEl.style.cursor = 'move'

    const placeDialog = () => {
      if (!isWrapperVisible(el)) return
      dragDom.style.position = 'absolute'
      dragDom.style.marginTop = '0'
      dragDom.style.transform = 'none'
      let width = dragDom.style.width
      if (width && width.includes('%')) {
        width = document.body.clientWidth * (+width.replace(/%/g, '') / 100)
      } else {
        width = parseFloat(width) || dragDom.offsetWidth || 0
      }
      const vh = document.body.clientHeight || window.innerHeight || 0
      const vw = document.body.clientWidth || window.innerWidth || 0
      // 限制高度，避免超高内容把弹窗顶到视口外
      const maxH = Math.max(240, vh - 32)
      dragDom.style.maxHeight = `${maxH}px`
      const height = Math.min(dragDom.offsetHeight || 0, maxH)
      const left = Math.max(16, (vw - width) / 2)
      // 偏上居中（约 12vh），避免真垂直居中看起来偏下；底部留边
      let top = Math.round(vh * 0.12)
      if (top + height > vh - 16) {
        top = Math.max(16, vh - height - 16)
      }
      dragDom.style.left = `${left}px`
      dragDom.style.top = `${top}px`
    }

    const placeWhenReady = () => {
      placeDialog()
      requestAnimationFrame(() => {
        placeDialog()
        // 内容/滚动条渲染后再居中一次，避免首次高度偏小导致最终偏下
        setTimeout(placeDialog, 0)
        setTimeout(placeDialog, 50)
      })
    }

    // 打开时默认居中
    placeWhenReady()

    // 仅在「隐藏 → 显示」时重新居中；打开后拖动位置保留，直到下次打开
    let wasVisible = isWrapperVisible(el)
    const observer = new MutationObserver(() => {
      const visible = isWrapperVisible(el)
      if (visible && !wasVisible) {
        placeWhenReady()
      }
      wasVisible = visible
    })
    observer.observe(el, { attributes: true, attributeFilter: ['style', 'class'] })
    el.__dialogDragObserver = observer

    // 鼠标按下事件
    dialogHeaderEl.onmousedown = (e) => {
      // 鼠标按下，计算当前元素距离可视区的距离
      const disX = e.clientX - dialogHeaderEl.offsetLeft
      const disY = e.clientY - dialogHeaderEl.offsetTop

      // 每次按下都读当前 left/top，避免打开后二次定位导致拖动跳动
      const cur = window.getComputedStyle(dragDom, null)
      const styL = parseOffset(cur.left, document.body.clientWidth)
      const styT = parseOffset(cur.top, document.body.clientHeight)

      document.onmousemove = function(ev) {
        const finallyL = (ev.clientX - disX) + styL
        const finallyT = (ev.clientY - disY) + styT
        dragDom.style.left = `${finallyL}px`
        dragDom.style.top = `${finallyT}px`
      }

      document.onmouseup = function() {
        document.onmousemove = null
        document.onmouseup = null
      }
    }
  },
  unbind(el) {
    if (el.__dialogDragObserver) {
      el.__dialogDragObserver.disconnect()
      delete el.__dialogDragObserver
    }
  }
}
