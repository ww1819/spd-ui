<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="计划单号" prop="planNo" class="query-item-inline">
            <el-input v-model="queryParams.planNo"
                      placeholder="请输入计划单号"
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
              <SelectWarehouse v-model="queryParams.warehouseId" excludeWarehouseType="设备,高值"/>
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
          <el-form-item label="单据状态" prop="planStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.planStatus" placeholder="全部"
                       clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="金额" prop="totalAmount" class="query-item-inline">
            <el-input v-model="queryParams.totalAmount"
                      placeholder="请输入金额"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="计划来源" prop="planSource" class="query-item-inline">
            <el-select v-model="queryParams.planSource" placeholder="全部"
                       clearable style="width: 150px">
              <el-option label="手工制单" value="手工制单" />
              <el-option label="引用申购单" value="引用申购单" />
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
          size="medium"
          @click="handleAdd"
          v-hasPermi="['inWarehouse:apply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['inWarehouse:apply:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="medium"
          :disabled="multiple"
          @click="handleBatchSubmit"
          v-hasPermi="['caigou:jihua:edit']"
        >提交</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList"
              :row-class-name="warehouseListIndex"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.planNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="180" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="planStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.planStatus === '0' || scope.row.planStatus === 0" type="info">未提交</el-tag>
          <el-tag v-else-if="scope.row.planStatus === '1' || scope.row.planStatus === 1" type="warning">待审核</el-tag>
          <el-tag v-else-if="scope.row.planStatus === '2' || scope.row.planStatus === 2" type="success">已审核</el-tag>
          <span v-else>{{ scope.row.planStatus }}</span>
        </template>
      </el-table-column>

      <el-table-column label="制单人" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="planDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.planDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="提交日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="提交人" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getCreatorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ getAuditorName(scope.row) }}
        </template>
      </el-table-column>
      <el-table-column label="计划来源" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.planSource">{{ scope.row.planSource }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核意见" align="center" prop="auditOpinion" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditOpinion">{{ scope.row.auditOpinion }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" fixed="right" width="180" resizable>
        <template slot-scope="scope">
          <div style="display: flex; align-items: center; justify-content: center; white-space: nowrap; gap: 4px;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['inWarehouse:apply:edit']"
              v-if="scope.row.planStatus != 2"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['inWarehouse:apply:remove']"
              v-if="scope.row.planStatus != 2"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-s-operation"
              @click="handleProgress(scope.row)"
            >进度</el-button>
          </div>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
      class="table-pagination"
    />

    <!-- 添加或修改计划对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button type="text" @click="cancel" class="close-btn" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">
              <!-- 顶部容器 -->
              <div class="form-fields-container">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="单号" prop="planNo">
                      <el-input v-model="form.planNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId">
                      <SelectWarehouse v-model="form.warehouseId" excludeWarehouseType="设备,高值"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item prop="planDate">
                      <template slot="label">
                        <span style="white-space: nowrap;">制单日期</span>
                      </template>
                      <el-date-picker clearable
                                      v-model="form.planDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      placeholder="请选择制单日期"
                                      style="width: 100%">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="操作人" prop="createBy">
                      <el-input :value="operatorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="联系电话" prop="telephone">
                      <el-input v-model="form.telephone" placeholder="请输入联系电话" />
                    </el-form-item>
                  </el-col>
                </el-row>

                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="采购员" prop="proPerson">
                      <SelectUser v-model="form.proPerson" v-if="action"/>
                      <el-input :value="purchaserName" :disabled="true" v-else/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="计划来源" prop="planSource">
                      <el-select v-model="form.planSource" placeholder="请选择计划来源" clearable style="width: 100%;">
                        <el-option label="手工制单" value="手工制单" />
                        <el-option label="引用申购单" value="引用申购单" />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="引用单号" prop="referenceBillNo">
                      <el-input v-model="form.referenceBillNo" :disabled="true" placeholder="引用申购单号" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>计划明细信息</span>
                </el-col>

                <div v-show="action">
                  <el-col :span="1.5">
                    <el-button type="info" icon="el-icon-document" size="medium" @click="handleReferencePurchase">引用申购单</el-button>
                  </el-col>
                  <el-col :span="1.5">
    <!--            <el-button type="primary" icon="el-icon-plus" size="small" @click="handleAddStkIoBillEntry">添加</el-button>-->
                    <el-button type="primary" icon="el-icon-plus" size="medium" @click="checkMaterialBtn">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="medium" @click="handleDeleteStkIoBillEntry">删除</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button size="medium" @click="cancel">取 消</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="primary" size="medium" @click="submitForm">确 定</el-button>
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
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>
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
          <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.fdUnit ? scope.row.material.fdUnit.unitName : '' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
<!--              <el-input v-model="scope.row.qty" type='number' :min="1"-->
<!--                        @input="qtyChange(scope.row)"-->
<!--                        placeholder="请输入数量" />-->
              <el-input
                clearable
                v-model="scope.row.qty"
                placeholder="请输入数量"
                @input="debounceQtyChange(scope.row)"
                @blur="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="price" width="120" align="right" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.price">{{ parseFloat(scope.row.price).toFixed(2) }}</span>
              <span v-else>0.00</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" align="right" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.amt">{{ parseFloat(scope.row.amt).toFixed(2) }}</span>
              <span v-else>0.00</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="计划来源" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-select v-model="scope.row.planSource" placeholder="请选择" size="small" style="width: 100%;">
                <el-option label="手工制单" value="手工制单" />
                <el-option label="引用申购单" value="引用申购单" />
              </el-select>
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
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectMMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      :warehouseValue="form.warehouseId"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMMaterialFilter>

    <!-- 引用申购单对话框 - 只在主内容区域内显示 -->
    <div v-if="referencePurchaseDialogVisible" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="referencePurchaseDialogVisible" class="local-modal-content">
          <div class="modal-header">
            <div class="modal-title">引用申购单</div>
            <el-button type="text" @click="closeReferencePurchaseDialog" class="close-btn" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
          </div>
          <div class="modal-body">
            <!-- 固定查询条件容器 -->
            <div class="query-container-fixed">
              <!-- 查询条件容器 -->
              <div class="query-container">
                <el-form :model="purchaseQueryParams" :inline="true" size="small" label-width="70px">
                  <el-row :gutter="10">
                    <el-col :span="4">
                      <el-form-item label="科室">
                        <SelectDepartment v-model="purchaseQueryParams.departmentId" style="width: 100%;" />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="单号">
                        <el-input v-model="purchaseQueryParams.purchaseBillNo" placeholder="请输入申购单号" clearable style="width: 100%;" />
                      </el-form-item>
                    </el-col>
                  </el-row>
                  <el-row :gutter="10">
                    <el-col :span="6">
                      <el-form-item label="日期">
                        <el-date-picker
                          v-model="purchaseQueryParams.beginDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="起"
                          clearable
                          style="width: 40%; margin-right: 2%;"
                        />
                        <span style="margin: 0 2%;">止</span>
                        <el-date-picker
                          v-model="purchaseQueryParams.endDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="止"
                          clearable
                          style="width: 40%; margin-left: 2%;"
                        />
                      </el-form-item>
                    </el-col>
                    <el-col :span="4">
                      <el-form-item label="状态">
                        <el-select v-model="purchaseQueryParams.planStatus" placeholder="全部" clearable style="width: 100%;">
                          <el-option label="未生成" value="0" />
                          <el-option label="已生成" value="1" />
                          <el-option label="驳回" value="2" />
                        </el-select>
                      </el-form-item>
                    </el-col>
                  </el-row>
                </el-form>
              </div>
              
              <!-- 搜索、重置、取消、确认按钮 -->
              <div class="button-container">
                <el-button 
                  type="warning" 
                  icon="el-icon-close" 
                  size="medium" 
                  :disabled="isRejectDisabled"
                  @click="handleBatchReject"
                >驳 回</el-button>
                <el-button type="primary" icon="el-icon-search" size="medium" @click="getPurchaseList">搜索</el-button>
                <el-button icon="el-icon-refresh" size="medium" @click="resetPurchaseQuery">重置</el-button>
                <el-button size="medium" @click="closeReferencePurchaseDialog">取 消</el-button>
                <el-button 
                  type="primary" 
                  size="medium" 
                  :disabled="isConfirmDisabled"
                  @click="handleSelectPurchase"
                >确 定</el-button>
              </div>
            </div>
            
            <!-- 左右分栏布局 -->
            <div class="reference-purchase-layout">
              <!-- 左边：申购单列表 -->
              <div class="purchase-list-container">
                <el-table 
                  v-loading="purchaseLoading" 
                  :data="purchaseList" 
                  border 
                  :cell-style="{padding: '8px 4px'}"
                  highlight-current-row
                  @current-change="handlePurchaseRowClick"
                  :height="purchaseTableHeight"
                >
                  <el-table-column label="" align="center" width="60" fixed="left">
                    <template slot-scope="scope">
                      <el-radio 
                        :label="scope.row.id" 
                        v-model="selectedPurchaseId"
                        @change="handlePurchaseRadioChange(scope.row)"
                      ></el-radio>
                    </template>
                  </el-table-column>
                  <el-table-column label="序号" align="center" width="70" show-overflow-tooltip>
                    <template slot-scope="scope">
                      {{ (purchaseQueryParams.pageNum - 1) * purchaseQueryParams.pageSize + scope.$index + 1 }}
                    </template>
                  </el-table-column>
                  <el-table-column label="单号" prop="purchaseBillNo" width="150" show-overflow-tooltip />
                  <el-table-column label="科室" prop="department.name" width="80" show-overflow-tooltip />
                  <el-table-column label="金额" prop="totalAmount" width="100" align="right" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span v-if="scope.row.totalAmount">{{ parseFloat(scope.row.totalAmount).toFixed(2) }}</span>
                      <span v-else>0.00</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="制单日期" prop="purchaseBillDate" width="120" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span v-if="scope.row.purchaseBillDate">{{ parseTime(scope.row.purchaseBillDate, '{y}-{m}-{d}') }}</span>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="制单人" prop="user.userName" width="120" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.user && scope.row.user.userName ? scope.row.user.userName : (scope.row.user && scope.row.user.nickName ? scope.row.user.nickName : '--') }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="状态" prop="planStatus" width="100" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <el-tag v-if="scope.row.planStatus == null || scope.row.planStatus === '' || scope.row.planStatus === '0' || scope.row.planStatus === 0" type="info" size="small">未生成</el-tag>
                      <el-tag v-else-if="scope.row.planStatus === '1' || scope.row.planStatus === 1" type="success" size="small">已生成</el-tag>
                      <el-tag v-else-if="scope.row.planStatus === '2' || scope.row.planStatus === 2" type="danger" size="small">驳回</el-tag>
                      <span v-else>--</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="驳回原因" prop="rejectReason" width="150" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.rejectReason || '--' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
                <div class="pagination-container">
                  <pagination
                    :total="purchaseTotal"
                    :page.sync="purchaseQueryParams.pageNum"
                    :limit.sync="purchaseQueryParams.pageSize"
                    @pagination="getPurchaseList"
                  />
                </div>
              </div>
              
              <!-- 右边：明细框 -->
              <div class="purchase-detail-container">
                <el-table 
                  :data="selectedPurchaseEntryList" 
                  border 
                  :cell-style="{padding: '8px 4px'}"
                  @selection-change="handlePurchaseEntrySelectionChange"
                  :height="purchaseDetailTableHeight"
                >
                  <el-table-column type="selection" width="50" align="center" fixed="left" />
                  <el-table-column label="耗材编码" width="120" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="耗材名称" prop="materialName" width="180" show-overflow-tooltip />
                  <el-table-column label="规格" prop="materialSpec" width="120" show-overflow-tooltip />
                  <el-table-column label="型号" prop="model" width="120" show-overflow-tooltip />
                  <el-table-column label="单位" prop="unit" width="80" show-overflow-tooltip />
                  <el-table-column label="数量" prop="qty" width="100" align="right" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span v-if="scope.row.qty">{{ parseFloat(scope.row.qty).toFixed(2) }}</span>
                      <span v-else>0.00</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="单价" prop="unitPrice" width="100" align="right" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span v-if="scope.row.unitPrice">{{ parseFloat(scope.row.unitPrice).toFixed(2) }}</span>
                      <span v-else>0.00</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" prop="amt" width="100" align="right" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span v-if="scope.row.amt">{{ parseFloat(scope.row.amt).toFixed(2) }}</span>
                      <span v-else>0.00</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="生产厂家" width="150" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="供应商" width="150" show-overflow-tooltip>
                    <template slot-scope="scope">
                      <span>{{ scope.row.supplierName || (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>

    <!-- 驳回原因弹窗 -->
    <el-dialog title="驳回原因" :visible.sync="rejectDialogVisible" width="500px" :close-on-click-modal="false">
      <el-form :model="rejectForm" :rules="rejectRules" ref="rejectForm" label-width="100px">
        <el-form-item label="驳回原因" prop="rejectReason">
          <el-input
            v-model="rejectForm.rejectReason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回原因"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="rejectDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="submitReject">确 定</el-button>
      </div>
    </el-dialog>

    <!-- 进度对话框 -->
    <el-dialog title="采购计划进度" :visible.sync="progressDialogVisible" width="600px" :close-on-click-modal="false">
      <div v-if="currentProgressRow" style="margin-bottom: 20px;">
        <p><strong>计划单号：</strong>{{ currentProgressRow.planNo }}</p>
        <p><strong>仓库：</strong>{{ currentProgressRow.warehouse && currentProgressRow.warehouse.name ? currentProgressRow.warehouse.name : '' }}</p>
        <p><strong>金额：</strong>{{ currentProgressRow.totalAmount ? parseFloat(currentProgressRow.totalAmount).toFixed(2) : '0.00' }}</p>
        <p><strong>单据状态：</strong>
          <el-tag v-if="currentProgressRow.planStatus === '0'" type="info">未提交</el-tag>
          <el-tag v-else-if="currentProgressRow.planStatus === '1'" type="warning">待审核</el-tag>
          <el-tag v-else-if="currentProgressRow.planStatus === '2'" type="success">已审核</el-tag>
          <el-tag v-else-if="currentProgressRow.planStatus === '3'" type="success">已执行</el-tag>
          <el-tag v-else-if="currentProgressRow.planStatus === '4'" type="danger">已取消</el-tag>
        </p>
      </div>
      <el-steps :active="getActiveStep()" direction="vertical" finish-status="success">
        <el-step
          v-for="(step, index) in progressSteps"
          :key="index"
          :title="step.title"
          :description="step.description"
          :status="step.status"
        />
      </el-steps>
      <div slot="footer" class="dialog-footer">
        <el-button @click="progressDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { listPurchasePlan, getPurchasePlan, delPurchasePlan, addPurchasePlan, updatePurchasePlan, auditPurchasePlan } from "@/api/caigou/purchasePlan";
import { listUserAll } from "@/api/system/user";
import { listPurchase, getPurchase, rejectPurchase } from "@/api/department/purchase";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectMMaterialFilter from '@/components/SelectModel/SelectMMaterialFilter';

export default {
  name: "InWarehouse",
  dicts: ['biz_status','bill_type','way_status'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectMMaterialFilter},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
      // 防抖定时器
      qtyChangeTimer: null,
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
      // 计划表格数据
      warehouseList: [],
      stkMaterialList: [],
      // 计划明细表格数据
      stkIoBillEntryList: [],
      // 用户选项列表
      userOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        departmentId: null,
        planStatus: null,
        proPerson: null,
        totalAmount: null,
        planSource: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        supplierId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        planDate: [
          { required: true, message: "制单日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      },
      // 进度对话框
      progressDialogVisible: false,
      currentProgressRow: null,
      // 引用申购单对话框
      referencePurchaseDialogVisible: false,
      purchaseList: [],
      purchaseLoading: false,
      purchaseTotal: 0,
      purchaseQueryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        departmentId: null,
        purchaseBillNo: null,
        beginDate: null,
        endDate: null,
        planStatus: null, // 计划状态：0-未生成，1-已生成，2-驳回
        purchaseBillStatus: 2, // 只显示已审核的申购单
      },
      selectedPurchaseEntryList: [], // 选中的申购单明细
      currentPurchaseRow: null, // 当前选中的申购单行
      selectedPurchaseId: null, // 当前选中的申购单ID（单选）
      selectedPurchaseEntryIds: [], // 选中的申购单明细ID列表（多选）
      // 驳回相关
      rejectDialogVisible: false,
      rejectForm: {
        rejectReason: ''
      },
      rejectRules: {
        rejectReason: [
          { required: true, message: '驳回原因不能为空', trigger: 'blur' }
        ]
      },
      progressSteps: [
        {
          title: '创建计划',
          description: '采购计划已创建，等待提交审核',
          status: 'wait'
        },
        {
          title: '提交审核',
          description: '采购计划已提交，等待审核',
          status: 'wait'
        },
        {
          title: '审核通过',
          description: '采购计划已审核通过，等待执行',
          status: 'wait'
        },
        {
          title: '执行完成',
          description: '采购计划已执行完成',
          status: 'wait'
        }
      ]
    };
  },
  created() {
    console.time('[Plan] created->getList');
    this.getList(true);
    this.getUserList();
    console.timeEnd('[Plan] created->getList');
  },
  mounted() {
    // 预绑定防抖搜索，避免频繁请求
    this.debouncedQuery = this.$_.debounce(() => {
      this.handleQuery();
    }, 300);
  },
  beforeDestroy() {
    // 清理定时器
    if (this.qtyChangeTimer) {
      clearTimeout(this.qtyChangeTimer);
    }
  },
  computed: {
    // 引用申购单弹窗表格高度
    tableHeight() {
      // 视口高度减去导航栏(50px)、弹窗头部(约60px)、分页(约60px)、底部按钮(约60px)、内边距等
      return 'calc(100vh - 280px)';
    },
    // 左边申购单列表表格高度
    purchaseTableHeight() {
      // 弹窗内容区域高度减去查询区域、按钮区域、分页区域
      // 大约：100vh - 顶部导航(60px) - 弹窗头部(60px) - 查询区域(80px) - 按钮区域(50px) - 分页区域(60px) - 内边距(40px) = 约450px
      return 450;
    },
    // 右边明细列表表格高度
    purchaseDetailTableHeight() {
      // 与左边表格相同高度
      return 450;
    },
    // 操作人姓名
    operatorName() {
      if (this.form.creater && this.form.creater.nickName) {
        return this.form.creater.nickName;
      }
      if (this.form.createBy) {
        const user = this.userOptions.find(u => u.userName === this.form.createBy || u.userId === this.form.createBy);
        return user ? user.nickName || user.userName : this.form.createBy;
      }
      return '';
    },
    // 采购员姓名
    purchaserName() {
      if (this.form.proPerson) {
        const user = this.userOptions.find(u => u.userId === this.form.proPerson || u.userId === String(this.form.proPerson));
        return user ? user.nickName || user.userName : '';
      }
      return '';
    },
    // 驳回按钮是否禁用
    isRejectDisabled() {
      if (!this.currentPurchaseRow) {
        return true;
      }
      const status = this.currentPurchaseRow.planStatus;
      // 状态为驳回(2)或已生成(1)时禁用
      return status === 2 || status === '2' || status === 1 || status === '1';
    },
    // 确认按钮是否禁用
    isConfirmDisabled() {
      if (!this.currentPurchaseRow) {
        return true;
      }
      const status = this.currentPurchaseRow.planStatus;
      // 状态为驳回(2)或已生成(1)时禁用
      return status === 2 || status === '2' || status === 1 || status === '1';
    }
  },
  methods: {
    // 为主表提供稳定的 row-key，减少 DOM 复用导致的抖动
    planRowKey(row) {
      return row.id || row.planNo;
    },
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }

        // 只对数量、金额列进行汇总，使用列属性名判断（价格列不汇总）
        if (column.property === 'qty' || column.property === 'amt') {
          const values = data.map(item => {
            const value = item[column.property];
            return isNaN(Number(value)) ? 0 : Number(value);
          });

          if (values.length > 0) {
            sums[index] = values.reduce((prev, curr) => prev + curr, 0).toFixed(2);
          } else {
            sums[index] = '0.00';
          }

          // 更新总金额
          if (column.property === 'amt') {
            this.form.totalAmount = sums[index];
          }
        } else {
          sums[index] = '';
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
    /** 查询计划列表 */
    getList(allowWhenDialog) {
      console.time('[Plan] getList total');
      if (this.DialogComponentShow && !allowWhenDialog) {
        console.log('[Plan] getList skipped because dialog is open');
        console.timeEnd('[Plan] getList total');
        return;
      }
      this.loading = true;
      const t0 = performance.now();
      listPurchasePlan(this.queryParams).then(response => {
        const t1 = performance.now();
        // 预计算展示字段，减少模板计算
        const rows = response.rows || [];
        this.warehouseList = rows.map(item => ({
          ...item,
          planDateText: item.planDate ? this.parseTime(item.planDate, '{y}-{m}-{d}') : ''
        }));
        this.total = response.total;
        this.loading = false;
        const t2 = performance.now();
        console.log('[Plan] list size=', rows.length, 'network(ms)=', (t1 - t0).toFixed(1), 'assign(ms)=', (t2 - t1).toFixed(1));
        console.timeEnd('[Plan] getList total');
      });
    },
    // 查询按钮（支持外部调用防抖）
    handleQueryDebounced() {
      if (this.debouncedQuery) {
        this.debouncedQuery();
      } else {
        this.handleQuery();
      }
    },
    checkMaterialBtn() {
      // 验证是否已选择仓库
      if (!this.form.warehouseId) {
        this.$modal.msgWarning("请先选择仓库");
        return;
      }
      //打开"弹窗组件"
      this.DialogComponentShow = true
    },
    closeDialog() {
      //关闭“弹窗组件”
      console.time('[Plan] closeDialog total');
      const t0 = performance.now();
      this.DialogComponentShow = false
      const t1 = performance.now();
      console.log('[Plan] closeDialog set DialogComponentShow=false ms=', (t1 - t0).toFixed(1));
      console.timeEnd('[Plan] closeDialog total');
    },
    selectData(lightRows) {
      console.time('[Plan] selectData total');
      const t0 = performance.now();
      const toAppend = []
      const list = lightRows || [];
      list.forEach((item) => {
        toAppend.push({
          materialId: item.id,
          qty: "",
          price: item.price,
          amt: "",
          speci: item.speci,
          model: item.model,
          beginTime: "",
          endTime: "",
          remark: "",
          material: Object.freeze(item),
        })
      })
      const t1 = performance.now();
      console.log('[Plan] select rows=', list.length, 'build objects(ms)=', (t1 - t0).toFixed(1));
      if (!toAppend.length) {
        console.timeEnd('[Plan] selectData total');
        return;
      }

      // 小批量（<=30）直接同步合并，避免 rAF 等待造成 1s+ 延迟
      if (toAppend.length <= 30) {
        const t2 = performance.now();
        this.stkIoBillEntryList = this.stkIoBillEntryList.concat(toAppend)
        const t3 = performance.now();
        console.log('[Plan] concat small size=', toAppend.length, 'concat(ms)=', (t3 - t2).toFixed(1));
        console.timeEnd('[Plan] selectData total');
        return;
      }

      // 大批量使用 rAF 合并，避免主线程长阻塞
      this.$nextTick(() => {
        const t2 = performance.now();
        requestAnimationFrame(() => {
          const t3 = performance.now();
          this.stkIoBillEntryList = this.stkIoBillEntryList.concat(toAppend)
          const t4 = performance.now();
          console.log('[Plan] concat large size=', toAppend.length, 'raf wait(ms)=', (t3 - t2).toFixed(1), 'concat(ms)=', (t4 - t3).toFixed(1));
          console.timeEnd('[Plan] selectData total');
        })
      })
    },
    getStatDate(){
      // 当前日期往前推5天
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year + "-" + month + "-" + day;
      return statDate;
    },
    getEndDate(){
      // 当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year + "-" + month + "-" + day;
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
      console.time('[Plan] cancel total');
      const t0 = performance.now();
      this.open = false;
      const t1 = performance.now();
      this.reset();
      const t2 = performance.now();
      console.log('[Plan] cancel set open=false ms=', (t1 - t0).toFixed(1), 'reset(ms)=', (t2 - t1).toFixed(1));
      console.timeEnd('[Plan] cancel total');
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        planNo: null,
        supplierId: null,
        planDate: null,
        warehouseId: null,
        departmentId: null,
        planStatus: null,
        proPerson: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        telephone: null,
        totalAmount: null,
        planSource: null,
        referenceBillNo: null,
        auditBy: null,
        auditDate: null,
        remark: null
      };
      this.stkIoBillEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      // 只允许输入数字
      if (row.qty && !/^\d+(\.\d+)?$/.test(row.qty)) {
        row.qty = row.qty.replace(/[^\d.]/g, '');
      }

      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);

      // 重新计算总金额
      this.calculateTotalAmount();
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = parseFloat(row.qty) * parseFloat(row.price);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);

      // 重新计算总金额
      this.calculateTotalAmount();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList(true);
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
    /** 进度按钮操作 */
    handleProgress(row) {
      this.progressDialogVisible = true;
      this.currentProgressRow = row;
      // 根据计划状态设置步骤状态
      this.updateProgressSteps(row.planStatus);
    },
    /** 更新进度步骤状态 */
    updateProgressSteps(planStatus) {
      // 重置所有步骤
      this.progressSteps.forEach(step => {
        step.status = 'wait';
      });
      
      // 根据计划状态设置步骤
      // planStatus: 0=未提交, 1=待审核, 2=已审核, 3=已执行, 4=已取消
      if (planStatus === '0') {
        this.progressSteps[0].status = 'finish';
      } else if (planStatus === '1') {
        this.progressSteps[0].status = 'finish';
        this.progressSteps[1].status = 'process';
      } else if (planStatus === '2') {
        this.progressSteps[0].status = 'finish';
        this.progressSteps[1].status = 'finish';
        this.progressSteps[2].status = 'process';
      } else if (planStatus === '3') {
        this.progressSteps.forEach(step => {
          step.status = 'finish';
        });
      } else if (planStatus === '4') {
        this.progressSteps.forEach(step => {
          step.status = 'error';
        });
      }
    },
    /** 获取当前激活的步骤索引 */
    getActiveStep() {
      if (!this.currentProgressRow) return 0;
      const status = this.currentProgressRow.planStatus;
      if (status === '0') return 0;
      if (status === '1') return 1;
      if (status === '2') return 2;
      if (status === '3') return 3;
      return 0;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getPurchasePlan(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.purchasePlanEntryList;
        this.open = true;
        this.action = false;
        // 查看时保持原有状态
        this.title = "查看计划";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.planStatus = '0'; // 未提交状态
      //操作人
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.planDate = this.getBillDate();
      this.title = "添加计划";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getPurchasePlan(id).then(response => {
        this.form = response.data;
        // 修改时保持原有状态，不强制设置为'1'
        this.stkIoBillEntryList = response.data.purchasePlanEntryList;
        this.open = true;
        this.title = "修改计划";
        this.action = true;
      });
    },
    /** 提交按钮（保存表单） */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.purchasePlanEntryList = this.stkIoBillEntryList;
          // 保存时保持原有状态，不自动改变状态
          // 新增时如果没有设置状态，则默认为"未提交"（0）
          if (this.form.id == null && (this.form.planStatus == null || this.form.planStatus === '')) {
            this.form.planStatus = '0'; // 未提交状态
          }
          if (this.form.id != null) {
            updatePurchasePlan(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPurchasePlan(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 批量提交按钮操作 */
    handleBatchSubmit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要提交的计划！");
        return;
      }

      // 检查选中的计划是否都是"未提交"状态
      const selectedPlans = this.warehouseList.filter(item => this.ids.includes(item.id));
      const nonUnsubmittedPlans = selectedPlans.filter(item => item.planStatus !== '0' && item.planStatus !== 0);

      if (nonUnsubmittedPlans.length > 0) {
        const statusInfo = nonUnsubmittedPlans.map(plan => `${plan.planNo}(状态:${plan.planStatus})`).join(', ');
        this.$modal.msgError(`只能提交未提交状态的计划！以下计划状态不正确：${statusInfo}`);
        return;
      }

      const planNos = selectedPlans.map(item => item.planNo).join('、');

      this.$modal.confirm('确定要提交选中的 ' + this.ids.length + ' 个计划吗？\n计划编号：' + planNos).then(() => {
        // 批量提交：将状态从"未提交"（0）改为"未提交"（1，已提交但未审核）
        // 先获取每个计划的完整数据，然后更新状态
        const submitPromises = this.ids.map(id => {
          return getPurchasePlan(id).then(response => {
            const plan = response.data;
            plan.planStatus = '1'; // 未提交状态（已提交但未审核）
            return updatePurchasePlan(plan);
          });
        });
        
        Promise.all(submitPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量提交成功！共提交 " + this.ids.length + " 个计划");
        }).catch(() => {
          this.$modal.msgError("批量提交失败！");
        });
      }).catch(() => {});
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除计划编号为"' + ids + '"的数据项？').then(function() {
        return delPurchasePlan(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 计划明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 计划明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.planSource = "手工制单";
      obj.batchNo = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 计划明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的计划明细数据");
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
      this.download('caigou/jihua/export', {
        ...this.queryParams
      }, `purchase_plan_${new Date().getTime()}.xlsx`)
    },
    /** 防抖数量变化 */
    debounceQtyChange(row) {
      if (this.qtyChangeTimer) {
        clearTimeout(this.qtyChangeTimer);
      }
      this.qtyChangeTimer = setTimeout(() => {
        this.qtyChange(row);
      }, 300);
    },
    /** 获取行键 */
    getRowKey(row, index) {
      return row.id || index;
    },
    /** 计算总金额 */
    calculateTotalAmount() {
      let total = 0;
      this.stkIoBillEntryList.forEach(item => {
        if (item.amt) {
          total += parseFloat(item.amt);
        }
      });
      this.form.totalAmount = total.toFixed(2);
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    /** 获取制单人姓名 */
    getCreatorName(row) {
      // 优先使用 creater.nickName
      if (row.creater && row.creater.nickName) {
        return row.creater.nickName;
      }
      // 如果没有 creater 对象，根据 createBy 查找用户姓名
      if (row.createBy) {
        const user = this.userOptions.find(u => u.userName === row.createBy || u.userId === row.createBy);
        return user ? (user.nickName || user.userName) : row.createBy;
      }
      return '';
    },
    /** 获取审核人姓名 */
    getAuditorName(row) {
      if (row.auditBy) {
        // 先尝试通过userId查找用户（支持数字和字符串类型）
        const userById = this.userOptions.find(u => {
          return u.userId == row.auditBy || 
                 u.userId === row.auditBy || 
                 String(u.userId) === String(row.auditBy) ||
                 u.userId === Number(row.auditBy);
        });
        if (userById) {
          return userById.nickName || userById.userName;
        }
        // 再尝试通过userName查找用户
        const userByName = this.userOptions.find(u => u.userName === row.auditBy);
        if (userByName) {
          return userByName.nickName || userByName.userName;
        }
        // 再尝试通过nickName查找用户
        const userByNickName = this.userOptions.find(u => u.nickName === row.auditBy);
        if (userByNickName) {
          return userByNickName.nickName || userByNickName.userName;
        }
        // 如果auditBy不是纯数字，可能是姓名，直接返回
        if (!/^\d+$/.test(String(row.auditBy))) {
          return row.auditBy;
        }
        // 如果auditBy是纯数字但找不到用户，返回"--"而不是空字符串
        return '--';
      }
      return '--';
    },
    /** 引用申购单按钮操作 */
    handleReferencePurchase() {
      // 验证是否已选择仓库
      if (!this.form.warehouseId) {
        this.$modal.msgWarning("请先选择仓库");
        return;
      }
      // 设置查询参数中的仓库ID
      this.purchaseQueryParams.warehouseId = this.form.warehouseId;
      this.purchaseQueryParams.pageNum = 1;
      // 清空选中的明细
      this.selectedPurchaseEntryList = [];
      this.currentPurchaseRow = null;
      this.selectedPurchaseId = null;
      this.selectedPurchaseEntryIds = [];
      // 打开引用申购单对话框
      this.referencePurchaseDialogVisible = true;
      this.getPurchaseList();
    },
    /** 查询申购单列表 */
    getPurchaseList() {
      this.purchaseLoading = true;
      listPurchase(this.purchaseQueryParams).then(response => {
        this.purchaseList = response.rows || [];
        this.purchaseTotal = response.total || 0;
        this.purchaseLoading = false;
      }).catch(() => {
        this.purchaseLoading = false;
      });
    },
    /** 点击申购单行，加载明细 */
    /** 处理申购单单选变化 */
    handlePurchaseRadioChange(row) {
      if (row) {
        this.handlePurchaseRowClick(row);
      }
    },
    /** 处理申购单明细选择变化 */
    handlePurchaseEntrySelectionChange(selection) {
      this.selectedPurchaseEntryIds = selection.map(item => item.id || item.materialId);
    },
    handlePurchaseRowClick(row) {
      if (!row) {
        this.selectedPurchaseEntryList = [];
        this.currentPurchaseRow = null;
        this.selectedPurchaseEntryIds = [];
        return;
      }
      this.currentPurchaseRow = row;
      // 获取申购单详情（包含明细）
      getPurchase(row.id).then(response => {
        const purchaseData = response.data;
        if (purchaseData && purchaseData.depPurchaseApplyEntryList && purchaseData.depPurchaseApplyEntryList.length > 0) {
          // 处理明细数据，确保有material对象
          this.selectedPurchaseEntryList = purchaseData.depPurchaseApplyEntryList.map(entry => {
            return {
              ...entry,
              materialCode: entry.materialCode || (entry.material && entry.material.code) || '',
              materialName: entry.materialName || (entry.material && entry.material.name) || '',
              materialSpec: entry.materialSpec || (entry.material && entry.material.speci) || '',
              model: entry.model || (entry.material && entry.material.model) || '',
              unit: entry.unit || (entry.material && entry.material.fdUnit && entry.material.fdUnit.unitName) || '',
              unitPrice: entry.unitPrice || (entry.material && entry.material.price) || 0,
              qty: entry.qty || 0,
              amt: entry.amt || (entry.qty || 0) * (entry.unitPrice || (entry.material && entry.material.price) || 0),
              supplierName: entry.supplierName || (entry.material && entry.material.supplier && entry.material.supplier.name) || '',
              material: entry.material
            };
          });
        } else {
          this.selectedPurchaseEntryList = [];
        }
      }).catch(() => {
        this.$modal.msgError("获取申购单详情失败");
        this.selectedPurchaseEntryList = [];
      });
    },
    /** 重置查询条件 */
    resetPurchaseQuery() {
      this.purchaseQueryParams.departmentId = null;
      this.purchaseQueryParams.purchaseBillNo = null;
      this.purchaseQueryParams.beginDate = null;
      this.purchaseQueryParams.endDate = null;
      this.purchaseQueryParams.planStatus = null;
      this.purchaseQueryParams.pageNum = 1;
      this.selectedPurchaseId = null;
      this.selectedPurchaseEntryIds = [];
      this.selectedPurchaseEntryList = [];
      this.currentPurchaseRow = null;
      this.getPurchaseList();
    },
    /** 关闭引用申购单弹窗 */
    closeReferencePurchaseDialog() {
      this.referencePurchaseDialogVisible = false;
      // 重置选择状态
      this.selectedPurchaseId = null;
      this.selectedPurchaseEntryIds = [];
      this.selectedPurchaseEntryList = [];
      this.currentPurchaseRow = null;
    },
    /** 批量驳回 */
    handleBatchReject() {
      if (!this.selectedPurchaseId) {
        this.$modal.msgWarning("请先选择一条申购单");
        return;
      }
      // 打开驳回原因弹窗
      this.rejectForm.rejectReason = '';
      this.rejectDialogVisible = true;
    },
    /** 提交驳回 */
    submitReject() {
      this.$refs["rejectForm"].validate(valid => {
        if (valid) {
          if (!this.selectedPurchaseId) {
            this.$modal.msgWarning("请先选择一条申购单");
            return;
          }
          // 驳回选中的申购单
          rejectPurchase({
            id: this.selectedPurchaseId,
            rejectReason: this.rejectForm.rejectReason
          }).then(() => {
            this.$modal.msgSuccess("驳回成功");
            this.rejectDialogVisible = false;
            this.selectedPurchaseId = null;
            // 刷新列表
            this.getPurchaseList();
          }).catch(() => {
            this.$modal.msgError("驳回失败");
          });
        }
      });
    },
    /** 选择申购单 - 将明细添加到计划明细中 */
    handleSelectPurchase() {
      if (!this.currentPurchaseRow) {
        this.$modal.msgWarning("请先选择申购单");
        return;
      }
      if (!this.selectedPurchaseEntryList || this.selectedPurchaseEntryList.length === 0) {
        this.$modal.msgWarning("该申购单没有明细数据");
        return;
      }
      // 如果选择了明细项，只添加选中的明细；否则添加所有明细
      const entriesToAdd = this.selectedPurchaseEntryIds.length > 0
        ? this.selectedPurchaseEntryList.filter(entry => {
            const entryId = entry.id || entry.materialId;
            return this.selectedPurchaseEntryIds.includes(entryId);
          })
        : this.selectedPurchaseEntryList;
      
      if (entriesToAdd.length === 0) {
        this.$modal.msgWarning("请至少选择一条明细数据");
        return;
      }
      
      // 将选中的申购单明细添加到计划明细中
      entriesToAdd.forEach(entry => {
        if (entry.material || entry.materialId) {
          let obj = {};
          obj.materialId = entry.materialId || (entry.material && entry.material.id);
          // 确保 material 对象包含所有必要的字段
          obj.material = entry.material ? {
            ...entry.material,
            speci: entry.material.speci || entry.materialSpec || '',
            model: entry.material.model || entry.model || '',
            fdUnit: entry.material.fdUnit || (entry.unit ? { unitName: entry.unit } : null),
            fdWarehouseCategory: entry.material.fdWarehouseCategory || null,
            fdFinanceCategory: entry.material.fdFinanceCategory || null
          } : null;
          obj.qty = entry.qty || 0;
          obj.price = entry.unitPrice || entry.price || (entry.material && entry.material.price) || 0;
          obj.amt = entry.amt || (entry.qty || 0) * (entry.unitPrice || entry.price || (entry.material && entry.material.price) || 0);
          obj.speci = entry.materialSpec || entry.speci || (entry.material && entry.material.speci) || '';
          obj.model = entry.model || (entry.material && entry.material.model) || '';
          obj.remark = entry.remark || '';
          // 设置计划来源为来源科室（从当前选中的申购单获取科室名称）
          obj.planSource = this.currentPurchaseRow && this.currentPurchaseRow.department && this.currentPurchaseRow.department.name 
            ? this.currentPurchaseRow.department.name 
            : '引用申购单';
          this.stkIoBillEntryList.push(obj);
        }
      });
      
      // 设置计划来源和引用单号
      if (this.currentPurchaseRow) {
        this.form.planSource = '引用申购单';
        this.form.referenceBillNo = this.currentPurchaseRow.purchaseBillNo || '';
      }
      
      // 重新计算总金额
      this.calculateTotalAmount();
      this.$modal.msgSuccess("引用申购单成功");
      this.referencePurchaseDialogVisible = false;
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 只在主内容区域内显示，不覆盖左侧菜单栏 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  background: #fff;
}

/* 分页容器样式 */
.pagination-container {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #EBEEF5;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
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

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 10px;
}

.local-modal-content .table-wrapper .el-table {
  height: 48vh;
  max-height: 48vh;
  width: 100%;
}

.local-modal-content .table-wrapper .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
  overflow-y: auto;
  overflow-x: auto;
}

.local-modal-content .table-wrapper .el-table {
    width: 100%;
  }

.modal-footer .el-button {
  margin-left: 8px;
}

/* 弹窗动画 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-zoom-enter, .modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.7) translateY(-50px);
}

  /* 确保页面容器有相对定位，以便内部弹窗正确定位 */
  .app-container {
    position: relative;
    overflow: hidden; /* 防止弹窗超出容器 */
  }

  /* 查询条件紧凑布局 */
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
    display: flex;
    align-items: center;
  }

  .query-item-status-aligned .el-form-item__label {
    width: 80px !important;
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
    padding: 0 12px;
    line-height: 1.5;
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

  /* 弹窗内表单紧凑布局 */
  .local-modal-content .modal-form-compact .el-row {
    margin-bottom: 10px;
    display: flex;
    flex-wrap: nowrap;
  }

  .local-modal-content .modal-form-compact .el-row .el-col {
    flex-shrink: 0;
  }

  .local-modal-content .modal-form-compact .el-form-item {
    margin-bottom: 0;
    white-space: nowrap;
  }

  .local-modal-content .modal-form-compact .el-form-item__label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .local-modal-content .modal-form-compact .el-input,
  .local-modal-content .modal-form-compact .el-select,
  .local-modal-content .modal-form-compact .el-date-picker {
    width: 140px;
    max-width: 140px;
  }

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

  /* 表单字段容器 */
  .form-fields-container {
    background: #fff;
    padding: 15px 20px;
    border-radius: 6px;
    margin-bottom: 15px;
    border: 1px solid #EBEEF5;
  }

  /* 分页组件样式 */
  .table-pagination {
    margin-top: 16px;
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

  /* 加粗滚动条 - 覆盖所有表格滚动条 */
  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar {
    height: 14px !important;
    width: 14px !important;
  }
  
  /* 明细框表格水平滚动条 */
  .local-modal-content .table-wrapper .el-table__body-wrapper::-webkit-scrollbar {
    height: 14px !important;
    width: 14px !important;
  }
  
  .local-modal-content .table-wrapper .el-table__body-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 7px !important;
  }
  
  .local-modal-content .table-wrapper .el-table__body-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 7px !important;
  }
  
  .local-modal-content .table-wrapper .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8 !important;
  }
  .local-modal-content .el-table::-webkit-scrollbar,
  .local-modal-content .table-wrapper::-webkit-scrollbar {
    width: 10px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-track,
  .local-modal-content .el-table::-webkit-scrollbar-track,
  .local-modal-content .table-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1 !important;
    border-radius: 7px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb,
  .local-modal-content .el-table::-webkit-scrollbar-thumb,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1 !important;
    border-radius: 7px !important;
  }

  .local-modal-content .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
  .local-modal-content .el-table::-webkit-scrollbar-thumb:hover,
  .local-modal-content .table-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8 !important;
  }

  /* 确保主表格可以水平滚动和垂直滚动 */
  ::v-deep .el-table__body-wrapper {
    overflow-x: auto !important;
    overflow-y: auto !important;
  }

  /* 主表格水平滚动条增粗 */
  ::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar,
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
    width: 16px !important; /* 垂直滚动条宽度 */
    height: 8px !important;  /* 水平滚动条高度 */
  }

  ::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-track,
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 8px;
  }

  ::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 8px;
  }

  ::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
  ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* 确保操作列固定 */
  ::v-deep .el-table__fixed-right {
    right: 0 !important;
    z-index: 12 !important;
    position: absolute !important;
  }

  ::v-deep .el-table__fixed-header-wrapper {
    z-index: 11;
  }

  ::v-deep .el-table__fixed-right-patch {
    right: 0 !important;
    z-index: 12 !important;
  }

  /* 确保固定列头部和主体都有正确的z-index */
  ::v-deep .el-table__fixed-right .el-table__header-wrapper {
    z-index: 12 !important;
  }

  ::v-deep .el-table__fixed-right .el-table__body-wrapper {
    z-index: 12 !important;
  }

  /* 确保固定列在滚动时保持固定 */
  ::v-deep .el-table__fixed {
    position: absolute !important;
  }

  ::v-deep .el-table__fixed-right {
    position: absolute !important;
    right: 0 !important;
  }

  /* 确保表格可以水平滚动 */
  ::v-deep .el-table {
    overflow-x: auto;
  }

  /* 表格样式优化 - 引用申购单弹窗 */
  .modal-body .el-table {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
  }

  .modal-body .el-table th {
    background-color: #F5F7FA !important;
    color: #606266;
    font-weight: 500;
    height: 50px;
    padding: 8px 0;
    border-bottom: 1px solid #EBEEF5;
  }

  .modal-body .el-table td {
    padding: 12px 0;
    color: #606266;
    border-bottom: 1px solid #EBEEF5;
  }

  .modal-body .el-table tr:hover > td {
    background-color: #F5F7FA !important;
    transition: all 0.3s;
  }

  /* 引用申购单弹窗布局样式 */
  .query-container-fixed {
    position: sticky;
    top: 0;
    z-index: 10;
    background: #fff;
    flex-shrink: 0;
  }

  .query-container {
    background: #fff;
    padding: 2px 20px 4px 20px !important;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 0;
    width: calc(100% + 40px);
    margin-left: -20px;
    margin-right: -20px;
  }

  .query-container .el-form {
    margin-bottom: 0 !important;
  }

  .query-container ::v-deep .el-row {
    margin-bottom: 4px;
  }

  .query-container ::v-deep .el-row:last-child {
    margin-bottom: 0;
  }

  .query-container ::v-deep .el-form-item {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
    padding-bottom: 0 !important;
  }

  .query-container ::v-deep .el-form-item {
    margin-bottom: 0 !important;
    margin-top: 0 !important;
    padding-bottom: 0 !important;
    display: flex !important;
    align-items: center !important;
    white-space: nowrap !important;
  }

  .query-container ::v-deep .el-form-item__label {
    padding-bottom: 0 !important;
    padding-top: 0 !important;
    line-height: 28px !important;
    height: 28px !important;
    width: 70px !important;
    flex-shrink: 0 !important;
    white-space: nowrap !important;
  }

  .query-container ::v-deep .el-form-item__content {
    line-height: 34px !important;
    margin-left: 0 !important;
    flex: 1 !important;
    white-space: nowrap !important;
  }

  .query-container ::v-deep .el-input__inner {
    height: 34px !important;
    line-height: 34px !important;
    font-size: 13px !important;
  }

  .query-container ::v-deep .el-input__icon {
    line-height: 34px !important;
  }

  .query-container ::v-deep .el-date-editor.el-input {
    width: 140px;
    height: 34px !important;
  }

  .query-container ::v-deep .el-date-editor .el-input__inner {
    height: 34px !important;
    line-height: 34px !important;
    font-size: 13px !important;
  }

  .query-container ::v-deep .el-select {
    width: 150px;
  }

  .query-container ::v-deep .el-select .el-input__inner {
    height: 34px !important;
    line-height: 34px !important;
    font-size: 13px !important;
  }

  .query-container ::v-deep .el-select .el-input__icon {
    line-height: 34px !important;
  }

  /* 按钮容器 - 放在查询条件和左右分栏之间 */
  .button-container {
    text-align: left;
    margin: 10px 0;
    padding: 0 20px;
  }

  .button-container .el-button {
    margin-right: 10px;
  }

  .modal-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .reference-purchase-layout {
    display: flex;
    gap: 16px;
    flex: 1;
    overflow: hidden;
    min-height: 0;
    margin-left: -20px;
    margin-right: -20px;
    width: calc(100% + 40px);
  }

  .purchase-list-container {
    flex: 0 0 600px;
    display: flex;
    flex-direction: column;
    border: 1px solid #EBEEF5;
    border-radius: 4px;
    overflow: hidden;
    margin-left: -20px;
    min-height: 0;
  }

  .purchase-list-container .el-table {
    flex: 1;
    margin-bottom: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .purchase-list-container ::v-deep .el-table__body-wrapper {
    overflow-y: auto !important;
    overflow-x: auto !important;
  }

  .purchase-list-container ::v-deep .el-table__header-wrapper {
    flex-shrink: 0;
  }

  /* 确保选择框列可见 */
  .purchase-list-container ::v-deep .el-table__body-wrapper,
  .purchase-list-container ::v-deep .el-table__header-wrapper {
    min-width: 100%;
  }

  .purchase-list-container ::v-deep .el-table__fixed,
  .purchase-list-container ::v-deep .el-table__fixed-right {
    height: 100% !important;
  }

  /* 隐藏radio按钮中的文本，只显示圆圈 */
  .purchase-list-container ::v-deep .el-radio__label {
    display: none !important;
    padding-left: 0 !important;
  }

  .purchase-list-container ::v-deep .el-radio {
    margin-right: 0 !important;
  }

  /* 优化列间距 */
  .purchase-list-container ::v-deep .el-table td,
  .purchase-list-container ::v-deep .el-table th {
    padding: 8px 6px !important;
  }

  /* 单号和科室列之间的间距优化 */
  .purchase-list-container ::v-deep .el-table td:nth-child(4),
  .purchase-list-container ::v-deep .el-table th:nth-child(4) {
    padding-right: 10px !important;
  }

  .purchase-list-container ::v-deep .el-table td:nth-child(5),
  .purchase-list-container ::v-deep .el-table th:nth-child(5) {
    padding-left: 10px !important;
  }

  .purchase-detail-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    border: 1px solid #EBEEF5;
    border-radius: 4px;
    overflow: hidden;
    min-height: 0;
  }

  .purchase-detail-container .el-table {
    flex: 1;
    margin-bottom: 0;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .purchase-detail-container ::v-deep .el-table__body-wrapper {
    overflow-y: auto !important;
    overflow-x: auto !important;
  }

  .purchase-detail-container ::v-deep .el-table__header-wrapper {
    flex-shrink: 0;
  }

  /* 确保选择框列可见 */
  .purchase-detail-container ::v-deep .el-table__body-wrapper,
  .purchase-detail-container ::v-deep .el-table__header-wrapper {
    min-width: 100%;
  }

  .purchase-detail-container ::v-deep .el-table__fixed,
  .purchase-detail-container ::v-deep .el-table__fixed-right {
    height: 100% !important;
  }

  .purchase-list-container .pagination-container {
    padding: 10px;
    border-top: 1px solid #EBEEF5;
    background: #F5F7FA;
    flex-shrink: 0;
    display: flex;
    justify-content: flex-end;
  }
</style>
