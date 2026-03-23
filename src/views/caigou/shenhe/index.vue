<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
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
          size="small"
          @click="handleBatchAudit"
          :disabled="multiple"
          v-hasPermi="['caigou:dingdan:audit']"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleExport"
          v-hasPermi="['caigou:dingdan:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" size="small" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" size="small" @click="resetQuery">重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList" :row-key="orderRowKey"
              show-summary :summary-method="getTotalSummaries"
              :row-class-name="orderListIndex"
              @selection-change="handleSelectionChange"
              height="58vh"
              stripe border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="订单单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
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
      <el-table-column label="订单状态" align="center" prop="orderStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="creater.nickName" show-overflow-tooltip resizable />
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" show-overflow-tooltip resizable>
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
      v-show="total>0"
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
                <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
              </div>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="单据状态" prop="orderStatus">
              <el-select v-model="form.orderStatus" placeholder="请选择单据状态"
                         :disabled="true"
                         clearable>
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="订单时间" prop="orderDate">
              <el-input :value="parseTime(form.orderDate, '{y}-{m}-{d} {h}:{i}:{s}')" :disabled="true" placeholder="订单时间" style="width: 100%" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="联系电话" prop="contactPhone">
              <el-input v-model="form.contactPhone" :disabled="true" placeholder="联系电话" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="采购员" prop="contactPerson">
              <SelectUser v-model="form.contactPerson" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>订单明细信息</span>
          </el-col>
        </el-row>
        <el-table :data="purchaseOrderEntryList" :row-class-name="rowPurchaseOrderEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handlePurchaseOrderEntrySelectionChange"
                  ref="purchaseOrderEntry"
                  height="48vh"
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
          <el-table-column label="包装规格" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" width="120" show-overflow-tooltip resizable>
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
import { listDingdan, getDingdan, auditDingdan } from "@/api/caigou/dingdan";
import { getApplyDetails, getApplyBillNoList, getApplyBillHeaderList, getPurchasePlan } from "@/api/caigou/purchasePlan";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectUser from '@/components/SelectModel/SelectUser';

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
        userId: null,
        orderType: "1", // 采购订单类型
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
      applyBillNoDialogVisible: false,
      applyBillNoList: [],
      applyBillHeaderList: [],
      applyDetailDialogVisible: false,
      applyDetailList: [],
      planViewDialogVisible: false,
      planDetail: null
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
    // 为订单表提供稳定的 row-key，减少 DOM 复用导致的抖动
    orderRowKey(row) {
      return row.id || row.orderNo;
    },
    // 订单列表序号
    orderListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 查询订单列表 */
    getList() {
      this.loading = true;
      listDingdan(this.queryParams).then(response => {
        this.orderList = response.rows;
        this.total = response.total;
        this.loading = false;

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
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;

      this.$modal.confirm('确定要审核订单编号为"' + row.orderNo + '"的数据项？').then(function() {
        return auditDingdan({id:id, auditBy:auditBy, auditOpinion:''});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功！");
      }).catch(() => {});
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('caigou/dingdan/export', {
        ...this.queryParams
      }, `purchase_order_${new Date().getTime()}.xlsx`)
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要审核的订单！");
        return;
      }

      // 检查选中的订单是否都是待审核状态
      const selectedOrders = this.orderList.filter(item => this.ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '0' && item.orderStatus !== 0);
      
      // 调试信息
      console.log('选中的订单:', selectedOrders);
      console.log('非待审核状态的订单:', nonPendingOrders);
      selectedOrders.forEach(order => {
        console.log(`订单 ${order.orderNo} 状态: ${order.orderStatus} (类型: ${typeof order.orderStatus})`);
      });

      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能审核待审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }

      const auditBy = this.$store.state.user.userId;
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');

      this.$modal.confirm('确定要审核选中的 ' + this.ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        // 批量审核
        const auditPromises = this.ids.map(id => auditDingdan({id: id, auditBy: auditBy, auditOpinion: ''}));
        
        Promise.all(auditPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + this.ids.length + " 个订单");
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      }).catch(() => {});
    },
    /** 订单明细序号 */
    rowPurchaseOrderEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 复选框选中数据 */
    handlePurchaseOrderEntrySelectionChange(selection) {
      this.checkedPurchaseOrderEntry = selection.map(item => item.index)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 */
.local-modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  min-height: 48px;
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.close-btn {
  border: none;
  background: transparent;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  padding: 12px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.modal-footer .el-button {
  margin-left: 12px;
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
  position: absolute !important;
  left: 552px !important;
  width: auto !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  display: flex;
  align-items: center;
}

.query-item-status-aligned .el-form-item__label {
  width: 80px !important;
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
  width: 100%;
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
}
</style>
