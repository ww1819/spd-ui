<template>
    <!-- UDI 扫描核对 -->
    <el-dialog
      title="UDI 扫描核对"
      :visible.sync="udiScanDialog.visible"
      width="96%"
      top="4vh"
      append-to-body
      :close-on-click-modal="false"
      custom-class="udi-scan-verify-dialog"
      @closed="onUdiScanDialogClosed"
    >
      <el-form label-width="88px" size="small" v-loading="udiScanDialog.loading">
        <el-form-item label="扫描结果">
          <el-input
            v-model="udiScanDialog.scanResult"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="请扫描或粘贴完整条码"
            class="udi-scan-mono"
            @input="onUdiScanResultInput"
          />
        </el-form-item>
        <el-form-item>
          <el-button size="mini" type="primary" :loading="udiScanDialog.loading" @click="parseUdiScanDialog">解析</el-button>
        </el-form-item>
        <el-form-item label="主条码">
          <el-input
            v-model="udiScanDialog.masterBarcode"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="GTIN / 主条码，可手工修正"
            class="udi-scan-mono"
          />
        </el-form-item>
        <el-form-item label="辅条码">
          <el-input
            v-model="udiScanDialog.secondaryBarcode"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="生产日期、批号、序列号等段，可手工修正"
            class="udi-scan-mono"
          />
        </el-form-item>
        <el-form-item label="耗材信息" class="udi-scan-preview-form-item">
          <el-table
            :data="udiScanPreviewTableData"
            border
            size="small"
            empty-text="请点击「解析」自动检索产品；列与单据明细一致，批号/生产日期/有效期可编辑"
            class="udi-scan-preview-table"
          >
            <el-table-column label="耗材编码" align="center" prop="materialCode" width="110" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="耗材名称" align="center" prop="materialName" width="130" show-overflow-tooltip>
              <template slot-scope="scope">{{ scope.row.materialName || '--' }}</template>
            </el-table-column>
            <el-table-column label="规格" align="center" prop="speci" width="90" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="型号" align="center" prop="model" width="90" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.model || (scope.row.material && scope.row.material.model) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="单位" align="center" prop="unit" width="70" show-overflow-tooltip>
              <template slot-scope="scope">
                <span v-if="scope.row.unit">
                  {{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}
                </span>
                <span v-else-if="scope.row.material">
                  {{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}
                </span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="数量" align="center" prop="qty" width="70">
              <template slot-scope="scope">{{ scope.row.qty != null ? scope.row.qty : '1' }}</template>
            </el-table-column>
            <el-table-column label="价格" align="center" prop="price" width="88">
              <template slot-scope="scope">
                {{ scope.row.price ? formatPrice(scope.row.price) : '0.00' }}
              </template>
            </el-table-column>
            <el-table-column label="金额" align="center" prop="amt" width="88">
              <template slot-scope="scope">{{ scope.row.amt || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="总金额" align="center" width="88">
              <template slot-scope="scope">{{ scope.row.amt || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="批号" align="center" prop="batchNumber" min-width="140">
              <template slot-scope="scope">
                <el-input v-model="scope.row.batchNumber" placeholder="批号" size="small" class="gz-detail-cell-input" />
              </template>
            </el-table-column>
            <el-table-column label="生产日期" align="center" prop="beginTime" width="150">
              <template slot-scope="scope">
                <el-date-picker
                  v-model="scope.row.beginTime"
                  class="gz-detail-cell-date"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerBeginTimeOptions"
                  placeholder="生产日期"
                  size="small"
                  clearable
                />
              </template>
            </el-table-column>
            <el-table-column label="有效期" align="center" prop="endTime" width="150">
              <template slot-scope="scope">
                <el-date-picker
                  v-model="scope.row.endTime"
                  class="gz-detail-cell-date"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerEndTimeOptions"
                  placeholder="有效期"
                  size="small"
                  clearable
                />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <div v-if="udiScanDialog.lookupHint" class="udi-scan-hint udi-scan-hint-block">{{ udiScanDialog.lookupHint }}</div>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="udiScanDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="udiScanDialog.loading" @click="confirmUdiScanAddToEntry">添加到明细</el-button>
      </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'GzOrderApplyUdiScanDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Apply' && vm.gzOrderEntryList !== undefined)],
  inheritAttrs: false
}
</script>
