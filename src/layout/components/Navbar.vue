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

        <!-- 消息提醒：点击铃铛直接打开弹窗 -->
        <div class="right-menu-item hover-effect" @click="openMessageReminderModal">
          <i class="el-icon-bell"></i>
        </div>

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
      // 系统版本信息对话框显示状态
      versionDialogVisible: false,
      backendAppName: '',
      backendVersion: '',
      backendBuildTime: ''
    }
  },
  computed: {
    ...mapGetters([
      'sidebar',
      'avatar',
      'device',
      'name',
      'nickName',
      'messageReminderKeys'
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
    }
  },
  methods: {
    /** 点击铃铛：直接打开消息提醒弹窗（按授权定位首个分类） */
    openMessageReminderModal() {
      const keys = this.messageReminderKeys
      const order = ['warehouse', 'department', 'data']
      const allowed = keys == null
        ? order.slice()
        : order.filter(k => Array.isArray(keys) && keys.includes(k))
      const category = allowed.length ? allowed[0] : 'warehouse'
      this.$store.dispatch('app/openWarehouseReminder', { category })
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
</style>
