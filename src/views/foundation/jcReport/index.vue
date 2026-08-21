<template>
  <div class="app-container list-page">
    <el-alert
      :title="modeTip"
      type="info"
      :closable="false"
      show-icon
      style="margin-bottom: 12px;"
    />

    <div class="query-container" v-show="showSearch">
      <div class="form-fields-container list-query-panel">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
          <more-search-bar
            ref="moreSearchBar"
            v-model="moreSearchTypes"
            :options="moreSearchOptions"
            :storage-key="moreSearchStorageKey"
            :default-types="builtInMoreSearchDefaults"
            :auto-load="false"
            @change="onMoreSearchTypesChange"
            @search="handleQuery"
            @reset="resetQuery"
          >
            <div
              v-for="t in moreSearchTypes"
              :key="t"
              class="more-search-dynamic-field"
              :class="moreSearchFieldClass(t)"
            >
              <el-select
                v-if="t === 'periodId'"
                v-model="queryParams.periodId"
                placeholder="集采周期"
                clearable
                filterable
                class="more-search-select-wrap"
                style="width: 190px"
              >
                <el-option
                  v-for="item in periodOptions"
                  :key="item.id"
                  :label="formatPeriodLabel(item)"
                  :value="item.id"
                />
              </el-select>
              <el-select
                v-else-if="t === 'reportMode'"
                v-model="queryParams.reportMode"
                placeholder="报量模式"
                class="more-search-select-wrap"
                style="width: 190px"
                @change="handleQuery"
              >
                <el-option :label="'当前模式（' + modeLabel(currentMode) + '）'" :value="currentMode" />
                <el-option
                  v-if="currentMode === 'PRODUCT'"
                  label="历史：按类型（只读）"
                  value="TYPE"
                />
                <el-option
                  v-if="currentMode === 'TYPE'"
                  label="历史：按产品（只读）"
                  value="PRODUCT"
                />
              </el-select>
              <el-input
                v-else
                v-model="queryParams[t]"
                :placeholder="moreSearchPlaceholderFor(t)"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
            </div>
          </more-search-bar>
        </el-form>
      </div>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          :disabled="isHistoryMode"
          @click="handleAdd"
          v-hasPermi="['foundation:jcReport:add']"
        >新增报量</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['foundation:jcReport:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
      </div>
    </el-row>

    <el-table v-loading="loading" :data="dataList" :row-class-name="rowIndex" height="calc(100vh - 360px)" stripe>
      <el-table-column label="序号" align="center" prop="index" width="50" />
      <el-table-column label="周期" align="center" prop="periodName" min-width="140" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.periodName || '-' }}</span>
          <span v-if="scope.row.periodStartYm" style="color:#909399;margin-left:4px;">
            ({{ scope.row.periodStartYm }}~{{ scope.row.periodEndYm }})
          </span>
        </template>
      </el-table-column>
      <el-table-column label="模式" align="center" prop="reportMode" width="100">
        <template slot-scope="scope">
          <el-tag size="mini" :type="scope.row.reportMode === currentMode ? 'success' : 'info'">
            {{ modeLabel(scope.row.reportMode) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="queryParams.reportMode === 'PRODUCT'" label="耗材编码" align="center" prop="materialCode" width="130" show-overflow-tooltip />
      <el-table-column v-if="queryParams.reportMode === 'PRODUCT'" label="耗材名称" align="center" prop="materialName" min-width="160" show-overflow-tooltip />
      <el-table-column v-if="queryParams.reportMode === 'TYPE'" label="类型编码" align="center" prop="jcTypeCode" width="120" show-overflow-tooltip />
      <el-table-column v-if="queryParams.reportMode === 'TYPE'" label="集采类型" align="center" prop="jcTypeName" min-width="140" show-overflow-tooltip />
      <el-table-column label="报量数" align="center" prop="reportQty" width="120" />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" show-overflow-tooltip />
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            :disabled="isHistoryMode"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:jcReport:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            :disabled="isHistoryMode"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:jcReport:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="110px">
          <el-form-item label="集采周期" prop="periodId">
            <el-select v-model="form.periodId" placeholder="请选择周期" filterable style="width: 100%" :disabled="!!form.id">
              <el-option
                v-for="item in periodOptions"
                :key="item.id"
                :label="formatPeriodLabel(item)"
                :value="item.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item v-if="currentMode === 'PRODUCT'" label="耗材" prop="materialId">
            <SelectMaterial v-model="form.materialId" :value2="!!form.id" />
          </el-form-item>
          <el-form-item v-if="currentMode === 'TYPE'" label="集采类型" prop="jcTypeId">
            <SelectJcType v-model="form.jcTypeId" :disabled="!!form.id" />
          </el-form-item>
          <el-form-item label="报量数" prop="reportQty">
            <el-input-number v-model="form.reportQty" :min="0" :precision="2" controls-position="right" style="width: 100%" />
          </el-form-item>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
          </el-form-item>
        </el-form>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listJcReport, getJcReport, addJcReport, updateJcReport, delJcReport } from "@/api/foundation/jcReport";
import { getJcSetting } from "@/api/foundation/jcSetting";
import { listJcPeriodAll } from "@/api/foundation/jcPeriod";
import SelectJcType from "@/components/SelectModel/SelectJcType";

export default {
  name: "JcReport",
  components: { SelectJcType },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      dataList: [],
      periodOptions: [],
      currentMode: "PRODUCT",
      title: "",
      open: false,
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "periodId", label: "集采周期" },
        { value: "reportMode", label: "报量模式" },
        { value: "materialName", label: "耗材名称" },
        { value: "jcTypeName", label: "集采类型名称" }
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        periodId: null,
        reportMode: "PRODUCT",
        materialName: null,
        jcTypeName: null
      },
      form: {},
      rules: {
        periodId: [{ required: true, message: "请选择集采周期", trigger: "change" }],
        materialId: [{ required: true, message: "请选择耗材", trigger: "change" }],
        jcTypeId: [{ required: true, message: "请选择集采类型", trigger: "change" }],
        reportQty: [{ required: true, message: "报量数不能为空", trigger: "blur" }]
      }
    };
  },
  computed: {
    isHistoryMode() {
      return this.queryParams.reportMode !== this.currentMode;
    },
    modeTip() {
      const cur = this.modeLabel(this.currentMode);
      if (this.isHistoryMode) {
        return "当前租户启用「" + cur + "」报量；正在查看另一模式历史数据（只读，切换模式后可继续维护）。";
      }
      return "当前租户报量模式：「" + cur + "」。同一周期+维度重复提交会覆盖报量数。";
    },
    moreSearchStorageKey() {
      return "spd.foundation.jcReport.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["periodId", "reportMode", "materialName", "jcTypeName"];
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.init();
  },
  methods: {
    moreSearchPlaceholderFor(t) {
      const map = { materialName: "耗材名称", jcTypeName: "集采类型名称" };
      return map[t] || "请输入";
    },
    moreSearchFieldClass(t) {
      if (t === "periodId" || t === "reportMode") return "more-search-field--select";
      return "more-search-field--text";
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.loadDefaults === "function") {
        return bar.loadDefaults();
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v));
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      if (!set.has("periodId")) target.periodId = null;
      if (!set.has("materialName")) target.materialName = null;
      if (!set.has("jcTypeName")) target.jcTypeName = null;
      if (!target.reportMode) target.reportMode = this.currentMode;
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    modeLabel(mode) {
      return mode === "TYPE" ? "按类型" : "按产品";
    },
    formatPeriodLabel(item) {
      if (!item) return "";
      const range = item.startYm && item.endYm ? "（" + item.startYm + "~" + item.endYm + "）" : "";
      return (item.name || "") + range;
    },
    async init() {
      try {
        const [settingRes, periodRes] = await Promise.all([getJcSetting(), listJcPeriodAll({ isUse: "1" })]);
        const data = (settingRes && settingRes.data) || {};
        this.currentMode = data.reportMode || "PRODUCT";
        this.queryParams.reportMode = this.currentMode;
        this.periodOptions = periodRes || [];
      } catch (e) {
        this.currentMode = "PRODUCT";
        this.queryParams.reportMode = "PRODUCT";
      }
      this.getList();
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      listJcReport(params).then(response => {
        this.dataList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(() => {
        this.dataList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: null,
        periodId: this.queryParams.periodId || null,
        materialId: null,
        jcTypeId: null,
        reportQty: undefined,
        remark: null
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.queryParams.periodId = null;
      this.queryParams.materialName = null;
      this.queryParams.jcTypeName = null;
      this.queryParams.reportMode = this.currentMode;
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    handleAdd() {
      if (this.isHistoryMode) {
        this.$modal.msgWarning("请先切回当前模式再维护报量");
        return;
      }
      this.reset();
      this.open = true;
      this.title = "新增集采报量（" + this.modeLabel(this.currentMode) + "）";
    },
    handleUpdate(row) {
      if (this.isHistoryMode) {
        this.$modal.msgWarning("历史模式数据只读，请先切换报量模式");
        return;
      }
      this.reset();
      getJcReport(row.id).then(response => {
        this.form = response.data || {};
        this.open = true;
        this.title = "修改集采报量";
      });
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return;
        const payload = { ...this.form };
        const req = payload.id != null ? updateJcReport(payload) : addJcReport(payload);
        req.then(() => {
          this.$modal.msgSuccess(payload.id != null ? "修改成功" : "保存成功");
          this.open = false;
          this.getList();
        });
      });
    },
    handleDelete(row) {
      if (this.isHistoryMode) {
        this.$modal.msgWarning("历史模式数据不可删除");
        return;
      }
      this.$modal.confirm("确认删除该报量记录？").then(() => {
        return delJcReport(row.id);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    rowIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    handleExport() {
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      this.download("foundation/jcReport/export", params, `jcReport_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}
.local-modal-content {
  background-color: #fff;
  padding: 24px;
  border-radius: 6px;
  min-width: 560px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
