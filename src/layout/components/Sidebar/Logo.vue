<template>
  <div
    class="sidebar-logo-container"
    :class="{'collapse': collapse, 'is-dark': isDark}"
    :style="{ backgroundColor: isDark ? variables.menuBackground : variables.menuLightBackground }"
  >
    <transition name="sidebarLogoFade">
      <router-link :key="collapse ? 'collapse' : 'expand'" class="sidebar-logo-link" to="/">
        <img
          :src="collapse ? markLogo : logo"
          class="sidebar-logo"
          :class="{ 'is-mark': collapse }"
          :alt="logoAlt"
        />
      </router-link>
    </transition>
  </div>
</template>

<script>
import logoDefault from '@/assets/logo/aisipute-wide.png'
import logoWide2 from '@/assets/logo/aisipute-wide2.png'
import variables from '@/assets/styles/variables.scss'
import { getConfigKey } from '@/api/system/config'

/** 参数键：sys.index.sidebarLogo；1=默认 aisipute-wide.png，2=aisipute-wide2.png */
const SIDEBAR_LOGO_CONFIG_KEY = 'sys.index.sidebarLogo'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      logoVariant: '1'
    }
  },
  computed: {
    variables() {
      return variables
    },
    isDark() {
      return this.$store.state.settings.sideTheme === 'theme-dark'
    },
    markLogo() {
      return `${process.env.BASE_URL || '/'}favicon.png`
    },
    logo() {
      return String(this.logoVariant) === '2' ? logoWide2 : logoDefault
    },
    logoAlt() {
      return String(this.logoVariant) === '2' ? '九州通医药集团' : '艾思普特'
    }
  },
  created() {
    this.loadSidebarLogo()
  },
  methods: {
    loadSidebarLogo() {
      getConfigKey(SIDEBAR_LOGO_CONFIG_KEY).then(res => {
        // 若依 getConfigKey：参数值放在 msg
        const val = res && res.msg != null ? res.msg : ''
        const v = String(val).trim()
        this.logoVariant = v === '2' ? '2' : '1'
      }).catch(() => {
        this.logoVariant = '1'
      })
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebarLogoFade-enter-active {
  transition: opacity 1.5s;
}

.sidebarLogoFade-enter,
.sidebarLogoFade-leave-to {
  opacity: 0;
}

.sidebar-logo-container {
  position: relative;
  width: 100%;
  height: 84px;
  line-height: 1;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: none;
  border-bottom: 1px solid #d8dce5;

  &.is-dark {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex !important;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    box-sizing: border-box;
    line-height: 1;

    & .sidebar-logo {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      object-position: center;
      margin: 0;
      border-radius: 0;
    }
  }

  &.collapse {
    .sidebar-logo-link {
      padding: 0 7px;

      .sidebar-logo.is-mark {
        width: 40px;
        height: 40px;
        flex-shrink: 0;
        object-fit: contain;
        object-position: center;
      }
    }
  }
}
</style>
