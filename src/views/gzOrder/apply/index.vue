<template>
  <div class="app-container gz-order-apply-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item prop="orderNo" class="query-item-inline">
            <el-input v-model="queryParams.orderNo"
                      placeholder="入库单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="supplerId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplerId"/>
            </div>
          </el-form-item>
          <el-form-item prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="18">
          <el-form-item style="display: flex; align-items: center;">
            <el-select v-model="queryParams.timeField" placeholder="时间字段" clearable style="width: 140px; margin-right: 8px;">
              <el-option label="制单时间" value="createTime" />
              <el-option label="审核时间" value="auditDate" />
            </el-select>
            <el-date-picker
              v-model="queryParams.beginDate"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="起始日期"
              clearable
              style="width: 200px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="datetime"
              value-format="yyyy-MM-dd HH:mm:ss"
              placeholder="截止日期"
              clearable
              style="width: 200px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6" class="query-status-col">
          <el-form-item prop="orderStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.orderStatus" placeholder="单据状态"
                       clearable style="width: 150px">
              <el-option label="未审核" value="1" />
              <el-option label="已审核" value="2" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
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
          :disabled="multiple"
          @click="handleAudit"
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
              class="table-compact"
              :row-class-name="orderListIndex"
              @selection-change="handleSelectionChange" 
              ref="orderTable"
              height="calc(100vh - 340px)" border stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="供应商" align="center" prop="supplier.name" width="250" show-overflow-tooltip resizable/>
      <el-table-column label="制单人" align="center" prop="createBy" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ getCreatorName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="orderDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatOrderDate(scope.row.orderDate, scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatTotalAmt(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="orderStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditBy" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ getAuditorName(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatOrderDate(scope.row.auditDate, scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="200" fixed="right">
        <template slot-scope="scope">
          <template v-if="scope.row.orderStatus == '2' || scope.row.orderStatus == 2">
            <el-button
              size="small"
              type="text"
              @click="handlePrintBarcode(scope.row)"
            >打印条码</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
          </template>
          <template v-else>
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['gzOrder:apply:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleDelete(scope.row)"
            v-hasPermi="['gzOrder:apply:remove']"
          >删除</el-button>
          </template>
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
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">
              <!-- 顶部条件容器 -->
              <div class="form-fields-container">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="验收单号" prop="orderNo">
                      <el-input v-model="form.orderNo" :disabled="true" style="width: 220px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId">
                      <SelectWarehouse v-model="form.warehouseId" :value2="gzOrderEntryList.length > 0" :disabled="warehouseAutoFilled" includeWarehouseType="高值"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="供应商" prop="supplerId">
                      <SelectSupplier v-model="form.supplerId" :value2="gzOrderEntryList.length > 0"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单人" prop="createBy">
                      <el-input v-model="form.creatorName" :disabled="true" style="width: 180px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="orderDate" label-width="70px" style="white-space: nowrap;">
                      <el-date-picker clearable
                                      v-model="form.orderDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 140px"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="审核人" prop="auditBy">
                      <el-input v-model="form.auditorName" :disabled="true" style="width: 140px" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="8">
                  <el-col :span="8">
                    <el-form-item label="UDI码" prop="ztm">
                      <div class="udi-scan-inline">
                        <el-input v-model="form.ztm"
                                  class="udi-scan-inline-input"
                                  :placeholder="form.warehouseId ? '请扫描UDI码' : '请先选择仓库'"
                                  clearable
                                  :disabled="!form.warehouseId || isAudited"
                                  @input="onZtmInput"
                                  @paste.native="onZtmPaste"
                                  @keyup.enter.native="openUdiScanDialog"
                        />
                        <el-button
                          type="primary"
                          icon="el-icon-full-screen"
                          :disabled="!form.warehouseId || isAudited"
                          @click="openUdiScanDialog"
                        >扫描</el-button>
                      </div>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="辅条码" prop="ftm">
                      <el-input v-model="form.ftm"
                                placeholder="请扫描辅条码"
                                clearable
                                style="width: 140px"
                                @keydown.enter.native.prevent="sm2"
                      />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input :value="getTotalAmount()" :disabled="true" style="width: 140px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="审核日期" prop="auditDate" label-width="70px" style="white-space: nowrap;">
                      <el-date-picker clearable
                                      v-model="form.auditDate"
                                      type="datetime"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd HH:mm:ss"
                                      style="width: 160px"
                                      placeholder="请选择审核日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <div class="modal-detail-section">
                <div class="detail-toolbar-row detail-toolbar-head">
                  <div class="detail-toolbar-left">
                    <span class="detail-toolbar-title">高值备货明细</span>
                    <template v-if="action">
                      <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId || !form.supplerId || isAudited">添加</el-button>
                      <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzOrderEntry" :disabled="isAudited">删除</el-button>
                      <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm" :disabled="isAudited">保 存</el-button>
                      <el-button type="primary" size="small" @click="handleAuditOnly" :disabled="isAudited">审 核</el-button>
                      <el-button type="primary" icon="el-icon-printer" size="small" @click="handlePrintOnly">打 印</el-button>
                      <el-button size="small" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                      <el-button size="small" @click="cancel" :disabled="isAudited">取 消</el-button>
                    </template>
                    <el-button
                      v-if="!action"
                      type="primary"
                      icon="el-icon-printer"
                      size="small"
                      class="detail-print-barcode-btn"
                      @click="handlePrintBarcodeFromDetail"
                    >打印条码</el-button>
                  </div>
                </div>
                <div class="table-wrapper">
                <el-table :data="gzOrderEntryList" :row-class-name="rowGzOrderEntryIndex"
                          @selection-change="handleGzOrderEntrySelectionChange"
                          ref="gzOrderEntry"
                          border
                          show-summary
                          :summary-method="getSummaries"
                          :height="detailTableHeight">
                  <el-table-column type="selection" width="60" align="center" resizable fixed="left" />
                  <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
                  <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="耗材名称" align="center" prop="materialName" width="150" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="(scope.row.materialName || '') || '—'">
                        <span class="gz-detail-line-clip">{{ scope.row.materialName }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="规格" align="center" prop="speci" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.model || (scope.row.material && scope.row.material.model) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <span v-if="scope.row.unit">
                        {{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}
                      </span>
                      <span v-else-if="scope.row.material">
                        {{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || (scope.row.material.unit && (typeof scope.row.material.unit === 'string' ? scope.row.material.unit : scope.row.material.unit.name)) || '--' }}
                      </span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="数量" align="center" prop="qty" width="80" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.qty != null ? scope.row.qty : '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.qty"
                            class="gz-qty-cell-input"
                            :disabled="isAudited"
                            placeholder=""
                            @input="onQtyCellInput(scope.row, $event)"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="价格" align="center" prop="price" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.price ? parseFloat(scope.row.price).toFixed(2) : '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.amt || '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ getTotalAmount() }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批号" align="center" prop="batchNumber" width="220" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.batchNumber || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.batchNumber"
                            :disabled="isAudited"
                            placeholder="批号"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" align="center" prop="beginTime" width="140" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.beginTime || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-date-picker clearable
                                          v-model="scope.row.beginTime"
                                          class="gz-detail-cell-date"
                                          :disabled="isAudited"
                                          type="date"
                                          value-format="yyyy-MM-dd"
                                          :picker-options="pickerBeginTimeOptions"
                                          placeholder="请选择生产日期"
                                          size="small">
                          </el-date-picker>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="有效期" align="center" prop="endTime" width="140" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.endTime || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-date-picker clearable
                                          v-model="scope.row.endTime"
                                          class="gz-detail-cell-date"
                                          :disabled="isAudited"
                                          type="date"
                                          value-format="yyyy-MM-dd"
                                          :picker-options="pickerEndTimeOptions"
                                          placeholder="请选择有效期"
                                          size="small">
                          </el-date-picker>
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="主条码" align="center" prop="masterBarcode" width="240" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.masterBarcode || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.masterBarcode"
                            :disabled="isAudited"
                            placeholder="主条码"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="辅条码" align="center" prop="secondaryBarcode" width="220" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.secondaryBarcode || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.secondaryBarcode"
                            :disabled="isAudited"
                            placeholder="辅条码"
                            class="gz-detail-cell-input"
                          />
                        </span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="序列号" align="center" prop="serialNo" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.serialNo || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批次号" align="center" prop="batchNo" width="260" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.batchNo || scope.row.batchNumber || '') || '—'">
                        <span class="gz-detail-line-clip">{{ scope.row.batchNo || scope.row.batchNumber || '--' }}</span>
                      </el-tooltip>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产厂家" align="center" prop="factoryName" width="150" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="注册证号" align="center" prop="certificateNo" width="150" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.certificateNo || (scope.row.material && scope.row.material.certificateNo) || (scope.row.material && scope.row.material.fdCertificate && scope.row.material.fdCertificate.certificateNo) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="库房分类" align="center" prop="warehouseCategoryName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.warehouseCategoryName || (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="财务分类" align="center" prop="financeCategoryName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.financeCategoryName || (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" align="center" prop="remark" width="150" resizable>
                    <template slot-scope="scope">
                      <el-tooltip effect="dark" placement="top" :enterable="false" :content="String(scope.row.remark || '') || '—'">
                        <span class="gz-detail-tooltip-anchor">
                          <el-input
                            v-model="scope.row.remark"
                            class="gz-detail-cell-input"
                            :disabled="isAudited"
                            placeholder="备注"
                          />
                        </span>
                      </el-tooltip>
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

    <!-- 打印对话框 -->
    <el-dialog :visible.sync="modalObj.show" :title="modalObj.title" :width="modalObj.width" @close="handlePrintDialogClose">
      <!-- 打印方式选择（包含布局选择） -->
      <template v-if="modalObj.component === 'print-type'">
        <el-radio-group v-model="modalObj.form.value">
          <el-radio :label="2">浏览器打印</el-radio>
        </el-radio-group>
        <div style="margin-top: 20px;">
          <el-form-item label="页面方向：">
            <el-radio-group v-model="modalObj.form.orientation">
              <el-radio label="portrait">纵向</el-radio>
              <el-radio label="landscape">横向</el-radio>
            </el-radio-group>
          </el-form-item>
        </div>
      </template>
      <!-- 打印预览 -->
      <template v-else-if="modalObj.component === 'window-print-preview'">
        <gz-order-print v-if="modalObj.form.row && modalObj.form.row.detailList && modalObj.form.row.detailList.length > 0" :key="`print-${modalObj.form.row.orderNo || Date.now()}-${modalObj.form.orientation || 'landscape'}-${modalObj.form.row.detailList.length}`" :row="modalObj.form.row" :orientation="modalObj.form.orientation || 'landscape'" ref="receiptOrderPrintRef"></gz-order-print>
        <div v-else-if="modalObj.form.row" style="padding: 20px; text-align: center; color: #999;">
          <p>正在加载打印数据...</p>
        </div>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click="handlePrintDialogClose">取消</el-button>
        <el-button @click="modalObj.ok" type="primary">确认</el-button>
      </template>
    </el-dialog>
    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <gz-order-print v-if="printRowData" :row="printRowData" :orientation="printOrientation || 'landscape'" ref="receiptOrderPrintRefAuto"></gz-order-print>
    </div>

    <!-- 3、使用组件 -->
    <SelectGZMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      :warehouseValue="form.warehouseId"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGZMaterialFilter>

    <!-- 仓库选择弹窗 -->
    <el-dialog
      title="请选择仓库"
      :visible.sync="warehouseSelectDialogVisible"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-select v-model="selectedWarehouseId" placeholder="请选择仓库" style="width: 100%">
        <el-option
          v-for="warehouse in availableWarehouses"
          :key="warehouse.id"
          :label="warehouse.name"
          :value="warehouse.id"
        />
      </el-select>
      <span slot="footer" class="dialog-footer">
        <el-button @click="cancelWarehouseSelect">取 消</el-button>
        <el-button type="primary" @click="handleWarehouseSelect(selectedWarehouseId)">确 定</el-button>
      </span>
    </el-dialog>

    <!-- UDI 扫描核对 -->
    <el-dialog
      title="UDI 扫描核对"
      :visible.sync="udiScanDialog.visible"
      width="96%"
      top="4vh"
      append-to-body
      :close-on-click-modal="false"
      custom-class="udi-scan-verify-dialog"
      @closed="onUdiScanDialogClosed"
    >
      <el-form label-width="88px" size="small" v-loading="udiScanDialog.loading">
        <el-form-item label="扫描结果">
          <el-input
            v-model="udiScanDialog.scanResult"
            type="textarea"
            :autosize="{ minRows: 2, maxRows: 6 }"
            placeholder="请扫描或粘贴完整条码"
            class="udi-scan-mono"
            @input="onUdiScanResultInput"
          />
        </el-form-item>
        <el-form-item>
          <el-button size="mini" type="primary" :loading="udiScanDialog.loading" @click="parseUdiScanDialog">解析</el-button>
        </el-form-item>
        <el-form-item label="主条码">
          <el-input
            v-model="udiScanDialog.masterBarcode"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="GTIN / 主条码，可手工修正"
            class="udi-scan-mono"
          />
        </el-form-item>
        <el-form-item label="辅条码">
          <el-input
            v-model="udiScanDialog.secondaryBarcode"
            type="textarea"
            :autosize="{ minRows: 1, maxRows: 4 }"
            placeholder="生产日期、批号、序列号等段，可手工修正"
            class="udi-scan-mono"
          />
        </el-form-item>
        <el-form-item label="耗材信息" class="udi-scan-preview-form-item">
          <el-table
            :data="udiScanPreviewTableData"
            border
            size="small"
            empty-text="请点击「解析」自动检索产品；列与单据明细一致，批号/生产日期/有效期可编辑"
            class="udi-scan-preview-table"
          >
            <el-table-column label="耗材编码" align="center" prop="materialCode" width="110" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="耗材名称" align="center" prop="materialName" width="130" show-overflow-tooltip>
              <template slot-scope="scope">{{ scope.row.materialName || '--' }}</template>
            </el-table-column>
            <el-table-column label="规格" align="center" prop="speci" width="90" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.speci || (scope.row.material && scope.row.material.speci) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="型号" align="center" prop="model" width="90" show-overflow-tooltip>
              <template slot-scope="scope">
                {{ scope.row.model || (scope.row.material && scope.row.material.model) || '--' }}
              </template>
            </el-table-column>
            <el-table-column label="单位" align="center" prop="unit" width="70" show-overflow-tooltip>
              <template slot-scope="scope">
                <span v-if="scope.row.unit">
                  {{ typeof scope.row.unit === 'string' ? scope.row.unit : (scope.row.unit.unitName || scope.row.unit.name || '--') }}
                </span>
                <span v-else-if="scope.row.material">
                  {{ (scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}
                </span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="数量" align="center" prop="qty" width="70">
              <template slot-scope="scope">{{ scope.row.qty != null ? scope.row.qty : '1' }}</template>
            </el-table-column>
            <el-table-column label="价格" align="center" prop="price" width="88">
              <template slot-scope="scope">
                {{ scope.row.price ? parseFloat(scope.row.price).toFixed(2) : '0.00' }}
              </template>
            </el-table-column>
            <el-table-column label="金额" align="center" prop="amt" width="88">
              <template slot-scope="scope">{{ scope.row.amt || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="总金额" align="center" width="88">
              <template slot-scope="scope">{{ scope.row.amt || '0.00' }}</template>
            </el-table-column>
            <el-table-column label="批号" align="center" prop="batchNumber" min-width="140">
              <template slot-scope="scope">
                <el-input v-model="scope.row.batchNumber" placeholder="批号" size="small" class="gz-detail-cell-input" />
              </template>
            </el-table-column>
            <el-table-column label="生产日期" align="center" prop="beginTime" width="150">
              <template slot-scope="scope">
                <el-date-picker
                  v-model="scope.row.beginTime"
                  class="gz-detail-cell-date"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerBeginTimeOptions"
                  placeholder="生产日期"
                  size="small"
                  clearable
                />
              </template>
            </el-table-column>
            <el-table-column label="有效期" align="center" prop="endTime" width="150">
              <template slot-scope="scope">
                <el-date-picker
                  v-model="scope.row.endTime"
                  class="gz-detail-cell-date"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerEndTimeOptions"
                  placeholder="有效期"
                  size="small"
                  clearable
                />
              </template>
            </el-table-column>
          </el-table>
        </el-form-item>
        <div v-if="udiScanDialog.lookupHint" class="udi-scan-hint udi-scan-hint-block">{{ udiScanDialog.lookupHint }}</div>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="udiScanDialog.visible = false">取 消</el-button>
        <el-button type="primary" :loading="udiScanDialog.loading" @click="confirmUdiScanAddToEntry">添加到明细</el-button>
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
        <el-table-column prop="beforeJson" label="变更前" min-width="260" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="json-cell">{{ scope.row.beforeJson || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="afterJson" label="变更后" min-width="260" show-overflow-tooltip>
          <template slot-scope="scope">
            <span class="json-cell">{{ scope.row.afterJson || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="entryChangeLogDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { listOrder, getOrder, listOrderInhospitalcode, delOrder, addOrder, updateOrder, auditOrder, listEntryChangeLog } from "@/api/gz/order";
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listMaterial,jxFtm,jxTm} from "@/api/foundation/material";
import { listUserAll } from "@/api/system/user";
import { listFixedNumber } from "@/api/monitoring/fixedNumber";
import { listWarehouse } from "@/api/foundation/warehouse";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectGZMaterialFilter from '@/components/SelectModel/SelectGZMaterialFilter';
import gzOrderPrint from "@/views/gzOrder/audit/gzOrderPrint";
import { GZ_BARCODE_SESSION_KEY } from '@/views/gzOrder/apply/GzBarcodePrintPage'
import { assertBillHasEntries } from '@/utils/billEntryValidate'
import RMBConverter from "@/utils/tools";
import { parseTime } from "@/utils/ruoyi";
import { normalizeUdiScanInput, parseGs1UdiScan, buildUdiQueryVariants } from '@/utils/udi';
import item from "@/layout/components/Sidebar/Item.vue";

export default {
  name: "Order",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectGZMaterialFilter,gzOrderPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
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
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        supplerId: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        timeField: "createTime",
        auditDate: null,
        beginDate: this.getStatDate(), // 初始化为当前日期前5天
        endDate: this.getEndDate(), // 初始化为当前日期
      },
      // 表单参数
      form: {},
      // 用户列表
      userOptions: [],
      // 打印对话框（与入库验收页面初始化一致）
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
      // 打印条码数据（用于隐藏的打印组件）
      // 打印方向，默认横向
      printOrientation: 'landscape',
      // 仓库是否被自动填充（如果是，则禁用仓库选择）
      warehouseAutoFilled: false,
      // 仓库选择弹窗显示
      warehouseSelectDialogVisible: false,
      // 可选的仓库列表
      availableWarehouses: [],
      // 待添加的产品数据（等待选择仓库）
      pendingMaterialData: null,
      // 选中的仓库ID（用于弹窗）
      selectedWarehouseId: null,
      // 保存快照（用于判断是否有未保存修改）
      savedSnapshot: '',
      entryChangeLogDialog: {
        visible: false,
        loading: false,
        rows: []
      },
      udiScanDialog: {
        visible: false,
        loading: false,
        scanResult: '',
        masterBarcode: '',
        secondaryBarcode: '',
        previewEntry: null,
        materialRow: null,
        lookupHint: ''
      },
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        orderDate: [
          { required: true, message: "制单日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 与到货验收 inWarehouse/audit 弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    },
    isAudited() {
      return this.form.orderStatus == 2 || this.form.orderStatus == '2';
    },
    udiScanPreviewTableData() {
      return this.udiScanDialog.previewEntry ? [this.udiScanDialog.previewEntry] : [];
    }
  },
  watch: {
    open(val) {
      if (val) {
        this.$nextTick(() => {
          const t = this.$refs.gzOrderEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    },
    gzOrderEntryList: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          const t = this.$refs.gzOrderEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    }
  },
  created() {
    // 设置订单类型为入库（备货验收），过滤掉出库单据
    this.setOrderTypeByRoute();
    this.getList();
    this.getUserList();
    window.addEventListener('beforeunload', this.handleBeforeUnload);
  },
  beforeDestroy() {
    window.removeEventListener('beforeunload', this.handleBeforeUnload);
  },
  beforeRouteLeave(to, from, next) {
    if (this.open && this.action && this.hasUnsavedChanges()) {
      this.$confirm('当前修改尚未保存，请先保存再操作。', '提示', {
        confirmButtonText: '我知道了',
        showCancelButton: false,
        type: 'warning'
      }).then(() => next(false)).catch(() => next(false));
      return;
    }
    next();
  },
  methods: {
    buildSnapshot() {
      const formSnapshot = {
        id: this.form.id || null,
        orderNo: this.form.orderNo || '',
        supplerId: this.form.supplerId || null,
        warehouseId: this.form.warehouseId || null,
        ztm: this.form.ztm || '',
        ftm: this.form.ftm || '',
        remark: this.form.remark || ''
      };
      const detailsSnapshot = (this.gzOrderEntryList || []).map(item => ({
        id: item.id || null,
        materialId: item.materialId || null,
        qty: item.qty || '',
        price: item.price || '',
        amt: item.amt || '',
        batchNo: item.batchNo || '',
        batchNumber: item.batchNumber || '',
        beginTime: item.beginTime || '',
        endTime: item.endTime || '',
        masterBarcode: item.masterBarcode || '',
        secondaryBarcode: item.secondaryBarcode || '',
        serialNo: item.serialNo || '',
        remark: item.remark || ''
      }));
      return JSON.stringify({ form: formSnapshot, details: detailsSnapshot });
    },
    markSnapshotSaved() {
      this.savedSnapshot = this.buildSnapshot();
    },
    hasUnsavedChanges() {
      if (!this.open || !this.action) {
        return false;
      }
      // 新增且无任何明细：允许直接关闭/取消（表头控件异步回填常与快照不一致，会误报「未保存」）
      if (!this.form.id && (!this.gzOrderEntryList || this.gzOrderEntryList.length === 0)) {
        return false;
      }
      return this.savedSnapshot !== this.buildSnapshot();
    },
    guardUnsavedThenStop() {
      if (this.hasUnsavedChanges()) {
        this.$modal.msgWarning('当前修改尚未保存，请先保存再操作。');
        return true;
      }
      return false;
    },
    handleBeforeUnload(e) {
      if (this.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
      }
    },
    resolveBillTypeByOrderType() {
      const orderType = String(this.form.orderType || '101');
      if (orderType === '101') {
        return 'GZ_ORDER';
      }
      if (orderType === '102') {
        return 'GZ_SHIPMENT';
      }
      if (orderType === '103') {
        return 'GZ_REFUND_DEPOT';
      }
      if (orderType === '104') {
        return 'GZ_REFUND_GOODS';
      }
      return 'GZ_ORDER';
    },
    openEntryChangeLog() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再查看变更记录');
        return;
      }
      const billType = this.resolveBillTypeByOrderType();
      this.entryChangeLogDialog.visible = true;
      this.entryChangeLogDialog.loading = true;
      this.entryChangeLogDialog.rows = [];
      listEntryChangeLog(billType, this.form.id).then((res) => {
        this.entryChangeLogDialog.rows = res.data || [];
      }).finally(() => {
        this.entryChangeLogDialog.loading = false;
      });
    },
    normalizeHeaderDisplayFields(fallbackRow) {
      const row = fallbackRow || {};
      const currentWarehouseId = this.form.warehouseId || row.warehouseId || (row.warehouse && row.warehouse.id);
      if (currentWarehouseId) {
        this.form.warehouseId = String(currentWarehouseId);
      }
      // 始终以 createBy 解析，避免 { ...form, ...接口 } 合并后残留旧的 creatorName 与当前用户不一致
      const creatorName = this.getCreatorName(this.form);
      this.$set(this.form, 'creatorName', creatorName || (this.form.createBy != null && String(this.form.createBy).trim() !== '' ? String(this.form.createBy) : '--'));
      this.$set(this.form, 'auditorName', this.getAuditorName(this.form) || '');
    },
    /** 将 getOrder 返回的 materialList 合并到 this.gzOrderEntryList（后端明细表无耗材名称/编码等展示字段） */
    applyMaterialListToGzOrderEntries(orderData) {
      const materialList = orderData && orderData.materialList;
      const entries = this.gzOrderEntryList || [];
      if (materialList && materialList.length > 0) {
        const materialMap = {};
        materialList.forEach(material => {
          materialMap[material.id] = material;
        });
        entries.forEach(entry => {
          if (entry.materialId && materialMap[entry.materialId]) {
            const material = materialMap[entry.materialId];
            entry.material = material;
            entry.materialName = material.name || entry.materialName || '';
            entry.materialCode = material.code || entry.materialCode || '';
            entry.speci = material.speci || entry.speci || '';
            entry.model = material.model || entry.model || '';
            if (material.fdUnit && material.fdUnit.unitName) {
              entry.unit = material.fdUnit;
            } else if (material.unit) {
              entry.unit = material.unit;
            }
          }
          if (!entry.masterBarcode && entry.udiNo) {
            entry.masterBarcode = entry.udiNo;
          }
        });
      } else {
        entries.forEach(entry => {
          if (!entry.masterBarcode && entry.udiNo) {
            entry.masterBarcode = entry.udiNo;
          }
        });
      }
    },
    /** 明细合计（与到货验收弹窗表尾一致） */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      const sumNum = (prop) => {
        let t = 0;
        data.forEach(item => {
          const v = item[prop];
          if (v != null && v !== '' && !isNaN(v)) {
            t += parseFloat(v);
          }
        });
        return t;
      };
      columns.forEach((column, index) => {
        if (column.type === 'selection') {
          sums[index] = '';
          return;
        }
        if (column.property === 'index') {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'qty') {
          sums[index] = sumNum('qty');
          return;
        }
        if (column.property === 'amt') {
          const t = sumNum('amt');
          sums[index] = '￥' + t.toFixed(2);
          return;
        }
        if (column.property === 'totalAmount') {
          sums[index] = '￥' + (this.getTotalAmount() || '0.00');
          return;
        }
        sums[index] = '';
      });
      return sums;
    },
    /** 全角转半角（数字/字母/符号/空格） */
    toHalfWidth(input) {
      if (input === null || input === undefined) {
        return "";
      }
      return String(input)
        .replace(/\u3000/g, " ")
        .replace(/[\uFF01-\uFF5E]/g, (char) => {
          return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
        });
    },
    setOrderTypeByRoute() {
      // 备货入库页面固定为入库类型（101）
      this.queryParams.orderType = 101;
      this.isOutbound = false;
      
      // 强制转换为数字类型，确保后端能正确接收
      this.queryParams.orderType = parseInt(this.queryParams.orderType) || 101;
    },
    orderListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 解析 UDI（扫码/粘贴已去括号，支持 01+GTIN 紧凑 GS1） */
    parseUDIString(udiString) {
      return parseGs1UdiScan(udiString);
    },
    onZtmInput() {
      const normalized = normalizeUdiScanInput(this.form.ztm);
      if (normalized !== this.form.ztm) {
        this.form.ztm = normalized;
      }
    },
    onZtmPaste() {
      this.$nextTick(() => {
        this.form.ztm = normalizeUdiScanInput(this.form.ztm);
      });
    },
    /** 打开 UDI 扫描核对窗（表头 UDI 框回车 / 扫描按钮） */
    openUdiScanDialog() {
      const wid = this.form.warehouseId;
      if (wid === null || wid === undefined || String(wid).trim() === '') {
        this.$modal.msgWarning('请先选择仓库，再扫描UDI码');
        return;
      }
      if (this.isAudited) {
        this.$modal.msgWarning('单据已审核，不能扫码入库');
        return;
      }
      this.udiScanDialog.scanResult = normalizeUdiScanInput(this.form.ztm || '');
      this.udiScanDialog.masterBarcode = '';
      this.udiScanDialog.secondaryBarcode = '';
      this.udiScanDialog.previewEntry = null;
      this.udiScanDialog.materialRow = null;
      this.udiScanDialog.lookupHint = '';
      this.udiScanDialog.visible = true;
      if (this.udiScanDialog.scanResult) {
        this.$nextTick(() => this.parseUdiScanDialog());
      }
    },
    onUdiScanDialogClosed() {
      this.udiScanDialog.loading = false;
      this.udiScanDialog.lookupHint = '';
    },
    onUdiScanResultInput() {
      this.udiScanDialog.scanResult = normalizeUdiScanInput(this.udiScanDialog.scanResult);
    },
    /** 解析条码并自动检索产品字典 */
    parseUdiScanDialog() {
      const parsed = this.reparseUdiScanDialog(true);
      if (!parsed) {
        this.udiScanDialog.previewEntry = null;
        this.udiScanDialog.materialRow = null;
        return Promise.resolve();
      }
      return this.lookupUdiScanMaterial();
    },
    reparseUdiScanDialog(showHint) {
      const raw = (this.udiScanDialog.scanResult || '').trim();
      if (!raw) {
        this.udiScanDialog.masterBarcode = '';
        this.udiScanDialog.secondaryBarcode = '';
        if (showHint !== false) {
          this.udiScanDialog.lookupHint = '请输入或扫描完整条码后解析';
        }
        return null;
      }
      const parsed = this.parseUDIString(raw);
      if (!parsed) {
        this.udiScanDialog.lookupHint = '条码格式无法识别，请检查扫描结果或手工填写主条码';
        return null;
      }
      this.udiScanDialog.masterBarcode = parsed.udiCode || parsed.udiCodeForQuery || '';
      this.udiScanDialog.secondaryBarcode = parsed.secondaryBarcode || '';
      this.syncUdiScanPreviewFromParsed(parsed);
      if (showHint !== false) {
        this.udiScanDialog.lookupHint = '正在检索产品…';
      }
      return parsed;
    },
    buildUdiScanPreviewEntry(item, parsedUDI) {
      const priceNum = item && item.price != null ? parseFloat(item.price) : 0;
      const qty = '1';
      const amt = (Number.isFinite(priceNum) ? priceNum : 0).toFixed(2);
      const batch = (parsedUDI && parsedUDI.batchNo) || '';
      return {
        materialId: item.id,
        material: item,
        materialName: item.name || '',
        materialCode: item.code || '',
        speci: item.speci || '',
        model: item.model || '',
        unit: item.unit || item.fdUnit || null,
        qty,
        price: item.price,
        amt,
        batchNo: batch,
        batchNumber: batch,
        beginTime: (parsedUDI && parsedUDI.productionDate) || '',
        endTime: (parsedUDI && parsedUDI.expiryDate) || '',
        serialNo: (parsedUDI && parsedUDI.serialNo) || ''
      };
    },
    syncUdiScanPreviewFromParsed(parsedUDI) {
      if (!parsedUDI || !this.udiScanDialog.previewEntry) {
        return;
      }
      const pe = this.udiScanDialog.previewEntry;
      if (parsedUDI.batchNo) {
        pe.batchNo = parsedUDI.batchNo;
        pe.batchNumber = parsedUDI.batchNo;
      }
      if (parsedUDI.productionDate) {
        pe.beginTime = parsedUDI.productionDate;
      }
      if (parsedUDI.expiryDate) {
        pe.endTime = parsedUDI.expiryDate;
      }
      if (parsedUDI.serialNo) {
        pe.serialNo = parsedUDI.serialNo;
      }
    },
    applyUdiScanPreviewToParsed(parsedUDI) {
      const pe = this.udiScanDialog.previewEntry;
      if (!pe || !parsedUDI) {
        return parsedUDI;
      }
      const batch = (pe.batchNumber || pe.batchNo || '').trim();
      if (batch) {
        parsedUDI.batchNo = batch;
      }
      if (pe.beginTime) {
        parsedUDI.productionDate = pe.beginTime;
      }
      if (pe.endTime) {
        parsedUDI.expiryDate = pe.endTime;
      }
      if (pe.serialNo) {
        parsedUDI.serialNo = pe.serialNo;
      }
      return parsedUDI;
    },
    buildParsedUdiFromScanDialog() {
      const raw = normalizeUdiScanInput(this.udiScanDialog.scanResult || '');
      let parsed = raw ? this.parseUDIString(raw) : null;
      if (!parsed) {
        parsed = {
          udiCode: '',
          udiCodeForQuery: '',
          secondaryBarcode: '',
          productionDate: '',
          expiryDate: '',
          batchNo: '',
          serialNo: ''
        };
      }
      const master = (this.udiScanDialog.masterBarcode || '').trim();
      const secondary = (this.udiScanDialog.secondaryBarcode || '').trim();
      if (master) {
        parsed.udiCode = master;
        if (master.startsWith('01') && master.length >= 16 && /^\d+$/.test(master)) {
          parsed.udiCodeForQuery = master.substring(2, 16);
        } else {
          parsed.udiCodeForQuery = master.replace(/\D/g, '') || master;
        }
      }
      if (secondary) {
        parsed.secondaryBarcode = secondary;
        const sec = this.parseSecondaryBarcode(secondary);
        if (sec.productionDate) {
          parsed.productionDate = sec.productionDate;
        }
        if (sec.expiryDate) {
          parsed.expiryDate = sec.expiryDate;
        }
        if (sec.batchNo) {
          parsed.batchNo = sec.batchNo;
        }
        if (sec.serialNo) {
          parsed.serialNo = sec.serialNo;
        }
      }
      return this.applyUdiScanPreviewToParsed(parsed);
    },
    queryMaterialByUdiVariants(rawInput, parsedUDI) {
      const uniqueVariants = buildUdiQueryVariants(rawInput, parsedUDI);
      const masterOnly = (this.udiScanDialog.masterBarcode || '').trim();
      if (masterOnly && !uniqueVariants.includes(masterOnly)) {
        uniqueVariants.unshift(masterOnly);
      }
      return new Promise((resolve, reject) => {
        const tryQuery = (index) => {
          if (index >= uniqueVariants.length) {
            resolve({ rows: [], variants: uniqueVariants });
            return;
          }
          listMaterial({ udiNo: uniqueVariants[index] }).then(response => {
            if (response.rows && response.rows.length > 0) {
              resolve({ rows: response.rows, variants: uniqueVariants, matchedVariant: uniqueVariants[index] });
            } else {
              tryQuery(index + 1);
            }
          }).catch(err => {
            if (index + 1 < uniqueVariants.length) {
              tryQuery(index + 1);
            } else {
              reject(err);
            }
          });
        };
        tryQuery(0);
      });
    },
    lookupUdiScanMaterial() {
      const raw = (this.udiScanDialog.scanResult || '').trim();
      const master = (this.udiScanDialog.masterBarcode || '').trim();
      if (!raw && !master) {
        this.$modal.msgWarning('请先输入扫描结果或主条码');
        return Promise.resolve();
      }
      const parsedUDI = this.buildParsedUdiFromScanDialog();
      if (!parsedUDI.udiCodeForQuery && !master) {
        this.$modal.msgWarning('主条码无效，请核对后重试');
        return Promise.resolve();
      }
      this.udiScanDialog.loading = true;
      this.udiScanDialog.lookupHint = '正在查询产品字典…';
      return this.queryMaterialByUdiVariants(raw || master, parsedUDI).then(({ rows, variants, matchedVariant }) => {
        if (!rows || rows.length === 0) {
          this.udiScanDialog.materialRow = null;
          this.udiScanDialog.previewEntry = null;
          this.udiScanDialog.lookupHint = `未匹配到产品，已尝试：${variants.join('、')}`;
          return;
        }
        const item = rows[0];
        this.udiScanDialog.materialRow = item;
        this.udiScanDialog.previewEntry = this.buildUdiScanPreviewEntry(item, parsedUDI);
        this.udiScanDialog.lookupHint = matchedVariant
          ? `已匹配产品（查询键：${matchedVariant}），请核对条码段落后添加明细`
          : '已匹配产品，请核对条码段落后添加明细';
      }).catch(error => {
        this.udiScanDialog.materialRow = null;
        this.udiScanDialog.previewEntry = null;
        this.udiScanDialog.lookupHint = '';
        this.$modal.msgError('查询产品失败：' + (error.message || '未知错误'));
      }).finally(() => {
        this.udiScanDialog.loading = false;
      });
    },
    confirmUdiScanAddToEntry() {
      const raw = (this.udiScanDialog.scanResult || '').trim();
      if (!raw) {
        this.$modal.msgWarning('请填写扫描结果');
        return;
      }
      if (!this.udiScanDialog.previewEntry || !this.udiScanDialog.materialRow) {
        this.$modal.msgWarning('请先点击「解析」并核对耗材信息');
        return;
      }
      const parsedUDI = this.buildParsedUdiFromScanDialog();
      if (!parsedUDI.udiCodeForQuery && !(this.udiScanDialog.masterBarcode || '').trim()) {
        this.$modal.msgWarning('主条码无效，请核对后重试');
        return;
      }
      const finishAdd = (rows) => {
        this.form.ztm = '';
        this.udiScanDialog.visible = false;
        this.processMaterialResponse({ rows }, parsedUDI);
      };
      if (this.udiScanDialog.materialRow) {
        finishAdd([this.udiScanDialog.materialRow]);
        return;
      }
      this.udiScanDialog.loading = true;
      this.queryMaterialByUdiVariants(raw, parsedUDI).then(({ rows, variants }) => {
        if (!rows || rows.length === 0) {
          this.$modal.msgWarning(`未找到匹配产品，请调整主条码后重试。已尝试：${variants.join('、')}`);
          return;
        }
        finishAdd(rows);
      }).catch(error => {
        this.$modal.msgError('查询产品失败：' + (error.message || '未知错误'));
      }).finally(() => {
        this.udiScanDialog.loading = false;
      });
    },
    /** @deprecated 请使用 openUdiScanDialog 核对后添加 */
    sm() {
      this.openUdiScanDialog();
    },
    /** 处理产品查询响应 */
    processMaterialResponse(response, parsedUDI) {
      // 获取产品的供应商ID
      const materialSupplierId = response.rows[0].supplierId || (response.rows[0].supplier && response.rows[0].supplier.id) || null;

      // 如果表单中还没有供应商，自动填充第一个产品的供应商
      if (!this.form.supplerId && materialSupplierId) {
        this.form.supplerId = materialSupplierId;
      }

      // 如果表单中已有供应商，检查是否与产品供应商一致
      if (this.form.supplerId && materialSupplierId && this.form.supplerId != materialSupplierId) {
        this.$modal.msgWarning('供应商不一致！请核对供应商。');
        return;
      }

      // 扫描 UDI 仅新增明细，不变更表头仓库
      this.addMaterialToEntryList(response.rows, parsedUDI);
    },
    /** 根据产品ID查找定数监测中该产品所在的仓库（只查询高值仓库） */
    findWarehousesByFixedNumber(materialId) {
      return new Promise((resolve, reject) => {
        try {
          const warehouseIds = [];
          
          // 先查询所有高值仓库，用于验证localStorage中的仓库ID是否为高值仓库
          listWarehouse({ warehouseType: '高值', pageNum: 1, pageSize: 1000 }).then(warehouseResponse => {
            const highValueWarehouses = warehouseResponse && warehouseResponse.rows ? warehouseResponse.rows : [];
            const highValueWarehouseIds = new Set(highValueWarehouses.map(w => String(w.id)));
            
            // 遍历localStorage，查找所有定数监测数据
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('fixedNumber_1_')) {
                try {
                  const savedData = localStorage.getItem(key);
                  if (savedData) {
                    const fixedNumberList = JSON.parse(savedData);
                    // 检查该产品是否在这个仓库的定数监测中
                    const hasMaterial = fixedNumberList.some(item => {
                      const itemMaterialId = item.materialId || (item.material && item.material.id);
                      return itemMaterialId == materialId;
                    });
                    
                    if (hasMaterial) {
                      // 提取仓库ID（从key中提取：fixedNumber_1_123 -> 123）
                      const warehouseId = key.replace('fixedNumber_1_', '');
                      // 只添加高值仓库的ID
                      if (highValueWarehouseIds.has(warehouseId)) {
                        warehouseIds.push(warehouseId);
                      }
                    }
                  }
                } catch (e) {
                  // 忽略解析错误
                  console.warn('解析定数监测数据失败:', key, e);
                }
              }
            }
            
            // 如果没有在localStorage找到，或者需要从后端查询更多数据
            if (warehouseIds.length === 0 || highValueWarehouses.length > 0) {
              // 对每个高值仓库查询定数监测
              const checkPromises = highValueWarehouses.map(warehouse => {
                return listFixedNumber({
                  warehouseId: warehouse.id,
                  fixedNumberType: '1',
                  onlyEnabled: true,
                  pageNum: 1,
                  pageSize: 1000
                }).then(fixedResponse => {
                  if (fixedResponse && fixedResponse.rows) {
                    const hasMaterial = fixedResponse.rows.some(item => {
                      const itemMaterialId = item.materialId || (item.material && item.material.id);
                      return itemMaterialId == materialId;
                    });
                    return hasMaterial ? warehouse : null;
                  }
                  return null;
                }).catch(() => null);
              });
              
              Promise.all(checkPromises).then(results => {
                const foundWarehouses = results.filter(w => w !== null);
                // 合并localStorage中找到的仓库ID和从后端查询到的仓库
                const allWarehouseIds = new Set([...warehouseIds, ...foundWarehouses.map(w => String(w.id))]);
                // 返回仓库对象列表（包含ID和名称）
                const finalWarehouses = highValueWarehouses.filter(w => allWarehouseIds.has(String(w.id)));
                resolve(finalWarehouses.map(w => w.id));
              }).catch(reject);
            } else {
              // 如果localStorage中有数据，需要查询仓库详细信息
              const warehouseDetailPromises = warehouseIds.map(id => {
                return listWarehouse({ id: id, pageNum: 1, pageSize: 1 }).then(res => {
                  if (res && res.rows && res.rows.length > 0) {
                    return res.rows[0];
                  }
                  return null;
                }).catch(() => null);
              });
              
              Promise.all(warehouseDetailPromises).then(warehouses => {
                const validWarehouses = warehouses.filter(w => w !== null && w.warehouseType === '高值');
                resolve(validWarehouses.map(w => w.id));
              }).catch(() => {
                // 如果查询失败，直接返回ID列表
                resolve(warehouseIds);
              });
            }
          }).catch(reject);
        } catch (error) {
          reject(error);
        }
      });
    },
    /** 添加产品到明细列表 */
    addMaterialToEntryList(rows, parsedUDI) {
      if (!rows || rows.length === 0) {
        return;
      }
      const hasSecondaryBarcode = !!(parsedUDI && parsedUDI.secondaryBarcode && parsedUDI.secondaryBarcode.trim());
      // 仅按匹配结果首条新增，确保“扫描一次 UDI 只新增一条明细”
      const item = rows[0];
      const parsedBatchNo = (parsedUDI.batchNo || "").trim();

      // 仅扫描 UDI 时：同产品同批号命中则数量+1，不新增新行
      if (!hasSecondaryBarcode) {
        const existedRow = this.gzOrderEntryList.find((row) => {
          const rowBatchNo = (row.batchNo || row.batchNumber || "").trim();
          return String(row.materialId || "") === String(item.id || "") && rowBatchNo === parsedBatchNo;
        });
        if (existedRow) {
          const currentQty = Number(existedRow.qty) || 0;
          const nextQty = currentQty + 1;
          this.$set(existedRow, 'qty', String(nextQty));
          const priceNum = Number(existedRow.price) || 0;
          this.$set(existedRow, 'amt', (nextQty * priceNum).toFixed(2));
          // 同步主条码，确保后续展示与最近一次扫描一致
          this.$set(existedRow, 'masterBarcode', parsedUDI.udiCode || existedRow.masterBarcode || "");
          this.$set(existedRow, 'udiNo', parsedUDI.udiCodeForQuery || existedRow.udiNo || "");

          this.$nextTick(() => {
            if (this.$refs.gzOrderEntry) {
              this.$refs.gzOrderEntry.clearSelection();
              this.$refs.gzOrderEntry.toggleRowSelection(existedRow, true);
            }
            this.checkedGzOrderEntry = [existedRow];
          });
          this.form.ztm = "";
          return;
        }
      }

      let obj = {};
      obj.materialId = item.id;
      obj.material = item; // 保存完整的物料对象，方便访问嵌套属性
      obj.materialName = item.name || ""; // 保存耗材名称
      obj.materialCode = item.code || ""; // 保存耗材编码
      obj.speci = item.speci || ""; // 保存规格
      obj.model = item.model || ""; // 保存型号
      obj.unit = item.unit || item.fdUnit || null; // 保存单位
      obj.factoryName = (item.fdFactory && item.fdFactory.factoryName) || ""; // 保存生产厂家
      obj.certificateNo = item.certificateNo || (item.fdCertificate && item.fdCertificate.certificateNo) || ""; // 保存注册证号
      obj.warehouseCategoryName = (item.fdWarehouseCategory && item.fdWarehouseCategory.warehouseCategoryName) || ""; // 保存库房分类
      obj.financeCategoryName = (item.fdFinanceCategory && item.fdFinanceCategory.financeCategoryName) || ""; // 保存财务分类
      obj.qty = "1"; // 默认数量为1
      obj.price = item.price;
      obj.amt = (item.price ? parseFloat(item.price).toFixed(2) : "0.00");
      // 使用解析出的数据填充字段
      obj.batchNo = parsedUDI.batchNo || "";
      obj.batchNumber = parsedUDI.batchNo || "";
      obj.beginTime = parsedUDI.productionDate || "";
      obj.endTime = parsedUDI.expiryDate || "";
      obj.serialNo = parsedUDI.serialNo || "";
      obj.remark = "";
      obj.masterBarcode = parsedUDI.udiCode; // UDI码（包含(01)前缀）
      obj.secondaryBarcode = parsedUDI.secondaryBarcode || ""; // 辅助条码（不包含(01)部分）
      obj.udiNo = parsedUDI.udiCodeForQuery || ""; // 保存UDI码（用于查询，不包含(01)前缀）
      const itemSupplierId = item.supplierId || (item.supplier && item.supplier.id) || null;
      obj.supplierId = this.form.supplerId || itemSupplierId || null;
      this.gzOrderEntryList.push(obj);

      // 主辅一起扫描可解析时：自动取消勾选；仅扫描 UDI 时：只勾选最新新增明细
      this.$nextTick(() => {
        if (this.$refs.gzOrderEntry) {
          this.$refs.gzOrderEntry.clearSelection();
          if (!hasSecondaryBarcode) {
            this.$refs.gzOrderEntry.toggleRowSelection(obj, true);
          }
        }
        this.checkedGzOrderEntry = hasSecondaryBarcode ? [] : [obj];
      });

      // 清空UDI码输入框
      this.form.ztm = "";
    },
    /** 处理仓库选择 */
    handleWarehouseSelect(warehouseId) {
      if (warehouseId && this.pendingMaterialData) {
        this.form.warehouseId = warehouseId;
        this.warehouseAutoFilled = true;
        this.addMaterialToEntryList(this.pendingMaterialData.rows, this.pendingMaterialData.parsedUDI);
        this.pendingMaterialData = null;
      }
      this.warehouseSelectDialogVisible = false;
    },
    /** 取消仓库选择 */
    cancelWarehouseSelect() {
      this.warehouseSelectDialogVisible = false;
      this.pendingMaterialData = null;
      this.$modal.msgWarning("未选择仓库，产品未添加");
    }
    ,sm2(){
      console.log('sm2方法被调用', {
        checkedGzOrderEntry: this.checkedGzOrderEntry,
        ftm: this.form.ftm
      });
      
      // 检查是否选择了明细
      if (!this.checkedGzOrderEntry || this.checkedGzOrderEntry.length < 1){
        this.$modal.msgWarning("请选择产品！");
        return;
      }
      
      // 检查辅助条码输入是否为空
      if (!this.form.ftm || !this.form.ftm.trim()) {
        this.$modal.msgWarning("请输入辅助条码");
        return;
      }
      
      this.form.ftm = this.toHalfWidth(this.form.ftm).trim();
      // 解析辅助条码
      const parsedSecondaryBarcode = this.parseSecondaryBarcode(this.form.ftm);
      console.log('解析结果:', parsedSecondaryBarcode);
      
      // 更新所有选中的明细行
      this.checkedGzOrderEntry.forEach(row => {
        // 使用 $set 确保 Vue 能检测到变化
        this.$set(row, 'secondaryBarcode', parsedSecondaryBarcode.secondaryBarcode || "");
        
        // 更新生产日期
        if (parsedSecondaryBarcode.productionDate) {
          this.$set(row, 'beginTime', parsedSecondaryBarcode.productionDate);
        }
        
        // 更新有效期
        if (parsedSecondaryBarcode.expiryDate) {
          this.$set(row, 'endTime', parsedSecondaryBarcode.expiryDate);
        }
        
        // 更新批号
        if (parsedSecondaryBarcode.batchNo) {
          this.$set(row, 'batchNo', parsedSecondaryBarcode.batchNo);
          this.$set(row, 'batchNumber', parsedSecondaryBarcode.batchNo);
        }
        
        // 更新序列号
        if (parsedSecondaryBarcode.serialNo) {
          this.$set(row, 'serialNo', parsedSecondaryBarcode.serialNo);
        }
      });
      
      // 强制更新表格
      this.$nextTick(() => {
        if (this.$refs.gzOrderEntry) {
          this.$refs.gzOrderEntry.doLayout();
        }
      });
      
      // 清空辅助条码输入框
      this.form.ftm = "";
      
      // 提示成功
      this.$modal.msgSuccess("辅助条码维护成功");
    },
    /** 解析辅助条码字符串 */
    parseSecondaryBarcode(secondaryBarcodeString) {
      if (!secondaryBarcodeString || typeof secondaryBarcodeString !== 'string') {
        return {
          secondaryBarcode: '',
          productionDate: '',
          expiryDate: '',
          batchNo: '',
          serialNo: ''
        };
      }
      
      secondaryBarcodeString = this.toHalfWidth(secondaryBarcodeString).trim();
      const result = {
        secondaryBarcode: secondaryBarcodeString, // 完整的辅助条码字符串
        productionDate: '',   // (11)后面的生产日期
        expiryDate: '',       // (17)后面的有效期
        batchNo: '',          // (10)后面的批号
        serialNo: ''          // (21)后面的序列号
      };
      
      // 提取(11)生产日期，格式：(11)230515 -> 2023-05-15
      const prodMatch = secondaryBarcodeString.match(/\(11\)(\d{6})/);
      if (prodMatch) {
        const dateStr = prodMatch[1];
        const year = '20' + dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const day = dateStr.substring(4, 6);
        result.productionDate = `${year}-${month}-${day}`;
      }
      
      // 提取(17)有效期，格式：(17)251230 -> 2025-12-30
      const expMatch = secondaryBarcodeString.match(/\(17\)(\d{6})/);
      if (expMatch) {
        const dateStr = expMatch[1];
        const year = '20' + dateStr.substring(0, 2);
        const month = dateStr.substring(2, 4);
        const day = dateStr.substring(4, 6);
        result.expiryDate = `${year}-${month}-${day}`;
      }
      
      // 提取(10)批号
      const batchMatch = secondaryBarcodeString.match(/\(10\)([^\(]+)/);
      if (batchMatch) {
        result.batchNo = batchMatch[1].trim();
      }
      
      // 提取(21)序列号
      const serialMatch = secondaryBarcodeString.match(/\(21\)([^\(]+)/);
      if (serialMatch) {
        result.serialNo = serialMatch[1].trim();
      }
      
      return result;
    }
    ,getList() {
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
      
      const params = this.normalizeQueryDateTime(this.queryParams);
      listOrder(params).then(response => {
        console.log('查询响应:', response);
        this.orderList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        console.log('查询结果数量:', this.orderList.length, '总条数:', this.total);
        // 调试：打印总金额信息
        if (this.orderList && this.orderList.length > 0) {
          console.log('查询结果中的总金额:', this.orderList.map(row => ({
            orderNo: row.orderNo,
            totalAmt: row.totalAmt
          })));
        } else if (this.total > 0) {
          console.warn('警告：总条数为', this.total, '但rows为空数组，可能是分页参数问题');
          console.warn('完整响应:', JSON.stringify(response, null, 2));
        }
        // 强制更新表格
        this.$nextTick(() => {
          if (this.$refs.orderTable) {
            this.$refs.orderTable.doLayout();
          }
        });
      }).catch(error => {
        console.error('查询失败:', error);
        this.orderList = [];
        this.total = 0;
        this.loading = false;
        this.$modal.msgError('查询失败：' + (error.message || '未知错误'));
      });
    },
    checkMaterialBtn() {
      if(!this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.supplierValue = this.form.supplerId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {
        let obj = {};
        obj.materialId = item.id;
        obj.material = item; // 保存完整的物料对象，方便访问嵌套属性
        obj.materialName = item.name || ""; // 保存耗材名称
        obj.materialCode = item.code || ""; // 保存耗材编码
        obj.speci = item.speci || ""; // 保存规格
        obj.model = item.model || ""; // 保存型号
        obj.unit = item.unit || item.fdUnit || null; // 保存单位
        obj.factoryName = (item.fdFactory && item.fdFactory.factoryName) || ""; // 保存生产厂家
        obj.warehouseCategoryName = (item.fdWarehouseCategory && item.fdWarehouseCategory.warehouseCategoryName) || ""; // 保存库房分类
        obj.financeCategoryName = (item.fdFinanceCategory && item.fdFinanceCategory.financeCategoryName) || ""; // 保存财务分类
        obj.qty = "1"; // 默认数量为1
        // 设置价格：优先使用item.price
        obj.price = item.price || 0;
        // 自动计算金额：数量 * 价格
        obj.amt = (obj.qty && obj.price) ? (parseFloat(obj.qty) * parseFloat(obj.price)).toFixed(2) : "0.00";
        obj.batchNo = "";
        obj.batchNumber = "";
        obj.beginTime = "";
        obj.endTime = "";
        obj.serialNo = "";
        obj.remark = "";
        obj.masterBarcode = item.udiNo || ""; // UDI码赋值给masterBarcode字段用于显示
        obj.secondaryBarcode = "";
        obj.udiNo = item.udiNo || ""; // 保存UDI码
        obj.supplierId = this.form.supplerId || item.supplierId || (item.supplier && item.supplier.id) || null;
        this.gzOrderEntryList.push(obj);
      });
    },
    //当天日期
    getOrderDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + month + "-" + day;
    },
    // 取消按钮
    cancel() {
      if (this.guardUnsavedThenStop()) {
        return;
      }
      this.open = false;
      this.reset();
      // 重置仓库自动填充状态
      this.warehouseAutoFilled = false;
      this.pendingMaterialData = null;
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        orderNo: null,
        supplerId: null,
        orderDate: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        auditBy: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        masterBarcode: null,
        secondaryBarcode: null

      };
      this.gzOrderEntryList = [];
      this.resetForm("form");
      this.markSnapshotSaved();
      // 重置仓库自动填充状态
      this.warehouseAutoFilled = false;
      this.pendingMaterialData = null;
    },
    /** 数量列仅允许数字（替代原原生 onkeyup 过滤） */
    onQtyCellInput(row, val) {
      const digits = String(val != null ? val : '').replace(/\D/g, '');
      if (String(row.qty) !== digits) {
        row.qty = digits;
      }
      this.qtyChange(row);
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
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
    //价格改变事件
    priceChange(row){
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
      this.queryParams.timeField = "createTime";
      // 重置后保持orderType，根据路由判断是出库还是入库
      this.setOrderTypeByRoute();
      this.handleQuery();
    },
    normalizeQueryDateTime(query) {
      const params = { ...query };
      params.timeField = params.timeField || "createTime";
      params.beginDate = this.normalizeDateTimeValue(params.beginDate, false);
      params.endDate = this.normalizeDateTimeValue(params.endDate, true);
      return params;
    },
    normalizeDateTimeValue(value, isEnd) {
      if (!value) return value;
      if (typeof value !== "string") return value;
      const trimVal = value.trim();
      if (!trimVal) return trimVal;
      if (trimVal.length === 10 && trimVal.indexOf(" ") === -1) {
        return `${trimVal} ${isEnd ? "23:59:59" : "00:00:00"}`;
      }
      return trimVal;
    },
    getStatDate(){
      // 返回当前日期前5天的日期
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5); // 减去5天
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year.toString() + "-" + month + "-" + day + " 00:00:00";
      return statDate;
    },
    getEndDate(){
      // 返回当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year.toString() + "-" + month + "-" + day + " 23:59:59";
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
      getOrder(id).then(response => {
        this.form = response.data;
        delete this.form.creatorName;
        delete this.form.auditorName;
        this.normalizeHeaderDisplayFields(row);
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        this.applyMaterialListToGzOrderEntries(response.data);
        this.markSnapshotSaved();
        this.open = true;
        this.action = false;
        this.form.orderStatus = '1';
        this.form.orderType = '101';
        this.title = "查看高值备货入库";
      });
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    /** 根据用户ID或登录名解析展示姓名（与后端 createBy/auditBy/updateBy 存储一致） */
    resolveSysUserDisplayName(rawKey) {
      if (rawKey === null || rawKey === undefined || rawKey === '') {
        return '';
      }
      const key = String(rawKey).trim();
      const list = this.userOptions || [];
      // 后端存的是用户ID（纯数字）时必须先按 userId 匹配，否则 userName 与数字串相同会误命中他人（保存后制单人错）
      const isNumericId = /^\d+$/.test(key);
      let user = null;
      if (isNumericId) {
        user = list.find(u => String(u.userId) === key || u.userId == key);
      }
      if (!user) {
        user = list.find(u =>
          String(u.userName) === key ||
          (u.nickName != null && String(u.nickName) === key)
        );
      }
      if (user) {
        return user.nickName || user.userName || key;
      }
      return key;
    },
    /** 获取制单人姓名 */
    getCreatorName(row) {
      if (!row || !row.createBy) {
        return '';
      }
      return this.resolveSysUserDisplayName(row.createBy);
    },
    /** 获取审核人姓名（优先 audit_by，兼容历史数据 update_by） */
    getAuditorName(row) {
      if (!row) {
        return '';
      }
      const auditKey =
        row.auditBy != null && String(row.auditBy).trim() !== '' ? row.auditBy : row.updateBy;
      if (!auditKey) {
        return '';
      }
      return this.resolveSysUserDisplayName(auditKey);
    },
    /** 格式化日期，如果时分秒是00:00:00则使用createTime或updateTime的时分秒 */
    formatOrderDate(dateStr, timeStr) {
      // 列表场景优先显示 createTime / updateTime，确保到时分秒
      if (timeStr) {
        const fullTime = parseTime(timeStr, '{y}-{m}-{d} {h}:{i}:{s}');
        if (fullTime) {
          return fullTime;
        }
      }
      if (dateStr) {
        return parseTime(dateStr, '{y}-{m}-{d} {h}:{i}:{s}') || '--';
      }
      return '--';
    },
    /** 格式化总金额 */
    formatTotalAmt(row) {
      // 优先使用后端返回的totalAmt字段
      if (row.totalAmt !== undefined && row.totalAmt !== null && row.totalAmt !== '') {
        return parseFloat(row.totalAmt).toFixed(2);
      }
      // 如果订单有明细列表，计算明细总金额
      if (row.gzOrderEntryList && row.gzOrderEntryList.length > 0) {
        let total = 0;
        row.gzOrderEntryList.forEach(entry => {
          const amt = parseFloat(entry.amt || 0);
          total += amt;
        });
        return total.toFixed(2);
      }
      return '0.00';
    },
    /** 从明细表格打印条码按钮操作 */
    handlePrintBarcodeFromDetail() {
      // 复用打印条码功能，使用当前表单数据
      if (!this.form.id) {
        this.$modal.msgWarning("请先保存订单后再打印条码");
        return;
      }
      const row = { id: this.form.id };
      this.handlePrintBarcode(row);
    },
    /** 打印对话框关闭处理 */
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
    /** 打印：跳转独立预览页（高值备货验收，与普通耗材入库单预览方式一致） */
    handlePrint(row) {
      if (!row || !row.id) {
        this.$modal.msgWarning('缺少单据信息，无法打印')
        return
      }
      const target = {
        path: '/print/gz-acceptance',
        query: {
          id: String(row.id),
          api: 'order',
          warehouseName: (row.warehouse && row.warehouse.name) || row.warehouseName || '',
          supplierName: (row.supplier && row.supplier.name) || row.supplierName || '',
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
    //组装打印信息
    getOrderDetail(row) {
      //查询详情
      return getOrder(row.id).then(response => {
        const details = response.data.gzOrderEntryList;
        const materiaDetails = response.data.materialList;
        const map = {};

        (materiaDetails || []).forEach(it => {
          map[it.id] = it;
        });

        let detailList = [], totalAmt = 0, totalQty = 0;

        details && details.forEach(item => {
          totalAmt += parseFloat(item.amt || 0);
          totalQty += parseFloat(item.qty || 0);

          const prod = map[item.materialId];

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
          });
        });

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
        };
      });
    },
    /** 打印条码按钮操作（不依赖备货库存数量：含 qty=0 的库存行 + 审核生成的院内码明细表兜底） */
    handlePrintBarcode(row) {
      const id = row.id;
      const loading = this.$loading({
        lock: true,
        text: '正在准备打印数据...',
        spinner: 'el-icon-loading',
        background: 'rgba(0, 0, 0, 0.7)'
      });

      getOrder(id).then(response => {
        const orderData = response.data;
        const entryList = orderData.gzOrderEntryList || [];
        const materialList = orderData.materialList || [];
        const warehouseId = orderData.warehouseId;

        if (entryList.length === 0) {
          loading.close();
          this.$modal.msgWarning("该订单没有明细数据，无法打印条码");
          return;
        }

        if (!warehouseId) {
          loading.close();
          this.$modal.msgWarning("该订单没有仓库信息，无法打印条码");
          return;
        }

        const materialMap = {};
        materialList.forEach(material => {
          materialMap[material.id] = material;
        });

        const batchNos = entryList.map(item => item.batchNo || item.batchNumber).filter(bn => bn);
        const materialIds = entryList.map(item => item.materialId).filter(mid => mid);
        
        // 先尝试使用订单号过滤查询
        const queryParams = {
          warehouseId: warehouseId,
          orderNo: orderData.orderNo, // 添加订单号过滤
          includeZeroQty: true, // 库存为 0 仍可补打条码
          pageNum: 1,
          pageSize: 10000
        };

        const loadInventory = () =>
          listDepotInventory(queryParams).then(invResponse => {
            let inventoryList = invResponse.rows || [];
            if (inventoryList.length === 0 && batchNos.length > 0) {
              console.log('使用订单号过滤未找到库存，尝试不使用订单号过滤查询');
              return listDepotInventory({
                warehouseId: warehouseId,
                includeZeroQty: true,
                pageNum: 1,
                pageSize: 10000
              }).then(secondResponse => secondResponse.rows || []);
            }
            return inventoryList;
          });

        const loadOrderCodeRows = () =>
          listOrderInhospitalcode(id).then(codeRes => {
            const d = codeRes.data;
            return Array.isArray(d) ? d : [];
          });

        return Promise.all([loadInventory(), loadOrderCodeRows()]).then(([inventoryList, orderCodeRows]) => {
          const appendCode = (map, batchNo, materialId, code) => {
            if (!batchNo || !materialId || !code) return;
            const key = `${batchNo}_${materialId}`;
            if (!map[key]) map[key] = [];
            map[key].push(code);
          };

          console.log('查询到的库存记录数:', inventoryList.length);
          console.log('订单明细中的批次号列表:', batchNos);
          console.log('订单明细中的物料ID列表:', materialIds);
          
          // 构建批次号和物料ID组合键到院内码列表的映射
          // 同时支持 batchNo 和 batchNumber 字段
          const keyToInHospitalCodes = {};
          inventoryList.forEach(inv => {
            if (inv.inHospitalCode && inv.materialId) {
              appendCode(keyToInHospitalCodes, inv.batchNo || inv.batchNumber, inv.materialId, inv.inHospitalCode);
            }
          });
          (orderCodeRows || []).forEach(row => {
            appendCode(keyToInHospitalCodes, row.batchNo || row.batchNumber, row.materialId, row.inHospitalCode);
          });

          const allBarcodesToPrint = [];
          entryList.forEach((item) => {
            const material = materialMap[item.materialId] || {};
            const batchNo = item.batchNo || item.batchNumber;
            const materialId = item.materialId;
            const qty = parseInt(item.qty) || 0;

            if (!batchNo) {
              this.$modal.msgWarning(`物料 ${item.materialName || material.name || materialId} 没有批次号，无法打印条码`);
              return;
            }

            if (!materialId) {
              this.$modal.msgWarning(`批次号 ${batchNo} 没有物料ID，无法打印条码`);
              return;
            }

            const key = `${batchNo}_${materialId}`;
            const inHospitalCodes = keyToInHospitalCodes[key] || [];
            const codesToPrint = inHospitalCodes.slice(0, qty);

            if (codesToPrint.length === 0) {
              this.$modal.msgWarning(`批次号 ${batchNo} 没有找到院内码，无法打印条码`);
              return;
            }

            codesToPrint.forEach((inHospitalCode) => {
              allBarcodesToPrint.push({
                inHospitalCode: inHospitalCode,
                materialName: item.materialName || material.name || '',
                batchNumber: item.batchNumber || '',
                price: item.price ? parseFloat(item.price).toFixed(2) : '',
                endTime: item.endTime || '',
                speci: material.speci || '',
                factoryName: (material.fdFactory && material.fdFactory.factoryName) ? material.fdFactory.factoryName : ''
              });
            });
          });

          if (allBarcodesToPrint.length === 0) {
            loading.close();
            this.$modal.msgWarning("没有找到可打印的条码");
            return;
          }

          loading.close();
          try {
            sessionStorage.setItem(GZ_BARCODE_SESSION_KEY, JSON.stringify({ list: allBarcodesToPrint }))
          } catch (e) {
            this.$modal.msgError('条码数据过大或浏览器禁止存储，无法打开预览')
            return
          }
          const target = {
            path: '/print/gz-barcode',
            query: { from: encodeURIComponent(this.$route.fullPath) }
          }
          const resolved = this.$router.resolve(target)
          this.$router.push(target).catch(() => {
            if (resolved && resolved.href) {
              window.location.href = resolved.href
            }
          })
        }).catch(() => {
          loading.close();
          this.$modal.msgError("查询条码数据失败");
        });
      }).catch(() => {
        loading.close();
        this.$modal.msgError("获取订单信息失败");
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加高值备货入库";
      this.form.orderStatus = '1';
      this.form.orderType = '101';
      // 与后端一致存用户ID；制单人展示用当前登录昵称
      const uid = this.$store.getters.userId;
      this.form.createBy = uid != null && uid !== '' ? String(uid) : (this.$store.state.user.name || '');
      this.form.creatorName = this.$store.getters.nickName || this.$store.state.user.name || '--';
      this.form.orderDate = this.getOrderDate();
      this.action = true;
      // reset() 内已打过快照，但默认值与明细子组件（仓库/供应商等）会在下一帧写入表头，
      // 若仍用旧快照会导致「未保存」误报；在 DOM 更新后再对齐一次基准快照。
      this.$nextTick(() => {
        this.$nextTick(() => {
          this.markSnapshotSaved();
        });
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data;
        delete this.form.creatorName;
        delete this.form.auditorName;
        this.normalizeHeaderDisplayFields(row);
        this.form.orderStatus = '1';
        this.form.orderType = '101';
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        this.applyMaterialListToGzOrderEntries(response.data);
        this.markSnapshotSaved();
        this.open = true;
        this.title = "修改高值入库";
        this.action = true;
      });
    },
    handleAuditOnly() {
      if (this.guardUnsavedThenStop()) {
        return;
      }
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存后再审核');
        return;
      }
      if (this.form.orderStatus == 2 || this.form.orderStatus == '2') {
        this.$modal.msgSuccess('当前单据已审核');
        return;
      }
      auditOrder({ id: this.form.id, orderType: 101 }).then(() => {
        this.$modal.msgSuccess('审核成功');
        return getOrder(this.form.id, 101);
      }).then((response) => {
        if (response && response.data) {
          this.form = { ...this.form, ...response.data };
          delete this.form.creatorName;
          delete this.form.auditorName;
          this.normalizeHeaderDisplayFields(this.form);
        } else {
          this.form.orderStatus = '2';
        }
        this.markSnapshotSaved();
        this.getList();
      });
    },
    handlePrintOnly() {
      if (this.guardUnsavedThenStop()) {
        return;
      }
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存后再打印');
        return;
      }
      if (!(this.form.orderStatus == 2 || this.form.orderStatus == '2')) {
        this.$modal.msgWarning('请先审核后再打印');
        return;
      }
      this.handlePrint(this.form);
    },
    /** 提交按钮 */
    submitForm() {
      // 检查仓库是否已选择
      if (!this.form.warehouseId) {
        this.$modal.msgWarning("请选择仓库");
        return;
      }
      
      // 检查供应商是否已选择
      if (!this.form.supplerId) {
        this.$modal.msgWarning("请选择供应商");
        return;
      }
      
      // 检查所有明细项的供应商是否一致
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        for (let i = 0; i < this.gzOrderEntryList.length; i++) {
          const entry = this.gzOrderEntryList[i];
          const materialSupplierId = entry.material && (entry.material.supplierId || (entry.material.supplier && entry.material.supplier.id));
          if (materialSupplierId && this.form.supplerId != materialSupplierId) {
            this.$modal.msgWarning(`第${i + 1}行的产品供应商与表单供应商不一致，请核对！`);
            return;
          }
        }
      }
      
      // 检查辅助条码是否为空
      const emptySecondaryBarcodeItems = [];
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        for (let i = 0; i < this.gzOrderEntryList.length; i++) {
          const item = this.gzOrderEntryList[i];
          if (!item.secondaryBarcode || item.secondaryBarcode.trim() === '') {
            emptySecondaryBarcodeItems.push({
              index: i + 1,
              materialName: item.materialName || '未知耗材'
            });
          }
        }
      }
      
      // 如果有空的辅助条码，提示用户
      if (emptySecondaryBarcodeItems.length > 0) {
        const materialNames = emptySecondaryBarcodeItems.map(item => `第${item.index}行：${item.materialName}`).join('\n');
        this.$confirm(
          `以下明细的辅助条码未维护：\n${materialNames}\n\n未维护辅助条码是否继续？`,
          '提示',
          {
            confirmButtonText: '继续',
            cancelButtonText: '取消',
            type: 'warning',
            dangerouslyUseHTMLString: false
          }
        ).then(() => {
          // 用户点击继续，执行保存
          this.doSubmit();
        }).catch(() => {
          // 用户点击取消，不执行任何操作
        });
        return;
      }
      
      // 如果没有空的辅助条码，直接保存
      this.doSubmit();
    },
    /** 执行保存操作 */
    doSubmit() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (!assertBillHasEntries(this.gzOrderEntryList, this, '请至少添加一条明细')) {
            return;
          }
          this.form.gzOrderEntryList = this.gzOrderEntryList;
          this.form.gzOrderEntryList = this.form.gzOrderEntryList.map(item => ({
            ...item,
            supplierId: this.form.supplerId || item.supplierId || null,
            warehouseId: this.form.warehouseId || item.warehouseId || null
          }));
          if (this.form.id != null) {
            const updatePayload = { ...this.form };
            delete updatePayload.createBy;
            delete updatePayload.createTime;
            delete updatePayload.creatorName;
            delete updatePayload.auditorName;
            updateOrder(updatePayload).then(response => {
              this.$modal.msgSuccess("保存成功");
              return getOrder(this.form.id, 101);
            }).then((detailResp) => {
              if (detailResp && detailResp.data) {
                this.form = { ...this.form, ...detailResp.data };
                delete this.form.creatorName;
                delete this.form.auditorName;
                this.gzOrderEntryList = detailResp.data.gzOrderEntryList || this.gzOrderEntryList;
                this.applyMaterialListToGzOrderEntries(detailResp.data);
                this.normalizeHeaderDisplayFields(this.form);
              }
              this.markSnapshotSaved();
              // 保存后不关闭页面，继续操作
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess("保存成功");
              // 保存后不关闭页面，继续操作
              // 更新表单ID，以便后续修改
              const maybeId = response && response.data
                ? (typeof response.data === 'object' ? response.data.id : response.data)
                : null;
              if (maybeId !== null && maybeId !== undefined && maybeId !== '') {
                this.form.id = maybeId;
                return getOrder(this.form.id, 101);
              }
              // 后端若未返回主键ID，避免请求 /gz/order/undefined
              return null;
            }).then((detailResp) => {
              if (detailResp && detailResp.data) {
                this.form = { ...this.form, ...detailResp.data };
                delete this.form.creatorName;
                delete this.form.auditorName;
                this.gzOrderEntryList = detailResp.data.gzOrderEntryList || this.gzOrderEntryList;
                this.applyMaterialListToGzOrderEntries(detailResp.data);
                this.normalizeHeaderDisplayFields(this.form);
              }
              this.markSnapshotSaved();
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除高值入库编号为"' + ids + '"的数据项？').then(function() {
        return delOrder(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 审核按钮操作 */
    handleAudit() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据项");
        return;
      }
      // 检查选中的订单是否都是未审核状态
      const selectedOrders = this.orderList.filter(item => ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '1' && item.orderStatus !== 1);
      
      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能审核未审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }
      
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');
      this.$modal.confirm('确定要审核选中的 ' + ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        // 批量审核
        const auditPromises = ids.map(id => auditOrder({id: id}));
        
        Promise.all(auditPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + ids.length + " 个订单");
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      }).catch(() => {});
    },
    /** 批量打印按钮操作（仅支持已审核单据） */
    async handleBatchPrint() {
      const ids = this.ids;
      if (!ids || ids.length === 0) {
        this.$modal.msgWarning("请先选择要打印的数据项");
        return;
      }
      const selectedOrders = this.orderList.filter(item => ids.includes(item.id));
      const printableOrders = selectedOrders.filter(item => item.orderStatus === '2' || item.orderStatus === 2);
      if (printableOrders.length === 0) {
        this.$modal.msgWarning("仅已审核单据支持打印，请重新选择");
        return;
      }
      const skippedCount = selectedOrders.length - printableOrders.length;
      const orderNos = printableOrders.map(item => item.orderNo).join('、');
      const confirmText = skippedCount > 0
        ? `已选择 ${selectedOrders.length} 条，符合打印条件 ${printableOrders.length} 条（已忽略 ${skippedCount} 条未审核单据）。\n是否开始连续打印？\n单号：${orderNos}`
        : `确定连续打印选中的 ${printableOrders.length} 个订单吗？\n单号：${orderNos}`;
      try {
        await this.$modal.confirm(confirmText);
        for (let i = 0; i < printableOrders.length; i++) {
          this.handlePrint(printableOrders[i]);
          if (i < printableOrders.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
        }
        this.$modal.msgSuccess(`已触发连续打印，共 ${printableOrders.length} 条`);
      } catch (e) {
        // 用户取消确认时不提示错误
      }
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
      if (!this.checkedGzOrderEntry || this.checkedGzOrderEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        // 获取选中行的集合
        const selectedRows = this.checkedGzOrderEntry;
        this.gzOrderEntryList = this.gzOrderEntryList.filter(item => {
          return !selectedRows.includes(item);
        });
        // 清空选中状态
        this.checkedGzOrderEntry = [];
      }
    },
    /** 复选框选中数据 */
    handleGzOrderEntrySelectionChange(selection) {
      // 存储选中的行对象，而不是索引
      this.checkedGzOrderEntry = selection;
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = this.normalizeQueryDateTime(this.queryParams);
      this.download('gz/order/export', {
        ...params
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
  min-height: 95vh;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding-bottom: 16px;
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
  min-height: 40px;
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
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内顶部字段区：与到货验收 inWarehouse/audit 一致 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 8px 16px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  border: 1px solid #EBEEF5;
  flex-shrink: 0;
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

/* 弹窗内明细区 */
.local-modal-content .modal-detail-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  margin-top: 4px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.local-modal-content .modal-detail-section .detail-toolbar-row {
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 12px;
  padding-bottom: 12px;
  box-sizing: border-box;
  flex-shrink: 0;
}

.local-modal-content .modal-detail-section .detail-toolbar-head {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  gap: 8px 12px;
}

.local-modal-content .modal-detail-section .detail-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
  flex: 1;
  min-width: 0;
}

.local-modal-content .modal-detail-section .detail-toolbar-title {
  font-weight: 600;
  color: #303133;
  flex-shrink: 0;
}

.local-modal-content .modal-detail-section .detail-print-barcode-btn {
  flex-shrink: 0;
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
  overflow-x: hidden;
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
.gz-order-apply-page {
  position: relative;
}

/* 搜索区域：与到货验收 inWarehouse-audit-page 完全一致 */
.gz-order-apply-page > .el-form.query-form-compact {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #c0c4cc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
}

.gz-order-apply-page > .el-form.query-form-compact .el-row {
  margin-bottom: 8px;
}

.gz-order-apply-page > .el-form.query-form-compact .el-row:last-child {
  margin-bottom: 0;
}

.gz-order-apply-page > .el-form.query-form-compact .el-form-item {
  margin-bottom: 0;
}

/* 第一行查询条件左对齐紧凑布局 */
.gz-order-apply-page > .el-form.query-form-compact .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.gz-order-apply-page > .el-form.query-form-compact .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.gz-order-apply-page > .el-form.query-form-compact .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.gz-order-apply-page > .el-form.query-form-compact .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.gz-order-apply-page > .el-form.query-form-compact .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.gz-order-apply-page > .el-form.query-form-compact .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.gz-order-apply-page > .el-form.query-form-compact .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 第二行单据状态对齐到仓库位置 */
.gz-order-apply-page > .el-form.query-form-compact .query-row-second {
  position: relative;
}

/* 第二行“单据状态”列：与到货验收页面保持同一水平对齐 */
.gz-order-apply-page > .el-form.query-form-compact .query-row-second .query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
}

/* 确保日期区间在同一行 */
.gz-order-apply-page > .el-form.query-form-compact .query-row-second .el-form-item {
  white-space: nowrap;
}

.gz-order-apply-page > .el-form.query-form-compact .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 与到货验收页面一致：顶部卡片与按钮行之间的缝隙 */
.gz-order-apply-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.gz-order-apply-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 6px;
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

/* 弹窗内明细表：表头、表体滚动、表尾与到货验收一致 */
::v-deep .local-modal-content .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

/* 明细表体：字号/字体与表体一致，单行省略（过长悬停由 el-tooltip 展示全文） */
::v-deep .local-modal-content .modal-detail-section .el-table td .cell {
  font-size: 14px;
  font-family: inherit;
  font-weight: 400;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table-column--selection .cell {
  overflow: visible;
  text-overflow: clip;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 6px;
  box-sizing: border-box;
  scrollbar-width: thin;
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

::v-deep .local-modal-content .modal-detail-section .el-table__footer-wrapper {
  position: relative;
  z-index: 10 !important;
  background-color: #fff !important;
  margin-top: 0;
  box-shadow: 0 -1px 0 #ebeef5;
  overflow-x: hidden !important;
  overflow-y: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper {
  z-index: 11 !important;
  background-color: #fff !important;
  overflow: visible !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper td {
  padding-top: 8px !important;
  padding-bottom: 10px !important;
  background-color: #fff !important;
}

::v-deep .local-modal-content {
  min-height: 95vh !important;
}

/* 列表主表（勿作用到弹窗内表） */
.gz-order-apply-page > .el-table.table-compact {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

.gz-order-apply-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.gz-order-apply-page > .el-table.table-compact td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.gz-order-apply-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

/* 明细弹窗内：无框输入/日期，默认透明居中，聚焦内阴影主色；单行 + 省略与表体一致 */
::v-deep .local-modal-content .modal-detail-section .gz-detail-tooltip-anchor {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
}

::v-deep .local-modal-content .modal-detail-section .gz-detail-line-clip {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: center;
}

::v-deep .local-modal-content .modal-detail-section .gz-qty-cell-input.el-input {
  width: 100%;
  max-width: 76px;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-tooltip-anchor .gz-qty-cell-input.el-input {
  max-width: 100%;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-input.el-input {
  width: 100%;
  max-width: 100%;
}
::v-deep .local-modal-content .modal-detail-section .gz-qty-cell-input .el-input__inner,
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-input .el-input__inner {
  border: none;
  background-color: transparent;
  text-align: center;
  padding: 0 4px;
  height: 28px;
  line-height: 28px;
  font-size: inherit;
  font-family: inherit;
  font-weight: 400;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
::v-deep .local-modal-content .modal-detail-section .gz-qty-cell-input .el-input__inner:focus,
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-input .el-input__inner:focus {
  outline: none;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #409eff;
  border-radius: 2px;
}
::v-deep .local-modal-content .modal-detail-section .gz-qty-cell-input.is-disabled .el-input__inner,
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-input.is-disabled .el-input__inner {
  border: none;
  background: transparent;
  color: #606266;
  cursor: default;
  box-shadow: none;
}

::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-date.el-date-editor.el-input {
  width: 100%;
  max-width: 130px;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-date.el-date-editor .el-input__inner {
  border: none;
  background-color: transparent;
  text-align: center;
  padding-left: 8px;
  padding-right: 28px;
  height: 28px;
  line-height: 28px;
  font-size: inherit;
  font-family: inherit;
  font-weight: 400;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  /* 只读日期框在部分浏览器会画出文本插入光标，表现为数字前一条黑竖线 */
  caret-color: transparent;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-date.el-date-editor .el-input__inner:focus {
  outline: none;
  background-color: #fff;
  box-shadow: inset 0 0 0 1px #409eff;
  border-radius: 2px;
  caret-color: transparent;
}
::v-deep .local-modal-content .modal-detail-section .gz-detail-cell-date.is-disabled.el-date-editor .el-input__inner {
  border: none;
  background: transparent;
  color: #606266;
  cursor: default;
  box-shadow: none;
  caret-color: transparent;
}

::v-deep .local-modal-content .modal-detail-section .gz-detail-tooltip-anchor .gz-detail-cell-date.el-date-editor.el-input {
  max-width: 100%;
}

::v-deep .json-cell {
  font-size: 12px;
  line-height: 1.4;
  word-break: break-all;
  white-space: normal;
}

.udi-scan-inline {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  width: 100%;
  max-width: 520px;
}

.udi-scan-inline-input {
  flex: 1;
  min-width: 0;
}

.udi-scan-mono ::v-deep textarea {
  font-family: Consolas, 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.45;
  word-break: break-all;
}

.udi-scan-hint {
  margin: -8px 0 0 88px;
  font-size: 12px;
  color: #909399;
  line-height: 1.5;
}

.udi-scan-hint-block {
  margin: 0 0 8px 0;
}

.udi-scan-preview-table {
  width: 100%;
}

::v-deep .udi-scan-verify-dialog .el-dialog__body {
  padding-top: 12px;
}

</style>

<style>
/* 与到货验收页面布局样式保持一致（非scoped确保生效） */
.app-container.gz-order-apply-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.gz-order-apply-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.gz-order-apply-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.gz-order-apply-page > .el-table.table-compact {
  margin-top: 0;
}

.app-container.gz-order-apply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

/* Element UI 2.x：无明细时默认隐藏合计行，强制显示表尾 */
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gz-order-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
</style>
