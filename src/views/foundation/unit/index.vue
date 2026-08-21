<template>
  <div class="app-container list-page unit-page">
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
              class="more-search-dynamic-field more-search-field--text"
            >
              <el-input
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
          v-hasPermi="['foundation:unit:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['foundation:unit:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <el-table v-loading="loading" :data="unitList" :row-class-name="unitIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="50"/>
      <el-table-column label="单位编码" align="center" prop="unitCode" width="120"/>
      <el-table-column label="单位名称" align="center" prop="unitName" width="180"/>
      <el-table-column label="组织机构ID" align="center" prop="tenantId" width="130" show-overflow-tooltip />
      <el-table-column label="备注" align="center" prop="remark" min-width="120" show-overflow-tooltip />
      <el-table-column label="创建日期" align="center" prop="createTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" prop="delFlag" width="100">
        <template slot-scope="scope">
          <span v-if="scope.row.delFlag === 0 || scope.row.delFlag === null">启用</span>
          <span v-else style="color: #f56c6c;">停用</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:unit:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:unit:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="单位编码">
              <el-input v-model="form.unitCode" placeholder="留空则自动生成D开头的编码" />
            </el-form-item>
            <el-form-item label="单位名称" prop="unitName">
              <el-input v-model="form.unitName" placeholder="单位名称" />
            </el-form-item>
            <el-form-item label="启用">
              <el-switch
                v-model="form.delFlag"
                :active-value="0"
                :inactive-value="1"
              />
            </el-form-item>
            <el-form-item label="组织机构ID">
              <el-input v-model="form.tenantId" disabled placeholder="保存后由系统写入" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
            </el-form-item>
          </el-form>
        </div>
        <div class="page-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import { listUnit, getUnit, delUnit, addUnit, updateUnit } from "@/api/foundation/unit";

export default {
  name: "Unit",
  computed: {
    ...mapGetters(["customerId"]),
    moreSearchStorageKey() {
      return "spd.foundation.unit.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["unitCode", "unitName"];
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
      unitList: [],
      title: "",
      open: false,
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "unitCode", label: "单位编码" },
        { value: "unitName", label: "单位名称" }
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        unitCode: null,
        unitName: null,
      },
      form: {},
      rules: {
        unitName: [
          { required: true, message: "单位名称不能为空", trigger: "blur" }
        ],
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
      const map = { unitCode: "单位编码", unitName: "单位名称" };
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
      ["unitCode", "unitName"].forEach((k) => {
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
      listUnit(params).then(response => {
        this.unitList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        unitId: null,
        unitCode: null,
        unitName: null,
        delFlag: 0,
        tenantId: null,
        remark: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null
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
      this.queryParams.unitCode = null;
      this.queryParams.unitName = null;
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.unitId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset();
      this.form.tenantId = this.customerId || null;
      this.open = true;
      this.title = "添加单位明细";
    },
    handleUpdate(row) {
      this.reset();
      const unitId = row.unitId || this.ids
      getUnit(unitId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改单位明细";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.unitCode === "") {
            this.form.unitCode = null;
          }
          if (this.form.unitId != null) {
            updateUnit(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addUnit(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const unitIds = row.unitId || this.ids;
      this.$modal.confirm('是否确认删除单位明细编号为"' + unitIds + '"的数据项？').then(function() {
        return delUnit(unitIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    unitIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    handleExport() {
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      this.download('foundation/unit/export', params, `unit_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.unit-page {
  position: relative;
  min-height: calc(100vh - 84px);
  width: 100%;
}

.page-drawer-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 20;
  display: flex;
  justify-content: flex-end;
}

.page-drawer-panel {
  width: 520px;
  max-width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.12);
}

.page-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.page-drawer-close {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.page-drawer-close:hover {
  color: #409EFF;
}

.page-drawer-body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px 8px;
}

.page-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.page-drawer-footer .el-button {
  margin: 0 8px;
}
</style>
