<template>
  <span v-if="visible">
    <span v-if="inline" class="msun-his-sync-inline">
      <el-button type="warning" size="small" icon="el-icon-download" @click="openDialog">{{ label }}</el-button>
    </span>
    <el-col v-else :span="span">
      <el-button type="warning" size="small" icon="el-icon-download" @click="openDialog">{{ label }}</el-button>
    </el-col>
    <msun-his-param-dialog
      :visible.sync="dialogVisible"
      :title="label"
      :description="dialogDesc"
      :fields="dialogFields"
      :loading="loading"
      @confirm="handleConfirm"
    />
  </span>
</template>

<script>
import { syncMsunHisMaster } from '@/api/foundation/msunHisSync'
import { isMsunIntegratedTenant } from '@/utils/msunHis'
import { MSUN_SYNC_PROBE_FIELDS } from '@/utils/msunHisProbeApi'
import MsunHisParamDialog from '@/components/MsunHisParamDialog'

export default {
  name: 'MsunHisSyncButton',
  components: { MsunHisParamDialog },
  props: {
    syncType: { type: String, required: true },
    label: { type: String, default: 'HIS数据同步' },
    span: { type: [Number, String], default: 1.5 },
    inline: { type: Boolean, default: false },
    refresh: { type: Function, default: null }
  },
  data() {
    return {
      loading: false,
      dialogVisible: false
    }
  },
  computed: {
    visible() {
      return isMsunIntegratedTenant(this.$store.getters.customerId)
    },
    dialogFields() {
      return MSUN_SYNC_PROBE_FIELDS[this.syncType] || []
    },
    dialogDesc() {
      if (this.syncType === 'materials') {
        return '确认后将执行全量耗材同步（不传筛选条件，invalidFlag 不填）并更新 SPD 表。HIS 下载数据可能耗时数分钟，请耐心等待，勿重复点击；若提示超时，请稍后刷新列表查看是否已同步完成。'
      }
      return '可选填写筛选条件（经 SPD 后端调众阳 HIS）；确认后将执行全量同步并更新 SPD 表。数据量较大时可能较慢，请耐心等待，勿重复点击；若提示超时，请稍后刷新列表核对。'
    }
  },
  methods: {
    openDialog() {
      this.dialogVisible = true
    },
    handleConfirm(params) {
      this.loading = true
      syncMsunHisMaster(this.syncType, params).then(res => {
        this.$modal.msgSuccess((res && res.msg) || '同步完成')
        this.dialogVisible = false
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
