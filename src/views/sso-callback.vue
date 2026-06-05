<template>
  <div class="sso-callback">正在登录，请稍候…</div>
</template>

<script>
import { setToken } from '@/utils/auth'

export default {
  name: 'SsoCallback',
  created() {
    const token = this.$route.query.token
    const redirect = this.$route.query.redirect || '/'
    if (!token) {
      this.$message.error('单点登录缺少 token')
      this.$router.replace('/login')
      return
    }
    setToken(token)
    this.$store.dispatch('GetInfo').then(() => {
      this.$store.dispatch('GenerateRoutes').then(accessRoutes => {
        this.$router.addRoutes(accessRoutes)
        const target = decodeURIComponent(redirect)
        this.$router.replace(target.startsWith('/') ? target : '/' + target)
      }).catch(() => {
        this.$router.replace('/')
      })
    }).catch(() => {
      this.$router.replace('/login')
    })
  }
}
</script>

<style scoped>
.sso-callback {
  padding: 48px;
  text-align: center;
  color: #606266;
}
</style>
