<template>
    <!-- 新增/修改：内容区内右侧抽屉 -->
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="formRules" label-width="90px" size="small" class="user-drawer-form">
            <el-form-item label="机构单位">
              <el-input :value="organizationUnitDisplay" placeholder="机构单位" disabled />
            </el-form-item>
            <el-form-item label="角色">
              <el-select
                v-model="form.roleIds"
                multiple
                placeholder="请选择角色"
                style="width: 100%;"
                :disabled="form.userId == undefined"
                :allow-create="false"
                @change="handleRoleChange"
              >
                <el-option
                  v-for="item in roleOptions"
                  :key="item.roleId"
                  :label="item.roleName"
                  :value="item.roleId"
                  :disabled="item.status == 1"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="用户性别">
              <el-select v-model="form.sex" placeholder="请选择性别" style="width: 100%;" clearable>
                <el-option
                  v-for="dict in dict.type.sys_user_sex"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="用户账户" prop="userName">
              <el-input v-model="form.userName" placeholder="用户账户" maxlength="30" :disabled="form.userId != undefined" />
            </el-form-item>
            <el-form-item label="工作组">
              <el-select v-model="form.deptId" placeholder="请选择工作组" clearable style="width: 100%;">
                <el-option
                  v-for="item in postOptions"
                  :key="item.postId"
                  :label="item.postName"
                  :value="item.postId"
                  :disabled="item.status == 1"
                />
              </el-select>
            </el-form-item>
            <el-form-item :label="form.userId != undefined ? '登录密码' : '用户密码'" prop="password">
              <el-input
                v-model="form.password"
                :placeholder="form.userId != undefined ? '留空不修改登录密码' : '用户密码'"
                type="password"
                maxlength="20"
                show-password
                autocomplete="new-password"
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="form.email" placeholder="邮箱" maxlength="50" />
            </el-form-item>
            <el-form-item label="用户姓名" prop="nickName">
              <el-input v-model="form.nickName" placeholder="用户姓名" maxlength="30" />
            </el-form-item>
            <el-form-item label="手机号码" prop="phonenumber">
              <el-input v-model="form.phonenumber" placeholder="手机号码" maxlength="11" />
            </el-form-item>
            <el-form-item label="状态">
              <el-radio-group v-model="form.status">
                <el-radio
                  v-for="dict in dict.type.sys_normal_disable"
                  :key="dict.value"
                  :label="dict.value"
                >{{dict.label}}</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="3" placeholder="内容" />
            </el-form-item>
          </el-form>
        </div>
        <div class="page-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" v-if="canSubmitUserForm" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'UserEditDrawer',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'User')],
  dicts: ['sys_user_sex', 'sys_normal_disable'],
  inheritAttrs: false
}
</script>
