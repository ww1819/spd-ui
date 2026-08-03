<template>
  <div class="app-container">
    <el-card shadow="never" v-loading="loading">
      <div slot="header" class="clearfix">
        <span style="font-weight: bold;">集采报量模式配置</span>
      </div>

      <el-alert
        title="报量模式为租户级二选一。切换后旧模式报量不会删除，切回来仍可继续使用；新模式需另行维护报量。"
        type="warning"
        :closable="false"
        show-icon
        style="margin-bottom: 20px;"
      />

      <el-descriptions :column="2" border>
        <el-descriptions-item label="当前模式">
          <el-tag :type="setting.reportMode === 'PRODUCT' ? 'success' : 'primary'" size="medium">
            {{ modeLabel(setting.reportMode) }}
          </el-tag>
          <span style="margin-left: 8px; color: #909399;">{{ setting.reportMode }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="说明">
          {{ setting.reportMode === 'TYPE' ? '按集采类型维护周期报量' : '按耗材产品维护周期报量' }}
        </el-descriptions-item>
        <el-descriptions-item label="按产品报量条数">
          {{ setting.productReportCount != null ? setting.productReportCount : 0 }}
        </el-descriptions-item>
        <el-descriptions-item label="按类型报量条数">
          {{ setting.typeReportCount != null ? setting.typeReportCount : 0 }}
        </el-descriptions-item>
      </el-descriptions>

      <div style="margin-top: 24px;">
        <div style="margin-bottom: 12px; font-weight: 500;">切换报量模式</div>
        <el-radio-group v-model="draftMode" size="medium">
          <el-radio-button label="PRODUCT">按产品报量</el-radio-button>
          <el-radio-button label="TYPE">按类型报量</el-radio-button>
        </el-radio-group>
        <div style="margin-top: 16px;">
          <el-button
            type="primary"
            :loading="saving"
            :disabled="draftMode === setting.reportMode"
            @click="handleSave"
            v-hasPermi="['foundation:jcSetting:edit']"
          >保存切换</el-button>
          <el-button @click="draftMode = setting.reportMode" :disabled="draftMode === setting.reportMode">还原</el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { getJcSetting, saveJcReportMode } from "@/api/foundation/jcSetting";

export default {
  name: "JcSetting",
  data() {
    return {
      loading: false,
      saving: false,
      setting: {
        reportMode: "PRODUCT",
        productReportCount: 0,
        typeReportCount: 0
      },
      draftMode: "PRODUCT"
    };
  },
  created() {
    this.loadSetting();
  },
  methods: {
    modeLabel(mode) {
      return mode === "TYPE" ? "按类型" : "按产品";
    },
    loadSetting() {
      this.loading = true;
      getJcSetting().then(res => {
        const data = (res && res.data) || {};
        this.setting = {
          reportMode: data.reportMode || "PRODUCT",
          productReportCount: data.productReportCount || 0,
          typeReportCount: data.typeReportCount || 0
        };
        this.draftMode = this.setting.reportMode;
      }).finally(() => {
        this.loading = false;
      });
    },
    handleSave() {
      if (this.draftMode === this.setting.reportMode) {
        return;
      }
      const fromLabel = this.modeLabel(this.setting.reportMode);
      const toLabel = this.modeLabel(this.draftMode);
      const msg =
        "确认将报量模式从「" + fromLabel + "」切换为「" + toLabel + "」？旧模式报量数据会保留，切回来仍可用；新模式需重新维护报量。";
      this.$modal.confirm(msg).then(() => {
        this.saving = true;
        return saveJcReportMode(this.draftMode);
      }).then(res => {
        const data = (res && res.data) || {};
        this.setting = {
          reportMode: data.reportMode || this.draftMode,
          productReportCount: data.productReportCount != null ? data.productReportCount : this.setting.productReportCount,
          typeReportCount: data.typeReportCount != null ? data.typeReportCount : this.setting.typeReportCount
        };
        this.draftMode = this.setting.reportMode;
        this.$modal.msgSuccess("模式已切换");
      }).catch(() => {
        this.draftMode = this.setting.reportMode;
      }).finally(() => {
        this.saving = false;
      });
    }
  }
};
</script>
