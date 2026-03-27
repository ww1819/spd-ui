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
            <el-table-column label="批号" prop="batchNo" min-width="110" show-overflow-tooltip />
            <el-table-column label="有效期" prop="endTime" min-width="120" />
            <el-table-column label="批次号" prop="batchNumber" min-width="110" show-overflow-tooltip />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getMaterialInboundSuppliers, getMaterialInboundRecords } from "@/api/foundation/material";
import { exportPreviewRowsToXlsx } from "@/utils/importPreviewExport";

export default {
  name: "MaterialInboundRecords",
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
      records: []
    };
  },
  methods: {
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
</style>
