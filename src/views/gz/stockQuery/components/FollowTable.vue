<template>
  <div class="gz-stock-table-panel">
    <div class="table-container" ref="tablePanel">
      <el-table
        ref="table"
        class="gz-stock-main-table"
        v-loading="loading"
        :data="tableList"
        :height="tableHeight"
        :row-key="getRowKey"
        :row-class-name="gzStockRowClassName"
        border
        stripe
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblclick"
      >
        <el-table-column type="selection" width="48" align="center" header-align="center" class-name="col-serial-center" />
        <el-table-column label="序号" align="center" header-align="center" width="80" class-name="col-serial-center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单号" align="left" header-align="center" class-name="ctk-col-left" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.orderNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="院内码" align="left" header-align="center" class-name="ctk-col-left" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByInHospitalCode">
          <template slot-scope="scope">
            <span>{{ scope.row.inHospitalCode || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" width="145" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode">
          <template slot-scope="scope">
            <span>{{ scope.row.materialCode || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" width="185" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName">
          <template slot-scope="scope">
            <span>{{ scope.row.materialName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.specification || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.model || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.unitName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.qty != null && scope.row.qty !== undefined">{{ scope.row.qty }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.batchNumber || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生产日期" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证号" align="left" header-align="center" class-name="ctk-col-left" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.registerNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="财务分类" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.financeCategoryName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库房分类" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.warehouseCategoryName || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额:
        {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额:
        {{ pageTotalAmtFormatted }}
      </div>
      <div class="pagination-container" v-show="total > 0">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          :pager-count="7"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import { listOrder, getOrder, listOrderInhospitalcode } from "@/api/gz/order";
import { listDepotInventory } from "@/api/gz/depotInventory";
import { matchMaterialKeyword } from "@/utils/materialSearch";

export default {
  name: "FollowTable",
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      tableList: [],
      total: 0,
      ids: [],
      selectedRowKeys: [],
      tableHeight: 400,
      allDetailRows: [],
      cachedDetailRows: []
    };
  },
  computed: {
    totalInfo() {
      const rows = this.allDetailRows || [];
      let totalQty = 0;
      let totalAmt = 0;
      rows.forEach(r => {
        totalQty += Number(r && r.qty != null ? r.qty : 0) || 0;
        totalAmt += Number(r && r.amt != null ? r.amt : 0) || 0;
      });
      return { totalQty, totalAmt };
    },
    pageTotalQty() {
      return (this.tableList || []).reduce((s, r) => s + (Number(r && r.qty != null ? r.qty : 0) || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.tableList || []).reduce((s, r) => s + (Number(r && r.amt != null ? r.amt : 0) || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(amt);
    }
  },
  watch: {
    'queryParams.materialKeyword'() {
      if (this.cachedDetailRows.length > 0) {
        this.applyClientFilters();
      }
    },
    queryParams: {
      handler(newVal, oldVal) {
        if (oldVal && newVal.materialKeyword !== oldVal.materialKeyword && this.isMaterialKeywordOnlyChange(newVal, oldVal)) {
          return;
        }
        if (oldVal && newVal.pageNum !== oldVal.pageNum && this.isPaginationOnlyChange(newVal, oldVal)) {
          this.applyDetailPagination();
          return;
        }
        this.getList();
      },
      deep: true,
      immediate: false
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    this.$nextTick(() => {
      this.syncTableScroll();
      this.updateTableHeight();
      setTimeout(() => this.updateTableHeight(), 80);
    });
    window.addEventListener('resize', this.updateTableHeight);
  },
  updated() {
    this.$nextTick(() => {
      this.syncTableScroll();
      if (this.$refs.table) {
        this.$refs.table.doLayout();
      }
    });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateTableHeight);
    if (this._headerScrollbarCleanup) {
      this._headerScrollbarCleanup();
    }
  },
  methods: {
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        const h = Math.floor(panel.clientHeight);
        if (h > 120) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.table && this.$refs.table.doLayout) {
              this.$refs.table.doLayout();
            }
          });
        }
      });
    },
    getRowKey(row) {
      if (row && row._rowKey) {
        return row._rowKey;
      }
      if (!row) {
        return '';
      }
      return `${row.id || ''}-${row.orderNo || ''}-${row.inHospitalCode || ''}`;
    },
    gzStockRowClassName({ row }) {
      const key = this.getRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'gz-stock-row-selected';
      }
      return '';
    },
    handleRowDblclick(row) {
      const table = this.$refs.table;
      if (!table || !row) return;
      const key = this.getRowKey(row);
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || [];
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getRowKey(r) === key)
      ));
      table.toggleRowSelection(row, !selected);
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
    },
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByInHospitalCode(a, b) {
      return this.sortByStr(a, b, r => r.inHospitalCode || '');
    },
    sortByMaterialCode(a, b) {
      return this.sortByStr(a, b, r => r.materialCode || '');
    },
    sortByMaterialName(a, b) {
      return this.sortByStr(a, b, r => r.materialName || '');
    },
    syncTableScroll() {
      const headerWrapper = this.$el?.querySelector('.el-table__header-wrapper');
      const bodyWrapper = this.$el?.querySelector('.el-table__body-wrapper');
      if (!headerWrapper || !bodyWrapper) {
        return;
      }
      const syncScroll = (source, target) => {
        if (source.scrollLeft !== target.scrollLeft) {
          target.scrollLeft = source.scrollLeft;
        }
      };
      const syncBodyToHeader = () => syncScroll(bodyWrapper, headerWrapper);
      const syncHeaderToBody = () => syncScroll(headerWrapper, bodyWrapper);
      if (this._syncBodyToHeader) {
        bodyWrapper.removeEventListener('scroll', this._syncBodyToHeader);
      }
      if (this._syncHeaderToBody) {
        headerWrapper.removeEventListener('scroll', this._syncHeaderToBody);
      }
      this._syncBodyToHeader = syncBodyToHeader;
      this._syncHeaderToBody = syncHeaderToBody;
      bodyWrapper.addEventListener('scroll', syncBodyToHeader, { passive: true });
      headerWrapper.addEventListener('scroll', syncHeaderToBody, { passive: true });
      this._headerScrollbarCleanup = () => {
        if (this._syncBodyToHeader) {
          bodyWrapper?.removeEventListener('scroll', this._syncBodyToHeader);
        }
        if (this._syncHeaderToBody) {
          headerWrapper?.removeEventListener('scroll', this._syncHeaderToBody);
        }
      };
    },
    getList() {
      this.loading = true;
      const codeKeyword = this.queryParams.inHospitalCode != null ? String(this.queryParams.inHospitalCode).trim().toLowerCase() : '';
      const listParams = this.buildFollowListParams();

      listOrder(listParams)
        .then(response => {
          const headers = (response && response.rows) || [];
          if (headers.length === 0) {
            this.cachedDetailRows = [];
            this.allDetailRows = [];
            this.tableList = [];
            this.total = 0;
            this.selectedRowKeys = [];
            this.loading = false;
            this.$nextTick(() => this.updateTableHeight());
            return;
          }

          const batchSize = 10;
          const batches = [];
          for (let i = 0; i < headers.length; i += batchSize) {
            batches.push(headers.slice(i, i + batchSize));
          }

          return Promise.all(batches.map(batch =>
            Promise.all(batch.map(order =>
              getOrder(order.id)
                .then(detailRes => ({ order, detail: detailRes.data }))
                .catch(() => ({ order, detail: null }))
            ))
          )).then(allBatches => {
            const orderDetails = allBatches.flat();
            return Promise.all(orderDetails.map(({ order, detail }) => {
              if (!detail) {
                return Promise.resolve({ order, detail: null, codeList: [], inventoryList: [] });
              }
              const codePromise = listOrderInhospitalcode(order.id)
                .then(codeRes => (codeRes && codeRes.data) || [])
                .catch(() => []);
              const invPromise = listDepotInventory({
                orderId: order.id,
                orderNo: detail.orderNo || order.orderNo,
                includeZeroQty: true,
                pageNum: 1,
                pageSize: 10000
              })
                .then(res => (res && res.rows) || [])
                .catch(() => []);
              return Promise.all([codePromise, invPromise]).then(([codeList, inventoryList]) => ({
                order,
                detail,
                codeList,
                inventoryList
              }));
            }));
          }).then(enriched => {
            const detailList = [];
            enriched.forEach(({ order, detail, codeList, inventoryList }) => {
              this.appendFollowRows(detailList, order, detail, codeList, inventoryList, codeKeyword);
            });
            this.cachedDetailRows = detailList.slice();
            this.selectedRowKeys = [];
            this.applyClientFilters();
            this.loading = false;
            this.$nextTick(() => {
              this.syncTableScroll();
              this.updateTableHeight();
              if (this.$refs.table) {
                this.$refs.table.doLayout();
              }
            });
          });
        })
        .catch(error => {
          this.$message.error('获取跟台明细失败: ' + (error.message || '未知错误'));
          this.cachedDetailRows = [];
          this.allDetailRows = [];
          this.tableList = [];
          this.total = 0;
          this.selectedRowKeys = [];
          this.loading = false;
          this.$nextTick(() => this.updateTableHeight());
        });
    },
    buildFollowListParams() {
      const params = {
        pageNum: 1,
        pageSize: 500,
        warehouseId: this.queryParams.warehouseId,
        departmentId: this.queryParams.departmentId,
        orderStatus: this.queryParams.orderStatus,
        orderType: 401,
        timeField: 'auditDate',
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate
      };
      let orderNo = this.queryParams.orderNo != null ? String(this.queryParams.orderNo).trim() : '';
      if (orderNo) {
        if (!orderNo.toUpperCase().startsWith('GT')) {
          orderNo = 'GT' + orderNo;
        }
        params.orderNo = orderNo;
        params.pageSize = 100;
      }
      if (this.queryParams.supplierId) {
        params.supplerId = this.queryParams.supplierId;
      }
      return this.normalizeQueryDateTime(params);
    },
    normalizeDateTimeValue(value, isEnd) {
      if (!value) {
        return value;
      }
      if (typeof value !== 'string') {
        return value;
      }
      const trimVal = value.trim();
      if (!trimVal) {
        return trimVal;
      }
      if (trimVal.length === 10 && trimVal.indexOf(' ') === -1) {
        return `${trimVal} ${isEnd ? '23:59:59' : '00:00:00'}`;
      }
      return trimVal;
    },
    normalizeQueryDateTime(query) {
      const params = { ...query };
      params.timeField = params.timeField || 'auditDate';
      if (params.beginDate != null && params.beginDate !== '') {
        params.beginDate = this.normalizeDateTimeValue(params.beginDate, false);
      } else {
        delete params.beginDate;
      }
      if (params.endDate != null && params.endDate !== '') {
        params.endDate = this.normalizeDateTimeValue(params.endDate, true);
      } else {
        delete params.endDate;
      }
      return params;
    },
    applyClientFilters() {
      let rows = this.cachedDetailRows || [];
      rows = rows.filter(row => this.matchesDetailMaterialKeyword(row));
      this.allDetailRows = rows;
      if (Number(this.queryParams.pageNum) !== 1) {
        this.queryParams.pageNum = 1;
      }
      this.applyDetailPagination();
    },
    isMaterialKeywordOnlyChange(newVal, oldVal) {
      if (!oldVal || !newVal) {
        return false;
      }
      return newVal.pageNum === oldVal.pageNum
        && newVal.pageSize === oldVal.pageSize
        && newVal.warehouseId === oldVal.warehouseId
        && newVal.supplierId === oldVal.supplierId
        && newVal.departmentId === oldVal.departmentId
        && newVal.inHospitalCode === oldVal.inHospitalCode
        && newVal.orderNo === oldVal.orderNo
        && newVal.orderStatus === oldVal.orderStatus
        && newVal.beginDate === oldVal.beginDate
        && newVal.endDate === oldVal.endDate;
    },
    isPaginationOnlyChange(newVal, oldVal) {
      if (!oldVal || !newVal) {
        return false;
      }
      return newVal.pageSize === oldVal.pageSize
        && newVal.materialKeyword === oldVal.materialKeyword
        && newVal.warehouseId === oldVal.warehouseId
        && newVal.supplierId === oldVal.supplierId
        && newVal.departmentId === oldVal.departmentId
        && newVal.inHospitalCode === oldVal.inHospitalCode
        && newVal.orderNo === oldVal.orderNo
        && newVal.orderStatus === oldVal.orderStatus
        && newVal.beginDate === oldVal.beginDate
        && newVal.endDate === oldVal.endDate;
    },
    applyDetailPagination() {
      const pageNum = Number(this.queryParams.pageNum) || 1;
      const pageSize = Number(this.queryParams.pageSize) || 10;
      const allRows = this.allDetailRows || [];
      this.total = allRows.length;
      const start = (pageNum - 1) * pageSize;
      this.tableList = allRows.slice(start, start + pageSize).map((row, idx) => {
        if (row && !row._rowKey) {
          row._rowKey = `gz-stock-follow-${start + idx}-${row.id || ''}-${row.orderNo || ''}-${row.inHospitalCode || ''}`;
        }
        return row;
      });
      this.$nextTick(() => {
        this.updateTableHeight();
        if (this.$refs.table) {
          this.$refs.table.doLayout();
        }
      });
    },
    matchesDetailMaterialKeyword(row) {
      const kw = this.queryParams.materialKeyword;
      if (kw == null || String(kw).trim() === '') {
        return true;
      }
      return matchMaterialKeyword({
        name: row.materialName || '',
        code: row.materialCode || '',
        speci: row.specification || '',
        model: row.model || '',
        brand: row.material && row.material.brand,
        referredName: row.material && row.material.referredName,
        referred_name: row.material && row.material.referred_name
      }, kw);
    },
    appendFollowRows(detailList, order, detail, codeList, inventoryList, codeKeyword) {
      if (!detail || !detail.gzOrderEntryList || detail.gzOrderEntryList.length === 0) {
        return;
      }
      const materialList = detail.materialList || [];
      const codeItemsByDetailId = {};
      const codeItemsByMaterialBatch = {};
      const inventoryByOrderEntryId = {};
      const inventoryByMaterialBatch = {};

      (codeList || []).forEach(codeRow => {
        const hospitalCode = this.extractInHospitalCode(codeRow);
        if (!hospitalCode) {
          return;
        }
        const item = { hospitalCode, codeRow };
        if (codeRow.detailId != null) {
          const detailKey = String(codeRow.detailId);
          if (!codeItemsByDetailId[detailKey]) {
            codeItemsByDetailId[detailKey] = [];
          }
          codeItemsByDetailId[detailKey].push(item);
        }
        const materialId = codeRow.materialId || codeRow.material_id;
        const batchNo = codeRow.batchNo || codeRow.batch_no || codeRow.batchNumber || codeRow.batch_number;
        if (materialId && batchNo) {
          const batchKey = `${materialId}_${batchNo}`;
          if (!codeItemsByMaterialBatch[batchKey]) {
            codeItemsByMaterialBatch[batchKey] = [];
          }
          if (!codeItemsByMaterialBatch[batchKey].some(x => x.hospitalCode === hospitalCode)) {
            codeItemsByMaterialBatch[batchKey].push(item);
          }
        }
      });

      (inventoryList || []).forEach(inv => {
        const hospitalCode = inv && inv.inHospitalCode ? String(inv.inHospitalCode).trim() : '';
        if (!hospitalCode) {
          return;
        }
        if (inv.orderEntryId != null) {
          const entryKey = String(inv.orderEntryId);
          if (!inventoryByOrderEntryId[entryKey]) {
            inventoryByOrderEntryId[entryKey] = [];
          }
          inventoryByOrderEntryId[entryKey].push(hospitalCode);
        }
        if (inv.materialId && inv.batchNo) {
          const batchKey = `${inv.materialId}_${inv.batchNo}`;
          if (!inventoryByMaterialBatch[batchKey]) {
            inventoryByMaterialBatch[batchKey] = [];
          }
          if (inventoryByMaterialBatch[batchKey].indexOf(hospitalCode) === -1) {
            inventoryByMaterialBatch[batchKey].push(hospitalCode);
          }
        }
      });

      const collectCodesForEntry = (entry) => {
        const seen = new Set();
        const items = [];
        const pushItem = (item) => {
          if (!item || !item.hospitalCode || seen.has(item.hospitalCode)) {
            return;
          }
          seen.add(item.hospitalCode);
          items.push(item);
        };
        if (entry.id != null) {
          const detailKey = String(entry.id);
          (codeItemsByDetailId[detailKey] || []).forEach(pushItem);
          if (items.length === 0) {
            (inventoryByOrderEntryId[detailKey] || []).forEach(code =>
              pushItem({ hospitalCode: code, codeRow: null })
            );
          }
        }
        if (items.length === 0 && entry.materialId && entry.batchNo) {
          const batchKey = `${entry.materialId}_${entry.batchNo}`;
          (codeItemsByMaterialBatch[batchKey] || []).forEach(pushItem);
          if (items.length === 0) {
            (inventoryByMaterialBatch[batchKey] || []).forEach(code =>
              pushItem({ hospitalCode: code, codeRow: null })
            );
          }
        }
        return items;
      };

      detail.gzOrderEntryList.forEach(entry => {
        if (!entry || entry.delFlag === 1) {
          return;
        }
        const material = materialList.find(m => m && m.id === entry.materialId) || entry.material || null;
        const codeItems = collectCodesForEntry(entry);

        if (codeItems.length > 0) {
          codeItems.forEach(({ hospitalCode, codeRow }) => {
            const code = hospitalCode.toLowerCase();
            if (codeKeyword && !code.includes(codeKeyword)) {
              return;
            }
            detailList.push(this.buildRowData(order, detail, entry, material, hospitalCode, {
              perCode: true,
              codeRow
            }));
          });
          return;
        }

        let inHospitalCode = entry.inHospitalCode ? String(entry.inHospitalCode).trim() : '';
        const code = inHospitalCode ? inHospitalCode.toLowerCase() : '';
        if (codeKeyword && !code.includes(codeKeyword)) {
          return;
        }
        detailList.push(this.buildRowData(order, detail, entry, material, inHospitalCode));
      });
    },
    extractInHospitalCode(codeRow) {
      if (!codeRow) {
        return '';
      }
      const raw = codeRow.inHospitalCode || codeRow.in_hospital_code;
      return raw ? String(raw).trim() : '';
    },
    buildRowData(order, detail, entry, material, inHospitalCode, options = {}) {
      const perCode = options.perCode === true;
      const codeRow = options.codeRow || null;
      const materialCode = (material && material.code) || (entry && entry.materialCode) || '';
      const materialName = (codeRow && codeRow.materialName) || (entry && entry.materialName) || (material && material.name) || '';
      const price = codeRow && codeRow.price != null ? codeRow.price : (entry && entry.price);
      const qty = perCode ? 1 : (entry && entry.qty);
      const amt = perCode && price != null
        ? Number(price)
        : (entry && entry.amt != null ? entry.amt : (qty != null && price != null ? Number(qty) * Number(price) : null));
      return {
        id: (entry && entry.id) || (codeRow && codeRow.id) || null,
        orderNo: (detail && detail.orderNo) || (order && order.orderNo) || '',
        inHospitalCode: inHospitalCode || '',
        materialCode,
        materialName,
        specification: (entry && entry.speci) || (material && material.speci) || (codeRow && codeRow.materialSpeci) || '',
        model: (entry && entry.model) || (material && material.model) || (codeRow && codeRow.materialModel) || '',
        unitName: (entry && entry.unitName)
          || (material && material.fdUnit && material.fdUnit.unitName)
          || (material && material.unitName)
          || (codeRow && codeRow.materialUnitName)
          || '',
        price,
        qty,
        amt,
        batchNumber: (codeRow && codeRow.batchNumber) || (entry && entry.batchNumber) || '',
        beginTime: (entry && entry.beginTime) || null,
        endTime: (codeRow && codeRow.endDate) || (entry && entry.endTime) || null,
        registerNo: (material && material.registerNo) || '',
        financeCategoryName: (material && material.fdFinanceCategory && material.fdFinanceCategory.financeCategoryName) || '',
        warehouseCategoryName: (material && material.fdWarehouseCategory && material.fdWarehouseCategory.warehouseCategoryName) || '',
        material
      };
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.selectedRowKeys = (selection || []).map(row => this.getRowKey(row));
      this.$emit('selection-change', selection);
    }
  }
};
</script>

<style scoped>
.gz-stock-table-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  overflow: hidden;
  width: 100%;
}

.table-container {
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  min-height: 0;
  position: relative;
  flex: 1 1 auto;
}

.table-container ::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 4px 6px !important;
}
.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 6px !important;
}
.table-container ::v-deep .el-table thead th.el-table__cell > .cell,
.table-container ::v-deep .el-table tbody td.el-table__cell > .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 23px;
  word-break: normal;
}
.table-container ::v-deep .el-table th.ctk-col-left .cell,
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
}
</style>
