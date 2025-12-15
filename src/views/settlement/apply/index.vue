<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="结算单号" prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo"
                      placeholder="请输入结算单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
            <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
            <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="高值"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="制单日期" style="display: flex; align-items: center;">
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
          <el-form-item label="单据状态" prop="billStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.billStatus" placeholder="全部"
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
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['settlement:apply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['settlement:apply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList"
              show-summary :summary-method="getTotalSummaries"
              :row-class-name="warehouseListIndex"
              @selection-change="handleSelectionChange" height="58vh" border>
<!--      <el-table-column type="selection" width="55" align="center" />-->
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="结算单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable v-if="false" />
      <el-table-column label="金额" align="center" prop="totalAmount" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="制单人" align="center" prop="creater.nickName" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="引用单号" align="center" prop="refBillNo" width="180" show-overflow-tooltip resizable v-if="false"/>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['settlement:apply:edit']"
              v-if="scope.row.billStatus != 2"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['settlement:apply:remove']"
              v-if="scope.row.billStatus != 2"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-view"
              @click="handleView(scope.row)"
              v-hasPermi="['settlement:apply:view']"
            >查看</el-button>
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

    <!-- 添加或修改结算对话框 -->
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
            <el-form-item label="单据号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="供应商" prop="supplerId">
              <SelectSupplier v-model="form.supplerId" :value2="stkIoBillEntryList.length > 0"/>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :value2="stkIoBillEntryList.length > 0" excludeWarehouseType="高值"/>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="form.invoiceNumber" placeholder="请输入发票号" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="8">
            <el-form-item label="日期起止" label-width="80px">
              <el-date-picker
                              v-model="form.beginDate"
                              type="date"
                              value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                style="width: 160px;"
              />
              <span style="margin: 0 8px;">至</span>
              <el-date-picker
                              v-model="form.endDate"
                              type="date"
                              value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                style="width: 160px;"
              />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="8" style="margin-top: 10px;">
          <el-col :span="8">
            <el-form-item label=" " label-width="80px">
              <el-button type="primary" size="small" @click="handleGenerateSettlement" :disabled="!selectedSupplierId || stkIoBillEntryList.length === 0">生成结算单</el-button>
              <el-button type="primary" icon="el-icon-search" size="small" @click="handleSearchSettlement" style="margin-left: 8px;">搜索</el-button>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" v-show="false">
          <el-col :span="4">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="form.proPerson"/>
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="form.delPerson" placeholder="请输入配送员" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="form.telephone" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="4" v-show="false">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="form.invoiceAmount" placeholder="请输入发票金额" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8" v-show="false">
          <el-col :span="4">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-date-picker clearable
                              v-model="form.invoiceTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              style="width: 100%"
                              placeholder="请输入发票时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="form.refBillNo" :disabled="true" placeholder="引用采购订单号" />
            </el-form-item>
          </el-col>
        </el-row>

<!-- 左右分栏布局：左边供应商列表，右边结算明细 -->
        <el-row :gutter="10" style="margin-top: 10px;">
          <!-- 左边：供应商列表 -->
          <el-col :span="8" style="border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px;">
            <div style="font-weight: bold; margin-bottom: 10px;">供应商</div>
            <el-table 
              ref="supplierTable"
              :data="supplierList" 
              height="48vh"
              border
              highlight-current-row
              @current-change="handleSupplierChange"
              @selection-change="handleSupplierSelectionChange"
              v-loading="supplierLoading"
            >
              <el-table-column type="selection" width="55" align="center"/>
              <el-table-column label="序号" type="index" width="60" align="center"/>
              <el-table-column label="供应商名称" prop="name" show-overflow-tooltip/>
              <el-table-column label="总金额" width="120" align="right">
                <template slot-scope="scope">
                  <span>{{ (scope.row.totalAmount || getSupplierTotalAmount(scope.row.id)) | formatCurrency }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-col>
          
          <!-- 右边：结算明细信息 -->
          <el-col :span="16" style="border: 1px solid #dcdfe6; border-radius: 4px; padding: 10px;">
            <el-row :gutter="10" class="mb8">
              <el-col :span="1.5">
                <span>结算明细信息</span>
              </el-col>

              <div v-show="action">
                <el-col :span="1.5" v-show="false">
                  <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId || !selectedSupplierId">添加</el-button>
                </el-col>
                <el-col :span="1.5">
                </el-col>
                <el-col :span="1.5">
                  <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoBillEntry">删除</el-button>
                </el-col>
              </div>
            </el-row>
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry"
                  border
                   height="48vh"
        >
          <el-table-column type="selection" width="60" align="center" />
          <el-table-column label="序号" align="left" prop="index" width="50" show-overflow-tooltip resizable/>
          <!-- 耗材列隐藏 -->
          <!--<el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>-->

          <el-table-column label="名称" align="left" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="left" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="left" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="left" prop="material.fdUnit.unitName" width="90" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="60" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <!--              <el-input v-model="scope.row.qty" type='number' :min="1"-->
              <!--                        @input="qtyChange(scope.row)"-->
              <!--                        placeholder="请输入数量" />-->
              <el-input
                clearable
                v-model="scope.row.qty"
                placeholder="请输入数量"
                onkeyup="value=value.replace(/\D/g,'')"
                onafterpaste="value=value.replace(/\D/g,'')"
                @blur="form.result=$event.target.value"
                @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" 
                        type='number'
                        :disabled="true"
                        @input="priceChange(scope.row)"
                        placeholder="请输入价格" />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber"  placeholder="请输入批号" />
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :picker-options="pickerEndTimeOptions"
                              placeholder="请选择日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :picker-options="pickerBeginTimeOptions"
                              placeholder="请选择日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="请输入批次号" />
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="仓库" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.warehouseName) || (form.warehouse && form.warehouse.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="结算类型" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ getSettlementTypeName(scope.row.settlementType) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
        </div>
          </el-col>
        </el-row>
        </el-form>
        <div v-show="false" class="modal-footer">
          <el-button @click="cancel">取 消</el-button>
          <el-button type="primary" @click="submitForm">确 定</el-button>
        </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 查看结算对话框 -->
    <transition name="modal-fade">
      <div v-if="viewOpen" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="viewOpen" class="local-modal-content">
        <div class="modal-header">
          <div class="modal-title">查看结算</div>
          <el-button icon="el-icon-close" size="small" circle @click="cancelView" class="close-btn"></el-button>
        </div>
        <el-form ref="viewForm" :model="viewForm" label-width="70px" size="small" class="modal-form-compact">

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="供应商" prop="supplerId">
              <SelectSupplier v-model="viewForm.supplerId" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="viewForm.warehouseId" :disabled="true" excludeWarehouseType="高值"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票号" prop="invoiceNumber">
              <el-input v-model="viewForm.invoiceNumber" :disabled="true" placeholder="请输入发票号" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="viewForm.createrName" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="采购员" prop="proPerson">
              <SelectUser v-model="viewForm.proPerson" :disabled="true"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="viewForm.totalAmount" :disabled="true" placeholder="请输入总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="配送员" prop="delPerson">
              <el-input v-model="viewForm.delPerson" :disabled="true" placeholder="请输入配送员" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="联系电话" prop="telephone">
              <el-input v-model="viewForm.telephone" :disabled="true" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票金额" prop="invoiceAmount">
              <el-input v-model="viewForm.invoiceAmount" :disabled="true" placeholder="请输入发票金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发票时间" prop="invoiceTime">
              <el-date-picker clearable
                              v-model="viewForm.invoiceTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              style="width: 100%"
                              placeholder="请输入发票时间">
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="单据号" prop="billNo">
              <el-input v-model="viewForm.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="引用单号" prop="refBillNo">
              <el-input v-model="viewForm.refBillNo" :disabled="true" placeholder="引用采购订单号" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>结算明细信息</span>
          </el-col>
        </el-row>
        <div class="table-wrapper">
        <el-table :data="viewStkIoBillEntryList" :row-class-name="rowViewStkIoBillEntryIndex"
                  show-summary :summary-method="getViewSummaries"
                  border
                  height="48vh"
        >
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.endTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.beginTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.remark || '--' }}</span>
            </template>
          </el-table-column>
        </el-table>
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
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>


  </div>
</template>

<script>
import { listSettlement, getSettlement, delSettlement, addSettlement, updateSettlement, getSettlementDetails } from "@/api/settlement/settlement";
import { listSupplierAll } from "@/api/foundation/supplier";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';

export default {
  name: "SettlementApply",
  dicts: ['biz_status','bill_type','way_status'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectMaterialFilter},
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
      // 供应商列表
      supplierList: [],
      supplierLoading: false,
      selectedSupplierId: null,
      allSettlementEntries: [], // 缓存所有结算明细数据
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      // 查看弹窗相关
      viewOpen: false,
      viewForm: {},
      viewStkIoBillEntryList: [],
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
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        warehouseId: [
          // 结算单生成时，仓库可以为空（因为结算单不直接关联仓库，而是关联明细）
          // { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "结算类型不能为空", trigger: "change" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if( index === 5){
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

          if(index === 5){
            let res = parseFloat(sums[index]);
            if(!isNaN(res)){
              let parRes = res.toFixed(2);
              this.form.totalAmount = parRes;
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
    /** 查询结算列表 */
    getList() {
      this.loading = true;
      this.queryParams.billType = "501";
      listSettlement(this.queryParams).then(response => {
        this.warehouseList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      if(!this.selectedSupplierId && !this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开"弹窗组件"
      this.DialogComponentShow = true
      this.supplierValue = this.selectedSupplierId || this.form.supplerId;
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
        obj.qty = "";
        // 设置价格：优先使用item.price
        obj.unitPrice = item.price || item.unitPrice || 0;
        obj.amt = "";
        obj.batchNo = "";
        obj.batchNumber = "";
        obj.beginTime = "";
        obj.endTime = "";
        obj.remark = "";
        obj.material = item;

        this.stkIoBillEntryList.push(obj);
      });
    },
    /** 生成结算单 */
    handleGenerateSettlement() {
      // 验证必填项
      if (!this.selectedSupplierId && !this.form.supplerId) {
        this.$modal.msgError("请先选择供应商");
        return;
      }
      if (!this.stkIoBillEntryList || this.stkIoBillEntryList.length === 0) {
        this.$modal.msgError("请先添加结算明细");
        return;
      }
      // 验证明细数量非空
      const hasEmptyQty = this.stkIoBillEntryList.some(item =>
        !item.qty || String(item.qty).trim() === ''
      );
      if (hasEmptyQty) {
        this.$modal.msgError("结算明细数量不能为空");
        return;
      }
      
      // 如果是新增结算单，初始化表单数据
      if (!this.form.id) {
        // 确保供应商ID已设置
        this.form.supplerId = this.selectedSupplierId || this.form.supplerId;
        // 设置结算单状态为未审核（1=未审核，2=已审核）
        this.form.billStatus = '1';
        // 设置单据类型为结算单（501）
        this.form.billType = '501';
        // 设置制单人信息
        var userName = this.$store.state.user.name;
        var userId = this.$store.state.user.userId;
        this.form.createBy = userId;
        this.form.createrName = userName;
        // 如果仓库ID不存在，尝试从明细中获取（从第一个明细的仓库信息获取）
        if (!this.form.warehouseId && this.stkIoBillEntryList.length > 0) {
          // 注意：结算明细可能来自多个仓库，这里取第一个明细的仓库ID
          // 实际业务中，一个结算单通常对应一个仓库
          const firstEntry = this.stkIoBillEntryList[0];
          // 如果明细中有仓库信息，可以在这里获取（暂时注释，因为当前数据结构可能不包含warehouseId）
        }
      }
      
      // 提交表单
      this.submitForm();
    },
    /** 搜索结算明细 */
    handleSearchSettlement() {
      // 验证日期范围
      if (!this.form.beginDate || !this.form.endDate) {
        this.$modal.msgError("请选择日期起止范围");
        return;
      }
      // 根据日期范围查询所有有结算明细的供应商
      const queryParams = {
        beginDate: this.form.beginDate,
        endDate: this.form.endDate
        // 不传 supplerId，查询所有供应商的明细
      };
      this.loading = true;
      getSettlementDetails(queryParams).then(response => {
        // 清空当前的明细列表
        this.stkIoBillEntryList = [];
        // 清空供应商选择
        this.selectedSupplierId = null;
        this.form.supplerId = null;
        
        if (response.data && response.data.length > 0) {
          // 处理返回的明细数据，按供应商分组
          const supplierMap = new Map();
          response.data.forEach(entry => {
            // 确保金额计算正确
            if (entry.qty && entry.unitPrice) {
              entry.amt = (parseFloat(entry.qty) * parseFloat(entry.unitPrice)).toFixed(2);
            }
            
            // 获取供应商ID（从material中获取supplierId）
            const supplierId = entry.material && entry.material.supplierId 
              ? entry.material.supplierId 
              : (entry.supplierId || null);
            
            if (supplierId) {
              if (!supplierMap.has(supplierId)) {
                supplierMap.set(supplierId, {
                  id: supplierId,
                  name: entry.material && entry.material.supplier && entry.material.supplier.name 
                    ? entry.material.supplier.name 
                    : '未知供应商',
                  entries: []
                });
              }
              supplierMap.get(supplierId).entries.push(entry);
            }
          });
          
          // 缓存所有明细数据
          this.allSettlementEntries = response.data;
          
          // 转换为供应商列表并计算总金额
          this.supplierList = Array.from(supplierMap.values()).map(supplier => {
            // 计算该供应商的总金额
            let totalAmount = 0;
            supplier.entries.forEach(entry => {
              // 确保金额计算正确
              let amount = 0;
              if (entry.amt) {
                amount = parseFloat(entry.amt) || 0;
              } else if (entry.qty && entry.unitPrice) {
                amount = (parseFloat(entry.qty) || 0) * (parseFloat(entry.unitPrice) || 0);
              }
              totalAmount += amount;
            });
            
            return {
              id: supplier.id,
              name: supplier.name,
              totalAmount: totalAmount.toFixed(2) // 保存计算好的总金额
            };
          });
          
          // 如果之前选择了供应商，尝试重新选中并加载明细
          if (this.selectedSupplierId) {
            this.loadSupplierSettlementDetails(this.selectedSupplierId, response.data);
          }
          
          this.loading = false;
          this.$modal.msgSuccess("查询成功，找到 " + this.supplierList.length + " 个供应商的结算明细");
        } else {
          this.supplierList = [];
          this.loading = false;
          this.$modal.msgInfo("未查询到符合条件的结算明细");
        }
        
        // 清除表格选择状态
        this.$nextTick(() => {
          const table = this.$refs.supplierTable;
          if (table) {
            table.clearSelection();
            table.setCurrentRow(null);
          }
        });
      }).catch(() => {
        this.loading = false;
        this.$modal.msgError("查询失败");
      });
    },
    /** 加载指定供应商的结算明细 */
    loadSupplierSettlementDetails(supplierId, allEntries) {
      if (!allEntries || allEntries.length === 0) {
        this.stkIoBillEntryList = [];
        return;
      }
      
      // 筛选出该供应商的明细
      this.stkIoBillEntryList = allEntries.filter(entry => {
        const entrySupplierId = entry.material && entry.material.supplierId 
          ? entry.material.supplierId 
          : (entry.supplierId || null);
        return entrySupplierId === supplierId;
      });
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
    //当天日期
    getBillDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + month + "-" + day;
    },
    // 获取当前日期（格式：yyyy-MM-dd）
    getCurrentDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = now.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
    },
    // 获取当前日期前5天的日期（格式：yyyy-MM-dd）
    getDateBefore5Days(){
      let now = new Date();
      let before5Days = new Date(now);
      before5Days.setDate(now.getDate() - 5);
      let year = before5Days.getFullYear();
      let month = before5Days.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = before5Days.getDate();
      day = day < 10 ? "0" + day : day;
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
        beginDate: this.getDateBefore5Days(),
        endDate: this.getCurrentDate()
      };
      this.stkIoBillEntryList = [];
      this.selectedSupplierId = null;
      // 清除供应商表格的选择状态
      this.$nextTick(() => {
        const table = this.$refs.supplierTable;
        if (table) {
          table.clearSelection();
          table.setCurrentRow(null);
        }
      });
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
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
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
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
      getSettlement(id).then(response => {
        this.viewForm = response.data;
        this.viewStkIoBillEntryList = response.data.stkIoBillEntryList || [];
        this.viewOpen = true;
      });
    },
    /** 取消查看弹窗 */
    cancelView() {
      this.viewOpen = false;
      this.viewForm = {};
      this.viewStkIoBillEntryList = [];
    },
    /** 查看弹窗汇总方法 */
    getViewSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 5 || index === 6 || index === 7){
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
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.billStatus = '1';
      this.form.billType = '501';
      //操作人
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
      this.form.createrName = userName;
      // 制单日期由后端自动设置为保存时间，无需前端设置
      this.title = "添加结算";
      this.action = true;
      // 加载供应商列表
      this.getSupplierList();
    },
    /** 获取供应商列表 */
    getSupplierList() {
      this.supplierLoading = true;
      listSupplierAll().then(response => {
        this.supplierList = response || [];
        this.supplierLoading = false;
      }).catch(() => {
        this.supplierList = [];
        this.supplierLoading = false;
      });
    },
    /** 供应商选择变更（行点击） */
    handleSupplierChange(row) {
      if (row) {
        this.selectedSupplierId = row.id;
        this.form.supplerId = row.id;
        // 同步 checkbox 选择状态
        this.$nextTick(() => {
          const table = this.$refs.supplierTable;
          if (table) {
            table.clearSelection();
            table.toggleRowSelection(row, true);
          }
        });
        // 加载该供应商的结算明细
        this.loadSupplierSettlementDetailsFromCache();
      } else {
        this.selectedSupplierId = null;
        this.form.supplerId = null;
        this.stkIoBillEntryList = [];
      }
    },
    /** 供应商复选框选择变更 */
    handleSupplierSelectionChange(selection) {
      // 只允许选择一个供应商
      if (selection.length > 1) {
        // 保留最后一个选择，清除其他选择
        const table = this.$refs.supplierTable;
        const lastSelected = selection[selection.length - 1];
        table.clearSelection();
        table.toggleRowSelection(lastSelected, true);
        this.selectedSupplierId = lastSelected.id;
        this.form.supplerId = lastSelected.id;
        // 加载该供应商的结算明细
        this.loadSupplierSettlementDetailsFromCache();
      } else if (selection.length === 1) {
        // 选择了一个供应商
        this.selectedSupplierId = selection[0].id;
        this.form.supplerId = selection[0].id;
        // 加载该供应商的结算明细
        this.loadSupplierSettlementDetailsFromCache();
      } else {
        // 取消了选择
        this.selectedSupplierId = null;
        this.form.supplerId = null;
        this.stkIoBillEntryList = [];
      }
    },
    /** 从缓存中加载供应商结算明细 */
    loadSupplierSettlementDetailsFromCache() {
      if (!this.selectedSupplierId || !this.allSettlementEntries || this.allSettlementEntries.length === 0) {
        // 如果没有缓存，重新查询
        this.handleSearchSettlementDetailForSupplier();
        return;
      }
      
      // 从缓存中筛选
      this.loadSupplierSettlementDetails(this.selectedSupplierId, this.allSettlementEntries);
    },
    /** 查询指定供应商的结算明细 */
    handleSearchSettlementDetailForSupplier() {
      if (!this.selectedSupplierId) {
        return;
      }
      if (!this.form.beginDate || !this.form.endDate) {
        this.$modal.msgError("请选择日期起止范围");
        return;
      }
      
      const queryParams = {
        supplerId: this.selectedSupplierId,
        beginDate: this.form.beginDate,
        endDate: this.form.endDate
      };
      
      this.loading = true;
      getSettlementDetails(queryParams).then(response => {
        this.stkIoBillEntryList = [];
        if (response.data && response.data.length > 0) {
          response.data.forEach(entry => {
            if (entry.qty && entry.unitPrice) {
              entry.amt = (parseFloat(entry.qty) * parseFloat(entry.unitPrice)).toFixed(2);
            }
            this.stkIoBillEntryList.push(entry);
          });
        }
        this.loading = false;
      }).catch(() => {
        this.loading = false;
        this.$modal.msgError("查询失败");
      });
    },
    /** 计算供应商总金额 */
    getSupplierTotalAmount(supplierId) {
      if (!supplierId) {
        return '0.00';
      }
      // 优先从缓存的所有明细数据中计算
      const entriesToCalculate = this.allSettlementEntries && this.allSettlementEntries.length > 0 
        ? this.allSettlementEntries 
        : this.stkIoBillEntryList;
      
      if (!entriesToCalculate || entriesToCalculate.length === 0) {
        return '0.00';
      }
      
      let total = 0;
      entriesToCalculate.forEach(item => {
        // 通过material对象获取供应商ID
        const material = item.material || {};
        const materialSupplierId = material.supplierId || (material.supplier && material.supplier.id) || null;
        // 如果产品的供应商ID匹配，累加金额
        if (materialSupplierId == supplierId) {
          // 计算金额：如果有amt就直接使用，否则用qty * unitPrice计算
          let amount = 0;
          if (item.amt) {
            amount = parseFloat(item.amt) || 0;
          } else if (item.qty && item.unitPrice) {
            amount = (parseFloat(item.qty) || 0) * (parseFloat(item.unitPrice) || 0);
          }
          total += amount;
        }
      });
      return total.toFixed(2);
    },
    /** 获取结算类型名称 */
    getSettlementTypeName(type) {
      if (!type) {
        return '';
      }
      const typeMap = {
        '1': '入库结算',
        '2': '出库结算',
        '3': '消耗结算'
      };
      return typeMap[type] || type;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getSettlement(id).then(response => {
        this.form = response.data;
        this.form.billStatus = '1';
        this.form.billType = '501';
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.title = "修改结算";
        this.action = true;
        // 加载供应商列表
        this.getSupplierList();
        // 设置选中的供应商
        if (this.form.supplerId) {
          this.selectedSupplierId = this.form.supplerId;
        }
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 新增数量非空校验
          const hasEmptyQty = this.stkIoBillEntryList.some(item =>
            !item.qty || String(item.qty).trim() === ''
          );

          if (hasEmptyQty) {
            this.$modal.msgError("结算明细数量不能为空");
            return;
          }

          this.form.stkIoBillEntryList = this.stkIoBillEntryList;
          var totalAmt = 0;
          this.stkIoBillEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = totalAmt.toFixed(2);
          
          // 确保供应商ID已设置
          if (!this.form.supplerId) {
            this.form.supplerId = this.selectedSupplierId;
          }
          
          // 确保结算单状态和类型已设置
          if (!this.form.billStatus) {
            this.form.billStatus = '1'; // 未审核
          }
          if (!this.form.billType) {
            this.form.billType = '501'; // 结算单
          }
          
          if (this.form.id != null) {
            updateSettlement(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              // 生成结算单成功后，清空当前选择的明细
              this.stkIoBillEntryList = [];
              this.selectedSupplierId = null;
              this.form.supplerId = null;
            });
          } else {
            addSettlement(this.form).then(response => {
              this.$modal.msgSuccess("生成结算单成功");
              this.open = false;
              this.getList();
              // 生成结算单成功后，清空当前选择的明细，以便下次操作
              this.stkIoBillEntryList = [];
              this.selectedSupplierId = null;
              this.form.supplerId = null;
              // 清空供应商表格选择状态
              this.$nextTick(() => {
                const table = this.$refs.supplierTable;
                if (table) {
                  table.clearSelection();
                  table.setCurrentRow(null);
                }
              });
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除结算编号为"' + ids + '"的数据项？').then(function() {
        return delSettlement(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 结算明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    rowViewStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 结算明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.unitPrice = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 结算明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的结算明细数据");
      } else {
        const stkIoBillEntryList = this.stkIoBillEntryList;
        const checkedStkIoBillEntry = this.checkedStkIoBillEntry;
        this.stkIoBillEntryList = stkIoBillEntryList.filter(function(item) {
          return checkedStkIoBillEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('settlement/settlement/export', {
        ...this.queryParams
      }, `settlement_${new Date().getTime()}.xlsx`)
    },
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
  padding: 24px;
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
  margin-bottom: 20px;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: 500;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
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

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
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

.local-modal-content .modal-form-compact image.png.el-date-editor.el-input {
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
  height: 48vh;
  max-height: 48vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
  overflow-y: auto;
}

/* 加粗滚动条 - 覆盖所有表格滚动条 */
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
.local-modal-content .el-table::-webkit-scrollbar,
.local-modal-content .table-wrapper::-webkit-scrollbar {
  width: 10px !important;
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
.local-modal-content .el-table .el-scrollbar__bar {
  opacity: 1 !important;
}

.local-modal-content .el-table .el-scrollbar__thumb {
  background-color: #c1c1c1 !important;
  border-radius: 5px !important;
  min-height: 10px !important;
}

.local-modal-content .el-table .el-scrollbar__thumb:hover {
  background-color: #a8a8a8 !important;
}

/* 全局滚动条样式 - 确保表格滚动条更粗 */
.local-modal-content *::-webkit-scrollbar,
.local-modal-mask *::-webkit-scrollbar,
.app-container *::-webkit-scrollbar {
  width: 10px !important;
  height: 10px !important;
}

.local-modal-content *::-webkit-scrollbar-track,
.local-modal-mask *::-webkit-scrollbar-track,
.app-container *::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 5px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb,
.local-modal-mask *::-webkit-scrollbar-thumb,
.app-container *::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
}

.local-modal-content *::-webkit-scrollbar-thumb:hover,
.local-modal-mask *::-webkit-scrollbar-thumb:hover,
.app-container *::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

/* 针对弹窗内所有表格的滚动条 */
.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
}

.local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
.local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
.local-modal-content .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
  min-width: 12px !important;
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

/* 弹窗内所有表格的滚动条加粗 - 统一使用和主弹窗相同的宽度 */
::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 10px !important;
}

::v-deep .local-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table .el-scrollbar__wrap::-webkit-scrollbar-thumb,
::v-deep .purchase-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 5px !important;
  min-width: 10px !important;
  min-height: 10px !important;
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
</style>
