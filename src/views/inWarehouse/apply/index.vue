<template>
  <div class="app-container inWarehouse-apply-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo"
                      placeholder="入库单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="供应商" prop="supplerId" class="query-item-inline">
            <div class="query-select-wrapper">
            <SelectSupplier v-model="queryParams.supplerId"/>
            </div>
          </el-form-item>
          <el-form-item prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
            <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="24" class="query-row-second-inner">
          <el-form-item class="query-date-range-form-item query-item-inline">
            <el-radio-group v-model="queryParams.dateQueryType" size="small" style="margin-right: 10px; margin-bottom: 4px;">
              <el-radio-button label="bill">制单日期</el-radio-button>
              <el-radio-button label="audit">审核日期</el-radio-button>
            </el-radio-group>
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
          <el-form-item prop="billStatus" class="query-item-inline query-item-status">
            <el-select v-model="queryParams.billStatus" placeholder="单据状态"
                       clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
                         v-if="dict.label !== '待审核'"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="被引用状态" label-width="88px" class="query-item-inline query-item-doc-ref">
            <el-select v-model="queryParams.params.docRefStatus" clearable placeholder="全部" style="width: 150px">
              <el-option v-for="o in docRefStatusOptions" :key="o.value" :label="o.label" :value="o.value" />
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
          @click="handleAdd"
          v-hasPermi="['inWarehouse:apply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['inWarehouse:apply:export']"
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
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList" class="table-compact"
              :row-class-name="warehouseListIndex"
              @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border stripe>
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="入库单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'supplier.name')"/>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')"/>
      <el-table-column label="金额" align="center" prop="totalAmount" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="creater.nickName" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <!-- 使用 createTime 显示实际创建时间，包含时分秒 -->
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" min-width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="发票号" align="center" prop="invoiceNumber" width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.invoiceNumber || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发票日期" align="center" prop="invoiceTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.invoiceTime">{{ parseTime(scope.row.invoiceTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="打印状态" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.printDate" type="success" size="small">已打印</el-tag>
          <el-tag v-else type="info" size="small">未打印</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="打印人" align="center" prop="printPerson" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.printPerson || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="打印日期" align="center" prop="printDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.printDate">{{ parseTime(scope.row.printDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="引用单号" align="center" prop="refBillNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="被引用" align="center" prop="docRefStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.docRefStatus === 'NONE'" type="info" size="mini">未引用</el-tag>
          <el-tag v-else-if="scope.row.docRefStatus === 'PARTIAL'" type="warning" size="mini">部分引用</el-tag>
          <el-tag v-else-if="scope.row.docRefStatus === 'FULL'" type="success" size="mini">全部引用</el-tag>
          <span v-else>—</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['inWarehouse:apply:edit']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['inWarehouse:apply:remove']"
              v-if="scope.row.billStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row,true)"
              v-if="scope.row.billStatus == 2"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleShowEntryChangeLog(scope.row)"
              v-hasPermi="['inWarehouse:apply:query']"
            >变更记录</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改入库对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

        <div class="form-fields-container">
        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="单据号" prop="billNo" class="form-item-header-billno">
              <el-input v-model="form.billNo" :disabled="true" :title="form.billNo || ''" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="供应商" prop="supplerId" class="form-item-header-wide">
              <el-input
                v-if="isHeaderSupplierReadonly"
                type="textarea"
                :autosize="{ minRows: 1, maxRows: 2 }"
                :value="supplierHeaderDisplayName"
                disabled
                class="header-field-textarea"
              />
              <SelectSupplier v-else v-model="form.supplerId" class="header-field-select-wide"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :value2="stkIoBillEntryList.length > 0" :excludeWarehouseType="['高值', '设备']"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" placeholder="发票号" />
            </el-form-item>
          </el-col>
          <el-col v-if="!action" :span="3">
            <el-form-item label="制单人">
              <el-input
                :value="(form.creater && (form.creater.nickName || form.creater.userName)) || form.createrName || '--'"
                disabled
              />
            </el-form-item>
          </el-col>
          <el-col :span="action ? 6 : 3">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-date-picker clearable
                              v-model="form.invoiceTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              style="width: 100%"
                              placeholder="发票时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="form.proPerson"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="form.delPerson" placeholder="配送员" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="form.telephone" placeholder="联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="form.invoiceAmount" placeholder="发票金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用采购订单号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" v-show="action" class="delivery-scan-toolbar-row">
          <el-col :span="7">
            <el-form-item label="引用配送单" label-width="92px" class="delivery-ref-form-item" :title="deliveryRefBlockTitle">
              <el-input
                v-model="deliveryRefKeyword"
                placeholder="配送单号/配送单输入码"
                clearable
                :disabled="deliveryRefBlocked"
                @keyup.enter.native="handleRefDeliverySubmit"
              >
                <el-button slot="append" icon="el-icon-search" :disabled="deliveryRefBlocked" @click="handleRefDeliverySubmit">引用</el-button>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="7">
            <el-form-item label="扫描条码" label-width="80px" class="detail-scan-form-item">
              <el-input
                ref="scanBarcodeInputRef"
                v-model="scanBarcodeInput"
                placeholder="扫码或输入条码后回车"
                title="请用扫码枪扫描或键盘输入条码后回车，自动解析主/辅条码并匹配产品档案"
                clearable
                size="small"
                class="scan-barcode-input"
                @keyup.enter.native="onScanBarcodeSubmit"
              >
                <template slot="prepend">
                  <i class="el-icon-s-operation"></i>
                </template>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="科室" prop="departmentId" label-width="52px" class="inbound-dept-form-item">
              <SelectDepartment v-model="form.departmentId" clearable style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

<!--        <el-divider content-position="left">入库明细信息</el-divider>-->
        <div class="modal-detail-section">
        <el-row :gutter="10" class="detail-toolbar-row">
          <el-col :span="1.5">
            <span>入库明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
  <!--            <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddStkIoBillEntry">添加</el-button>-->
              <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="outline" icon="el-icon-ref" size="small" @click="refDingdan">引用采购订单</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm">保 存</el-button>
            </el-col>
            <el-col v-if="isZqTenant" :span="1.5">
              <el-button
                type="primary"
                size="small"
                :disabled="!form.id || String(form.billStatus) === '2'"
                @click="handleModalAudit"
                v-hasPermi="['inWarehouse:apply:audit']"
              >审核</el-button>
            </el-col>
          </div>

        </el-row>
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummariesWithRefresh"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" fixed="left" />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable sortable/>
          <!-- 主条码、辅条码列隐藏（数据仍可通过顶部扫描条码写入，如需恢复可取消注释） -->
          <!--
          <el-table-column label="主条码" align="center" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.mainBarcode" placeholder="主条码(udi)"
                        size="small" clearable
                        @blur="onMainBarcodeBlur(scope.row)">
              </el-input>
            </template>
          </el-table-column>
          <el-table-column label="辅条码" align="center" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.subBarcode" placeholder="辅条码" size="small" clearable />
            </template>
          </el-table-column>
          -->
          <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
          </el-table-column>
          <!-- 耗材列隐藏 -->
          <!--<el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>-->

          <el-table-column
            label="名称"
            align="left"
            header-align="center"
            width="180"
            min-width="140"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.name) || '--'"
              >{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="规格"
            align="left"
            header-align="center"
            width="130"
            min-width="110"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.speci) || '--'"
              >{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" min-width="80" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" align="center" prop="qty" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <!--              <el-input v-model="scope.row.qty" type='number' :min="1"-->
              <!--                        @input="qtyChange(scope.row)"-->
              <!--                        placeholder="数量" />-->
              <div style="text-align: center;">
                <el-input
                  clearable
                  v-model="scope.row.qty"
                  placeholder="数量"
                  onkeyup="value=value.replace(/\D/g,'')"
                  onafterpaste="value=value.replace(/\D/g,'')"
                  @blur="form.result=$event.target.value"
                  @input="qtyChange(scope.row)"
                  size="small"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="价格" align="center" prop="unitPrice" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <div style="text-align: center;">
                <el-input v-model="scope.row.unitPrice"
                          type='number'
                          :disabled="true"
                          @input="priceChange(scope.row)"
                          placeholder="价格"
                          size="small"
                          style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column label="金额" align="center" prop="amt" width="100" min-width="90" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <div style="text-align: center;">
                <el-input v-model="scope.row.amt" :disabled="true" placeholder="金额" size="small" style="width: 100%"/>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="批号"
            align="center"
            prop="batchNumber"
            width="140"
            min-width="120"
            :show-overflow-tooltip="false"
            class-name="detail-col-batch"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-batch-wrap">
                <el-input
                  v-model="scope.row.batchNumber"
                  type="textarea"
                  :autosize="{ minRows: 1, maxRows: 2 }"
                  placeholder="批号"
                  size="small"
                  class="detail-batch-textarea"
                  style="width: 100%"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="有效期"
            align="center"
            prop="endTime"
            width="190"
            min-width="170"
            :show-overflow-tooltip="false"
            class-name="detail-col-date"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <div class="detail-cell-edit-wrap detail-expiry-wrap">
                <el-date-picker
                  clearable
                  v-model="scope.row.endTime"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerEndTimeOptions"
                  placeholder="有效期"
                  size="small"
                  :disabled="!!scope.row._longTerm"
                  class="detail-date-expiry"
                  style="width: 100%"
                  @blur="onDetailDateBlur(scope.row, 'endTime', $event)"
                  @change="onDetailEndTimeChange(scope.row, $event)"
                />
                <el-checkbox
                  v-model="scope.row._longTerm"
                  class="detail-long-term-check"
                  @change="onLongTermChange(scope.row)"
                >长期</el-checkbox>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="beginTime" width="120" min-width="110" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <div style="text-align: center;">
                <el-date-picker
                  clearable
                  v-model="scope.row.beginTime"
                  type="date"
                  value-format="yyyy-MM-dd"
                  :picker-options="pickerBeginTimeOptions"
                  placeholder="生产日期"
                  size="small"
                  class="detail-input-compact"
                  @blur="onDetailDateBlur(scope.row, 'beginTime', $event)"
                  @change="onDetailBeginTimeChange(scope.row, $event)"
                />
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="型号"
            align="left"
            header-align="center"
            width="120"
            min-width="100"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.model) || '--'"
              >{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="已引用" align="center" prop="srcRefedQty" width="72" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefedQty != null ? scope.row.srcRefedQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="可引用" align="center" prop="srcRefableQty" width="72" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.srcRefableQty != null ? scope.row.srcRefableQty : '—' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="批次号"
            align="center"
            prop="batchNo"
            width="200"
            min-width="160"
            :show-overflow-tooltip="false"
            class-name="detail-col-batch-no"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-batch-no-cell"
                :title="scope.row.batchNo || ''"
              >{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column
            label="生产厂家"
            align="left"
            header-align="center"
            width="180"
            min-width="150"
            :show-overflow-tooltip="false"
            class-name="detail-col-text-wrap"
            resizable
            sortable
          >
            <template slot-scope="scope">
              <span
                class="detail-text-cell-2line"
                :title="(scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--'"
              >{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="140" show-overflow-tooltip resizable sortable>
            <template slot-scope="scope">
              <div style="text-align: center;">
                <el-input v-model="scope.row.remark" placeholder="备注" size="small" class="detail-input-compact" />
              </div>
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

    <!-- 3、使用组件 -->
    <SelectMaterialFilter
      v-show="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      :warehouseValue="form.warehouseId"
      :useStkInventory="true"
      :useFixedNumberMaterialArchive="true"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>

    <SelectDingdan
      v-show="DialogDingdanComponentShow"
      :DialogComponentShow="DialogDingdanComponentShow"
      :warehouseValue="warehouseValue"
      :departmentValue="departmentValue"
      :supplierValue="supplierValue"
      :materialValue="materialValue"
      @closeDialog="closeDingdanDialog"
      @selectData="selectDingdanData"
    ></SelectDingdan>

    <!-- 打印对话框 -->
    <el-dialog :visible.sync="modalObj.show" :title="modalObj.title" :width="modalObj.width" @close="handlePrintDialogClose">
      <template v-if="modalObj.component === 'print-type'">
        <el-radio-group v-model="modalObj.form.value">
          <el-radio :label="2">浏览器打印</el-radio>
        </el-radio-group>
      </template>
      <template v-if="modalObj.form.value === 2 || modalObj.component === 'window-print-preview'">
        <order-print v-if="modalObj.form.row" :row="modalObj.form.row" ref="receiptOrderPrintRef"></order-print>
      </template>
      <template slot="footer" class="dialog-footer">
        <el-button @click="handlePrintDialogClose">取消</el-button>
        <el-button @click="modalObj.ok" type="primary">确认</el-button>
      </template>
    </el-dialog>

    <el-dialog title="明细变更记录" :visible.sync="entryChangeLogDialog.visible" width="980px" append-to-body>
      <el-table v-loading="entryChangeLogDialog.loading" :data="entryChangeLogDialog.list" border stripe max-height="460">
        <el-table-column label="变更时间" prop="changeTime" width="180" />
        <el-table-column label="操作人" prop="operator" width="120" />
        <el-table-column label="动作" prop="actionType" width="90" />
        <el-table-column label="变更前" min-width="240">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.beforeJson) }}</span>
            <el-button type="text" size="mini" @click="showJsonDetail('变更前 JSON', scope.row.beforeJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="变更后" min-width="240">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.afterJson) }}</span>
            <el-button type="text" size="mini" @click="showJsonDetail('变更后 JSON', scope.row.afterJson)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="760px" append-to-body>
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
    </el-dialog>

    <el-dialog title="选择配送单" :visible.sync="deliveryMatchDialog.visible" width="900px" append-to-body>
      <el-table
        v-loading="deliveryMatchDialog.loading"
        :data="deliveryMatchDialog.list"
        border
        stripe
        max-height="420"
        @row-dblclick="handleDeliveryRowDblClick"
      >
        <el-table-column label="配送单号" prop="deliveryNo" min-width="220" />
        <el-table-column label="订单号" prop="orderNo" min-width="180" />
        <el-table-column label="供应商" prop="supplierName" min-width="180" />
        <el-table-column label="医院" prop="hospitalName" min-width="180" />
        <el-table-column label="状态" prop="deliveryStatus" width="110" />
        <el-table-column label="创建时间" prop="createTime" min-width="170" />
        <el-table-column label="操作" width="90" align="center">
          <template slot-scope="scope">
            <el-button type="text" size="small" :disabled="deliveryRefBlocked" :title="deliveryRefBlockTitle" @click="handlePickDelivery(scope.row)">选择</el-button>
          </template>
        </el-table-column>
      </el-table>
      <template slot="footer">
        <el-button @click="deliveryMatchDialog.visible = false">取消</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { listWarehouse, getInWarehouse, delWarehouse, addWarehouse, updateWarehouse, auditWarehouse, createRkEntriesByDingdan, queryZsDelivery, createRkEntriesByDeliveryNo, listEntryChangeLog } from "@/api/warehouse/warehouse";
import { getMaterialByMainBarcode, jxTm } from "@/api/foundation/material";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';
import SelectDingdan from '@/components/SelectModel/SelectDingdan';
import orderPrint from "@/views/inWarehouse/audit/orderPrint";
import { buildInboundPrintRowFromDetail } from '@/views/inWarehouse/audit/inboundPrintRow'
import {STOCK_IN_TEMPLATE} from '@/utils/printData'
import { DOC_REF_STATUS_OPTIONS } from '@/utils/docRefStatus'
import {
  assertBillHasActiveEntriesForAudit,
  assertInboundBillEntriesHaveBatchAndExpiry,
  assertInboundBillEntryDatesValid
} from '@/utils/billEntryValidate'
import { ZQ_TCM_TENANT } from '@/utils/msunHis'
import { normalizeCompactDateInput, readDatePickerInputValue, isValidYmd } from '@/utils/compactDateInput'

export default {
  name: "Apply",
  dicts: ['biz_status','bill_type','way_status'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectMaterialFilter,SelectDingdan,orderPrint},
  data() {
    return {
      docRefStatusOptions: DOC_REF_STATUS_OPTIONS,
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      DialogDingdanComponentShow: false,
      supplierValue: "",
      warehouseValue: "",
      departmentValue: "",
      materialValue: "",
      isShow: true,
      // 打印对话框（与入库审核页面初始化一致）
      modalObj: {
        title: '选择打印方式',
        width: '520px',
        component: null,
        form: {
          value: null,
          row: null
        },
        ok: () => {
        },
        cancel: () => {
        },
        show: false
      },
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoBillEntry: [],
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
      // 入库表格数据
      warehouseList: [],
      stkMaterialList: [],
      // 入库明细表格数据
      stkIoBillEntryList: [],
      /** 仅用于触发 el-table 合计行随明细 qty/amt 等变更重新渲染（summary-method 对嵌套变更有时不重算） */
      detailSummaryTick: 0,
      // 扫描条码输入框（与引用配送单同一行，表头区）
      scanBarcodeInput: "",
      // 引用配送单关键字（配送单号/输入码）
      deliveryRefKeyword: "",
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      entryChangeLogDialog: {
        visible: false,
        loading: false,
        list: []
      },
      jsonViewer: {
        visible: false,
        title: '',
        content: ''
      },
      deliveryMatchDialog: {
        visible: false,
        loading: false,
        list: []
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        sortScene: 'apply',
        dateQueryType: 'bill',
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        params: {}
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "入库类型不能为空", trigger: "change" }
        ],
      },
      _lastSidebarNavTick: null
    };
  },
  computed: {
    /** 明细表高度：为弹窗标题、三行主表表单、工具栏与合计行预留空间 */
    detailTableHeight() {
      return 'max(240px, calc(100vh - 420px))';
    },
    /** 已有入库明细时不允许引用配送单，避免表头与行数据错乱 */
    deliveryRefBlocked() {
      return Array.isArray(this.stkIoBillEntryList) && this.stkIoBillEntryList.length > 0;
    },
    deliveryRefBlockTitle() {
      return this.deliveryRefBlocked ? '已有入库明细时不可引用配送单，请先清空明细' : '';
    },
    /** 查看/已有明细时表头供应商只读展示（支持换行） */
    isHeaderSupplierReadonly() {
      return !this.action || (Array.isArray(this.stkIoBillEntryList) && this.stkIoBillEntryList.length > 0);
    },
    supplierHeaderDisplayName() {
      if (this.form && this.form.supplier && this.form.supplier.name) {
        return this.form.supplier.name;
      }
      return '';
    },
    /** 枣强县中医院：到货验收弹窗内可直接审核（其他租户仍走入库审核菜单） */
    isZqTenant() {
      const cid = this.$store.getters.customerId;
      return cid != null && String(cid).trim() === ZQ_TCM_TENANT;
    }
  },
  created() {
    this.getList(true);
  },
  watch: {
    open(val) {
      if (val) {
        this.$nextTick(() => {
          const t = this.$refs.stkIoBillEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    }
  },
  methods: {
    normalizeRoutePath(path) {
      if (!path) {
        return '';
      }
      const normalized = String(path).replace(/\\/g, '/');
      if (normalized.length > 1 && normalized.endsWith('/')) {
        return normalized.slice(0, -1);
      }
      return normalized;
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path);
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) {
        return;
      }
      if (nav.tick === this._lastSidebarNavTick) {
        return;
      }
      this._lastSidebarNavTick = nav.tick;
      this.resetPageFromSidebar();
    },
    resetPageFromSidebar() {
      this.DialogComponentShow = false;
      this.DialogDingdanComponentShow = false;
      this.modalObj.show = false;
      this.entryChangeLogDialog.visible = false;
      this.jsonViewer.visible = false;
      this.deliveryMatchDialog.visible = false;
      this.open = false;
      this.action = true;
      this.reset();
      this.queryParams.pageNum = 1;
      this.getList(true);
    },
    /** 包装合计：依赖 detailSummaryTick，确保改数量/金额/增删行后表尾数字会更新 */
    getSummariesWithRefresh(param) {
      void this.detailSummaryTick;
      return this.getSummaries(param);
    },
    refreshDetailSummary() {
      this.detailSummaryTick++;
      this.$nextTick(() => {
        const t = this.$refs.stkIoBillEntry;
        if (t && typeof t.doLayout === 'function') {
          t.doLayout();
        }
      });
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = columns.map(() => '');
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const prop = column.property;
        if (!prop) {
          return;
        }
        if (prop === 'qty') {
          const values = data.map(row => {
            const v = row[prop];
            if (v === '' || v == null) return NaN;
            return Number(v);
          });
          if (!values.every(v => isNaN(v))) {
            const total = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
            sums[index] = Number.isInteger(total) ? String(total) : total.toFixed(2);
          }
          return;
        }
        if (prop === 'unitPrice' || prop === 'amt') {
          const values = data.map(row => Number(row[prop]));
          if (!values.every(v => isNaN(v))) {
            const total = values.reduce((a, b) => a + (isNaN(b) ? 0 : b), 0);
            sums[index] = total.toFixed(2);
            if (prop === 'amt') {
              this.form.totalAmount = sums[index];
            }
          }
        }
      });
      return sums;
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 4){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] = sums[index].toFixed(2);
          }
        }
      });
      return sums;
    },
    /** 嵌套字段排序：按 path 如 'warehouse.name' 取值后比较 */
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    resolveChangeLogBillType() {
      return 'STK_IO_BILL_101';
    },
    jsonPreview(value) {
      if (!value) return '-';
      const s = String(value);
      return s.length > 80 ? s.slice(0, 80) + '...' : s;
    },
    prettyJson(value) {
      if (!value) return '';
      try {
        return JSON.stringify(JSON.parse(value), null, 2);
      } catch (e) {
        return String(value);
      }
    },
    showJsonDetail(title, value) {
      this.jsonViewer.title = title;
      this.jsonViewer.content = this.prettyJson(value);
      this.jsonViewer.visible = true;
    },
    handleShowEntryChangeLog(row) {
      const billId = row && row.id ? row.id : this.form.id;
      if (!billId) {
        this.$message.warning('请先保存单据后再查看变更记录');
        return;
      }
      this.entryChangeLogDialog.visible = true;
      this.entryChangeLogDialog.loading = true;
      listEntryChangeLog(this.resolveChangeLogBillType(), billId).then(res => {
        this.entryChangeLogDialog.list = (res && res.data) ? res.data : [];
      }).finally(() => {
        this.entryChangeLogDialog.loading = false;
      });
    },
    /** 查询入库列表；弹窗打开时默认不刷新（顶部标签切回保留当前编辑） */
    getList(allowWhenDialog) {
      if (this.open && !allowWhenDialog) {
        return;
      }
      this.loading = true;
      this.queryParams.billType = "101";
      // 如果 billStatus 为空字符串，转换为 null，确保查询所有状态
      if (this.queryParams.billStatus === '') {
        this.queryParams.billStatus = null;
      }
      // 处理截止日期，确保包含当天的所有数据（23:59:59）
      const queryParams = {
        ...this.queryParams
      };
      if (queryParams.endDate && queryParams.endDate.length === 10) {
        // 如果 endDate 只有日期部分（yyyy-MM-dd），添加时间部分为 23:59:59
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      // 与入库审核页面保持一致的查询逻辑
      listWarehouse(queryParams).then(response => {
        this.warehouseList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(error => {
        console.error('查询入库列表失败:', error);
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      if(!this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开"弹窗组件"
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

        // 从item中提取material对象，如果item本身是material，则直接使用
        const material = item.material || item;

        obj.materialId = material.id || item.id;
        obj.qty = "";
        // 设置价格：优先使用item.unitPrice，然后是item.price，最后是material.price
        obj.unitPrice = item.unitPrice || item.price || material.price || 0;
        obj.amt = "";
        obj.batchNo = "";
        obj.batchNumber = item.batchNumber || "";
        obj.beginTime = item.beginTime || "";
        obj.endTime = item.endTime || "";
        obj.mainBarcode = item.mainBarcode || "";
        obj.subBarcode = item.subBarcode || "";
        obj.barcodeInput = "";
        obj.remark = item.remark || "";
        // 确保material对象包含所有必要的关联数据
        obj.material = material;

        this.initRowLongTermFlag(obj);
        this.stkIoBillEntryList.push(obj);
      });
      this.refreshDetailSummary();
    },
    getStatDate(){
      // 获取前5天日期
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5); // 前5天
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year.toString() + "-" + month + "-" + day + " 00:00:00";
      return statDate;
    },
    getEndDate(){
      // 获取当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year.toString() + "-" + month + "-" + day + " 23:59:59";
      return endDate;
    },
    //当天日期
    getBillDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + month + "-" + day;
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
        billNo: null,
        refBillNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        delPerson: null,
        telephone: null,
        totalAmount: null,
        invoiceAmount: null,
        invoiceTime: null,
        proPerson: null,
        remark: null,
        auditBy: null,
        createrName:null,
        auditPersonName:null,
        auditDate:null,
        deliveryRefWarehouseId: null,
        deliveryRefWarehouseName: null,
        deliveryRefSupplierId: null,
        deliveryRefSupplierName: null,
        deliveryRefDeptId: null,
        deliveryRefDeptName: null
      };
      this.deliveryRefKeyword = "";
      this.stkIoBillEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = Number(row.qty) * Number(row.unitPrice);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
      this.refreshDetailSummary();
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = Number(row.qty) * Number(row.unitPrice);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
      this.refreshDetailSummary();
    },
    /** 初始化/同步明细行的「长期」勾选状态：endTime 为 2099-01-01 时视为长期 */
    initRowLongTermFlag(row) {
      if (!row) return;
      const et = row.endTime != null ? String(row.endTime).trim() : "";
      this.$set(row, "_longTerm", et.startsWith("2099-01-01"));
    },
    /** 明细日期：支持 20260216 等紧凑输入自动识别为 yyyy-MM-dd */
    applyDetailDateField(row, field, rawValue) {
      if (!row || !field) return row ? row[field] : '';
      const s = String(rawValue == null ? '' : rawValue).trim();
      if (!s) {
        row[field] = '';
        return '';
      }
      const normalized = normalizeCompactDateInput(s);
      if (normalized && isValidYmd(normalized)) {
        if (normalized !== row[field]) {
          row[field] = normalized;
        }
        return normalized;
      }
      const digitsOnly = s.replace(/\D/g, '');
      if (/^\d{8}$/.test(digitsOnly)) {
        row[field] = '';
        return '';
      }
      if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(s) || /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(s)) {
        row[field] = '';
        return '';
      }
      return row[field];
    },
    onDetailDateBlur(row, field, e) {
      if (!row || (row._longTerm && field === 'endTime')) return;
      const raw = readDatePickerInputValue(e, row[field]);
      this.applyDetailDateField(row, field, raw);
      if (field === 'endTime') {
        this.onEndTimeManualChange(row);
      }
    },
    onDetailEndTimeChange(row, value) {
      if (!row || row._longTerm) return;
      this.applyDetailDateField(row, 'endTime', value);
      this.onEndTimeManualChange(row);
    },
    onDetailBeginTimeChange(row, value) {
      if (!row) return;
      this.applyDetailDateField(row, 'beginTime', value);
    },
    /** 切换「长期」勾选：勾选→写入 2099-01-01；取消且当前是 2099-01-01→清空 */
    onLongTermChange(row) {
      if (!row) return;
      if (row._longTerm) {
        row.endTime = "2099-01-01";
      } else if (String(row.endTime || "").trim().startsWith("2099-01-01")) {
        row.endTime = "";
      }
    },
    /** 手动选择有效期：与「长期」勾选状态保持一致 */
    onEndTimeManualChange(row) {
      if (!row) return;
      const et = String(row.endTime || "").trim();
      row._longTerm = et.startsWith("2099-01-01");
    },
    // 引用配送单：输入配送单号或输入码后查询接口，并生成入库明细
    async handleRefDeliverySubmit() {
      if (this.deliveryRefBlocked) {
        this.$message.warning('入库单已存在明细时不能引用配送单，请先清空明细');
        return;
      }
      const keyword = (this.deliveryRefKeyword || '').trim();
      if (!keyword) {
        this.$message.warning('请输入配送单号或配送单输入码');
        return;
      }
      queryZsDelivery({ keyword }).then(async response => {
        const list = (response && response.data) ? response.data : [];
        if (!Array.isArray(list) || list.length === 0) {
          this.$message.warning('未查询到匹配的配送单，请核对单号/输入码');
          return;
        }
        const exact = list.find(item => item && item.deliveryNo === keyword);
        if (exact) {
          await this.handlePickDelivery(exact);
          return;
        }
        if (list.length === 1) {
          await this.handlePickDelivery(list[0]);
          return;
        }
        this.deliveryMatchDialog.list = list;
        this.deliveryMatchDialog.visible = true;
        this.$message.info(`匹配到 ${list.length} 条配送单，请选择一条引用`);
      }).catch(() => {
        this.$message.error('查询配送单失败，请稍后重试');
      });
    },
    async handlePickDelivery(row) {
      if (this.deliveryRefBlocked) {
        this.$message.warning('入库单已存在明细时不能引用配送单，请先清空明细');
        return;
      }
      const deliveryNo = row && row.deliveryNo ? String(row.deliveryNo).trim() : '';
      if (!deliveryNo) {
        this.$message.warning('配送单号为空，无法引用');
        return;
      }
      this.deliveryMatchDialog.loading = true;
      this.form.refBillNo = deliveryNo;
      try {
        const loaded = await this.loadDeliveryEntries(deliveryNo);
        if (loaded) {
          this.deliveryMatchDialog.visible = false;
          this.$message.success('引用配送单成功，已生成入库明细');
        }
      } finally {
        this.deliveryMatchDialog.loading = false;
      }
    },
    handleDeliveryRowDblClick(row) {
      this.handlePickDelivery(row);
    },
    // 依据配送单号由后端生成入库明细
    async loadDeliveryEntries(deliveryNo) {
      let response;
      try {
        response = await createRkEntriesByDeliveryNo({ deliveryNo });
      } catch (e) {
        this.$message.error('引用配送单失败，请稍后重试');
        return false;
      }
      const data = response && response.data ? response.data : {};
      const entryList = data.stkIoBillEntryList || [];
      if (!entryList.length) {
        this.$message.warning('配送单无可生成的入库明细');
        return false;
      }
      entryList.forEach(r => this.initRowLongTermFlag(r));
      this.stkIoBillEntryList = entryList;
      this.form.refBillNo = data.refBillNo || deliveryNo;
      // 配送单表头强制覆盖已选值（无则清空，避免与配送单不一致）
      this.form.supplerId = (data.supplerId != null && data.supplerId !== '') ? data.supplerId : null;
      this.form.warehouseId = (data.warehouseId != null && data.warehouseId !== '') ? data.warehouseId : null;
      this.form.departmentId = (data.departmentId != null && data.departmentId !== '') ? data.departmentId : null;
      this.form.deliveryRefWarehouseId = data.deliveryRefWarehouseId || null;
      this.form.deliveryRefWarehouseName = data.deliveryRefWarehouseName || null;
      this.form.deliveryRefSupplierId = data.deliveryRefSupplierId || null;
      this.form.deliveryRefSupplierName = data.deliveryRefSupplierName || null;
      this.form.deliveryRefDeptId = data.deliveryRefDeptId || null;
      this.form.deliveryRefDeptName = data.deliveryRefDeptName || null;
      this.$nextTick(() => this.refreshDetailSummary());
      if (data.remark) {
        this.$message.warning(data.remark);
      }
      return true;
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.dateQueryType = 'bill';
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.params = this.queryParams.params || {};
      this.queryParams.params.docRefStatus = null;
      this.handleQuery();
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
      getInWarehouse(id).then(response => {
        const data = response.data;
        console.log('入库单详情数据:', data);
        console.log('明细列表原始数据:', data.stkIoBillEntryList);
        console.log('明细列表长度:', data.stkIoBillEntryList ? data.stkIoBillEntryList.length : 0);

        this.form = data;

        // 确保明细数据正确设置，包括 material 对象
        const entryList = (data.stkIoBillEntryList || []).map((item, index) => {
          console.log(`明细项 ${index}:`, item);
          console.log(`明细项 ${index} material 对象:`, item.material);
          // 确保 material 对象存在，如果不存在则尝试从其他字段构建
          if (!item.material && item.materialId) {
            // 如果 material 对象不存在，但 materialId 存在，保留原始数据
            // 后端应该已经加载了 material 对象，这里只是做保险处理
            console.warn(`明细项 ${index} 缺少 material 对象, materialId:`, item.materialId);
          }
          return item;
        });

        // 使用 Vue.set 确保响应式更新
        this.$set(this, 'stkIoBillEntryList', entryList);
        console.log('处理后的明细列表:', this.stkIoBillEntryList);
        console.log('处理后的明细列表长度:', this.stkIoBillEntryList.length);

        this.open = true;
        this.action = false;
        this.form.billStatus = '2';
        this.form.billType = '101';
        this.title = "查看入库";

        // 强制更新视图
        this.$nextTick(() => {
          console.log('视图更新后的明细列表:', this.stkIoBillEntryList);
          this.refreshDetailSummary();
        });
      }).catch(error => {
        console.error('获取入库单详情失败:', error);
        this.$modal.msgError('获取入库单详情失败');
      });
    },
    /** 打印对话框关闭处理 */
    handlePrintDialogClose() {
      this.modalObj.show = false
      // 重置 modalObj
      this.modalObj = {
        show: false,
        title: '',
        width: '',
        component: '',
        form: {},
        ok: () => {},
        cancel: () => {}
      }
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      // 与到货验收 audit 页一致：跳独立打印页（不再隐藏组件里直接 window.print）
      if (print === true) {
        if (!row || row.id == null) {
          this.$modal.msgWarning('缺少单据信息，无法打印')
          return
        }
        this.$router.push({
          path: '/print/inbound',
          query: {
            id: String(row.id),
            from: encodeURIComponent(this.$route.fullPath)
          }
        })
        return
      }
      // 否则显示选择打印方式的对话框
      this.modalObj = {
        show: true,
        title: '选择打印方式',
        width: '520px',
        component: 'print-type',
        form: {
          value: 1,
          row
        },
        ok: () => {
          this.modalObj.show = false
          if (this.modalObj.form.value === 1) {
            this.doPrintOut(row, false)
          } else {
            this.windowPrintOut(row, print)
          }
        },
        cancel: () => {
          this.modalObj.show = false
        }
      }
    },
    windowPrintOut(row, print) {
      this.getInWarehouseDetail(row).then(res => {
        if (print) {
          if (!row || row.id == null) {
            this.$modal.msgWarning('缺少单据信息，无法打印')
            return
          }
          this.$router.push({
            path: '/print/inbound',
            query: {
              id: String(row.id),
              from: encodeURIComponent(this.$route.fullPath)
            }
          })
          return
        }
        this.$nextTick(() => {
          this.modalObj = {
            show: true,
            title: '浏览器打印预览',
            width: '800px',
            component: 'window-print-preview',
            form: {
              value: 1,
              row: res,
              print
            },
            ok: () => {
              this.modalObj.show = false
            },
            cancel: () => {
              this.modalObj.show = false
            }
          }
        })
      })
    },
    doPrintOut(row, print) {
      this.getInWarehouseDetail(row).then(result => {
        if (print) {
          this.$lodop.print(STOCK_IN_TEMPLATE, [result])
        } else {
          this.$lodop.preview(STOCK_IN_TEMPLATE, [result])
        }
      })
    },
    //组装打印信息
    getInWarehouseDetail(row) {
      return getInWarehouse(row.id).then(response => {
        return buildInboundPrintRowFromDetail(row, response.data)
      })
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.billStatus = '1';
      this.form.billType = '101';
      //操作人
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
      this.form.createrName = userName;
      // 制单日期由后端自动设置为保存时间，无需前端设置
      this.title = "添加入库";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getInWarehouse(id).then(response => {
        this.form = response.data;
        this.form.billStatus = '1';
        this.form.billType = '101';
        const entries = response.data.stkIoBillEntryList || [];
        entries.forEach(r => this.initRowLongTermFlag(r));
        this.stkIoBillEntryList = entries;
        this.open = true;
        this.title = "修改入库";
        this.action = true;
        this.$nextTick(() => this.refreshDetailSummary());
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 检查明细列表是否为空
          if (!this.stkIoBillEntryList || this.stkIoBillEntryList.length === 0) {
            this.$modal.msgError("请添加明细！");
            return;
          }

          // 新增数量非空校验
          const hasEmptyQty = this.stkIoBillEntryList.some(item =>
            !item.qty || String(item.qty).trim() === ''
          );

          if (hasEmptyQty) {
            this.$modal.msgError("入库明细数量不能为空");
            return;
          }

          if (!assertInboundBillEntriesHaveBatchAndExpiry(this.stkIoBillEntryList, this, '保存')) {
            return;
          }

          if (!assertInboundBillEntryDatesValid(this.stkIoBillEntryList, this)) {
            return;
          }

          if (!this.form.createBy && this.$store.state.user && this.$store.state.user.userId) {
            this.form.createBy = this.$store.state.user.userId;
          }

          this.form.stkIoBillEntryList = this.stkIoBillEntryList;
          var totalAmt = 0;
          this.stkIoBillEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = totalAmt.toFixed(2);
          if (this.form.id != null) {
            updateWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              // 重置单据状态查询条件，确保能查询到所有状态的单据
              this.queryParams.billStatus = null;
              this.getList();
              this.$nextTick(() => this.refreshDetailSummary());
              // 保存成功后不关闭弹窗，允许继续修改
              // this.open = false;
            });
          } else {
            addWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              // 用后端返回的 id、billNo 更新当前 form，使单据号展示且下次保存走修改逻辑（request 拦截器已返回 res.data，故实体在 response.data）
              const resData = response && response.data;
              if (resData && (resData.id != null || resData.billNo != null)) {
                this.form.id = resData.id;
                this.form.billNo = resData.billNo;
              }
              // 重置单据状态查询条件，确保新增的单据能显示出来
              this.queryParams.billStatus = null;
              this.getList();
              this.$nextTick(() => this.refreshDetailSummary());
              // 保存成功后不关闭弹窗，允许继续修改
              // this.open = false;
            });
          }
        }
      });
    },
    /** 枣强：弹窗内审核当前入库单（逻辑与入库审核页 handleAudit 一致） */
    handleModalAudit() {
      const id = this.form.id;
      if (!id) {
        this.$modal.msgWarning('请先保存后再审核');
        return;
      }
      if (String(this.form.billStatus) === '2') {
        this.$modal.msgWarning('该单据已审核，不能再次审核');
        return;
      }
      if (!assertInboundBillEntriesHaveBatchAndExpiry(this.stkIoBillEntryList, this, '审核')) {
        return;
      }
      if (!assertInboundBillEntryDatesValid(this.stkIoBillEntryList, this)) {
        return;
      }
      const auditBy = this.$store.state.user.userId;
      getInWarehouse(id).then(res => {
        if (!assertBillHasActiveEntriesForAudit(res.data.stkIoBillEntryList, this, '低值入库')) {
          return;
        }
        if (!assertInboundBillEntriesHaveBatchAndExpiry(res.data.stkIoBillEntryList, this, '审核')) {
          return;
        }
        if (!assertInboundBillEntryDatesValid(res.data.stkIoBillEntryList, this)) {
          return;
        }
        const billNo = res.data.billNo || id;
        this.$modal.confirm('确定要审核"' + billNo + '"的数据项？').then(() => {
          return auditWarehouse({ id: id, auditBy: auditBy });
        }).then(() => {
          this.$modal.msgSuccess('审核入库成功！');
          this.getList();
          return getInWarehouse(id);
        }).then(response => {
          this.form = response.data;
          this.form.billStatus = '2';
          this.form.billType = '101';
          const entries = response.data.stkIoBillEntryList || [];
          entries.forEach(r => this.initRowLongTermFlag(r));
          this.stkIoBillEntryList = entries;
          this.action = false;
          this.title = '查看入库';
          this.$nextTick(() => this.refreshDetailSummary());
        }).catch(() => {});
      }).catch(() => {});
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除入库编号为"' + ids + '"的数据项？').then(function() {
        return delWarehouse(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 入库明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 入库明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.unitPrice = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.mainBarcode = "";
      obj.subBarcode = "";
      obj.barcodeInput = "";
      obj.remark = "";

      this.initRowLongTermFlag(obj);
      this.stkIoBillEntryList.push(obj);
      this.refreshDetailSummary();
    },
    /** 条码录入回车/失焦：解析主辅条码、批号效期，并按主条码(udi_no)匹配产品档案 */
    onBarcodeInputEnter(row) {
      const raw = (row.barcodeInput || "").trim();
      if (!raw) return;
      try {
        const res = jxTm(raw);
        if (res && res.ztm) {
          row.mainBarcode = res.ztm || "";
          row.subBarcode = (res.ftm != null ? res.ftm : "") || "";
          if (res.ph != null) row.batchNumber = res.ph;
          if (res.yxq) row.endTime = res.yxq;
          if (res.scrq) row.beginTime = res.scrq;
        } else {
          row.mainBarcode = raw;
        }
        this.initRowLongTermFlag(row);
        this.fetchMaterialByMainBarcode(row);
      } catch (e) {
        row.mainBarcode = raw;
        this.initRowLongTermFlag(row);
        this.fetchMaterialByMainBarcode(row);
      }
    },
    /** 主条码失焦：按主条码(udi_no)匹配产品档案并带出 */
    onMainBarcodeBlur(row) {
      const main = (row.mainBarcode || "").trim();
      if (!main) return;
      this.fetchMaterialByMainBarcode(row);
    },
    /** 根据主条码(udi_no)请求产品档案并回填到当前行 */
    fetchMaterialByMainBarcode(row) {
      const main = (row.mainBarcode || "").trim();
      if (!main) return;
      getMaterialByMainBarcode(main).then(res => {
        if (res && res.data) {
          row.materialId = res.data.id;
          row.material = res.data;
          row.unitPrice = res.data.price != null ? res.data.price : "";
          this.qtyChange(row);
        } else {
          this.$message.warning("未找到主条码(udi_no)或编码对应的产品档案");
        }
      }).catch(() => {
        this.$message.warning("未找到主条码(udi_no)或编码对应的产品档案");
      });
    },
    /** 顶部扫描条码：回车后解析主/辅条码，匹配产品档案并新增一行明细 */
    onScanBarcodeSubmit() {
      const raw = (this.scanBarcodeInput || "").trim();
      if (!raw) return;
      let mainBarcode = raw;
      let subBarcode = "";
      let batchNumber = "";
      let beginTime = "";
      let endTime = "";
      try {
        const res = jxTm(raw);
        if (res && res.ztm) {
          mainBarcode = res.ztm || raw;
          subBarcode = (res.ftm != null ? res.ftm : "") || "";
          if (res.ph != null) batchNumber = res.ph;
          if (res.yxq) endTime = res.yxq;
          if (res.scrq) beginTime = res.scrq;
        }
      } catch (e) {
        // 解析失败时整条作为主条码
      }
      const main = mainBarcode.trim();
      if (!main) {
        this.scanBarcodeInput = "";
        return;
      }
      getMaterialByMainBarcode(main).then(res => {
        if (res && res.data) {
          const mat = res.data;
          const unitPrice = mat.price != null ? mat.price : "";
          const qty = 1;
          const amt = (unitPrice && qty) ? (parseFloat(unitPrice) * qty).toFixed(2) : "";
          const row = {
            materialId: mat.id,
            material: mat,
            qty: qty,
            unitPrice: unitPrice,
            amt: amt,
            batchNo: "",
            batchNumber: batchNumber,
            beginTime: beginTime,
            endTime: endTime,
            mainBarcode: mainBarcode,
            subBarcode: subBarcode,
            barcodeInput: "",
            remark: ""
          };
          this.initRowLongTermFlag(row);
          this.stkIoBillEntryList.push(row);
          this.scanBarcodeInput = "";
          this.$message.success("已根据条码添加明细");
          this.refreshDetailSummary();
          this.$nextTick(() => {
            if (this.$refs.scanBarcodeInputRef) {
              this.$refs.scanBarcodeInputRef.focus();
            }
          });
        } else {
          this.$message.warning("未找到主条码(udi_no)或编码对应的产品档案，请检查条码或产品档案中的UDI码");
        }
      }).catch(() => {
        this.$message.warning("未找到主条码(udi_no)或编码对应的产品档案");
      });
    },
    /** 入库明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的入库明细数据");
      } else {
        const stkIoBillEntryList = this.stkIoBillEntryList;
        const checkedStkIoBillEntry = this.checkedStkIoBillEntry;
        this.stkIoBillEntryList = stkIoBillEntryList.filter(function(item) {
          return checkedStkIoBillEntry.indexOf(item.index) == -1
        });
        this.refreshDetailSummary();
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/warehouse/export', {
        ...this.queryParams
      }, `warehouse_${new Date().getTime()}.xlsx`)
    },
    refDingdan() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }

      //打开"弹窗组件"
      this.DialogDingdanComponentShow = true
      this.warehouseValue = this.form.warehouseId;
      this.departmentValue = this.form.departmentId;
      this.supplierValue = this.form.supplerId;
      this.materialValue = null; // 耗材筛选初始为空
    },
    selectDingdanData(val) {
      // 假设 val 是科室申请单对象或数组，取 id
      const dingdanId = Array.isArray(val) ? val[0].id : val.id;
      if (!dingdanId) return;

      const dingdanIdStr = String(dingdanId);
      var param = {
        dingdanId: dingdanIdStr
      };
      createRkEntriesByDingdan(param).then(response => {
        if (response && response.data) {
          this.form = response.data;
          const entries = response.data.stkIoBillEntryList || [];
          entries.forEach(r => this.initRowLongTermFlag(r));
          this.stkIoBillEntryList = entries;
          this.form.billStatus = '1';
          this.form.billType = '101';
          this.DialogDingdanComponentShow = false;
          this.$nextTick(() => this.refreshDetailSummary());
        }
      }).catch(() => {
        this.$message.error("加载科室申请单明细失败");
      });
    },
    closeDingdanDialog() {
      //关闭订单选择界面
      this.DialogDingdanComponentShow = false
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

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  margin-top: 10px;
}

.modal-footer .el-button {
  margin-left: 12px;
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

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

/* 主表格表头样式：字体加粗加大、背景加深 */
.app-container > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 引用配送单 + 扫描条码：表头同一行，标签不换行，输入铺满各自列 */
.delivery-scan-toolbar-row {
  margin-bottom: 8px;
}
.delivery-scan-toolbar-row .delivery-ref-form-item,
.delivery-scan-toolbar-row .detail-scan-form-item {
  margin-bottom: 0;
}
.delivery-scan-toolbar-row .delivery-ref-form-item .el-form-item__label,
.delivery-scan-toolbar-row .detail-scan-form-item .el-form-item__label {
  white-space: nowrap;
}
.delivery-scan-toolbar-row .el-form-item__content {
  line-height: 32px;
}
.local-modal-content .form-fields-container .delivery-scan-toolbar-row .delivery-ref-form-item .el-input,
.local-modal-content .form-fields-container .delivery-scan-toolbar-row .delivery-ref-form-item .el-input-group {
  width: 100%;
  max-width: 270px;
}
.local-modal-content .form-fields-container .delivery-scan-toolbar-row .detail-scan-form-item .el-input,
.local-modal-content .form-fields-container .delivery-scan-toolbar-row .detail-scan-form-item .el-input-group {
  width: 100%;
  max-width: 340px;
}
.delivery-scan-toolbar-row .scan-barcode-input .el-input-group__prepend {
  padding: 0 8px;
}

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

/* 搜索区域：外层白底容器（宽度铺满、边框与阴影略加强，便于辨认区域边界） */
.app-container > .el-form {
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

/* 单据状态对齐到仓库下面 - 使用margin-left对齐到第三个位置 */
/* 计算：入库单号(80px label + 180px input + 16px margin) + 供应商(80px label + 180px input + 16px margin) = 552px */
.app-container > .el-form .query-row-left .query-item-aligned {
  margin-left: 552px;
}

/* 按钮对齐到仓库下面 - 按钮没有label，所以对齐到仓库input的开始位置 */
/* 仓库起始位置 552px + label 80px = 632px */
.app-container > .el-form .query-row-left .query-button-aligned {
  margin-left: 632px;
  display: inline-block;
}

/* 确保第三行的按钮单独显示 */
.app-container > .el-form .query-row-left:last-child {
  min-height: 32px;
}

.app-container > .el-form .query-row-left:last-child .el-col {
  flex-wrap: nowrap;
}

/* 第二行：inline 表单下列内强制块级，避免日期区溢出盖住「单据状态」 */
.app-container > .el-form .query-row-second > .el-col > .el-form-item {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box;
  vertical-align: top;
}

.app-container > .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) {
  white-space: nowrap;
}

.app-container > .el-form .query-row-second .query-date-range-form-item {
  white-space: normal;
}

.app-container > .el-form .query-row-second .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  max-width: 100%;
}

.app-container > .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container > .el-form .query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}

.app-container > .el-form .query-row-second > .query-row-second-inner > .el-form-item {
  display: inline-flex !important;
  width: auto !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  flex: 0 0 auto;
  vertical-align: middle;
}

.app-container > .el-form .query-row-second-inner .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

/* 弹窗内顶部字段区：抵消 el-form 左右 20px 内边距，灰框与弹窗主区域同宽 */
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
}

.local-modal-content .form-fields-container .el-row:last-child {
  margin-bottom: 0;
}

/* 弹窗内明细区（工具栏+表格）：与顶部字段区同宽；flex 子项 min-height:0 避免合计行被裁切 */
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

/* 入库明细标题与按钮：上下留白一致，整体略下移，与表格间距对称 */
.local-modal-content .modal-detail-section .detail-toolbar-row {
  margin-top: 0;
  margin-bottom: 0;
  padding-top: 12px;
  padding-bottom: 12px;
  box-sizing: border-box;
}

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

/* 明细表可编辑列：与「数量」列同尺度（约 98px，small） */
.local-modal-content .modal-detail-section .el-table .detail-input-compact {
  width: 98px !important;
  max-width: 98px;
}
.local-modal-content .modal-detail-section .el-table .detail-input-compact.el-date-editor.el-input {
  width: 98px !important;
}

/* 明细表紧凑行高：单元格与输入框 */
.local-modal-content .modal-detail-section .el-table ::v-deep tbody td.el-table__cell {
  padding: 4px 0 !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 1.35;
}
.local-modal-content .modal-detail-section .el-table ::v-deep thead th.el-table__cell {
  padding: 6px 0 !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .el-input--small .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  padding: 0 6px !important;
  font-size: 13px !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .el-date-editor--date.el-input--small {
  height: 28px !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .el-date-editor--date .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

/* 批号 / 有效期等可编辑列外层容器 */
.local-modal-content .modal-detail-section .el-table .detail-cell-edit-wrap {
  text-align: left;
  padding: 0;
}
/* 批号：textarea 自适应高度，长批号自动换行查看 */
.local-modal-content .modal-detail-section .el-table .detail-batch-wrap {
  width: 100%;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-batch-textarea .el-textarea__inner {
  min-height: 26px !important;
  padding: 2px 6px;
  line-height: 1.35;
  word-break: break-all;
  white-space: pre-wrap;
  resize: vertical;
}
/* 有效期：日期选择器与「长期」勾选项同行紧凑排布 */
.local-modal-content .modal-detail-section .el-table .detail-expiry-wrap {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  gap: 4px;
}
.local-modal-content .modal-detail-section .el-table .detail-expiry-wrap .detail-date-expiry {
  flex: 1 1 auto;
  min-width: 0;
}
.local-modal-content .modal-detail-section .el-table .detail-long-term-check {
  flex: 0 0 auto;
  margin-left: 0;
  margin-right: 0;
}
.local-modal-content .modal-detail-section .el-table .detail-long-term-check ::v-deep .el-checkbox__label {
  padding-left: 4px;
  font-size: 12px;
}
/* 有效期：避免日历/清空图标压住日期文字 */
.local-modal-content .modal-detail-section .el-table .detail-date-expiry {
  width: 100% !important;
  max-width: none !important;
  min-width: 0 !important;
}
.local-modal-content .modal-detail-section .el-table .detail-date-expiry.el-date-editor.el-input {
  width: 100% !important;
  min-width: 0 !important;
}
.local-modal-content .modal-detail-section .el-table ::v-deep .detail-date-expiry .el-input__inner {
  padding-left: 8px !important;
  padding-right: 28px !important;
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

/* 单据号：列宽适中，过长时省略号，悬停看全文 */
.local-modal-content .modal-form-compact .form-item-header-billno .el-input {
  width: 100% !important;
  max-width: 100% !important;
}
.local-modal-content .modal-form-compact .form-item-header-billno ::v-deep .el-input__inner {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 供应商：占满列宽并支持换行 */
.local-modal-content .modal-form-compact .form-item-header-wide .el-form-item__content {
  line-height: normal;
}
.local-modal-content .modal-form-compact .form-item-header-wide .header-field-textarea,
.local-modal-content .modal-form-compact .form-item-header-wide .header-field-select-wide {
  width: 100% !important;
  max-width: 100% !important;
}
.local-modal-content .modal-form-compact .form-item-header-wide ::v-deep .header-field-textarea .el-textarea__inner {
  min-height: 28px !important;
  line-height: 1.45 !important;
  padding: 4px 8px;
  word-break: break-all;
  white-space: pre-wrap;
  resize: none;
}
.local-modal-content .modal-form-compact .form-item-header-wide ::v-deep .header-field-select-wide .el-input__inner {
  height: auto !important;
  min-height: 28px;
  line-height: 1.45 !important;
  white-space: normal !important;
  word-break: break-all;
  padding-top: 4px;
  padding-bottom: 4px;
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

/* 弹窗内表格：高度由 el-table :height 控制；外层不滚动，表体在表内滚动，合计行贴在表底 */
.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

/* 明细框表头样式：字体加粗、背景加深（仅明细区） */
::v-deep .local-modal-content .modal-detail-section .el-table th {
  font-size: 14px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table th .cell {
  font-size: 14px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table thead th {
  background-color: #EBEEF5 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table thead th .cell {
  font-size: 14px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table th.is-leaf {
  background-color: #EBEEF5 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

/* 表体横向滚动条与合计行错开，避免视觉上压在合计数字区域 */
::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 4px;
  box-sizing: border-box;
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* 合计行：主表区 + 左侧固定列底部同步，避免被滚动条或固定层盖住 */
::v-deep .local-modal-content .modal-detail-section .el-table__footer-wrapper {
  position: relative;
  z-index: 10 !important;
  background-color: #fff !important;
  margin-top: 0;
  box-shadow: 0 -1px 0 #ebeef5;
  overflow: visible !important;
}
::v-deep .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper {
  z-index: 11 !important;
  background-color: #fff !important;
  overflow: visible !important;
}
::v-deep .local-modal-content .modal-detail-section .el-table__footer-wrapper td,
::v-deep .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper td {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
  background-color: #fff !important;
}

/* 弹窗内明细表滚动条：细 */
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
.local-modal-content .el-table::-webkit-scrollbar,
.local-modal-content .table-wrapper::-webkit-scrollbar {
  width: 5px !important;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
.local-modal-content .el-table::-webkit-scrollbar-track,
.local-modal-content .table-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
.local-modal-content .el-table::-webkit-scrollbar-thumb,
.local-modal-content .table-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
}

.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.local-modal-content .el-table::-webkit-scrollbar-thumb:hover,
.local-modal-content .table-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对Element UI表格滚动条的通用样式 */
.local-modal-content .el-table .el-scrollbar__bar.is-vertical {
  width: 5px !important;
}
.local-modal-content .el-table .el-scrollbar__bar {
  opacity: 1 !important;
}

.local-modal-content .el-table .el-scrollbar__thumb {
  background-color: #c0c4cc !important;
  border-radius: 3px !important;
  min-height: 8px !important;
}

.local-modal-content .el-table .el-scrollbar__thumb:hover {
  background-color: #a8a8a8 !important;
}

/* 弹窗内通用滚动条（勿含 app-container，避免影响主列表） */
.local-modal-content *::-webkit-scrollbar,
.local-modal-mask *::-webkit-scrollbar {
  width: 5px !important;
  height: 5px !important;
}

.local-modal-content *::-webkit-scrollbar-track,
.local-modal-mask *::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 4px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb,
.local-modal-mask *::-webkit-scrollbar-thumb {
  background: #c0c4cc !important;
  border-radius: 3px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb:hover,
.local-modal-mask *::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对弹窗内所有表格的滚动条 */
.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 5px !important;
}

.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c0c4cc !important;
  border-radius: 3px !important;
  min-width: 4px !important;
}

.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
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

/* 覆盖弹窗组件的高度 - 调高添加弹窗中的弹窗高度 */
::v-deep .local-modal-content {
  min-height: 95vh !important;
}

::v-deep .purchase-modal-content {
  min-height: 95vh !important;
}

/* 弹窗内表格滚动条：细 */
::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  width: 5px !important;
  height: 5px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c0c4cc !important;
  border-radius: 3px !important;
  min-width: 4px !important;
  min-height: 8px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-track,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb:hover,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 主列表表格滚动条（仅 table-compact，不含弹窗内明细表） */
::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
  transition: background 0.2s ease !important;
}

::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #606266 !important;
}

::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb:active,
::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #303133 !important;
}

::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}

::v-deep .app-container > .el-table.table-compact .el-table__body-wrapper {
  scrollbar-width: thick;
  -ms-overflow-style: -ms-autohiding-scrollbar;
  scroll-behavior: smooth !important;
  -webkit-overflow-scrolling: touch !important;
}

/* 弹窗内明细表：Firefox 等使用细滚动条 */
::v-deep .local-modal-content .el-table .el-table__body-wrapper {
  scrollbar-width: thin;
}
</style>

<style>
/* 添加入库弹窗：有效期列单元格允许换行展示 */
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-date .cell {
  white-space: normal;
  word-break: break-word;
  vertical-align: middle;
  padding-top: 4px;
  padding-bottom: 4px;
}

/* 添加入库弹窗：批号列允许 textarea 自适应高度并自动换行 */
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch .cell {
  white-space: normal;
  word-break: break-all;
  vertical-align: middle;
  padding-top: 4px;
  padding-bottom: 4px;
}
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch .el-textarea__inner {
  min-height: 26px;
  line-height: 1.35;
  word-break: break-all;
  white-space: pre-wrap;
  padding: 2px 6px;
  resize: vertical;
}

/* 批次号：完整展示，自动换行 */
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .cell {
  white-space: normal;
  word-break: break-all;
  vertical-align: middle;
  padding-top: 4px;
  padding-bottom: 4px;
}
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-batch-no .detail-batch-no-cell {
  display: block;
  width: 100%;
  line-height: 1.35;
  word-break: break-all;
  white-space: pre-wrap;
  text-align: center;
}

/* 名称、规格、型号、生产厂家：左上对齐，最多两行；列可拖拽加宽 */
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table tbody td.el-table__cell {
  padding: 4px 0 !important;
}
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 4px 6px;
}
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.35;
  max-height: calc(1.35em * 2 + 2px);
}
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table thead th.el-table__cell {
  padding: 6px 0 !important;
}
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table__footer-wrapper td,
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table__fixed-footer-wrapper td {
  padding-top: 6px !important;
  padding-bottom: 6px !important;
}

/* 本页主容器左右仅留 8px，使搜索框/按钮/表格整体更宽（非scoped确保生效） */
.app-container.inWarehouse-apply-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

/* 弹窗整层加宽：向外扩展抵消本页 container 左右 8px，只动外层遮罩不改表单内部 */
.app-container.inWarehouse-apply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
}

/* 搜索框容器：略上移，与其它列表页一致 */
.app-container > .el-form.query-form-compact {
  margin-top: -8px !important;
}

/* 到货验收：再上移 4px，使「标签栏 → 搜索区」与「搜索区 → 操作按钮」留白接近 */
.app-container.inWarehouse-apply-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

/* 新增/导出/搜索/重置按钮行紧凑：往上移8px，与明细框间距8px（非scoped确保生效） */
.app-container > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
.app-container > .el-table.table-compact {
  margin-top: 0;
}

/* 明细框表头样式：使用非scoped样式确保生效（仅入库明细区） */
.local-modal-content .modal-detail-section .el-table th {
  font-size: 14px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

.local-modal-content .modal-detail-section .el-table th .cell {
  font-size: 14px !important;
  font-weight: 600 !important;
}

.local-modal-content .modal-detail-section .el-table thead th {
  background-color: #EBEEF5 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

.local-modal-content .modal-detail-section .el-table thead th .cell {
  font-size: 14px !important;
  font-weight: 600 !important;
}

.local-modal-content .modal-detail-section .el-table th.is-leaf {
  background-color: #EBEEF5 !important;
  font-size: 14px !important;
  font-weight: 600 !important;
}

/* 序号列表头不换行 */
.local-modal-content .el-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.local-modal-content .el-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 主表格表头样式：使用非scoped样式确保生效 */
.app-container > .el-table th {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container > .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container > .el-table thead th {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container > .el-table thead th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
  font-family: 'Roboto', sans-serif !important;
}

/* 单据状态列表头不换行 - 第9列（选择框+序号+入库单号+供应商+仓库+金额+制单人+制单日期+单据状态） */
.app-container > .el-table thead th:nth-child(9) .cell {
  white-space: nowrap !important;
}

/* 主表格滚动条优化 - 非scoped样式确保生效 */
.app-container > .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container > .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
  transition: background 0.2s ease !important;
}

.app-container > .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #606266 !important;
}

.app-container > .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #303133 !important;
}

.app-container > .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}

.app-container > .el-table .el-table__body-wrapper {
  scroll-behavior: smooth !important;
  -webkit-overflow-scrolling: touch !important;
}

/*
 * Element UI 2.x：show-summary 无数据时表尾被 v-show 隐藏，滚动条易与合计行错位。
 * 强制显示表尾，横向滚动条固定在表体与合计之间。
 */
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.inWarehouse-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.json-viewer-pre {
  max-height: 520px;
  overflow: auto;
  margin: 0;
  background: #f7f8fa;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
}
</style>
