<template>
  <div class="material-use-record">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="使用时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="批号，条码号，转材名称" />
        </el-form-item>
        <el-form-item label="转材类型">
          <el-select v-model="searchForm.materialType" placeholder="请选择转材类型">
            <el-option label="全部" value="" />
            <el-option label="试剂" value="试剂" />
          </el-select>
        </el-form-item>
        <el-form-item label="检验平台">
          <el-select v-model="searchForm.platform" placeholder="请选择检验平台">
            <el-option label="全部" value="" />
            <el-option label="生化（发光）" value="生化（发光）" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <el-table
      :data="tableData"
      border
      style="width: 100%"
    >
      <el-table-column type="index" label="序" width="50" />
      <el-table-column prop="materialCode" label="转材代号" />
      <el-table-column prop="materialName" label="转材名称" />
      <el-table-column prop="useAmount" label="使用量" />
      <el-table-column prop="unit" label="单位" />
      <el-table-column prop="batchNo" label="条码号" />
      <el-table-column prop="lotNo" label="批号" />
      <el-table-column prop="paperBatchNo" label="纸条码号" />
      <el-table-column prop="materialType" label="转材类型" />
      <el-table-column prop="platform" label="仪器平台" />
      <el-table-column prop="deviceName" label="设备名称" />
      <el-table-column prop="recorder" label="记录人" />
    </el-table>

    <div class="pagination-container">
      <el-pagination
        :current-page="currentPage"
        :page-sizes="[20, 50, 100]"
        :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'MaterialUseRecord',
  data() {
    return {
      searchForm: {
        dateRange: [],
        keyword: '',
        materialType: '',
        platform: ''
      },
      tableData: [],
      currentPage: 1,
      pageSize: 20,
      total: 0
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      // 这里添加获取数据的API调用
      // 模拟数据
      this.tableData = [
        {
          materialCode: '230706104',
          materialName: 'MH磷酸干板（优宜）[批口]',
          batchNo: '2000036569',
          lotNo: 'MHP-241207D-1',
          paperBatchNo: '200003656901',
          materialType: '试剂',
          platform: '微生物室',
          deviceName: '恒温手工',
          recorder: '李峻邦'
        }
      ]
      this.total = this.tableData.length
    },
    handleSearch() {
      this.currentPage = 1
      this.fetchData()
    },
    handleReset() {
      this.searchForm = {
        dateRange: [],
        keyword: '',
        materialType: '',
        platform: ''
      }
      this.fetchData()
    },
    handleSizeChange(val) {
      this.pageSize = val
      this.fetchData()
    },
    handleCurrentChange(val) {
      this.currentPage = val
      this.fetchData()
    }
  }
}
</script>

<style scoped>
.material-use-record {
  width: 100%;
}

.search-bar {
  margin-bottom: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style> 