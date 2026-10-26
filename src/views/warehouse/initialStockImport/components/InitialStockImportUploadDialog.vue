<template>
    <el-dialog title="期初库存导入" :visible.sync="upload.visible" width="900px" append-to-body :close-on-click-modal="false">
      <el-form size="small" :inline="true">
        <el-form-item label="所属仓库">
          <SelectWarehouse v-model="upload.warehouseId" placeholder="请选择仓库（可与Excel中一致）" style="width: 260px" />
        </el-form-item>
        <el-form-item>
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            :on-change="handleFileChange"
            :on-exceed="handleExceed"
            accept=".xlsx,.xls"
            drag
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
          </el-upload>
        </el-form-item>
        <el-form-item>
          <el-link type="primary" :underline="false" @click="downloadTemplate">下载模板</el-link>
        </el-form-item>
      </el-form>
      <div v-if="upload.previewList && upload.previewList.length" style="margin-top: 12px;">
        <div style="margin-bottom: 8px;">预览（共 {{ upload.previewList.length }} 条），确认无误后点击「确认导入」生成期初单</div>
        <el-table :data="upload.previewList" border size="small" max-height="280">
          <el-table-column type="index" label="行号" width="55" align="center" />
          <el-table-column label="产品编码" prop="data.materialCode" min-width="90" show-overflow-tooltip />
          <el-table-column label="产品名称" prop="data.materialName" min-width="90" show-overflow-tooltip />
          <el-table-column label="HIS产品档案id" prop="data.thirdPartyMaterialId" width="120" show-overflow-tooltip />
          <el-table-column label="规格" prop="data.speci" width="90" show-overflow-tooltip />
          <el-table-column label="型号" prop="data.model" width="90" show-overflow-tooltip />
          <el-table-column label="注册证号" prop="data.registerNo" width="100" show-overflow-tooltip />
          <el-table-column label="医保编码" prop="data.medicalNo" width="90" show-overflow-tooltip />
          <el-table-column label="医保名称" prop="data.medicalName" width="90" show-overflow-tooltip />
          <el-table-column label="主条码" prop="data.mainBarcode" width="100" show-overflow-tooltip />
          <el-table-column label="库房分类" prop="data.warehouseCategory" width="90" show-overflow-tooltip />
          <el-table-column label="财务分类" prop="data.financeCategory" width="90" show-overflow-tooltip />
          <el-table-column label="单价" prop="data.unitPrice" width="80" align="right" />
          <el-table-column label="数量" prop="data.qty" width="70" align="right" />
          <el-table-column label="批号" prop="data.batchNumber" width="90" show-overflow-tooltip />
          <el-table-column label="生产日期" prop="data.beginDateRaw" width="100" show-overflow-tooltip />
          <el-table-column label="效期" prop="data.endDateRaw" width="100" show-overflow-tooltip />
          <el-table-column label="生产厂家" prop="data.factoryName" width="90" show-overflow-tooltip />
          <el-table-column label="HIS生产厂家id" prop="data.hisFactoryId" width="110" show-overflow-tooltip />
          <el-table-column label="供应商" prop="data.supplierName" width="90" show-overflow-tooltip />
          <el-table-column label="HIS供应商id" prop="data.hisSupplierId" width="110" show-overflow-tooltip />
          <el-table-column label="第三方库存明细ID(his_id)" prop="data.hisId" width="140" show-overflow-tooltip />
          <el-table-column label="校验" width="120">
            <template slot-scope="scope">
              <span v-if="scope.row.error" style="color: #f56c6c;">{{ scope.row.error }}</span>
              <span v-else style="color: #67c23a;">通过</span>
            </template>
          </el-table-column>
        </el-table>
        <div slot="footer" style="margin-top: 12px; text-align: right;">
          <el-button class="spd-btn spd-btn--secondary" @click="upload.visible = false">取 消</el-button>
          <el-button type="primary" class="spd-btn spd-btn--primary" @click="confirmImport" :loading="upload.confirmLoading" :disabled="!canConfirmImport">确认导入</el-button>
        </div>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'InitialStockImportUploadDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'InitialStockImport')],
  components: { SelectWarehouse },
  inheritAttrs: false
}
</script>
