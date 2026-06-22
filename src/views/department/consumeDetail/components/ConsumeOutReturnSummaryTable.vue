<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable />
              </div>
            </el-form-item>
            <el-form-item label="科室" prop="departmentKeyword" class="query-item-inline">
              <el-input
                v-model="queryParams.departmentKeyword"
                placeholder="科室编码/名称/拼音简码"
                clearable
                class="query-input-wide"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="耗材" prop="materialNameLike" class="query-item-inline">
              <div class="query-select-wrapper">
                <MaterialAutocomplete v-model="queryParams.materialNameLike" />
              </div>
            </el-form-item>
            <el-form-item label="规格" prop="materialSpeciLike" class="query-item-inline">
              <el-input
                v-model="queryParams.materialSpeciLike"
                placeholder="规格模糊"
                clearable
                class="query-input-spec"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="领用时间" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="开始日期"
                clearable
                class="query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截至日期"
                clearable
                class="query-date-end"
              />
            </el-form-item>
            <el-form-item prop="financeCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper category-multi-wrap">
                <SelectFinanceCategoryLow
                  v-model="queryParams.financeCategoryIds"
                  :multiple="true"
                  placeholder="财务分类"
                />
              </div>
            </el-form-item>
            <el-form-item prop="warehouseCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper category-multi-wrap">
                <SelectWarehouseCategoryLow
                  v-model="queryParams.warehouseCategoryIds"
                  :multiple="true"
                  placeholder="库房分类"
                />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory button-row-inventory-flex">
      <div class="button-row-left">
        <el-button type="warning" icon="el-icon-download" size="medium" @click="handleExport">导出</el-button>
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </div>
      <div class="button-row-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="dataList"
        show-summary
        :summary-method="getTotalSummaries"
        height="60vh"
        border
        stripe
      >
        <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column label="科室" align="center" prop="departmentName" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="仓库" align="center" prop="warehouseName" min-width="100" show-overflow-tooltip resizable />
        <el-table-column label="帐类名称" align="center" prop="accountKindName" width="90" show-overflow-tooltip resizable />
        <el-table-column label="耗材名称" align="center" prop="materialName" min-width="160" show-overflow-tooltip resizable />
        <el-table-column label="规格" align="center" prop="materialSpeci" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable />
        <el-table-column label="数量" align="center" prop="materialQty" width="90" show-overflow-tooltip resizable />
        <el-table-column label="采购价" align="center" prop="unitPrice" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.unitPrice != null && scope.row.unitPrice !== ''">{{ scope.row.unitPrice | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.materialAmt != null && scope.row.materialAmt !== ''">{{ scope.row.materialAmt | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="财务分类" align="center" prop="financeCategoryName" min-width="100" show-overflow-tooltip resizable />
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额:
        {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额:
        {{ pageTotalAmtFormatted }}
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
import { listConsumeOutReturnSummary } from "@/api/department/consumeDetail";
import { exportConsumeOutReturnSummaryStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import SelectFinanceCategoryLow from "@/components/SelectModel/SelectFinanceCategoryLow";
import SelectWarehouseCategoryLow from "@/components/SelectModel/SelectWarehouseCategoryLow";
import RightToolbar from "@/components/RightToolbar";
import { getDefaultBeginDate, getDefaultEndDate } from "../consumeDetailDateDefaults";

export default {
  name: "ConsumeOutReturnSummaryTable",
  components: {
    SelectWarehouse,
    MaterialAutocomplete,
    SelectFinanceCategoryLow,
    SelectWarehouseCategoryLow,
    RightToolbar
  },
  data() {
    return {
      loading: true,
      showSearch: true,
      total: 0,
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      dataList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        departmentKeyword: null,
        materialNameLike: null,
        materialSpeciLike: null,
        financeCategoryIds: null,
        warehouseCategoryIds: null,
        beginDate: getDefaultBeginDate(),
        endDate: getDefaultEndDate()
      }
    };
  },
  computed: {
    pageTotalQty() {
      return (this.dataList || []).reduce((s, r) => s + Number(r.materialQty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.dataList || []).reduce((s, r) => s + Number(r.materialAmt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    }
  },
  mounted() {
    this.getList();
  },
  methods: {
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill("");
      let totalQty = 0;
      let totalAmt = 0;
      for (let i = 0; i < (data || []).length; i++) {
        const item = data[i] || {};
        totalQty += Number(item.materialQty || 0);
        totalAmt += Number(item.materialAmt || 0);
      }
      const fmt = this.$options.filters && this.$options.filters.formatCurrency;
      columns.forEach((column, index) => {
        if (column.property === "materialQty") {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === "materialAmt") {
          sums[index] = fmt ? fmt(totalAmt) : totalAmt.toFixed(2);
        }
      });
      sums[0] = "合计";
      return sums;
    },
    getList() {
      this.loading = true;
      listConsumeOutReturnSummary(this.queryParams)
        .then((response) => {
          this.dataList = response.rows || [];
          this.total = response.total != null ? response.total : 0;
          this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
          this.loading = false;
        })
        .catch(() => {
          this.dataList = [];
          this.total = 0;
          this.totalInfo = { totalQty: 0, totalAmt: 0 };
          this.loading = false;
        });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.warehouseId = null;
      this.queryParams.departmentKeyword = null;
      this.queryParams.materialNameLike = null;
      this.queryParams.materialSpeciLike = null;
      this.queryParams.financeCategoryIds = null;
      this.queryParams.warehouseCategoryIds = null;
      this.queryParams.beginDate = getDefaultBeginDate();
      this.queryParams.endDate = getDefaultEndDate();
      this.handleQuery();
    },
    async handleExport() {
      const requestParams = { ...this.queryParams, pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await listConsumeOutReturnSummary(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportConsumeOutReturnSummaryStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室出退库汇总${dateStr}.xlsx`
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    }
  }
};
</script>

<style scoped>
.app-container {
  margin-top: -10px;
}

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

.query-input-wide {
  width: 200px;
}

.query-input-spec {
  width: 140px;
}

.category-multi-wrap {
  width: 200px;
}

.query-row-second {
  margin-bottom: 2px;
  position: relative;
}

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

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 140px !important;
}

.query-date-sep {
  margin: 0 6px;
  color: #606266;
}

.button-row-inventory-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pagination-wrapper {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  margin-top: 8px;
}

.pagination-summary {
  font-size: 13px;
  color: #606266;
}

.summary-label {
  font-weight: 600;
}
</style>
