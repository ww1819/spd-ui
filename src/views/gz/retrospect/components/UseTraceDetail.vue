<template>
  <div class="table-container">
    <el-table ref="table" v-loading="loading" :data="traceList" @selection-change="handleSelectionChange" border height="58vh" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="院内码" align="center" width="200" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.inHospitalCode || scope.row.masterBarcode || scope.row.mainBarcode || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材名称" align="center" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
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
      <el-table-column label="单位" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.quantity">{{ scope.row.quantity }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.chargePrice">{{ scope.row.chargePrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.quantity && scope.row.chargePrice">{{ (parseFloat(scope.row.quantity) * parseFloat(scope.row.chargePrice)).toFixed(2) }}</span>
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
          <span>{{ scope.row.batchNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchNumber || scope.row.materialNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.registerNo) || scope.row.registerNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证有效期" align="center" prop="material.periodDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.periodDate">{{ parseTime(scope.row.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
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
      <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="收费编码" align="center" prop="chargeCode" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="病人姓名" align="center" prop="patientName" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.patientName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="病人性别" align="center" prop="patientSex" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.patientSex || '--' }}</span>
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
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listTraceabilityEntry } from "@/api/gz/traceability";

export default {
  name: "UseTraceDetail",
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
    getList() {
      this.loading = true;
      // 创建查询参数对象
      var queryParams = {};
      // 设置分页参数
      queryParams.pageNum = this.queryParams.pageNum || 1;
      queryParams.pageSize = this.queryParams.pageSize || 10;
      // 设置查询条件
      queryParams.traceNo = this.queryParams.traceNo || null;
      queryParams.orderStatus = this.queryParams.orderStatus || 2;
      if (this.queryParams.startDate) {
        queryParams.startDate = this.queryParams.startDate;
      }
      if (this.queryParams.endDate) {
        queryParams.endDate = this.queryParams.endDate;
      }
      listTraceabilityEntry(queryParams).then(response => {
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

<style lang="scss" scoped>
.table-container {
  margin-top: 0px;
  overflow: visible;
  width: 100%;
  position: relative;
  
  ::v-deep .el-table {
    width: 100%;
    border-radius: 8px;
    overflow: visible;
  }
}

::v-deep .el-table__header-wrapper {
  overflow-x: hidden !important;
  overflow-y: hidden !important;
}

::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: none !important;
}

::v-deep .el-table__header-wrapper::-webkit-scrollbar {
  display: none !important;
  width: 0 !important;
  height: 0 !important;
}

::v-deep .el-table__header-wrapper {
  scrollbar-width: none !important;
  -ms-overflow-style: none !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 12px;
  height: 12px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background-color: #c0c4cc;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}

::v-deep .el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: 500;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

::v-deep .pagination-container {
  margin-top: 16px;
  padding: 16px 0;
  background: #fff;
}

::v-deep .el-table__header,
::v-deep .el-table__body {
  width: 100% !important;
}

::v-deep .el-table__header table,
::v-deep .el-table__body table {
  width: 100% !important;
}

::v-deep .el-table__header th,
::v-deep .el-table__body td {
  box-sizing: border-box;
}
</style>

