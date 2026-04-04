<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="高值"/>
              </div>
            </el-form-item>
            <el-form-item label="出库科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-end"
              />
            </el-form-item>

            <el-form-item label="供应商" prop="supplerId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectSupplier v-model="queryParams.supplerId" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory button-row-inventory-flex">
      <div class="button-row-left">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
        >导出</el-button>
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </div>
      <div class="button-row-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
      <el-table v-loading="loading" :data="pagedList" show-summary :summary-method="getTotalSummaries" height="60vh" border stripe>
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="科室" align="center" prop="departmentName" min-width="220" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.departmentName || (scope.row.department && scope.row.department.name) || '未维护科室' }}</span>
          </template>
        </el-table-column>
        <!-- 库房分类：动态列，该分类下净金额（出库加、退库减），与科室净出库口径一致 -->
        <el-table-column
          v-for="(cat, catIdx) in warehouseCategoryNames"
          :key="'wc-' + catIdx + '-' + cat"
          :label="cat"
          :prop="'catAmt_' + catIdx"
          align="center"
          min-width="130"
          show-overflow-tooltip
          resizable
        >
          <template slot-scope="scope">
            <span>{{ formatCategoryCell(scope.row, catIdx) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="净出库数量" align="center" prop="netQty" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="净出库金额" align="center" prop="netAmt" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ formatNetCurrency(scope.row.netAmt) }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>净出库数量: {{ totalNetQty }}，净出库金额: {{ totalNetAmtFormatted }}，当前页净出库数量: {{ pageNetQty }}，当前页净出库金额: {{ pageNetAmtFormatted }}
      </div>
      <div class="pagination-container">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          :pager-count="11"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { listCTKWarehouseSummary } from "@/api/warehouse/outWarehouse";
import { exportDepartmentSummaryStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "fourthDepartmentOutQuery",
  components: { SelectWarehouse, SelectDepartment, SelectSupplier, RightToolbar },
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      totalInfo: {
        outQty: 0,
        outAmt: 0,
        retQty: 0,
        retAmt: 0,
        netQty: 0,
        netAmt: 0
      },
      // 后端返回的明细（汇总表数据行）
      rawList: [],
      // 科室聚合后的全量列表（用于前端分页）
      departmentAggList: [],
      /** 当前查询结果中出现的库房分类名称（有序），用于动态列 */
      warehouseCategoryNames: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        supplerId: null,
        warehouseId: null,
        departmentId: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
    };
  },
  computed: {
    pagedList() {
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
      const end = start + this.queryParams.pageSize;
      return (this.departmentAggList || []).slice(start, end);
    },
    /** 全量净出库数量 */
    totalNetQty() {
      return Number(this.totalInfo.netQty || 0);
    },
    /** 全量净出库金额（格式化） */
    totalNetAmtFormatted() {
      return this.formatNetCurrency(this.totalInfo.netAmt || 0);
    },
    /** 当前页净出库数量 */
    pageNetQty() {
      return (this.pagedList || []).reduce((s, r) => s + Number(r.netQty || 0), 0);
    },
    /** 当前页净出库金额（格式化） */
    pageNetAmtFormatted() {
      const amt = (this.pagedList || []).reduce((s, r) => s + Number(r.netAmt || 0), 0);
      return this.formatNetCurrency(amt);
    },
  },
  methods: {
    /** 汇总行金额展示（分类净额，可为负；0 显示 0.00 而非全局 formatCurrency 的「-」） */
    formatCategoryCell(row, catIdx) {
      const v = row && row[`catAmt_${catIdx}`] != null ? Number(row[`catAmt_${catIdx}`]) : 0;
      if (!Number.isFinite(v) || v === 0) {
        return '0.00';
      }
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      return fmt ? fmt(v) : v.toFixed(2);
    },
    /** 净出库金额：0 显示 0.00（避免 formatCurrency 将 0 当成空） */
    formatNetCurrency(value) {
      const n = Number(value);
      if (!Number.isFinite(n) || n === 0) {
        return '0.00';
      }
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      return fmt ? fmt(n) : n.toFixed(2);
    },
    /** 从汇总行数据取库房分类名称 */
    getWarehouseCategoryName(r) {
      const n = (
        r.materialWarehouseCategoryName
        || (r.material && r.material.fdWarehouseCategory && r.material.fdWarehouseCategory.warehouseCategoryName)
        || ''
      ).trim();
      return n || '未分类';
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill('');
      if (sums.length > 0) sums[0] = '合计';

      const totalNetQty = (data || []).reduce((acc, r) => acc + Number(r.netQty || 0), 0);
      const totalNetAmt = (data || []).reduce((acc, r) => acc + Number(r.netAmt || 0), 0);

      const fmt = this.$options.filters && this.$options.filters.formatCurrency;

      columns.forEach((column, index) => {
        const prop = column.property;
        if (prop && String(prop).startsWith('catAmt_')) {
          const idx = parseInt(String(prop).replace('catAmt_', ''), 10);
          if (!Number.isNaN(idx)) {
            const t = (data || []).reduce((acc, r) => acc + Number((r && r[`catAmt_${idx}`]) || 0), 0);
            sums[index] = !Number.isFinite(t) || t === 0 ? '0.00' : fmt ? fmt(t) : t.toFixed(2);
          }
          return;
        }
        switch (prop) {
          case 'netQty':
            sums[index] = totalNetQty.toFixed(2);
            break;
          case 'netAmt':
            sums[index] = this.formatNetCurrency(totalNetAmt);
            break;
          default:
            break;
        }
      });
      return sums;
    },
    normalizeQueryParams() {
      const queryParams = { ...this.queryParams };
      if (!queryParams.beginDate) queryParams.beginDate = null;
      if (!queryParams.endDate) {
        queryParams.endDate = null;
      } else if (queryParams.endDate && queryParams.endDate.length === 10) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '') queryParams[key] = null;
      });
      return queryParams;
    },
    getList() {
      this.loading = true;
      const queryParams = this.normalizeQueryParams();
      // 为了科室汇总准确性，优先拉取较大 pageSize 做前端分组，再前端分页
      const requestParams = {
        ...queryParams,
        pageNum: 1,
        pageSize: 10000,
      };
      listCTKWarehouseSummary(requestParams).then(response => {
        const rows = (response && response.rows) ? response.rows : (Array.isArray(response) ? response : []);
        this.rawList = rows.map(item => ({
          ...item,
          materialAmt: item.materialAmt != null ? Number(item.materialAmt) : 0,
          materialQty: item.materialQty != null ? Number(item.materialQty) : 0,
          billType: item.billType != null ? Number(item.billType) : null,
        }));
        this.buildDepartmentAgg();
        this.total = this.departmentAggList.length;
        this.loading = false;
      }).catch(() => {
        this.rawList = [];
        this.departmentAggList = [];
        this.warehouseCategoryNames = [];
        this.total = 0;
        this.loading = false;
      });
    },
    buildDepartmentAgg() {
      const BILL_OUT = 201;
      const BILL_RET = 401;
      // 当前结果集中出现的库房分类（动态列）
      const catSet = new Set();
      (this.rawList || []).forEach(r => {
        catSet.add(this.getWarehouseCategoryName(r));
      });
      this.warehouseCategoryNames = Array.from(catSet).sort((a, b) => String(a).localeCompare(String(b), 'zh-CN'));
      const catList = this.warehouseCategoryNames;
      const catIndex = {};
      catList.forEach((c, i) => { catIndex[c] = i; });

      const map = new Map();
      (this.rawList || []).forEach(r => {
        const did = r.departmentId != null && r.departmentId !== '' ? String(r.departmentId) : null;
        const departmentName = (r.departmentName || (r.department && r.department.name) || '').trim() || '未维护科室';
        const key = did != null ? `id:${did}` : `name:${departmentName}`;
        if (!map.has(key)) {
          const init = {
            departmentId: r.departmentId,
            departmentName,
            outQty: 0,
            outAmt: 0,
            retQty: 0,
            retAmt: 0,
          };
          catList.forEach((c, i) => {
            init[`catAmt_${i}`] = 0;
          });
          map.set(key, init);
        }
        const agg = map.get(key);
        const bt = r.billType != null ? Number(r.billType) : null;
        const qty = Number(r.materialQty || 0);
        const amt = Number(r.materialAmt || 0);
        const cat = this.getWarehouseCategoryName(r);
        const ci = catIndex[cat];
        if (ci != null && agg[`catAmt_${ci}`] != null) {
          // 该分类下净金额：出库加、退库减（与本科室「净出库金额 = 出库合计 − 退库合计」一致，避免退库发生在其它分类时本分类仍显示毛额造成误解）
          if (bt === BILL_RET) {
            agg[`catAmt_${ci}`] -= amt;
          } else {
            agg[`catAmt_${ci}`] += amt;
          }
        }
        if (bt === BILL_OUT) {
          agg.outQty += qty;
          agg.outAmt += amt;
        } else if (bt === BILL_RET) {
          agg.retQty += qty;
          agg.retAmt += amt;
        } else {
          agg.outQty += qty;
          agg.outAmt += amt;
        }
      });
      this.departmentAggList = Array.from(map.values())
        .map((row) => ({
          ...row,
          netQty: row.outQty - row.retQty,
          netAmt: row.outAmt - row.retAmt,
        }))
        .sort((a, b) => b.netAmt - a.netAmt);
      this.totalInfo = this.departmentAggList.reduce(
        (acc, r) => {
          acc.outQty += r.outQty;
          acc.outAmt += r.outAmt;
          acc.retQty += r.retQty;
          acc.retAmt += r.retAmt;
          acc.netQty += r.netQty;
          acc.netAmt += r.netAmt;
          return acc;
        },
        { outQty: 0, outAmt: 0, retQty: 0, retAmt: 0, netQty: 0, netAmt: 0 }
      );
      this.queryParams.pageNum = 1;
    },
    handleQuery() {
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
    },
    /** 导出按钮操作：xlsx，合并标题、边框、合计行红色数字 */
    async handleExport() {
      const rows = this.departmentAggList || [];
      if (!rows.length) {
        this.$message && this.$message.warning('暂无数据可导出');
        return;
      }
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const fileName = `出退库汇总(科室)${dateStr}.xlsx`;
      try {
        await exportDepartmentSummaryStyledXlsx({
          warehouseCategoryNames: this.warehouseCategoryNames || [],
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      }
    },
    getStatDate() {
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
    },
    getEndDate() {
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
    },
  },
};
</script>

<style scoped>
/* 与库存明细查询保持一致的顶部偏移 */
.app-container {
  margin-top: -10px;
}

/* 查询条件样式（与 secondOutQuery.vue 完全一致） */
.query-row-left {
  margin-bottom: 2px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-item-inline .el-form-item {
  margin-bottom: 0;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 2px;
}

/* 第二行：强制同一行不换行（避免宽度不足时“掉到下一行”） */
.query-row-second-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  gap: 4px;
  padding-bottom: 2px;
}

.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 8px;
  white-space: nowrap;
}

.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 150px;
}

.query-item-date-range .query-date-start {
  margin-right: 6px;
}

.query-item-date-range .query-date-end {
  margin-left: 6px;
}

.query-item-date-range .query-date-sep {
  margin: 0 2px;
  flex-shrink: 0;
}

/* 查询条件容器框样式：由外层 inventory-query-page 统一左右 8px，此处占满内容区 */
.form-fields-container {
  background: #fff;
  padding: 6px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
  border: 1px solid #EBEEF5;
}

/* 导出/搜索/重置：与顶部搜索框、底部明细框间距均为 8px */
.button-row-inventory {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
}

.button-row-inventory-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.button-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.button-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

/* 明细表底部合计行：给表体底部留空间，并把 footer-wrapper 抬高，避免横向滚动条遮挡 */
.table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 32px;
}

.table-container ::v-deep .el-table__footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 3;
  background: #fff;
}

.table-container ::v-deep .el-table__fixed-footer-wrapper {
  position: sticky;
  bottom: 12px;
  z-index: 4;
  background: #fff;
}

/* 合计行数量/金额等单元格不要自动换行，避免合计撑高 */
.table-container ::v-deep .el-table__footer-wrapper td.el-table__cell,
.table-container ::v-deep .el-table__footer-wrapper .cell {
  white-space: nowrap;
  overflow: visible;
  text-overflow: initial;
}
.table-container ::v-deep .el-table__fixed-footer-wrapper td.el-table__cell,
.table-container ::v-deep .el-table__fixed-footer-wrapper .cell {
  white-space: nowrap;
  overflow: visible;
  text-overflow: initial;
}

/* 表格底部横向滚动条：默认 6px，鼠标悬停自动变粗 12px */
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 6px;
  transition: height 0.2s ease;
}
.table-container:hover ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 3px;
  margin: 0 2px;
  cursor: pointer;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 3px;
  cursor: grab;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #808080;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #606060;
  cursor: grabbing;
}

/* 优化表格列间距 */
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}
</style>

<style>
/* 取消内层 app-container 的左右 padding，避免叠加全局 20px；左右 8px 由外层 inventory-query-page 统一控制 */
.app-container.first-inventory-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* 分页行：合计在左、翻页在右，同一行；翻页下方不留白 */
.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}
</style>

