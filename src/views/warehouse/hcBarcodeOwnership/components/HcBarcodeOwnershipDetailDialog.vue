<template>
    <el-dialog title="条码归属详情" :visible.sync="detailVisible" width="720px" append-to-body>
      <el-descriptions v-if="detail" :column="2" border size="small">
        <el-descriptions-item label="条码值">{{ detail.barcodeValue }}</el-descriptions-item>
        <el-descriptions-item label="高低值">{{ detail.valueLevel === '1' ? '高值' : (detail.valueLevel === '2' ? '低值' : detail.valueLevel) }}</el-descriptions-item>
        <el-descriptions-item label="业务类型">{{ detail.businessTypeName }}</el-descriptions-item>
        <el-descriptions-item label="单据号">{{ detail.billNo }}</el-descriptions-item>
        <el-descriptions-item label="耗材">{{ detail.materialName }}</el-descriptions-item>
        <el-descriptions-item label="规格">{{ detail.materialSpeci }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ detail.warehouseName }}</el-descriptions-item>
        <el-descriptions-item label="当前持有方">{{ detail.currentHolderType }}</el-descriptions-item>
        <el-descriptions-item label="当前仓库ID">{{ detail.currentWarehouseId }}</el-descriptions-item>
        <el-descriptions-item label="当前科室ID">{{ detail.currentDepartmentId }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ detail.status }}</el-descriptions-item>
        <el-descriptions-item label="主条码" :span="2">{{ detail.masterBarcode }}</el-descriptions-item>
        <el-descriptions-item label="副条码" :span="2">{{ detail.secondaryBarcode }}</el-descriptions-item>
      </el-descriptions>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="detailVisible = false">关 闭</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcBarcodeOwnershipDetailDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcBarcodeOwnership')],
  inheritAttrs: false
}
</script>
