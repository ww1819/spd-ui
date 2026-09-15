<template>
  <div class="app-container list-page unit-page" ref="pageRoot">
    <div class="unit-main">
      <div class="form-fields-container list-query-panel" v-show="showSearch">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
          <div class="unit-query-row">
            <el-input
              v-model="queryParams.unitCode"
              placeholder="单位编码"
              clearable
              class="unit-query-control"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.unitName"
              placeholder="单位名称"
              clearable
              class="unit-query-control"
              @keyup.enter.native="handleQuery"
            />
            <div class="unit-query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </div>
        </el-form>
      </div>

      <el-row :gutter="0" class="list-toolbar unit-toolbar">
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
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
        </div>
      </el-row>

      <div class="apply-table-panel" ref="tablePanel">
        <el-table
          ref="unitTable"
          v-loading="loading"
          :data="unitList"
          class="apply-main-table"
          border
          stripe
          :height="mainTableHeight"
          :row-class-name="unitRowClassName"
          @selection-change="handleSelectionChange"
          @sort-change="handleSortChange"
        >
          <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
          <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
          <el-table-column label="单位编码" align="center" prop="unitCode" width="150" sortable="custom" show-overflow-tooltip />
          <el-table-column label="单位名称" align="center" prop="unitName" min-width="160" sortable="custom" show-overflow-tooltip />
          <el-table-column label="组织机构ID" align="center" prop="tenantId" width="160" sortable="custom" show-overflow-tooltip />
          <el-table-column label="备注" align="center" prop="remark" min-width="140" show-overflow-tooltip />
          <el-table-column label="创建日期" align="center" prop="createTime" width="150" sortable="custom" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" prop="delFlag" width="110" sortable="custom" show-overflow-tooltip>
            <template slot-scope="scope">
              <span v-if="scope.row.delFlag === 0 || scope.row.delFlag === null">启用</span>
              <span v-else style="color: #f56c6c;">停用</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="apply-action-col" width="140">
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

        <div class="apply-pagination-wrap">
          <pagination
            v-show="total > 0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
    </div>

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
    ...mapGetters(["customerId"])
  },
  data() {
    return {
      loading: true,
      ids: [],
      rowHighlightTick: 0,
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      unitList: [],
      mainTableHeight: 400,
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        unitCode: null,
        unitName: null,
        orderByColumn: null,
        isAsc: null
      },
      form: {},
      rules: {
        unitName: [
          { required: true, message: "单位名称不能为空", trigger: "blur" }
        ],
      }
    };
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    this.$nextTick(() => {
      this.updateMainTableHeight();
      setTimeout(() => this.updateMainTableHeight(), 80);
      setTimeout(() => this.updateMainTableHeight(), 200);
    });
    window.addEventListener('resize', this.updateMainTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateMainTableHeight);
  },
  methods: {
    /** 明细框高度：底边对齐页面内容区底部 */
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const root = this.$refs.pageRoot || this.$el;
      if (!panel || !panel.getBoundingClientRect || !root || !root.getBoundingClientRect) return;
      const panelTop = panel.getBoundingClientRect().top;
      const targetBottom = root.getBoundingClientRect().bottom;
      const pagEl = panel.querySelector('.apply-pagination-wrap');
      let pagH = pagEl ? pagEl.getBoundingClientRect().height : 52;
      if (pagH < 40) pagH = 52;
      const borderY =
        (parseFloat(window.getComputedStyle(panel).borderTopWidth) || 0) +
        (parseFloat(window.getComputedStyle(panel).borderBottomWidth) || 0);
      const next = Math.max(240, Math.floor(targetBottom - panelTop - pagH - borderY));
      if (Math.abs((this.mainTableHeight || 0) - next) >= 2) {
        this.mainTableHeight = next;
      }
      this.$nextTick(() => {
        if (this.$refs.unitTable && this.$refs.unitTable.doLayout) {
          this.$refs.unitTable.doLayout();
        }
      });
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      listUnit(params).then(response => {
        const rows = (response && response.rows) || [];
        this.unitList = rows.map((item, index) => ({
          ...item,
          index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
        }));
        this.total = (response && response.total) || 0;
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      }).catch(() => {
        this.loading = false;
        this.unitList = [];
        this.total = 0;
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
      this.queryParams.unitCode = null;
      this.queryParams.unitName = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      if (this.$refs.unitTable && this.$refs.unitTable.clearSort) {
        this.$refs.unitTable.clearSort();
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        unitCode: 'unit_code',
        unitName: 'unit_name',
        tenantId: 'tenant_id',
        createTime: 'create_time',
        delFlag: 'del_flag'
      };
      if (!order) {
        this.queryParams.orderByColumn = null;
        this.queryParams.isAsc = null;
      } else {
        this.queryParams.orderByColumn = columnMap[prop] || prop;
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleSelectionChange(selection) {
      this.ids = (selection || []).map(item => item.unitId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    unitRowClassName({ row }) {
      void this.rowHighlightTick;
      const rid = row && row.unitId != null ? String(row.unitId) : '';
      if (rid && this.ids.some(id => String(id) === rid)) {
        return 'apply-row-selected';
      }
      return '';
    },
    handleAdd() {
      this.reset();
      this.form.tenantId = this.customerId || null;
      this.open = true;
      this.title = "添加单位明细";
    },
    handleUpdate(row) {
      this.reset();
      const unitId = row.unitId || this.ids;
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
    handleExport() {
      const params = { ...this.queryParams };
      this.download('foundation/unit/export', params, `unit_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style scoped>
.unit-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  width: 100%;
  gap: 4px;
}

.unit-page .unit-main > .list-query-panel,
.unit-page .unit-main > .unit-toolbar,
.unit-page .unit-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.unit-page .unit-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.unit-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.unit-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.unit-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.apply-table-panel {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0 !important;
  background: #fff !important;
  border: 1px solid #e8ecf1 !important;
  border-radius: 10px !important;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05) !important;
  overflow: hidden;
  height: auto !important;
  width: 100%;
  box-sizing: border-box;
}

.apply-table-panel > .apply-main-table {
  flex: 0 0 auto;
  min-height: 0;
  margin-bottom: 0 !important;
  border-radius: 0;
  box-shadow: none;
}

.apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 12px 14px;
  box-sizing: border-box;
}

.apply-pagination-wrap ::v-deep .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  overflow: visible !important;
}

.apply-pagination-wrap ::v-deep .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
  margin: 0 !important;
}

.unit-page .apply-main-table.el-table {
  position: relative;
}

.unit-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.unit-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.unit-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.unit-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.unit-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.unit-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.unit-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.unit-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.unit-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.unit-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.unit-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.unit-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.unit-page .apply-main-table ::v-deep .el-table__body tr > td,
.unit-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.unit-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.unit-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.unit-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.unit-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.unit-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.unit-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.unit-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.unit-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.unit-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.unit-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.unit-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.unit-page .apply-main-table ::v-deep th.apply-select-col,
.unit-page .apply-main-table ::v-deep td.apply-select-col,
.unit-page .apply-main-table ::v-deep th.el-table-column--selection,
.unit-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.unit-page .apply-main-table ::v-deep th.apply-action-col,
.unit-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.unit-page .apply-main-table ::v-deep td.apply-select-col,
.unit-page .apply-main-table ::v-deep td.el-table-column--selection,
.unit-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.unit-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.unit-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.unit-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.unit-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.unit-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
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

<style>
.app-container.unit-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.unit-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.unit-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.unit-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.unit-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.unit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.unit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
