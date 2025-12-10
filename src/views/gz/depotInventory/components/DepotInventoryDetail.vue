<template>
  <div class="app-container">
    <el-table v-loading="loading" :data="depotInventoryList" @selection-change="handleSelectionChange" height="51vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="material.code" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="耗材" align="center" prop="material.name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="库存数量" align="center" prop="qty" width="80" show-overflow-tooltip resizable/>
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
      <el-table-column label="批号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="生产日期" align="center" prop="materialDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证有效期" align="center" prop="material.periodDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="院内码" align="center" prop="inHospitalCode" width="200" show-overflow-tooltip resizable/>
      <el-table-column label="入库单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable/>
      <el-table-column label="高值入库日期" align="center" prop="warehouseDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="医保编码" align="center" prop="material.medicalNo" width="180" show-overflow-tooltip resizable/>
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
import { listDepotInventory } from "@/api/gz/depotInventory";

export default {
  name: "DepotInventoryDetail",
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      depotInventoryList: [],
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
      listDepotInventory(this.queryParams).then(response => {
        this.depotInventoryList = response.rows;
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

