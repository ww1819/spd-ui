<template>
  <div class="gz-retrospect-table-panel">
    <table-column-setting-dialog
      :visible.sync="columnDialogVisible"
      :ordered-columns="orderedColumns"
      :visible-count="visibleColumnList.length"
      :total-count="columns.length"
      :active-key="columnActiveKey"
      :can-move-up="canMoveColumnUp"
      :can-move-down="canMoveColumnDown"
      @select-row="selectColumnRow"
      @move="moveColumn"
      @set-visible="setColumnVisible"
      @set-sortable="setColumnSortable"
      @set-width="setColumnWidth"
      @set-align="setColumnAlign"
      @save="saveColumnConfig"
      @init="initColumnConfig"
    />

    <div class="table-container" ref="tablePanel">
      <el-table
        ref="table"
        class="gz-retrospect-main-table"
        :key="'gz-trace-detail-table-' + tableColumnEpoch"
        v-loading="loading"
        :data="traceList"
        :height="tableHeight"
        :row-key="getRowKey"
        :row-class-name="gzRetrospectRowClassName"
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
        <template v-for="item in tableColumnItems">
          <el-table-column
            v-if="Number(item.col.key) === 0"
            :key="'tc-' + tableColumnEpoch + '-0'"
            label="产品编码"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceMaterialCode"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 1"
            :key="'tc-' + tableColumnEpoch + '-1'"
            label="院内码"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceInHospitalCode"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || scope.row.masterBarcode || scope.row.mainBarcode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 2"
            :key="'tc-' + tableColumnEpoch + '-2'"
            label="产品名称"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceMaterialName"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 3"
            :key="'tc-' + tableColumnEpoch + '-3'"
            label="规格"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceSpeci"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.specification || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 4"
            :key="'tc-' + tableColumnEpoch + '-4'"
            label="型号"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceModel"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 5"
            :key="'tc-' + tableColumnEpoch + '-5'"
            label="单位"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceUnitName"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || scope.row.unit || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 6"
            :key="'tc-' + tableColumnEpoch + '-6'"
            label="数量"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceQuantity"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.quantity !== null && scope.row.quantity !== undefined">{{ scope.row.quantity }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 7"
            :key="'tc-' + tableColumnEpoch + '-7'"
            label="单价"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceChargePrice"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.chargePrice">{{ scope.row.chargePrice | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 8"
            :key="'tc-' + tableColumnEpoch + '-8'"
            label="金额"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :sort-method="sortTraceAmount"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.quantity !== null && scope.row.quantity !== undefined && scope.row.chargePrice !== null && scope.row.chargePrice !== undefined">
                {{ formatTraceLineAmt(scope.row.quantity, scope.row.chargePrice) }}
              </span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 9"
            :key="'tc-' + tableColumnEpoch + '-9'"
            label="生产日期"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
              <span v-else-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 10"
            :key="'tc-' + tableColumnEpoch + '-10'"
            label="有效期"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.expiryDate">{{ parseTime(scope.row.expiryDate, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 11"
            :key="'tc-' + tableColumnEpoch + '-11'"
            label="批号"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || scope.row.materialNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 12"
            :key="'tc-' + tableColumnEpoch + '-12'"
            label="批次号"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 13"
            :key="'tc-' + tableColumnEpoch + '-13'"
            label="开单科室"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.applyDeptName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 14"
            :key="'tc-' + tableColumnEpoch + '-14'"
            label="执行科室"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.execDeptName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 15"
            :key="'tc-' + tableColumnEpoch + '-15'"
            label="核销科室"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.writeOffDeptName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 16"
            :key="'tc-' + tableColumnEpoch + '-16'"
            label="注册证号"
            prop="material.registerNo"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || scope.row.certificateNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 17"
            :key="'tc-' + tableColumnEpoch + '-17'"
            label="注册证有效期"
            prop="material.periodDate"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
              <span v-else-if="scope.row.expiryDate">{{ parseTime(scope.row.expiryDate, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 18"
            :key="'tc-' + tableColumnEpoch + '-18'"
            label="计费"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span
                class="material-yn-btn"
                :class="isMaterialYesValue(scope.row.material && scope.row.material.isBilling) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
              >{{ isMaterialYesValue(scope.row.material && scope.row.material.isBilling) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 19"
            :key="'tc-' + tableColumnEpoch + '-19'"
            label="集采"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span
                class="material-yn-btn"
                :class="isMaterialYesValue(scope.row.material && scope.row.material.isProcure) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
              >{{ isMaterialYesValue(scope.row.material && scope.row.material.isProcure) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 20"
            :key="'tc-' + tableColumnEpoch + '-20'"
            label="重点耗材"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span
                class="material-yn-btn"
                :class="isMaterialYesValue(scope.row.material && scope.row.material.isMonitor) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
              >{{ isMaterialYesValue(scope.row.material && scope.row.material.isMonitor) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 21"
            :key="'tc-' + tableColumnEpoch + '-21'"
            label="单据状态"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <el-tag v-if="scope.row.orderStatus === 1 || scope.row.parentOrderStatus === 1" type="warning">未审核</el-tag>
              <el-tag v-else-if="scope.row.orderStatus === 2 || scope.row.parentOrderStatus === 2" type="success">已审核</el-tag>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 22"
            :key="'tc-' + tableColumnEpoch + '-22'"
            label="生产厂家"
            prop="manufacturer"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.manufacturer || scope.row.factoryName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 23"
            :key="'tc-' + tableColumnEpoch + '-23'"
            label="供应商"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.supplierDisplayName || scope.row.supplier || (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 24"
            :key="'tc-' + tableColumnEpoch + '-24'"
            label="收费编码"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.chargeCode || (scope.row.material && (scope.row.material.hisChargeItemCode || scope.row.material.hisChargeItemId)) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 25"
            :key="'tc-' + tableColumnEpoch + '-25'"
            label="收费名称"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.hisChargeItemName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 26"
            :key="'tc-' + tableColumnEpoch + '-26'"
            label="收费规格"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.hisChargeItemSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 27"
            :key="'tc-' + tableColumnEpoch + '-27'"
            label="收费单价"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.hisChargeItemPrice != null && scope.row.material.hisChargeItemPrice !== ''">
                {{ scope.row.material.hisChargeItemPrice | formatCurrency }}
              </span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 28"
            :key="'tc-' + tableColumnEpoch + '-28'"
            label="就诊类型"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ formatVisitKind(scope.row.visitKind) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 29"
            :key="'tc-' + tableColumnEpoch + '-29'"
            label="病人住院号/门诊号"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.hospitalNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 30"
            :key="'tc-' + tableColumnEpoch + '-30'"
            label="病人姓名"
            prop="patientName"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.patientName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 31"
            :key="'tc-' + tableColumnEpoch + '-31'"
            label="病人性别"
            prop="patientSex"
            show-overflow-tooltip
            resizable
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'center'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ formatPatientSex(scope.row.patientSex) }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 32"
            :key="'tc-' + tableColumnEpoch + '-32'"
            label="手术医生"
            prop="chiefSurgeon"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.chiefSurgeon || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 33"
            :key="'tc-' + tableColumnEpoch + '-33'"
            label="手术诊断"
            prop="surgicalDiagnosis"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.surgicalDiagnosis || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 34"
            :key="'tc-' + tableColumnEpoch + '-34'"
            label="计费时间"
            prop="billingTime"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.billingTime">{{ parseTime(scope.row.billingTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 35"
            :key="'tc-' + tableColumnEpoch + '-35'"
            label="UDI码"
            prop="material.udiNo"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.udiNo) || scope.row.udiCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 36"
            :key="'tc-' + tableColumnEpoch + '-36'"
            label="辅条码"
            prop="secondaryBarcode"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.secondaryBarcode || scope.row.auxiliaryBarcode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 37"
            :key="'tc-' + tableColumnEpoch + '-37'"
            label="扫描日期"
            prop="scanDate"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span v-if="scope.row.scanDate">{{ parseTime(scope.row.scanDate, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 38"
            :key="'tc-' + tableColumnEpoch + '-38'"
            label="扫描人"
            prop="scanUser"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.scanUser || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 39"
            :key="'tc-' + tableColumnEpoch + '-39'"
            label="阳光平台编码"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.sunshineCode) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 40"
            :key="'tc-' + tableColumnEpoch + '-40'"
            label="医保编码"
            prop="material.medicalNo"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.medicalNo) || scope.row.medicalNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 41"
            :key="'tc-' + tableColumnEpoch + '-41'"
            label="财务分类"
            prop="financeCategory"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 42"
            :key="'tc-' + tableColumnEpoch + '-42'"
            label="库房分类"
            prop="warehouseCategory"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 43"
            :key="'tc-' + tableColumnEpoch + '-43'"
            label="仓库来源"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.warehouseName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            v-else-if="Number(item.col.key) === 44"
            :key="'tc-' + tableColumnEpoch + '-44'"
            label="批次字典"
            show-overflow-tooltip
            resizable
            :class-name="colClassName(item.col)"
            :sortable="!!item.col.sortable"
            :align="item.col.align || 'left'"
            header-align="center"
            :width="item.col.width"
          >
            <template slot-scope="scope">
              <span>{{ scope.row.batchSource || '--' }} / {{ scope.row.originBusinessType || '--' }}</span>
            </template>
          </el-table-column>
        </template>
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
import { listTraceabilityEntry } from "@/api/gz/traceability";
import { exportTraceDetailTable } from "../retrospectExport";
import retrospectSortMixin from "../retrospectSortMixin";
import TableColumnSettingDialog from "@/components/TableColumnSettingDialog";
import { createTableColumnSettingsMixin } from "@/mixins/tableColumnSettings";

function createDefaultDetailColumns() {
  return [
    { key: 0, label: "产品编码", visible: true, width: 145, align: "left", sortable: true },
    { key: 1, label: "院内码", visible: true, width: 200, align: "left", sortable: true },
    { key: 2, label: "产品名称", visible: true, width: 185, align: "left", sortable: true },
    { key: 3, label: "规格", visible: true, width: 130, align: "left", sortable: true },
    { key: 4, label: "型号", visible: true, width: 110, align: "left", sortable: true },
    { key: 5, label: "单位", visible: true, width: 100, align: "left", sortable: true },
    { key: 6, label: "数量", visible: true, width: 110, align: "center", sortable: true },
    { key: 7, label: "单价", visible: true, width: 130, align: "center", sortable: true },
    { key: 8, label: "金额", visible: true, width: 130, align: "center", sortable: true },
    { key: 9, label: "生产日期", visible: true, width: 120, align: "left", sortable: false },
    { key: 10, label: "有效期", visible: true, width: 120, align: "left", sortable: false },
    { key: 11, label: "批号", visible: true, width: 120, align: "left", sortable: false },
    { key: 12, label: "批次号", visible: true, width: 120, align: "left", sortable: false },
    { key: 13, label: "开单科室", visible: true, width: 140, align: "left", sortable: false },
    { key: 14, label: "执行科室", visible: true, width: 140, align: "left", sortable: false },
    { key: 15, label: "核销科室", visible: true, width: 140, align: "left", sortable: false },
    { key: 16, label: "注册证号", visible: true, width: 180, align: "left", sortable: false },
    { key: 17, label: "注册证有效期", visible: true, width: 160, align: "left", sortable: false },
    { key: 18, label: "计费", visible: true, width: 80, align: "center", sortable: false },
    { key: 19, label: "集采", visible: true, width: 80, align: "center", sortable: false },
    { key: 20, label: "重点耗材", visible: true, width: 90, align: "center", sortable: false },
    { key: 21, label: "单据状态", visible: true, width: 100, align: "center", sortable: false },
    { key: 22, label: "生产厂家", visible: true, width: 160, align: "left", sortable: false },
    { key: 23, label: "供应商", visible: true, width: 160, align: "left", sortable: false },
    { key: 24, label: "收费编码", visible: true, width: 160, align: "left", sortable: false },
    { key: 25, label: "收费名称", visible: true, width: 180, align: "left", sortable: false },
    { key: 26, label: "收费规格", visible: true, width: 140, align: "left", sortable: false },
    { key: 27, label: "收费单价", visible: true, width: 120, align: "center", sortable: false },
    { key: 28, label: "就诊类型", visible: true, width: 100, align: "left", sortable: false },
    { key: 29, label: "病人住院号/门诊号", visible: true, width: 160, align: "left", sortable: false },
    { key: 30, label: "病人姓名", visible: true, width: 100, align: "left", sortable: false },
    { key: 31, label: "病人性别", visible: true, width: 100, align: "center", sortable: false },
    { key: 32, label: "手术医生", visible: true, width: 160, align: "left", sortable: false },
    { key: 33, label: "手术诊断", visible: true, width: 160, align: "left", sortable: false },
    { key: 34, label: "计费时间", visible: true, width: 160, align: "left", sortable: false },
    { key: 35, label: "UDI码", visible: true, width: 200, align: "left", sortable: false },
    { key: 36, label: "辅条码", visible: true, width: 160, align: "left", sortable: false },
    { key: 37, label: "扫描日期", visible: true, width: 160, align: "left", sortable: false },
    { key: 38, label: "扫描人", visible: true, width: 120, align: "left", sortable: false },
    { key: 39, label: "阳光平台编码", visible: true, width: 160, align: "left", sortable: false },
    { key: 40, label: "医保编码", visible: true, width: 180, align: "left", sortable: false },
    { key: 41, label: "财务分类", visible: true, width: 120, align: "left", sortable: false },
    { key: 42, label: "库房分类", visible: true, width: 120, align: "left", sortable: false },
    { key: 43, label: "仓库来源", visible: true, width: 160, align: "left", sortable: false },
    { key: 44, label: "批次字典", visible: true, width: 220, align: "left", sortable: false }
  ];
}

export default {
  name: "UseTraceDetail",
  mixins: [
    retrospectSortMixin,
    createTableColumnSettingsMixin({
      createDefaultColumns: createDefaultDetailColumns,
      configKey: "gz_retrospect_detail_columns",
      tableRef: "table"
    })
  ],
  components: { TableColumnSettingDialog },
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
      totalInfo: {
        totalQty: 0,
        totalAmt: 0
      },
      ids: [],
      selectedRowKeys: [],
      tableHeight: 400
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
        : String(this.formatAmount(amt));
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
    this.loadUserColumnConfig().finally(() => {
      this.getList();
    });
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
    colClassName(col) {
      return (col && (col.align || 'left') === 'left') ? 'ctk-col-left' : '';
    },
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        let h = Math.floor(panel.clientHeight);
        // flex 尚未撑开时 clientHeight 可能为 0，按视口估算，避免表体高度塌成空白
        if (h < 160) {
          const rect = panel.getBoundingClientRect();
          const estimated = Math.floor(window.innerHeight - rect.top - 64);
          h = Math.max(h, estimated);
        }
        if (h > 160) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.table && this.$refs.table.doLayout) {
              this.$refs.table.doLayout();
            }
          });
        }
      });
    },
    /** 模板内勿写 this.xxx，避免行渲染异常导致整表空白 */
    formatTraceLineAmt(qty, price) {
      if (typeof this.calcLineAmt === 'function') {
        return this.calcLineAmt(qty, price);
      }
      const q = Number(qty);
      const p = Number(price);
      if (isNaN(q) || isNaN(p)) return '--';
      const amt = q * p;
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(amt);
    },
    getRowKey(row) {
      return (row && row._rowKey) || `gz-retrospect-fallback-${row && row.id}`;
    },
    gzRetrospectRowClassName({ row }) {
      const key = this.getRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'gz-retrospect-row-selected';
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
    sortTraceInHospitalCode(a, b) {
      return this.traceSortByStr(a, b, r => r.inHospitalCode || r.masterBarcode || r.mainBarcode || '');
    },
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
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        if (response.code === 200) {
          this.traceList = (response.rows || []).map((row, idx) => {
            if (row && !row._rowKey) {
              row._rowKey = `gz-retrospect-detail-${pageBase + idx}-${row.inHospitalCode || row.masterBarcode || ''}-${(row.material && row.material.code) || ''}-${row.id || idx}`;
            }
            return row;
          });
          this.total = response.total || 0;
          this.totalInfo = response.totalInfo || { totalQty: 0, totalAmt: 0 };
        } else {
          this.traceList = [];
          this.total = 0;
          this.totalInfo = { totalQty: 0, totalAmt: 0 };
        }
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => {
          this.syncTableScroll();
          this.updateTableHeight();
          setTimeout(() => this.updateTableHeight(), 100);
          setTimeout(() => this.updateTableHeight(), 300);
          if (this.$refs.table) {
            this.$refs.table.doLayout();
          }
        });
      }).catch((error) => {
        console.error('获取使用追溯明细表数据失败:', error);
        this.traceList = [];
        this.total = 0;
        this.totalInfo = { totalQty: 0, totalAmt: 0 };
        this.selectedRowKeys = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      });
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.selectedRowKeys = (selection || []).map(row => this.getRowKey(row));
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
.gz-retrospect-table-panel {
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
  min-height: 200px;
  position: relative;
  flex: 1 1 auto;
}

.table-container ::v-deep .el-table__body-wrapper {
  min-height: 120px;
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
