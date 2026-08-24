<template>
  <div class="app-container list-page wh-warehouse-apply-page" :class="{ 'is-modal-open': viewOpen }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form ref="queryForm" :model="queryParams" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.applyBillNo"
              placeholder="库房申请单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.basApplyBillNo"
              placeholder="科室申领单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" />
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectDepartment v-model="queryParams.departmentId" />
            </div>
            <div class="query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-item-inline">
              <span class="query-switch-label">含已作废单</span>
              <el-switch v-model="queryParams.includeVoidWhole" active-color="#13ce66" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left"></div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="dataList" class="table-compact apply-main-table"
              :height="mainTableHeight" border stripe>
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

    <div class="apply-pagination-wrap" ref="paginationWrap">
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
    </div>

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
        <el-button class="spd-btn spd-btn--secondary" @click="viewOpen = false">关 闭</el-button>
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
      mainTableHeight: 400,
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
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    }
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight();
    },
    scheduleApplyLayoutRefresh() {
      const run = () => this.updateMainTableHeight();
      this.$nextTick(() => {
        run();
        requestAnimationFrame(() => {
          run();
          [50, 120, 300].forEach((ms) => setTimeout(run, ms));
        });
      });
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const next = Math.floor(panelH - pagH);
      const height = Math.max(200, next);
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.doLayout) {
          table.doLayout();
        }
        this.$nextTick(() => {
          this.syncApplyTableSticky();
          requestAnimationFrame(() => this.syncApplyTableSticky());
        });
      });
    },
    syncApplyTableSticky() {
      const table = this.$refs.applyMainTable;
      const root = table && table.$el;
      if (!root) return;
      const bodyWrap = root.querySelector('.el-table__body-wrapper');
      if (!bodyWrap) return;
      const sw = Math.max(0, bodyWrap.offsetWidth - bodyWrap.clientWidth);
      root.style.setProperty('--apply-v-scrollbar', `${sw}px`);
    },
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
        this.scheduleApplyLayoutRefresh();
      }).catch(() => {
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
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
.query-switch-label {
  margin-right: 8px;
  color: #606266;
}
</style>
