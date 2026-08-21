<template>
  <div class="app-container list-page">
    <div class="query-container" v-show="showSearch">
      <div class="form-fields-container list-query-panel">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
          <more-search-bar
            ref="moreSearchBar"
            v-model="moreSearchTypes"
            :options="moreSearchOptions"
            :storage-key="moreSearchStorageKey"
            :default-types="builtInMoreSearchDefaults"
            :auto-load="false"
            @change="onMoreSearchTypesChange"
            @search="handleQuery"
            @reset="resetQuery"
          >
            <div
              v-for="t in moreSearchTypes"
              :key="t"
              class="more-search-dynamic-field"
              :class="t === 'entityType' ? 'more-search-field--select' : 'more-search-field--text'"
            >
              <el-select
                v-if="t === 'entityType'"
                v-model="queryParams.entityType"
                placeholder="实体类型"
                clearable
                class="more-search-select-wrap"
                style="width: 190px"
              >
                <el-option v-for="o in entityTypeOptions" :key="o.value" :label="o.label" :value="o.value" />
              </el-select>
              <el-input
                v-else
                v-model="queryParams.entityId"
                placeholder="实体主键"
                clearable
                class="more-search-input more-search-input--dynamic"
                @keyup.enter.native="handleQuery"
              />
            </div>
          </more-search-bar>
        </el-form>
      </div>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left" />
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
      </div>
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
  computed: {
    moreSearchStorageKey() {
      return 'spd.foundation.masterSnapshot.moreSearchTypes'
    },
    builtInMoreSearchDefaults() {
      return ['entityType', 'entityId']
    }
  },
  data() {
    return {
      loading: false,
      showSearch: true,
      dataList: [],
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: 'entityType', label: '实体类型' },
        { value: 'entityId', label: '实体主键' }
      ],
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
    this.moreSearchTypes = this.loadMoreSearchDefaults()
    this.onMoreSearchTypesChange()
    this.getList()
  },
  methods: {
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar
      if (bar && typeof bar.loadDefaults === 'function') {
        return bar.loadDefaults()
      }
      const fallback = this.builtInMoreSearchDefaults.slice()
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey)
        if (!raw) return fallback
        const parsed = JSON.parse(raw)
        if (!Array.isArray(parsed)) return fallback
        const allow = new Set(this.moreSearchOptions.map(o => o.value))
        const cleaned = parsed.filter(v => allow.has(v))
        return cleaned.length ? cleaned : fallback
      } catch (e) {
        return fallback
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || [])
      if (!set.has('entityType')) target.entityType = undefined
      if (!set.has('entityId')) target.entityId = undefined
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    },
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      this.applyMoreSearchToQueryParams(params)
      listMasterSnapshot(params).then(res => {
        this.dataList = res.data || []
      }).finally(() => {
        this.loading = false
      })
    },
    handleQuery() {
      this.getList()
    },
    resetQuery() {
      this.moreSearchTypes = this.loadMoreSearchDefaults()
      this.queryParams = { entityType: undefined, entityId: undefined }
      this.onMoreSearchTypesChange()
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
