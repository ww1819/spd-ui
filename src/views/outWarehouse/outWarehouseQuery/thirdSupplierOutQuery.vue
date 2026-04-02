<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectMaterial v-model="queryParams.materialId" />
              </div>
            </el-form-item>
            <el-form-item label="产品名称" prop="materialNameLike" class="query-item-inline">
              <el-input v-model="queryParams.materialNameLike" placeholder="名称/编码/拼音简码" clearable style="width: 160px" />
            </el-form-item>
            <el-form-item label="规格" prop="materialSpeciLike" class="query-item-inline">
              <el-input v-model="queryParams.materialSpeciLike" placeholder="规格模糊" clearable style="width: 140px" />
            </el-form-item>
            <el-form-item label="型号" prop="materialModelLike" class="query-item-inline">
              <el-input v-model="queryParams.materialModelLike" placeholder="型号模糊" clearable style="width: 140px" />
            </el-form-item>
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
          <el-col :span="24">
            <el-form-item style="display: flex; align-items: center;">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                style="width: 180px; margin-right: 8px;"
              />
              <span style="margin: 0 4px;">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                style="width: 180px; margin-left: 8px;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-third">
          <el-col :span="24">
            <el-form-item prop="supplerId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectSupplier v-model="queryParams.supplerId" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory">
      <el-col :span="1.5">
        <el-button type="primary" size="medium" @click="handleExport">导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="table-container">
      <el-table v-loading="loading" :data="pagedList" height="57vh" border stripe>
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="供应商" align="center" prop="supplierName" min-width="220" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.supplierName || (scope.row.supplier && scope.row.supplier.name) || '未维护供应商' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库数量" align="center" prop="outQty" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="出库金额" align="center" prop="outAmt" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.outAmt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="退库数量" align="center" prop="retQty" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="退库金额" align="center" prop="retAmt" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.retAmt | formatCurrency }}</span>
          </template>
        </el-table-column>
        <el-table-column label="净出库数量" align="center" prop="netQty" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="净出库金额" align="center" prop="netAmt" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.netAmt | formatCurrency }}</span>
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
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "thirdSupplierOutQuery",
  components: { SelectMaterial, SelectWarehouse, SelectDepartment, SelectSupplier, RightToolbar },
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
      // 供应商聚合后的全量列表（用于前端分页）
      supplierAggList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        supplerId: null,
        warehouseId: null,
        departmentId: null,
        materialNameLike: null,
        materialSpeciLike: null,
        materialModelLike: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
    };
  },
  computed: {
    pagedList() {
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
      const end = start + this.queryParams.pageSize;
      return (this.supplierAggList || []).slice(start, end);
    },
    /** 全量净出库数量 */
    totalNetQty() {
      return Number(this.totalInfo.netQty || 0);
    },
    /** 全量净出库金额（格式化） */
    totalNetAmtFormatted() {
      const amt = Number(this.totalInfo.netAmt || 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    },
    /** 当前页净出库数量 */
    pageNetQty() {
      return (this.pagedList || []).reduce((s, r) => s + Number(r.netQty || 0), 0);
    },
    /** 当前页净出库金额（格式化） */
    pageNetAmtFormatted() {
      const amt = (this.pagedList || []).reduce((s, r) => s + Number(r.netAmt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    },
  },
  methods: {
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
      // 为了供应商汇总准确性，优先拉取较大 pageSize 做前端分组，再前端分页
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
        this.buildSupplierAgg();
        this.total = this.supplierAggList.length;
        this.loading = false;
      }).catch(() => {
        this.rawList = [];
        this.supplierAggList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    buildSupplierAgg() {
      const BILL_OUT = 201;
      const BILL_RET = 401;
      const map = new Map();
      (this.rawList || []).forEach(r => {
        const sid = r.supplierId != null && r.supplierId !== '' ? String(r.supplierId) : null;
        const supplierName = (r.supplierName || (r.supplier && r.supplier.name) || '').trim() || '未维护供应商';
        const key = sid != null ? `id:${sid}` : `name:${supplierName}`;
        if (!map.has(key)) {
          map.set(key, {
            supplierId: r.supplierId,
            supplierName,
            outQty: 0,
            outAmt: 0,
            retQty: 0,
            retAmt: 0,
          });
        }
        const agg = map.get(key);
        const bt = r.billType != null ? Number(r.billType) : null;
        const qty = Number(r.materialQty || 0);
        const amt = Number(r.materialAmt || 0);
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
      this.supplierAggList = Array.from(map.values())
        .map((row) => ({
          ...row,
          netQty: row.outQty - row.retQty,
          netAmt: row.outAmt - row.retAmt,
        }))
        .sort((a, b) => b.netAmt - a.netAmt);
      this.totalInfo = this.supplierAggList.reduce(
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
    handleExport() {
      // 复用后端导出接口时需要后端支持“按供应商汇总导出”，此处先沿用现有导出避免报错
      this.download('warehouse/warehouse/export', {
        ...this.queryParams
      }, `out_refund_supplier_summary_${new Date().getTime()}.xlsx`)
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

.query-row-second .el-form-item {
  white-space: nowrap;
  margin-bottom: 0;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-row-third {
  margin-bottom: 2px;
}

.query-row-third .el-form-item {
  margin-bottom: 0;
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

.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  position: relative;
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
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: -12px !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
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

