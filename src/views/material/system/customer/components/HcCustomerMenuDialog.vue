<template>
    <el-dialog title="耗材客户权限" :visible.sync="openMenu" width="560px" append-to-body>
      <el-form label-width="80px">
        <el-form-item label="客户名称"><el-input v-model="menuForm.customerName" disabled /></el-form-item>
        <el-form-item>
          <el-checkbox v-model="menuExpand" @change="handleMenuTreeExpand">展开/折叠</el-checkbox>
          <el-button size="mini" style="margin-left: 8px;" @click="handleMenuSelectAll(true)">全选</el-button>
          <el-button size="mini" @click="handleMenuSelectAll(false)">全不选</el-button>
          <el-checkbox v-model="menuParentChildLinked" style="margin-left: 12px;">父子联动</el-checkbox>
        </el-form-item>
        <el-form-item label-width="0">
          <menu-auth-dual-tree
            ref="menuAuthDualTree"
            v-model="menuSelectedIds"
            :data="menuOptions"
            node-key="menuId"
            :tree-props="{ label: 'menuName', children: 'children' }"
            :existing-menu-ids="menuExistingIds"
            :parent-child-linked="menuParentChildLinked"
            :default-expand-all="menuExpand"
            max-height="360px"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitMenuForm">确 定</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="openMenu = false">取 消</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import MenuAuthDualTree from '@/components/MenuAuthDualTree'

export default {
  name: 'HcCustomerMenuDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'HcCustomer')],
  components: { MenuAuthDualTree },
  inheritAttrs: false
}
</script>
