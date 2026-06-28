<template>
  <div class="inner-link-page">
    <data-center-top-decoration v-if="displayTopDecoration" />
    <div
      class="inner-link-body"
      v-loading="loading"
      element-loading-text="正在加载页面，请稍候！"
    >
      <iframe
        :id="iframeId"
        :src="src"
        frameborder="no"
      />
    </div>
  </div>
</template>

<script>
import DataCenterTopDecoration from '@/components/DataCenterTopDecoration/index.vue'

export default {
  components: { DataCenterTopDecoration },
  props: {
    src: {
      type: String,
      default: '/'
    },
    iframeId: {
      type: String
    },
    /** 页签标题，用于判断是否展示顶部装饰 */
    title: {
      type: String,
      default: ''
    },
    /** 显式控制顶部装饰；未传时按标题自动判断（效能/数据分析/BI） */
    showTopDecoration: {
      type: Boolean,
      default: undefined
    }
  },
  data() {
    return {
      loading: false
    }
  },
  computed: {
    displayTopDecoration() {
      if (this.showTopDecoration !== undefined) {
        return this.showTopDecoration
      }
      const routeTitle = this.$route && this.$route.meta && this.$route.meta.title
      const t = (this.title || routeTitle || '').trim()
      return /效能|数据分析|BI/i.test(t)
    }
  },
  mounted() {
    const iframeId = ('#' + this.iframeId).replace(/\//g, '\\/')
    const iframe = document.querySelector(iframeId)
    if (!iframe) {
      return
    }
    if (iframe.attachEvent) {
      this.loading = true
      iframe.attachEvent('onload', () => {
        this.loading = false
      })
    } else {
      this.loading = true
      iframe.onload = () => {
        this.loading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.inner-link-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 94.5px);
  background: #f0f2f5;
}

.inner-link-body {
  flex: 1;
  min-height: 0;
  position: relative;
}

.inner-link-body iframe {
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
  background: #fff;
}
</style>
