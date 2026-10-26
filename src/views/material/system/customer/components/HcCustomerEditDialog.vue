<template>
    <el-dialog :title="title" :visible.sync="open" width="560px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item v-if="!form.customerId" label="租户类型" prop="tenantKey">
          <el-select v-model="form.tenantKey" placeholder="请选择代码内租户类型" filterable style="width: 100%" @change="onTenantKeyChange">
            <el-option v-for="item in tenantEnumList" :key="item.name" :label="item.displayName + ' (' + item.name + ')'" :value="item.name" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="form.customerId && form.tenantKey" label="租户类型"><el-input :value="form.tenantKey" disabled /></el-form-item>
        <el-form-item v-if="!form.customerId && form.tenantKey" label="客户编号(自动)"><el-input :value="selectedTenantEnum ? selectedTenantEnum.customerId : ''" disabled /></el-form-item>
        <el-form-item label="客户名称" prop="customerName"><el-input v-model="form.customerName" placeholder="请输入客户名称" maxlength="100" show-word-limit /></el-form-item>
        <el-form-item label="客户编码" prop="customerCode"><el-input v-model="form.customerCode" placeholder="请输入" maxlength="64" show-word-limit :disabled="!!selectedTenantEnum" /></el-form-item>
        <el-form-item label="耗材系统计划停用时间" prop="hcPlannedDisableTime">
          <el-date-picker v-model="form.hcPlannedDisableTime" type="datetime" value-format="yyyy-MM-dd HH:mm:ss" placeholder="到达后租户无法使用耗材系统（可选）" style="width: 100%" :picker-options="pickerOptions" />
        </el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" placeholder="请输入备注" /></el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcCustomerEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomer')],
  inheritAttrs: false
}
</script>
