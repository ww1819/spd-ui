<template>
    <el-dialog :title="title" :visible.sync="open" width="500px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="参数名称" prop="configName">
          <el-input v-model="form.configName" placeholder="请输入参数名称" />
        </el-form-item>
        <el-form-item label="参数键名" prop="configKey">
          <el-input v-model="form.configKey" placeholder="请输入参数键名" />
        </el-form-item>
        <el-form-item label="参数键值" prop="configValue">
          <el-select
            v-if="form.configKey === 'hc.login.defaultCustomerId'"
            v-model="form.configValue"
            placeholder="请选择耗材登录默认客户（组织机构）"
            clearable
            filterable
            style="width: 100%"
          >
            <el-option
              v-for="item in customerHcOptions"
              :key="item.customerId"
              :label="(item.customerName || '') + (item.customerCode ? '（' + item.customerCode + '）' : '')"
              :value="item.customerId"
            />
          </el-select>
          <el-input
            v-else
            v-model="form.configValue"
            :placeholder="form.configKey === 'sys.index.sidebarLogo' ? '请输入 1（默认）或 2（aisipute-wide2）' : '请输入参数键值'"
          />
        </el-form-item>
        <el-form-item label="系统内置" prop="configType">
          <el-radio-group v-model="form.configType">
            <el-radio
              v-for="dict in dict.type.sys_yes_no"
              :key="dict.value"
              :label="dict.value"
            >{{dict.label}}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" placeholder="请输入内容" />
        </el-form-item>
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
  name: 'ConfigEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Config')],
  dicts: ['sys_yes_no'],
  inheritAttrs: false
}
</script>
