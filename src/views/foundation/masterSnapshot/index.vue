<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
      <el-form-item label="实体类型" prop="entityType">
        <el-select v-model="queryParams.entityType" placeholder="全部" clearable style="width: 200px">
          <el-option v-for="o in entityTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
        </el-select>
      </el-form-item>
      <el-form-item label="实体主键" prop="entityId">
        <el-input v-model="queryParams.entityId" placeholder="如供应商 id" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="small" @click="handleQuery">搜索</el-button>
        <el-button size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="dataList" border size="small">
      <el-table-column label="快照主键" prop="id" width="280" show-overflow-tooltip />
      <el-table-column label="类型" prop="entityType" width="160" />
      <el-table-column label="实体主键" prop="entityId" width="120" />
      <el-table-column label="操作人" prop="createBy" width="100" />
      <el-table-column label="时间" prop="createTime" width="165" />
      <el-table-column label="操作" width="120" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button type="text" size="small" @click="openDetail(scope.row)">变更内容</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog title="变更前后（JSON）" :visible.sync="detailOpen" width="900px" append-to-body @closed="detailRow = null">
      <template v-if="detailRow">
        <el-tabs v-model="detailTab">
          <el-tab-pane label="变更前" name="before">
            <pre class="json-block">{{ formatJson(detailRow.beforeJson) }}</pre>
          </el-tab-pane>
          <el-tab-pane label="变更后" name="after">
            <pre class="json-block">{{ formatJson(detailRow.afterJson) }}</pre>
          </el-tab-pane>
        </el-tabs>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { listMasterSnapshot } from '@/api/foundation/masterSnapshot'

export default {
  name: 'FoundationMasterSnapshot',
  data() {
    return {
      loading: false,
      showSearch: true,
      dataList: [],
      queryParams: {
        entityType: undefined,
        entityId: undefined
      },
      entityTypeOptions: [
        { label: '供应商', value: 'SUPPLIER' },
        { label: '生产厂家', value: 'FACTORY' },
        { label: '科室', value: 'DEPARTMENT' },
        { label: '库房分类', value: 'WAREHOUSE_CATEGORY' },
        { label: '财务分类', value: 'FINANCE_CATEGORY' }
      ],
      detailOpen: false,
      detailRow: null,
      detailTab: 'before'
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listMasterSnapshot(this.queryParams).then(res => {
        this.dataList = res.data || []
      }).finally(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.getList()
    },
    resetQuery() {
      this.queryParams = { entityType: undefined, entityId: undefined }
      this.getList()
    },
    openDetail(row) {
      this.detailRow = row
      this.detailTab = 'before'
      this.detailOpen = true
    },
    formatJson(s) {
      if (!s) return ''
      try {
        return JSON.stringify(JSON.parse(s), null, 2)
      } catch (e) {
        return s
      }
    }
  }
}
</script>

<style scoped>
.json-block {
  max-height: 55vh;
  overflow: auto;
  font-size: 12px;
  line-height: 1.4;
  margin: 0;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}
</style>
