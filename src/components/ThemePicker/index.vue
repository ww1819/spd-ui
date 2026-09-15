<template>
  <el-color-picker
    v-model="theme"
    :predefine="['#2563eb', '#409EFF', '#1890ff', '#304156','#212121','#11a983', '#13c2c2', '#6959CD', '#f5222d', ]"
    class="theme-picker"
    popper-class="theme-picker-dropdown"
  />
</template>

<script>
const version = require('element-ui/package.json').version
const ORIGINAL_THEME = '#409EFF'
const DEFAULT_APP_THEME = '#2563eb'

export default {
  data() {
    return {
      chalk: '',
      theme: '',
      applying: false,
      appliedTheme: ''
    }
  },
  computed: {
    defaultTheme() {
      return this.$store.state.settings.theme
    }
  },
  watch: {
    defaultTheme: {
      handler(val) {
        this.theme = val
      },
      immediate: true
    },
    theme(val) {
      this.applyTheme(val)
    }
  },
  created() {
    this.applyCssVar(this.defaultTheme)
  },
  methods: {
    applyCssVar(val) {
      if (typeof val === 'string' && val && typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.style.setProperty('--current-color', val)
      }
    },
    normalizeHex(val) {
      return typeof val === 'string' ? val.trim().toLowerCase() : ''
    },
    async applyTheme(val) {
      if (typeof val !== 'string' || !val) return
      const normalized = this.normalizeHex(val)
      this.applyCssVar(val)
      // 默认色已在本地 SCSS 覆盖，启动时不必拉 unpkg、也不必改写全站 style（会把页面卡死）
      if (normalized === this.normalizeHex(DEFAULT_APP_THEME) || normalized === this.normalizeHex(ORIGINAL_THEME)) {
        this.appliedTheme = normalized
        return
      }
      if (this.appliedTheme === normalized || this.applying) return
      await this.setTheme(val)
    },
    async setTheme(val) {
      if (typeof val !== 'string' || this.applying) return
      this.applying = true
      try {
        const themeCluster = this.getThemeCluster(val.replace('#', ''))
        const originalCluster = this.getThemeCluster(ORIGINAL_THEME.replace('#', ''))

        if (!this.chalk) {
          const url = `https://unpkg.com/element-ui@${version}/lib/theme-chalk/index.css`
          await this.getCSSString(url, 'chalk')
        }
        if (!this.chalk) return

        const newStyle = this.updateStyle(this.chalk, originalCluster, themeCluster)
        let styleTag = document.getElementById('chalk-style')
        if (!styleTag) {
          styleTag = document.createElement('style')
          styleTag.setAttribute('id', 'chalk-style')
          document.head.appendChild(styleTag)
        }
        styleTag.innerText = newStyle

        this.appliedTheme = this.normalizeHex(val)
        this.$emit('change', val)
        this.applyCssVar(val)
      } finally {
        this.applying = false
      }
    },

    updateStyle(style, oldCluster, newCluster) {
      let newStyle = style
      oldCluster.forEach((color, index) => {
        if (!color) return
        newStyle = newStyle.replace(new RegExp(color.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig'), newCluster[index])
      })
      return newStyle
    },

    getCSSString(url, variable) {
      return new Promise(resolve => {
        const xhr = new XMLHttpRequest()
        const timer = setTimeout(() => {
          xhr.abort()
          resolve()
        }, 8000)
        xhr.onreadystatechange = () => {
          if (xhr.readyState !== 4) return
          clearTimeout(timer)
          if (xhr.status === 200 && xhr.responseText) {
            this[variable] = xhr.responseText.replace(/@font-face{[^}]+}/, '')
          }
          resolve()
        }
        xhr.onerror = () => {
          clearTimeout(timer)
          resolve()
        }
        xhr.open('GET', url)
        xhr.send()
      })
    },

    getThemeCluster(theme) {
      const tintColor = (color, tint) => {
        let red = parseInt(color.slice(0, 2), 16)
        let green = parseInt(color.slice(2, 4), 16)
        let blue = parseInt(color.slice(4, 6), 16)

        if (tint === 0) {
          return [red, green, blue].join(',')
        }
        red += Math.round(tint * (255 - red))
        green += Math.round(tint * (255 - green))
        blue += Math.round(tint * (255 - blue))
        return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
      }

      const shadeColor = (color, shade) => {
        let red = parseInt(color.slice(0, 2), 16)
        let green = parseInt(color.slice(2, 4), 16)
        let blue = parseInt(color.slice(4, 6), 16)
        red = Math.round((1 - shade) * red)
        green = Math.round((1 - shade) * green)
        blue = Math.round((1 - shade) * blue)
        return `#${red.toString(16).padStart(2, '0')}${green.toString(16).padStart(2, '0')}${blue.toString(16).padStart(2, '0')}`
      }

      const clusters = [theme]
      for (let i = 0; i <= 9; i++) {
        clusters.push(tintColor(theme, Number((i / 10).toFixed(2))))
      }
      clusters.push(shadeColor(theme, 0.1))
      return clusters
    }
  }
}
</script>

<style>
.theme-message,
.theme-picker-dropdown {
  z-index: 99999 !important;
}

.theme-picker .el-color-picker__trigger {
  height: 26px !important;
  width: 26px !important;
  padding: 2px;
}

.theme-picker-dropdown .el-color-dropdown__link-btn {
  display: none;
}
</style>
