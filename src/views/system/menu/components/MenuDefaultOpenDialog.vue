<template>
    <el-dialog
      title="批量设置默认对客户开放"
      :visible.sync="defaultOpenOpen"
      width="620px"
      append-to-body
    >
      <div style="margin-bottom: 12px; color: #606266; font-size: 13px; line-height: 1.5;">
        <p style="margin: 0 0 8px;">
          目录、菜单、按钮各自对应一条权限；回显时按后台每条记录单独读取「默认开放」，不仅看父级。
        </p>
        <div style="display: flex; align-items: center; justify-content: flex-end; flex-wrap: wrap; gap: 8px;">
          <el-tooltip
            content="开启：勾选父级会选中其下全部子菜单与按钮；勾选任意子级时父级会随之为全选或半选。关闭后各级互不牵连，可单独勾选。"
            placement="top"
          >
            <span style="cursor: help; border-bottom: 1px dashed #909399;">父子联动勾选</span>
          </el-tooltip>
          <el-switch
            :value="defaultOpenParentChildLink"
            active-text="开"
            inactive-text="关"
            @change="onDefaultOpenLinkageBeforeChange"
          />
        </div>
      </div>
      <el-tree
        ref="defaultOpenTree"
        :data="defaultOpenTreeData"
        show-checkbox
        node-key="menuId"
        :check-strictly="defaultOpenTreeCheckStrictly"
        :props="{ label: 'menuName', children: 'children', disabled: 'disabled' }"
        default-expand-all
        v-loading="defaultOpenLoading"
      >
        <span slot-scope="{ node, data }" class="custom-tree-node">
          <span>{{ node.label }}</span>
          <el-tag v-if="data.menuType === 'F'" type="info" size="mini" style="margin-left: 6px;">按钮</el-tag>
          <el-tag v-else-if="data.menuType === 'C'" type="success" size="mini" style="margin-left: 6px;">菜单</el-tag>
          <el-tag v-else-if="data.menuType === 'M'" size="mini" style="margin-left: 6px;">目录</el-tag>
        </span>
      </el-tree>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="defaultOpenOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="defaultOpenSubmitting" @click="submitDefaultOpenBatch">保 存</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'MenuDefaultOpenDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Menu')],
  inheritAttrs: false
}
</script>
