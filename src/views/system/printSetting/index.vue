<template>
  <div class="app-container list-page print-setting-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form
        class="query-form"
        :model="queryParams"
        ref="queryForm"
        size="small"
        :inline="true"
      >
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.templateName"
              placeholder="模板名称"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.tenantId"
              placeholder="组织机构ID，全库默认留空"
              clearable
              class="apply-query-input apply-query-field apply-query-field--tenant"
              @keyup.enter.native="handleQuery"
            />
            <el-select
              v-model="queryParams.billType"
              placeholder="单据类型"
              clearable
              class="apply-query-field"
            >
              <el-option label="入库单" :value="101" />
              <el-option label="退货单" :value="102" />
              <el-option label="出库单" :value="201" />
              <el-option label="退库单" :value="202" />
              <el-option label="盘点单" :value="301" />
              <el-option label="入库单(高值)" :value="111" />
              <el-option label="退货单(高值)" :value="112" />
              <el-option label="出库单(高值)" :value="211" />
              <el-option label="退库单(高值)" :value="212" />
              <el-option label="跟台条码" :value="401" />
              <el-option label="备货条码" :value="402" />
            </el-select>
            <div class="query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          icon="el-icon-plus"
          class="spd-btn spd-btn--primary"
          @click="handleAdd"
          v-hasPermi="['system:printSetting:add']"
        >新增</el-button>
        <el-button
          size="small"
          icon="el-icon-edit"
          class="spd-btn spd-btn--secondary"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['system:printSetting:edit']"
        >修改</el-button>
        <el-button
          size="small"
          icon="el-icon-delete"
          class="spd-btn spd-btn--danger"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['system:printSetting:remove']"
        >删除</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
      <el-table
        ref="printMainTable"
        v-loading="loading"
        :data="printSettingList"
        class="table-compact apply-main-table"
        border
        stripe
        :height="mainTableHeight"
        :row-class-name="printMainRowClassName"
        @selection-change="handleSelectionChange"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
        <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip resizable />
        <el-table-column label="模板名称" align="center" prop="templateName" min-width="160" sortable="custom" show-overflow-tooltip resizable />
        <el-table-column label="适用组织机构" align="center" prop="tenantId" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.tenantId || '全库默认' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单据类型" align="center" prop="billType" width="120" sortable="custom" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ billTypeLabel(scope.row.billType) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="页面尺寸" align="center" width="150" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.pageWidth }}mm × {{ scope.row.pageHeight }}mm</span>
          </template>
        </el-table-column>
        <el-table-column label="方向" align="center" prop="orientation" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.orientation === 'landscape' ? '横向' : '纵向' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="启用/停用" align="center" prop="status" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.sys_normal_disable" :value="scope.row.status"/>
          </template>
        </el-table-column>
        <el-table-column label="是否默认" align="center" prop="isDefault" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <el-tag :type="scope.row.isDefault === 1 ? 'success' : 'info'" size="small">
              {{ scope.row.isDefault === 1 ? '是' : '否' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建日期" align="center" prop="createTime" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="创建人" align="center" prop="createBy" width="100" show-overflow-tooltip resizable />
        <el-table-column
          label="操作"
          align="center"
          width="220"
          fixed="right"
          class-name="apply-action-col small-padding fixed-width"
          header-cell-class-name="apply-action-col"
        >
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['system:printSetting:edit']"
            >修改</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-star-off"
              @click="handleSetDefault(scope.row)"
              v-hasPermi="['system:printSetting:edit']"
              v-if="scope.row.isDefault !== 1"
            >设默认</el-button>
            <el-button
              size="mini"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['system:printSetting:remove']"
            >删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="apply-pagination-wrap apply-pager-bar" ref="paginationWrap">
        <div class="pagination-summary">
          <span class="summary-label">合计：</span>共 {{ total || 0 }} 条
        </div>
        <pagination
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          :pager-count="7"
          @pagination="getList"
        />
      </div>
    </div>

    <PrintSettingEditDialog v-if="open" />
  </div>
</template>

<script>
import { listPrintSetting, getPrintSetting, delPrintSetting, setDefaultTemplate } from "@/api/system/printSetting";

const BILL_TYPE_MAP = {
  101: '入库单',
  102: '退货单',
  201: '出库单',
  202: '退库单',
  301: '盘点单',
  111: '入库单(高值)',
  112: '退货单(高值)',
  211: '出库单(高值)',
  212: '退库单(高值)',
  401: '跟台条码',
  402: '备货条码'
};

export default {
  name: "PrintSetting",
  dicts: ['sys_normal_disable'],
  components: {
    PrintSettingEditDialog: () => import('./components/PrintSettingEditDialog')
  },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      mainTableHeight: 400,
      printSettingList: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        templateName: undefined,
        tenantId: undefined,
        billType: undefined,
        orderByColumn: undefined,
        isAsc: undefined
      },
      form: {}
    };
  },
  watch: {
    showSearch() {
      this.scheduleLayoutRefresh();
    },
    total() {
      this.scheduleLayoutRefresh();
    },
    open(val) {
      if (!val) {
        this.scheduleLayoutRefresh();
      }
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    window.addEventListener('resize', this.onWindowResize);
    this.scheduleLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onWindowResize);
  },
  methods: {
    billTypeLabel(type) {
      return BILL_TYPE_MAP[type] || '—';
    },
    printMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      return '';
    },
    onWindowResize() {
      this.updateMainTableHeight();
    },
    scheduleLayoutRefresh() {
      const run = () => this.updateMainTableHeight();
      this.$nextTick(() => {
        run();
        requestAnimationFrame(() => {
          run();
          [50, 120, 300].forEach((ms) => setTimeout(run, ms));
        });
      });
    },
    /** 按表格卡片剩余高度计算主表高度，保证翻页完整可见（对齐到货验收） */
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const next = Math.floor(panelH - pagH);
      const height = Math.max(200, next);
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.printMainTable;
        if (table && table.doLayout) {
          table.doLayout();
        }
      });
    },
    getList() {
      this.loading = true;
      listPrintSetting(this.queryParams).then(response => {
        this.printSettingList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        this.scheduleLayoutRefresh();
      }).catch(() => {
        this.loading = false;
        this.printSettingList = [];
        this.total = 0;
        this.scheduleLayoutRefresh();
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.templateName = undefined;
      this.queryParams.tenantId = undefined;
      this.queryParams.billType = undefined;
      this.queryParams.orderByColumn = undefined;
      this.queryParams.isAsc = undefined;
      if (this.$refs.printMainTable && this.$refs.printMainTable.clearSort) {
        this.$refs.printMainTable.clearSort();
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        templateName: 'template_name',
        billType: 'bill_type'
      };
      if (!order || !columnMap[prop]) {
        this.queryParams.orderByColumn = undefined;
        this.queryParams.isAsc = undefined;
      } else {
        this.queryParams.orderByColumn = columnMap[prop];
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    handleAdd() {
      this.form = {};
      this.open = true;
      this.title = "添加打印设置";
      this.$nextTick(() => {
        if (this.$refs.form) {
          this.$refs.form.resetForm();
        }
      });
    },
    handleUpdate(row) {
      const id = (row && row.id) || this.ids[0];
      getPrintSetting(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改打印设置";
        this.$nextTick(() => {
          if (this.$refs.form) {
            this.$refs.form.setFormData(this.form);
          }
        });
      });
    },
    submitForm() {
      if (this.$refs.form) {
        this.$refs.form.submitForm();
      }
    },
    cancel() {
      this.open = false;
      this.form = {};
    },
    handleSetDefault(row) {
      this.$modal.confirm('是否确认将"' + row.templateName + '"设置为默认模板？').then(() => {
        return setDefaultTemplate({ id: row.id, billType: row.billType, tenantId: row.tenantId });
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("设置成功");
      }).catch(() => {});
    },
    handleDelete(row) {
      const ids = (row && row.id) || this.ids;
      this.$modal.confirm('是否确认删除打印设置编号为"' + ids + '"的数据项？').then(() => {
        return delPrintSetting(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleFormSuccess() {
      this.open = false;
      this.getList();
    }
  }
};
</script>

<style scoped>
.print-setting-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 84px);
  height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  overflow: hidden;
  box-sizing: border-box;
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 14px !important;
}

.list-query-panel .el-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: transparent;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}

.list-query-panel .el-form .query-row-first {
  margin-bottom: 0;
}

.list-query-panel .el-form .query-row-first-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
}

.apply-query-field,
.list-query-panel .el-form .query-row-first-inner .apply-query-input {
  width: 160px;
}

.apply-query-field--tenant {
  width: 220px !important;
}

.query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  margin-left: 4px;
}

.apply-table-panel {
  flex: 1 1 auto;
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

.apply-pager-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  min-height: 40px;
  padding: 4px 0;
  box-sizing: border-box;
}

.apply-pager-bar .pagination-summary {
  flex: 1 1 auto;
  min-width: 120px;
  margin-left: 12px;
  padding-left: 4px;
  font-size: 13px;
  color: #606266;
  line-height: 28px;
}

.apply-pager-bar .pagination-summary .summary-label {
  font-weight: 600;
  color: #303133;
}

.apply-pager-bar .pagination-container {
  margin-top: 0 !important;
  margin-left: auto;
}

.apply-pagination-wrap.apply-pager-bar {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 8px 14px;
  margin-top: 0;
  box-sizing: border-box;
}
</style>

<style>
.app-container.print-setting-page.is-modal-open > .list-query-panel,
.app-container.print-setting-page.is-modal-open > .list-toolbar,
.app-container.print-setting-page.is-modal-open > .apply-table-panel {
  display: none;
}

.app-container.print-setting-page .apply-main-table .el-table__header-wrapper th,
.app-container.print-setting-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.print-setting-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.print-setting-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.print-setting-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.print-setting-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.app-container.print-setting-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.print-setting-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.print-setting-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 20px !important;
  text-align: center !important;
}

.app-container.print-setting-page .apply-main-table td .cell {
  font-size: 13px;
  line-height: 20px;
}

.app-container.print-setting-page .apply-main-table .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.app-container.print-setting-page .apply-pagination-wrap .pagination-container {
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

.app-container.print-setting-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
  margin: 0 !important;
}

/*
 * 弹窗默认 z-index≈2000，会盖住侧栏(1001)。压到侧栏之下，左侧菜单永远在最上。
 * wrapper 全屏：无遮罩时需 pointer-events 穿透，否则顶栏汉堡点不到。
 */
.print-setting-dialog.el-dialog__wrapper {
  pointer-events: none;
  z-index: 1000 !important;
}

/* 弹窗铺满主内容区：侧栏展开 200 / 收拢 54（与 layout sidebar 一致） */
.print-setting-dialog .el-dialog,
.print-setting-dialog-panel.el-dialog {
  pointer-events: auto;
  display: flex !important;
  flex-direction: column !important;
  max-width: 100% !important;
  width: calc(100% - 200px) !important;
  height: calc(100vh - 88px) !important;
  max-height: calc(100vh - 88px) !important;
  margin-top: 88px !important;
  margin-left: 200px !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  left: 0 !important;
  transform: none !important;
  transition: width 0.28s, margin-left 0.28s;
}

/* 由弹窗自身 class 跟随 vuex 侧栏状态（比依赖 hideSidebar 祖先更稳） */
.print-setting-dialog.is-sidebar-collapsed .el-dialog,
.print-setting-dialog.is-sidebar-collapsed .print-setting-dialog-panel.el-dialog,
#app .hideSidebar .print-setting-dialog .el-dialog,
#app .hideSidebar .print-setting-dialog-panel.el-dialog,
.hideSidebar .print-setting-dialog .el-dialog,
.hideSidebar .print-setting-dialog-panel.el-dialog {
  width: calc(100% - 54px) !important;
  margin-left: 54px !important;
}

.print-setting-page .print-setting-dialog .el-dialog__header,
.print-setting-dialog .el-dialog__header {
  flex-shrink: 0;
  padding: 10px 16px !important;
}

/* body 吃满剩余高度，去掉多余底边距，画布可以更高 */
.print-setting-dialog .el-dialog__body {
  flex: 1 1 auto !important;
  height: auto !important;
  max-height: none !important;
  min-height: 0 !important;
  overflow: hidden !important;
  padding: 0 8px 6px 8px !important;
  box-sizing: border-box;
}

.print-setting-dialog .el-dialog__body::-webkit-scrollbar {
  width: 0;
  height: 0;
}
.print-setting-dialog .el-dialog__body {
  scrollbar-width: none;
}

.print-setting-dialog-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dialog-header-close {
  padding: 0 8px;
}

.print-setting-page .print-setting-dialog .el-dialog__header {
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
}

.print-setting-page .print-setting-dialog .el-dialog__title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.print-setting-page .print-setting-dialog .el-dialog__headerbtn {
  top: 14px;
}
</style>
