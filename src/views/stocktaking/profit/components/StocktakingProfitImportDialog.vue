<template>
    <el-dialog
      title="导入盘盈明细"
      :visible.sync="profitImport.visible"
      width="1080px"
      append-to-body
      :close-on-click-modal="false"
      @close="resetProfitImportDialog"
    >
      <div style="margin-bottom: 10px; color: #606266; line-height: 1.6;">
        按模板填写 SPD 仓库/产品/供应商 ID 及盘盈数量等信息，系统将按<strong> SPD仓库ID </strong>自动拆分为多张未审核盘点单。
        <strong>SPD仓库ID、SPD产品档案ID、SPD供应商ID</strong> 均不能为空，且必须在系统中能匹配到对应档案，任一行校验失败则整单导入失败。
        批号、第三方批次号若以单引号开头，系统会自动去除（避免 Excel 数字格式问题）。有效期为空时默认设为 2099-01-01。
      </div>
      <el-form size="small" :inline="true">
        <el-form-item>
          <el-upload
            ref="profitImportUploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleProfitImportFileChange"
            :on-exceed="handleProfitImportExceed"
            accept=".xlsx,.xls"
            drag
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将 Excel 拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" :underline="false" @click="downloadProfitImportTemplate">下载模板</el-link>
        </el-form-item>
      </el-form>
      <div v-if="profitImport.warehouseSummary && profitImport.warehouseSummary.length" style="margin-bottom: 10px;">
        <span style="font-weight: 600;">将生成盘点单：</span>
        <el-tag
          v-for="(w, idx) in profitImport.warehouseSummary"
          :key="w.warehouseId || idx"
          size="small"
          style="margin-right: 8px; margin-top: 4px;"
        >{{ w.warehouseName || w.warehouseId }}（{{ w.rowCount }} 条）</el-tag>
      </div>
      <div v-if="profitImport.previewList && profitImport.previewList.length">
        <div style="margin-bottom: 8px;">
          预览共 {{ profitImport.previewList.length }} 行，有效 {{ profitImport.validRows }} 行
        </div>
        <el-table :data="profitImport.previewList" border size="small" max-height="320" v-loading="profitImport.previewLoading">
          <el-table-column label="行号" prop="rowIndex" width="60" align="center" />
          <el-table-column label="仓库" prop="warehouseName" width="100" show-overflow-tooltip />
          <el-table-column label="产品编码" prop="materialCode" width="110" show-overflow-tooltip />
          <el-table-column label="产品名称" prop="materialName" min-width="120" show-overflow-tooltip />
          <el-table-column label="供应商" prop="supplierName" width="100" show-overflow-tooltip />
          <el-table-column label="单价" width="80" align="right">
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.unitPrice }}</template>
          </el-table-column>
          <el-table-column label="数量" width="70" align="right">
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.qty }}</template>
          </el-table-column>
          <el-table-column label="批号" width="110" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.batchNumber }}</template>
          </el-table-column>
          <el-table-column label="第三方批次号" width="140" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.thirdPartyBatchNo }}</template>
          </el-table-column>
          <el-table-column label="有效期" width="100">
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.endDateRaw }}</template>
          </el-table-column>
          <el-table-column label="第三方库存明细ID" width="140" show-overflow-tooltip>
            <template slot-scope="scope">{{ scope.row.data && scope.row.data.hisId }}</template>
          </el-table-column>
          <el-table-column label="校验" width="160" fixed="right">
            <template slot-scope="scope">
              <span v-if="scope.row.error" style="color: #f56c6c;">{{ scope.row.error }}</span>
              <span v-else style="color: #67c23a;">通过</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <div slot="footer">
        <el-button class="spd-btn spd-btn--secondary" @click="profitImport.visible = false">取 消</el-button>
        <el-button
          type="primary"
          class="spd-btn spd-btn--primary"
          @click="confirmProfitImport"
          :loading="profitImport.confirmLoading"
          :disabled="!canConfirmProfitImport"
        >确认导入</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'StocktakingProfitImportDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InStocktaking' && vm.$el && vm.$el.classList && vm.$el.classList.contains('stocktaking-profit-page'))],
  inheritAttrs: false
}
</script>
