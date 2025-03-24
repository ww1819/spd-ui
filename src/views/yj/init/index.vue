<template>
  <div class="inventory-management">
    <!-- 搜索框 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="机构单位：">
        <el-select v-model="searchForm.orgUnit" placeholder="请选择机构单位">
          <el-option label="巴中市中心医院" value="巴中市中心医院"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="仓库：">
        <el-select v-model="searchForm.warehouse" placeholder="请选择仓库">
          <el-option label="南坝中心库房" value="南坝中心库房"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="周期：">
        <el-date-picker
          v-model="searchForm.period"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd"
        ></el-date-picker>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onSearch">查询</el-button>
      </el-form-item>
    </el-form>

    <!-- 功能按钮 -->
    <div class="function-buttons">
      <el-button type="primary" icon="el-icon-refresh-right" @click="onInitialize">初始化</el-button>
      <el-button type="primary" icon="el-icon-check" @click="onMonthEndProcessing">月结处理</el-button>
      <el-button type="danger" icon="el-icon-delete" @click="onClearMonthEnd">清除月结</el-button>
    </div>

    <!-- 表格 -->
    <el-table :data="tableData" border style="width: 100%">
      <el-table-column prop="category" label="分类" align="center"></el-table-column>
      <el-table-column prop="initialAmount" label="期初金额" align="center"></el-table-column>
      <el-table-column prop="inAmount" label="进项金额" align="center"></el-table-column>
      <el-table-column prop="outAmount" label="出项金额" align="center"></el-table-column>
      <el-table-column prop="balanceAmount" label="结存金额" align="center"></el-table-column>
      <el-table-column prop="surplusAmount" label="盘盈金额" align="center"></el-table-column>
      <el-table-column prop="shortageAmount" label="盘亏金额" align="center"></el-table-column>
      <el-table-column prop="physicalBalance" label="结存实物金额" align="center"></el-table-column>
    </el-table>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchForm: {
        orgUnit: '巴中市中心医院',
        warehouse: '南坝中心库房',
        period: ['2021-11-25', '2021-11-30']
      },
      tableData: [
        {
          category: '低值易耗品',
          initialAmount: '0',
          inAmount: '84129',
          outAmount: '608',
          balanceAmount: '83521',
          surplusAmount: '0',
          shortageAmount: '0',
          physicalBalance: '83521'
        },
        {
          category: '卫生材料',
          initialAmount: '1618191.26',
          inAmount: '358439.2',
          outAmount: '106395.2',
          balanceAmount: '1870235.26',
          surplusAmount: '0',
          shortageAmount: '0',
          physicalBalance: '1870235.26'
        },
        {
          category: '其他耗材',
          initialAmount: '0',
          inAmount: '0',
          outAmount: '0',
          balanceAmount: '0',
          surplusAmount: '0',
          shortageAmount: '0',
          physicalBalance: '0'
        },
        {
          category: '应急物资',
          initialAmount: '0',
          inAmount: '0',
          outAmount: '0',
          balanceAmount: '0',
          surplusAmount: '0',
          shortageAmount: '0',
          physicalBalance: '0'
        }
      ]
    };
  },
  methods: {
    onSearch() {
      // 查询功能实现
      console.log('查询功能触发');
    },
    onInitialize() {
      // 初始化功能实现
      console.log('初始化功能触发');
    },
    onMonthEndProcessing() {
      // 月结处理功能实现
      console.log('月结处理功能触发');
    },
    onClearMonthEnd() {
      // 清除月结功能实现
      console.log('清除月结功能触发');
    }
  }
};
</script>

<style scoped>
.inventory-management {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.function-buttons {
  margin-bottom: 20px;
  text-align: left;
}
</style>