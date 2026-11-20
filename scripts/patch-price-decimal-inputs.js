/**
 * 可编辑单价/价格输入改为 onPriceInput / onPriceBlur。
 * 运行：node scripts/patch-price-decimal-inputs.js
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..', 'src')

function norm(s) {
  return s.replace(/\r\n/g, '\n')
}

const targets = [
  {
    file: 'views/gzDepartment/apply/components/GzDepartmentApplyEditDialog.vue',
    from: `<el-input v-model="scope.row.unitPrice" type='number' @input="priceChange(scope.row)" placeholder="单价" />`,
    to: `<el-input v-model="scope.row.unitPrice" clearable @input="onPriceInput(scope.row)" @blur="onPriceBlur(scope.row)" placeholder="单价" />`,
  },
  {
    file: 'views/gzDepartment/audit/components/GzDepartmentAuditEditDialog.vue',
    from: `<el-input v-model="scope.row.unitPrice" type='number' @input="priceChange(scope.row)" placeholder="单价" />`,
    to: `<el-input v-model="scope.row.unitPrice" clearable @input="onPriceInput(scope.row)" @blur="onPriceBlur(scope.row)" placeholder="单价" />`,
  },
  {
    file: 'views/department/stocktaking/components/DeptStocktakingNewEntryDialog.vue',
    from: `<el-input v-model="scope.row.unitPrice" type="number" placeholder="请输入单价" @input="priceChange(scope.row)" />`,
    to: `<el-input v-model="scope.row.unitPrice" clearable placeholder="请输入单价" @input="onPriceInput(scope.row)" @blur="onPriceBlur(scope.row)" />`,
  },
  {
    file: 'views/stocktaking/in/components/StocktakingInNewEntryDialog.vue',
    from: `<el-input v-model="scope.row.unitPrice" type="number" placeholder="请输入单价" @input="priceChangePending(scope.row)" />`,
    to: `<el-input v-model="scope.row.unitPrice" clearable placeholder="请输入单价" @input="onPriceInput(scope.row)" @blur="onPriceBlur(scope.row)" />`,
  },
  {
    file: 'views/stocktaking/in/components/StocktakingInEditDialog.vue',
    from: `<el-input v-if="!scope.row.kcNo && detailEditable" v-model="scope.row.price" type="number" @input="priceChange(scope.row)" placeholder="单价" />`,
    to: `<el-input v-if="!scope.row.kcNo && detailEditable" v-model="scope.row.price" clearable @input="onPriceInput(scope.row, 'price')" @blur="onPriceBlur(scope.row, 'price')" placeholder="单价" />`,
  },
  {
    file: 'views/department/newProductApply/components/NewProductApplyEditDialog.vue',
    from: `<el-input clearable v-model="scope.row.price" placeholder="单价"
                        @input="priceChange(scope.row)"
              />`,
    to: `<el-input clearable v-model="scope.row.price" placeholder="单价"
                        @input="onPriceInput(scope.row, 'price')"
                        @blur="onPriceBlur(scope.row, 'price')"
              />`,
  },
  {
    file: 'views/inWarehouse/apply/components/InWarehouseApplyEditDialog.vue',
    from: `<el-input v-model="form.invoiceAmount" placeholder="发票金额" />`,
    to: `<el-input v-model="form.invoiceAmount" placeholder="发票金额" @input="onFormDecimalInput(form, 'invoiceAmount')" @blur="onFormDecimalBlur(form, 'invoiceAmount')" />`,
  },
  {
    file: 'views/inWarehouse/audit/components/InWarehouseAuditEditDialog.vue',
    from: `<el-input v-model="form.invoiceAmount" placeholder="发票金额" />`,
    to: `<el-input v-model="form.invoiceAmount" placeholder="发票金额" @input="onFormDecimalInput(form, 'invoiceAmount')" @blur="onFormDecimalBlur(form, 'invoiceAmount')" />`,
  },
  {
    file: 'views/inWarehouse/refundGoodsApply/components/RefundGoodsApplyEditDialog.vue',
    from: `<el-input v-model="form.invoiceAmount" placeholder="发票金额" />`,
    to: `<el-input v-model="form.invoiceAmount" placeholder="发票金额" @input="onFormDecimalInput(form, 'invoiceAmount')" @blur="onFormDecimalBlur(form, 'invoiceAmount')" />`,
  },
  {
    file: 'views/settlement/apply/components/SettlementApplyEditDialog.vue',
    from: `<el-input v-model="form.invoiceAmount" placeholder="发票金额" />`,
    to: `<el-input v-model="form.invoiceAmount" placeholder="发票金额" @input="onFormDecimalInput(form, 'invoiceAmount')" @blur="onFormDecimalBlur(form, 'invoiceAmount')" />`,
  },
  {
    file: 'views/foundation/testinfo/components/TestinfoEditDialog.vue',
    from: `<el-input v-model="form.price" placeholder="价格" />`,
    to: `<el-input v-model="form.price" placeholder="价格" @input="onFormDecimalInput(form, 'price')" @blur="onFormDecimalBlur(form, 'price')" />`,
  },
  {
    file: 'views/foundation/material/components/MaterialEditDialog.vue',
    from: `<el-input v-model="form.price" placeholder="请输入单价" />`,
    to: `<el-input v-model="form.price" placeholder="请输入单价" @input="onFormDecimalInput(form, 'price')" @blur="onFormDecimalBlur(form, 'price')" />`,
  },
  {
    file: 'views/foundation/material/components/MaterialEditDialog.vue',
    from: `<el-input v-model="form.sunshinePrice" placeholder="单价" />`,
    to: `<el-input v-model="form.sunshinePrice" placeholder="单价" @input="onFormDecimalInput(form, 'sunshinePrice')" @blur="onFormDecimalBlur(form, 'sunshinePrice')" />`,
  },
]

let changed = 0
for (const t of targets) {
  const p = path.join(root, t.file)
  if (!fs.existsSync(p)) {
    console.log('missing', t.file)
    continue
  }
  const raw = fs.readFileSync(p, 'utf8')
  const useCrlf = raw.includes('\r\n')
  let s = norm(raw)
  const from = norm(t.from)
  const to = norm(t.to)
  if (!s.includes(from)) {
    console.log('skip-not-found', t.file)
    continue
  }
  s = s.replace(from, to)
  fs.writeFileSync(p, useCrlf ? s.replace(/\n/g, '\r\n') : s, 'utf8')
  changed += 1
  console.log('patched', t.file)
}
console.log('done', changed)
