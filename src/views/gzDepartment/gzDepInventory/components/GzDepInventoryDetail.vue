<template>
  <div class="app-container">
    <el-table v-loading="loading" :data="gzDepInventoryList" @selection-change="handleSelectionChange" height="51vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材" align="center" prop="material.name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="数量" align="center" prop="qty" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批号" align="center" prop="materialNo" width="200" show-overflow-tooltip resizable/>
      <el-table-column label="生产日期" align="center" prop="materialDate" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="院内码" align="center" prop="inHospitalCode" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="UDI码" align="center" prop="material.udiNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="material.supplier.name" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="出库单号" align="center" prop="shipmentNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="出库审核人" align="center" prop="auditBy" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="入库日期" align="center" prop="warehouseDate" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable/>
      <el-table-column label="备注" align="center" prop="remark" width="200" show-overflow-tooltip resizable/>
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
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory";

export default {
  name: "GzDepInventoryDetail",
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      gzDepInventoryList: [],
      total: 0,
      ids: []
    };
  },
  watch: {
    queryParams: {
      handler() {
        this.getList();
      },
      deep: true
    }
  },
  created() {
    this.getList();
  },
  methods: {
    getList() {
      this.loading = true;
      listGzDepInventory(this.queryParams).then(response => {
        this.gzDepInventoryList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.$emit('selection-change', selection);
    }
  }
};
</script>

