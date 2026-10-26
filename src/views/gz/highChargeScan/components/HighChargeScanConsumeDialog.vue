<template>
    <el-dialog title="高值计费扫码消耗" :visible.sync="highDialogVisible" width="960px" append-to-body @closed="resetHighDialog">
      <div v-if="highMirrorRow" class="mb8">
        <span>患者 {{ highMirrorRow.patientName }} · 计费数量 {{ highMirrorRow.quantity }}</span>
        <span v-if="highBillRemaining != null"> · 待核销数量 {{ highBillRemaining }}</span>
        <span v-else> · 待核销数量 {{ highMirrorRow.quantity }}</span>
      </div>
      <el-form v-if="highMirrorRow" :model="highConsumeForm" label-width="88px" size="small" class="hc-high-dept-form mb8">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="开单科室">
              <span class="hc-high-dept-text">{{ mirrorOrderingDeptName(highMirrorRow) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="执行科室">
              <span class="hc-high-dept-text">{{ mirrorExecDeptName(highMirrorRow) }}</span>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="核销科室" required>
              <el-select
                v-model="highConsumeForm.consumeDepartmentId"
                placeholder="名称/编码/简拼"
                filterable
                :filter-method="filterConsumeDeptMethod"
                style="width:100%"
                @change="onHighConsumeDepartmentChange"
              >
                <el-option v-for="d in consumeDeptOptions" :key="d.id" :label="d.name" :value="d.id" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <el-alert type="warning" :closable="false" show-icon class="mb8" title="须一次性核销全部待核销数量（可扫多条院内码，保存时合计须与待核销数量一致）；不支持部分核销；冲销后可再次核销。" />
      <el-input
        ref="highScanInput"
        v-model="highScanCode"
        class="high-scan-input-ime-off"
        placeholder="扫描院内码（扫码枪自动识别）；手工输入后按回车"
        autocomplete="off"
        spellcheck="false"
        clearable
        :disabled="!highConsumeForm.consumeDepartmentId"
        @compositionstart="highScanComposing = true"
        @compositionend="onHighScanCompositionEnd"
        @input="onHighScanInput"
        @keydown.native="onHighScanKeydown"
      />
      <el-table :data="highLines" border size="small" class="mt8 high-consume-dialog-table" empty-text="请先扫码添加行">
        <el-table-column label="院内码" prop="inHospitalCode" min-width="220" align="left" class-name="high-col-code-wrap" />
        <el-table-column label="耗材" prop="materialName" min-width="120" show-overflow-tooltip />
        <el-table-column label="批次号" prop="batchNo" min-width="200" align="left" class-name="high-col-code-wrap" />
        <el-table-column label="虚拟库存" prop="gzAvailableQty" width="90" align="right" />
        <el-table-column label="本次消耗" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.applyQty }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="mini" @click="removeHighLine(scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="highDialogVisible = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="highSubmitting" :disabled="highLines.length === 0" @click="submitHighConsume">保存并审核</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HighChargeScanConsumeDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HighChargeScan')],
  inheritAttrs: false
}
</script>
