<template>
  <div class="app-container">
    <div class="entry-path-tip">
      <span class="label">进入路径：</span>
      <span>系统管理 → 客户菜单功能管理（耗材）</span>
      <span class="divider">|</span>
      <span class="label">访问地址：</span>
      <span>/material/system/customerMenuManage</span>
    </div>
    <el-form size="small" :inline="true">
      <el-form-item label="选择客户">
        <el-select v-model="selectedCustomerId" placeholder="请选择客户" clearable filterable style="width: 280px" @change="onCustomerChange">
          <el-option v-for="c in customerOptions" :key="c.customerId" :label="c.customerName + ' (' + (c.customerCode || '') + ')'" :value="c.customerId" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-table v-loading="loading" :data="menuList" border size="small" style="margin-top: 12px">
      <el-table-column label="功能名称" prop="menuName" min-width="200" show-overflow-tooltip />
      <el-table-column label="状态" width="90" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="small">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260" align="center" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" type="text" icon="el-icon-video-pause" @click="handleChangeStatus(scope.row, '1')" v-hasPermi="['hc:system:customerMenuManage:edit']" v-if="scope.row.status === '0'">停用</el-button>
          <el-button size="mini" type="text" icon="el-icon-video-play" @click="handleChangeStatus(scope.row, '0')" v-hasPermi="['hc:system:customerMenuManage:edit']" v-if="scope.row.status === '1'">启用</el-button>
          <el-button size="mini" type="text" icon="el-icon-document" @click="handleStatusLog(scope.row)" v-hasPermi="['hc:system:customerMenuManage:query']">启停用记录</el-button>
          <el-button size="mini" type="text" icon="el-icon-time" @click="handlePeriodLog(scope.row)" v-hasPermi="['hc:system:customerMenuManage:query']">启停用时间段</el-button>
        </template>
      </el-table-column>
    </el-table>
    <div v-if="selectedCustomerId && !loading && menuList.length === 0" class="empty-tip">该客户暂未分配菜单，请先在客户管理中分配菜单权限</div>
    <el-dialog :title="statusDialogTitle" :visible.sync="openStatus" width="480px" append-to-body>
      <el-form ref="statusForm" :model="statusForm" :rules="statusRules" label-width="80px">
        <el-form-item label="功能名称"><el-input v-model="statusForm.menuName" disabled /></el-form-item>
        <el-form-item label="原因" prop="reason">
          <el-input v-model="statusForm.reason" type="textarea" :placeholder="statusForm.status === '1' ? '请输入停用原因' : '请输入启用原因'" :rows="3" maxlength="200" show-word-limit />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitStatusForm">确 定</el-button>
        <el-button @click="openStatus = false">取 消</el-button>
      </div>
    </el-dialog>
    <el-dialog title="启停用记录" :visible.sync="openLog" width="720px" append-to-body>
      <div class="log-dialog-header">{{ logForm.menuName }}</div>
      <el-table :data="statusLogList" border size="small" max-height="360">
        <el-table-column label="操作时间" width="170"><template slot-scope="scope">{{ parseTime(scope.row.operateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</template></el-table-column>
        <el-table-column label="状态" width="90"><template slot-scope="scope"><el-tag :type="scope.row.status === '0' ? 'success' : 'danger'" size="small">{{ scope.row.status === '0' ? '启用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="操作人" prop="operateBy" width="120" />
        <el-table-column label="原因" prop="reason" min-width="200" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer"><el-button @click="openLog = false">关 闭</el-button></div>
    </el-dialog>
    <el-dialog title="启停用时间段" :visible.sync="openPeriod" width="720px" append-to-body>
      <div class="log-dialog-header">{{ logForm.menuName }}</div>
      <el-table :data="periodLogList" border size="small" max-height="360">
        <el-table-column label="类型" width="90"><template slot-scope="scope"><el-tag :type="scope.row.periodType === 'usage' ? 'success' : 'info'" size="small">{{ scope.row.periodType === 'usage' ? '使用' : '停用' }}</el-tag></template></el-table-column>
        <el-table-column label="开始时间" width="170"><template slot-scope="scope">{{ parseTime(scope.row.startTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</template></el-table-column>
        <el-table-column label="结束时间" width="170"><template slot-scope="scope">{{ scope.row.endTime ? parseTime(scope.row.endTime, '{y}-{m}-{d} {h}:{i}:{s}') : '至今' }}</template></el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer"><el-button @click="openPeriod = false">关 闭</el-button></div>
    </el-dialog>
  </div>
</template>

<script>
import { listHcCustomers } from '@/api/material/customer'
import { listMenusByCustomerId, changeMenuStatus, getMenuStatusLogs, getMenuPeriodLogs } from '@/api/material/customerMenuManage'

export default {
  name: 'HcCustomerMenuManage',
  data() {
    return {
      selectedCustomerId: '',
      customerOptions: [],
      loading: false,
      menuList: [],
      openStatus: false,
      openLog: false,
      openPeriod: false,
      statusForm: { customerId: '', menuId: '', menuName: '', status: '0', reason: '' },
      statusRules: { reason: [{ required: true, validator: (r, v, cb) => { if (!v || !String(v).trim()) cb(new Error('请输入原因')); else cb(); }, trigger: 'blur' }] },
      statusDialogTitle: '启停用',
      logForm: { menuName: '' },
      statusLogList: [],
      periodLogList: []
    }
  },
  created() { this.loadCustomerOptions() },
  methods: {
    loadCustomerOptions() {
      listHcCustomers({ pageNum: 1, pageSize: 500 }).then(res => { this.customerOptions = res.rows || [] }).catch(() => { this.customerOptions = [] })
    },
    onCustomerChange() {
      this.menuList = []
      if (!this.selectedCustomerId) return
      this.loading = true
      const tenantId = String(this.selectedCustomerId)
      listMenusByCustomerId(tenantId).then(res => {
        const list = res.data || []
        list.forEach(item => { item.customerId = item.customerId || item.tenantId || tenantId })
        this.menuList = list
        this.loading = false
      }).catch(() => { this.loading = false })
    },
    handleChangeStatus(row, status) {
      const tenantId = row.tenantId || row.customerId || this.selectedCustomerId
      this.statusForm = { customerId: tenantId, menuId: row.menuId, menuName: row.menuName, status: status, reason: '' }
      this.statusDialogTitle = status === '0' ? '启用功能' : '停用功能'
      this.openStatus = true
      this.$nextTick(() => this.$refs.statusForm && this.$refs.statusForm.clearValidate())
    },
    submitStatusForm() {
      this.$refs.statusForm.validate(valid => {
        if (!valid) return
        changeMenuStatus({ tenantId: this.statusForm.customerId, menuId: this.statusForm.menuId, status: this.statusForm.status, reason: this.statusForm.reason }).then(() => {
          this.$modal.msgSuccess('操作成功')
          this.openStatus = false
          this.onCustomerChange()
        })
      })
    },
    handleStatusLog(row) {
      const tenantId = row.tenantId || row.customerId || this.selectedCustomerId
      this.logForm = { menuName: row.menuName }; this.openLog = true; this.statusLogList = []
      getMenuStatusLogs(tenantId, row.menuId).then(res => { this.statusLogList = res.data || [] })
    },
    handlePeriodLog(row) {
      const tenantId = row.tenantId || row.customerId || this.selectedCustomerId
      this.logForm = { menuName: row.menuName }; this.openPeriod = true; this.periodLogList = []
      getMenuPeriodLogs(tenantId, row.menuId).then(res => { this.periodLogList = res.data || [] })
    }
  }
}
</script>

<style scoped>
.entry-path-tip { margin-bottom: 14px; padding: 8px 12px; background: #f4f4f5; border-radius: 4px; font-size: 13px; color: #606266; }
.entry-path-tip .label { color: #909399; margin-right: 4px; }
.entry-path-tip .divider { margin: 0 10px; color: #dcdfe6; }
.empty-tip { color: #909399; padding: 20px; text-align: center; }
.log-dialog-header { margin-bottom: 12px; font-weight: 600; color: #303133; }
</style>
