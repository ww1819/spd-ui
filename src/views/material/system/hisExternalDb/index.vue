<template>
  <div class="app-container list-page his-external-db-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
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
            class="more-search-dynamic-field more-search-field--text"
          >
            <el-input
              v-model="queryParams.tenantId"
              placeholder="租户ID模糊匹配"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item prop="dbType" class="query-item-inline">
              <el-select v-model="queryParams.dbType" placeholder="库类型" clearable class="more-search-select-wrap">
                <el-option label="SQLSERVER" value="SQLSERVER" />
                <el-option label="MYSQL" value="MYSQL" />
              </el-select>
            </el-form-item>
            <el-form-item prop="enabled" class="query-item-inline">
              <el-select v-model="queryParams.enabled" placeholder="启用状态" clearable class="more-search-short-select">
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          @click="handleAdd"
          v-hasPermi="['hc:system:hisExternalDb:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['hc:system:hisExternalDb:edit']"
        >修改</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--danger"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['hc:system:hisExternalDb:remove']"
        >删除</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <el-alert class="mb8" type="info" show-icon :closable="false"
      title="与 sb_customer.customer_id / 用户租户一致；MYSQL 须填写住院/门诊区间 SQL（各两个 ? 占位符）。列表与详情不回显口令明文。" />

    <el-table v-loading="loading" :data="dataList" @selection-change="handleSelectionChange">
      <el-table-column type="selection" width="50" align="center" />
      <el-table-column label="租户ID" prop="tenantId" min-width="160" show-overflow-tooltip />
      <el-table-column label="库类型" prop="dbType" width="110" align="center" />
      <el-table-column label="JDBC URL" prop="jdbcUrl" min-width="220" show-overflow-tooltip />
      <el-table-column label="账号" prop="username" width="120" show-overflow-tooltip />
      <el-table-column label="口令" prop="password" width="80" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.password || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="启用" prop="enabled" width="88" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.enabled === '1' ? 'success' : 'info'" size="small">
            {{ scope.row.enabled === '1' ? '启用' : '停用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="创建时间" align="center" prop="createTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="160" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-edit" @click="handleUpdate(scope.row)" v-hasPermi="['hc:system:hisExternalDb:edit']">修改</el-button>
          <el-button size="mini" type="text" icon="el-icon-delete" @click="handleDelete(scope.row)" v-hasPermi="['hc:system:hisExternalDb:remove']">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <el-dialog :title="title" :visible.sync="open" width="720px" append-to-body @close="cancel">
      <el-form ref="form" :model="form" :rules="rules" label-width="128px">
        <el-form-item label="租户ID" prop="tenantId">
          <el-input v-model="form.tenantId" :disabled="!!form._editMode" placeholder="与客户 customer_id 一致" maxlength="36" show-word-limit />
        </el-form-item>
        <el-form-item label="库类型" prop="dbType">
          <el-select v-model="form.dbType" placeholder="请选择" style="width: 100%">
            <el-option label="SQLSERVER（可空区间 SQL，走内置视图）" value="SQLSERVER" />
            <el-option label="MYSQL（须填区间 SQL）" value="MYSQL" />
          </el-select>
        </el-form-item>
        <el-form-item label="驱动类" prop="driverClass">
          <el-input v-model="form.driverClass" placeholder="可空，按库类型使用默认驱动" maxlength="256" />
        </el-form-item>
        <el-form-item label="JDBC URL" prop="jdbcUrl">
          <el-input v-model="form.jdbcUrl" type="textarea" :rows="2" placeholder="jdbc:sqlserver://... 或 jdbc:mysql://..." />
        </el-form-item>
        <el-form-item label="账号" prop="username">
          <el-input v-model="form.username" maxlength="128" />
        </el-form-item>
        <el-form-item label="口令" prop="password">
          <el-input v-model="form.password" type="password" show-password autocomplete="new-password" :placeholder="form._editMode ? '留空则不修改口令' : '可空'" />
        </el-form-item>
        <el-form-item label="启用" prop="enabled">
          <el-radio-group v-model="form.enabled">
            <el-radio label="1">启用</el-radio>
            <el-radio label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="住院区间 SQL" prop="sqlInpatientRange">
          <el-input v-model="form.sqlInpatientRange" type="textarea" :rows="3" placeholder="MYSQL 必填；两个 ? 为计费起止时间" />
        </el-form-item>
        <el-form-item label="门诊区间 SQL" prop="sqlOutpatientRange">
          <el-input v-model="form.sqlOutpatientRange" type="textarea" :rows="3" placeholder="MYSQL 必填；两个 ? 为计费起止时间" />
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="form.remark" type="textarea" :rows="2" maxlength="500" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
        <el-button class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listHisExternalDb, getHisExternalDb, addHisExternalDb, updateHisExternalDb, delHisExternalDb } from '@/api/his/externalDb'

export default {
  name: 'HisExternalDb',
  data() {
    return {
      loading: true,
      showSearch: true,
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: '租户ID', value: 'tenantId' }
      ],
      ids: [],
      single: true,
      multiple: true,
      total: 0,
      dataList: [],
      title: '',
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        tenantId: undefined,
        dbType: undefined,
        enabled: undefined
      },
      form: {},
      rules: {
        tenantId: [{ required: true, message: '租户ID不能为空', trigger: 'blur' }],
        dbType: [{ required: true, message: '请选择库类型', trigger: 'change' }],
        jdbcUrl: [{ required: true, message: 'JDBC URL 不能为空', trigger: 'blur' }],
        username: [{ required: true, message: '账号不能为空', trigger: 'blur' }],
        enabled: [{ required: true, message: '请选择启用状态', trigger: 'change' }]
      }
    }
  },
  computed: {
    moreSearchStorageKey() {
      return 'spd.material.system.hisExternalDb.moreSearchTypes'
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value)
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults()
    this.onMoreSearchTypesChange()
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      const params = { ...this.queryParams }
      this.applyMoreSearchToQueryParams(params)
      listHisExternalDb(params).then(response => {
        this.dataList = response.rows
        this.total = response.total
        this.loading = false
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.resetForm('queryForm')
      this.moreSearchTypes = this.loadMoreSearchDefaults()
      this.onMoreSearchTypesChange()
      this.handleQuery()
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.tenantId)
      this.single = selection.length !== 1
      this.multiple = !selection.length
    },
    reset() {
      this.form = {
        tenantId: undefined,
        dbType: 'SQLSERVER',
        driverClass: undefined,
        jdbcUrl: undefined,
        username: undefined,
        password: undefined,
        enabled: '1',
        sqlInpatientRange: undefined,
        sqlOutpatientRange: undefined,
        remark: undefined,
        _editMode: false
      }
      this.resetForm('form')
    },
    handleAdd() {
      this.reset()
      this.open = true
      this.title = '新增 HIS 外联库'
    },
    handleUpdate(row) {
      this.reset()
      const tenantId = row && row.tenantId ? row.tenantId : this.ids[0]
      getHisExternalDb(tenantId).then(res => {
        this.form = { ...res.data, _editMode: true, password: '' }
        this.open = true
        this.title = '修改 HIS 外联库'
      })
    },
    submitForm() {
      this.$refs['form'].validate(valid => {
        if (!valid) return
        const payload = { ...this.form }
        delete payload._editMode
        delete payload.createTime
        const req = this.form._editMode ? updateHisExternalDb(payload) : addHisExternalDb(payload)
        req.then(() => {
          this.$modal.msgSuccess(this.form._editMode ? '修改成功' : '新增成功')
          this.open = false
          this.getList()
        })
      })
    },
    cancel() {
      this.open = false
      this.reset()
    },
    handleDelete(row) {
      const tenantIds = row && row.tenantId ? [row.tenantId] : this.ids
      this.$modal.confirm('是否确认删除租户「' + tenantIds.join('、') + '」的 HIS 外联配置？').then(() => {
        const ps = tenantIds.map(id => delHisExternalDb(id))
        return Promise.all(ps)
      }).then(() => {
        this.getList()
        this.$modal.msgSuccess('删除成功')
      }).catch(() => {})
    },
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
      if (!set.has('tenantId')) {
        target.tenantId = null
      }
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams)
    }
  }
}
</script>

<style scoped>
.list-query-panel {
  margin-top: -20px;
}
</style>
