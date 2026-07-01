<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="tableList" @selection-change="handleSelectionChange" border height="54vh">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="单据类型" align="center" width="100" show-overflow-tooltip resizable fixed="left">
        <template slot-scope="scope">
          <span>{{ scope.row.billTypeName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.orderNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.department && scope.row.department.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="院内码" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.inHospitalCode || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材名称" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="规格" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="型号" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitName">{{ scope.row.unitName }}</span>
          <span v-else-if="scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName">{{ scope.row.material.fdUnit.unitName }}</span>
          <span v-else-if="scope.row.material && scope.row.material.unitName">{{ scope.row.material.unitName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price != null && scope.row.price !== undefined">{{ parseFloat(scope.row.price).toFixed(2) }}</span>
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
          <span v-if="scope.row.amt != null && scope.row.amt !== undefined">{{ parseFloat(scope.row.amt).toFixed(2) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="生产日期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批号" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="批次" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchNumber || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证有效期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="UDI码" align="center" width="180" show-overflow-tooltip resizable>
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
      <el-table-column label="制单人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.orderDate">{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.updateBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
  </div>
</template>

<script>
import { listOrder as listShipment, getOrder as getShipment } from "@/api/gz/shipment";
import { listGoods as listRefundStock, getGoods as getRefundStock } from "@/api/gz/refundStock";

export default {
  name: "OutboundRefundTable",
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
      ids: []
    };
  },
  watch: {
    queryParams: {
      handler() {
        this.getList();
      },
      deep: true
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    this.$nextTick(() => {
      this.syncTableScroll();
    });
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
    if (this._headerScrollbarCleanup) {
      this._headerScrollbarCleanup();
    }
  },
  methods: {
    buildListParams(extra = {}) {
      const params = {
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        warehouseId: this.queryParams.warehouseId,
        departmentId: this.queryParams.departmentId,
        orderStatus: this.queryParams.orderStatus,
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate,
        ...extra
      };
      const orderNo = this.queryParams.orderNo != null ? String(this.queryParams.orderNo).trim() : '';
      if (orderNo) {
        params.orderNo = orderNo;
      }
      if (this.queryParams.supplierId) {
        params.supplerId = this.queryParams.supplierId;
      }
      return params;
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
      params.timeField = params.timeField || 'createTime';
      params.beginDate = this.normalizeDateTimeValue(params.beginDate, false);
      params.endDate = this.normalizeDateTimeValue(params.endDate, true);
      return params;
    },
    resolveOrderNoFilter() {
      const orderNo = this.queryParams.orderNo != null ? String(this.queryParams.orderNo).trim().toUpperCase() : '';
      return {
        raw: this.queryParams.orderNo != null ? String(this.queryParams.orderNo).trim() : '',
        fetchShipment: !orderNo || orderNo.startsWith('GZCK'),
        fetchRefundStock: !orderNo || orderNo.startsWith('GZTK')
      };
    },
    buildShipmentParams() {
      const filter = this.resolveOrderNoFilter();
      if (!filter.fetchShipment) {
        return null;
      }
      return this.buildListParams();
    },
    buildRefundStockParams() {
      const filter = this.resolveOrderNoFilter();
      if (!filter.fetchRefundStock) {
        return null;
      }
      const params = this.normalizeQueryDateTime({
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize,
        warehouseId: this.queryParams.warehouseId,
        departmentId: this.queryParams.departmentId,
        goodsStatus: this.queryParams.orderStatus,
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate
      });
      if (filter.raw) {
        params.goodsNo = filter.raw.startsWith('GZTK-') ? filter.raw : `GZTK-${filter.raw}`;
      } else {
        params.goodsNo = 'GZTK-';
      }
      return params;
    },
    resolveCreateBy(detail, header) {
      if (detail && detail.creater) {
        return detail.creater.nickName || detail.creater.userName || detail.createBy || '';
      }
      return (detail && detail.createBy) || (header && header.createBy) || '';
    },
    resolveUpdateBy(detail, header) {
      if (detail && detail.auditor) {
        return detail.auditor.nickName || detail.auditor.userName || detail.updateBy || '';
      }
      return (detail && detail.updateBy) || (header && header.updateBy) || '';
    },
    extractEntryInHospitalCode(entry) {
      if (!entry) {
        return '';
      }
      const raw = entry.inHospitalCode || entry.in_hospital_code || entry.masterBarcode;
      return raw ? String(raw).trim() : '';
    },
    buildDetailRow(header, detail, entry, material, billKind) {
      const inHospitalCode = this.extractEntryInHospitalCode(entry);
      const materialCode = (material && material.code) || '';
      const materialUdiNo = (entry && entry.udiNo) || (material && material.udiNo) || (entry && entry.masterBarcode) || '';
      const qty = entry && entry.qty;
      const price = entry && entry.price;
      const amt = entry && entry.amt != null ? entry.amt : (qty != null && price != null ? Number(qty) * Number(price) : null);
      const billTypeName = billKind === 'shipment' ? '备货出库' : '备货退库';
      let orderNo = '';
      let orderStatus = null;
      let orderDate = null;
      if (billKind === 'shipment') {
        orderNo = ((detail && (detail.shipmentNo || detail.orderNo)) || (header && (header.shipmentNo || header.orderNo)) || '');
        orderStatus = detail && detail.shipmentStatus != null ? detail.shipmentStatus : header && header.shipmentStatus;
        orderDate = (detail && (detail.shipmentDate || detail.orderDate)) || (header && (header.shipmentDate || header.orderDate));
      } else {
        orderNo = ((detail && detail.goodsNo) || (header && header.goodsNo) || '');
        orderStatus = detail && detail.goodsStatus != null ? detail.goodsStatus : header && header.goodsStatus;
        orderDate = (detail && detail.goodsDate) || (header && header.goodsDate);
      }

      return {
        id: entry && entry.id || null,
        billKind,
        billTypeName,
        materialId: entry && entry.materialId || null,
        price,
        qty,
        amt,
        batchNo: entry && entry.batchNo || null,
        batchNumber: entry && entry.batchNumber || null,
        beginTime: entry && entry.beginTime || null,
        endTime: entry && entry.endTime || null,
        remark: (entry && entry.remark) || (detail && detail.remark) || '',
        orderNo,
        orderStatus,
        auditDate: (detail && detail.auditDate) || (header && header.auditDate) || null,
        createBy: this.resolveCreateBy(detail, header),
        updateBy: (detail && detail.auditBy) || this.resolveUpdateBy(detail, header),
        orderDate,
        warehouse: (detail && detail.warehouse) || (header && header.warehouse) || null,
        department: (detail && detail.department) || (header && header.department) || null,
        supplier: (detail && detail.supplier) || (header && header.supplier) || null,
        header,
        material,
        materialName: (entry && entry.materialName) || (material && material.name) || '',
        factoryName: (entry && entry.factoryName) || (material && material.fdFactory && material.fdFactory.factoryName) || '',
        materialCode,
        specification: (entry && entry.speci) || (material && material.speci) || null,
        model: (entry && entry.model) || (material && material.model) || null,
        unitName: (material && material.fdUnit && material.fdUnit.unitName)
          || (material && material.unitName)
          || null,
        udiNo: materialUdiNo,
        inHospitalCode
      };
    },
    matchSupplierFilter(row) {
      if (!this.queryParams.supplierId) {
        return true;
      }
      const supplierId = this.queryParams.supplierId;
      if (row.supplier && row.supplier.id === supplierId) {
        return true;
      }
      if (row.material && row.material.supplierId === supplierId) {
        return true;
      }
      if (row.header && row.header.supplerId === supplierId) {
        return true;
      }
      return false;
    },
    appendShipmentRows(detailList, header, detail) {
      const entries = (detail && detail.gzShipmentEntryList) || [];
      const materialList = (detail && detail.materialList) || [];
      entries.forEach(entry => {
        if (!entry || entry.delFlag === 1) {
          return;
        }
        if (this.queryParams.materialId && entry.materialId !== this.queryParams.materialId) {
          return;
        }
        const material = materialList.find(m => m && m.id === entry.materialId) || null;
        const row = this.buildDetailRow(header, detail, entry, material, 'shipment');
        const codeKeyword = this.queryParams.inHospitalCode != null ? String(this.queryParams.inHospitalCode).trim().toLowerCase() : '';
        const code = row.inHospitalCode ? row.inHospitalCode.toLowerCase() : '';
        if (codeKeyword && !code.includes(codeKeyword)) {
          return;
        }
        if (!this.matchSupplierFilter(row)) {
          return;
        }
        detailList.push(row);
      });
    },
    appendRefundStockRows(detailList, header, detail) {
      const entries = (detail && detail.gzRefundGoodsEntryList) || [];
      const materialList = (detail && detail.materialList) || [];
      entries.forEach(entry => {
        if (!entry || entry.delFlag === 1) {
          return;
        }
        if (this.queryParams.materialId && entry.materialId !== this.queryParams.materialId) {
          return;
        }
        const material = materialList.find(m => m && m.id === entry.materialId) || null;
        const row = this.buildDetailRow(header, detail, entry, material, 'refundStock');
        const codeKeyword = this.queryParams.inHospitalCode != null ? String(this.queryParams.inHospitalCode).trim().toLowerCase() : '';
        const code = row.inHospitalCode ? row.inHospitalCode.toLowerCase() : '';
        if (codeKeyword && !code.includes(codeKeyword)) {
          return;
        }
        if (!this.matchSupplierFilter(row)) {
          return;
        }
        detailList.push(row);
      });
    },
    fetchDetailsInBatch(items, fetchDetail, batchSize = 10) {
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
    getList() {
      this.loading = true;
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
        const shipmentHeaders = (shipmentRes && shipmentRes.rows) || [];
        const refundStockHeaders = (refundStockRes && refundStockRes.rows) || [];
        if (shipmentHeaders.length === 0 && refundStockHeaders.length === 0) {
          this.tableList = [];
          this.total = 0;
          this.loading = false;
          return;
        }

        const shipmentItems = shipmentHeaders.map(header => ({ kind: 'shipment', header }));
        const refundStockItems = refundStockHeaders.map(header => ({ kind: 'refundStock', header }));

        return Promise.all([
          this.fetchDetailsInBatch(
            shipmentItems,
            item => getShipment(item.header.id).then(res => res.data)
          ),
          this.fetchDetailsInBatch(
            refundStockItems,
            item => getRefundStock(item.header.id).then(res => res.data)
          )
        ]).then(([shipmentDetails, refundStockDetails]) => {
          const detailList = [];
          shipmentDetails.forEach(({ item, detail }) => {
            if (detail) {
              this.appendShipmentRows(detailList, item.header, detail);
            }
          });
          refundStockDetails.forEach(({ item, detail }) => {
            if (detail) {
              this.appendRefundStockRows(detailList, item.header, detail);
            }
          });
          this.tableList = detailList;
          this.total = detailList.length;
          this.loading = false;
          this.$nextTick(() => {
            this.syncTableScroll();
            if (this.$refs.table) {
              this.$refs.table.doLayout();
            }
          });
        });
      }).catch(error => {
        this.$message.error('获取出库明细失败: ' + (error.message || '未知错误'));
        this.tableList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
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
.table-container {
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  min-width: 0;
  position: relative;
}
</style>
