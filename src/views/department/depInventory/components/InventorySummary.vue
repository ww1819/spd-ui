<template>
  <div class="app-container">
    <div class="query-container">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="耗材" prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectMaterial v-model="queryParams.materialId" />
                </div>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="科室" prop="departmentId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectDepartment v-model="queryParams.departmentId" />
                </div>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 0px; margin-top: 0px; margin-bottom: 16px;">
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <div class="table-container">
    <el-table v-loading="loading" :data="summaryList" 
              :row-class-name="summaryListIndex"
              show-summary :summary-method="getSummaries" 
              height="51vh"
              border>
      <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" show-overflow-tooltip resizable />
      <el-table-column label="规格" align="center" prop="specification" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="avgUnitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.avgUnitPrice">{{ scope.row.avgUnitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="库存数量" align="center" prop="totalQty" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalQty">{{ scope.row.totalQty }}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
      <el-table-column label="库存金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listInventorySummary } from "@/api/department/depInventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "InventorySummary",
  components: {SelectMaterial,SelectDepartment,RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 库存汇总表格数据
      summaryList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        departmentId: null,
        warehouseId: null
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询库存汇总列表 */
    getList() {
      this.loading = true;
      listInventorySummary(this.queryParams).then(response => {
        this.summaryList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    summaryListIndex({ row, rowIndex }) {
      // 确保 pageNum 和 pageSize 是正整数
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));

      // 计算行索引
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },
    /** 合计行计算 */
    getSummaries(param) {
      const { columns, data } = param;
      // 创建与列数相同的数组
      const sums = Array(columns.length).fill('');
      
      // 第一列显示"合计"
      sums[0] = '合计';
      
      // 计算合计数量和金额
      let totalQty = 0;
      let totalAmount = 0;
      
      // 计算总和
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        totalQty += Number(item.totalQty || 0);
        totalAmount += Number(item.totalAmount || 0);
      }
      
      // 遍历所有列，为指定列设置合计值
      columns.forEach((column, index) => {
        if (column.property === 'totalQty') {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === 'totalAmount') {
          sums[index] = '￥' + totalAmount.toFixed(2);
        }
      });
      
      return sums;
    }
  }
};
</script>

<style scoped>
/* 查询条件样式 */
.query-row-left {
  margin-bottom: 10px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

/* 查询容器样式 */
.query-container {
  margin-top: -20px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
}

.table-container {
  margin-top: 0px;
  overflow: visible;
  width: 100%;
  position: relative;
}

/* 表格滚动条样式 */
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #888;
  border-radius: 6px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #555;
}
</style>
