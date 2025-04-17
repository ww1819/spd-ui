<template>
  <div class="material-inventory">
    <div class="search-bar">
      <el-form :inline="true" :model="searchForm" class="demo-form-inline">
        <el-form-item label="关键字">
          <el-input v-model="searchForm.keyword" placeholder="请输入转材名称、批号等" />
        </el-form-item>
        <el-form-item label="供应商">
          <el-select v-model="searchForm.supplier" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="深圳市立康生物技术有限公司" value="深圳市立康生物技术有限公司" />
          </el-select>
        </el-form-item>
        <el-form-item label="制造商">
          <el-select v-model="searchForm.manufacturer" placeholder="全部">
            <el-option label="全部" value="" />
            <el-option label="深圳市立康生物技术有限公司" value="深圳市立康生物技术有限公司" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="启用">
            <el-option label="启用" value="启用" />
            <el-option label="停用" value="停用" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div class="left-table">
        <el-table
          :data="tableDataLeft"
          border
          style="width: 100%"
          @row-click="handleRowClick"
        >
          <el-table-column type="index" label="序" width="50" />
          <el-table-column prop="materialCode" label="转材代号" />
          <el-table-column prop="materialName" label="转材名称" />
          <el-table-column prop="status" label="状态" width="80">
            <template slot-scope="scope">
              <el-tag type="success" v-if="scope.row.status === '启用'">{{ scope.row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="specs" label="规格" />
          <el-table-column prop="unit" label="单位" width="80" />
          <el-table-column prop="supplier" label="供应商" />
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

      <div class="right-tables">
        <el-table
          :data="tableDataRight1"
          border
          style="width: 100%; margin-bottom: 20px"
        >
          <el-table-column type="index" label="序" width="50" />
          <el-table-column prop="materialNo" label="转材批号" />
          <el-table-column prop="validPeriod" label="有效期" />
          <el-table-column prop="openUsePeriod" label="开瓶使用时间" />
        </el-table>

        <el-table
          :data="tableDataRight2"
          border
          style="width: 100%"
        >
          <el-table-column type="index" label="序" width="50" />
          <el-table-column prop="materialCode" label="转材序码" />
          <el-table-column prop="recordTime" label="记录时间" />
          <el-table-column prop="status" label="操作名称" />
          <el-table-column prop="operator" label="操作人" />
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MaterialInventory',
  data() {
    return {
      searchForm: {
        keyword: '',
        supplier: '',
        manufacturer: '',
        status: '启用'
      },
      tableDataLeft: [],
      currentPage: 1,
      pageSize: 20,
      total: 0,
      tableDataRight1: [],
      tableDataRight2: []
    }
  },
  created() {
    this.fetchData()
  },
  methods: {
    fetchData() {
      // 模拟左侧表格数据
      this.tableDataLeft = [
        {
          materialCode: '23071001',
          materialName: '艾滋配血质控品（微柱凝胶）',
          status: '启用',
          specs: '5瓶/盒',
          unit: '盒',
          supplier: '深圳市立康生物技术有限公司'
        },
        {
          materialCode: 'ZB00007528',
          materialName: '艾滋配血质控品（微柱凝胶）',
          status: '启用',
          specs: '5瓶/盒',
          unit: '盒',
          supplier: '深圳市立康生物技术有限公司'
        }
      ]
      this.total = this.tableDataLeft.length

      // 模拟右上表格数据
      this.tableDataRight1 = [
        {
          materialNo: '32',
          validPeriod: '2025-12-18',
          openUsePeriod: '2023-08-30 11:30:00'
        }
      ]

      // 模拟右下表格数据
      this.tableDataRight2 = [
        {
          materialCode: '200000232',
          recordTime: '2023-08-30',
          status: '已生成',
          operator: '陈莉'
        },
        {
          materialCode: '200000233',
          recordTime: '2023-08-30',
          status: '已入库',
          operator: '陈莉'
        }
      ]
    },
    handleSearch() {
      this.currentPage = 1
      this.fetchData()
    },
    handleReset() {
      this.searchForm = {
        keyword: '',
        supplier: '',
        manufacturer: '',
        status: '启用'
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
    },
    handleRowClick(row) {
      // 点击左侧表格行时更新右侧表格数据
      // 这里可以调用API获取对应的数据
      console.log('Selected row:', row)
    }
  }
}
</script>

<style scoped>
.material-inventory {
  width: 100%;
}

.search-bar {
  margin-bottom: 20px;
  background-color: #fff;
  padding: 20px;
  border-radius: 4px;
}

.table-container {
  display: flex;
  gap: 20px;
}

.left-table {
  flex: 1;
}

.right-tables {
  flex: 1;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style> 