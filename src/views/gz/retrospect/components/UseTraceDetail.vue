<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="traceList" @selection-change="handleSelectionChange" border height="60vh" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortTraceMaterialCode">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="院内码" align="center" width="200" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.inHospitalCode || scope.row.masterBarcode || scope.row.mainBarcode || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材名称" align="center" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortTraceMaterialName">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="规格" align="center" width="130" min-width="110" show-overflow-tooltip resizable sortable :sort-method="sortTraceSpeci">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="型号" align="center" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortTraceModel">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单位" align="center" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortTraceUnitName">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || scope.row.unit || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortTraceQuantity">
        <template slot-scope="scope">
          <span v-if="scope.row.quantity !== null && scope.row.quantity !== undefined">{{ scope.row.quantity }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortTraceChargePrice">
        <template slot-scope="scope">
          <span v-if="scope.row.chargePrice">{{ scope.row.chargePrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortTraceAmount">
        <template slot-scope="scope">
          <span v-if="scope.row.quantity !== null && scope.row.quantity !== undefined && scope.row.chargePrice !== null && scope.row.chargePrice !== undefined">
            {{ (parseFloat(scope.row.quantity) * parseFloat(scope.row.chargePrice)).toFixed(2) }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="生产日期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.expiryDate">{{ parseTime(scope.row.expiryDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批号" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchNumber || scope.row.materialNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="开单科室" align="center" width="140" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.applyDeptName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="执行科室" align="center" width="140" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.execDeptName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="核销科室" align="center" width="140" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.writeOffDeptName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.registerNo) || scope.row.certificateNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证有效期" align="center" prop="material.periodDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.expiryDate">{{ parseTime(scope.row.expiryDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span
            class="material-yn-btn"
            :class="isMaterialYesValue(scope.row.material && scope.row.material.isBilling) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
          >{{ isMaterialYesValue(scope.row.material && scope.row.material.isBilling) ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="集采" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span
            class="material-yn-btn"
            :class="isMaterialYesValue(scope.row.material && scope.row.material.isProcure) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
          >{{ isMaterialYesValue(scope.row.material && scope.row.material.isProcure) ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="重点耗材" align="center" width="90" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span
            class="material-yn-btn"
            :class="isMaterialYesValue(scope.row.material && scope.row.material.isMonitor) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
          >{{ isMaterialYesValue(scope.row.material && scope.row.material.isMonitor) ? '是' : '否' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.orderStatus === 1 || scope.row.parentOrderStatus === 1" type="warning">未审核</el-tag>
          <el-tag v-else-if="scope.row.orderStatus === 2 || scope.row.parentOrderStatus === 2" type="success">已审核</el-tag>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="center" prop="manufacturer" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.manufacturer || scope.row.factoryName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.supplierDisplayName || scope.row.supplier || (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="收费编码" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.chargeCode || (scope.row.material && (scope.row.material.hisChargeItemCode || scope.row.material.hisChargeItemId)) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="收费名称" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.hisChargeItemName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="收费规格" align="center" width="140" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.hisChargeItemSpeci) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="收费单价" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.hisChargeItemPrice != null && scope.row.material.hisChargeItemPrice !== ''">
            {{ scope.row.material.hisChargeItemPrice | formatCurrency }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="就诊类型" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatVisitKind(scope.row.visitKind) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="病人住院号/门诊号" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.hospitalNumber || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="病人姓名" align="center" prop="patientName" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.patientName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="病人性别" align="center" prop="patientSex" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatPatientSex(scope.row.patientSex) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="手术医生" align="center" prop="chiefSurgeon" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.chiefSurgeon || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="手术诊断" align="center" prop="surgicalDiagnosis" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.surgicalDiagnosis || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="计费时间" align="center" prop="billingTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.billingTime">{{ parseTime(scope.row.billingTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="UDI码" align="center" prop="material.udiNo" width="200" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.udiNo) || scope.row.udiCode || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="辅条码" align="center" prop="secondaryBarcode" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.secondaryBarcode || scope.row.auxiliaryBarcode || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="扫描日期" align="center" prop="scanDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.scanDate">{{ parseTime(scope.row.scanDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="扫描人" align="center" prop="scanUser" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.scanUser || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="阳光平台编码" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.sunshineCode) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="医保编码" align="center" prop="material.medicalNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.medicalNo) || scope.row.medicalNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="财务分类" align="center" prop="financeCategory" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="库房分类" align="center" prop="warehouseCategory" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库来源" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.warehouseName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="批次字典" align="center" width="220" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchSource || '--' }} / {{ scope.row.originBusinessType || '--' }}</span>
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper">
      <div class="pagination-summary" v-if="total > 0">
        <span class="summary-label">合计：</span>当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
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
import { listTraceabilityEntry } from "@/api/gz/traceability";
import { exportTraceDetailTable } from "../retrospectExport";
import retrospectSortMixin from "../retrospectSortMixin";

export default {
  name: "UseTraceDetail",
  mixins: [retrospectSortMixin],
  props: {
    queryParams: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: true,
      traceList: [],
      total: 0,
      ids: []
    };
  },
  computed: {
    pageTotalQty() {
      return (this.traceList || []).reduce((s, r) => s + Number(r.quantity || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.traceList || []).reduce((s, r) => {
        const q = Number(r.quantity || 0);
        const p = Number(r.chargePrice || 0);
        return s + q * p;
      }, 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    }
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
    formatPatientSex(val) {
      if (val === null || val === undefined || val === '') return '--';
      const s = String(val).trim();
      if (s === '0' || s === '男' || s.toLowerCase() === 'm' || s.toLowerCase() === 'male') return '男';
      if (s === '1' || s === '女' || s.toLowerCase() === 'f' || s.toLowerCase() === 'female') return '女';
      return s;
    },
    formatMaterialYesNo(val) {
      if (val === null || val === undefined || val === '') return '--';
      const s = String(val).trim();
      if (s === '1' || s === 'true' || s === '是') return '是';
      if (s === '0' || s === '2' || s === 'false' || s === '否') return '否';
      return s;
    },
    isMaterialYesValue(val) {
      if (val === null || val === undefined || val === '') return false;
      const s = String(val).trim();
      return s === '1' || s === 'true' || s === '是';
    },
    formatVisitKind(val) {
      if (val === null || val === undefined || val === '') return '--';
      const s = String(val).trim().toUpperCase();
      if (s === 'INPATIENT' || val === '住院') return '住院';
      if (s === 'OUTPATIENT' || val === '门诊') return '门诊';
      return val;
    },
    buildEntryQuery() {
      const trimLeading = (val) => {
        if (val === null || val === undefined || val === '') return null;
        const s = String(val).replace(/^\s+/, '');
        return s === '' ? null : s;
      };
      const p = this.queryParams;
      const q = {
        pageNum: p.pageNum || 1,
        pageSize: p.pageSize || 10,
        orderStatus: p.orderStatus != null ? p.orderStatus : 2,
        inHospitalCode: trimLeading(p.inHospitalCode),
        materialKeyword: trimLeading(p.materialKeyword),
        materialSpeci: trimLeading(p.materialSpeci),
        factoryId: p.factoryId || null,
        warehouseId: p.warehouseId || null,
        materialNo: trimLeading(p.materialNo),
        chargeCodeKeyword: trimLeading(p.chargeCodeKeyword),
        hospitalNumber: trimLeading(p.hospitalNumber),
        patientName: trimLeading(p.patientName),
        udiKeyword: trimLeading(p.udiKeyword),
        sunshineCodeKeyword: trimLeading(p.sunshineCodeKeyword),
        medicalNoKeyword: trimLeading(p.medicalNoKeyword),
        isBilling: p.isBilling || null,
        isProcure: p.isProcure || null,
        isMonitor: p.isMonitor || null,
        supplierId: p.supplierId || null,
        supplierKeyword: (!p.supplierId && p.supplierKeyword) ? trimLeading(p.supplierKeyword) : null
      };
      if (p.startDate) {
        q.startDate = p.startDate;
      }
      if (p.endDate) {
        q.endDate = p.endDate;
      }
      return q;
    },
    getList() {
      this.loading = true;
      listTraceabilityEntry(this.buildEntryQuery()).then(response => {
        if (response.code === 200) {
          this.traceList = response.rows || [];
          this.total = response.total || 0;
        } else {
          this.traceList = [];
          this.total = 0;
        }
        this.loading = false;
        this.$nextTick(() => {
          this.syncTableScroll();
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      }).catch((error) => {
        console.error('获取使用追溯明细表数据失败:', error);
        this.traceList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.$emit('selection-change', selection);
    },
    async exportTable() {
      this.loading = true;
      try {
        const result = await exportTraceDetailTable(this, this.queryParams);
        this.$modal.msgSuccess(`导出成功，共 ${result.rowCount} 条`);
      } catch (e) {
        const msg = (e && e.message) ? e.message : '导出失败，请稍后重试';
        this.$modal.msgError(msg);
        throw e;
      } finally {
        this.loading = false;
      }
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
::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}
::v-deep .el-table th .cell {
  white-space: nowrap;
  padding-left: 8px;
  padding-right: 8px;
}
.material-yn-btn {
  display: inline-block;
  min-width: 36px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  color: #fff;
  cursor: default;
  user-select: none;
  box-sizing: border-box;
}
.material-yn-btn--yes {
  background-color: #409EFF;
}
.material-yn-btn--no {
  background-color: #909399;
}
</style>

