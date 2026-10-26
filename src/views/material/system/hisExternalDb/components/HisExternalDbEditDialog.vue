<template>
    <el-dialog :title="title" :visible.sync="open" width="720px" append-to-body @close="cancel">
      <el-form ref="form" :model="form" :rules="rules" label-width="128px">
        <el-form-item label="租户ID" prop="tenantId">
          <el-input v-model="form.tenantId" :disabled="!!form._editMode" placeholder="与客户 customer_id 一致" maxlength="36" show-word-limit />
        </el-form-item>
        <el-form-item label="库类型" prop="dbType">
          <el-select v-model="form.dbType" placeholder="请选择" style="width: 100%">
            <el-option label="SQLSERVER（可空区间 SQL，走内置视图）" value="SQLSERVER" />
            <el-option label="MYSQL（须填区间 SQL）" value="MYSQL" />
          </el-select>
        </el-form-item>
        <el-form-item label="驱动类" prop="driverClass">
          <el-input v-model="form.driverClass" placeholder="可空，按库类型使用默认驱动" maxlength="256" />
        </el-form-item>
        <el-form-item label="JDBC URL" prop="jdbcUrl">
          <el-input v-model="form.jdbcUrl" type="textarea" :rows="2" placeholder="jdbc:sqlserver://... 或 jdbc:mysql://..." />
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" maxlength="128" />
        </el-form-item>
        <el-form-item label="口令" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="new-password" :placeholder="form._editMode ? '留空则不修改口令' : '可空'" />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="住院区间 SQL" prop="sqlInpatientRange">
          <el-input v-model="form.sqlInpatientRange" type="textarea" :rows="3" placeholder="MYSQL 必填；两个 ? 为计费起止时间" />
        </el-form-item>
        <el-form-item label="门诊区间 SQL" prop="sqlOutpatientRange">
          <el-input v-model="form.sqlOutpatientRange" type="textarea" :rows="3" placeholder="MYSQL 必填；两个 ? 为计费起止时间" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit />
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
  name: 'HisExternalDbEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HisExternalDb')],
  inheritAttrs: false
}
</script>
