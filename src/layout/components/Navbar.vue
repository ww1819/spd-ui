<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!topNav"/>
    <top-nav id="topmenu-container" class="topmenu-container" v-if="topNav"/>

    <div class="right-menu">
      <template v-if="device!=='mobile'">
        <!-- 组织机构显示框 -->
        <div class="organization-wrapper">
          <span class="organization-label">组织机构：</span>
          <span class="organization-name">{{ organizationUnit || '组织机构' }}</span>
        </div>

        <search id="header-search" class="right-menu-item" />

<!--        <el-tooltip content="源码地址" effect="dark" placement="bottom">-->
<!--          <ruo-yi-git id="ruoyi-git" class="right-menu-item hover-effect" />-->
<!--        </el-tooltip>-->

<!--        <el-tooltip content="文档地址" effect="dark" placement="bottom">-->
<!--          <ruo-yi-doc id="ruoyi-doc" class="right-menu-item hover-effect" />-->
<!--        </el-tooltip>-->

        <!-- 消息提醒 -->
        <el-popover
          placement="bottom-end"
          width="350"
          trigger="click"
          v-model="messageVisible"
          @show="loadMessageReminderStrip"
        >
          <div class="message-popover">
            <div class="message-header">
              <span class="message-title">消息提醒</span>
              <el-button type="text" size="mini" @click="markAllAsRead" v-if="unreadCount > 0">全部已读</el-button>
            </div>
            <div class="message-content">
              <div v-if="messageList.length === 0" class="no-message">
                <i class="el-icon-bell" style="font-size: 48px; color: #c0c4cc;"></i>
                <p>暂无消息</p>
              </div>
              <div v-else>
                <div
                  v-for="(item, index) in messageList"
                  :key="index"
                  class="message-item"
                  :class="{ 'unread': !item.read }"
                  @click="handleMessageClick(item, index)"
                >
                  <div class="message-icon">
                    <i :class="getMessageIcon(item.type)"></i>
                  </div>
                  <div class="message-info">
                    <div class="message-title-text">{{ item.title }}</div>
                    <div class="message-desc">{{ item.content }}</div>
                    <div class="message-time">{{ item.time }}</div>
                  </div>
                  <div class="message-status" v-if="!item.read">
                    <span class="unread-dot"></span>
                  </div>
                </div>
              </div>
            </div>
            <div class="message-footer" v-if="messageList.length > 0">
              <el-button type="text" size="small" @click="viewAllMessages">查看全部</el-button>
            </div>
          </div>
          <el-badge :value="unreadCount" :hidden="unreadCount === 0" class="message-badge" slot="reference">
            <div class="message-icon-wrapper right-menu-item hover-effect">
              <i class="el-icon-bell"></i>
            </div>
          </el-badge>
        </el-popover>

        <screenfull id="screenfull" class="right-menu-item hover-effect" />

<!--        <el-tooltip content="布局大小" effect="dark" placement="bottom">-->
        <!--          <size-select id="size-select" class="right-menu-item hover-effect" />-->
        <!--        </el-tooltip>-->

      </template>

      <!-- 系统版本信息按钮 -->
      <el-tooltip content="系统版本信息" effect="dark" placement="bottom">
        <div class="version-button right-menu-item hover-effect" @click="showVersionDialog">
          <i class="el-icon-more"></i>
        </div>
      </el-tooltip>

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <span class="user-nickname">{{ nickName || name }}</span>
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown">
          <router-link to="/user/profile">
            <el-dropdown-item>个人中心</el-dropdown-item>
          </router-link>
          <el-dropdown-item @click.native="setting = true">
            <span>布局设置</span>
          </el-dropdown-item>
          <el-dropdown-item divided @click.native="logout">
            <span>退出登录</span>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>

    <!-- 系统版本信息对话框 -->
    <el-dialog
      :visible.sync="versionDialogVisible"
      width="500px"
      append-to-body
      :show-close="false"
    >
      <span slot="title" class="dialog-title">
        <span>系统版本信息</span>
        <el-button type="text" class="dialog-close-btn" @click="versionDialogVisible = false">关闭</el-button>
      </span>
      <div class="version-info">
        <div class="version-item">
          <span class="version-label">系统名称：</span>
          <span class="version-value">医疗物资管理系统</span>
        </div>
        <div class="version-item">
          <span class="version-label">后端应用：</span>
          <span class="version-value">{{ backendAppName || '—' }}</span>
        </div>
        <div class="version-item">
          <span class="version-label">前端版本：</span>
          <span class="version-value">v{{ frontendVersion }}（构建 {{ frontendBuildLabel }}）</span>
        </div>
        <div class="version-item">
          <span class="version-label">后端版本：</span>
          <span class="version-value">v{{ backendVersion || '—' }}{{ backendBuildTime ? '（部署 ' + backendBuildTime + '）' : '' }}</span>
        </div>
        <div class="version-item">
          <span class="version-label">版权所有：</span>
          <span class="version-value">© 石家庄爱思普特科技有限公司 版本所有</span>
        </div>
        <div class="version-item version-about">
          <span class="version-label">关于版本：</span>
          <span class="version-value">医疗物资管理系统受国家计算机软件著作权保护，未经官网正规渠道授权擅自使用、以及直接对产品二次出售的，我们将保留追究法律责任的权利。</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import Breadcrumb from '@/components/Breadcrumb'
import TopNav from '@/components/TopNav'
import Hamburger from '@/components/Hamburger'
import Screenfull from '@/components/Screenfull'
import SizeSelect from '@/components/SizeSelect'
import Search from '@/components/HeaderSearch'
import RuoYiGit from '@/components/RuoYi/Git'
import RuoYiDoc from '@/components/RuoYi/Doc'
import { listConfig } from '@/api/system/config'
import { getAppVersion } from '@/api/common/version'
import { parseTime } from '@/utils/ruoyi'
import {
  fetchHomeDepartmentReminderUnreceivedReceipt,
  fetchHomeDepartmentReminderNearExpiryList,
  fetchHomeWarehouseReminderApplyList,
  fetchHomeWarehouseReminderPurchaseList
} from '@/api/dashboard/home'

export default {
  components: {
    Breadcrumb,
    TopNav,
    Hamburger,
    Screenfull,
    SizeSelect,
    Search,
    RuoYiGit,
    RuoYiDoc
  },
  data() {
    return {
      // 参数设置第七条参数值（机构单位）
      organizationUnit: '',
      // 消息提醒弹窗显示状态
      messageVisible: false,
      // 系统版本信息对话框显示状态
      versionDialogVisible: false,
      backendAppName: '',
      backendVersion: '',
      backendBuildTime: '',
      // 消息列表（时间由 loadMessageReminderStrip 拉取业务日期/审核时间后回填）
      messageList: [
        {
          id: 1,
          type: 'system',
          title: '科室预警',
          content: '您有一条新的科室预警，请及时查看',
          time: '—',
          read: false
        },
        {
          id: 2,
          type: 'warning',
          title: '仓库提醒',
          content: '您有3条仓库提醒需要处理',
          time: '—',
          read: false
        },
        {
          id: 3,
          type: 'info',
          title: '数据异常预警',
          content: '存在数据异常，请及时核查',
          time: '—',
          read: true
        }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device',
      'name',
      'nickName'
    ]),
    setting: {
      get() {
        return this.$store.state.settings.showSettings
      },
      set(val) {
        this.$store.dispatch('settings/changeSetting', {
          key: 'showSettings',
          value: val
        })
      }
    },
    topNav: {
      get() {
        return this.$store.state.settings.topNav
      }
    },
    frontendVersion() {
      return process.env.VUE_APP_VERSION || '—'
    },
    frontendBuildLabel() {
      return this.formatVersionTime(process.env.VUE_APP_BUILD_TIME)
    },
    // 未读消息数量
    unreadCount() {
      return this.messageList.filter(item => !item.read).length
    }
  },
  methods: {
    /** 取若干时间字符串/对象中的最大时刻，格式 yyyy-MM-dd HH:mm:ss；无则 null */
    maxTimeToDisplay(candidates) {
      const ms = []
      for (const c of candidates || []) {
        if (c == null || c === '') continue
        const t = new Date(c).getTime()
        if (Number.isFinite(t)) ms.push(t)
      }
      if (!ms.length) return null
      const d = new Date(Math.max(...ms))
      return parseTime(d, '{y}-{m}-{d} {h}:{i}:{s}') || null
    },
    /** 科室预警：出库单业务日期 billDate（无则 auditDate）与近效期行 warehouse_date 中的最新值 */
    async loadMessageReminderStrip() {
      try {
        const [depUn, depNear, whApply, whPurchase] = await Promise.all([
          fetchHomeDepartmentReminderUnreceivedReceipt(),
          fetchHomeDepartmentReminderNearExpiryList(),
          fetchHomeWarehouseReminderApplyList(),
          fetchHomeWarehouseReminderPurchaseList()
        ])
        const deptCandidates = []
        const du = (depUn && depUn.data) || {}
        const bills = Array.isArray(du.bills) ? du.bills : []
        for (const b of bills) {
          const t = b.billDate || b.auditDate
          if (t) deptCandidates.push(t)
        }
        const dn = (depNear && depNear.data) || {}
        const lines = Array.isArray(dn.lines) ? dn.lines : []
        for (const r of lines) {
          const t = r.warehouseDate
          if (t) deptCandidates.push(t)
        }
        const deptStr = this.maxTimeToDisplay(deptCandidates)

        const whCandidates = []
        const applyRows = Array.isArray(whApply && whApply.data) ? whApply.data : []
        for (const row of applyRows) {
          const t = row.lastOutboundAuditDate
          if (t) whCandidates.push(t)
        }
        const purchaseRows = Array.isArray(whPurchase && whPurchase.data) ? whPurchase.data : []
        for (const row of purchaseRows) {
          const t = row.lastPurchaseAuditDate
          if (t) whCandidates.push(t)
        }
        const whStr = this.maxTimeToDisplay(whCandidates)

        this.messageList.forEach((item) => {
          if (item.title === '科室预警' && deptStr) {
            this.$set(item, 'time', deptStr)
          } else if (item.title === '仓库提醒' && whStr) {
            this.$set(item, 'time', whStr)
          }
        })
      } catch (e) {
        // 静默：无权限或接口失败时保留「—」
      }
    },
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      this.$confirm('确定退出当前账户吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.$store.dispatch('LogOut').then(() => {
          location.href = '/index';
        })
      }).catch(() => {});
    },
    // 获取消息图标
    getMessageIcon(type) {
      const iconMap = {
        'system': 'el-icon-warning',
        'warning': 'el-icon-warning-outline',
        'info': 'el-icon-info',
        'success': 'el-icon-success',
        'error': 'el-icon-error'
      }
      return iconMap[type] || 'el-icon-bell'
    },
    // 点击消息项
    handleMessageClick(item, index) {
      if (!item.read) {
        this.$set(this.messageList[index], 'read', true)
      }
      const reminderCategoryByTitle = {
        仓库提醒: { category: 'warehouse', subTab: 'all' },
        申领单预警: { category: 'warehouse', subTab: 'apply' },
        申购单预警: { category: 'warehouse', subTab: 'purchase' },
        库存预警: { category: 'warehouse', subTab: 'inventory' },
        库存近效期仓库预警: { category: 'warehouse', subTab: 'nearExpiry' },
        科室预警: { category: 'department' },
        数据异常预警: { category: 'data' }
      }
      const route = reminderCategoryByTitle[item.title]
      if (route) {
        this.messageVisible = false
        this.$store.dispatch('app/openWarehouseReminder', route)
        return
      }
      this.$message.info(`查看消息：${item.title}`)
    },
    // 全部已读
    markAllAsRead() {
      this.messageList.forEach(item => {
        item.read = true
      })
      this.$message.success('已全部标记为已读')
    },
    // 查看全部消息
    viewAllMessages() {
      this.messageVisible = false
      // 这里可以添加跳转到消息列表页面的逻辑
      this.$message.info('查看全部消息')
    },
    // 获取参数设置第七条参数值（机构单位）
    getOrganizationUnit() {
      listConfig({}).then(response => {
        if (response.rows && response.rows.length >= 7) {
          // 获取第七条参数的值（索引从0开始，第七条是索引6）
          const seventhConfig = response.rows[6]
          this.organizationUnit = seventhConfig.configValue || ''
        }
      }).catch(() => {
        this.organizationUnit = ''
      })
    },
    formatVersionTime(iso) {
      if (!iso) return '—'
      const d = new Date(iso)
      if (Number.isNaN(d.getTime())) return String(iso)
      return d.toLocaleString('zh-CN', { hour12: false })
    },
    async loadBackendVersion() {
      this.backendAppName = ''
      this.backendVersion = ''
      this.backendBuildTime = ''
      try {
        const res = await getAppVersion()
        this.backendAppName = res.name || ''
        this.backendVersion = res.version || ''
        this.backendBuildTime = (res.buildTime && String(res.buildTime).trim()) || ''
      } catch (e) {
        this.backendVersion = ''
      }
    },
    // 显示系统版本信息对话框
    showVersionDialog() {
      this.versionDialogVisible = true
      this.loadBackendVersion()
    }
  },
  created() {
    // 获取参数设置第七条参数值
    this.getOrganizationUnit()
    this.loadMessageReminderStrip()
  }
}
</script>

<style lang="scss" scoped>
.navbar {
  height: 50px;
  overflow: hidden;
  position: relative;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0,21,41,.08);

  .hamburger-container {
    line-height: 46px;
    height: 100%;
    float: left;
    cursor: pointer;
    transition: background .3s;
    -webkit-tap-highlight-color:transparent;

    &:hover {
      background: rgba(0, 0, 0, .025)
    }
  }

  .breadcrumb-container {
    float: left;
  }

  .topmenu-container {
    position: absolute;
    left: 50px;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    float: right;
    height: 100%;
    line-height: 50px;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      padding: 0 8px;
      height: 100%;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background .3s;

        &:hover {
          background: rgba(0, 0, 0, .025)
        }
      }
    }

    .avatar-container {
      margin-right: 30px;

      .avatar-wrapper {
        margin-top: 5px;
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        cursor: pointer;

        .user-nickname {
          max-width: 160px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
          color: #303133;
          line-height: 40px;
          cursor: pointer;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: relative;
          right: auto;
          top: auto;
          font-size: 12px;
        }
      }
    }

    .message-badge {
      margin-right: 8px;
      display: inline-block;
      vertical-align: middle;
      position: relative;
      top: -6px;
      
      ::v-deep .el-badge__content {
        top: 8px !important;
      }
      
      .message-icon-wrapper {
        display: inline-block;
        padding: 0 8px;
        height: 100%;
        font-size: 18px;
        color: #5a5e66;
        vertical-align: text-bottom;
        line-height: 50px;
        
        i {
          font-size: 18px;
          cursor: pointer;
        }
      }
    }

    .organization-wrapper {
      display: inline-block;
      margin-right: 8px;
      vertical-align: middle;
      position: relative;
      top: -16px;
      
      .organization-label {
        font-weight: bold;
        font-size: 15px;
        color: #303133;
        white-space: nowrap;
      }
      
      .organization-name {
        font-weight: normal;
        font-size: 14px;
        color: #303133;
        white-space: nowrap;
      }
    }

    .version-button {
      margin-right: 8px;
      
      i {
        font-size: 18px;
        transform: rotate(90deg);
        display: inline-block;
      }
    }
  }
}
</style>

<style lang="scss">
// 系统版本信息对话框样式（不使用scoped，因为el-dialog内容插入到body）
.dialog-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  
  .dialog-close-btn {
    padding: 0;
    font-size: 14px;
    color: #909399;
    
    &:hover {
      color: #303133;
    }
  }
}

.version-info {
  padding: 20px 0;
  
  .version-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    font-size: 14px;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .version-label {
      width: 100px;
      color: #606266;
      font-weight: 500;
    }
    
    .version-value {
      flex: 1;
      color: #303133;
    }
    
    &.version-about {
      align-items: flex-start;
      
      .version-label {
        margin-top: 2px;
      }
      
      .version-value {
        line-height: 1.6;
        word-wrap: break-word;
        white-space: normal;
      }
    }
  }
}

// 消息提醒弹窗样式（不使用scoped，因为el-popover内容插入到body）
.message-popover {
  .message-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #ebeef5;

    .message-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
    }
  }

  .message-content {
    max-height: 400px;
    overflow-y: auto;

    .no-message {
      text-align: center;
      padding: 40px 20px;
      color: #909399;

      p {
        margin-top: 12px;
        font-size: 14px;
      }
    }

    .message-item {
      display: flex;
      padding: 12px 16px;
      border-bottom: 1px solid #f5f7fa;
      cursor: pointer;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      &.unread {
        background-color: #ecf5ff;
      }

      .message-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background-color: #e4e7ed;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        flex-shrink: 0;

        i {
          font-size: 20px;
          color: #409eff;
        }
      }

      .message-info {
        flex: 1;
        min-width: 0;

        .message-title-text {
          font-size: 14px;
          font-weight: 500;
          color: #303133;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .message-desc {
          font-size: 12px;
          color: #606266;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .message-time {
          font-size: 12px;
          color: #909399;
        }
      }

      .message-status {
        display: flex;
        align-items: center;
        margin-left: 8px;

        .unread-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #f56c6c;
        }
      }
    }
  }

  .message-footer {
    padding: 8px 16px;
    text-align: center;
    border-top: 1px solid #ebeef5;
  }
}
</style>
