<template>
  <div
    class="sidebar-logo-container"
    :class="{'collapse': collapse, 'is-dark': isDark}"
    :style="{ backgroundColor: isDark ? variables.menuBackground : variables.menuLightBackground }"
  >
    <transition name="sidebarLogoFade">
      <router-link :key="collapse ? 'collapse' : 'expand'" class="sidebar-logo-link" to="/">
        <img :src="logo" class="sidebar-logo" alt="艾思普特" />
      </router-link>
    </transition>
  </div>
</template>

<script>
import logoImg from '@/assets/logo/aisipute.jpg'
import variables from '@/assets/styles/variables.scss'

export default {
  name: 'SidebarLogo',
  props: {
    collapse: {
      type: Boolean,
      required: true
    }
  },
  computed: {
    variables() {
      return variables
    },
    isDark() {
      return this.$store.state.settings.sideTheme === 'theme-dark'
    },
  },
  data() {
    return {
      logo: logoImg
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
  line-height: 84px;
  flex-shrink: 0;
  text-align: center;
  overflow: hidden;
  border: none;
  border-bottom: 1px solid #d8dce5;

  &.is-dark {
    border-bottom-color: rgba(255, 255, 255, 0.06);
  }

  & .sidebar-logo-link {
    height: 100%;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 8px 12px;
    box-sizing: border-box;

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
    .sidebar-logo {
      object-fit: cover;
      object-position: left center;
    }
  }
}
</style>
