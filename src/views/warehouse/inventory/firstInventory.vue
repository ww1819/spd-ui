<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="单号" prop="receiptOrderNo" class="query-item-inline">
              <el-input
                v-model="queryParams.receiptOrderNo"
                placeholder="请输入单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectSupplier v-model="queryParams.supplierId" />
              </div>
            </el-form-item>
            <el-form-item label="耗材" prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
              </div>
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['设备', '高值']"/>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24">
            <el-form-item label="业务日期" style="display: flex; align-items: center;">
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
            <el-form-item label="批号" prop="materialNo" class="query-item-inline">
              <el-input
                v-model="queryParams.materialNo"
                placeholder="请输入批号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="计费" prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="请选择计费"
                         clearable style="width: 150px">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
            </el-form-item>
            <el-form-item label="库房分类" prop="warehouseCategoryId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouseCategory v-model="queryParams.warehouseCategoryId" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory">
      <el-col :span="1.5">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="table-container">
    <el-table v-loading="loading" :data="inventoryList"
              :row-class-name="inventoryListIndex"
              @selection-change="handleSelectionChange" 
              height="57vh"
              border>
      <el-table-column type="selection" width="48" align="center" fixed="left"/>
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="material.code" width="150" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode"/>
      <el-table-column label="耗材名称" align="center" prop="material.name" width="160" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName"/>
      <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByModel">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="150" show-overflow-tooltip resizable sortable :sort-method="sortByFactory">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByWarehouse"/>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable sortable :sort-method="sortBySupplier"/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || (scope.row.material && scope.row.material.unit && (scope.row.material.unit.unitName || scope.row.material.unit.name)) || (scope.row.material && scope.row.material.unitName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="库存数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmt">
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable/>
      <el-table-column label="批号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="生产日期" align="center" prop="beginTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.material && scope.row.material.registerNo ? scope.row.material.registerNo : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证有效期" align="center" prop="material.periodDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" prop="material.isBilling" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1 || scope.row.material.isBilling === true || scope.row.material.isBilling === 'true')">是</span>
          <span v-else-if="scope.row.material && (scope.row.material.isBilling === '0' || scope.row.material.isBilling === 0 || scope.row.material.isBilling === '2' || scope.row.material.isBilling === false || scope.row.material.isBilling === 'false')">否</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="入库单号" align="center" prop="receiptOrderNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="制单日期" align="center" prop="createTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createrName">{{ scope.row.createrName }}</span>
          <span v-else-if="scope.row.creater && scope.row.creater.nickName">{{ scope.row.creater.nickName }}</span>
          <span v-else-if="scope.row.creater && scope.row.creater.userName">{{ scope.row.creater.userName }}</span>
          <span v-else-if="scope.row.createBy">{{ scope.row.createBy }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditPersonName">{{ scope.row.auditPersonName }}</span>
          <span v-else-if="scope.row.auditPerson && scope.row.auditPerson.nickName">{{ scope.row.auditPerson.nickName }}</span>
          <span v-else-if="scope.row.auditPerson && scope.row.auditPerson.userName">{{ scope.row.auditPerson.userName }}</span>
          <span v-else-if="scope.row.auditBy">{{ scope.row.auditBy }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>

    </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

  </div>
</template>

<script>
import { listInventory } from "@/api/warehouse/inventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "firstInventory",
  components: {SelectMaterial,SelectWarehouse,SelectSupplier,SelectWarehouseCategory,MaterialAutocomplete,RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      activeName: 'first',
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 库存明细表格数据
      inventoryList: [],
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        receiptOrderNo: null,
        materialId: null,
        warehouseId: null,
        materialName: null,
        supplierId: null,
        beginDate: null,
        endDate: null,
        materialNo: null,
        isBilling: null,
        warehouseCategoryId: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  computed: {
    /** 当前页数量合计 */
    pageTotalQty() {
      return (this.inventoryList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    /** 当前页金额合计（格式化） */
    pageTotalAmtFormatted() {
      const amt = (this.inventoryList || []).reduce((s, r) => s + Number(r.amt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    },
  },
  created() {
    this.getList();
  },
  mounted() {
    listWarehouse().then((res) => {
      this.restaurants = res.rows;
    });
  },
  methods: {
    /** 表头排序：字符串列 */
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    /** 表头排序：数值列 */
    sortByNum(a, b, prop) {
      const va = Number(a[prop]);
      const vb = Number(b[prop]);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortByMaterialCode(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.code) || ''); },
    sortByMaterialName(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.name) || ''); },
    sortBySpeci(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.speci) || ''); },
    sortByModel(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.model) || ''); },
    sortByFactory(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.fdFactory && r.material.fdFactory.factoryName) || ''); },
    sortByWarehouse(a, b) { return this.sortByStr(a, b, r => (r.warehouse && r.warehouse.name) || ''); },
    sortBySupplier(a, b) { return this.sortByStr(a, b, r => (r.supplier && r.supplier.name) || ''); },
    sortByUnitPrice(a, b) { return this.sortByNum(a, b, 'unitPrice'); },
    sortByAmt(a, b) { return this.sortByNum(a, b, 'amt'); },
    querySearchAsync(queryString, cb) {
      const res = this.restaurants;
      if(res.length>0) {
        res.forEach(item => {
          item.value = item.name;
        })
      }

      let results = res.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1;
      })
      cb(results);
    },
    /** 查询库存明细列表 */
    getList() {
      this.loading = true;
      // 添加排序参数，让最新的业务显示在最前面
      const queryParams = {
        ...this.queryParams,
        orderByColumn: 'warehouse_date',
        isAsc: 'desc'
      };
      listInventory(queryParams).then(response => {
        this.inventoryList = response.rows || [];
        this.total = response.total;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0, subTotalAmt: 0, subTotalQty: 0 };
        this.loading = false;
      });
    },
    inventoryListIndex({ row, rowIndex }) {
      // 确保 pageNum 和 pageSize 是正整数
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));

      // 计算行索引
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },

    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        receiptOrderNo: null,
        materialId: null,
        warehouseId: null,
        supplierId: null,
        beginDate: null,
        endDate: null,
        materialNo: null,
        isBilling: null,
        warehouseCategoryId: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.materialName = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseCategoryId = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.isBilling = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/inventory/export', {
        ...this.queryParams
      }, `inventory_${new Date().getTime()}.xlsx`)
    },
  }

};
</script>

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

<style scoped>
.app-container {
  margin-top: -10px;
}

/* 查询条件样式 */
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
  position: relative;
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
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:hover {
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

.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}
</style>
