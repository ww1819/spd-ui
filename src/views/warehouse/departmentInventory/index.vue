<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>科室库存查询</span>
      </div>
      
      <!-- 查询条件 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="100px">
        <el-form-item label="科室ID" prop="ksNo">
          <el-input
            v-model="queryParams.ksNo"
            placeholder="请输入科室ID"
            clearable
            size="small"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="期初日期" prop="qcDate">
          <el-date-picker
            v-model="queryParams.qcDate"
            type="date"
            placeholder="选择期初日期"
            size="small"
            style="width: 200px"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="queryParams.endDate"
            type="date"
            placeholder="选择结束日期"
            size="small"
            style="width: 200px"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <el-table
        ref="table"
        v-loading="loading"
        :data="departmentInventoryList"
        style="width: 100%"
        border
        stripe
        size="small"
        height="54vh"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column label="科室编码" align="center" prop="KS_CODE" show-overflow-tooltip resizable />
        <el-table-column label="科室名称" align="center" prop="KS_NAME" show-overflow-tooltip resizable />
        <el-table-column label="产品编码" align="center" prop="HC_CODE" show-overflow-tooltip resizable />
        <el-table-column label="产品名称" align="center" prop="HC_NAME" show-overflow-tooltip resizable />
        <el-table-column label="规格" align="center" prop="GG" show-overflow-tooltip resizable />
        <el-table-column label="型号" align="center" prop="XH" show-overflow-tooltip resizable />
        <el-table-column label="单位" align="center" prop="DW" show-overflow-tooltip resizable />
        <el-table-column label="期初数量" align="center" prop="QC_SL" show-overflow-tooltip resizable />
        <el-table-column label="期初金额" align="center" prop="QC_JE" show-overflow-tooltip resizable />
        <el-table-column label="出库数量" align="center" prop="CK_SL" show-overflow-tooltip resizable />
        <el-table-column label="出库金额" align="center" prop="CK_JE" show-overflow-tooltip resizable />
        <el-table-column label="退库数量" align="center" prop="TK_SL" show-overflow-tooltip resizable />
        <el-table-column label="退库金额" align="center" prop="TK_JE" show-overflow-tooltip resizable />
        <el-table-column label="调拨转入数量" align="center" prop="DR_SL" show-overflow-tooltip resizable />
        <el-table-column label="调拨转入金额" align="center" prop="DR_JE" show-overflow-tooltip resizable />
        <el-table-column label="调拨转出数量" align="center" prop="DC_SL" show-overflow-tooltip resizable />
        <el-table-column label="调拨转出金额" align="center" prop="DC_JE" show-overflow-tooltip resizable />
        <el-table-column label="科室消耗数量" align="center" prop="KSXH_SL" show-overflow-tooltip resizable />
        <el-table-column label="科室消耗金额" align="center" prop="KSXH_JE" show-overflow-tooltip resizable />
        <el-table-column label="计费数量" align="center" prop="ZZJ_SL" show-overflow-tooltip resizable />
        <el-table-column label="计费金额" align="center" prop="ZZJ_JE" show-overflow-tooltip resizable />
        <el-table-column label="退费数量" align="center" prop="ZZT_SL" show-overflow-tooltip resizable />
        <el-table-column label="退费金额" align="center" prop="ZZT_JE" show-overflow-tooltip resizable />
        <el-table-column label="结存数量" align="center" prop="JC_SL" show-overflow-tooltip resizable />
        <el-table-column label="结存金额" align="center" prop="JC_JE" show-overflow-tooltip resizable />
      </el-table>
    </el-card>
  </div>
</template>

<script>
import { listDepartmentInventory } from "@/api/warehouse/departmentInventory";

export default {
  name: "DepartmentInventory",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 科室库存列表
      departmentInventoryList: [],
      // 查询参数
      queryParams: {
        ksNo: 'f0eb3581-6687-48c3-80f3-bd3ad9b85dc1',
        qcDate: '2024-11-03',
        endDate: '2025-06-30'
      }
    };
  },
  mounted() {
    this.getList();
  },
  methods: {
    /** 查询科室库存列表 */
    getList() {
      this.loading = true;
      listDepartmentInventory(this.queryParams).then(response => {
        console.log(response);
        this.departmentInventoryList = response.data;
        this.loading = false;
        // 使用$nextTick确保DOM更新完成后刷新表格合计
        this.$nextTick(() => {
          // 强制表格重新布局，确保合计正确显示
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    /** 计算合计数量和金额 */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      const numericColumns = ['QC_SL', 'QC_JE', 'CK_SL', 'CK_JE', 'TK_SL', 'TK_JE', 'DR_SL', 'DR_JE', 'DC_SL', 'DC_JE', 'KSXH_SL', 'KSXH_JE', 'ZZJ_SL', 'ZZJ_JE', 'ZZT_SL', 'ZZT_JE', 'JC_SL', 'JC_JE'];
      
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const prop = column.property;
        if (numericColumns.includes(prop)) {
          const values = data.map(item => Number(item[prop]));
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            // 金额类字段保留两位小数
            if (prop.endsWith('JE')) {
              sums[index] = sums[index].toFixed(2);
            }
          } else {
            sums[index] = '';
          }
        }
      });
      return sums;
    }
  }
};
</script>