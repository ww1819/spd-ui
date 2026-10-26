<template>
    <el-dialog
      title="批量赋权"
      :visible.sync="batchGrantOpen"
      width="960px"
      append-to-body
      @close="resetBatchGrantDialog"
    >
      <div style="margin-bottom: 12px; color: #606266; font-size: 13px; line-height: 1.6;">
        先选择租户。菜单树左列 <strong>已有权限</strong> 锁定只读；右列 <strong>本次赋权</strong> 可单独勾选，父子不联动，勾哪个赋哪个。
        授工作组/用户时会自动合并租户菜单，避免越权。
      </div>
      <el-form size="small" :inline="true" @submit.native.prevent>
        <el-form-item label="租户检索">
          <el-input
            v-model="batchGrantTenantKeyword"
            placeholder="名称 / 拼音简码(客户编码) / 租户ID"
            clearable
            style="width: 280px"
            @keyup.enter.native="searchBatchGrantTenantList"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="searchBatchGrantTenantList">搜索</el-button>
          <el-button size="small" @click="resetBatchGrantTenantSearch">重置</el-button>
        </el-form-item>
      </el-form>
      <el-table
        ref="batchGrantTenantTable"
        v-loading="batchGrantTenantLoading"
        :data="batchGrantTenantList"
        border
        size="small"
        max-height="200"
        @selection-change="handleBatchGrantTenantSelection"
      >
        <el-table-column type="selection" width="48" align="center" />
        <el-table-column label="租户名称" prop="customerName" min-width="160" show-overflow-tooltip />
        <el-table-column label="编码/简码" prop="customerCode" width="120" show-overflow-tooltip />
        <el-table-column label="租户ID" prop="customerId" min-width="200" show-overflow-tooltip />
      </el-table>
      <pagination
        v-show="batchGrantTenantTotal > 0"
        :total="batchGrantTenantTotal"
        :page.sync="batchGrantTenantQuery.pageNum"
        :limit.sync="batchGrantTenantQuery.pageSize"
        @pagination="searchBatchGrantTenantList"
      />
      <div style="margin-top: 14px;">
        <span style="font-size: 13px; color: #606266; margin-right: 12px;">赋权范围</span>
        <el-checkbox v-model="batchGrantForm.grantTenant">租户菜单权限</el-checkbox>
        <el-checkbox v-model="batchGrantForm.grantAllPosts">租户全部工作组</el-checkbox>
        <el-checkbox v-model="batchGrantForm.grantAllUsers">租户全部用户</el-checkbox>
      </div>
      <div style="margin: 14px 0 8px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
        <span style="font-size: 13px; color: #303133;">
          菜单赋权
          <span v-if="batchGrantSelectedTenants.length" style="color: #909399; margin-left: 8px;">
            已选 {{ batchGrantSelectedTenants.length }} 个租户；本次赋权 {{ selectedMenuIds.length }} 项
          </span>
          <span v-else style="color: #e6a23c; margin-left: 8px;">请先勾选租户以显示「已有权限」</span>
        </span>
        <span style="font-size: 12px; color: #909399;"><i class="el-icon-lock" /> 左列=已有权限　右列=本次赋权</span>
      </div>
      <el-table
        v-loading="batchGrantMenuLoading"
        :data="batchGrantMenuList"
        border
        size="small"
        row-key="menuId"
        max-height="360"
        default-expand-all
        :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      >
        <el-table-column label="已有权限" width="88" align="center">
          <template slot-scope="scope">
            <el-checkbox
              :value="!!batchGrantExistingAll[scope.row.menuId]"
              :indeterminate="!!batchGrantExistingPartial[scope.row.menuId]"
              disabled
            />
          </template>
        </el-table-column>
        <el-table-column label="本次赋权" width="88" align="center">
          <template slot-scope="scope">
            <el-checkbox
              :value="!!menuGrantChecked[scope.row.menuId]"
              @change="checked => toggleMenuRowSelect(scope.row, checked)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="menuName" label="菜单名称" min-width="160" show-overflow-tooltip />
        <el-table-column label="类型" width="72" align="center">
          <template slot-scope="scope">
            <el-tag v-if="scope.row.menuType === 'F'" type="info" size="mini">按钮</el-tag>
            <el-tag v-else-if="scope.row.menuType === 'C'" type="success" size="mini">菜单</el-tag>
            <el-tag v-else-if="scope.row.menuType === 'M'" size="mini">目录</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="perms" label="权限标识" min-width="140" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button class="spd-btn spd-btn--secondary" @click="batchGrantOpen = false">取 消</el-button>
        <el-button type="primary" class="spd-btn spd-btn--primary" :loading="batchGrantSubmitting" @click="submitBatchGrant">确 定</el-button>
      </div>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'

export default {
  name: 'MenuBatchGrantDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Menu')],
  inheritAttrs: false
}
</script>
