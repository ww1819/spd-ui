<template>
  <div class="opened-bottle-record">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="记录时间">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="检验平台">
          <el-select v-model="searchForm.platform" placeholder="请选择检验平台">
            <el-option label="全部" value="" />
            <el-option label="请选择检验平台" value="请选择检验平台" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="批号,通过批号,转材码" />
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
      <el-table-column prop="usedCount" label="已使用次数" width="100">
        <template slot-scope="scope">
          <span>{{ scope.row.usedCount }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="80">
        <template slot-scope="scope">
          <el-tag type="success" v-if="scope.row.status === '已用完'">{{ scope.row.status }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="remainingCount" label="有效次数" width="100" />
      <el-table-column prop="lotNo" label="批号" />
      <el-table-column prop="batchNo" label="条码号" />
      <el-table-column prop="subBatchNo" label="瓶条码号" />
      <el-table-column prop="openType" label="开瓶类型" />
      <el-table-column prop="operator" label="开瓶人" />
      <el-table-column prop="openTime" label="开瓶日期" width="160" />
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
  name: 'OpenedBottleRecord',
  data() {
    return {
      searchForm: {
        dateRange: [],
        platform: '',
        keyword: ''
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
          materialCode: '230706228',
          materialName: '二氧化碳钙合力测定试剂盒（酶法）',
          usedCount: 1,
          status: '已用完',
          remainingCount: 30,
          lotNo: '2678',
          batchNo: '200003496002',
          subBatchNo: '200003496002',
          openType: '试剂',
          operator: '陈蓉',
          openTime: '2025-04-08 16:53:47'
        },
        {
          materialCode: '230706244',
          materialName: '镁测定试剂盒（二甲苯胺蓝法）',
          usedCount: 1,
          status: '已用完',
          remainingCount: 30,
          lotNo: 'AUZZ880',
          batchNo: '200002386003',
          subBatchNo: '200002386003',
          openType: '试剂',
          operator: '陈蓉',
          openTime: '2025-04-08 16:53:31'
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
        platform: '',
        keyword: ''
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
.opened-bottle-record {
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