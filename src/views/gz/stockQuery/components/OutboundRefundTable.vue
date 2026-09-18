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
        <el-table-column label="单号" align="left" header-align="center" class-name="ctk-col-left" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.orderNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="仓库" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="科室" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.department && scope.row.department.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="院内码" align="left" header-align="center" class-name="ctk-col-left" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByInHospitalCode">
          <template slot-scope="scope">
            <span>{{ scope.row.inHospitalCode || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品编码" align="left" header-align="center" class-name="ctk-col-left" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode">
          <template slot-scope="scope">
            <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="产品名称" align="left" header-align="center" class-name="ctk-col-left" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName">
          <template slot-scope="scope">
            <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" align="left" header-align="center" class-name="ctk-col-left" width="130" min-width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" align="left" header-align="center" class-name="ctk-col-left" width="130" min-width="90" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" align="left" header-align="center" class-name="ctk-col-left" width="100" min-width="90" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.unitName">{{ scope.row.unitName }}</span>
            <span v-else-if="scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName">{{ scope.row.material.fdUnit.unitName }}</span>
            <span v-else-if="scope.row.material && scope.row.material.unitName">{{ scope.row.material.unitName }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" align="center" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.price != null && scope.row.price !== undefined">{{ scope.row.price | formatPrice }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="数量" align="center" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.qty != null && scope.row.qty !== undefined">{{ scope.row.qty }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" align="center" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.amt != null && scope.row.amt !== undefined">{{ scope.row.amt | formatCurrency }}</span>
            <span v-else>--</span>
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
        <el-table-column label="批号" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.batchNumber || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批次" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.batchNo || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生产厂家" align="left" header-align="center" class-name="ctk-col-left" width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证号" align="left" header-align="center" class-name="ctk-col-left" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证有效期" align="left" header-align="center" class-name="ctk-col-left" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="UDI码" align="left" header-align="center" class-name="ctk-col-left" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.udiNo && scope.row.udiNo !== scope.row.materialCode">{{ scope.row.udiNo }}</span>
            <span v-else-if="scope.row.material && scope.row.material.udiNo && scope.row.material.udiNo !== scope.row.materialCode">{{ scope.row.material.udiNo }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="单据状态" align="center" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
          </template>
        </el-table-column>
        <el-table-column label="制单人" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.createBy || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单日期" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.orderDate">{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="审核人" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.updateBy || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核日期" align="left" header-align="center" class-name="ctk-col-left" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="单据类型" align="center" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.billTypeName || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="pagination-wrapper">
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
import { listOrder as listShipment, getOrder as getShipment } from '@/api/gz/shipment';
import { listGoods as listRefundStock, getGoods as getRefundStock } from '@/api/gz/refundStock';
import { traceDepotInventory } from '@/api/gz/stockQuery';
import { matchMaterialKeyword } from '@/utils/materialSearch';

export default {
  name: 'OutboundRefundTable',
  dicts: ['biz_status'],
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
      /** 展开后的全量明细（按条码行），用于前端分页切片 */
      allDetailRows: [],
      /** 未按耗材关键词过滤前的明细缓存 */
      cachedDetailRows: []
    };
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
        if (oldVal && newVal.pageSize !== oldVal.pageSize && this.isPaginationOnlyChange(newVal, oldVal)) {
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
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByInHospitalCode(a, b) {
      return this.sortByStr(a, b, r => r.inHospitalCode || '');
    },
    sortByMaterialCode(a, b) {
      return this.sortByStr(a, b, r => r.materialCode || (r.material && r.material.code) || '');
    },
    sortByMaterialName(a, b) {
      return this.sortByStr(a, b, r => r.materialName || (r.material && r.material.name) || '');
    },
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
      return (row && row._rowKey) || '';
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
    getList() {
      this.loading = true;
      const codeKeyword = this.queryParams.inHospitalCode != null ? String(this.queryParams.inHospitalCode).trim().toLowerCase() : '';
      const shipmentParams = this.buildShipmentParams();
      const refundStockParams = this.buildRefundStockParams();

      Promise.all([
        shipmentParams
          ? listShipment(shipmentParams).catch(() => ({ rows: [], total: 0 }))
          : Promise.resolve({ rows: [], total: 0 }),
        refundStockParams
          ? listRefundStock(refundStockParams).then(response => {
              const rows = (response && response.rows) || [];
              return {
                rows: rows.filter(row => row.goodsNo && row.goodsNo.startsWith('GZTK-')),
                total: response.total
              };
            }).catch(() => ({ rows: [], total: 0 }))
          : Promise.resolve({ rows: [], total: 0 })
      ]).then(([shipmentRes, refundStockRes]) => {
        const shipmentHeaders = this.filterHeadersByDateRange((shipmentRes && shipmentRes.rows) || [], 'shipment');
        const refundStockHeaders = this.filterHeadersByDateRange((refundStockRes && refundStockRes.rows) || [], 'refundStock');
        if (shipmentHeaders.length === 0 && refundStockHeaders.length === 0) {
          this.allDetailRows = [];
          this.tableList = [];
          this.total = 0;
          this.selectedRowKeys = [];
          this.loading = false;
          return this.showTraceHintIfNeeded(codeKeyword);
        }

        const shipmentDetailPromise = this.fetchDetailsInBatch(
          shipmentHeaders.map(header => ({ header })),
          item => getShipment(item.header.id).then(res => res.data)
        );

        const refundStockDetailPromise = this.fetchDetailsInBatch(
          refundStockHeaders.map(header => ({ header })),
          item => getRefundStock(item.header.id).then(res => res.data)
        );

        return Promise.all([shipmentDetailPromise, refundStockDetailPromise]).then(([shipmentDetails, refundStockDetails]) => {
          const detailList = [];
          shipmentDetails.forEach(({ item, detail }) => {
            if (detail) {
              this.appendShipmentRows(detailList, item.header, detail, codeKeyword);
            }
          });
          refundStockDetails.forEach(({ item, detail }) => {
            if (detail) {
              this.appendRefundStockRows(detailList, item.header, detail, codeKeyword);
            }
          });

          this.cachedDetailRows = detailList.slice();
          this.applyClientFilters();
          this.loading = false;
          return this.showTraceHintIfNeeded(codeKeyword);
        });
      }).then(() => {
        this.$nextTick(() => {
          this.syncTableScroll();
          this.updateTableHeight();
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      }).catch(error => {
        this.$message.error('获取数据失败: ' + (error.message || '未知错误'));
        this.allDetailRows = [];
        this.tableList = [];
        this.total = 0;
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      });
    },
    applyClientFilters() {
      let rows = this.cachedDetailRows || [];
      rows = rows.filter(row => this.matchesDetailMaterialKeyword(row));
      rows = this.filterDetailRowsByDateRange(rows);
      this.allDetailRows = rows;
      this.selectedRowKeys = [];
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
      return newVal.materialKeyword === oldVal.materialKeyword
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
      const pageSize = Number(this.queryParams.pageSize) || 10;
      const allRows = this.allDetailRows || [];
      this.total = allRows.length;
      const maxPage = Math.max(1, Math.ceil(this.total / pageSize) || 1);
      let pageNum = Number(this.queryParams.pageNum) || 1;
      if (pageNum > maxPage) {
        pageNum = 1;
        if (Number(this.queryParams.pageNum) !== 1) {
          this.queryParams.pageNum = 1;
        }
      }
      const start = (pageNum - 1) * pageSize;
      this.tableList = allRows.slice(start, start + pageSize).map((row, idx) => {
        if (row && !row._rowKey) {
          row._rowKey = `gz-stock-${start + idx}-${row.orderNo || ''}-${row.inHospitalCode || ''}-${row.id || idx}`;
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
    shouldApplyDateFilter() {
      const filter = this.resolveOrderNoFilter();
      if (filter.raw) {
        return false;
      }
      return !!(this.queryParams.beginDate || this.queryParams.endDate);
    },
    parseRowDate(value) {
      if (value == null || value === '') {
        return null;
      }
      if (value instanceof Date) {
        return value.getTime();
      }
      const str = String(value).trim();
      if (!str) {
        return null;
      }
      const normalized = str.length === 10 ? `${str} 00:00:00` : str.replace('T', ' ').substring(0, 19);
      const ts = Date.parse(normalized.replace(/-/g, '/'));
      return Number.isNaN(ts) ? null : ts;
    },
    filterHeadersByDateRange(headers, kind) {
      if (!this.shouldApplyDateFilter() || !headers || headers.length === 0) {
        return headers || [];
      }
      return headers.filter(header => {
        let dateVal = header.auditDate;
        if (!dateVal) {
          dateVal = kind === 'shipment'
            ? (header.shipmentDate || header.orderDate)
            : (header.goodsDate || header.orderDate);
        }
        const ts = this.parseRowDate(dateVal);
        if (ts == null) {
          return false;
        }
        const beginTs = this.queryParams.beginDate
          ? this.parseRowDate(this.normalizeDateTimeValue(this.queryParams.beginDate, false))
          : null;
        const endTs = this.queryParams.endDate
          ? this.parseRowDate(this.normalizeDateTimeValue(this.queryParams.endDate, true))
          : null;
        if (beginTs != null && ts < beginTs) {
          return false;
        }
        if (endTs != null && ts > endTs) {
          return false;
        }
        return true;
      });
    },
    filterDetailRowsByDateRange(rows) {
      if (!this.shouldApplyDateFilter() || !rows || rows.length === 0) {
        return rows || [];
      }
      const beginTs = this.queryParams.beginDate
        ? this.parseRowDate(this.normalizeDateTimeValue(this.queryParams.beginDate, false))
        : null;
      const endTs = this.queryParams.endDate
        ? this.parseRowDate(this.normalizeDateTimeValue(this.queryParams.endDate, true))
        : null;
      return rows.filter(row => {
        const ts = this.parseRowDate(row.auditDate) ?? this.parseRowDate(row.orderDate);
        if (ts == null) {
          return false;
        }
        if (beginTs != null && ts < beginTs) {
          return false;
        }
        if (endTs != null && ts > endTs) {
          return false;
        }
        return true;
      });
    },
    buildShipmentParams() {
      const filter = this.resolveOrderNoFilter();
      if (!filter.fetchShipment) {
        return null;
      }
      const params = {
        pageNum: 1,
        pageSize: 500,
        warehouseId: this.queryParams.warehouseId,
        departmentId: this.queryParams.departmentId,
        shipmentStatus: this.queryParams.orderStatus,
        timeField: 'auditDate'
      };
      if (filter.raw) {
        params.shipmentNo = filter.raw;
        params.pageSize = 100;
      } else {
        params.beginDate = this.queryParams.beginDate;
        params.endDate = this.queryParams.endDate;
      }
      return this.normalizeQueryDateTime(params);
    },
    buildRefundStockParams() {
      const filter = this.resolveOrderNoFilter();
      if (!filter.fetchRefundStock) {
        return null;
      }
      const params = {
        pageNum: 1,
        pageSize: 500,
        warehouseId: this.queryParams.warehouseId,
        departmentId: this.queryParams.departmentId,
        goodsStatus: this.queryParams.orderStatus,
        timeField: 'auditDate'
      };
      if (filter.raw) {
        params.goodsNo = filter.raw.startsWith('GZTK-') ? filter.raw : `GZTK-${filter.raw}`;
        params.pageSize = 100;
      } else {
        params.beginDate = this.queryParams.beginDate;
        params.endDate = this.queryParams.endDate;
        params.goodsNo = 'GZTK-';
      }
      return this.normalizeQueryDateTime(params);
    },
    resolveOrderNoFilter() {
      const raw = this.queryParams.orderNo != null ? String(this.queryParams.orderNo).trim() : '';
      const upper = raw.toUpperCase();
      return {
        raw,
        fetchShipment: !raw || upper.startsWith('GZCK') || (!upper.startsWith('GZTH') && !upper.startsWith('GZTK') && !upper.startsWith('GZRK')),
        fetchRefundStock: !raw || upper.startsWith('GZTK')
      };
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
    fetchDetailsInBatch(items, fetchDetail, batchSize = 10) {
      if (!items || items.length === 0) {
        return Promise.resolve([]);
      }
      const batches = [];
      for (let i = 0; i < items.length; i += batchSize) {
        batches.push(items.slice(i, i + batchSize));
      }
      return Promise.all(batches.map(batch =>
        Promise.all(batch.map(item =>
          fetchDetail(item)
            .then(detail => ({ item, detail }))
            .catch(() => ({ item, detail: null }))
        ))
      )).then(allBatches => allBatches.flat());
    },
    matchesDetailMaterialKeyword(row) {
      const kw = this.queryParams.materialKeyword;
      if (kw == null || String(kw).trim() === '') {
        return true;
      }
      return matchMaterialKeyword({
        name: row.materialName || (row.material && row.material.name) || '',
        code: row.materialCode || (row.material && row.material.code) || '',
        speci: row.specification || (row.material && row.material.speci) || '',
        model: row.model || (row.material && row.material.model) || '',
        brand: row.material && row.material.brand,
        referredName: row.material && row.material.referredName,
        referred_name: row.material && row.material.referred_name
      }, kw);
    },
    matchesSupplierFilter(entry, material) {
      if (!this.queryParams.supplierId) {
        return true;
      }
      const supplierId = Number(this.queryParams.supplierId);
      if (entry && entry.supplierId != null && Number(entry.supplierId) === supplierId) {
        return true;
      }
      if (material && material.supplierId != null && Number(material.supplierId) === supplierId) {
        return true;
      }
      if (material && material.fdSupplier && material.fdSupplier.id != null && Number(material.fdSupplier.id) === supplierId) {
        return true;
      }
      return false;
    },
    appendShipmentRows(detailList, header, detail, codeKeyword) {
      const entries = (detail && (detail.gzShipmentEntryList || detail.gzOrderEntryList)) || [];
      const materialList = (detail && detail.materialList) || [];
      entries.forEach(entry => {
        if (!entry || entry.delFlag === 1) {
          return;
        }
        const material = materialList.find(m => m && m.id === entry.materialId) || null;
        if (!this.matchesSupplierFilter(entry, material)) {
          return;
        }
        const inHospitalCode = entry.inHospitalCode ? String(entry.inHospitalCode).trim() : '';
        const code = inHospitalCode ? inHospitalCode.toLowerCase() : '';
        if (codeKeyword && !code.includes(codeKeyword)) {
          return;
        }
        detailList.push(this.buildShipmentRow(header, detail, entry, material));
      });
    },
    appendRefundStockRows(detailList, header, detail, codeKeyword) {
      const entries = (detail && detail.gzRefundGoodsEntryList) || [];
      const materialList = (detail && detail.materialList) || [];
      entries.forEach(entry => {
        if (!entry || entry.delFlag === 1) {
          return;
        }
        const material = materialList.find(m => m && m.id === entry.materialId) || null;
        if (!this.matchesSupplierFilter(entry, material)) {
          return;
        }
        const inHospitalCode = entry.inHospitalCode ? String(entry.inHospitalCode).trim() : '';
        const code = inHospitalCode ? inHospitalCode.toLowerCase() : '';
        if (codeKeyword && !code.includes(codeKeyword)) {
          return;
        }
        detailList.push(this.buildRefundStockRow(header, detail, entry, material));
      });
    },
    buildShipmentRow(header, detail, entry, material) {
      const inHospitalCode = entry.inHospitalCode ? String(entry.inHospitalCode).trim() : '';
      const materialCode = (material && material.code) || '';
      const qty = entry && entry.qty;
      const price = entry && entry.price;
      const amt = entry && entry.amt != null ? entry.amt : (qty != null && price != null ? Number(qty) * Number(price) : null);

      return {
        id: entry && entry.id || null,
        billKind: 'shipment',
        billTypeName: '备货出库',
        materialId: entry && entry.materialId || null,
        price,
        qty,
        amt,
        batchNo: entry && entry.batchNo || null,
        batchNumber: entry && entry.batchNumber || null,
        beginTime: entry && entry.beginTime || null,
        endTime: entry && entry.endTime || null,
        remark: (entry && entry.remark) || (detail && detail.remark) || '',
        orderNo: (detail && detail.shipmentNo) || (header && header.shipmentNo) || '',
        orderStatus: detail && detail.shipmentStatus != null ? detail.shipmentStatus : header && header.shipmentStatus,
        auditDate: (detail && detail.auditDate) || (header && header.auditDate) || null,
        createBy: (detail && detail.createBy) || (header && header.createBy) || '',
        updateBy: (detail && detail.auditBy) || (header && header.auditBy) || (detail && detail.updateBy) || null,
        orderDate: (detail && detail.shipmentDate) || (header && header.shipmentDate) || null,
        warehouse: (detail && detail.warehouse) || (header && header.warehouse) || null,
        department: (detail && detail.department) || (header && header.department) || null,
        material,
        materialName: (material && material.name) || '',
        factoryName: (material && material.fdFactory && material.fdFactory.factoryName) || '',
        materialCode,
        specification: (material && material.speci) || null,
        model: (material && material.model) || null,
        unitName: (material && material.fdUnit && material.fdUnit.unitName)
          || (material && material.unitName)
          || null,
        udiNo: (entry && entry.masterBarcode) || (material && material.udiNo) || '',
        inHospitalCode
      };
    },
    buildRefundStockRow(header, detail, entry, material) {
      const inHospitalCode = entry.inHospitalCode ? String(entry.inHospitalCode).trim() : '';
      const materialCode = (material && material.code) || '';
      const qty = entry && entry.qty;
      const price = entry && entry.price;
      const amt = entry && entry.amt != null ? entry.amt : (qty != null && price != null ? Number(qty) * Number(price) : null);

      return {
        id: entry && entry.id || null,
        billKind: 'refundStock',
        billTypeName: '备货退库',
        materialId: entry && entry.materialId || null,
        price,
        qty,
        amt,
        batchNo: entry && entry.batchNo || null,
        batchNumber: entry && entry.batchNumber || null,
        beginTime: entry && entry.beginTime || null,
        endTime: entry && entry.endTime || null,
        remark: (entry && entry.remark) || (detail && detail.remark) || '',
        orderNo: (detail && detail.goodsNo) || (header && header.goodsNo) || '',
        orderStatus: detail && detail.goodsStatus != null ? detail.goodsStatus : header && header.goodsStatus,
        auditDate: (detail && detail.auditDate) || (header && header.auditDate) || null,
        createBy: (detail && detail.createBy) || (header && header.createBy) || '',
        updateBy: (detail && detail.auditBy) || (header && header.auditBy) || null,
        orderDate: (detail && detail.goodsDate) || (header && header.goodsDate) || null,
        warehouse: (detail && detail.warehouse) || (header && header.warehouse) || null,
        department: (detail && detail.department) || (header && header.department) || null,
        material,
        materialName: (material && material.name) || '',
        factoryName: (material && material.fdFactory && material.fdFactory.factoryName) || '',
        materialCode,
        specification: (material && material.speci) || null,
        model: (material && material.model) || null,
        unitName: (material && material.fdUnit && material.fdUnit.unitName)
          || (material && material.unitName)
          || null,
        udiNo: (material && material.udiNo) || '',
        inHospitalCode
      };
    },
    showTraceHintIfNeeded(codeKeyword) {
      if (!codeKeyword || this.allDetailRows.length > 0) {
        return Promise.resolve();
      }
      return traceDepotInventory(this.queryParams.inHospitalCode).then(res => {
        const result = (res && res.data) || {};
        const traces = result.traces || [];
        if (!traces.length) {
          return;
        }
        const lines = traces.map(t => {
          const time = t.flowTime ? String(t.flowTime).replace('T', ' ').substring(0, 19) : '';
          const status = t.remark ? `（${t.remark}）` : '';
          return `${time} ${t.traceKind || ''} ${t.billNo || ''} ${t.originBusinessType || ''} 数量:${t.qty != null ? t.qty : ''}${status}`;
        }).join('\n');
        this.$notify({
          title: '该院内码库存变动追溯',
          message: `出/退库表未匹配到明细，但系统存在以下记录：\n${lines}`,
          type: 'warning',
          duration: 12000
        });
      }).catch(() => {});
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.selectedRowKeys = (selection || []).map(row => this.getRowKey(row));
      this.$emit('selection-change', selection);
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

      const syncBodyToHeader = () => {
        syncScroll(bodyWrapper, headerWrapper);
      };

      const syncHeaderToBody = () => {
        syncScroll(headerWrapper, bodyWrapper);
      };

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
