import { buildMegaGroups, firstLevelKey, getFirstLevelMenus, isActiveFirstLevel, isLeafMenu, menuTitle, resolveMenuTo, visibleChildren } from '@/utils/nav-menu'
import { isExternal } from '@/utils/validate'

export default {
  data() {
    return {
      hoverKey: null,
      hoverTimer: null,
      panelVisible: false,
      panelGroups: [],
      panelHeading: '',
      anchorRect: null
    }
  },
  computed: {
    firstLevelMenus() {
      return getFirstLevelMenus(this.navRouters)
    }
  },
  beforeDestroy() {
    this.clearHoverTimer()
    document.removeEventListener('mousedown', this.onDocMouseDown)
  },
  mounted() {
    document.addEventListener('mousedown', this.onDocMouseDown)
  },
  watch: {
    $route() {
      this.closePanel()
    }
  },
  methods: {
    navItemKey(item, index) {
      return firstLevelKey(item, index)
    },
    isNavLeaf(item) {
      return isLeafMenu(item)
    },
    isNavActive(item) {
      return isActiveFirstLevel(this.$route.path, item)
    },
    leafTo(item) {
      const kids = visibleChildren(item)
      if (kids.length === 1 && !(item && item.alwaysShow)) {
        return resolveMenuTo(kids[0], item.path)
      }
      return resolveMenuTo(item, '')
    },
    clearHoverTimer() {
      if (this.hoverTimer) {
        clearTimeout(this.hoverTimer)
        this.hoverTimer = null
      }
    },
    onDocMouseDown(e) {
      if (!this.panelVisible) return
      const panel = document.querySelector('.mega-menu-panel')
      if (panel && panel.contains(e.target)) return
      if (this.$el && this.$el.contains(e.target)) return
      this.closePanel()
    },
    onNavEnter(item, index, evt) {
      this.clearHoverTimer()
      const key = this.navItemKey(item, index)
      this.hoverKey = key
      const mega = buildMegaGroups(item)
      if (!mega.groups.length) {
        this.panelVisible = false
        this.panelGroups = []
        this.panelHeading = ''
        return
      }
      const host = this.$el
      this.anchorRect = host && host.getBoundingClientRect
        ? host.getBoundingClientRect()
        : (evt && evt.currentTarget ? evt.currentTarget.getBoundingClientRect() : null)
      this.panelHeading = menuTitle(item)
      this.panelGroups = mega.groups
      this.panelVisible = true
    },
    onNavLeave() {
      this.schedulePanelClose()
    },
    onPanelEnter() {
      this.clearHoverTimer()
    },
    schedulePanelClose() {
      this.clearHoverTimer()
      this.hoverTimer = setTimeout(() => {
        this.panelVisible = false
        this.hoverKey = null
        this.panelGroups = []
        this.panelHeading = ''
      }, 160)
    },
    closePanel() {
      this.clearHoverTimer()
      this.panelVisible = false
      this.hoverKey = null
      this.panelGroups = []
      this.panelHeading = ''
    },
    goLeaf(item) {
      const to = this.leafTo(item)
      if (!to) return
      const path = typeof to === 'string' ? to : to.path
      if (typeof to === 'string' && isExternal(to)) {
        window.open(to, '_blank')
        return
      }
      if (path && isExternal(path)) {
        window.open(path, '_blank')
        return
      }
      this.$router.push(to).catch(() => {})
      this.$store.commit('app/SET_SIDEBAR_NAV_TICK', {
        path,
        tick: Date.now()
      })
      this.closePanel()
    }
  }
}
