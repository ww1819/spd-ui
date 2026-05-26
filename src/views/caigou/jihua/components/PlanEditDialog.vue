<template>
  <transition name="modal-fade">
    <div v-if="innerVisible" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="innerVisible" class="local-modal-content plan-edit-dialog">
          <div class="modal-header">
            <div class="modal-title">{{ title }}</div>
            <el-button size="small" @click="$emit('cancel')" class="close-btn">关闭</el-button>
          </div>
          <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">
            <div class="form-fields-container">
              <el-row :gutter="12" class="plan-form-row">
                <el-col :span="4">
                  <el-form-item label="单号" prop="planNo">
                    <el-input v-model="form.planNo" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId">
                    <SelectWarehouse v-model="form.warehouseId" :value2="warehouseLocked" excludeWarehouseType="设备"/>
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="制单时间" prop="planDate" class="plan-plan-date-item">
                    <el-input
                      :value="planCreateTimeDisplay"
                      :disabled="true"
                      placeholder="制单时间"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="操作人" prop="createBy">
                    <el-input :value="operatorName" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col :span="6">
                  <el-form-item label="联系电话" prop="telephone">
                    <el-input v-model="form.telephone" placeholder="联系电话" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="12" class="plan-form-row">
                <el-col :span="4">
                  <el-form-item label="采购员" prop="proPerson">
                    <SelectUser v-model="form.proPerson" v-if="editable"/>
                    <el-input :value="purchaserName" :disabled="true" v-else/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="总金额" prop="totalAmount">
                    <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="计划来源" prop="planSource">
                    <el-input :value="planSourceDisplay" disabled placeholder="由明细聚合" style="width: 100%;" />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="明细生成" prop="planEntryMode" class="plan-entry-mode-item">
                    <el-radio-group v-model="form.planEntryMode" :disabled="planEntryModeDisabled">
                      <el-radio label="1">按产品档案汇总</el-radio>
                      <el-radio label="2">按申购单明细拆分</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="form.referenceBillNo && String(form.referenceBillNo).trim()" :gutter="12" class="plan-form-row">
                <el-col :span="12">
                  <el-form-item label="引用申购单号" prop="referenceBillNo">
                    <el-button type="primary" link @click="$emit('show-apply-bills')">查看引用申购单号</el-button>
                  </el-form-item>
                </el-col>
              </el-row>
            </div>
            <div class="modal-detail-section">
              <el-row :gutter="10" class="detail-toolbar-row">
                <el-col :span="1.5"><span>计划明细信息</span></el-col>
                <template v-if="editable">
                  <el-col :span="1.5">
                    <el-button type="info" plain icon="el-icon-document" size="small" @click="$emit('reference-purchase')">引用申购单</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="small" @click="$emit('add-material')">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="$emit('delete-entries')">删除</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button size="small" @click="$emit('cancel')">取 消</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-check" size="small" :loading="submitLoading" :disabled="submitLoading" @click="$emit('submit')">确 定</el-button>
                  </el-col>
                </template>
              </el-row>
              <PlanEntryTable
                ref="entryTable"
                :list="entryList"
                :editable="editable"
                :table-height="tableHeight"
                :supplier-options="supplierOptions"
                :supplier-loading="supplierLoading"
                :header-form="form"
                :summary-method="summaryMethod"
                :supplier-display-fn="supplierDisplayFn"
                @selection-change="$emit('entry-selection-change', $event)"
                @qty-input="$emit('qty-input', $event)"
                @qty-blur="$emit('qty-blur', $event)"
                @view-apply-details="$emit('view-apply-details', $event)"
              />
            </div>
          </el-form>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectUser from '@/components/SelectModel/SelectUser'
import PlanEntryTable from './PlanEntryTable'

export default {
  name: 'PlanEditDialog',
  components: { SelectWarehouse, SelectUser, PlanEntryTable },
  props: {
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    form: { type: Object, required: true },
    rules: { type: Object, default: () => ({}) },
    editable: { type: Boolean, default: true },
    entryList: { type: Array, default: () => [] },
    userOptions: { type: Array, default: () => [] },
    supplierOptions: { type: Array, default: () => [] },
    supplierLoading: { type: Boolean, default: false },
    warehouseLocked: { type: Boolean, default: false },
    planEntryModeDisabled: { type: Boolean, default: false },
    planSourceDisplay: { type: String, default: '' },
    tableHeight: { type: String, default: 'max(260px, calc(100vh - 368px))' },
    summaryMethod: { type: Function, required: true },
    supplierDisplayFn: { type: Function, default: null },
    submitLoading: { type: Boolean, default: false }
  },
  computed: {
    innerVisible: {
      get() { return this.visible },
      set(v) { this.$emit('update:visible', v) }
    },
    operatorName() {
      if (this.form.creater && this.form.creater.nickName) return this.form.creater.nickName
      if (this.form.createBy) {
        const user = this.userOptions.find(u => u.userName === this.form.createBy || u.userId === this.form.createBy)
        return user ? (user.nickName || user.userName) : this.form.createBy
      }
      return ''
    },
    purchaserName() {
      if (!this.form.proPerson) return ''
      const user = this.userOptions.find(u => u.userId === this.form.proPerson || u.userId === String(this.form.proPerson))
      return user ? (user.nickName || user.userName) : ''
    },
    planCreateTimeDisplay() {
      const t = this.form.createTime || this.form.planDate
      return t ? this.parseTime(t, '{y}-{m}-{d} {h}:{i}') : ''
    }
  },
  methods: {
    validate(callback) {
      return this.$refs.form.validate(callback)
    },
    layoutEntryTable() {
      const t = this.$refs.entryTable
      if (t && typeof t.doLayout === 'function') t.doLayout()
    }
  }
}
</script>

<style lang="scss" scoped>
@import '../styles/plan-modal-common.scss';

.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container {
  padding: 14px 18px 16px;
  margin-bottom: 14px;
}

.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container .plan-form-row {
  margin-bottom: 14px;
}

.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container .plan-form-row:last-child {
  margin-bottom: 0;
}

.plan-edit-dialog ::v-deep .modal-detail-section {
  margin-top: 4px;
  padding-top: 8px;
}

.plan-edit-dialog ::v-deep .modal-detail-section .detail-toolbar-row {
  margin-bottom: 12px;
}

/* 覆盖 index 中 margin-left:0，保证标签与输入框同一行 */
.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container .el-form-item {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  margin-bottom: 0;
  min-height: 32px;
}

.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container .el-form-item__label {
  width: 70px !important;
  min-width: 70px;
  flex: 0 0 70px;
  float: none !important;
  white-space: nowrap;
  overflow: visible;
  text-overflow: clip;
  line-height: 32px;
  height: auto;
  padding-right: 8px;
}

.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container .el-form-item__content {
  flex: 1 1 auto;
  min-width: 0;
  margin-left: 0 !important;
  line-height: 32px;
}

.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container .el-input,
.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container .el-select {
  width: 100%;
  max-width: 100%;
}

.plan-edit-dialog ::v-deep .modal-form-compact .form-fields-container .el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
}

.plan-edit-dialog ::v-deep .modal-form-compact .plan-entry-mode-item .el-form-item__label {
  width: 130px !important;
  min-width: 130px;
  flex: 0 0 130px;
}

.plan-edit-dialog ::v-deep .modal-form-compact .plan-entry-mode-item .el-form-item__content {
  margin-left: 0 !important;
  flex: 1 1 auto;
}
</style>
