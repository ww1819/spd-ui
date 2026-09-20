<template>
  <div
    v-show="visible"
    ref="panel"
    class="mega-menu-panel"
    :class="{ 'is-bottom': placement === 'bottom' }"
    :style="panelStyle"
    @mouseenter="$emit('enter')"
    @mouseleave="$emit('leave')"
  >
    <div v-if="heading" class="mega-menu-head">
      <span class="mega-menu-mark" />
      <div class="mega-menu-heading">{{ heading }}</div>
    </div>
    <div v-if="groups && groups.length" class="mega-menu-inner">
      <div
        v-for="(group, gi) in groups"
        :key="gi"
        class="mega-group"
        :class="{ 'has-children': group.children && group.children.length }"
      >
        <div
          v-if="group.to && (!group.children || !group.children.length)"
          class="mega-group-title mega-group-title--link"
          :class="{ 'is-active': isActive(group.to) }"
          @click="go(group.to)"
        >{{ group.title }}</div>
        <div v-else class="mega-group-title">{{ group.title }}</div>
        <div v-if="group.children && group.children.length" class="mega-links">
          <a
            v-for="(link, li) in group.children"
            :key="li"
            class="mega-link"
            :class="{ 'is-active': isActive(link.to) }"
            href="javascript:;"
            @click.prevent="go(link.to)"
          >{{ link.title }}</a>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { isExternal } from '@/utils/validate'
import { isActivePath, pathOfTo } from '@/utils/nav-menu'

export default {
  name: 'MegaMenuPanel',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    groups: {
      type: Array,
      default: () => []
    },
    heading: {
      type: String,
      default: ''
    },
    placement: {
      type: String,
      default: 'right'
    },
    anchorRect: {
      type: Object,
      default: null
    }
  },
  data() {
    return {
      pos: { top: 0, left: 0, width: null, height: null }
    }
  },
  computed: {
    panelStyle() {
      const style = {
        top: this.pos.top + 'px',
        left: this.pos.left + 'px',
        '--current-color': (this.$store.state.settings.theme) || '#2563eb'
      }
      if (this.pos.width) {
        style.width = this.pos.width + 'px'
      }
      if (this.pos.height) {
        style.height = this.pos.height + 'px'
      }
      return style
    }
  },
  watch: {
    visible: {
      handler(val) {
        if (val) {
          this.$nextTick(() => this.reposition())
        }
      }
    },
    anchorRect: {
      handler() {
        if (this.visible) {
          this.$nextTick(() => this.reposition())
        }
      },
      deep: true
    },
    groups() {
      if (this.visible) {
        this.$nextTick(() => this.reposition())
      }
    }
  },
  mounted() {
    document.body.appendChild(this.$el)
    window.addEventListener('resize', this.reposition)
    window.addEventListener('scroll', this.reposition, true)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.reposition)
    window.removeEventListener('scroll', this.reposition, true)
    if (this.$el && this.$el.parentNode) {
      this.$el.parentNode.removeChild(this.$el)
    }
  },
  methods: {
    isActive(to) {
      return isActivePath(this.$route.path, to)
    },
    go(to) {
      if (!to) return
      const path = pathOfTo(to)
      if (typeof to === 'string' && isExternal(to)) {
        window.open(to, '_blank')
      } else if (path && isExternal(path)) {
        window.open(path, '_blank')
      } else {
        this.$router.push(to).catch(() => {})
        this.$store.commit('app/SET_SIDEBAR_NAV_TICK', {
          path,
          tick: Date.now()
        })
      }
      this.$emit('navigated')
    },
    reposition() {
      const rect = this.anchorRect
      if (!rect) return
      const vw = window.innerWidth
      const vh = window.innerHeight
      const pad = 20
      if (this.placement === 'bottom') {
        this.pos = {
          top: Math.round(rect.bottom),
          left: pad,
          width: Math.max(520, vw - pad * 2),
          height: null
        }
        return
      }
      this.pos = {
        top: 0,
        left: Math.round(rect.right),
        width: null,
        height: vh
      }
    }
  }
}
</script>

<style lang="scss" scoped>
$ink: #1c2430;
$paper: #fffefb;
$muted: #6b7380;
$text: #3a4350;

.mega-menu-panel {
  position: fixed;
  z-index: 2000;
  min-width: 460px;
  max-width: min(760px, calc(100vw - 220px));
  overflow: auto;
  background: $paper;
  color: $text;
  border: none;
  border-radius: 0 18px 18px 0;
  box-shadow: 12px 0 40px rgba(16, 24, 40, 0.14);
}

.mega-menu-panel::before {
  content: '';
  position: absolute;
  left: -14px;
  top: 0;
  width: 14px;
  height: 100%;
}

.mega-menu-panel.is-bottom {
  min-width: 0;
  max-width: none;
  max-height: min(68vh, 560px);
  border-radius: 0 0 18px 18px;
  box-shadow: 0 16px 40px rgba(16, 24, 40, 0.12);
}

.mega-menu-panel.is-bottom::before {
  left: 0;
  top: -12px;
  width: 100%;
  height: 12px;
}

.mega-menu-head {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 28px 12px;
}

.mega-menu-mark {
  width: 10px;
  height: 10px;
  border-radius: 2px;
  background: var(--current-color, #2563eb);
  flex-shrink: 0;
}

.mega-menu-heading {
  font-size: 16px;
  font-weight: 650;
  color: $ink;
  letter-spacing: 0.04em;
  line-height: 22px;
}

.mega-menu-inner {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(168px, 1fr));
  gap: 22px 28px;
  padding: 8px 28px 28px;
}

.mega-group {
  min-width: 0;
}

.mega-group-title {
  font-size: 13px;
  font-weight: 650;
  color: $ink;
  line-height: 22px;
  margin-bottom: 8px;
  padding: 0 0 8px;
  border-bottom: 1px solid rgba(28, 36, 48, 0.08);
}

.mega-group-title--link {
  cursor: pointer;
  font-weight: 400;
  color: $text;
  border-bottom: none;
  padding: 7px 10px;
  margin: 0 -10px;
  border-radius: 8px;
}

.mega-group-title--link:hover,
.mega-group-title--link.is-active {
  background: color-mix(in srgb, var(--current-color, #2563eb) 12%, #fff);
  color: var(--current-color, #2563eb);
}

.mega-links {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.mega-link {
  display: block;
  font-size: 13px;
  line-height: 20px;
  color: $muted;
  text-decoration: none;
  padding: 7px 10px;
  margin: 0 -10px;
  border-radius: 8px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 400;
}

.mega-link:hover {
  background: color-mix(in srgb, var(--current-color, #2563eb) 14%, #fff);
  color: var(--current-color, #2563eb);
}

.mega-link.is-active {
  background: color-mix(in srgb, var(--current-color, #2563eb) 18%, #fff);
  color: var(--current-color, #2563eb);
  font-weight: 500;
}
</style>
