<template>
  <div class="app-container history-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="时间点" prop="endDate" class="query-item-inline" required>
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="选择历史库存时间点"
                clearable
                default-time="23:59:59"
                style="width: 200px"
              />
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable/>
              </div>
            </el-form-item>
            <el-form-item label="耗材" prop="materialName" class="query-item-inline">
              <el-input
                v-model="queryParams.materialName"
                clearable
                placeholder="编码/名称/简码"
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="规格" prop="materialSpeci" class="query-item-inline">
              <el-input
                v-model="queryParams.materialSpeci"
                clearable
                placeholder="规格模糊"
                style="width: 140px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierKeyword" class="query-item-inline">
              <el-input
                v-model="queryParams.supplierKeyword"
                clearable
                placeholder="编码/名称/简码"
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="批号" prop="batchNumber" class="query-item-inline">
              <el-input
                v-model="queryParams.batchNumber"
                clearable
                placeholder="批号模糊"
                style="width: 140px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="批次" prop="batchNo" class="query-item-inline">
              <el-input
                v-model="queryParams.batchNo"
                clearable
                placeholder="批次模糊"
                style="width: 160px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="计费" prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="请选择计费" clearable style="width: 120px">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
            </el-form-item>
            <el-form-item label="产品档案" prop="materialIsUse" class="query-item-inline">
              <el-select v-model="queryParams.materialIsUse" placeholder="启停用" clearable style="width: 120px">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 2px; margin-top: -8px">
      <el-col :span="1.5">
        <el-button type="warning" icon="el-icon-download" size="medium" @click="handleExport">导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <el-col :span="14" class="history-tip-col">
        <span class="history-tip">对比实时库存时：时间点选当前时刻，仓库/产品档案/计费条件保持一致；结存按单据账重算，与余额表可能因历史丢失更新仍有差额。</span>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="table-container">
      <el-table
        v-loading="loading"
        :data="displayList"
        height="55vh"
        border
        stripe
        :row-class-name="tableRowClassName"
      >
        <el-table-column type="index" label="序号" width="70" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">{{ scope.row._summaryType === 'subtotal' ? '小计' : '合计' }}</span>
            <span v-else>{{ dataRowIndex(scope.$index) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库编码" align="center" prop="warehouseCode" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.warehouseCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库名称" align="center" prop="warehouseName" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">{{ scope.row.warehouseName }}</span>
            <span v-else>{{ scope.row.warehouseName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材编码" align="center" prop="materialCode" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.materialCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材名称" align="center" prop="materialName" min-width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.materialName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" align="center" prop="materialSpeci" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.materialSpeci }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" align="center" prop="materialModel" width="90" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.materialModel }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" align="center" prop="unitName" width="70" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.unitName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else-if="scope.row.unitPrice != null">{{ scope.row.unitPrice | formatCurrency }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" align="center" prop="batchNumber" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.batchNumber || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="效期" align="center" prop="expiryDate" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.expiryDate || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次" align="center" prop="batchNo" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.batchNo || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商编码" align="center" prop="supplierCode" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.supplierCode }}</span>
          </template>
        </el-table-column>
        <el-table-column label="供应商名称" align="center" prop="supplierName" min-width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row._summaryType">-</span>
            <span v-else>{{ scope.row.supplierName }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" align="center" prop="qty" width="110" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ formatNum(scope.row.qty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.amt | formatCurrency }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listHistoryInventory } from "@/api/warehouse/inventory";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import { exportHistoryInventoryStyledXlsx } from "@/utils/departmentOutSummaryExport";

export default {
  name: "FourthInventory",
  dicts: ['is_use_status'],
  components: { SelectWarehouse },
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      inventoryList: [],
      totalInfo: { totalQty: 0, totalAmt: 0, subTotalQty: 0, subTotalAmt: 0 },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        endDate: null,
        warehouseId: null,
        materialName: null,
        materialSpeci: null,
        supplierKeyword: null,
        batchNumber: null,
        batchNo: null,
        isBilling: null,
        materialIsUse: null
      }
    };
  },
  computed: {
    displayList() {
      if (!this.inventoryList || !this.inventoryList.length) {
        return [];
      }
      return [
        ...this.inventoryList,
        this.buildSummaryRow("subtotal", "小计", {
          qty: this.totalInfo.subTotalQty,
          amt: this.totalInfo.subTotalAmt
        }),
        this.buildSummaryRow("total", "合计", {
          qty: this.totalInfo.totalQty,
          amt: this.totalInfo.totalAmt
        })
      ];
    }
  },
  created() {
    this.queryParams.endDate = this.defaultAsOfTime();
    this.getList();
  },
  methods: {
    defaultAsOfTime() {
      const d = new Date();
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      // 默认取当日 23:59:59（日末结存）
      return (
        d.getFullYear() +
        "-" +
        pad(d.getMonth() + 1) +
        "-" +
        pad(d.getDate()) +
        " 23:59:59"
      );
    },
    formatNum(v) {
      if (v == null || v === "") return "0.00";
      const n = Number(v);
      return Number.isFinite(n) ? n.toFixed(2) : "0.00";
    },
    dataRowIndex(displayIndex) {
      // displayList 末尾是小计/合计，序号只计数据行
      return (this.queryParams.pageNum - 1) * this.queryParams.pageSize + displayIndex + 1;
    },
    buildSummaryRow(type, label, sums) {
      return {
        _summaryType: type,
        warehouseCode: "",
        warehouseName: label,
        materialCode: "",
        materialName: "",
        materialSpeci: "",
        materialModel: "",
        unitName: "",
        unitPrice: null,
        batchNumber: "",
        expiryDate: "",
        batchNo: "",
        supplierCode: "",
        supplierName: "",
        qty: sums && sums.qty != null ? Number(sums.qty) : 0,
        amt: sums && sums.amt != null ? Number(sums.amt) : 0
      };
    },
    tableRowClassName({ row }) {
      if (row && row._summaryType === "subtotal") return "history-summary-subtotal";
      if (row && row._summaryType === "total") return "history-summary-total";
      return "";
    },
    getList() {
      if (!this.queryParams.endDate) {
        this.$modal.msgWarning("请选择历史库存时间点");
        return;
      }
      this.loading = true;
      const queryParams = { ...this.queryParams };
      if (queryParams.endDate && String(queryParams.endDate).length === 10) {
        queryParams.endDate = queryParams.endDate + " 23:59:59";
      }
      listHistoryInventory(queryParams)
        .then((response) => {
          if (response.code && response.code !== 200) {
            this.$modal.msgError(response.msg || "查询失败");
            this.inventoryList = [];
            this.total = 0;
            this.totalInfo = { totalQty: 0, totalAmt: 0, subTotalQty: 0, subTotalAmt: 0 };
            this.loading = false;
            return;
          }
          this.inventoryList = response.rows || [];
          this.total = response.total || 0;
          this.totalInfo = response.totalInfo || {
            totalQty: 0,
            totalAmt: 0,
            subTotalQty: 0,
            subTotalAmt: 0
          };
          this.loading = false;
        })
        .catch(() => {
          this.inventoryList = [];
          this.total = 0;
          this.totalInfo = { totalQty: 0, totalAmt: 0, subTotalQty: 0, subTotalAmt: 0 };
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
      this.queryParams.materialName = null;
      this.queryParams.materialSpeci = null;
      this.queryParams.supplierKeyword = null;
      this.queryParams.batchNumber = null;
      this.queryParams.batchNo = null;
      this.queryParams.isBilling = null;
      this.queryParams.materialIsUse = null;
      this.queryParams.endDate = this.defaultAsOfTime();
      this.handleQuery();
    },
    buildExportQuery() {
      const queryParams = {
        ...this.queryParams,
        pageNum: 1,
        pageSize: 10000
      };
      if (queryParams.endDate && String(queryParams.endDate).length === 10) {
        queryParams.endDate = queryParams.endDate + " 23:59:59";
      }
      return queryParams;
    },
    async handleExport() {
      if (!this.queryParams.endDate) {
        this.$modal.msgWarning("请选择历史库存时间点");
        return;
      }
      this.loading = true;
      try {
        const response = await listHistoryInventory(this.buildExportQuery());
        if (response.code && response.code !== 200) {
          this.$modal.msgError(response.msg || "导出查询失败");
          return;
        }
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr =
          `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportHistoryInventoryStyledXlsx({
          rows,
          asOfTime: this.queryParams.endDate,
          fileName: `历史库存明细表${dateStr}.xlsx`
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
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
.query-select-wrapper {
  width: 180px;
}
.table-container {
  margin-top: 4px;
}
.history-tip-col {
  display: flex;
  align-items: center;
  padding-left: 8px;
}
.history-tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.4;
}
.table-container ::v-deep .history-summary-subtotal td {
  background: #fafafa !important;
  font-weight: 600;
}
.table-container ::v-deep .history-summary-total td {
  background: #fff7e6 !important;
  font-weight: 700;
  color: #cf1322;
}
</style>
