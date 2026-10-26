<template>
    <el-dialog title="Cron表达式生成器" :visible.sync="openCron" append-to-body destroy-on-close class="scrollbar">
      <crontab @hide="openCron=false" @fill="crontabFill" :expression="expression"></crontab>
    </el-dialog>
</template>

<script>
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import Crontab from '@/components/Crontab'

export default {
  name: 'JobCronDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'Job')],
  components: { Crontab },
  inheritAttrs: false
}
</script>
