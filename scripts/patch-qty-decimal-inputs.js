/**
 * 批量替换各单据弹窗数量录入：去掉 onkeyup 尾点正则，改为 onQtyInput/onQtyBlur。
 * 运行：node scripts/patch-qty-decimal-inputs.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'src')

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, out)
    else if (name.endsWith('.vue')) out.push(p)
  }
  return out
}

const ONKEY_LINE =
  'onkeyup="value=(String(value).match(/^-?\\d*\\.?\\d{0,3}/)||[\'\'])[0]"'
const ONPASTE_LINE =
  'onafterpaste="value=(String(value).match(/^-?\\d*\\.?\\d{0,3}/)||[\'\'])[0]"'
const BLUR_FORM = '@blur="form.result=$event.target.value"'
const INPUT_QTY = '@input="qtyChange(scope.row)"'
const BLUR_STOCK = '@blur="handleStockQtyBlur(scope.row)"'
const INPUT_STOCK = '@input="stockQtyChange(scope.row)"'

const REPL_INPUT = '@input="onQtyInput(scope.row)"'
const REPL_BLUR = '@blur="onQtyBlur(scope.row)"'

function normalizeNewlines(s) {
  return s.replace(/\r\n/g, '\n')
}

function patchContent(s) {
  let text = normalizeNewlines(s)
  const lines = text.split('\n')
  const out = []
  let i = 0
  let touched = false

  while (i < lines.length) {
    const line = lines[i]
    const trim = line.trim()
    const indent = line.match(/^\s*/)[0]

    // onkeyup + onafterpaste (+ optional blur/input)
    if (trim === ONKEY_LINE && i + 1 < lines.length && lines[i + 1].trim() === ONPASTE_LINE) {
      let j = i + 2
      let hadBlurForm = false
      let hadInputQty = false
      let hadBlurStock = false
      let hadInputStock = false
      while (j < lines.length) {
        const t = lines[j].trim()
        if (t === BLUR_FORM) {
          hadBlurForm = true
          j++
          continue
        }
        if (t === INPUT_QTY) {
          hadInputQty = true
          j++
          continue
        }
        if (t === BLUR_STOCK) {
          hadBlurStock = true
          j++
          continue
        }
        if (t === INPUT_STOCK) {
          hadInputStock = true
          j++
          continue
        }
        break
      }
      out.push(`${indent}${REPL_INPUT}`)
      out.push(`${indent}${REPL_BLUR}`)
      // 若后面没有被消费的其它属性行，保持原后续
      // 已消费 blur/input，跳过
      i = j
      touched = true
      // 若既没有 qtyChange 也没有 stockQtyChange，仍替换为统一 handler
      void hadBlurForm
      void hadInputQty
      void hadBlurStock
      void hadInputStock
      continue
    }

    // 仅 blur form.result + qtyChange（无 onkeyup，或已部分替换）
    if (trim === BLUR_FORM && i + 1 < lines.length && lines[i + 1].trim() === INPUT_QTY) {
      out.push(`${indent}${REPL_INPUT}`)
      out.push(`${indent}${REPL_BLUR}`)
      i += 2
      touched = true
      continue
    }

    out.push(line)
    i++
  }

  return { text: out.join('\n'), touched }
}

let changed = 0
for (const file of walk(root)) {
  const orig = fs.readFileSync(file, 'utf8')
  const { text, touched } = patchContent(orig)
  if (!touched) continue
  // 保留原 CRLF 风格
  const finalText = orig.includes('\r\n') ? text.replace(/\n/g, '\r\n') : text
  if (finalText !== orig) {
    fs.writeFileSync(file, finalText, 'utf8')
    changed += 1
    console.log('patched', path.relative(root, file))
  }
}

console.log('done, files changed:', changed)
