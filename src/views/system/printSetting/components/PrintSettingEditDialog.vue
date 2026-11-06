<template>
    <el-dialog
      :class="['print-setting-dialog', { 'is-sidebar-collapsed': !sidebarOpened }]"
      custom-class="print-setting-dialog-panel"
      :title="title"
      :visible.sync="open"
      :append-to-body="false"
      :modal="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <span slot="title" class="print-setting-dialog-title">
        <span>{{ title }}</span>
        <el-button type="text" size="mini" class="dialog-header-close" @click="cancel">关闭</el-button>
      </span>
      <print-setting-form ref="form" :form-data="form" @success="handleFormSuccess" @cancel="cancel" />
    </el-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { createHostProxyMixin } from '@/mixins/hostProxyMixin'
import PrintSettingForm from "../form";

export default {
  name: 'PrintSettingEditDialog',
  mixins: [createHostProxyMixin(vm => vm.$options && vm.$options.name === 'PrintSetting')],
  components: { PrintSettingForm },
  inheritAttrs: false,
  computed: {
    ...mapState({
      sidebarOpened: state => !!(state.app.sidebar && state.app.sidebar.opened)
    })
  }
}
</script>
