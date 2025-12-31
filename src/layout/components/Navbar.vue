<template>
  <div class="navbar">
    <hamburger id="hamburger-container" :is-active="sidebar.opened" class="hamburger-container" @toggleClick="toggleSideBar" />

    <breadcrumb id="breadcrumb-container" class="breadcrumb-container" v-if="!topNav"/>
    <top-nav id="topmenu-container" class="topmenu-container" v-if="topNav"/>

    <div class="right-menu">
      <template v-if="device!=='mobile'">
        <!-- 组织机构显示框 -->
        <div class="organization-wrapper">
          <span class="organization-text">{{ organizationUnit || '组织机构' }}</span>
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

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="avatar" class="user-avatar">
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
      // 消息列表
      messageList: [
        {
          id: 1,
          type: 'system',
          title: '系统通知',
          content: '您有一条新的系统通知，请及时查看',
          time: '2024-01-15 10:30',
          read: false
        },
        {
          id: 2,
          type: 'warning',
          title: '待办提醒',
          content: '您有3条待办事项需要处理',
          time: '2024-01-15 09:20',
          read: false
        },
        {
          id: 3,
          type: 'info',
          title: '消息通知',
          content: '您的申请已通过审核',
          time: '2024-01-14 16:45',
          read: true
        }
      ]
    }
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device'
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
    // 未读消息数量
    unreadCount() {
      return this.messageList.filter(item => !item.read).length
    }
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar')
    },
    async logout() {
      this.$confirm('确定注销并退出系统吗？', '提示', {
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
      // 这里可以添加跳转到具体消息详情的逻辑
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
    }
  },
  created() {
    // 获取参数设置第七条参数值
    this.getOrganizationUnit()
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

        .user-avatar {
          cursor: pointer;
          width: 40px;
          height: 40px;
          border-radius: 10px;
        }

        .el-icon-caret-bottom {
          cursor: pointer;
          position: absolute;
          right: -20px;
          top: 25px;
          font-size: 12px;
        }
      }
    }

    .message-badge {
      margin-right: 8px;
      display: inline-block;
      vertical-align: middle;
      
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
      
      .organization-text {
        font-weight: bold;
        font-size: 15px;
        color: #303133;
        white-space: nowrap;
      }
    }
  }
}

</style>

<style lang="scss">
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
