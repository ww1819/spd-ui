<template>
    <!-- 授权弹窗：固定尺寸、可拖动、无灰色遮罩；各 Tab 内容区高度一致 -->
    <el-dialog
      v-dialogDrag
      :title="authTitle || '授权'"
      :visible.sync="authOpen"
      width="900px"
      top="8vh"
      custom-class="user-auth-dialog"
      append-to-body
      :modal="false"
      :close-on-click-modal="false"
    >
    <el-tabs type="card" class="user-auth-tabs">
      <el-tab-pane label="菜单权限">
        <div class="user-auth-pane">
          <div class="user-auth-pane-toolbar">
            <el-button size="mini" @click="handleAuthMenuAll(true)">全选</el-button>
            <el-button size="mini" @click="handleAuthMenuAll(false)">取消</el-button>
            <el-checkbox v-model="authMenuParentChildLinked" style="margin-left: 12px;">父子联动</el-checkbox>
          </div>
          <div class="user-auth-pane-body">
            <menu-auth-dual-tree
              ref="menuAuthDualTree"
              v-model="authForm.menuIds"
              :data="menuOptions"
              node-key="id"
              :tree-props="defaultProps"
              :existing-menu-ids="authExistingMenuIds"
              :parent-child-linked="authMenuParentChildLinked"
              max-height="360px"
            />
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="科室权限">
        <div class="user-auth-pane">
          <div class="user-auth-pane-toolbar">
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
          <div class="user-auth-pane-body auth-checkbox-container">
            <el-checkbox-group v-model="authForm.departmentIds" class="auth-checkbox-group">
              <el-checkbox v-for="item in filteredDepartmentOptions"
                           :key="item.id"
                           :label="item.id"
                           class="auth-checkbox-item">{{item.name}}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="仓库权限">
        <div class="user-auth-pane">
          <div class="user-auth-pane-toolbar">
            <el-button size="mini" @click="handleAuthWarehouseAll(true)">全选</el-button>
            <el-button size="mini" @click="handleAuthWarehouseAll(false)">取消</el-button>
          </div>
          <div class="user-auth-pane-body auth-scroll-pane">
            <el-checkbox-group v-model="authForm.warehouseIds">
              <el-checkbox v-for="item in userWarehouseOptions"
                           :key="item.id"
                           :label="item.id">{{item.name}}
              </el-checkbox>
            </el-checkbox-group>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="单位权限">
        <div class="user-auth-pane">
          <div class="user-auth-pane-body auth-scroll-pane user-auth-pane-empty">
            <div class="user-auth-empty-text">暂无数据</div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="待办事项">
        <div class="user-auth-pane">
          <div class="user-auth-pane-body auth-scroll-pane user-auth-pane-empty">
            <div class="user-auth-empty-text">暂无数据</div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="消息提醒">
        <div class="user-auth-pane">
          <div class="user-auth-pane-toolbar">
            <el-button size="mini" @click="handleAuthMessageReminderAll(true)">全选</el-button>
            <el-button size="mini" @click="handleAuthMessageReminderAll(false)">取消</el-button>
          </div>
          <div class="user-auth-pane-body auth-message-reminder-list">
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
        </div>
      </el-tab-pane>
      <el-tab-pane label="首页设置">
        <div class="user-auth-pane">
          <p class="auth-home-page-tip">勾选用户可切换的首页；均未勾选时默认显示「默认」首页。</p>
          <div class="user-auth-pane-toolbar">
            <el-button size="mini" @click="handleAuthHomePageAll(true)">全选</el-button>
            <el-button size="mini" @click="handleAuthHomePageAll(false)">取消</el-button>
          </div>
          <div class="user-auth-pane-body auth-checkbox-container">
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
      <el-button type="primary" icon="el-icon-check" class="spd-btn spd-btn--primary" @click="submitAuth" v-hasPermi="['system:user:edit']">保 存</el-button>
      <el-button icon="el-icon-close" class="spd-btn spd-btn--secondary" @click="authOpen = false">取 消</el-button>
    </span>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import MenuAuthDualTree from '@/components/MenuAuthDualTree'

export default {
  name: 'UserAuthDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'User')],
  components: { MenuAuthDualTree },
  inheritAttrs: false
}
</script>
