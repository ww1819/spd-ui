<template>
    <el-dialog
      title="设置常用菜单"
      :visible.sync="menuSettingVisible"
      width="560px"
      append-to-body
      custom-class="home-menu-setting-dialog"
    >
      <p class="home-menu-setting-hint">仅列出当前账号有权限的菜单，最多选择 {{ FREQUENT_MENU_MAX }} 个；首页两行×8列，超出自动左右轮播</p>
      <el-checkbox-group
        v-if="permittedMenus.length"
        v-model="menuSettingChecked"
        class="home-menu-setting-list"
      >
        <el-checkbox
          v-for="m in permittedMenus"
          :key="m.path"
          :label="m.path"
          :disabled="menuSettingChecked.length >= FREQUENT_MENU_MAX && menuSettingChecked.indexOf(m.path) === -1"
        >{{ m.title }}</el-checkbox>
      </el-checkbox-group>
      <div v-else class="home-cabin-empty home-cabin-empty--menu">
        <p class="home-cabin-empty-text">当前账号暂无可设置的菜单权限</p>
      </div>
      <div slot="footer" class="dialog-footer">
        <el-button :disabled="menuSettingSaving" @click="resetMenuSetting">恢复自动</el-button>
        <el-button :disabled="menuSettingSaving" @click="menuSettingVisible = false">取消</el-button>
        <el-button type="primary" :loading="menuSettingSaving" @click="saveMenuSetting">确定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'HomeMenuSettingDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Index' && vm.$el && vm.$el.classList && vm.$el.classList.contains('home-workbench'))],
  inheritAttrs: false
}
</script>
