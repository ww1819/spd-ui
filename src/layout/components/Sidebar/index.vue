<template>
  <div
    class="sidebar-hover-root"
    :class="{ 'has-logo': showLogo, 'is-collapse': isCollapse, 'is-dark': isDark, 'is-light': !isDark }"
    :style="{ backgroundColor: isDark ? variables.menuBackground : variables.menuLightBackground }"
  >
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper" class="sidebar-hover-scroll">
      <div class="hover-nav-list">
        <div
          v-for="(item, index) in firstLevelMenus"
          :key="navItemKey(item, index)"
          class="hover-nav-item"
          :class="{
            'is-active': isNavActive(item),
            'is-open': hoverKey === navItemKey(item, index),
            'is-leaf': isNavLeaf(item)
          }"
          @mouseenter="onNavEnter(item, index, $event)"
          @mouseleave="onNavLeave"
          @click="onItemClick(item, index, $event)"
        >
          <svg-icon v-if="menuIcon(item)" :icon-class="menuIcon(item)" class="hover-nav-icon" />
          <span v-show="!isCollapse" class="hover-nav-title">{{ menuTitle(item) }}</span>
          <i v-if="!isNavLeaf(item) && !isCollapse" class="el-icon-arrow-right hover-nav-arrow" />
        </div>
      </div>
    </el-scrollbar>
    <mega-menu-panel
      :visible="panelVisible"
      :groups="panelGroups"
      :heading="panelHeading"
      placement="right"
      :anchor-rect="anchorRect"
      @enter="onPanelEnter"
      @leave="onNavLeave"
      @navigated="closePanel"
    />
  </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import Logo from './Logo'
import MegaMenuPanel from '../MegaMenuPanel'
import hoverNav from '@/layout/mixin/hoverNav'
import { menuIcon, menuTitle } from '@/utils/nav-menu'
import variables from '@/assets/styles/variables.scss'

export default {
  name: 'Sidebar',
  components: { Logo, MegaMenuPanel },
  mixins: [hoverNav],
  computed: {
    ...mapState(['settings']),
    ...mapGetters(['sidebarRouters', 'sidebar']),
    navRouters() {
      return this.sidebarRouters
    },
    showLogo() {
      return this.$store.state.settings.sidebarLogo
    },
    variables() {
      return variables
    },
    isCollapse() {
      return !this.sidebar.opened
    },
    isDark() {
      return this.settings.sideTheme === 'theme-dark'
    }
  },
  methods: {
    menuIcon,
    menuTitle,
    onItemClick(item, index, evt) {
      if (this.isNavLeaf(item)) {
        this.goLeaf(item)
        return
      }
      if (this.$store.state.app.device === 'mobile') {
        this.onNavEnter(item, index, evt)
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.sidebar-hover-root {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.sidebar-hover-scroll {
  flex: 1;
  height: auto;
}

.hover-nav-list {
  padding: 10px 0 24px;
}

.hover-nav-item {
  display: flex;
  align-items: center;
  height: 44px;
  padding: 0 18px 0 20px;
  margin: 0;
  border-radius: 0;
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  font-weight: 400;
  position: relative;
  transition: background-color 0.15s ease, color 0.15s ease;
}

.hover-nav-icon {
  flex-shrink: 0;
  margin-right: 10px;
  font-size: 16px;
  background: none;
}

.hover-nav-title {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 22px;
  letter-spacing: 0.02em;
}

.hover-nav-arrow {
  flex-shrink: 0;
  font-size: 12px;
}

.is-dark .hover-nav-item {
  color: #c9d2dc;
}

.is-dark .hover-nav-icon,
.is-dark .hover-nav-arrow {
  color: #8b96a3;
}

.is-dark .hover-nav-item:hover,
.is-dark .hover-nav-item.is-open {
  background: #262f3d;
  color: #fff;
}

.is-dark .hover-nav-item:hover .hover-nav-icon,
.is-dark .hover-nav-item.is-open .hover-nav-icon {
  color: #fff;
}

.is-dark .hover-nav-item.is-active {
  background: #151b24;
  color: #fff;
}

.is-dark .hover-nav-item.is-active .hover-nav-icon {
  color: var(--current-color, #2563eb);
}

.is-light .hover-nav-item {
  color: #334155;
}

.is-light .hover-nav-icon,
.is-light .hover-nav-arrow {
  color: #64748b;
}

.is-light .hover-nav-item:hover,
.is-light .hover-nav-item.is-open {
  background: #f1f5f9;
  color: #0f172a;
}

.is-light .hover-nav-item:hover .hover-nav-icon,
.is-light .hover-nav-item.is-open .hover-nav-icon {
  color: var(--current-color, #2563eb);
}

.is-light .hover-nav-item.is-active {
  background: #f8fafc;
  color: #0f172a;
}

.is-light .hover-nav-item.is-active .hover-nav-icon {
  color: var(--current-color, #2563eb);
}

.hover-nav-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10px;
  bottom: 10px;
  width: 3px;
  border-radius: 0 2px 2px 0;
  background: var(--current-color, #2563eb);
}

.is-collapse .hover-nav-item {
  justify-content: center;
  padding: 0;
}

.is-collapse .hover-nav-icon {
  margin-right: 0;
}

.is-collapse .hover-nav-item.is-active::before {
  top: 8px;
  bottom: 8px;
}
</style>
