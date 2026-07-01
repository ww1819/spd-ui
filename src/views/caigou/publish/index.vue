<template>
  <div class="app-container caigou-publish-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item prop="orderNo" class="query-item-inline">
            <el-input v-model="queryParams.orderNo"
                      placeholder="订单单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>
          <el-form-item prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId"/>
            </div>
          </el-form-item>
          <el-form-item prop="orderStatus" class="query-item-inline">
            <el-select v-model="queryParams.orderStatus" placeholder="单据状态" clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item prop="pushStatus" class="query-item-inline">
            <el-select v-model="queryParams.pushStatus" placeholder="是否发布" clearable style="width: 120px">
              <el-option label="已发布" value="1" />
              <el-option label="未发布" value="0" />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="24">
          <el-form-item prop="dateType" class="query-item-inline query-date-range-form-item">
            <div class="query-date-range-inner">
              <el-select v-model="queryParams.dateType" placeholder="时间类型" style="width: 120px; margin-right: 8px;">
                <el-option label="制单时间" value="createTime" />
                <el-option label="审核时间" value="auditDate" />
                <el-option label="发布时间" value="pushTime" />
              </el-select>
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                style="width: 180px;"
              />
              <span class="query-date-range-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                style="width: 180px;"
              />
            </div>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleBatchAudit"
          :disabled="multiple"
          v-hasPermi="['caigou:dingdan:audit']"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['caigou:dingdan:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" size="medium" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" size="medium" @click="resetQuery">重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleBatchPublish"
          :disabled="multiple"
        >发布</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          size="medium"
          @click="handleBatchVoid"
          :disabled="multiple"
        >作废</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table ref="mainListTable"
              v-loading="loading" :data="orderList"
              class="table-compact"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
              :height="mainListTableHeight"
              stripe border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="220" min-width="180" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
        <template slot-scope="scope">
          <span class="publish-cell-ellipsis">{{ scope.row.supplier && scope.row.supplier.name ? scope.row.supplier.name : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="供应商编码" align="center" prop="supplier.code" width="120" min-width="100" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']">
        <template slot-scope="scope">
          <span class="publish-cell-ellipsis">{{ formatSpdSupplierCode(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="对照平台编码" align="center" width="165" min-width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span class="publish-cell-ellipsis">{{ formatBindScmSupplierCode(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发布平台编码" align="center" width="165" min-width="150" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span class="publish-cell-ellipsis">{{ formatOrderScmSupplierCode(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单时间" align="center" prop="orderDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.orderDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="orderStatus" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="165" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createTime ? parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createByName || resolveUserName(scope.row.createBy) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发布状态" align="center" width="90" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.pushStatus == 1 || scope.row.pushStatus === '1'" type="success" size="small">已发布</el-tag>
          <el-tag v-else-if="scope.row.pushStatus == 2 || scope.row.pushStatus === '2'" type="warning" size="small">发布失败</el-tag>
          <el-tag v-else type="info" size="small">未发布</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="发布人" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.pushByName || resolveUserName(scope.row.pushBy) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="发布时间" align="center" prop="pushTime" width="165" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.pushTime ? parseTime(scope.row.pushTime, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="作废状态" align="center" width="90" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-tag v-if="scope.row.voidWholeFlag == 1 || scope.row.voidWholeFlag === 1" type="danger" size="small">已作废</el-tag>
          <el-tag v-else type="info" size="small">正常</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="作废人" align="center" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.voidWholeByName || resolveUserName(scope.row.voidWholeBy) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="作废时间" align="center" prop="voidWholeTime" width="165" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.voidWholeTime ? parseTime(scope.row.voidWholeTime, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditBy">{{ getAuditorName(scope.row) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.planNo">{{ scope.row.planNo }}</span>
          <span v-else-if="scope.row.remark && scope.row.remark.includes('从采购计划')">
            {{ extractPlanNoFromRemark(scope.row.remark) }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handleView(scope.row)"
          >查看</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 查看订单对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <div>
                <el-button v-if="form.planId" type="primary" size="small" @click="handleViewPlan">查看采购计划</el-button>
                <el-button v-if="form.planId" type="primary" size="small" @click="handleShowApplyBillNoList">查看申购单</el-button>
                <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
              </div>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px" size="small" class="modal-form-compact">
        <div class="form-fields-container">
        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="单据状态" prop="orderStatus" label-width="100px">
              <el-select v-model="form.orderStatus" placeholder="请选择单据状态"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="供应商编码" label-width="100px">
              <el-input :value="formatSpdSupplierCode(form)" :disabled="true" placeholder="fd_supplier.code" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="对照平台编码" label-width="100px">
              <el-input :value="formatBindScmSupplierCode(form)" :disabled="true" placeholder="绑定表当前对照" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="发布平台编码" label-width="100px">
              <el-input :value="formatOrderScmSupplierCode(form)" :disabled="true" placeholder="订单发布回写" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="订单时间" prop="orderDate" label-width="100px">
              <el-input :value="parseTime(form.orderDate, '{y}-{m}-{d} {h}:{i}:{s}')" :disabled="true" placeholder="订单时间" style="width: 200px" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="联系电话" prop="contactPhone" label-width="100px">
              <el-input v-model="form.contactPhone" :disabled="true" placeholder="联系电话" />
            </el-form-item>
          </el-col>

        </el-row>

        <el-row :gutter="8">

          <el-col :span="4">
            <el-form-item label="采购员" prop="contactPerson" label-width="100px">
              <SelectUser v-model="form.contactPerson" :disabled="true"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount" label-width="100px">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
        </el-row>

        </div>
        <div class="modal-detail-section">
        <el-row :gutter="10" class="mb8 detail-toolbar-row">
          <el-col :span="1.5">
            <span>订单明细信息</span>
          </el-col>
        </el-row>
        <div class="table-wrapper">
        <el-table :data="purchaseOrderEntryList" :row-class-name="rowPurchaseOrderEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handlePurchaseOrderEntrySelectionChange"
                  ref="purchaseOrderEntry"
                  :height="detailTableHeight"
                  border
        >
          <el-table-column label="序号" align="center" type="index" width="50" :index="index => index + 1"/>
          <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || scope.row.materialCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="名称" align="center" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.materialSpec || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || scope.row.materialUnit || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.material && scope.row.material.fdUnit ? scope.row.material.fdUnit.unitName : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库存数量" align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.stockQty != null ? scope.row.stockQty : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="订单数量" align="center" prop="orderQty" width="100" show-overflow-tooltip resizable/>
          <el-table-column label="单价" align="right" prop="unitPrice" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice != null ? Number(scope.row.unitPrice).toFixed(2) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" align="right" prop="totalAmount" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.totalAmount != null ? Number(scope.row.totalAmount).toFixed(2) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="操作" align="center" width="120" fixed="right">
            <template slot-scope="scope">
              <el-button v-if="scope.row.planEntryId" type="text" size="small" @click="handleViewApplyDetails(scope.row)">查看申购明细</el-button>
              <span v-else>--</span>
            </template>
          </el-table-column>
        </el-table>
        </div>
        </div>
      </el-form>
            <div class="modal-footer">
              <el-button @click="cancel">关 闭</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 查看申购单弹窗：表头 科室申购单号、仓库、制单人、制单时间、提交人、提交时间、审核人、审核时间 -->
    <el-dialog title="查看申购单" :visible.sync="applyBillNoDialogVisible" width="95%" append-to-body>
      <el-table :data="applyBillHeaderList" border max-height="450">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="科室申购单号" prop="applyBillNo" min-width="140" show-overflow-tooltip />
        <el-table-column label="仓库" prop="warehouseName" min-width="120" show-overflow-tooltip />
        <el-table-column label="制单人" prop="createByName" width="100" show-overflow-tooltip />
        <el-table-column label="制单时间" prop="createTime" width="160" show-overflow-tooltip />
        <el-table-column label="提交人" prop="submitByName" width="100" show-overflow-tooltip />
        <el-table-column label="提交时间" prop="submitTime" width="160" show-overflow-tooltip />
        <el-table-column label="审核人" prop="auditByName" width="100" show-overflow-tooltip />
        <el-table-column label="审核时间" prop="auditTime" width="160" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="applyBillNoDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 查看申购明细弹窗 -->
    <el-dialog title="申购明细" :visible.sync="applyDetailDialogVisible" width="900px" append-to-body>
      <el-table :data="applyDetailList" border max-height="400">
        <el-table-column label="科室申购单单号" prop="applyBillNo" width="140" show-overflow-tooltip />
        <el-table-column label="申购科室" prop="departmentName" width="120" show-overflow-tooltip />
        <el-table-column label="申购数量" prop="qty" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.qty != null ? Number(scope.row.qty) : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="制单人" prop="createByName" width="100" show-overflow-tooltip />
        <el-table-column label="制单时间" prop="createTime" width="160" show-overflow-tooltip />
        <el-table-column label="审核人" prop="auditByName" width="100" show-overflow-tooltip />
        <el-table-column label="审核时间" prop="auditTime" width="160" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="applyDetailDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <!-- 查看采购计划弹窗：表头 计划单号、仓库、制单人、制单时间、提交人、提交时间、审核人、审核时间；明细 耗材编码等 -->
    <el-dialog title="查看采购计划" :visible.sync="planViewDialogVisible" width="95%" append-to-body>
      <div v-if="planDetail" class="plan-view-header" style="display:flex;flex-wrap:wrap;gap:16px 24px;margin-bottom:12px;">
        <span><strong>计划单号：</strong>{{ planDetail.planNo || '--' }}</span>
        <span><strong>仓库：</strong>{{ planDetail.warehouse && planDetail.warehouse.name ? planDetail.warehouse.name : '--' }}</span>
        <span><strong>制单人：</strong>{{ planDetail.createByName || '--' }}</span>
        <span><strong>制单时间：</strong>{{ planDetail.createTime ? parseTime(planDetail.createTime, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
        <span><strong>提交人：</strong>{{ planDetail.updateByName || '--' }}</span>
        <span><strong>提交时间：</strong>{{ planDetail.updateTime ? parseTime(planDetail.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
        <span><strong>审核人：</strong>{{ planDetail.auditByName || '--' }}</span>
        <span><strong>审核时间：</strong>{{ planDetail.auditDate ? parseTime(planDetail.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : '--' }}</span>
      </div>
      <el-table v-if="planDetail && planDetail.purchasePlanEntryList" :data="planDetail.purchasePlanEntryList" border max-height="420">
        <el-table-column type="index" label="序号" width="60" align="center" />
        <el-table-column label="耗材编码" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="名称" width="140" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.name) || scope.row.materialName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="规格" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.speci) || scope.row.speci || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.model) || scope.row.model || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" width="80" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.fdUnit ? scope.row.material.fdUnit.unitName : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.stockQty != null ? scope.row.stockQty : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="订单数量" prop="qty" width="100" align="right" />
        <el-table-column label="单价" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.price != null ? Number(scope.row.price).toFixed(2) : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100" align="right">
          <template slot-scope="scope">
            <span>{{ scope.row.amt != null ? Number(scope.row.amt).toFixed(2) : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="生产厂家" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="包装规格" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="注册证号" width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库房分类" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="财务分类" width="100" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip />
      </el-table>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="planViewDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { listDingdan, getDingdan, publishDingdan, auditDingdan, voidWholeDingdan } from "@/api/caigou/dingdan";
import { getApplyDetails, getApplyBillNoList, getApplyBillHeaderList, getPurchasePlan } from "@/api/caigou/purchasePlan";
import { listUserAll } from "@/api/system/user";
import SelectSupplier from '@/components/SelectModel/SelectSupplier.vue';
import SelectMaterial from '@/components/SelectModel/SelectMaterial.vue';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse.vue';
import SelectUser from '@/components/SelectModel/SelectUser.vue';

export default {
  name: "PurchaseOrderAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedPurchaseOrderEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 订单表格数据
      orderList: [],
      // 订单明细表格数据
      purchaseOrderEntryList: [],
      // 用户列表
      userOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        supplierId: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null, // 单据状态查询条件
        pushStatus: null,
        dateType: 'createTime',
        userId: null,
        orderType: "1", // 采购订单类型
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
        orderByColumn: 'po.create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
      // 查看申购单号/申购明细/采购计划弹窗
      applyBillNoDialogVisible: false,
      applyBillNoList: [],
      applyBillHeaderList: [],
      applyDetailDialogVisible: false,
      applyDetailList: [],
      planViewDialogVisible: false,
      planDetail: null,
      /** 主列表表格高度（像素），由 syncMainListTableHeight 按视口与表格位置计算 */
      mainListTableHeight: 400
    };
  },
  created() {
    this.getList();
    this.getUserList();
    this.$nextTick(() => this.syncMainListTableHeight());
  },
  mounted() {
    this.syncMainListTableHeight();
    window.addEventListener('resize', this.syncMainListTableHeight);
  },
  activated() {
    this.$nextTick(() => this.syncMainListTableHeight());
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.syncMainListTableHeight);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.syncMainListTableHeight());
    }
  },
  computed: {
    /** 与到货验收「查看入库」弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    }
  },
  methods: {
    syncMainListTableHeight() {
      this.$nextTick(() => {
        if (typeof window === 'undefined') return;
        const innerH =
          (window.visualViewport && window.visualViewport.height) ||
          window.innerHeight ||
          800;
        const vm = this.$refs.mainListTable;
        const el = vm && vm.$el;
        if (!el || typeof el.getBoundingClientRect !== 'function') {
          this.mainListTableHeight = Math.max(220, Math.floor(innerH - 480));
          return;
        }
        const top = el.getBoundingClientRect().top;
        // 为底部分页 + 合计行 + 底边距预留（按视口实测，避免 100vh 与主内容区不一致导致改 reserve 无效）
        const bottomReserve = 100;
        const h = innerH - top - bottomReserve;
        this.mainListTableHeight = Math.max(220, Math.floor(h));
        this.$nextTick(() => {
          if (vm && typeof vm.doLayout === 'function') {
            vm.doLayout();
          }
        });
      });
    },
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if (column.property === 'orderQty' || column.property === 'unitPrice' || column.property === 'totalAmount') {
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) return prev + curr;
              return prev;
            }, 0);
            if (column.property !== 'orderQty') sums[index] = Number(sums[index]).toFixed(2);
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
    /** 查询订单列表 */
    getList() {
      this.loading = true;
      listDingdan(this.queryParams).then(response => {
        this.orderList = response.rows;
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => this.syncMainListTableHeight());
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
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 查看申购明细（订单明细行：根据计划明细ID查） */
    handleViewApplyDetails(row) {
      if (!row || !row.planEntryId) return;
      getApplyDetails(row.planEntryId).then(response => {
        const data = response && response.data;
        this.applyDetailList = (Array.isArray(data) ? data : (data && data.data) || []) || [];
        this.applyDetailDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取申购明细失败");
      });
    },
    /** 表头「查看申购单」：根据订单的 planId 查申购单号列表 */
    handleShowApplyBillNoList() {
      if (!this.form.planId) {
        this.$modal.msgInfo("无关联采购计划");
        return;
      }
      getApplyBillHeaderList(this.form.planId).then(response => {
        const list = (response && response.data) ? (Array.isArray(response.data) ? response.data : (response.data.data || [])) : [];
        this.applyBillHeaderList = list.length > 0 ? list : [];
        this.applyBillNoDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取申购单列表失败");
      });
    },
    /** 表头「查看采购计划」：打开关联的采购计划详情 */
    handleViewPlan() {
      if (!this.form.planId) {
        this.$modal.msgInfo("无关联采购计划");
        return;
      }
      getPurchasePlan(this.form.planId).then(response => {
        this.planDetail = response.data || null;
        this.planViewDialogVisible = true;
      }).catch(() => {
        this.$modal.msgError("获取采购计划失败");
      });
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        orderNo: null,
        planId: null,
        planNo: null,
        supplierId: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null,
        userId: null,
        orderType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        delPerson: null,
        contactPhone: null,
        totalAmount: null,
        invoiceAmount: null,
        invoiceTime: null,
        contactPerson: null,
        remark: null
      };
      this.purchaseOrderEntryList = [];
      this.resetForm("form");
    },
    /** 表头排序 */
    handleSortChange({ prop, order }) {
      const columnMap = {
        orderNo: 'po.order_no',
        'supplier.name': 's.name',
        'supplier.code': 's.code'
      };
      if (!order) {
        this.queryParams.orderByColumn = 'po.create_time';
        this.queryParams.isAsc = 'desc';
      } else {
        this.queryParams.orderByColumn = columnMap[prop] || prop;
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.dateType = 'createTime';
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.orderByColumn = 'po.create_time';
      this.queryParams.isAsc = 'desc';
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
      getDingdan(id).then(response => {
        this.form = response.data;
        this.purchaseOrderEntryList = response.data.purchaseOrderEntryList;
        this.open = true;
        this.form.orderStatus = row.orderStatus;
        this.form.orderType = '1';
        this.title = "查看订单";
      });
    },
    /** 批量发布按钮操作 */
    handleBatchPublish() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要发布的订单！");
        return;
      }

      const selectedOrders = this.orderList.filter(item => this.ids.includes(item.id));
      const voidedOrders = selectedOrders.filter(item => item.voidWholeFlag == 1 || item.voidWholeFlag === 1);
      if (voidedOrders.length > 0) {
        const info = voidedOrders.map(o => o.orderNo).join('、');
        this.$modal.msgError(`已作废订单不能发布：${info}`);
        return;
      }

      // 检查选中的订单是否都是已审核状态（状态为2）
      const invalidOrders = selectedOrders.filter(item => item.orderStatus !== '2' && item.orderStatus !== 2);

      if (invalidOrders.length > 0) {
        const statusInfo = invalidOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能发布已审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }

      const noBind = selectedOrders.filter(item => !this.formatBindScmSupplierCode(item) || this.formatBindScmSupplierCode(item) === '--');
      if (noBind.length > 0) {
        this.$modal.msgError(`以下订单供应商未维护平台供应商编码，无法发布：${noBind.map(o => o.orderNo).join('、')}`);
        return;
      }

      const orderNos = selectedOrders.map(item => item.orderNo).join('、');

      this.$modal.confirm('确定要发布选中的 ' + this.ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        return publishDingdan(this.ids);
      }).then(() => {
          this.getList();
          this.$modal.msgSuccess("发布成功！共发布 " + this.ids.length + " 个订单");
      }).catch(() => {
        // 取消或失败都不处理
      }).catch(() => {});
    },
    /** 批量作废 */
    handleBatchVoid() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要作废的订单！");
        return;
      }
      const selectedOrders = this.orderList.filter(item => this.ids.includes(item.id));
      const published = selectedOrders.filter(item => item.pushStatus == 1 || item.pushStatus === '1');
      if (published.length > 0) {
        this.$modal.msgError(`已发布订单不能作废：${published.map(o => o.orderNo).join('、')}`);
        return;
      }
      const voided = selectedOrders.filter(item => item.voidWholeFlag == 1 || item.voidWholeFlag === 1);
      if (voided.length > 0) {
        this.$modal.msgError(`以下订单已作废：${voided.map(o => o.orderNo).join('、')}`);
        return;
      }
      const invalidStatus = selectedOrders.filter(item => {
        const st = item.orderStatus;
        return st !== '0' && st !== 0 && st !== '2' && st !== 2;
      });
      if (invalidStatus.length > 0) {
        this.$modal.msgError(`仅待审核、已审核订单可作废：${invalidStatus.map(o => o.orderNo).join('、')}`);
        return;
      }
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');
      this.$prompt('作废原因（选填）', '整单作废', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '可填写作废说明'
      }).then(({ value }) => {
        return voidWholeDingdan(this.ids, value);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess('作废成功，共 ' + this.ids.length + ' 个订单');
      }).catch(() => {});
    },
    /** SPD 系统供应商编码：fd_supplier.code */
    formatSpdSupplierCode(row) {
      if (!row) return '--';
      const code = row.supplier && row.supplier.code != null ? String(row.supplier.code).trim() : '';
      return code || '--';
    },
    /** 绑定表当前对照：spd_scm_supplier_bind.scm_supplier_code */
    formatBindScmSupplierCode(row) {
      if (!row) return '--';
      const bind = row.bindScmSupplierCode != null ? String(row.bindScmSupplierCode).trim() : '';
      return bind || '--';
    },
    /** 订单发布回写：purchase_order.scm_supplier_code */
    formatOrderScmSupplierCode(row) {
      if (!row) return '--';
      const snap = row.scmSupplierCode != null ? String(row.scmSupplierCode).trim() : '';
      return snap || '--';
    },
    resolveUserName(userKey) {
      if (!userKey) return '--';
      const user = this.userOptions.find(u =>
        u.userId == userKey || String(u.userId) === String(userKey) ||
        u.userName === userKey || u.nickName === userKey
      );
      if (user) return user.nickName || user.userName;
      if (!/^\d+$/.test(String(userKey))) return userKey;
      return '--';
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要审核的订单！");
        return;
      }

      // 检查选中的订单是否都是待审核状态（状态为0）
      const selectedOrders = this.orderList.filter(item => this.ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '0' && item.orderStatus !== 0);

      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能审核待审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }

      const auditBy = this.$store.state.user.userId;
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');

      this.$modal.confirm('确定要审核选中的 ' + this.ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        const auditPromises = this.ids.map(id => auditDingdan({id: id, auditBy: auditBy, auditOpinion: ''}));
        return Promise.all(auditPromises);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("批量审核成功！共审核 " + this.ids.length + " 个订单");
      }).catch(() => {});
    },
    /** 订单明细序号 */
    rowPurchaseOrderEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 复选框选中数据 */
    handlePurchaseOrderEntrySelectionChange(selection) {
      this.checkedPurchaseOrderEntry = selection.map(item => item.index)
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
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
    // 从备注中提取计划单号
    extractPlanNoFromRemark(remark) {
      if (!remark) return '';
      // 备注格式：从采购计划JH2025120700002生成
      const match = remark.match(/从采购计划([A-Z0-9]+)/);
      if (match && match[1]) {
        return match[1];
      }
      return '';
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('caigou/dingdan/export', {
        ...this.queryParams
      }, `订单_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 */
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
}

.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

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
  padding-top: 8px !important;
  padding-bottom: 10px !important;
  background-color: #fff !important;
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
}
</style>

<style>
/* 订单发布列表：与到货验收一致（非 scoped） */
.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.app-container.caigou-publish-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 8px !important;
  box-sizing: border-box;
}

.app-container.caigou-publish-page > .el-form.query-form {
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

.app-container.caigou-publish-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.caigou-publish-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.caigou-publish-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.caigou-publish-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-second .el-col {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
}

.app-container.caigou-publish-page > .el-form.query-form .query-row-second .query-date-range-form-item {
  margin-bottom: 0;
}

.app-container.caigou-publish-page > .el-form.query-form .query-date-range-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container.caigou-publish-page > .el-form.query-form .query-date-range-inner {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
}

.app-container.caigou-publish-page > .el-form.query-form .query-date-range-sep {
  margin: 0 8px;
  flex-shrink: 0;
}

.app-container.caigou-publish-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.caigou-publish-page > .el-table.table-compact {
  margin-top: 0;
  margin-bottom: 0 !important;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.app-container.caigou-publish-page > .el-table.table-compact thead tr {
  height: 50px !important;
}

.app-container.caigou-publish-page > .el-table.table-compact th.el-table__cell {
  height: 50px !important;
}

.app-container.caigou-publish-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px !important;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.caigou-publish-page > .el-table.table-compact th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  white-space: nowrap !important;
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  line-height: 23px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.app-container.caigou-publish-page > .el-table.table-compact th .caret-wrapper {
  position: relative !important;
  display: inline-block !important;
  flex-shrink: 0 !important;
  height: 26px !important;
  width: 24px !important;
  margin-left: 4px !important;
  cursor: pointer !important;
  vertical-align: middle !important;
  overflow: visible !important;
}

.app-container.caigou-publish-page > .el-table.table-compact th .sort-caret {
  position: absolute !important;
  left: 7px !important;
  width: 0 !important;
  height: 0 !important;
  border-style: solid !important;
  border-left-width: 5px !important;
  border-right-width: 5px !important;
  border-left-color: transparent !important;
  border-right-color: transparent !important;
}

.app-container.caigou-publish-page > .el-table.table-compact th .sort-caret.ascending {
  top: 3px !important;
  border-top-width: 0 !important;
  border-bottom-width: 5px !important;
  border-bottom-color: #C0C4CC !important;
}

.app-container.caigou-publish-page > .el-table.table-compact th .sort-caret.descending {
  bottom: 3px !important;
  border-bottom-width: 0 !important;
  border-top-width: 5px !important;
  border-top-color: #C0C4CC !important;
}

.app-container.caigou-publish-page > .el-table.table-compact th.ascending .sort-caret.ascending {
  border-bottom-color: #409EFF !important;
}

.app-container.caigou-publish-page > .el-table.table-compact th.descending .sort-caret.descending {
  border-top-color: #409EFF !important;
}

.app-container.caigou-publish-page > .el-table.table-compact td {
  padding: 6px 0;
  color: #606266;
  font-size: 14px;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.caigou-publish-page > .el-table.table-compact td .cell {
  font-size: 14px;
  line-height: 23px;
}

.app-container.caigou-publish-page > .el-table.table-compact td .el-button--text {
  font-size: 14px;
  padding-top: 0;
  padding-bottom: 0;
}

.app-container.caigou-publish-page .publish-cell-ellipsis {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
  font-size: 14px;
  line-height: 23px;
}

.app-container.caigou-publish-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.app-container.caigou-publish-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container.caigou-publish-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
}

.app-container.caigou-publish-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}

/* 翻页：覆盖 ruoyi 全局 .pagination-container{height:25px} + .el-pagination{position:absolute}，避免被 .app-main{overflow:hidden} 裁切 */
.app-container.caigou-publish-page > .pagination-container {
  height: auto !important;
  min-height: 48px;
  padding: 8px 16px 4px !important;
  margin-top: 4px;
  margin-bottom: 0;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.app-container.caigou-publish-page > .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}
</style>
