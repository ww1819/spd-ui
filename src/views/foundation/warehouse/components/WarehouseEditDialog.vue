<template>
    <div v-if="open" class="warehouse-drawer-mask" @click.self="cancel">
      <div class="warehouse-drawer-panel" @click.stop>
        <div class="warehouse-drawer-header">
          <span class="warehouse-drawer-title">{{ title }}</span>
          <i class="el-icon-close warehouse-drawer-close" @click="cancel" />
        </div>
        <div class="warehouse-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="110px" :disabled="dialogMode === 'view'">
            <el-form-item label="仓库编码" prop="code">
              <el-input v-model="form.code" :disabled="isDisabled || dialogMode === 'view'" placeholder="仓库编码" />
            </el-form-item>
            <el-form-item label="仓库名称" prop="name">
              <el-input v-model="form.name" placeholder="仓库名称" />
            </el-form-item>
            <el-form-item label="负责人" prop="warehousePerson">
              <el-input v-model="form.warehousePerson" placeholder="负责人" />
            </el-form-item>
            <el-form-item label="电话" prop="warehousePhone">
              <el-input v-model="form.warehousePhone" placeholder="电话" />
            </el-form-item>
            <el-form-item label="状态" prop="warehouseStatus">
              <el-select v-model="form.warehouseStatus" placeholder="状态" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="仓库类型" prop="warehouseType">
              <el-select v-model="form.warehouseType" placeholder="仓库类型" style="width: 100%">
                <el-option label="高值" value="高值" />
                <el-option label="低值" value="低值" />
                <el-option label="试剂" value="试剂" />
                <el-option label="设备" value="设备" />
              </el-select>
            </el-form-item>
            <el-form-item label="结算类型" prop="settlementType">
              <el-select v-model="form.settlementType" placeholder="结算类型" style="width: 100%">
                <el-option label="入库结算" value="1" />
                <el-option label="出库结算" value="2" />
                <el-option label="消耗结算" value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="结算仓库" prop="isSettlementWarehouse">
              <el-switch
                v-model="form.isSettlementWarehouse"
                :active-value="1"
                :inactive-value="0"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
            <el-form-item v-if="isZaoqiangTenant" label="HIS药库科室ID" prop="hisId">
              <el-input v-model="form.hisId" placeholder="众阳 storageDeptId" />
            </el-form-item>
          </el-form>
        </div>
        <div class="warehouse-drawer-footer">
          <el-button
            v-if="dialogMode !== 'view'"
            type="primary"
            size="small"
            class="spd-btn spd-btn--primary"
            @click="submitForm"
          >保 存</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">{{ dialogMode === 'view' ? '关 闭' : '取 消' }}</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'WarehouseEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Warehouse' && vm.$el && vm.$el.classList && vm.$el.classList.contains('warehouse-page'))],
  dicts: ['is_use_status'],
  inheritAttrs: false
}
</script>
