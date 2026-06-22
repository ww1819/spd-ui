<template>
  <div v-show="show" class="local-modal-mask dep-inventory-select-full-modal">
    <div class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">{{ modalTitle }}</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <div class="modal-body">
        <!-- 与到货验收「添加明细」SelectMaterialFilter 一致：顶栏查询卡片 + 中间按钮 + 明细表同宽 -->
        <div class="material-filter-query-card">
          <el-form
            :model="queryParams"
            ref="queryForm"
            :inline="true"
            v-show="showSearch"
            label-width="0"
            size="small"
            class="query-form query-form-compact-fields"
          >
            <el-row :gutter="12" class="query-form-row">
              <el-col :span="6">
                <el-form-item label="科室" prop="departmentId" label-width="100px">
                  <SelectDepartment v-model="queryParams.departmentId" :value2="isShow" :finance-pick-mode="true" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="耗材" prop="materialId" label-width="100px">
                  <SelectMaterial v-model="queryParams.materialId" :use-dept-safe-list="true" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="关键字" prop="materialKeyword" label-width="100px">
                  <el-input
                    v-model="queryParams.materialKeyword"
                    placeholder="耗材编码/名称/简码"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6" />
            </el-row>
            <el-row v-if="!useMaterialDict" :gutter="12" class="query-form-row">
              <el-col :span="6">
                <el-form-item label="批次号" prop="batchNo" label-width="100px">
                  <el-input
                    v-model="queryParams.batchNo"
                    placeholder="批次号"
                    clearable
                    size="small"
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="财务分类" prop="financeCategoryId" label-width="100px">
                  <SelectFinanceCategoryLow
                    v-model="queryParams.financeCategoryId"
                    placeholder="财务分类"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12" />
            </el-row>
          </el-form>
        </div>

        <div class="material-filter-between-actions">
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          <el-button size="small" @click="handleClose" style="margin-left: 12px;">取 消</el-button>
          <el-button type="primary" size="small" @click="checkBtn">确 定</el-button>
        </div>

        <div class="material-filter-table-section">
          <el-table
            ref="singleTable"
            v-loading="loading"
            class="material-filter-detail-table"
            :data="inventoryList"
            :row-class-name="inventoryIndex"
            @selection-change="handleSelectionChange"
            height="calc(55vh)"
            border
            :cell-style="{ padding: '8px 4px' }"
          >
            <el-table-column type="selection" fixed="left" width="50" align="center" resizable />
            <el-table-column label="序号" fixed="left" align="center" width="60" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
              </template>
            </el-table-column>
            <el-table-column label="耗材编码" align="center" width="130" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
            <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable />
            <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable />
            <el-table-column label="型号" align="center" prop="material.model" width="180" show-overflow-tooltip resizable />
            <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="100" show-overflow-tooltip resizable />
            <el-table-column label="库存数量" align="center" min-width="100" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ useMaterialDict ? '--' : (scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '--') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable />
            <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ useMaterialDict ? '--' : (scope.row.amt != null && scope.row.amt !== '' ? scope.row.amt : '--') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="归属仓库" align="center" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生产批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable />
            <el-table-column label="耗材批次号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable />
            <el-table-column label="有效期" align="center" prop="endDate" width="140" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.endDate">{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="生产日期" align="center" prop="beginDate" width="140" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.beginDate">{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable />
            <el-table-column label="生产厂家" align="center" width="180" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable />
            <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable />
            <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable />
            <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable />
            <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable />
            <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay" />
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="耗材日期" align="center" prop="materialDate" width="200" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="入库日期" align="center" prop="warehouseDate" width="180" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
          </el-table>

          <pagination
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="handlePagination"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listInventoryPick } from "@/api/department/depInventory";
import { listMaterial } from "@/api/foundation/material";
import { sortInventoryRowsByNameSpecCodeMaterialId } from "@/utils/stocktakingInventorySort";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectFinanceCategoryLow from "@/components/SelectModel/SelectFinanceCategoryLow";

export default {
  name: "SelectDepInventory",
  components: { SelectMaterial, SelectDepartment, SelectFinanceCategoryLow },
  dicts: ["way_status"],
  props: {
    DialogComponentShow: {},
    departmentValue: {},
    warehouseValue: {},
    selectedDetails: {},
    /** 为 true 时列表按名称、规格、编码、产品档案 id 排序（盘点初始化/盘亏选库存等） */
    stocktakingPickSortByMaterial: {
      type: Boolean,
      default: false
    },
    /** 为 true 时标题为「添加明细」，数据来自耗材字典 /foundation/material/list，不再查科室库存 */
    useMaterialDict: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      isShow: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      inventoryList: [],
      unitOptions: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        departmentId: null,
        warehouseId: null,
        materialId: null,
        materialKeyword: null,
        batchNo: null,
        financeCategoryId: null
      },
      form: {},
      selectedRowMap: {}
    };
  },
  mounted() {
    this.show = this.DialogComponentShow;
    this.queryParams.departmentId = this.departmentValue;
    if (this.warehouseValue != null && this.warehouseValue !== "") {
      this.queryParams.warehouseId = this.warehouseValue;
    }
    if (this.show) {
      this.getList();
    }
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.selectedRowMap = {};
        this.selectRow = [];
        this.queryParams.pageNum = 1;
        this.queryParams.departmentId = this.departmentValue;
        if (this.warehouseValue != null && this.warehouseValue !== "") {
          this.queryParams.warehouseId = this.warehouseValue;
        }
        this.getList();
      }
    }
  },
  created() {},
  computed: {
    modalTitle() {
      return this.useMaterialDict ? "添加明细" : "科室库存明细";
    }
  },
  methods: {
    /** 字典耗材 -> 与库存行结构接近的表格行，便于共用列模板 */
    materialDictToTableRow(m) {
      if (!m) return null;
      const unitPrice =
        m.price != null && m.price !== ""
          ? m.price
          : m.salePrice != null && m.salePrice !== ""
            ? m.salePrice
            : null;
      return {
        _fromMaterialDict: true,
        id: m.id,
        materialId: m.id,
        material: m,
        qty: null,
        unitPrice,
        amt: null,
        batchNo: "",
        batchNumber: "",
        materialNo: "",
        beginDate: null,
        endDate: null,
        beginTime: null,
        endTime: null,
        warehouse: null,
        department: null,
        materialDate: null,
        warehouseDate: null,
        supplier: m.supplier || null,
        fdFactory: m.fdFactory || null
      };
    },
    getRowKey(row) {
      if (!row) return null;
      if (this.useMaterialDict) {
        return row.materialId != null ? "dict-" + String(row.materialId) : null;
      }
      if (row.id != null) return "inv-" + String(row.id);
      if (row.materialId != null && row.batchNo != null && row.batchNo !== "") {
        return "inv-" + String(row.materialId) + "__" + String(row.batchNo);
      }
      return row.materialId != null ? "inv-m-" + String(row.materialId) : null;
    },
    restorePageSelection() {
      if (!this.$refs.singleTable || !this.inventoryList || this.inventoryList.length === 0) {
        return;
      }
      this.$refs.singleTable.clearSelection();
      this.inventoryList.forEach(row => {
        const key = this.getRowKey(row);
        if (key && this.selectedRowMap[key]) {
          this.$refs.singleTable.toggleRowSelection(row, true);
        }
      });
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    buildInventoryPickParams() {
      const params = { ...this.queryParams };
      if (params.financeCategoryId != null && params.financeCategoryId !== "") {
        params.financeCategoryIds = [params.financeCategoryId];
      } else {
        params.financeCategoryIds = null;
      }
      delete params.financeCategoryId;
      return params;
    },
    getList() {
      this.loading = true;
      if (this.useMaterialDict) {
        const q = {
          pageNum: this.queryParams.pageNum,
          pageSize: this.queryParams.pageSize
        };
        if (this.queryParams.materialId) {
          q.id = this.queryParams.materialId;
        }
        const kw = this.queryParams.materialKeyword;
        if (kw != null && String(kw).trim() !== "") {
          q.name = String(kw).trim();
        }
        listMaterial(q)
          .then((response) => {
            const materials = response.rows || [];
            const rows = materials.map((m) => this.materialDictToTableRow(m)).filter(Boolean);
            // 盘盈等产品字典选择：不过滤单据明细已有 materialId，允许同产品重复选入（如多条盘盈行）
            this.inventoryList = this.stocktakingPickSortByMaterial
              ? sortInventoryRowsByNameSpecCodeMaterialId(rows)
              : rows;
            this.total = response.total != null ? Number(response.total) : 0;
            this.loading = false;
            this.$nextTick(() => this.restorePageSelection());
          })
          .catch(() => {
            this.loading = false;
          });
        return;
      }
      listInventoryPick(this.buildInventoryPickParams())
        .then(response => {
          const rows = response.rows || [];
          if (this.selectedDetails && this.selectedDetails.length) {
            const existedDepInvIds = new Set(
              this.selectedDetails.flatMap((d) => {
                if (!d) {
                  return [];
                }
                const keys = [];
                if (d.depInventoryId != null && String(d.depInventoryId).trim() !== "") {
                  keys.push(String(d.depInventoryId).trim());
                }
                if (d.kcNo != null && String(d.kcNo).trim() !== "") {
                  keys.push(String(d.kcNo).trim());
                }
                return keys;
              })
            );
            const existedBatchKeys = new Set(
              this.selectedDetails
                .filter(d => d && d.materialId != null && d.batchNo && (d.kcNo == null || d.kcNo === ""))
                .map(d => `${d.materialId}__${d.batchNo}`)
            );
            const filtered = rows.filter(it => {
              if (!it) return true;
              if (it.id != null && existedDepInvIds.has(String(it.id))) {
                return false;
              }
              const legacyKey = it.materialId != null && it.batchNo ? `${it.materialId}__${it.batchNo}` : null;
              if (legacyKey && existedBatchKeys.has(legacyKey)) {
                return false;
              }
              return true;
            });
            this.inventoryList = this.stocktakingPickSortByMaterial
              ? sortInventoryRowsByNameSpecCodeMaterialId(filtered)
              : filtered;
          } else {
            this.inventoryList = this.stocktakingPickSortByMaterial
              ? sortInventoryRowsByNameSpecCodeMaterialId(rows)
              : rows;
          }
          this.total = response.total != null ? Number(response.total) : 0;
          this.loading = false;
          this.$nextTick(() => this.restorePageSelection());
        })
        .catch(() => {
          this.loading = false;
        });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.departmentId = this.departmentValue;
      this.queryParams.materialKeyword = null;
      if (this.warehouseValue != null && this.warehouseValue !== "") {
        this.queryParams.warehouseId = this.warehouseValue;
      } else {
        this.queryParams.warehouseId = null;
      }
      this.queryParams.batchNo = null;
      this.queryParams.financeCategoryId = null;
      this.handleQuery();
    },
    handleSelectionChange(val) {
      const pageKeys = (this.inventoryList || [])
        .map(row => this.getRowKey(row))
        .filter(Boolean);
      pageKeys.forEach(key => {
        if (this.selectedRowMap[key]) {
          delete this.selectedRowMap[key];
        }
      });
      (val || []).forEach(row => {
        const key = this.getRowKey(row);
        if (key) {
          this.selectedRowMap[key] = row;
        }
      });
      this.selectRow = Object.values(this.selectedRowMap);
    },
    handleClose() {
      this.show = false;
      this.selectedRowMap = {};
      this.selectRow = [];
      this.$emit("closeDialog");
    },
    checkBtn() {
      if (!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: "请先选择数据", type: "warning" });
        return;
      }
      this.$emit("selectData", this.selectRow);
      this.handleClose();
    },
    inventoryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #ebeef5;
  background: #f5f7fa;
  flex-shrink: 0;
  min-height: 48px;
}

.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

.close-btn {
  border: none;
  background: transparent;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 6px 20px 16px;
  background: #fff;
}

.material-filter-table-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
}

.material-filter-detail-table {
  width: 100% !important;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
}

::v-deep .material-filter-detail-table .el-table__body-wrapper {
  overflow-x: auto;
  overflow-y: auto;
}

::v-deep .material-filter-detail-table th {
  background-color: #ebeef5 !important;
  color: #606266;
  font-weight: 600;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #ebeef5;
}

::v-deep .material-filter-detail-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

::v-deep .material-filter-detail-table tr:hover > td {
  background-color: #f5f7fa !important;
  transition: all 0.3s;
}

.material-filter-query-card {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  padding: 8px 16px 8px;
  margin-bottom: 0;
  background: #fff;
  border: 1px solid #c0c4cc;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

.material-filter-query-card .query-form-row + .query-form-row {
  margin-top: 10px;
}

.material-filter-between-actions {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  padding: 8px 16px;
  margin-top: 0;
  margin-bottom: 0;
  text-align: left;
}

.query-form {
  background: transparent;
  padding: 0;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
}

.query-form .el-form-item {
  margin-bottom: 0;
}

.query-form .el-form-item__label {
  line-height: 36px;
  padding-right: 8px;
}

.query-form-row {
  margin-bottom: 0 !important;
}

::v-deep .query-form-compact-fields .el-input,
::v-deep .query-form-compact-fields .el-select {
  width: 220px !important;
  max-width: 220px !important;
}

::v-deep .query-form-compact-fields .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
  min-height: 36px !important;
}

::v-deep .query-form-compact-fields .el-input__inner,
::v-deep .query-form-compact-fields .el-select .el-input__inner,
::v-deep .query-form-compact-fields .el-range-editor.el-input__inner {
  height: 36px !important;
  min-height: 36px !important;
  line-height: 36px !important;
  font-size: 13px !important;
  box-sizing: border-box;
}

::v-deep .query-form-compact-fields .el-input__icon {
  line-height: 36px !important;
}

::v-deep .query-form-compact-fields.el-form--inline .el-form-item {
  vertical-align: middle;
}

.dep-inventory-select-full-modal ::v-deep .material-filter-table-section .pagination-container {
  padding: 8px 16px 12px;
}
</style>
