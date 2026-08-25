<template>
  <transition name="modal-fade">
    <div v-if="innerVisible" class="local-modal-mask plan-edit-modal-root">
      <transition name="modal-zoom">
        <div v-if="innerVisible" class="local-modal-content apply-modal-root-content plan-edit-dialog">
          <div class="modal-header">
            <div class="modal-title">{{ title }}</div>
            <el-button size="small" @click="$emit('cancel')" class="close-btn">关闭</el-button>
          </div>
          <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
            <div class="form-fields-container list-query-panel apply-modal-query-panel">
              <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                <el-col class="apply-modal-field apply-modal-field--compact">
                  <el-form-item label="单号" prop="planNo" class="form-item-header-billno">
                    <el-input v-model="form.planNo" :disabled="true" :title="form.planNo || ''" />
                  </el-form-item>
                </el-col>
                <el-col class="apply-modal-field apply-modal-field--standard">
                  <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                    <SelectWarehouse v-model="form.warehouseId" :value2="warehouseLocked" excludeWarehouseType="设备"/>
                  </el-form-item>
                </el-col>
                <el-col class="apply-modal-field apply-modal-field--compact plan-field-is-gz">
                  <el-form-item label="高值/低值" prop="isGz" class="apply-modal-label-required">
                    <el-select v-model="form.isGz" placeholder="请选择" clearable :disabled="!editable || headerLocked">
                      <el-option label="高值" value="1" />
                      <el-option label="低值" value="2" />
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col class="apply-modal-field apply-modal-field--date plan-field-plan-date">
                  <el-form-item label="制单时间" prop="planDate" class="apply-modal-label-required">
                    <el-input :value="planCreateTimeDisplay" :disabled="true" placeholder="制单时间" />
                  </el-form-item>
                </el-col>
                <el-col class="apply-modal-field apply-modal-field--standard">
                  <el-form-item label="操作人" prop="createBy">
                    <el-input :value="operatorName" :disabled="true" />
                  </el-form-item>
                </el-col>
                <el-col class="apply-modal-field apply-modal-field--compact plan-field-phone">
                  <el-form-item label="联系电话" prop="telephone">
                    <el-input v-model="form.telephone" placeholder="联系电话" />
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                <el-col class="apply-modal-field apply-modal-field--standard">
                  <el-form-item label="采购员" prop="proPerson">
                    <SelectUser v-model="form.proPerson" v-if="editable"/>
                    <el-input :value="purchaserName" :disabled="true" v-else/>
                  </el-form-item>
                </el-col>
                <el-col class="apply-modal-field apply-modal-field--standard">
                  <el-form-item label="总金额" prop="totalAmount">
                    <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
                  </el-form-item>
                </el-col>
                <el-col class="apply-modal-field apply-modal-field--standard">
                  <el-form-item label="计划来源" prop="planSource">
                    <el-input :value="planSourceDisplay" disabled placeholder="由明细聚合" />
                  </el-form-item>
                </el-col>
                <el-col class="apply-modal-field apply-modal-field--grow plan-entry-mode-item">
                  <el-form-item label="明细生成" prop="planEntryMode">
                    <el-radio-group v-model="form.planEntryMode" :disabled="planEntryModeDisabled">
                      <el-radio label="1">按产品档案汇总</el-radio>
                      <el-radio label="2">按申购单明细拆分</el-radio>
                    </el-radio-group>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row v-if="form.referenceBillNo && String(form.referenceBillNo).trim()" :gutter="0" class="apply-modal-form-row" type="flex">
                <el-col class="apply-modal-field apply-modal-field--grow">
                  <el-form-item label="引用申购单号" prop="referenceBillNo">
                    <el-button type="primary" link @click="$emit('show-apply-bills')">查看引用申购单号</el-button>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-third" type="flex">
                <el-col class="apply-modal-field apply-modal-field--grow">
                  <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!editable" />
                  </el-form-item>
                </el-col>
              </el-row>
            </div>

            <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
              <div class="list-toolbar-left">
                <span class="apply-modal-detail-title">计划明细信息</span>
                <template v-if="editable">
                  <el-button type="primary" icon="el-icon-document" size="small" class="spd-btn spd-btn--secondary" @click="$emit('reference-purchase')">引用申购单</el-button>
                  <el-button type="primary" icon="el-icon-plus" size="small" class="spd-btn spd-btn--primary" @click="$emit('add-material')">添加</el-button>
                  <el-button type="danger" icon="el-icon-delete" size="small" class="spd-btn" @click="$emit('delete-entries')">删除</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="$emit('cancel')">取 消</el-button>
                  <el-button type="primary" icon="el-icon-check" size="small" class="spd-btn spd-btn--primary" :loading="submitLoading" :disabled="submitLoading" @click="$emit('submit')">确 定</el-button>
                </template>
              </div>
            </el-row>

            <div class="modal-detail-section apply-modal-table-panel">
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
                :detail-selected-row-map="detailSelectedRowMap"
                @selection-change="$emit('entry-selection-change', $event)"
                @qty-input="$emit('qty-input', $event)"
                @qty-blur="$emit('qty-blur', $event)"
                @view-apply-details="$emit('view-apply-details', $event)"
              />
            </div>
          </el-form>
          <SelectMMaterialFilter
            v-if="materialPickerVisible"
            nested
            :DialogComponentShow="materialPickerVisible"
            :supplierValue="materialPickerSupplier"
            :warehouseValue="form.warehouseId"
            :isGzValue="form.isGz"
            :excludeMaterialIds="materialPickerExcludeIds"
            @closeDialog="$emit('material-picker-close')"
            @selectData="$emit('material-picker-select', $event)"
          />
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
import SelectUser from '@/components/SelectModel/SelectUser'
import PlanEntryTable from './PlanEntryTable'
import SelectMMaterialFilter from '@/components/SelectModel/SelectMMaterialFilter'

export default {
  name: 'PlanEditDialog',
  components: { SelectWarehouse, SelectUser, PlanEntryTable, SelectMMaterialFilter },
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
    headerLocked: { type: Boolean, default: false },
    planEntryModeDisabled: { type: Boolean, default: false },
    planSourceDisplay: { type: String, default: '' },
    tableHeight: { type: String, default: 'max(240px, calc(100vh - 384px))' },
    summaryMethod: { type: Function, required: true },
    supplierDisplayFn: { type: Function, default: null },
    submitLoading: { type: Boolean, default: false },
    materialPickerVisible: { type: Boolean, default: false },
    materialPickerSupplier: { type: [String, Number], default: '' },
    materialPickerExcludeIds: { type: Array, default: () => [] },
    detailSelectedRowMap: { type: Object, default: () => ({}) }
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

.plan-edit-dialog ::v-deep .plan-field-is-gz .el-form-item__label {
  width: 82px !important;
}

.plan-edit-dialog ::v-deep .plan-field-phone .el-form-item__label {
  width: 82px !important;
}

.plan-edit-dialog ::v-deep .plan-entry-mode-item .el-form-item__label {
  width: 82px !important;
}

.plan-edit-dialog ::v-deep .plan-entry-mode-item .el-form-item__content {
  line-height: 28px;
}

.plan-edit-modal-root {
  overflow: hidden;
}
</style>
