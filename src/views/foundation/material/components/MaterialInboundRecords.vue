<template>
  <div class="material-inbound-wrap">
    <el-row :gutter="12">
      <el-col :span="7">
        <div class="left-panel">
          <div class="panel-title-row">
            <span class="panel-title">供应商</span>
            <el-button size="mini" type="text" @click="exportSuppliers">导出</el-button>
          </div>
          <el-tree
            :data="supplierTree"
            node-key="id"
            :expand-on-click-node="false"
            default-expand-all
            @node-click="onSupplierNodeClick"
          >
            <span slot-scope="{ data }" class="custom-tree-node">
              <span>{{ data.label }}</span>
            </span>
          </el-tree>
        </div>
      </el-col>
      <el-col :span="17">
        <div class="right-panel">
          <div class="panel-title-row">
            <span class="panel-title">入库记录</span>
            <el-select v-model="orderMode" size="mini" style="width: 260px" @change="loadRecords">
              <el-option label="按审核时间降序" value="AUDIT_DESC" />
              <el-option label="按审核时间升序" value="AUDIT_ASC" />
              <el-option label="按供应商编码+审核时间升序" value="SUPPLIER_AUDIT_ASC" />
              <el-option label="按供应商编码+审核时间降序" value="SUPPLIER_AUDIT_DESC" />
            </el-select>
          </div>
          <div class="filter-row">
            <SelectWarehouse
              v-model="filters.warehouseId"
              placeholder="仓库"
            />
            <el-date-picker
              v-model="filters.auditBeginTime"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              format="yyyy-MM-dd HH:mm:ss"
              placeholder="审核起始时间"
              clearable
            />
            <el-date-picker
              v-model="filters.auditEndTime"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              format="yyyy-MM-dd HH:mm:ss"
              placeholder="审核截止时间"
              clearable
            />
            <el-button size="mini" type="primary" @click="handleQuery">查询</el-button>
            <el-button size="mini" @click="handleReset">重置</el-button>
          </div>
          <el-table :data="records" border size="mini" max-height="360" v-loading="loading">
            <el-table-column label="入库单号" prop="billNo" min-width="130">
              <template slot-scope="scope">
                <el-link type="primary" @click="openBill(scope.row.billId)">{{ scope.row.billNo }}</el-link>
              </template>
            </el-table-column>
            <el-table-column label="仓库编码" prop="warehouseCode" min-width="100" />
            <el-table-column label="仓库名称" prop="warehouseName" min-width="120" show-overflow-tooltip />
            <el-table-column label="供应商编码" prop="supplierCode" min-width="100" />
            <el-table-column label="供应商名称" prop="supplierName" min-width="140" show-overflow-tooltip />
            <el-table-column label="制单人" prop="creator" min-width="90" />
            <el-table-column label="制单时间" prop="createTime" min-width="150" />
            <el-table-column label="审核人" prop="auditor" min-width="90" />
            <el-table-column label="审核时间" prop="auditTime" min-width="150" />
            <el-table-column label="数量" prop="qty" min-width="90" align="right" />
            <el-table-column label="单价" prop="unitPrice" min-width="90" align="right" />
            <el-table-column label="金额" prop="amt" min-width="90" align="right" />
            <el-table-column label="批号" prop="batchNumber" min-width="110" show-overflow-tooltip />
            <el-table-column label="有效期" prop="endTime" min-width="120" />
            <el-table-column label="批次号" prop="batchNo" min-width="110" show-overflow-tooltip />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getMaterialInboundSuppliers, getMaterialInboundRecords } from "@/api/foundation/material";
import { exportPreviewRowsToXlsx } from "@/utils/importPreviewExport";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";

export default {
  name: "MaterialInboundRecords",
  components: { SelectWarehouse },
  props: {
    materialId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      loading: false,
      orderMode: "AUDIT_DESC",
      selectedSupplierId: null,
      supplierTree: [{ id: "ALL", supplierId: null, label: "供应商" }],
      records: [],
      filters: {
        warehouseId: null,
        auditBeginTime: "",
        auditEndTime: ""
      }
    };
  },
  created() {
    this.initDefaultAuditRange();
  },
  methods: {
    pad2(n) {
      return String(n).padStart(2, "0");
    },
    formatDateTime(d) {
      const y = d.getFullYear();
      const m = this.pad2(d.getMonth() + 1);
      const day = this.pad2(d.getDate());
      const h = this.pad2(d.getHours());
      const mm = this.pad2(d.getMinutes());
      const s = this.pad2(d.getSeconds());
      return `${y}-${m}-${day} ${h}:${mm}:${s}`;
    },
    initDefaultAuditRange() {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      this.filters.auditBeginTime = this.formatDateTime(monthStart);
      this.filters.auditEndTime = this.formatDateTime(todayEnd);
    },
    normalizeAuditEndTime(v) {
      if (!v) return "";
      const s = String(v).trim();
      if (!s) return "";
      if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
        return `${s} 23:59:59`;
      }
      if (/^\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}$/.test(s)) {
        return `${s}:59`;
      }
      return s;
    },
    handleQuery() {
      this.loadRecords();
    },
    handleReset() {
      this.filters.warehouseId = null;
      this.initDefaultAuditRange();
      this.loadRecords();
    },
    async loadData() {
      if (!this.materialId) return;
      this.loading = true;
      try {
        const res = await getMaterialInboundSuppliers(this.materialId);
        const list = (res && res.data) || [];
        this.supplierTree = [
          { id: "ALL", supplierId: null, label: "供应商" },
          ...list.map(item => ({
            id: `S-${item.supplierId || "NULL"}`,
            supplierId: item.supplierId || null,
            label: `${item.supplierCode || "-"} ${item.supplierName || "未命名供应商"} (${item.recordCount || 0})`
          }))
        ];
        await this.loadRecords();
      } finally {
        this.loading = false;
      }
    },
    async loadRecords() {
      if (!this.materialId) return;
      this.loading = true;
      try {
        const res = await getMaterialInboundRecords(this.materialId, {
          supplierId: this.selectedSupplierId,
          warehouseId: this.filters.warehouseId || undefined,
          auditBeginTime: this.filters.auditBeginTime || undefined,
          auditEndTime: this.normalizeAuditEndTime(this.filters.auditEndTime) || undefined,
          orderMode: this.orderMode
        });
        this.records = (res && res.data) || [];
      } finally {
        this.loading = false;
      }
    },
    onSupplierNodeClick(node) {
      this.selectedSupplierId = node.supplierId || null;
      this.loadRecords();
    },
    openBill(billId) {
      if (!billId) return;
      const routeData = this.$router.resolve({ path: `/inWarehouse/apply`, query: { id: billId } });
      window.open(routeData.href, "_blank");
    },
    async exportSuppliers() {
      const rows = this.supplierTree
        .filter(item => item.id !== "ALL")
        .map(item => ({ 供应商ID: item.supplierId, 显示名称: item.label }));
      if (!rows.length) {
        this.$modal.msgWarning("暂无可导出供应商");
        return;
      }
      await exportPreviewRowsToXlsx(rows, `material_inbound_suppliers_${Date.now()}.xlsx`);
      this.$modal.msgSuccess("已导出供应商列表");
    }
  }
};
</script>

<style scoped>
.panel-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
.panel-title { font-weight: 600; color: #303133; }
.left-panel, .right-panel { border: 1px solid #ebeef5; border-radius: 4px; padding: 8px; background: #fff; }
.custom-tree-node { font-size: 12px; line-height: 1.6; }
.filter-row { display: flex; gap: 8px; align-items: center; margin-bottom: 8px; flex-wrap: wrap; }
.filter-row .el-date-editor { width: 188px; }
</style>
