<template>
  <div class="app-container list-page first-inventory-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
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
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'material'">
              <div class="query-select-wrapper more-search-select-wrap">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
              </div>
            </template>
            <template v-else-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']" clearable/>
              </div>
            </template>
            <el-input
              v-else
              v-model="queryParams.billNo"
              placeholder="单号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="起始时间"
                clearable
                class="query-date-start"
                default-time="00:00:00"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="截止时间"
                clearable
                class="query-date-end"
                default-time="23:59:59"
              />
            </el-form-item>
            <el-form-item label="单据类型" prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="请选择单据类型"
                         multiple collapse-tags clearable class="query-select-bill-type">
                <el-option label="入库单" value="101"/>
                <el-option label="出库单" value="201"/>
                <el-option label="退库单" value="401"/>
                <el-option label="退货单" value="301"/>
                <el-option label="调拨单" value="501"/>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="handleExport">导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
    <el-table v-loading="loading" :data="inventoryList"
              show-summary :summary-method="getTotalSummaries" height="55vh" border stripe>
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="150" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="类型" align="center" prop="billType" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.billType"/>
        </template>
      </el-table-column>
      <el-table-column label="业务单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable />
      <el-table-column label="业务日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="materialModel" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="出库数量" align="center" prop="materialQty" width="100" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="price" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price != null && scope.row.price !== undefined && scope.row.price !== '' && Number(scope.row.price) !== 0">{{ Number(scope.row.price) | formatCurrency}}</span>
          <span v-else-if="scope.row.unitPrice != null && scope.row.unitPrice !== undefined && scope.row.unitPrice !== '' && Number(scope.row.unitPrice) !== 0">{{ Number(scope.row.unitPrice) | formatPrice }}</span>
          <span v-else-if="scope.row.materialAmt != null && scope.row.materialQty != null && Number(scope.row.materialQty) !== 0">
            {{ (Number(scope.row.materialAmt) / Number(scope.row.materialQty)) | formatCurrency}}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="出库金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="国家医保编码" align="center" prop="medicalNo" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.medicalNo || (scope.row.material && scope.row.material.medicalNo) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="registerNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.registerNo || (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="center" prop="factoryName" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商编码" align="center" prop="supplierCode" width="140" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ getSupplierCode(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ getSupplierName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="departmentName" width="160" show-overflow-tooltip resizable/>
    </el-table>
    </div>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listPurInventory } from "@/api/warehouse/purInventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import Pagination from "@/components/Pagination";
import { parseTime } from "@/utils/ruoyi";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "PurInventoryTable",
  dicts: ['bill_type'],
  components: {SelectMaterial,SelectWarehouse,WarehouseAutocomplete,MaterialAutocomplete,RightToolbar,Pagination},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "单号", value: "billNo" },
        { label: "耗材", value: "material" },
        { label: "仓库", value: "warehouse" }
      ],
      // 总条数
      total: 0,
      // 库存明细表格数据
      inventoryList: [],
      // 合计信息
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        materialId: null,
        warehouseId: null,
        materialName: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        billType: null
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.yj.statement.purInventory.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
  },
  mounted() {
    listWarehouse().then((res) => {
      this.restaurants = res.rows;
    });
  },
  methods: {
    parseTime,
    getSupplierName(row) {
      return row.supplierName
        || row.supplerName
        || row.supplier
        || (row.supplierInfo && row.supplierInfo.name)
        || (row.supplierObj && row.supplierObj.name)
        || (row.supplierEntity && row.supplierEntity.name)
        || '--';
    },
    getSupplierCode(row) {
      return row.supplierCode
        || row.supplerCode
        || (row.supplierInfo && (row.supplierInfo.code || row.supplierInfo.supplierCode))
        || (row.supplierObj && (row.supplierObj.code || row.supplierObj.supplierCode))
        || (row.supplierEntity && (row.supplierEntity.code || row.supplierEntity.supplierCode))
        || '--';
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(column.property === 'materialQty' || column.property === 'materialAmt'){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            if(column.property === 'materialAmt') {
              sums[index] = '￥' + this.formatAmount(sums[index]);
            } else {
              sums[index] = sums[index].toFixed(2);
            }
          } else {
            sums[index] = '';
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
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
    /** 查询进销存明细列表 */
    getList() {
      this.loading = true;
      // 处理 billType 参数：如果是数组，转换为逗号分隔的字符串，使用 billTypeStr 参数名
      const queryParams = {
        ...this.queryParams
      };
      this.applyMoreSearchToQueryParams(queryParams);
      // 移除 billType，使用 billTypeStr 传递
      let billTypeStr = null;
      if (Array.isArray(queryParams.billType) && queryParams.billType.length > 0) {
        // 将数组转换为逗号分隔的字符串
        billTypeStr = queryParams.billType.join(',');
      }
      // 删除 billType，添加 billTypeStr
      delete queryParams.billType;
      if (billTypeStr) {
        queryParams.billTypeStr = billTypeStr;
      }
      // 处理日期参数：仅日期时补全时分秒；已含时分秒则原样提交
      if (queryParams.beginDate && queryParams.beginDate.length === 10) {
        queryParams.beginDate = queryParams.beginDate + ' 00:00:00';
      }
      if (queryParams.endDate && queryParams.endDate.length === 10) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      // 如果日期为空字符串，设置为 null
      if (queryParams.beginDate === '') {
        queryParams.beginDate = null;
      }
      if (queryParams.endDate === '') {
        queryParams.endDate = null;
      }
      listPurInventory(queryParams).then(response => {
        this.inventoryList = response.rows || [];
        this.total = response.total || 0;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0, subTotalAmt: 0, subTotalQty: 0 };
        this.loading = false;
      }).catch(error => {
        console.error('查询进销存明细列表失败:', error);
        this.inventoryList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    getStatDate(){
      // 当前日期往前推5天 00:00:00
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day + " 00:00:00";
    },
    getEndDate(){
      // 当前日期 23:59:59
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day + " 23:59:59";
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.warehouseId = null;
      this.queryParams.materialName = null;
      this.queryParams.billType = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass(t) {
      if (['material', 'warehouse'].includes(t)) {
        return 'more-search-field--select';
      }
      return 'more-search-field--text';
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
      const map = {
        billNo: 'billNo',
        material: 'materialName',
        warehouse: 'warehouseId'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    /** 导出按钮操作 */
    handleExport() {
      const queryParams = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(queryParams);
      this.download('warehouse/purInventory/export', queryParams, `pur_inventory_${new Date().getTime()}.xlsx`)
    },
  }
};
</script>

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

.query-select-bill-type {
  width: 300px;
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
.list-query-panel {
  margin-top: -20px;
}

.table-container {
  margin-top: 5px;
  overflow: visible;
  width: calc(100% + 40px);
  margin-left: -20px;
  margin-right: -20px;
  position: relative;
}

/* 表格水平滚动条增粗 */
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 8px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
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
