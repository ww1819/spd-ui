<template>
  <div class="test-item-record">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="检验时间">
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
            <el-option label="生化" value="生化" />
            <el-option label="免疫" value="免疫" />
            <el-option label="血球" value="血球" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="项目名称，批号等" />
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
      <el-table-column prop="testDate" label="检验日期" width="160" />
      <el-table-column prop="testItem" label="检验项目" />
      <el-table-column prop="testPlatform" label="检验平台" />
      <el-table-column prop="deviceName" label="设备名称" />
      <el-table-column prop="materialName" label="转材名称" />
      <el-table-column prop="batchNo" label="批号" />
      <el-table-column prop="result" label="检验结果">
        <template slot-scope="scope">
          <el-tag :type="scope.row.result === '合格' ? 'success' : 'danger'">
            {{ scope.row.result }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="operator" label="操作人" />
      <el-table-column prop="reviewer" label="审核人" />
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
  name: 'TestItemRecord',
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
          testDate: '2024-03-20 09:30:00',
          testItem: '血常规五分类',
          testPlatform: '血球',
          deviceName: 'XN-1000',
          materialName: '血细胞分析仪质控品(XN)',
          batchNo: 'QB-24-0168',
          result: '合格',
          operator: '张三',
          reviewer: '李四'
        },
        {
          testDate: '2024-03-20 10:15:00',
          testItem: '肝功能',
          testPlatform: '生化',
          deviceName: 'AU5800',
          materialName: '生化质控品',
          batchNo: 'BC-24-0235',
          result: '合格',
          operator: '王五',
          reviewer: '赵六'
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
.test-item-record {
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