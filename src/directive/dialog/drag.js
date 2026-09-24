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
      dragDom.style.position = 'absolute'
      dragDom.style.marginTop = '0'
      dragDom.style.transform = 'none'
      let width = dragDom.style.width
      if (width && width.includes('%')) {
        width = document.body.clientWidth * (+width.replace(/%/g, '') / 100)
      } else {
        width = parseFloat(width) || dragDom.offsetWidth || 0
      }
      const height = dragDom.offsetHeight || 0
      const left = Math.max(16, (document.body.clientWidth - width) / 2)
      const top = Math.max(96, (document.body.clientHeight - height) / 2)
      dragDom.style.left = `${left}px`
      dragDom.style.top = `${top}px`
    }

    // 打开时默认居中（避免贴在页面最上方）
    placeDialog()
    // 高度未算准时再居中一次
    requestAnimationFrame(placeDialog)

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
  }
}
