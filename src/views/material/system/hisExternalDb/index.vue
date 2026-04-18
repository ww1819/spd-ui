<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
      <el-form-item label="租户ID" prop="tenantId">
        <el-input v-model="queryParams.tenantId" placeholder="模糊匹配" clearable style="width: 200px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="库类型" prop="dbType">
        <el-select v-model="queryParams.dbType" placeholder="全部" clearable style="width: 130px">
          <el-option label="SQLSERVER" value="SQLSERVER" />
          <el-option label="MYSQL" value="MYSQL" />
        </el-select>
      </el-form-item>
      <el-form-item label="启用" prop="enabled">
        <el-select v-model="queryParams.enabled" placeholder="全部" clearable style="width: 100px">
          <el-option label="是" value="1" />
          <el-option label="否" value="0" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button type="primary" plain icon="el-icon-plus" size="small" @click="handleAdd" v-hasPermi="['hc:system:hisExternalDb:add']">新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="success" plain icon="el-icon-edit" size="small" :disabled="single" @click="handleUpdate" v-hasPermi="['hc:system:hisExternalDb:edit']">修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="danger" plain icon="el-icon-delete" size="small" :disabled="multiple" @click="handleDelete" v-hasPermi="['hc:system:hisExternalDb:remove']">删除</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
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
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
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
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listHisExternalDb(this.queryParams).then(response => {
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
    }
  }
}
</script>
