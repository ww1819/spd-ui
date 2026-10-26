<template>
    <el-dialog :title="authTitle || '授权'" :visible.sync="authOpen" width="700px" append-to-body>
    <el-alert
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px;"
      title="此处保存的是工作组（岗位）权限。左列已有权限（锁定），右列本次选择；可勾选「父子联动」控制是否级联勾选。用户实际权限以「用户管理」为准。"
    />
    <el-tabs type="card">
      <el-tab-pane label="菜单权限">
        <div style="margin-bottom: 8px;">
          <el-button size="mini" @click="handleAuthMenuAll(true)">全选</el-button>
          <el-button size="mini" @click="handleAuthMenuAll(false)">取消</el-button>
          <el-checkbox v-model="authMenuParentChildLinked" style="margin-left: 12px;">父子联动</el-checkbox>
        </div>
        <menu-auth-dual-tree
          ref="menuAuthDualTree"
          v-model="authForm.menuIds"
          :data="menuOptions"
          node-key="id"
          :tree-props="defaultProps"
          :existing-menu-ids="authExistingMenuIds"
          :parent-child-linked="authMenuParentChildLinked"
          max-height="300px"
        />
      </el-tab-pane>
      <el-tab-pane label="科室权限">
        <div style="margin-bottom: 8px;">
          <el-button size="mini" @click="handleAuthDepartmentAll(true)">全选</el-button>
          <el-button size="mini" @click="handleAuthDepartmentAll(false)">取消</el-button>
          <el-input
            v-model="departmentKeyword"
            size="mini"
            clearable
            placeholder="搜索科室"
            style="width: 180px; margin-left: 10px;"
          />
        </div>
        <div class="auth-checkbox-container">
          <el-checkbox-group v-model="authForm.departmentIds" class="auth-checkbox-group">
            <el-checkbox v-for="item in filteredDepartmentOptions"
                         :key="item.id"
                         :label="item.id"
                         class="auth-checkbox-item">{{item.name}}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </el-tab-pane>
      <el-tab-pane label="仓库权限">
        <div style="margin-bottom: 8px;">
          <el-button size="mini" @click="handleAuthWarehouseAll(true)">全选</el-button>
          <el-button size="mini" @click="handleAuthWarehouseAll(false)">取消</el-button>
        </div>
        <div style="max-height: 300px; overflow-y: auto;">
          <el-checkbox-group v-model="authForm.warehouseIds">
            <el-checkbox v-for="item in userWarehouseOptions"
                         :key="item.id"
                         :label="item.id">{{item.name}}
            </el-checkbox>
          </el-checkbox-group>
        </div>
      </el-tab-pane>
      <el-tab-pane label="单位权限">
        <div style="max-height: 300px; overflow-y: auto;">
          <div style="color:#909399; padding: 20px; text-align: center;">暂无数据</div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="待办事项">
        <div style="max-height: 300px; overflow-y: auto;">
          <div style="color:#909399; padding: 20px; text-align: center;">暂无数据</div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="消息提醒">
        <div style="margin-bottom: 8px;">
          <el-button size="mini" @click="handleAuthMessageReminderAll(true)">全选</el-button>
          <el-button size="mini" @click="handleAuthMessageReminderAll(false)">取消</el-button>
        </div>
        <div class="auth-message-reminder-list">
          <div class="auth-message-reminder-grid">
            <el-checkbox-group v-model="authForm.messageReminderKeys" class="auth-message-reminder-col">
              <el-checkbox
                v-for="item in messageReminderOptions"
                :key="item.value"
                :label="item.value"
                class="auth-message-reminder-cell"
              >{{ item.label }}</el-checkbox>
            </el-checkbox-group>
            <el-checkbox-group v-model="authForm.messageReminderPopupKeys" class="auth-message-reminder-col">
              <el-checkbox
                v-for="item in messageReminderOptions"
                :key="'popup-' + item.value"
                :label="item.value"
                class="auth-message-reminder-cell auth-message-reminder-popup"
                :disabled="!(authForm.messageReminderKeys || []).includes(item.value)"
              >登录弹窗</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="首页设置">
        <div class="user-auth-pane">
          <p class="auth-home-page-tip">勾选工作组可切换的首页；均未勾选时默认显示「默认」首页。保存后可通过「同步首页设置」下发到组内账号。</p>
          <div style="margin-bottom: 8px;">
            <el-button size="mini" @click="handleAuthHomePageAll(true)">全选</el-button>
            <el-button size="mini" @click="handleAuthHomePageAll(false)">取消</el-button>
          </div>
          <div class="auth-checkbox-container">
            <el-checkbox-group v-model="authForm.homePageKeys" class="auth-checkbox-group">
              <el-checkbox
                v-for="item in homePageOptions"
                :key="item.value"
                :label="item.value"
                class="auth-checkbox-item"
              >{{ item.label }}</el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <span slot="footer" class="dialog-footer">
      <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitAuth">保 存</el-button>
      <el-button class="spd-btn spd-btn--secondary" @click="authOpen = false">取 消</el-button>
    </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import MenuAuthDualTree from "@/components/MenuAuthDualTree";

export default {
  name: 'PostAuthDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Post')],
  components: { MenuAuthDualTree },
  inheritAttrs: false
}
</script>

<style scoped>
.list-query-panel {
  margin-top: -20px;
}

.list-query-panel .query-row-first-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.list-query-panel .apply-query-field,
.list-query-panel .apply-query-input {
  width: 170px;
  flex-shrink: 0;
}

.list-query-panel .more-search-select-wrap.apply-query-field {
  width: 170px;
}

.list-query-panel .more-search-select-wrap.apply-query-field >>> .el-input {
  width: 100%;
}

.list-query-panel .query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.list-query-panel .query-actions .el-button + .el-button {
  margin-left: 0;
}
.auth-home-page-tip {
  margin: 0 0 10px;
  color: #909399;
  font-size: 13px;
  line-height: 1.5;
}

/* 授权树：客户未开通的目录节点不显示勾选框 */
.auth-menu-tree ::v-deep .el-tree-node:has(.menu-folder-only) > .el-tree-node__content > .el-checkbox {
  display: none;
}
/* 授权复选框容器样式 */
.auth-checkbox-container {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  background-color: #fff;
}

.auth-checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px 20px;
}

.auth-checkbox-item {
  margin-right: 0 !important;
  min-width: 120px;
  font-size: 14px;
}

.auth-message-reminder-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 10px 12px;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  background-color: #fff;
}

.auth-message-reminder-grid {
  display: flex;
  gap: 32px;
  align-items: flex-start;
}

.auth-message-reminder-col {
  display: flex;
  flex-direction: column;
}

.auth-message-reminder-cell {
  display: flex;
  align-items: center;
  height: 36px;
  margin: 0 !important;
}

.auth-message-reminder-row {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 8px 0;
}

.auth-message-reminder-row + .auth-message-reminder-row {
  border-top: 1px dashed #EBEEF5;
}

.auth-message-reminder-popup {
  margin-left: 8px;
  color: #606266;
}

::v-deep .el-tree {
  background-color: #fff;
  border: 1px solid #DCDFE6;
  border-radius: 4px;
  padding: 10px;
}

::v-deep .el-tree-node__content {
  height: 32px;
  line-height: 32px;
}

::v-deep .el-tree-node__label {
  font-size: 14px;
}
</style>
