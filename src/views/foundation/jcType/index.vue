<template>
  <div class="app-container list-page">
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
              :class="t === 'isUse' ? 'more-search-field--short' : 'more-search-field--text'"
            >
              <el-select
                v-if="t === 'isUse'"
                v-model="queryParams.isUse"
                placeholder="使用状态"
                clearable
                class="more-search-short-select"
              >
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
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
          @click="handleAdd"
          v-hasPermi="['foundation:jcType:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['foundation:jcType:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
      </div>
    </el-row>

    <el-table v-loading="loading" :data="dataList" :row-class-name="rowIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="50" />
      <el-table-column label="类型编码" align="center" prop="code" width="140" show-overflow-tooltip />
      <el-table-column label="类型名称" align="center" prop="name" min-width="160" show-overflow-tooltip />
      <el-table-column label="排序" align="center" prop="sortOrder" width="80" />
      <el-table-column label="使用状态" align="center" prop="isUse" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.is_use_status" :value="scope.row.isUse" />
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" min-width="120" show-overflow-tooltip />
      <el-table-column label="创建日期" align="center" prop="createTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="120" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="small" type="text" @click="handleUpdate(scope.row)" v-hasPermi="['foundation:jcType:edit']">修改</el-button>
          <el-button size="small" type="text" @click="handleDelete(scope.row)" v-hasPermi="['foundation:jcType:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />

    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="类型编码" prop="code">
                <el-input v-model="form.code" placeholder="可选，如 GC/SC" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="类型名称" prop="name">
                <el-input v-model="form.name" placeholder="如：国采、省采、线上采" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="排序" prop="sortOrder">
                <el-input-number v-model="form.sortOrder" :min="0" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="使用状态" prop="isUse">
                <el-select v-model="form.isUse" placeholder="使用状态" style="width: 100%">
                  <el-option v-for="dict in dict.type.is_use_status" :key="dict.value" :label="dict.label" :value="dict.value" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
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
import { listJcType, getJcType, addJcType, updateJcType, delJcType } from "@/api/foundation/jcType";

export default {
  name: "JcType",
  dicts: ["is_use_status"],
  computed: {
    moreSearchStorageKey() {
      return "spd.foundation.jcType.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["code", "name", "isUse"];
    }
  },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      dataList: [],
      title: "",
      open: false,
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "code", label: "类型编码" },
        { value: "name", label: "类型名称" },
        { value: "isUse", label: "使用状态" }
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        isUse: null
      },
      form: {},
      rules: {
        name: [{ required: true, message: "类型名称不能为空", trigger: "blur" }]
      }
    };
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange(this.moreSearchTypes);
    this.getList();
  },
  methods: {
    moreSearchPlaceholderFor(t) {
      const map = { code: "类型编码", name: "类型名称" };
      return map[t] || "请输入";
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
      ["code", "name", "isUse"].forEach((k) => {
        if (!set.has(k)) target[k] = null;
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      listJcType(params).then(response => {
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
        code: null,
        name: null,
        sortOrder: 0,
        isUse: "1",
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
      this.queryParams.code = null;
      this.queryParams.name = null;
      this.queryParams.isUse = null;
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加集采类型";
    },
    handleUpdate(row) {
      this.reset();
      const id = (row && row.id) || this.ids;
      getJcType(id).then(response => {
        this.form = response.data || {};
        this.open = true;
        this.title = "修改集采类型";
      });
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return;
        const req = this.form.id != null ? updateJcType(this.form) : addJcType(this.form);
        req.then(() => {
          this.$modal.msgSuccess(this.form.id != null ? "修改成功" : "新增成功");
          this.open = false;
          this.getList();
        });
      });
    },
    handleDelete(row) {
      const id = (row && row.id) || this.ids;
      this.$modal.confirm("确认删除选中的集采类型？").then(() => {
        return delJcType(id);
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
      this.download("foundation/jcType/export", params, `jcType_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
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
  min-width: 640px;
  max-width: 90vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
.app-container.list-page {
  position: relative;
  min-height: calc(100vh - 84px);
}
</style>
