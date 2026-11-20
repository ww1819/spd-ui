const fs = require('fs')
const path = require('path')

const files = [
  'views/gzOrder/follow/components/GzFollowEditDialog.vue',
  'views/gzOrder/refund/components/GzOrderRefundEditDialog.vue',
  'views/gzOrder/audit/components/GzOrderAuditEditDialog.vue',
  'views/department/dApply/components/DApplyEditDialog.vue',
  'views/outWarehouse/refundDepotApply/components/RefundDepotApplyEditDialog.vue',
].map((p) => path.join(__dirname, '..', 'src', p))

const intKeyRe =
  /[ \t]*onkeyup="value=value\.replace\(\/\\D\/g,''\)"\r?\n[ \t]*onafterpaste="value=value\.replace\(\/\\D\/g,''\)"\r?\n/g

for (const file of files) {
  let s = fs.readFileSync(file, 'utf8')
  const orig = s
  s = s.replace(intKeyRe, '')
  if (!s.includes('@input="onQtyInput(scope.row)"')) {
    s = s.replace(
      /@input="qtyChange\(scope\.row\)"/g,
      '@input="onQtyInput(scope.row)"\n                          @blur="onQtyBlur(scope.row)"'
    )
  }
  // 去掉可能残留的无用 onafterpaste 单独行
  s = s.replace(/[ \t]*onafterpaste="value=value\.replace\(\/\\D\/g,''\)"\r?\n/g, '')
  s = s.replace(/[ \t]*onkeyup="value=value\.replace\(\/\\D\/g,''\)"\r?\n/g, '')
  if (s !== orig) {
    fs.writeFileSync(file, s, 'utf8')
    console.log('patched', file)
  } else {
    console.log('unchanged', file)
  }
}
