<template>
  <div>
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="耗材" prop="materialId" label-width="100px">
            <SelectMaterial v-model="queryParams.materialId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="科室" prop="departmentId" label-width="100px">
            <SelectDepartment v-model="queryParams.departmentId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId" />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item >
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-table v-loading="loading" :data="summaryList" show-summary :summary-method="getSummaries" height="54vh" border>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" show-overflow-tooltip resizable />
      <el-table-column label="规格" align="center" prop="specification" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="平均单价" align="center" prop="avgUnitPrice" width="120" show-overflow-tooltip resizable>
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
      <el-table-column label="批次数量" align="center" prop="batchCount" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.batchCount">{{ scope.row.batchCount }}</span>
          <span v-else>0</span>
        </template>
      </el-table-column>
    </el-table>

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
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";

export default {
  name: "InventorySummary",
  components: {SelectMaterial,SelectDepartment,SelectWarehouse},
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
    /** 合计行计算 */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if (column.property === 'totalQty' || column.property === 'totalAmount' || column.property === 'batchCount') {
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            if (column.property === 'totalAmount') {
              sums[index] = sums[index].toFixed(2);
            }
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    }
  }
};
</script>
