<template>
  <div class="hover-top-nav">
    <div class="hover-top-nav-track">
      <div
        v-for="(item, index) in firstLevelMenus"
        :key="navItemKey(item, index)"
        class="hover-top-item"
        :class="{
          'is-active': isNavActive(item),
          'is-open': hoverKey === navItemKey(item, index)
        }"
        @mouseenter="onNavEnter(item, index, $event)"
        @mouseleave="onNavLeave"
        @click="onItemClick(item, index, $event)"
      >
        <svg-icon v-if="menuIcon(item)" :icon-class="menuIcon(item)" class="hover-top-icon" />
        <span class="hover-top-title">{{ menuTitle(item) }}</span>
      </div>
    </div>
    <mega-menu-panel
      :visible="panelVisible"
      :groups="panelGroups"
      :heading="panelHeading"
      placement="bottom"
      :anchor-rect="anchorRect"
      @enter="onPanelEnter"
      @leave="onNavLeave"
      @navigated="closePanel"
    />
  </div>
</template>

<script>
import MegaMenuPanel from '@/layout/components/MegaMenuPanel'
import hoverNav from '@/layout/mixin/hoverNav'
import { menuIcon, menuTitle } from '@/utils/nav-menu'

export default {
  name: 'TopNav',
  components: { MegaMenuPanel },
  mixins: [hoverNav],
  computed: {
    navRouters() {
      return this.$store.getters.sidebarRouters
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
.hover-top-nav {
  flex: 1;
  min-width: 0;
  height: 50px;
  display: flex;
  align-items: stretch;
}

.hover-top-nav-track {
  display: flex;
  align-items: stretch;
  overflow-x: auto;
  overflow-y: hidden;
  height: 100%;
  padding: 0 4px;
}

.hover-top-nav-track::-webkit-scrollbar {
  height: 0;
}

.hover-top-item {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  height: 50px;
  padding: 0 16px;
  margin: 0;
  cursor: pointer;
  color: #5c6570;
  font-size: 14px;
  font-weight: 400;
  position: relative;
  user-select: none;
  transition: color 0.15s ease;
}

.hover-top-icon {
  margin-right: 6px;
  font-size: 15px;
  color: #8b96a3;
  background: none;
}

.hover-top-title {
  white-space: nowrap;
  letter-spacing: 0.02em;
}

.hover-top-item:hover,
.hover-top-item.is-open {
  color: #1c2430;
  background: transparent;
}

.hover-top-item:hover .hover-top-icon,
.hover-top-item.is-open .hover-top-icon {
  color: var(--current-color, #2563eb);
}

.hover-top-item.is-active {
  color: #1c2430;
  font-weight: 500;
  background: transparent;
}

.hover-top-item.is-active::after {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  bottom: 0;
  height: 2px;
  background: var(--current-color, #2563eb);
  border-radius: 2px 2px 0 0;
}

.hover-top-item.is-active .hover-top-icon {
  color: var(--current-color, #2563eb);
}
</style>
