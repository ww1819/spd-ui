<template>
  <div class="app-container">
    <el-table v-loading="loading" :data="summaryList" height="51vh" border show-summary>
      <el-table-column type="index" label="序号" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="totalQty" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="金额" align="center" prop="totalAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmt">{{ scope.row.totalAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable/>
    </el-table>

    <!-- 手动添加合计信息 -->
    <div v-if="summaryList.length > 0" style="margin-top: 10px; padding: 10px; background-color: #f5f7fa; border: 1px solid #ebeef5; border-radius: 4px; text-align: right;">
      <span style="margin-right: 20px; font-weight: bold;">
        合计数量：{{ calculateTotalQty }}
      </span>
      <span style="margin-right: 20px; font-weight: bold;">
        合计金额：{{ calculateTotalAmt }}
      </span>
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
import { listGzDepInventory } from "@/api/gzDepartment/gzDepInventory";

export default {
  name: "GzDepInventorySummary",
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      summaryList: [],
      total: 0
    };
  },
  computed: {
    calculateTotalQty() {
      const totalQty = this.summaryList.reduce((sum, item) => {
        const qty = Number(item.totalQty) || 0;
        return sum + qty;
      }, 0);
      return totalQty.toFixed(2);
    },
    calculateTotalAmt() {
      const totalAmt = this.summaryList.reduce((sum, item) => {
        const amt = Number(item.totalAmt) || 0;
        return sum + amt;
      }, 0);
      return '￥' + totalAmt.toFixed(2);
    }
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
      // 先获取所有明细数据，然后在前端进行汇总
      const params = { ...this.queryParams };
      params.pageNum = 1;
      params.pageSize = 10000; // 获取所有数据用于汇总
      
      listGzDepInventory(params).then(response => {
        const detailList = response.rows || [];
        // 按耗材、科室进行汇总
        const summaryMap = {};
        
        detailList.forEach(item => {
          const material = item.material || {};
          const materialId = item.materialId || material.id;
          const materialName = material.name || '';
          const materialCode = material.code || material.id || '';
          const materialSpeci = material.speci || '';
          const departmentName = (item.department && item.department.name) || '';
          const unitName = material.unitName || '';
          
          const key = `${materialId}_${departmentName}`;
          
          if (!summaryMap[key]) {
            summaryMap[key] = {
              materialId: materialId,
              materialCode: materialCode,
              materialName: materialName,
              materialSpeci: materialSpeci,
              unitName: unitName,
              unitPrice: item.unitPrice || 0,
              totalQty: 0,
              totalAmt: 0,
              departmentName: departmentName
            };
          }
          
          summaryMap[key].totalQty += Number(item.qty) || 0;
          summaryMap[key].totalAmt += Number(item.amt) || 0;
        });
        
        // 转换为数组
        this.summaryList = Object.values(summaryMap);
        this.total = this.summaryList.length;
        this.loading = false;
      }).catch(() => {
        this.summaryList = [];
        this.total = 0;
        this.loading = false;
      });
    }
  }
};
</script>

