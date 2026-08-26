const fs = require('fs');
const path = 'e:/workspace/spd-ui/src/views/gzOrder/apply/index.vue';
let text = fs.readFileSync(path, 'utf8');
const nl = text.includes('\r\n') ? '\r\n' : '\n';

// --- 1. Root + form opening ---
text = text.replace(
  '<div v-if="open" class="local-modal-content">',
  '<div v-if="open" class="local-modal-content apply-modal-root-content">'
);
text = text.replace(
  '<el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">',
  '<el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>'
);

// --- 2. Query panel wrapper ---
text = text.replace(
  '              <!-- 顶部条件容器 -->' + nl + '              <div class="form-fields-container">',
  '              <div class="form-fields-container list-query-panel apply-modal-query-panel">'
);

// --- 3. Row 1 ---
const oldRow1 = `                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="验收单号" prop="orderNo">
                      <el-input v-model="form.orderNo" :disabled="true" style="width: 220px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId">
                      <SelectWarehouse ref="formWarehouseSelect" v-model="form.warehouseId" :value2="gzOrderEntryList.length > 0" :disabled="warehouseAutoFilled" includeWarehouseType="高值" blockDisabledForInbound disabledWarehouseMessage="该仓库已经停用，不能进行备货入库"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="供应商" prop="supplerId">
                      <SelectSupplier v-model="form.supplerId" :value2="gzOrderEntryList.length > 0"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input v-model="form.creatorName" :disabled="true" style="width: 180px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="orderDate" label-width="70px" style="white-space: nowrap;">
                      <el-date-picker clearable
                                      v-model="form.orderDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 140px"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="审核人" prop="auditBy">
                      <el-input v-model="form.auditorName" :disabled="true" style="width: 140px" />
                    </el-form-item>
                  </el-col>
                </el-row>`;

const newRow1 = `                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="验收单号" prop="orderNo" class="form-item-header-billno">
                      <el-input v-model="form.orderNo" :disabled="true" :title="form.orderNo || ''" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse ref="formWarehouseSelect" v-model="form.warehouseId" :value2="gzOrderEntryList.length > 0" :disabled="warehouseAutoFilled || isAudited" includeWarehouseType="高值" blockDisabledForInbound disabledWarehouseMessage="该仓库已经停用，不能进行备货入库"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="供应商" prop="supplerId" class="apply-modal-label-required">
                      <SelectSupplier v-model="form.supplerId" :value2="gzOrderEntryList.length > 0" :disabled="isAudited"/>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input v-model="form.creatorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="orderDate" class="apply-modal-label-required">
                      <el-date-picker
                        clearable
                        v-model="form.orderDate"
                        type="date"
                        :disabled="true"
                        value-format="yyyy-MM-dd"
                        placeholder="请选择制单日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人" prop="auditBy">
                      <el-input v-model="form.auditorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>`;

if (!text.includes(oldRow1.replace(/\n/g, nl))) {
  console.warn('WARN: row1 block not found exactly');
} else {
  text = text.replace(oldRow1.replace(/\n/g, nl), newRow1.replace(/\n/g, nl));
}

// --- 4. Row 2 ---
const oldRow2 = `                <el-row :gutter="8">
                  <el-col :span="8">
                    <el-form-item label="UDI码" prop="ztm">
                      <div class="udi-scan-inline">
                        <el-input v-model="form.ztm"
                                  class="udi-scan-inline-input"
                                  :placeholder="form.warehouseId ? '请扫描UDI码' : '请先选择仓库'"
                                  clearable
                                  :disabled="!form.warehouseId || isAudited"
                                  @input="onZtmInput"
                                  @paste.native="onZtmPaste"
                                  @keyup.enter.native="openUdiScanDialog"
                        />
                        <el-button
                          type="primary"
                          icon="el-icon-full-screen"
                          :disabled="!form.warehouseId || isAudited"
                          @click="openUdiScanDialog"
                        >扫描</el-button>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="辅条码" prop="ftm">
                      <el-input v-model="form.ftm"
                                placeholder="请扫描辅条码"
                                clearable
                                style="width: 140px"
                                @keydown.enter.native.prevent="sm2"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input :value="getTotalAmount()" :disabled="true" style="width: 140px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="审核日期" prop="auditDate" label-width="70px" style="white-space: nowrap;">
                      <el-date-picker clearable
                                      v-model="form.auditDate"
                                      type="datetime"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd HH:mm:ss"
                                      style="width: 160px"
                                      placeholder="请选择审核日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="isAudited" />
                    </el-form-item>
                  </el-col>
                </el-row>`;

const newRow2 = `                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second apply-modal-row-third" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--grow udi-scan-field">
                    <el-form-item label="UDI码" prop="ztm" class="detail-scan-form-item">
                      <div class="udi-scan-inline">
                        <el-input
                          v-model="form.ztm"
                          class="udi-scan-inline-input"
                          :placeholder="form.warehouseId ? '请扫描UDI码' : '请先选择仓库'"
                          clearable
                          :disabled="!form.warehouseId || isAudited"
                          @input="onZtmInput"
                          @paste.native="onZtmPaste"
                          @keyup.enter.native="openUdiScanDialog"
                        />
                        <el-button
                          type="primary"
                          icon="el-icon-full-screen"
                          size="small"
                          :disabled="!form.warehouseId || isAudited"
                          @click="openUdiScanDialog"
                        >扫描</el-button>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="辅条码" prop="ftm">
                      <el-input
                        v-model="form.ftm"
                        placeholder="请扫描辅条码"
                        clearable
                        :disabled="isAudited"
                        @keydown.enter.native.prevent="sm2"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input :value="getTotalAmount()" :disabled="true" class="input-total-amount-inline" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="审核日期" prop="auditDate">
                      <el-date-picker
                        clearable
                        v-model="form.auditDate"
                        type="datetime"
                        :disabled="true"
                        value-format="yyyy-MM-dd HH:mm:ss"
                        placeholder="请选择审核日期"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="isAudited" />
                    </el-form-item>
                  </el-col>
                </el-row>`;

if (!text.includes(oldRow2.replace(/\n/g, nl))) {
  console.warn('WARN: row2 block not found exactly');
} else {
  text = text.replace(oldRow2.replace(/\n/g, nl), newRow2.replace(/\n/g, nl));
}

// --- 5. Toolbar ---
const oldToolbar = `              <div class="modal-detail-section">
                <div class="detail-toolbar-row detail-toolbar-head">
                  <div class="detail-toolbar-left">
                    <span class="detail-toolbar-title">高值备货明细</span>`;

const newToolbar = `              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">高值备货明细</span>`;

text = text.replace(oldToolbar.replace(/\n/g, nl), newToolbar.replace(/\n/g, nl));

// Close toolbar row - find pattern after cancel button in view mode
text = text.replace(
  `                    >打印条码</el-button>
                  </div>
                </div>
                <div class="table-wrapper">`,
  `                    >打印条码</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">`
);

// --- 6. Table class ---
text = text.replace(
  `<el-table :data="gzOrderEntryList" :row-class-name="rowGzOrderEntryIndex"
                          @selection-change="handleGzOrderEntrySelectionChange"
                          ref="gzOrderEntry"
                          border`,
  `<el-table :data="gzOrderEntryList"
                          class="apply-detail-table"
                          :row-class-name="rowGzOrderEntryIndex"
                          @selection-change="handleGzOrderEntrySelectionChange"
                          ref="gzOrderEntry"
                          border`
);

// --- 7. detailTableHeight align ---
text = text.replace(
  `    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    },`,
  `    detailTableHeight() {
      return 'max(240px, calc(100vh - 384px))';
    },`
);

// --- 8. Scoped: import plan-modal-common ---
if (!text.includes('plan-modal-common.scss')) {
  text = text.replace(
    '<style scoped>' + nl,
    '<style scoped>' + nl + "@import '../../caigou/jihua/styles/plan-modal-common.scss';" + nl + nl
  );
}

// --- 9. Scoped style patches ---
const stylePatches = [
  [
    `.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
  min-height: 40px;
}`,
    `.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
  min-height: 40px;
}`
  ],
  [
    `.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}`,
    `.local-modal-content .el-form {
  flex: 1;
  min-height: 0;
  overflow: visible;
  padding: 8px 0 8px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}`
  ],
  [
    `.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}`,
    `.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}`
  ],
  [
    `.local-modal-content .modal-detail-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}`,
    `.local-modal-content .modal-detail-section {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  box-sizing: border-box;
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}`
  ],
];

for (const [from, to] of stylePatches) {
  const fromNL = from.replace(/\n/g, nl);
  const toNL = to.replace(/\n/g, nl);
  if (text.includes(fromNL)) text = text.replace(fromNL, toNL);
  else console.warn('WARN style miss:', from.slice(0, 50));
}

// Insert apply-detail-table row height + udi field styles before modal-detail-section detail-toolbar (if not exists)
const insertMarker = '.local-modal-content .modal-detail-section .detail-toolbar-row {';
const insertBlock = `.local-modal-content .apply-modal-query-panel,
.local-modal-content .apply-modal-toolbar.list-toolbar,
.local-modal-content .apply-modal-table-panel {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.local-modal-content .apply-modal-query-panel .apply-modal-field--grow.udi-scan-field .udi-scan-inline {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.local-modal-content .apply-modal-query-panel .udi-scan-field .udi-scan-inline-input {
  flex: 1 1 auto;
  min-width: 0;
}

.local-modal-content .input-total-amount-inline >>> .el-input__inner {
  font-weight: 600;
  color: #409eff;
}

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 28px;
  min-height: 28px;
  box-sizing: border-box;
}

.local-modal-content .modal-detail-section .apply-detail-table ::v-deep thead th.el-table__cell {
  padding: 4px 0 !important;
}

`;

if (text.includes(insertMarker) && !text.includes('.local-modal-content .modal-detail-section .apply-detail-table')) {
  text = text.replace(insertMarker, insertBlock + insertMarker);
}

// --- 10. Non-scoped: query white card + row height ---
const nonScopedBlock = `
/* 弹窗查询区白卡片 + 表头 inline-flex + 明细行高（对齐到货验收） */
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel.list-query-panel,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel.form-fields-container {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding: 12px 8px !important;
  background: #fff !important;
  border: 1px solid #e2e8f0 !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04) !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-row-third .detail-scan-form-item .el-form-item__label {
  white-space: nowrap;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow {
  flex: 1 1 auto !important;
  min-width: 240px;
  max-width: none !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item {
  width: 100%;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--grow .el-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-input__inner,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-select .el-input__inner,
.app-container.gz-order-apply-page .local-modal-content .apply-modal-query-panel .el-date-editor .el-input__inner {
  height: 28px !important;
  min-height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
  box-sizing: border-box !important;
  border-color: #e2e8f0 !important;
  border-radius: 6px !important;
}

.app-container.gz-order-apply-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table tbody td.el-table__cell {
  padding: 4px 0 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table tbody td.el-table__cell > .cell {
  line-height: 28px !important;
  min-height: 28px !important;
  box-sizing: border-box;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .gz-qty-cell-input .el-input__inner,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .gz-detail-cell-input .el-input__inner,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .apply-detail-table .gz-detail-cell-date .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  min-height: 28px !important;
}
`;

if (!text.includes('gz-order-apply-page .local-modal-content .apply-modal-query-panel.list-query-panel')) {
  const lastStyle = text.lastIndexOf('</style>');
  if (lastStyle > 0) {
    text = text.slice(0, lastStyle) + nonScopedBlock.replace(/\n/g, nl) + nl + text.slice(lastStyle);
  }
}

fs.writeFileSync(path, text, 'utf8');
console.log('patched gzOrder apply modal');
console.log('checks:', {
  root: text.includes('apply-modal-root-content'),
  query: text.includes('apply-modal-query-panel'),
  toolbar: text.includes('apply-modal-toolbar'),
  table: text.includes('class="apply-detail-table"'),
  import: text.includes('plan-modal-common'),
  white: text.includes('gz-order-apply-page .local-modal-content .apply-modal-query-panel.list-query-panel'),
});
