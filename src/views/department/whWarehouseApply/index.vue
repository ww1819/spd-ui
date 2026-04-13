<template>
  <div class="app-container">
    <el-form v-show="showSearch" ref="queryForm" :model="queryParams" size="small" :inline="true" class="query-form">
      <el-form-item label="库房申请单号" prop="applyBillNo">
        <el-input v-model="queryParams.applyBillNo" placeholder="单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="科室申领单号" prop="basApplyBillNo">
        <el-input v-model="queryParams.basApplyBillNo" placeholder="科室申领单号" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="仓库" prop="warehouseId">
        <SelectWarehouse v-model="queryParams.warehouseId" style="width: 200px" />
      </el-form-item>
      <el-form-item label="科室" prop="departmentId">
        <SelectDepartment v-model="queryParams.departmentId" style="width: 200px" />
      </el-form-item>
      <el-form-item label="含已作废单">
        <el-switch v-model="queryParams.includeVoidWhole" active-color="#13ce66" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
    </el-row>

    <el-table v-loading="loading" :data="dataList" border height="calc(100vh - 260px)">
      <el-table-column label="序号" type="index" width="60" align="center" />
      <el-table-column label="库房申请单号" align="center" prop="applyBillNo" min-width="160" show-overflow-tooltip />
      <el-table-column label="科室申领单号" align="center" prop="basApplyBillNo" min-width="160" show-overflow-tooltip />
      <el-table-column label="仓库" align="center" min-width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.warehouse && scope.row.warehouse.name ? scope.row.warehouse.name : '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" min-width="120" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ scope.row.department && scope.row.department.name ? scope.row.department.name : '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="状态" align="center" width="100">
        <template slot-scope="scope">
          <span>{{ billStatusText(scope.row.billStatus) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="168" show-overflow-tooltip>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" width="100" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-hasPermi="['department:whWarehouseApply:query','department:dApply:query','outWarehouse:apply:query']"
            type="text"
            size="small"
            @click="handleView(scope.row)"
          >查看</el-button>
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

    <el-dialog title="库房申请单明细" :visible.sync="viewOpen" width="1200px" append-to-body @closed="viewForm = {}">
      <el-descriptions v-if="viewForm && viewForm.id" :column="2" border size="small" class="mb12">
        <el-descriptions-item label="库房申请单号">{{ viewForm.applyBillNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="科室申领单号">{{ viewForm.basApplyBillNo || '—' }}</el-descriptions-item>
        <el-descriptions-item label="仓库">{{ (viewForm.warehouse && viewForm.warehouse.name) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="科室">{{ (viewForm.department && viewForm.department.name) || '—' }}</el-descriptions-item>
        <el-descriptions-item label="状态">{{ billStatusText(viewForm.billStatus) }}</el-descriptions-item>
        <el-descriptions-item label="整单作废">{{ viewForm.voidWholeFlag === 1 ? '是' : '否' }}</el-descriptions-item>
      </el-descriptions>
      <el-table :data="viewEntryList" border max-height="420" size="small">
        <el-table-column label="行号" prop="lineNo" width="60" align="center" />
        <el-table-column label="名称" min-width="140" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.model ? scope.row.material.model : '—' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="申请数量" prop="qty" width="100" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.qty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="待出库数量" prop="pendingOutboundQty" width="110" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.pendingOutboundQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="出库待审核数量" prop="ckPendingAuditQty" width="120" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.ckPendingAuditQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已下推出库合计" prop="linkedCkQty" width="120" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.linkedCkQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已审核出库数量" prop="ckAuditedQty" width="120" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.ckAuditedQty) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="已作废数量" prop="lineVoidQty" width="100" align="right" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ fmtNum(scope.row.lineVoidQty) }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button @click="viewOpen = false">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listWhWarehouseApply, getWhWarehouseApply } from '@/api/department/whWarehouseApply';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';

export default {
  name: 'WhWarehouseApply',
  components: { SelectWarehouse, SelectDepartment },
  data() {
    return {
      loading: false,
      showSearch: true,
      total: 0,
      dataList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        applyBillNo: null,
        basApplyBillNo: null,
        warehouseId: null,
        departmentId: null,
        includeVoidWhole: false
      },
      viewOpen: false,
      viewForm: {},
      viewEntryList: []
    };
  },
  created() {
    this.getList();
  },
  methods: {
    fmtNum(v) {
      if (v === null || v === undefined || v === '') return '—';
      return v;
    },
    billStatusText(s) {
      if (s === 5 || s === '5') return '整单作废';
      if (s === 3 || s === '3') return '关闭';
      if (s === 2 || s === '2') return '已生效';
      if (s === 1 || s === '1') return '待审核';
      return '—';
    },
    getList() {
      this.loading = true;
      const q = { ...this.queryParams };
      if (!q.includeVoidWhole) {
        delete q.includeVoidWhole;
      }
      listWhWarehouseApply(q).then(res => {
        this.dataList = res.rows || [];
        this.total = res.total || 0;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm('queryForm');
      this.queryParams.includeVoidWhole = false;
      this.handleQuery();
    },
    handleView(row) {
      if (!row || !row.id) return;
      getWhWarehouseApply(row.id).then(res => {
        const d = res.data || {};
        this.viewForm = d;
        this.viewEntryList = d.entryList || [];
        this.viewOpen = true;
      });
    }
  }
};
</script>

<style scoped>
.mb12 {
  margin-bottom: 12px;
}
</style>
