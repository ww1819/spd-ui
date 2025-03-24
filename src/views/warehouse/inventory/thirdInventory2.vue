<template>
  <div class="inventory-report">
    <!-- 搜索框 -->
    <el-form :inline="true" :model="searchForm" class="search-form">
      <el-form-item label="仓库：">
        <el-select v-model="searchForm.warehouse" placeholder="请选择仓库">
          <el-option label="耗材仓库" value="耗材仓库"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="供应商：">
        <el-select v-model="searchForm.supplier" placeholder="请选择供应商">
          <el-option label="" value=""></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="品名：">
        <el-select v-model="searchForm.productName" placeholder="请选择品名">
          <el-option label="" value=""></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="科室：">
        <el-select v-model="searchForm.department" placeholder="请选择科室">
          <el-option label="" value=""></el-option>
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">查询</el-button>
      </el-form-item>
      <el-form-item>
        <el-button icon="el-icon-download" @click="onExport">导出</el-button>
      </el-form-item>
    </el-form>

    <!-- 表格 -->
    <el-table :data="tableData" border style="width: 100%">
      <el-table-column type="index" label="序号" align="center"></el-table-column>
      <el-table-column prop="materialCode" label="耗材编码" align="center"></el-table-column>
      <el-table-column prop="warehouse" label="仓库" align="center"></el-table-column>
      <el-table-column prop="type" label="类型" align="center"></el-table-column>
      <el-table-column prop="businessDate" label="业务日期" align="center"></el-table-column>
      <el-table-column prop="businessNumber" label="业务单号" align="center"></el-table-column>
      <el-table-column prop="productName" label="品名" align="center"></el-table-column>
      <el-table-column prop="specification" label="规格" align="center"></el-table-column>
      <el-table-column prop="factory" label="厂家" align="center"></el-table-column>
      <el-table-column prop="unit" label="单位" align="center"></el-table-column>
      <el-table-column prop="price" label="单价" align="center"></el-table-column>
      <el-table-column prop="quantity" label="数量" align="center"></el-table-column>
      <el-table-column prop="inventoryQuantity" label="库存数量" align="center"></el-table-column>
      <el-table-column prop="amount" label="金额" align="center"></el-table-column>
      <el-table-column prop="materialCategory" label="耗材分类" align="center"></el-table-column>
      <el-table-column prop="batchNumber" label="批号" align="center"></el-table-column>
      <el-table-column prop="expiryDate" label="有效期" align="center"></el-table-column>
      <el-table-column prop="department" label="科室" align="center"></el-table-column>
      <el-table-column prop="registrationNumber" label="注册证" align="center"></el-table-column>
      <el-table-column prop="batch" label="批次" align="center"></el-table-column>
    </el-table>

    <!-- 分页 -->
    <el-pagination
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
      :current-page="pagination.currentPage"
      :page-sizes="[50]"
      :page-size="pagination.pageSize"
      layout="total, sizes, prev, pager, next, jumper"
      :total="pagination.total"
      class="pagination"
    ></el-pagination>

    <!-- 提示信息 -->
    <div class="tips">
      <p>业务最新的展示在最前面</p>
      <p>库存数量 +- 数量 = 库存数量</p>
      <p>入库是往仓库加库存是正数，退货是往仓库减所以是负数。</p>
      <p>退库是往仓库加库存是正数，出库是往仓库减库存是负数。</p>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      searchForm: {
        warehouse: '',
        supplier: '',
        productName: '',
        department: ''
      },
      tableData: [
        {
          materialCode: '09-02821',
          warehouse: '耗材仓库',
          type: '入库',
          businessDate: '2024/1/13',
          businessNumber: 'RK-240113',
          productName: '医用无菌敷料',
          specification: '70mm*35mm',
          factory: '江西',
          unit: '包',
          price: '5',
          quantity: '200',
          inventoryQuantity: '100',
          amount: '1000',
          materialCategory: '卫生材料',
          batchNumber: '20231102',
          expiryDate: '2025/11/1',
          department: '手术室',
          registrationNumber: '医用无菌敷料',
          batch: '1.240113E+15'
        },
        {
          materialCode: '09-02821',
          warehouse: '耗材仓库',
          type: '出库',
          businessDate: '2024/1/14',
          businessNumber: 'CK-240114',
          productName: '医用无菌敷料',
          specification: '70mm*35mm',
          factory: '江西',
          unit: '包',
          price: '5',
          quantity: '-50',
          inventoryQuantity: '150',
          amount: '-250',
          materialCategory: '卫生材料',
          batchNumber: '20231102',
          expiryDate: '2025/11/1',
          department: '手术室',
          registrationNumber: '医用无菌敷料',
          batch: '1.240113E+15'
        },
        {
          materialCode: '09-02821',
          warehouse: '耗材仓库',
          type: '出库',
          businessDate: '2024/1/14',
          businessNumber: 'CK-240114',
          productName: '医用无菌敷料',
          specification: '70mm*35mm',
          factory: '江西',
          unit: '包',
          price: '5',
          quantity: '-50',
          inventoryQuantity: '100',
          amount: '-250',
          materialCategory: '卫生材料',
          batchNumber: '20231102',
          expiryDate: '2025/11/1',
          department: '手术室',
          registrationNumber: '医用无菌敷料',
          batch: '1.240113E+15'
        }
      ],
      pagination: {
        currentPage: 1,
        pageSize: 50,
        total: 100
      }
    };
  },
  methods: {
    onSearch() {
      // 查询功能实现
      console.log('查询功能触发');
    },
    onExport() {
      // 导出功能实现
      console.log('导出功能触发');
    },
    handleSizeChange(val) {
      // 每页条数改变时触发
      console.log(`每页 ${val} 条`);
    },
    handleCurrentChange(val) {
      // 当前页改变时触发
      console.log(`当前页: ${val}`);
    }
  }
};
</script>

<style scoped>
.inventory-report {
  padding: 20px;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}

.tips {
  margin-top: 20px;
  color: #666;
  font-size: 12px;
  line-height: 1.8;
}
</style>