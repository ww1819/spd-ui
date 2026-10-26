<template>
    <el-dialog :title="dialogTitle" :visible.sync="open" width="960px" append-to-body :close-on-click-modal="false">
      <el-form ref="formRef" :model="form" label-width="100px" size="small">
        <el-row :gutter="16">
          <el-col :span="8">
            <el-form-item label="仓库" prop="warehouseId" :rules="[{ required: true, message: '请选择仓库', trigger: 'change' }]">
              <SelectWarehouse v-model="form.warehouseId" :disabled="form.auditStatus === 1" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="结算方式" prop="settlementMethod" :rules="[{ required: true, message: '请选择结算方式', trigger: 'change' }]">
              <el-select v-model="form.settlementMethod" placeholder="请选择" style="width: 100%" :disabled="!!form.id">
                <el-option label="入库结算" value="1" />
                <el-option label="出库结算" value="2" />
                <el-option label="消耗结算" value="3" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8" v-if="!form.id">
            <el-form-item label="日期范围">
              <el-date-picker
                v-model="extractDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始"
                end-placeholder="结束"
                value-format="yyyy-MM-dd"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row v-if="!form.id">
          <el-col :span="24">
            <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="doExtractData" :loading="extractLoading">提取数据</el-button>
            <span class="el-form-item__label" style="margin-left: 12px;">提取后将显示下方明细，可删除不需要的行再保存。</span>
          </el-col>
        </el-row>
      </el-form>
      <el-table v-if="form.id || (entryList && entryList.length)" :data="entryList" border max-height="320" size="small">
        <el-table-column type="index" label="序号" width="50" align="center" />
        <el-table-column prop="billNo" label="业务单号" min-width="140" show-overflow-tooltip />
        <el-table-column prop="materialName" label="产品名称" min-width="120" show-overflow-tooltip />
        <el-table-column prop="speci" label="规格" width="100" show-overflow-tooltip />
        <el-table-column prop="qty" label="数量" width="80" align="right" />
        <el-table-column prop="unitPrice" label="单价" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.unitPrice != null ? formatPrice(scope.row.unitPrice) : '--' }}</template>
        </el-table-column>
        <el-table-column prop="amt" label="金额" width="90" align="right">
          <template slot-scope="scope">{{ scope.row.amt != null ? this.formatAmount(scope.row.amt) : '--' }}</template>
        </el-table-column>
        <el-table-column v-if="form.id && form.auditStatus !== 1" label="操作" width="80" align="center" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="removeOneEntry(scope.row.id)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="open = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm" :loading="submitLoading">{{ form.id ? '保存明细' : '保存结算单' }}</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'

export default {
  name: 'WhSettlementEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'WhSettlement')],
  components: { SelectWarehouse },
  inheritAttrs: false
}
</script>
