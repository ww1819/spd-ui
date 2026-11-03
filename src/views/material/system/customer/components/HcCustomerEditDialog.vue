<template>
  <!-- 新增/修改机构：内容区内右侧抽屉 -->
  <div v-if="open" class="page-drawer-mask" @click.self="cancel">
    <div class="page-drawer-panel" @click.stop>
      <div class="page-drawer-header">
        <span class="page-drawer-title">{{ title }}</span>
        <i class="el-icon-close page-drawer-close" @click="cancel" />
      </div>
      <div class="page-drawer-body">
        <el-form ref="form" :model="form" :rules="rules" label-width="150px" size="small" class="hc-customer-drawer-form">
          <el-form-item v-if="!form.customerId" label="机构类型" prop="tenantKey">
            <el-select v-model="form.tenantKey" placeholder="请选择机构类型" filterable style="width: 100%" @change="onTenantKeyChange">
              <el-option
                v-for="item in tenantEnumList"
                :key="item.name"
                :label="item.displayName + ' (' + item.name + ')'"
                :value="item.name"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="form.customerId && form.tenantKey" label="机构类型">
            <el-input :value="form.tenantKey" disabled />
          </el-form-item>
          <el-form-item v-if="!form.customerId && form.tenantKey" label="机构编码(自动)">
            <el-input :value="selectedTenantEnum ? selectedTenantEnum.customerId : ''" disabled />
          </el-form-item>
          <el-form-item label="机构名称" prop="customerName">
            <el-input v-model="form.customerName" placeholder="请输入机构名称" maxlength="100" show-word-limit />
          </el-form-item>
          <el-form-item label="简码" prop="customerCode">
            <el-input v-model="form.customerCode" placeholder="请输入简码" maxlength="64" show-word-limit :disabled="!!selectedTenantEnum" />
          </el-form-item>
          <el-form-item label="社会统一信用代码" prop="socialCreditCode">
            <el-input v-model="form.socialCreditCode" placeholder="请输入社会统一信用代码" maxlength="32" show-word-limit />
          </el-form-item>
          <el-form-item label="地址" prop="address">
            <el-input v-model="form.address" placeholder="请输入地址" maxlength="255" show-word-limit />
          </el-form-item>
          <el-form-item label="联系人" prop="contactName">
            <el-input v-model="form.contactName" placeholder="请输入联系人" maxlength="64" show-word-limit />
          </el-form-item>
          <el-form-item label="联系人电话" prop="contactPhone">
            <el-input v-model="form.contactPhone" placeholder="请输入联系人电话" maxlength="32" show-word-limit />
          </el-form-item>
          <el-form-item label="计划停用时间" prop="hcPlannedDisableTime">
            <el-date-picker
              v-model="form.hcPlannedDisableTime"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="到达后机构无法使用耗材系统（可选）"
              style="width: 100%"
              :picker-options="pickerOptions"
            />
          </el-form-item>
          <el-form-item label="状态" prop="hcStatus">
            <el-radio-group v-model="form.hcStatus">
              <el-radio label="0">启用</el-radio>
              <el-radio label="1">停用</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="请输入备注" />
          </el-form-item>
        </el-form>
      </div>
      <div class="page-drawer-footer">
        <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HcCustomerEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomer')],
  inheritAttrs: false
}
</script>
