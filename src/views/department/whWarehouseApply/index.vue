<template>
  <div class="app-container list-page wh-warehouse-apply-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form ref="queryForm" :model="queryParams" size="small" :inline="true" class="query-form">
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
            :class="moreSearchFieldClass(t)"
          >
            <template v-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse v-model="queryParams.warehouseId" />
              </div>
            </template>
            <template v-else-if="t === 'department'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </template>
            <el-input
              v-else-if="t === 'basApplyBillNo'"
              v-model="queryParams.basApplyBillNo"
              placeholder="科室申领单号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-else
              v-model="queryParams.applyBillNo"
              placeholder="库房申请单号"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </more-search-bar>

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
      moreSearchTypes: [],
      moreSearchOptions: [
        { label: "库房申请单号", value: "applyBillNo" },
        { label: "科室申领单号", value: "basApplyBillNo" },
        { label: "仓库", value: "warehouse" },
        { label: "科室", value: "department" }
      ],
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
  computed: {
    moreSearchStorageKey() {
      return 'spd.department.whWarehouseApply.moreSearchTypes';
    },
    builtInMoreSearchDefaults() {
      return this.moreSearchOptions.map(o => o.value);
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
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
      this.applyMoreSearchToQueryParams(q);
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
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    moreSearchFieldClass(t) {
      if (['warehouse', 'department'].includes(t)) {
        return 'more-search-field--select';
      }
      return 'more-search-field--text';
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.loadDefaults === 'function') {
        return bar.loadDefaults();
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v));
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      const map = {
        applyBillNo: 'applyBillNo',
        basApplyBillNo: 'basApplyBillNo',
        warehouse: 'warehouseId',
        department: 'departmentId'
      };
      Object.keys(map).forEach((type) => {
        if (!set.has(type)) {
          target[map[type]] = null;
        }
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
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
.list-query-panel {
  margin-top: -20px;
}
.query-switch-label {
  margin-right: 8px;
  color: #606266;
}
</style>
