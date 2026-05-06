<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item prop="orderNo" class="query-item-inline">
            <el-input v-model="queryParams.orderNo"
                      placeholder="出库单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item style="display: flex; align-items: center;">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 180px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
              style="width: 180px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
        <el-col :span="12" class="query-status-col">
          <el-form-item prop="orderStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.orderStatus" placeholder="单据状态"
                       clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['gzOrder:apply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['gzOrder:apply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleBatchAudit"
          v-hasPermi="['gzOrder:apply:audit']"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          :disabled="multiple"
          @click="handleBatchPrint"
        >批量打印</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList"
              :row-class-name="orderListIndex"
              @selection-change="handleSelectionChange" height="58vh" border stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="出库单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.department && scope.row.department.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmt" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.totalAmt != null && scope.row.totalAmt !== undefined) ? parseFloat(scope.row.totalAmt).toFixed(2) : formatTotalAmt(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="orderStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatDisplayDateTime(scope.row.auditDate) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="制单时间" align="center" prop="orderDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatDisplayDateTime(scope.row.orderDate, scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row)"
              v-if="scope.row.orderStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['gzOrder:apply:edit']"
              v-if="scope.row.orderStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['gzOrder:apply:remove']"
              v-if="scope.row.orderStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
          </span>
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

    <!-- 添加或修改高值入库对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="!action || isAuditedForm || (gzOrderEntryList && gzOrderEntryList.length > 0)" includeWarehouseType="高值"/>
            </el-form-item>
            <el-form-item label="总金额">
              <el-input :value="getTotalAmount()" :disabled="true" style="width: 140px; background-color: #fff;">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="科室" prop="departmentId">
              <SelectDepartment v-model="form.departmentId" :disabled="!action || isAuditedForm || (gzOrderEntryList && gzOrderEntryList.length > 0)"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="单据状态" prop="orderStatus">
              <el-select v-model="form.orderStatus" placeholder="请选择单据状态"
                         :disabled="true"
                         clearable style="width: 140px">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单时间" prop="orderDate">
              <el-date-picker clearable
                              v-model="form.orderDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 140px"
                              placeholder="请选择制单时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy">
              <el-input v-model="form.createBy" :disabled="true" style="width: 140px" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="出库类型" prop="orderType">
              <el-select v-model="form.orderType" placeholder="请选择出库类型"
                         :disabled="true"
                         clearable style="width: 140px">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" v-if="isOutbound && action">
          <el-col :span="8">
            <el-form-item label="院内码" prop="scanInHospitalCode" label-width="70px">
              <el-input
                v-model="form.scanInHospitalCode"
                :placeholder="scanInHospitalPlaceholder"
                clearable
                style="width: 260px"
                :disabled="!form.warehouseId || !form.departmentId"
                @keyup.enter.native="handleScanInHospitalCode"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>{{ isOutbound ? '备货出库明细信息' : '高值备货入库明细信息' }}</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" :disabled="isAuditedForm" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" :disabled="isAuditedForm" @click="handleDeleteGzOrderEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button size="small" @click="cancel">取 消</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" size="small" :disabled="isAuditedForm" @click="submitForm">保 存</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" size="small" :disabled="isAuditedForm || hasDialogUnsavedChanges || !form.id" @click="handleDialogAudit">审 核</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-printer" size="small" :disabled="hasDialogUnsavedChanges || !form.id || !isAuditedForm" @click="handleDialogPrint">打 印</el-button>
            </el-col>
            <el-col :span="1.5" v-if="isOutbound">
              <el-button type="primary" plain icon="el-icon-link" size="small"
                         v-hasPermi="['gz:refDoc:query']"
                         @click="openRefAcceptance">引用验收单</el-button>
            </el-col>
          </div>
          <el-col :span="1.5">
            <el-button size="small" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
          </el-col>
        </el-row>
        <div class="table-wrapper">
        <el-table :data="gzOrderEntryList" :row-class-name="rowGzOrderEntryIndex" @selection-change="handleGzOrderEntrySelectionChange" ref="gzOrderEntry" border height="48vh">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材" prop="materialName" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="speci" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="model" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <!-- 库存列已隐藏 -->
          <!-- <el-table-column label="库存" prop="stockQty" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.stockQty || '--' }}</span>
            </template>
          </el-table-column> -->
          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="数量"
                        :disabled="true"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" prop="factoryName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || scope.row.factoryName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" prop="supplierName" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || (scope.row.supplier && scope.row.supplier.name) || scope.row.supplierName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="院内码" prop="inHospitalCode" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="UDI码" prop="udiNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.udiNo || scope.row.masterBarcode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="辅条码" prop="secondaryBarcode" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.secondaryBarcode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" :disabled="isAuditedForm" placeholder="备注" />
            </template>
          </el-table-column>
        </el-table>
        </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <el-dialog :visible.sync=" modalObj.show " :title=" modalObj.title " :width=" modalObj.width " @close="handlePrintDialogClose">
      <!-- 打印方式选择（包含布局选择） -->
      <template v-if=" modalObj.component === 'print-type' ">
        <el-radio-group v-model=" modalObj.form.value ">
          <el-radio :label=" 2 ">浏览器打印</el-radio>
        </el-radio-group>
        <div style="margin-top: 20px;">
          <el-form-item label="页面方向：">
            <el-radio-group v-model=" modalObj.form.orientation ">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </template>
      <!-- 打印预览 -->
      <template v-else-if=" modalObj.component === 'window-print-preview' ">
        <gz-order-print v-if=" modalObj.form.row && modalObj.form.row.detailList && modalObj.form.row.detailList.length > 0 " :key="`print-${modalObj.form.row.orderNo || Date.now()}-${modalObj.form.orientation || 'landscape'}-${modalObj.form.row.detailList.length}`" :row=" modalObj.form.row " :orientation=" modalObj.form.orientation || 'landscape' " ref="receiptOrderPrintRef"></gz-order-print>
        <div v-else-if=" modalObj.form.row " style="padding: 20px; text-align: center; color: #999;">
          <p>正在加载打印数据...</p>
        </div>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click=" modalObj.cancel ">取消</el-button>
        <el-button @click=" modalObj.ok " type="primary">确认</el-button>
      </template>
    </el-dialog>
    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" ref="receiptOrderPrintRefAuto"></gz-order-print>
    </div>

    <!-- 3、使用组件 -->
    <SelectMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="form.warehouseId"
      :gzOrderEntryList="gzOrderEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>

    <el-dialog title="引用备货验收单（仅带当前仓库有库存的明细）" :visible.sync="refAcceptOpen" width="800px" append-to-body @close="onRefAcceptDialogClose">
      <p style="margin:0 0 10px;color:#909399;font-size:13px">请选择已审核的验收单，系统将按当前出库仓库过滤仍有备货库存的条码行并带入明细。</p>
      <el-table :data="refAcceptList" v-loading="refLoading" highlight-current-row
                @row-click="row => { refPickOrderId = row.id; refPickOrderNo = row.orderNo }"
                max-height="360" border size="small">
        <el-table-column type="index" width="50" label="#" align="center"/>
        <el-table-column prop="orderNo" label="验收单号" min-width="140" show-overflow-tooltip/>
        <el-table-column label="仓库" min-width="100" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="制单时间" width="110" align="center">
          <template slot-scope="scope">{{ formatDisplayDateTime(scope.row.orderDate, scope.row.createTime) }}</template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="refAcceptOpen = false">取 消</el-button>
        <el-button type="primary" @click="confirmRefAcceptance">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="请先选择科室"
      :visible.sync="refDeptPickOpen"
      width="480px"
      append-to-body
      :close-on-click-modal="false"
      @closed="refPendingDepartmentId = null"
    >
      <p style="margin:0 0 12px;color:#909399;font-size:13px">引用验收单带出明细前，需要先选择出库科室；取消则不增加明细。</p>
      <el-form label-width="70px" size="small">
        <el-form-item label="科室" required>
          <SelectDepartment v-model="refPendingDepartmentId" />
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="refDeptPickOpen = false">取 消</el-button>
        <el-button type="primary" @click="confirmRefDeptPick">确 定</el-button>
      </span>
    </el-dialog>

    <el-dialog
      title="明细变更记录"
      :visible.sync="entryChangeLogDialog.visible"
      width="1000px"
    >
      <el-table v-loading="entryChangeLogDialog.loading" :data="entryChangeLogDialog.rows" border size="small" max-height="460">
        <el-table-column label="变更时间" min-width="160" align="center">
          <template slot-scope="scope">
            {{ parseTime(scope.row.changeTime, '{y}-{m}-{d} {h}:{i}:{s}') || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="actionType" label="动作" width="90" align="center" />
        <el-table-column prop="entryId" label="明细ID" width="90" align="center" />
        <el-table-column prop="operator" label="操作人" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="变更前" min-width="260">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.beforeJson) }}</span>
            <el-button v-if="scope.row.beforeJson" type="text" size="mini" @click="showJsonDetail('变更前', scope.row.beforeJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="变更后" min-width="260">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.afterJson) }}</span>
            <el-button v-if="scope.row.afterJson" type="text" size="mini" @click="showJsonDetail('变更后', scope.row.afterJson)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="entryChangeLogDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="860px">
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
      <span slot="footer" class="dialog-footer">
        <el-button @click="jsonViewer.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder, auditOrder, checkInHospitalCode, getDepotByInHospitalCodeForOutbound, listEntryChangeLog } from "@/api/gz/shipment";
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listAuditedAcceptance, listAcceptanceDepotLines } from "@/api/gz/refDoc";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';
import { parseTime } from "@/utils/ruoyi";
import {STOCK_IN_TEMPLATE} from "@/utils/printData";
import RMBConverter from "@/utils/tools";
import gzOrderPrint from "@/views/gzOrder/audit/gzOrderPrint";

export default {
  name: "OrderAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectMaterial,SelectWarehouse,SelectDepartment,SelectMaterialFilter,gzOrderPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      isShow: true,
      modalObj: {
        title: '选择打印方式',
        width: '520px',
        component: null,
        form: {
          value: 2,
          orientation: 'landscape', // 默认横向
          row: null
        },
        ok: () => {
        },
        cancel: () => {
        },
        show: false
      },
      // 打印数据（用于隐藏的打印组件）
      printRowData: null,
      // 打印方向，默认横向
      printOrientation: 'landscape',
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedGzOrderEntry: [],
      // 非单个禁用
      single: true,
      pickerBeginTimeOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now();
        },
      },
      pickerEndTimeOptions: {
        disabledDate(time) {
          return time.getTime() < Date.now();
        },
      },
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 高值入库表格数据
      orderList: [],
      // 高值退货明细表格数据
      gzOrderEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      // 是否为出库
      isOutbound: false,
      refAcceptOpen: false,
      refAcceptList: [],
      refLoading: false,
      refPickOrderId: null,
      refPickOrderNo: null,
      /** 引用验收单：表头无科室时先弹窗选科室 */
      refDeptPickOpen: false,
      refPendingDepartmentId: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        auditDate: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        orderDate: [
          { required: true, message: "制单时间不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        departmentId: [
          {
            validator: (rule, value, callback) => {
              if (this.isOutbound && (value === null || value === undefined || value === '')) {
                callback(new Error('科室不能为空'));
              } else {
                callback();
              }
            },
            trigger: 'change'
          }
        ],
      },
      entryChangeLogDialog: {
        visible: false,
        loading: false,
        rows: []
      },
      jsonViewer: {
        visible: false,
        title: '',
        content: ''
      },
      dialogSavedSnapshot: ''
    };
  },
  computed: {
    scanInHospitalPlaceholder() {
      if (!this.form || !this.form.warehouseId) {
        return '请先选择仓库';
      }
      if (!this.form.departmentId) {
        return '请先选择科室';
      }
      return '扫描院内码后回车';
    },
    isAuditedForm() {
      const status = this.form && this.form.orderStatus;
      return status === '2' || status === 2;
    },
    hasDialogUnsavedChanges() {
      if (!this.open || !this.action) {
        return false;
      }
      if (!this.dialogSavedSnapshot) {
        return true;
      }
      return this.buildDialogSnapshot() !== this.dialogSavedSnapshot;
    }
  },
  created() {
    // 根据路由meta.title判断是出库还是入库
    // 如果菜单标题包含"出库"，则设置为出库类型（102）
    // 否则为入库类型（101）
    this.setOrderTypeByRoute();
    this.getList();
  },
  methods: {
    resolveBillTypeByOrderType() {
      const orderType = String(this.form.orderType || this.queryParams.orderType || '101');
      if (orderType === '102') return 'GZ_SHIPMENT';
      if (orderType === '103') return 'GZ_REFUND_DEPOT';
      if (orderType === '104') return 'GZ_REFUND_GOODS';
      return 'GZ_ORDER';
    },
    openEntryChangeLog() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再查看变更记录');
        return;
      }
      this.entryChangeLogDialog.visible = true;
      this.entryChangeLogDialog.loading = true;
      this.entryChangeLogDialog.rows = [];
      listEntryChangeLog(this.resolveBillTypeByOrderType(), this.form.id).then((res) => {
        this.entryChangeLogDialog.rows = res.data || [];
      }).finally(() => {
        this.entryChangeLogDialog.loading = false;
      });
    },
    jsonPreview(jsonText) {
      if (!jsonText) return '--';
      const pretty = this.prettyJson(jsonText);
      return pretty.length > 60 ? `${pretty.slice(0, 60)}...` : pretty;
    },
    prettyJson(jsonText) {
      if (!jsonText) return '';
      try {
        return JSON.stringify(JSON.parse(jsonText), null, 2);
      } catch (e) {
        return String(jsonText);
      }
    },
    showJsonDetail(title, jsonText) {
      this.jsonViewer.title = title;
      this.jsonViewer.content = this.prettyJson(jsonText) || '--';
      this.jsonViewer.visible = true;
    },
    buildDialogSnapshot() {
      const form = this.form || {};
      const entryList = (this.gzOrderEntryList || []).map(item => ({
        id: item.id || null,
        materialId: item.materialId || null,
        qty: item.qty || null,
        price: item.price || null,
        amt: item.amt || null,
        batchNo: item.batchNo || null,
        batchNumber: item.batchNumber || null,
        inHospitalCode: item.inHospitalCode || null,
        remark: item.remark || null,
        supplierId: item.supplierId || (item.supplier && item.supplier.id) || null
      }));
      return JSON.stringify({
        id: form.id || null,
        orderNo: form.orderNo || null,
        orderDate: form.orderDate || null,
        warehouseId: form.warehouseId || null,
        departmentId: form.departmentId || null,
        orderStatus: form.orderStatus || null,
        orderType: form.orderType || null,
        remark: form.remark || null,
        entryList
      });
    },
    markDialogSnapshotSaved() {
      this.dialogSavedSnapshot = this.buildDialogSnapshot();
    },
    toHalfWidth(str) {
      if (!str || typeof str !== 'string') {
        return str;
      }
      return str.replace(/[\uFF01-\uFF5E]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0)).replace(/\u3000/g, ' ');
    },
    handleScanInHospitalCode() {
      if (!this.isOutbound || !this.action) {
        return;
      }
      const wid = this.form.warehouseId;
      if (wid === null || wid === undefined || String(wid).trim() === '') {
        this.$modal.msgWarning('请先选择仓库，再扫描院内码');
        return;
      }
      const did = this.form.departmentId;
      if (did === null || did === undefined || String(did).trim() === '') {
        this.$modal.msgWarning('请先选择科室，再扫描院内码');
        return;
      }
      let code = (this.form.scanInHospitalCode || '').trim();
      if (!code) {
        this.$modal.msgWarning('请输入院内码');
        return;
      }
      code = this.toHalfWidth(code);
      getDepotByInHospitalCodeForOutbound(code, wid).then(res => {
        if (res.code !== 200 || !res.data) {
          this.$modal.msgWarning('未找到该院内码在当前仓库下的可用库存');
          return;
        }
        const inv = res.data;
        const dup = this.gzOrderEntryList.some(e => e.inHospitalCode && inv.inHospitalCode && e.inHospitalCode === inv.inHospitalCode);
        if (dup) {
          this.$modal.msgWarning('该院内码已在明细中');
          this.form.scanInHospitalCode = '';
          return;
        }
        const m = inv.material || {};
        const stockQty = parseFloat(inv.qty) || 0;
        const price = inv.unitPrice != null ? inv.unitPrice : 0;
        const qty = 1;
        const obj = {
          materialId: inv.materialId,
          materialName: m.name || inv.materialName || '',
          speci: m.speci || '',
          model: m.model || '',
          factoryName: (m.fdFactory && m.fdFactory.factoryName) || '',
          supplierName: (inv.supplier && inv.supplier.name) || (m.supplier && m.supplier.name) || '',
          qty: qty,
          stockQty: stockQty,
          price: price,
          amt: (qty * parseFloat(price || 0)).toFixed(2),
          batchNo: inv.batchNo || '',
          batchNumber: inv.materialNo || '',
          beginTime: inv.materialDate || '',
          endTime: inv.endTime || '',
          remark: '',
          masterBarcode: inv.masterBarcode || '',
          secondaryBarcode: inv.secondaryBarcode || '',
          inHospitalCode: inv.inHospitalCode || code,
          udiNo: m.udiNo || '',
          supplierId: inv.supplierId || (m.supplier && m.supplier.id) || null,
          warehouseId: this.form.warehouseId,
          departmentId: this.form.departmentId,
          billNo: this.form.orderNo || null
        };
        this.gzOrderEntryList.push(obj);
        this.form.scanInHospitalCode = '';
      });
    },
    orderListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 格式化总金额 */
    formatTotalAmt(row) {
      if (row.gzOrderEntryList && row.gzOrderEntryList.length > 0) {
        const total = row.gzOrderEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    /** 计算明细总金额 */
    getTotalAmount() {
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        const total = this.gzOrderEntryList.reduce((sum, entry) => {
          return sum + (parseFloat(entry.amt) || 0);
        }, 0);
        return total.toFixed(2);
      }
      return '0.00';
    },
    formatDisplayDateTime(primaryTime, fallbackTime) {
      const primary = parseTime(primaryTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const fallback = parseTime(fallbackTime, '{y}-{m}-{d} {h}:{i}:{s}');
      const primaryZeroClock = primary && / 00:00:00$/.test(primary);
      const fallbackHasRealTime = fallback && !/ 00:00:00$/.test(fallback);
      if (primaryZeroClock && fallbackHasRealTime) {
        return fallback;
      }
      return primary || fallback || '--';
    },
    /** 根据路由设置订单类型 */
    setOrderTypeByRoute() {
      const route = this.$route;
      // 多种方式判断：检查路由标题、路径、或者页面标题
      let isOutbound = false;
      
      // 方式1：检查路由 meta.title
      if (route && route.meta && route.meta.title) {
        isOutbound = route.meta.title.includes('出库');
      }
      
      // 方式2：如果方式1没判断出来，检查路由 path
      if (!isOutbound && route && route.path) {
        // 如果路径包含 outbound 或 出库相关的标识
        isOutbound = route.path.includes('outbound') || route.path.includes('出库');
      }
      
      // 方式3：检查页面标题（document.title 或面包屑）
      if (!isOutbound) {
        const pageTitle = document.title || '';
        const breadcrumb = document.querySelector('.el-breadcrumb__inner')?.textContent || '';
        isOutbound = pageTitle.includes('出库') || breadcrumb.includes('出库');
      }
      
      if (isOutbound) {
        // 出库类型
        this.queryParams.orderType = 102; // 确保是数字类型
        this.isOutbound = true;
      } else {
        // 入库类型（入库审核、备货验收）
        this.queryParams.orderType = 101; // 确保是数字类型
        this.isOutbound = false;
      }
      
      // 强制转换为数字类型，确保后端能正确接收
      this.queryParams.orderType = parseInt(this.queryParams.orderType) || 101;
    },
    /** 查询高值入库列表 */
    getList() {
      this.loading = true;
      // 每次查询前都重新设置 orderType，确保正确过滤
      this.setOrderTypeByRoute();
      
      // 确保 orderType 一定有值，如果没有则默认为入库（101）
      if (!this.queryParams.orderType) {
        this.queryParams.orderType = 101;
        this.isOutbound = false;
      }
      
      // 调试信息
      console.log('查询参数 orderType:', this.queryParams.orderType);
      console.log('当前路由信息:', {
        path: this.$route.path,
        name: this.$route.name,
        meta: this.$route.meta
      });
      
      listOrder(this.queryParams).then(response => {
        this.orderList = response.rows;
        this.total = response.total;
        this.loading = false;
        console.log('查询结果数量:', response.rows.length);
        // 调试：打印总金额信息
        if (response.rows && response.rows.length > 0) {
          console.log('查询结果中的总金额:', response.rows.map(row => ({
            orderNo: row.orderNo,
            totalAmt: row.totalAmt,
            fullRow: row
          })));
        }
        // 检查结果中是否包含错误的类型
        const wrongType = response.rows.filter(row => {
          const orderNo = row.orderNo || '';
          const isOutboundOrder = orderNo.startsWith('GZCK');
          const shouldBeInbound = this.queryParams.orderType === 101;
          return shouldBeInbound && isOutboundOrder;
        });
        if (wrongType.length > 0) {
          console.warn('发现类型不匹配的数据:', wrongType);
        }
      });
    },
    checkMaterialBtn() {
      // 检查是否选择了仓库
      if (!this.form.warehouseId) {
        this.$message.warning('请先选择仓库');
        return;
      }
      // 出库必须选科室后再选明细
      if (this.isOutbound && !this.form.departmentId) {
        this.$message.warning('请先选择科室');
        return;
      }
      //打开"弹窗组件"
      this.DialogComponentShow = true
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据（重复检查已在弹窗组件中完成）
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {
        let obj = {};

        // 确保 materialId 正确获取：优先从 materialId 字段，其次从 material.id，最后从 materialId 属性
        obj.materialId = item.materialId || (item.material && item.material.id) || item.materialId;
        // 调试：打印选择的物料信息
        console.log('选择的物料:', {
          materialId: obj.materialId,
          materialName: (item.material && item.material.name) || item.materialName,
          item: item
        });
        // 优先从material对象获取名称，如果没有则从materialName字段获取
        obj.materialName = (item.material && item.material.name) || item.materialName || ""; // 保存耗材名称用于显示
        // 保存规格和型号
        obj.speci = (item.material && item.material.speci) || "";
        obj.model = (item.material && item.material.model) || "";
        // 保存生产厂家和供应商
        obj.factoryName = (item.material && item.material.fdFactory && item.material.fdFactory.factoryName) || "";
        obj.supplierName = (item.material && item.material.supplier && item.material.supplier.name) || (item.supplier && item.supplier.name) || "";
        obj.qty = item.qty || "";
        obj.stockQty = item.qty || 0; // 保存原始库存数量，用于验证
        obj.price = item.unitPrice || "";
        obj.amt = item.amt || "";
        obj.batchNo = item.batchNo || "";
        obj.batchNumber = item.materialNo || "";
        obj.beginTime = item.materialDate || "";
        obj.endTime = item.endTime || "";
        obj.remark = "";
        obj.masterBarcode = "";
        obj.secondaryBarcode = "";
        obj.inHospitalCode = item.inHospitalCode || "";
        // 保存UDI码，优先从material对象获取，如果没有则从udiNo字段获取
        obj.udiNo = (item.material && item.material.udiNo) || item.udiNo || "";
        obj.supplierId = item.supplierId || (item.supplier && item.supplier.id) || (item.material && item.material.supplier && item.material.supplier.id) || null;
        this.gzOrderEntryList.push(obj);
      });
    },
    /** 当天日期，须为 yyyy-MM-dd（月日补零），否则后端 Jackson 无法反序列化为 Date */
    getOrderDate() {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    },
    /** 提交前将 orderDate 规范为 yyyy-MM-dd，兼容历史未补零字符串 */
    normalizeOrderDateForApi(val) {
      if (val == null || val === '') return val;
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
      const s = String(val);
      const m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (m) {
        return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
      }
      return val;
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        orderNo: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null,
        orderType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        masterBarcode: null,
        secondaryBarcode: null,
        scanInHospitalCode: null
      };
      this.gzOrderEntryList = [];
      this.dialogSavedSnapshot = '';
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      // 只计算金额，不做验证（验证在提交时进行）
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      // 重置后保持orderType，根据路由判断是出库还是入库
      this.setOrderTypeByRoute();
      this.handleQuery();
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01"; //月初
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd; //月末
      return endDate;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      // 根据路由判断是出库还是入库，设置正确的 orderType
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      // 传递 orderType 参数，确保查询正确的表
      getOrder(id, orderType).then(response => {
        this.form = response.data;
        // 确保科室ID正确设置
        if (response.data.departmentId) {
          this.form.departmentId = response.data.departmentId;
        }
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        // 如果有materialList，为每个entry添加materialName和udiNo
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            if (material && material.id) {
              materialMap[material.id] = material;
            }
          });
          this.gzOrderEntryList.forEach(entry => {
            if (entry.materialId && materialMap[entry.materialId]) {
              const material = materialMap[entry.materialId];
              entry.materialName = material.name || "";
              entry.speci = material.speci || "";
              entry.model = material.model || "";
              entry.factoryName = (material.fdFactory && material.fdFactory.factoryName) || "";
              entry.supplierName = (material.supplier && material.supplier.name) || "";
              entry.udiNo = material.udiNo || entry.udiNo || "";
            }
          });
        }
        // 如果是出库单，查询每个明细的库存数量和院内码
        if (isOutbound && this.form.warehouseId && this.gzOrderEntryList.length > 0) {
          // 收集所有需要查询的批次号和物料ID
          const batchNos = this.gzOrderEntryList.map(entry => entry.batchNo).filter(bn => bn);
          if (batchNos.length > 0) {
            listDepotInventory({
              warehouseId: this.form.warehouseId,
              pageNum: 1,
              pageSize: 1000
            }).then(invResponse => {
              const inventoryMap = {};
              // 使用 materialId_batchNo 作为键，精确匹配院内码
              const inHospitalCodeMap = {};
              if (invResponse.rows && invResponse.rows.length > 0) {
                invResponse.rows.forEach(inv => {
                  if (inv.batchNo) {
                    const key = inv.batchNo;
                    if (!inventoryMap[key]) {
                      inventoryMap[key] = 0;
                    }
                    inventoryMap[key] += parseFloat(inv.qty) || 0;
                    // 使用 materialId_batchNo 作为键，精确匹配院内码
                    if (inv.materialId && inv.batchNo && inv.inHospitalCode) {
                      const codeKey = `${inv.materialId}_${inv.batchNo}`;
                      if (!inHospitalCodeMap[codeKey]) {
                        inHospitalCodeMap[codeKey] = [];
                      }
                      inHospitalCodeMap[codeKey].push(inv.inHospitalCode);
                    }
                  }
                });
              }
              // 为每个entry设置库存数量和院内码
              // 注意：如果明细项已经有院内码（从数据库加载的），绝对不能覆盖
              console.log('查询库存前，明细列表的院内码:', this.gzOrderEntryList.map(e => ({
                id: e.id,
                inHospitalCode: e.inHospitalCode,
                materialId: e.materialId,
                batchNo: e.batchNo
              })));
              this.gzOrderEntryList.forEach((entry, entryIndex) => {
                if (entry.batchNo) {
                  if (inventoryMap[entry.batchNo]) {
                    entry.stockQty = inventoryMap[entry.batchNo];
                  } else {
                    entry.stockQty = 0;
                  }
                  // 使用 materialId_batchNo 精确匹配院内码
                  // 重要：如果明细项已经有院内码（从数据库加载的），绝对不能覆盖
                  // 只有在院内码为空或未定义时才从库存查询中设置
                  if (entry.materialId && entry.batchNo) {
                    // 检查院内码是否已存在（可能是从数据库加载的）
                    const hasInHospitalCode = entry.inHospitalCode && entry.inHospitalCode.trim() !== '';
                    console.log(`明细项 ${entryIndex} - id: ${entry.id}, 已有院内码: ${hasInHospitalCode}, 院内码值: ${entry.inHospitalCode}`);
                    if (!hasInHospitalCode) {
                      // 只有在没有院内码时才从库存查询中设置
                      const codeKey = `${entry.materialId}_${entry.batchNo}`;
                      if (inHospitalCodeMap[codeKey] && inHospitalCodeMap[codeKey].length > 0) {
                        // 取第一个院内码
                        entry.inHospitalCode = inHospitalCodeMap[codeKey][0];
                        console.log(`明细项 ${entryIndex} - 从库存查询设置院内码: ${entry.inHospitalCode}`);
                      }
                    } else {
                      console.log(`明细项 ${entryIndex} - 保留已有院内码，不覆盖: ${entry.inHospitalCode}`);
                    }
                  }
                } else {
                  entry.stockQty = 0;
                }
              });
              console.log('查询库存后，明细列表的院内码:', this.gzOrderEntryList.map(e => ({
                id: e.id,
                inHospitalCode: e.inHospitalCode,
                materialId: e.materialId,
                batchNo: e.batchNo
              })));
            });
          }
        }
        this.open = true;
        this.action = false;
        // 不要覆盖从后端获取的 orderStatus，保持原有状态
        // this.form.orderStatus = '1'; // 已注释，使用后端返回的实际状态
        // 确保 orderType 正确设置
        if (isOutbound) {
          this.form.orderType = '102';
          this.title = "查看备货出库";
        } else {
          this.form.orderType = '101';
          this.title = "查看高值备货入库";
        }
        this.markDialogSnapshotSaved();
      });
    },
    onRefAcceptDialogClose() {
      this.refDeptPickOpen = false;
      this.refPendingDepartmentId = null;
    },
    openRefAcceptance() {
      if (!this.form.warehouseId) {
        this.$message.warning('请先选择出库仓库');
        return;
      }
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        this.$message.warning('已有出库明细时请先清空或保存后再引用');
        return;
      }
      this.refPickOrderId = null;
      this.refPickOrderNo = null;
      this.refAcceptOpen = true;
      this.refLoading = true;
      listAuditedAcceptance({ pageNum: 1, pageSize: 100 }).then(res => {
        this.refAcceptList = res.data || res.rows || [];
        this.refLoading = false;
      }).catch(() => { this.refLoading = false; });
    },
    confirmRefAcceptance() {
      if (!this.refPickOrderId) {
        this.$message.warning('请单击表格选择一条验收单');
        return;
      }
      if (this.isOutbound && !this.form.departmentId) {
        this.refPendingDepartmentId = null;
        this.refDeptPickOpen = true;
        return;
      }
      this.fetchAndApplyRefAcceptanceLines();
    },
    /** 科室弹窗确定：写入表头科室后再拉取引用明细 */
    confirmRefDeptPick() {
      if (this.refPendingDepartmentId === null || this.refPendingDepartmentId === undefined || this.refPendingDepartmentId === '') {
        this.$message.warning('请选择科室');
        return;
      }
      this.form.departmentId = this.refPendingDepartmentId;
      this.refDeptPickOpen = false;
      this.fetchAndApplyRefAcceptanceLines();
    },
    /** 按已选验收单拉取备货库存行并写入出库明细（需已选仓库；出库时已选科室） */
    fetchAndApplyRefAcceptanceLines() {
      if (!this.refPickOrderId) {
        this.$message.warning('请单击表格选择一条验收单');
        return;
      }
      if (this.isOutbound && !this.form.departmentId) {
        this.$message.warning('请先选择科室');
        return;
      }
      listAcceptanceDepotLines(this.refPickOrderId, this.form.warehouseId).then(res => {
        const rows = res.data || [];
        if (!rows.length) {
          this.$message.warning('该验收单在当前仓库无可用备货库存');
          return;
        }
        rows.forEach(r => this.gzOrderEntryList.push(this.mapDepotToOutboundEntry(r)));
        this.refAcceptOpen = false;
        this.$message.success('已带入 ' + rows.length + ' 条明细');
      });
    },
    mapDepotToOutboundEntry(r) {
      const m = r.material || {};
      const qty = r.qty != null ? r.qty : 1;
      const price = r.unitPrice != null ? r.unitPrice : 0;
      let amt = r.amt;
      if (amt == null && price != null) {
        amt = (parseFloat(price) * parseFloat(qty)).toFixed(2);
      }
      return {
        materialId: r.materialId,
        materialName: m.name || '',
        speci: m.speci || '',
        model: m.model || '',
        qty,
        price,
        amt,
        batchNo: r.batchNo,
        batchNumber: r.materialNo,
        beginTime: r.materialDate,
        endTime: r.endTime,
        inHospitalCode: r.inHospitalCode,
        masterBarcode: r.masterBarcode,
        secondaryBarcode: r.secondaryBarcode,
        supplierId: r.supplierId,
        stockQty: qty,
        factoryName: m.fdFactory && m.fdFactory.factoryName,
        supplierName: r.supplier && r.supplier.name,
        material: r.material,
        refSrcAcceptanceId: String(r.orderId != null ? r.orderId : (this.refPickOrderId || '')),
        refSrcAcceptanceNo: r.orderNo || this.refPickOrderNo || '',
        refSrcOrderEntryId: r.orderEntryId != null ? String(r.orderEntryId) : '',
        refSrcBarcodeLineId: r.inhospitalcodeListId != null ? String(r.inhospitalcodeListId) : ''
      };
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      // 根据路由判断是出库还是入库
      const route = this.$route;
      if (route && route.meta && route.meta.title && route.meta.title.includes('出库')) {
        this.title = "添加备货出库";
        this.form.orderType = '102';
      } else {
      this.title = "添加高值备货入库";
      this.form.orderType = '101';
      }
      this.form.orderStatus = '1';
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.orderDate = this.getOrderDate();
      this.action = true;
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids
      // 根据路由判断是出库还是入库，设置正确的 orderType
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
        return auditOrder({id: id, orderType: orderType});
      }).then(() => {
        this.getList();
        if (isOutbound) {
          this.$modal.msgSuccess("审核出库成功！");
        } else {
          this.$modal.msgSuccess("审核入库成功！");
        }
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError('请先选择要审核的数据');
        return;
      }
      // 根据路由判断是出库还是入库，设置正确的 orderType
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      
      this.$modal.confirm('确定要审核选中的' + this.ids.length + '条数据项？').then(() => {
        const promises = this.ids.map(id => auditOrder({id: id, orderType: orderType}));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
        if (isOutbound) {
          this.$modal.msgSuccess("批量审核出库成功！");
        } else {
          this.$modal.msgSuccess("批量审核入库成功！");
        }
      }).catch(() => {});
    },
    /** 批量打印按钮操作（仅打印已审核单据） */
    async handleBatchPrint() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning('请先选择要打印的数据');
        return;
      }
      const selectedOrders = this.orderList.filter(item => this.ids.includes(item.id));
      const printableOrders = selectedOrders.filter(item => item.orderStatus === '2' || item.orderStatus === 2);
      if (printableOrders.length === 0) {
        this.$modal.msgWarning('仅已审核单据支持打印，请重新选择');
        return;
      }
      const skippedCount = selectedOrders.length - printableOrders.length;
      const orderNos = printableOrders.map(item => item.orderNo).join('、');
      const tip = skippedCount > 0
        ? `已选择 ${selectedOrders.length} 条，符合打印条件 ${printableOrders.length} 条（已忽略 ${skippedCount} 条未审核单据）。\n是否开始连续打印？\n单号：${orderNos}`
        : `确定连续打印选中的 ${printableOrders.length} 条单据吗？\n单号：${orderNos}`;
      try {
        await this.$modal.confirm(tip);
        for (let i = 0; i < printableOrders.length; i++) {
          this.handlePrint(printableOrders[i], true);
          if (i < printableOrders.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
        this.$modal.msgSuccess(`已触发连续打印，共 ${printableOrders.length} 条`);
      } catch (e) {
        // 用户取消确认时静默结束
      }
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      // 根据路由判断是出库还是入库，设置正确的 orderType
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      // 传递 orderType 参数，确保查询正确的表
      getOrder(id, orderType).then(response => {
        this.form = response.data;
        this.form.orderStatus = '1';
        // 确保 orderType 正确设置
        if (isOutbound) {
          this.form.orderType = '102';
        } else {
          this.form.orderType = '101';
        }
        // 确保科室ID正确设置
        if (response.data.departmentId) {
          this.form.departmentId = response.data.departmentId;
        }
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        // 调试：打印查询返回的数据，特别是院内码
        console.log('查询返回的数据（修改）:', {
          gzOrderEntryList: this.gzOrderEntryList.map(entry => ({
            id: entry.id,
            materialId: entry.materialId,
            batchNo: entry.batchNo,
            inHospitalCode: entry.inHospitalCode,
            materialName: entry.materialName,
            fullEntry: entry
          })),
          materialList: response.data.materialList,
          rawResponse: response.data
        });
        // 如果有materialList，为每个entry添加materialName和udiNo
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            if (material && material.id) {
              materialMap[material.id] = material;
            }
          });
          // 调试：打印 materialMap
          console.log('materialMap:', materialMap);
          this.gzOrderEntryList.forEach(entry => {
            // 调试：打印每个明细的 materialId
            console.log('明细项 materialId:', entry.materialId, 'materialMap keys:', Object.keys(materialMap));
            if (entry.materialId && materialMap[entry.materialId]) {
              const material = materialMap[entry.materialId];
              entry.materialName = material.name || "";
              entry.speci = material.speci || "";
              entry.model = material.model || "";
              entry.factoryName = (material.fdFactory && material.fdFactory.factoryName) || "";
              entry.supplierName = (material.supplier && material.supplier.name) || "";
              entry.udiNo = material.udiNo || entry.udiNo || "";
              // 调试：打印匹配到的物料信息
              console.log('匹配到的物料:', material.name);
            } else {
              // 调试：打印未匹配的情况
              console.warn('未找到对应的物料信息，materialId:', entry.materialId, 'entry:', entry);
            }
          });
        }
        // 如果是出库单，查询每个明细的库存数量和院内码（isOutbound 已在上面定义）
        if (isOutbound && this.form.warehouseId && this.gzOrderEntryList.length > 0) {
          // 收集所有需要查询的批次号和物料ID
          const batchNos = this.gzOrderEntryList.map(entry => entry.batchNo).filter(bn => bn);
          const materialIds = this.gzOrderEntryList.map(entry => entry.materialId).filter(mid => mid);
          if (batchNos.length > 0) {
            listDepotInventory({
              warehouseId: this.form.warehouseId,
              pageNum: 1,
              pageSize: 1000
            }).then(invResponse => {
              const inventoryMap = {};
              // 使用 materialId_batchNo 作为键，精确匹配院内码
              const inHospitalCodeMap = {};
              if (invResponse.rows && invResponse.rows.length > 0) {
                invResponse.rows.forEach(inv => {
                  if (inv.batchNo) {
                    const key = inv.batchNo;
                    if (!inventoryMap[key]) {
                      inventoryMap[key] = 0;
                    }
                    inventoryMap[key] += parseFloat(inv.qty) || 0;
                    // 使用 materialId_batchNo 作为键，精确匹配院内码
                    if (inv.materialId && inv.batchNo && inv.inHospitalCode) {
                      const codeKey = `${inv.materialId}_${inv.batchNo}`;
                      if (!inHospitalCodeMap[codeKey]) {
                        inHospitalCodeMap[codeKey] = [];
                      }
                      inHospitalCodeMap[codeKey].push(inv.inHospitalCode);
                    }
                  }
                });
              }
              // 为每个entry设置库存数量和院内码
              this.gzOrderEntryList.forEach(entry => {
                if (entry.batchNo) {
                  if (inventoryMap[entry.batchNo]) {
                    entry.stockQty = inventoryMap[entry.batchNo];
                  } else {
                    entry.stockQty = 0;
                  }
                  // 使用 materialId_batchNo 精确匹配院内码
                  // 重要：如果明细项已经有院内码（从数据库加载的），绝对不能覆盖
                  // 只有在院内码为空或未定义时才从库存查询中设置
                  if (entry.materialId && entry.batchNo) {
                    // 检查院内码是否已存在（可能是从数据库加载的）
                    const hasInHospitalCode = entry.inHospitalCode && entry.inHospitalCode.trim() !== '';
                    if (!hasInHospitalCode) {
                      // 只有在没有院内码时才从库存查询中设置
                      const codeKey = `${entry.materialId}_${entry.batchNo}`;
                      if (inHospitalCodeMap[codeKey] && inHospitalCodeMap[codeKey].length > 0) {
                        // 取第一个院内码
                        entry.inHospitalCode = inHospitalCodeMap[codeKey][0];
                      }
                    }
                  }
                } else {
                  entry.stockQty = 0;
                }
              });
            });
          }
        }
        this.open = true;
        // 根据路由判断是出库还是入库
        if (isOutbound) {
          this.title = "修改备货出库";
        } else {
        this.title = "修改高值入库";
        }
        this.action = true;
        this.markDialogSnapshotSaved();
      });
    },
    /** 提交按钮 */
    async submitForm() {
      this.$refs["form"].validate(async (valid) => {
        if (valid) {
          // 如果是出库，验证数量不能大于库存数量
          if (this.isOutbound) {
            for (let i = 0; i < this.gzOrderEntryList.length; i++) {
              const item = this.gzOrderEntryList[i];
              const qty = parseFloat(item.qty) || 0;
              const stockQty = parseFloat(item.stockQty) || 0;
              
              // 验证数量必须大于0
              if (!item.qty || qty <= 0) {
                this.$message.error(`第${i + 1}行：出库数量必须大于0`);
                return;
              }
              
              // 验证数量不能大于库存数量
              if (stockQty > 0 && qty > stockQty) {
                this.$message.error(`第${i + 1}行：出库数量（${qty}）不能大于库存数量（${stockQty}）`);
                return;
              }
            }
          }
          this.form.gzOrderEntryList = this.gzOrderEntryList.map(item => ({
            ...item,
            supplierId: item.supplierId || (item.supplier && item.supplier.id) || null,
            warehouseId: this.isOutbound ? this.form.warehouseId : item.warehouseId,
            departmentId: this.isOutbound ? this.form.departmentId : item.departmentId,
            billNo: this.isOutbound ? this.form.orderNo : item.billNo
          }));
          // 调试：打印提交前的数据，特别是院内码
          console.log('提交前的数据:', {
            form: this.form,
            gzOrderEntryList: this.gzOrderEntryList.map(entry => ({
              id: entry.id,
              materialId: entry.materialId,
              batchNo: entry.batchNo,
              inHospitalCode: entry.inHospitalCode,
              qty: entry.qty
            }))
          });
          // 确保 orderType 正确设置（根据路由判断）
          const route = this.$route;
          const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
          if (isOutbound) {
            this.form.orderType = '102';
          } else {
            this.form.orderType = '101';
          }
          this.form.orderDate = this.normalizeOrderDateForApi(this.form.orderDate);
          // 如果是出库单，检查院内码是否被未审核的出库单占用
          if (isOutbound) {
            const checkPromises = [];
            const invalidItems = [];
            
            // 收集所有需要检查的院内码
            for (let i = 0; i < this.gzOrderEntryList.length; i++) {
              const entry = this.gzOrderEntryList[i];
              const inHospitalCode = entry.inHospitalCode;
              
              // 如果有院内码，检查是否被占用（排除当前单据）
              if (inHospitalCode) {
                checkPromises.push(
                  checkInHospitalCode({ inHospitalCode: inHospitalCode }).then(response => {
                    if (response.code === 200 && response.data && response.data.length > 0) {
                      // 过滤掉当前单据的出库单号（如果是修改操作）
                      const currentOrderNo = this.form.orderNo;
                      const occupiedOrderNos = response.data.filter(orderNo => {
                        // 如果是修改操作，排除当前单据
                        if (this.form.id && currentOrderNo && orderNo === currentOrderNo) {
                          return false;
                        }
                        return true;
                      });
                      
                      if (occupiedOrderNos.length > 0) {
                        invalidItems.push({
                          index: i + 1,
                          inHospitalCode: inHospitalCode,
                          materialName: entry.materialName || '未知',
                          orderNos: occupiedOrderNos
                        });
                      }
                    }
                  }).catch(error => {
                    console.error('检查院内码失败:', error);
                  })
                );
              }
            }
            
            // 等待所有检查完成
            if (checkPromises.length > 0) {
              await Promise.all(checkPromises);
              
              // 如果有被占用的院内码，显示提示并阻止提交
              if (invalidItems.length > 0) {
                let message = '以下明细的院内码已被未审核的备货出库单占用，请先处理被占用的出库单：\n\n';
                invalidItems.forEach(item => {
                  message += `第${item.index}行：${item.materialName}（院内码：${item.inHospitalCode}）\n`;
                  message += `占用出库单号：${item.orderNos.join('、')}\n\n`;
                });
                message += '请先审核或删除被占用的出库单后，再提交当前单据。';
                this.$modal.msgError(message);
                return;
              }
            }
          }
          
          // 调试：打印提交的数据，特别是明细列表中的 materialId
          console.log('提交的表单数据:', {
            id: this.form.id,
            departmentId: this.form.departmentId,
            warehouseId: this.form.warehouseId,
            orderType: this.form.orderType,
            isOutbound: isOutbound,
            entryList: this.gzOrderEntryList.map(entry => ({
              materialId: entry.materialId,
              materialName: entry.materialName,
              qty: entry.qty,
              price: entry.price
            }))
          });
          if (this.form.id != null) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "修改成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              this.markDialogSnapshotSaved();
              this.open = false;
              // 确保查询时使用正确的 orderType
              this.setOrderTypeByRoute();
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "新增成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              if (response && response.data && response.data.id) {
                this.form.id = response.data.id;
              }
              this.markDialogSnapshotSaved();
              this.open = false;
              // 确保查询时使用正确的 orderType
              this.setOrderTypeByRoute();
              this.getList();
            });
          }
        }
      });
    },
    /** 弹窗内审核按钮 */
    handleDialogAudit() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再审核');
        return;
      }
      if (this.hasDialogUnsavedChanges) {
        this.$modal.msgWarning('当前有未保存修改，请先保存后再审核');
        return;
      }
      if (this.isAuditedForm) {
        this.$modal.msgWarning('该单据已审核');
        return;
      }
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      this.$modal.confirm(`确定要审核单据"${this.form.orderNo || this.form.id}"吗？`).then(() => {
        return auditOrder({ id: this.form.id, orderType: orderType });
      }).then(() => {
        this.form.orderStatus = '2';
        this.form.auditDate = new Date();
        this.markDialogSnapshotSaved();
        this.getList();
        this.$modal.msgSuccess(isOutbound ? '审核出库成功！' : '审核入库成功！');
      }).catch(() => {});
    },
    /** 弹窗内打印按钮 */
    handleDialogPrint() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再打印');
        return;
      }
      if (this.hasDialogUnsavedChanges) {
        this.$modal.msgWarning('当前有未保存修改，请先保存后再打印');
        return;
      }
      if (!this.isAuditedForm) {
        this.$modal.msgWarning('请先审核后再打印');
        return;
      }
      this.handlePrint(this.form, true);
    },
    /** 打印按钮操作：跳转到独立预览页（与普通耗材入库单一致） */
    handlePrint(row){
      if (!row || !row.id) {
        this.$modal.msgWarning('缺少单据信息，无法打印')
        return
      }
      const target = {
        path: '/print/gz-acceptance',
        query: {
          id: String(row.id),
          api: 'shipment',
          from: encodeURIComponent(this.$route.fullPath)
        }
      }
      const resolved = this.$router.resolve(target)
      this.$router.push(target).catch(() => {
        if (resolved && resolved.href) {
          window.location.href = resolved.href
        }
      })
    },
    handlePrintDialogClose() {
      this.modalObj.show = false;
      // 重置 modalObj，清空打印数据以强制重新渲染
      this.modalObj = {
        show: false,
        title: '',
        width: '',
        component: null,
        form: {
          value: 2,
          orientation: 'landscape',
          row: null
        },
        ok: () => {},
        cancel: () => {}
      };
    },
    windowPrintOut(row, print) {
      this.getOrderDetail(row).then(res => {
        if (print) {
          // 与入库验收页面完全一致：只更新 modalObj.form.row，然后直接调用打印
          // 注意：对话框已经在 handlePrint 中打开了
          this.modalObj.form.row = res;
          // 确保有方向设置
          if (!this.modalObj.form.orientation) {
            this.modalObj.form.orientation = 'landscape';
          }
          this.$nextTick(() => {
            if (this.$refs['receiptOrderPrintRef']) {
              // start() 方法会直接触发浏览器打印对话框，不需要显示预览对话框
              this.$refs['receiptOrderPrintRef'].start();
            }
          });
        } else {
          // 先清空row，强制组件重新渲染
          this.modalObj.form.row = null;
          // 确保有方向设置
          if (!this.modalObj.form.orientation) {
            this.modalObj.form.orientation = 'landscape';
          }
          // 等待组件销毁后再设置新数据
          this.$nextTick(() => {
            this.$nextTick(() => {
              // 验证数据完整性
              if (!res || !res.detailList || res.detailList.length === 0) {
                console.warn('打印数据不完整:', res);
                this.$modal.msgWarning('打印数据不完整，请重试');
                return;
              }
              // 更新 modalObj.form.row 以显示预览
              this.modalObj.form.row = res;
              // 等待组件完全渲染后再显示预览
              this.$nextTick(() => {
                this.$nextTick(() => {
                  // 再次验证组件是否已正确渲染
                  if (this.$refs['receiptOrderPrintRef']) {
                    this.modalObj.component = 'window-print-preview';
                  } else {
                    // 如果组件还未渲染，再等待一次
                    setTimeout(() => {
                      this.modalObj.component = 'window-print-preview';
                    }, 100);
                  }
                });
              });
            });
          });
        }
      });
    },
    doPrintOut(row, print) {
      this.getOrderDetail(row).then(result => {
        if (print) {
          this.$lodop.print(STOCK_IN_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_IN_TEMPLATE, [result])
        }
      })
    },
    //组装打印信息
    getOrderDetail(row) {
      //查询详情
      return getOrder(row.id).then(response => {
        const details = response.data.gzOrderEntryList
        const materiaDetails = response.data.materialList
        const map = {};

        (materiaDetails || []).forEach(it => {
          map[it.id] = it
        })

        let detailList = [], totalAmt = 0, totalQty = 0

        details && details.forEach(item => {
          totalAmt += item.amt
          totalQty += item.qty

          const prod = map[item.materialId]

          detailList.push({
            batchNumber: item.batchNumber,
            amt: item.amt,
            qty: item.qty,
            price: item.price,
            materialCode: prod ? prod.code : '',
            materialName: prod ? prod.name : '',
            materialSpeci: prod ? prod.speci : '',
            periodDate: prod ? prod.periodDate : '',
            factoryName: prod && prod.fdFactory ? prod.fdFactory.factoryName : '',
            warehouseCategoryName: prod && prod.fdWarehouseCategory ? prod.fdWarehouseCategory.warehouseCategoryName : '',
          })

        })

        let totalAmtConverter = RMBConverter.numberToChinese(totalAmt);

        return {
          orderNo: row.orderNo,
          supplierName: row.supplier ? row.supplier.name : '',
          warehouseName: row.warehouse ? row.warehouse.name : '',
          orderDate: row.orderDate,
          auditDate: row.auditDate,
          totalAmt: totalAmt,
          totalQty: totalQty,
          totalAmtConverter: totalAmtConverter,
          detailList: detailList
        }
      })
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      // 根据路由判断是出库还是入库
      const route = this.$route;
      const isOutbound = route && route.meta && route.meta.title && route.meta.title.includes('出库');
      const orderType = isOutbound ? 102 : 101;
      const confirmText = isOutbound ? '是否确认删除备货出库编号为"' + (row.orderNo || ids) + '"的数据项？' : '是否确认删除高值入库编号为"' + (row.orderNo || ids) + '"的数据项？';
      this.$modal.confirm(confirmText).then(() => {
        // 传递 orderType 参数，确保删除正确的表
        return delOrder(ids, orderType);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 高值退货明细序号 */
    rowGzOrderEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 高值退货明细添加按钮操作 */
    handleAddGzOrderEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";
      obj.masterBarcode = "";
      obj.secondaryBarcode = "";
      this.gzOrderEntryList.push(obj);
    },
    /** 高值退货明细删除按钮操作 */
    handleDeleteGzOrderEntry() {
      if (this.checkedGzOrderEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        const gzOrderEntryList = this.gzOrderEntryList;
        const checkedGzOrderEntry = this.checkedGzOrderEntry;
        this.gzOrderEntryList = gzOrderEntryList.filter(function(item) {
          return checkedGzOrderEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleGzOrderEntrySelectionChange(selection) {
      this.checkedGzOrderEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('gz/order/export', {
        ...this.queryParams
      }, `order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  min-height: 48px;
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

/* 查询条件容器框样式 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}


/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}

/* 搜索区域样式 */
.app-container > .el-form {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.app-container > .el-form .el-row {
  margin-bottom: 8px;
}

.app-container > .el-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container > .el-form .el-form-item {
  margin-bottom: 0;
}

/* 第一行查询条件左对齐紧凑布局 */
.app-container > .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container > .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container > .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.app-container > .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container > .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 第二行单据状态对齐到仓库位置 */
.app-container > .el-form .query-row-second {
  position: relative;
}

/* 确保制单日期的两个日期选择器在同一行 */
.app-container > .el-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container > .el-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container > .el-form .query-row-second .query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 10px;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-input,
.local-modal-content .modal-form-compact .el-select,
.local-modal-content .modal-form-compact .el-date-picker {
  width: 140px;
  max-width: 140px;
}

/* 缩小所有输入框高度 */
.local-modal-content .modal-form-compact .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
}

.local-modal-content .modal-form-compact .el-input__icon {
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-select .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor.el-input {
  height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-form-item__content {
  margin-left: 0 !important;
  line-height: 28px;
}

.local-modal-content .modal-form-compact .el-form-item__label {
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 10px;
}

.local-modal-content .el-table {
  height: 55vh;
  max-height: 55vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(55vh - 48px);
  overflow-y: auto;
}

/* 表格滚动条样式 */
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 5px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 5px;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 表格样式优化 */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #F5F7FA;
  color: #606266;
  font-weight: 600;
}

.el-table .cell {
  padding: 0 8px;
  line-height: 1.5;
}

.el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

.json-viewer-pre {
  margin: 0;
  max-height: 520px;
  overflow: auto;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
