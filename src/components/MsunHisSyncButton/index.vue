<template>
  <span v-if="visible && inline" class="msun-his-sync-inline">
    <el-button
      type="warning"
      size="small"
      icon="el-icon-download"
      :loading="loading"
      @click="handleSync"
    >{{ label }}</el-button>
  </span>
  <el-col v-else-if="visible" :span="span">
    <el-button
      type="warning"
      size="small"
      icon="el-icon-download"
      :loading="loading"
      @click="handleSync"
    >{{ label }}</el-button>
  </el-col>
</template>

<script>
import { syncMsunHisMaster } from '@/api/foundation/msunHisSync'

/** 枣强县中医院租户 ID */
const ZQ_TCM_TENANT = 'zaoqiang-tcm-001'

export default {
  name: 'MsunHisSyncButton',
  props: {
    syncType: {
      type: String,
      required: true
    },
    label: {
      type: String,
      default: 'HIS数据同步'
    },
    span: {
      type: [Number, String],
      default: 1.5
    },
    inline: {
      type: Boolean,
      default: false
    },
    refresh: {
      type: Function,
      default: null
    }
  },
  data() {
    return {
      loading: false
    }
  },
  computed: {
    visible() {
      return this.$store.getters.customerId === ZQ_TCM_TENANT
    }
  },
  methods: {
    handleSync() {
      const tip = this.label + '：将从众阳HIS下载并更新到SPD（仅材料数据），是否继续？'
      this.$modal.confirm(tip).then(() => {
        this.loading = true
        return syncMsunHisMaster(this.syncType)
      }).then(res => {
        this.$modal.msgSuccess((res && res.msg) || '同步完成')
        if (typeof this.refresh === 'function') {
          this.refresh()
        }
        this.$emit('success', res)
      }).catch(() => {}).finally(() => {
        this.loading = false
      })
    }
  }
}
</script>
