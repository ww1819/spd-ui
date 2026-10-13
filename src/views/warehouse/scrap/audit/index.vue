<template>
  <div class="app-container list-page scrap-audit-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="报损单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse
                v-model="queryParams.warehouseId"
                :excludeWarehouseType="['高值', '设备']"
                placeholder="仓库"
              />
            </div>
            <el-input
              v-model="queryParams.createByName"
              placeholder="制单人"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-input
              v-model="queryParams.scrapReason"
              placeholder="报损原因"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <el-radio-group v-model="queryParams.dateQueryType" size="small" class="apply-date-type-group">
                <el-radio-button label="bill">制单日期</el-radio-button>
                <el-radio-button label="audit">审核日期</el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-model="queryParams.beginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item prop="billStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.billStatus" placeholder="单据状态" clearable class="apply-query-field">
                <el-option
                  v-for="item in billStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
                />
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
          icon="el-icon-check"
          class="spd-btn spd-btn--primary"
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['warehouse:scrap:audit']"
        >审核</el-button>
        <el-button
          type="warning"
          size="small"
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
      <el-table
        ref="applyMainTable"
        v-loading="loading"
        :data="dataList"
        class="table-compact apply-main-table"
        row-key="id"
        :height="mainTableHeight"
        border
        stripe
        :row-class-name="applyMainRowClassName"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleMainRowDblclick"
      >
        <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" :selectable="selectableAuditRow" />
        <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable />
        <el-table-column label="报损单号" align="center" prop="billNo" min-width="160" show-overflow-tooltip resizable sortable>
          <template slot-scope="scope">
            <el-button
              type="text"
              @click="handleView(scope.row)"
            >
              <span>{{ scope.row.billNo || '--' }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="仓库" align="center" prop="warehouseName" min-width="160" show-overflow-tooltip resizable />
        <el-table-column label="报损原因" align="center" prop="scrapReason" min-width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.scrapReason || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单人" align="center" prop="createByName" min-width="100" show-overflow-tooltip resizable />
        <el-table-column label="制单日期" align="center" prop="billDate" min-width="170" show-overflow-tooltip resizable sortable>
          <template slot-scope="scope">
            <span>{{ scope.row.billDate || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" prop="totalAmount" min-width="110" show-overflow-tooltip resizable sortable>
          <template slot-scope="scope">
            <span>{{ formatAmount(scope.row.totalAmount) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单据状态" align="center" prop="billStatus" min-width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <el-tag :type="billStatusTagType(scope.row.billStatus)" size="small">
              {{ billStatusLabel(scope.row.billStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="审核人" align="center" prop="auditByName" min-width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.auditByName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核日期" align="center" prop="auditDate" min-width="170" show-overflow-tooltip resizable sortable>
          <template slot-scope="scope">
            <span>{{ scope.row.auditDate || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" min-width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.remark || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          align="center"
          header-align="center"
          class-name="apply-action-col small-padding fixed-width"
          width="160"
          fixed="right"
        >
          <template slot-scope="scope">
            <span style="white-space: nowrap; display: inline-block;">
              <el-button
                v-if="isAuditableStatus(scope.row.billStatus)"
                size="small"
                type="text"
                icon="el-icon-check"
                style="padding: 0 5px; margin: 0;"
                v-hasPermi="['warehouse:scrap:audit']"
                @click="handleAudit(scope.row)"
              >审核</el-button>
              <el-button
                size="small"
                type="text"
                icon="el-icon-view"
                style="padding: 0 5px; margin: 0;"
                @click="handleView(scope.row)"
              >查看</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>

      <div class="apply-pagination-wrap apply-pager-bar" ref="paginationWrap">
        <div class="pagination-summary" />
        <pagination
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </div>

    <!-- 新增/编辑报废弹窗（布局对齐到货验收 apply-modal） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>

            <el-form ref="form" :model="form" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
              <!-- 表头区：对齐到货验收 apply-modal-query-panel -->
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="单据号" prop="billNo" class="form-item-header-billno">
                      <el-input v-model="form.billNo" :disabled="true" :title="form.billNo || ''" placeholder="保存后生成" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="仓库" prop="warehouseId" class="apply-modal-label-required">
                      <SelectWarehouse
                        v-model="form.warehouseId"
                        :excludeWarehouseType="['高值', '设备']"
                        placeholder="仓库"
                        class="header-field-select-compact"
                        :disabled="formReadonly"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="总金额" prop="totalAmount" class="apply-modal-label-required">
                      <el-input :value="formatAmount(form.totalAmount)" :disabled="true" placeholder="总金额" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="报损原因" prop="scrapReason">
                      <el-input v-model="form.scrapReason" placeholder="报损原因" clearable :disabled="formReadonly" maxlength="200" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人">
                      <el-input v-model="form.createByName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="billDate">
                      <el-date-picker
                        v-model="form.billDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="制单日期"
                        style="width: 100%"
                        clearable
                        :disabled="formReadonly"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人">
                      <el-input v-model="form.auditByName" :disabled="true" placeholder="审核后生成" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="审核日期" prop="auditDate">
                      <el-date-picker
                        v-model="form.auditDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="审核后生成"
                        style="width: 100%"
                        disabled
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="单据状态">
                      <el-input :value="billStatusLabel(form.billStatus)" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--remark">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable :disabled="formReadonly" maxlength="500" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <!-- 工具栏：独立于明细表，对齐到货验收 apply-modal-toolbar -->
              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">报损明细信息</span>
                  <el-button
                    v-if="isAuditableStatus(form.billStatus)"
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    icon="el-icon-check"
                    v-hasPermi="['warehouse:scrap:audit']"
                    @click="handleAudit(form)"
                  >审 核</el-button>
                </div>
              </el-row>

              <!-- 明细表：对齐到货验收 apply-modal-table-panel -->
              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    :data="detailList"
                    class="apply-detail-table"
                    border
                    show-summary
                    :summary-method="getSummaries"
                    :height="detailTableHeight"
                    @selection-change="handleDetailSelectionChange"
                  >
                    <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
                    <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable />
                    <el-table-column label="产品编码" align="center" prop="materialCode" min-width="120" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialCode || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column
                      label="产品名称"
                      align="left"
                      header-align="center"
                      prop="materialName"
                      min-width="160"
                      :show-overflow-tooltip="false"
                      resizable
                      sortable
                    >
                      <template slot-scope="scope">
                        <span class="detail-text-cell-2line" :title="scope.row.materialName || '--'">{{ scope.row.materialName || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="center" prop="speci" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.speci || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" prop="unit" width="70" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unit || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="数量" align="center" prop="qty" min-width="90" resizable>
                      <template slot-scope="scope">
                        <el-input
                          v-if="!formReadonly"
                          v-model="scope.row.qty"
                          size="small"
                          class="detail-input-compact"
                          placeholder="数量"
                          @input="onDetailAmountChange"
                        />
                        <span v-else>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="价格" align="center" prop="price" min-width="90" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.price != null && scope.row.price !== '' ? scope.row.price : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" align="center" prop="amount" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ formatAmount(scope.row.amount) }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批号" align="center" prop="batchNo" min-width="110" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <el-input
                          v-if="!formReadonly"
                          v-model="scope.row.batchNo"
                          size="small"
                          class="detail-input-compact"
                          placeholder="批号"
                        />
                        <span v-else>{{ scope.row.batchNo || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产日期" align="center" prop="produceDate" min-width="120" resizable>
                      <template slot-scope="scope">
                        <el-date-picker
                          v-if="!formReadonly"
                          v-model="scope.row.produceDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          size="small"
                          class="detail-input-compact"
                          placeholder="生产日期"
                        />
                        <span v-else>{{ scope.row.produceDate || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="有效期" align="center" prop="expiryDate" min-width="120" resizable>
                      <template slot-scope="scope">
                        <el-date-picker
                          v-if="!formReadonly"
                          v-model="scope.row.expiryDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          size="small"
                          class="detail-input-compact"
                          placeholder="有效期"
                        />
                        <span v-else>{{ scope.row.expiryDate || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" prop="manufacturer" min-width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.manufacturer || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="center" prop="model" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.model || '--' }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { listScrapBill, getScrapBill, auditScrapBill } from '@/api/warehouse/scrap';

export default {
  name: "WarehouseScrapAudit",
  data() {
    return {
      loading: false,
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      dataList: [],
      ids: [],
      selectedRows: [],
      selectedRowMap: {},
      single: true,
      multiple: true,
      open: false,
      title: "",
      formReadonly: true,
      dialogMaterialShow: false,
      detailList: [],
      detailSelection: [],
      form: {
        id: null,
        billNo: "",
        warehouseId: null,
        totalAmount: null,
        scrapReason: "",
        billDate: null,
        createByName: "",
        auditByName: "",
        auditDate: null,
        billStatus: "1",
        remark: ""
      },
      billStatusOptions: [
        { label: "未审核", value: "1" },
        { label: "已审核", value: "2" }
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        warehouseId: null,
        createByName: null,
        scrapReason: null,
        billStatus: "1",
        dateQueryType: "bill",
        beginDate: this.getStatDate(),
        endDate: this.getEndDate()
      }
    };
  },
  computed: {
    /** 明细表高度：与到货验收一致 calc(100vh - 384px) */
    detailTableHeight() {
      return "max(240px, calc(100vh - 384px))";
    }
  },
  mounted() {
    this.getList();
    this.$nextTick(() => this.updateMainTableHeight());
    window.addEventListener("resize", this.onWindowResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onWindowResize);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    open(val) {
      if (!val) {
        this.$nextTick(() => this.updateMainTableHeight());
      }
    }
  },
  methods: {
    billStatusLabel(status) {
      const hit = (this.billStatusOptions || []).find((item) => String(item.value) === String(status));
      return (hit && hit.label) || "--";
    },
    billStatusTagType(status) {
      const s = String(status == null ? "" : status);
      if (s === "2") return "success";
      if (s === "1") return "warning";
      if (s === "0") return "info";
      return "info";
    },
    /** 未审核可审核 */
    isAuditableStatus(status) {
      return String(status == null ? "" : status) === "1";
    },
    selectableAuditRow(row) {
      return this.isAuditableStatus(row && row.billStatus);
    },
    formatAmount(val) {
      if (val == null || val === "") return "-";
      const n = Number(val);
      if (Number.isNaN(n)) return "-";
      return n.toFixed(2);
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : "";
    },
    dataListIndex({ row, rowIndex }) {
      if (row) {
        row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      }
    },
    /** 主表行 class：序号 + 勾选高亮（对齐到货验收） */
    applyMainRowClassName({ row, rowIndex }) {
      this.dataListIndex({ row, rowIndex });
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return "apply-row-selected";
      }
      return "";
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.dataList || !this.dataList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.dataList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    handleSelectionChange(selection) {
      const pageKeys = (this.dataList || [])
        .map((row) => this.getApplyMainRowKey(row))
        .filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key);
        }
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) {
          this.$set(this.selectedRowMap, key, row);
        }
      });
      this.selectedRows = Object.keys(this.selectedRowMap || {}).map((key) => this.selectedRowMap[key]);
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    },
    /** 双击行切换勾选（操作列 / 单号列除外） */
    handleMainRowDblclick(row, column) {
      if (!row) return;
      if (column && (column.type === "selection" || column.label === "操作" || column.property === "billNo")) {
        return;
      }
      if (!this.selectableAuditRow(row)) {
        return;
      }
      const table = this.$refs.applyMainTable;
      if (!table) return;
      const key = this.getApplyMainRowKey(row);
      const selected = !!(key && this.selectedRowMap && this.selectedRowMap[key]);
      table.toggleRowSelection(row, !selected);
    },
    getStatDate() {
      const d = new Date();
      d.setDate(d.getDate() - 5);
      return this.formatDateTime(d, true);
    },
    getEndDate() {
      return this.formatDateTime(new Date(), false);
    },
    formatDateTime(d, startOfDay) {
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      const ymd = d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
      return startOfDay ? ymd + " 00:00:00" : ymd + " 23:59:59";
    },
    todayYmd() {
      const d = new Date();
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    },
    onWindowResize() {
      this.updateMainTableHeight();
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const height = Math.max(200, Math.floor(panelH - pagH));
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.doLayout) table.doLayout();
      });
    },
    getList() {
      this.loading = true;
      listScrapBill(this.queryParams)
        .then((res) => {
          this.dataList = res.rows || [];
          this.total = res.total || 0;
          this.$nextTick(() => this.restoreMainPageSelection());
        })
        .finally(() => {
          this.loading = false;
          this.$nextTick(() => this.updateMainTableHeight());
        });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        warehouseId: null,
        createByName: null,
        scrapReason: null,
        billStatus: "1",
        dateQueryType: "bill",
        beginDate: this.getStatDate(),
        endDate: this.getEndDate()
      };
      this.getList();
    },
    resetForm() {
      const nick =
        (this.$store.getters.nickName) ||
        (this.$store.state.user && this.$store.state.user.nickName) ||
        "";
      this.formReadonly = false;
      this.dialogMaterialShow = false;
      this.form = {
        id: null,
        billNo: "",
        warehouseId: null,
        totalAmount: null,
        scrapReason: "",
        billDate: this.todayYmd(),
        createByName: nick,
        auditByName: "",
        auditDate: null,
        billStatus: "0",
        remark: ""
      };
      this.detailList = [];
      this.detailSelection = [];
    },
    handleAdd() {
      this.resetForm();
      this.title = "添加报损";
      this.open = true;
    },
    clearSelection() {
      this.selectedRowMap = {};
      this.selectedRows = [];
      this.ids = [];
      this.single = true;
      this.multiple = true;
      const table = this.$refs.applyMainTable;
      if (table && table.clearSelection) table.clearSelection();
    },
    doAudit(ids, tip) {
      return this.$modal
        .confirm(tip)
        .then(() => auditScrapBill(ids))
        .then(() => {
          this.$modal.msgSuccess("审核成功");
          this.open = false;
          this.clearSelection();
          this.getList();
        })
        .catch(() => {});
    },
    handleAudit(row) {
      if (!row || row.id == null) return;
      if (!this.isAuditableStatus(row.billStatus)) {
        this.$modal.msgWarning("仅未审核的报损单可审核");
        return;
      }
      const no = row.billNo || row.id;
      this.doAudit([row.id], "确定审核报损单 " + no + " 吗？");
    },
    handleBatchAudit() {
      if (!this.ids.length) {
        this.$modal.msgError("请先选择要审核的单据");
        return;
      }
      const pending = (this.selectedRows || []).filter((r) => this.isAuditableStatus(r.billStatus));
      if (!pending.length) {
        this.$modal.msgWarning("已选中的单据均不可审核");
        return;
      }
      const ids = pending.map((r) => r.id);
      const nos = pending.map((r) => r.billNo).filter(Boolean).join("，");
      const skip = (this.selectedRows || []).length - pending.length;
      const skipTip = skip > 0 ? "（已跳过" + skip + "条不可审核单据）" : "";
      this.doAudit(ids, "确定审核选中的 " + pending.length + " 张报损单吗？" + skipTip + "\n单号：" + nos);
    },
    handleView(row) {
      if (!row || row.id == null) return;
      getScrapBill(row.id).then((res) => {
        const data = (res && res.data) || res || {};
        this.openEditForm(data, true);
      });
    },
    handleUpdate(row) {
      this.handleView(row);
    },
    openEditForm(data, readonly) {
      const nick =
        data.createByName ||
        (this.$store.getters.nickName) ||
        (this.$store.state.user && this.$store.state.user.nickName) ||
        "";
      this.formReadonly = true;
      this.dialogMaterialShow = false;
      this.form = {
        id: data.id || null,
        billNo: data.billNo || "",
        warehouseId: data.warehouseId || null,
        totalAmount: data.totalAmount != null ? data.totalAmount : null,
        scrapReason: data.scrapReason || "",
        billDate: data.billDate || this.todayYmd(),
        createByName: nick,
        auditByName: data.auditByName || "",
        auditDate: data.auditDate || null,
        billStatus: data.billStatus != null ? data.billStatus : "0",
        remark: data.remark || ""
      };
      const entries = data.entryList || [];
      this.detailList = entries.map((e, idx) => ({
        inventoryId: e.inventoryId || null,
        materialId: e.materialId,
        materialCode: e.materialCode || "",
        materialName: e.materialName || "",
        speci: e.speci || "",
        model: e.model || "",
        unit: e.unitName || e.unit || "",
        qty: e.qty,
        price: e.price,
        amount: e.amount,
        batchNo: e.batchNo || "",
        produceDate: e.produceDate || "",
        expiryDate: e.expiryDate || "",
        manufacturer: e.manufacturer || "",
        index: idx + 1
      }));
      this.detailSelection = [];
      this.title = this.isAuditableStatus(data.billStatus) ? "报损审批" : "报损详情";
      this.open = true;
    },
    cancel() {
      this.open = false;
      this.dialogMaterialShow = false;
      this.resetForm();
    },
    handleExport() {
      this.$modal.msg("导出功能开发中");
    },
    handleAddDetail() {
      if (!this.form.warehouseId) {
        this.$message({ message: "请先选择仓库", type: "warning" });
        return;
      }
      this.dialogMaterialShow = true;
    },
    closeMaterialDialog() {
      this.dialogMaterialShow = false;
    },
    selectMaterialData(val) {
      const rows = Array.isArray(val) ? val : [];
      rows.forEach((item) => {
        const material = item.material || item;
        const materialId = material.id || item.materialId || item.id;
        const exists = this.detailList.some(
          (d) => d.materialId != null && String(d.materialId) === String(materialId)
        );
        if (exists) return;
        const price =
          item.unitPrice != null
            ? item.unitPrice
            : item.price != null
              ? item.price
              : material.price != null
                ? material.price
                : null;
        const qty = item.qty != null && item.qty !== "" ? item.qty : null;
        let amount = null;
        if (qty != null && price != null && !Number.isNaN(Number(qty)) && !Number.isNaN(Number(price))) {
          amount = (Number(qty) * Number(price)).toFixed(2);
        }
        const inventoryId =
          item.material != null && item.id != null && String(item.id) !== String(materialId)
            ? item.id
            : item.inventoryId || null;
        this.detailList.push({
          inventoryId,
          materialId,
          materialCode: material.code || item.materialCode || "",
          materialName: material.name || item.materialName || "",
          speci: material.speci || "",
          model: material.model || "",
          unit: (material.fdUnit && material.fdUnit.unitName) || material.unitName || item.unitName || "",
          qty,
          price,
          amount,
          batchNo: item.batchNo || item.batchCode || "",
          produceDate: item.produceDate || item.beginDate || "",
          expiryDate: item.expiryDate || item.periodDate || "",
          manufacturer:
            (material.fdFactory && material.fdFactory.factoryName) ||
            material.factoryName ||
            item.factoryName ||
            ""
        });
      });
      this.detailList.forEach((row, idx) => {
        row.index = idx + 1;
      });
      this.recalcTotalAmount();
      this.dialogMaterialShow = false;
    },
    handleDeleteDetail() {
      if (!this.detailSelection.length) {
        this.$modal.msgError("请先选择要删除的明细");
        return;
      }
      const removeSet = new Set(this.detailSelection);
      this.detailList = this.detailList
        .filter((r) => !removeSet.has(r))
        .map((r, idx) => ({ ...r, index: idx + 1 }));
      this.detailSelection = [];
      this.recalcTotalAmount();
    },
    handleDetailSelectionChange(selection) {
      this.detailSelection = selection || [];
    },
    onDetailAmountChange() {
      this.detailList.forEach((row) => {
        const qty = Number(row.qty);
        const price = Number(row.price);
        if (!Number.isNaN(qty) && !Number.isNaN(price)) {
          row.amount = (qty * price).toFixed(2);
        } else {
          row.amount = null;
        }
      });
      this.recalcTotalAmount();
    },
    recalcTotalAmount() {
      let sum = 0;
      let has = false;
      (this.detailList || []).forEach((row) => {
        const n = Number(row.amount);
        if (!Number.isNaN(n)) {
          sum += n;
          has = true;
        }
      });
      this.form.totalAmount = has ? Number(sum.toFixed(2)) : null;
    },
    getSummaries(param) {
      const { columns } = param;
      const sums = columns.map(() => "");
      let placed = false;
      columns.forEach((column, index) => {
        if (column.type === "selection") {
          sums[index] = "";
          return;
        }
        if (!placed && (column.property === "index" || column.label === "序号")) {
          sums[index] = "合计";
          placed = true;
        }
      });
      return sums;
    },
    buildSavePayload() {
      const entryList = (this.detailList || []).map((row, idx) => ({
        inventoryId: row.inventoryId || null,
        materialId: row.materialId,
        materialCode: row.materialCode,
        materialName: row.materialName,
        speci: row.speci,
        model: row.model,
        unitName: row.unit || row.unitName || "",
        qty: row.qty,
        price: row.price,
        amount: row.amount,
        batchNo: row.batchNo,
        produceDate: row.produceDate || null,
        expiryDate: row.expiryDate || null,
        manufacturer: row.manufacturer,
        lineNo: idx + 1
      }));
      return {
        id: this.form.id,
        billNo: this.form.billNo,
        warehouseId: this.form.warehouseId,
        billDate: this.form.billDate,
        totalAmount: this.form.totalAmount,
        scrapReason: this.form.scrapReason,
        remark: this.form.remark,
        entryList
      };
    },
    submitForm() {
      if (this.formReadonly) {
        return;
      }
      if (!this.form.warehouseId) {
        this.$modal.msgError("请选择仓库");
        return;
      }
      if (!this.detailList.length) {
        this.$modal.msgError("请添加报损明细");
        return;
      }
      const badQty = this.detailList.find(
        (r) => r.qty == null || r.qty === "" || Number.isNaN(Number(r.qty)) || Number(r.qty) <= 0
      );
      if (badQty) {
        this.$modal.msgError("报废数量必须大于0");
        return;
      }
      const payload = this.buildSavePayload();
      const req = this.form.id ? updateScrapBill(payload) : addScrapBill(payload);
      req.then((res) => {
        this.$modal.msgSuccess("保存成功");
        if (!this.form.id && res && res.data) {
          this.form.id = res.data.id;
          this.form.billNo = res.data.billNo || "";
          this.form.billStatus = res.data.billStatus != null ? res.data.billStatus : this.form.billStatus;
        }
        this.getList();
      });
    }
  }
};
</script>

<style scoped>
.apply-pager-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  min-height: 40px;
  padding: 4px 0;
  box-sizing: border-box;
}
.apply-pager-bar .pagination-summary {
  flex: 1 1 auto;
  min-width: 120px;
}
.apply-pager-bar .pagination-container {
  margin-top: 0 !important;
  margin-left: auto;
}

/* 弹窗打开时去掉页底留白，避免露出灰色底边 */
.app-container.scrap-audit-page.is-modal-open {
  padding-bottom: 0 !important;
}

/* 弹窗：对齐到货验收（inWarehouse/apply） */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}
.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 8px;
  box-sizing: border-box;
}
.local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #ebeef5;
  background: #ebeef5;
  min-height: 40px;
  flex: 0 0 auto;
}
.modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}
.close-btn {
  border: none;
  background: transparent;
}
.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}
.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 8px 0 8px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-content: flex-start;
  box-sizing: border-box;
}

/* 弹窗内三块区域：与到货验收同宽铺满 */
.local-modal-content .apply-modal-query-panel,
.local-modal-content .apply-modal-toolbar.list-toolbar,
.local-modal-content .apply-modal-table-panel {
  margin-left: 0;
  margin-right: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}
.local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 12px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
}
.local-modal-content .apply-modal-query-panel .el-row {
  margin-bottom: 8px;
}
.local-modal-content .apply-modal-query-panel .el-row:last-child {
  margin-bottom: 0;
}
.local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 12px;
  box-sizing: border-box;
}
.local-modal-content .apply-modal-query-panel .apply-modal-form-row > .el-col {
  width: auto !important;
  flex: 0 0 auto;
  max-width: none;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
}
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-date-editor,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--standard .el-form-item__content > * {
  width: 140px !important;
  max-width: 140px !important;
}
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--date .el-date-editor {
  width: 150px !important;
  max-width: 150px !important;
}
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-form-item__content {
  max-width: 162px;
}
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--compact .el-select,
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-input,
.local-modal-content .apply-modal-query-panel .apply-modal-field--compact .header-field-select-compact {
  width: 162px !important;
  max-width: 162px !important;
}
.local-modal-content .apply-modal-query-panel .apply-modal-field--remark .el-input {
  width: 200px !important;
  max-width: 200px !important;
}

.local-modal-content .apply-modal-table-panel {
  margin-top: 0;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}
.local-modal-content .apply-modal-toolbar {
  flex-shrink: 0;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
}
.local-modal-content .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}
.local-modal-content .apply-modal-table-panel .table-wrapper {
  margin-top: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 0;
}
.local-modal-content .apply-modal-table-panel .apply-detail-table {
  margin-bottom: 0 !important;
  box-shadow: none;
}
.local-modal-content .modal-detail-section .el-table .detail-input-compact {
  width: 98px !important;
  max-width: 98px;
}
.local-modal-content .modal-detail-section .el-table .detail-input-compact.el-date-editor.el-input {
  width: 98px !important;
}

.detail-text-cell-2line {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  line-height: 1.35;
  white-space: normal;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-zoom-enter-active,
.modal-zoom-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-zoom-enter,
.modal-zoom-leave-to {
  transform: scale(0.98);
  opacity: 0;
}
</style>

<style>
/* 非 scoped：报废弹窗对齐到货验收 inWarehouse-apply-page */
.app-container.scrap-audit-page.is-modal-open {
  padding-bottom: 0 !important;
}
.app-container.scrap-audit-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}
.app-container.scrap-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}
.app-container.scrap-audit-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* 明细表头 */
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

/* 合计行 */
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-footer-wrapper {
  background-color: #f1f5f9 !important;
  border-bottom: none !important;
  position: relative;
  z-index: 30 !important;
}
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper tr {
  height: 38px !important;
}
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td.el-table__cell {
  height: 38px !important;
  min-height: 38px !important;
  padding: 6px 0 !important;
  line-height: 24px !important;
  box-sizing: border-box !important;
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-top: 1px solid #e2e8f0 !important;
  border-bottom: none !important;
}
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell,
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .el-table tbody td.el-table__cell {
  padding: 4px 0 !important;
}
.app-container.scrap-audit-page .local-modal-content .modal-detail-section .el-table .el-input--small .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  padding: 0 6px !important;
  font-size: 13px !important;
}

/* BS-添加明细嵌套层：对齐到货验收 RK-添加明细 */
.app-container.scrap-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
  position: absolute;
  left: 0;
  right: -8px;
  top: 0;
  bottom: 0;
  width: auto;
  box-sizing: border-box;
  z-index: 3100;
}
.app-container.scrap-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #ebeef5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #ebeef5 !important;
}
.app-container.scrap-audit-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
.app-container.scrap-audit-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.app-container.scrap-audit-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}
.app-container.scrap-audit-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}
.app-container.scrap-audit-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}
</style>
