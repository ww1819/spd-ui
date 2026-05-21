<template>
  <div class="app-container stocktaking-profit-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px" class="query-form query-form-compact">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="业务单号" prop="stockNo" class="query-item-inline">
            <el-input v-model="queryParams.stockNo"
                      placeholder="业务单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['高值', '设备']"/>
            </div>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="24">
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
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['stocktaking:in:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
          v-hasPermi="['stocktaking:in:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-check"
          size="medium"
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['stocktaking:in:audit']"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inList" class="table-compact" :row-class-name="inListIndex" @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border stripe>
      <el-table-column type="selection" width="55" align="center" fixed="left" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
      <el-table-column label="业务单号" align="center" prop="stockNo" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="150" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="creater.nickName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.creater && scope.row.creater.nickName) || scope.row.createrName || scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.profitAmount | formatCurrency }}</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.totalAmount | formatCurrency }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="stockStatus" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (scope.row.auditPerson && scope.row.auditPerson.nickName) || scope.row.auditPersonName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="200" show-overflow-tooltip resizable />

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-download"
              @click="handleExportRow(scope.row)"
              v-if="scope.row.stockStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-printer"
              @click="handlePrint(scope.row)"
              v-if="scope.row.stockStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-delete"
              @click="handleDelete(scope.row)"
              v-hasPermi="['stocktaking:in:remove']"
              v-if="scope.row.stockStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-edit"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['stocktaking:in:edit']"
              v-if="scope.row.stockStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-download"
              @click="handleExportRow(scope.row)"
              v-if="scope.row.stockStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
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

    <!-- 添加或修改盘点对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
              <div class="form-fields-container">
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="单据状态" prop="stockStatus" label-width="100px">
                      <el-select v-model="form.stockStatus" placeholder="请选择单据状态"
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
                    <el-form-item label="业务单号" prop="stockNo" label-width="100px">
                      <el-input v-model="form.stockNo" placeholder="业务单号" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                      <SelectWarehouse v-model="form.warehouseId" :excludeWarehouseType="['高值', '设备']"/>
                    </el-form-item>
                  </el-col>

                  <el-col :span="4">
                    <el-form-item label="制单日期" prop="stockDate" label-width="100px">
                      <el-date-picker clearable
                                      v-model="form.stockDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 150px"
                                      placeholder="请选择制单日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>

                  <el-col :span="4">
                    <el-form-item label="操作人" prop="createBy" label-width="100px">
                      <el-input v-model="form.createBy" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>盘点明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="success" icon="el-icon-refresh" size="small" @click="handleStocktakingInit">盘点初始化</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="primary" size="small" @click="submitForm" :loading="submitLoading">保 存</el-button>
            </el-col>
          </div>
        </el-row>

        <el-table :data="stkIoStocktakingEntryList" :row-class-name="rowStkIoStocktakingEntryIndex" @selection-change="handleStkIoStocktakingEntrySelectionChange" ref="stkIoStocktakingEntry" height="60vh" border show-summary :summary-method="getSummaries">
          <el-table-column type="selection" width="50" align="center" resizable fixed="left" />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="耗材名称" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="账面数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盘点数量" prop="stockQty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.stockQty" placeholder="盘点数量"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="stockQtyChange(scope.row)"
              />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.price || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏数量" prop="profitQty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.profitQty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盘点金额" prop="stockAmount" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.stockAmount || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏金额" prop="profitAmount" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.profitAmount || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" prop="batchNumber" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" label-width="200px" placeholder="批号" />
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="计费" align="center" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>--</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="100" fixed="right">
            <template slot-scope="scope">
              <el-button
                size="small"
                type="text"
                icon="el-icon-delete"
                @click="handleDeleteDetailRow(scope.row, scope.$index)"
                style="padding: 0 5px; margin: 0;"
              >删除</el-button>
            </template>
          </el-table-column>
        </el-table>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
<!--    <SelectPdInventoryFilter-->
<!--      v-if="DialogComponentShow"-->
<!--      :DialogComponentShow="DialogComponentShow"-->
<!--      :warehouseValue="warehouseValue"-->
<!--      @closeDialog="closeDialog"-->
<!--      @selectData="selectData"-->
<!--    ></SelectPdInventoryFilter>-->

    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectInventory>

    <el-dialog
      title="审核前确认（明细库存与仓库实物不一致）"
      :visible.sync="whAuditQtyMismatchVisible"
      width="980px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 8px; color: #e6a23c;">
        以下明细账面库存与当前仓库库存不一致，请逐条确认盘点数量后再审核。
      </div>
      <el-table :data="qtyMismatchAuditList" border size="small">
        <el-table-column label="耗材" prop="materialName" min-width="150" />
        <el-table-column label="批次号" prop="batchNo" min-width="150" />
        <el-table-column label="明细账面数量" prop="detailQty" width="140" />
        <el-table-column label="当前仓库库存" prop="currentQty" width="140" />
        <el-table-column label="盘点数量" min-width="140">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.adjustedStockQty"
              type="number"
              :disabled="scope.row.confirmed"
              placeholder="盘点数量"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="confirmWhAuditMismatchRow(scope.row)">{{ scope.row.confirmed ? '已确定' : '确定' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="whAuditQtyMismatchVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmWhAuditQtyMismatchAndAudit">确 定</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listStocktaking, getStocktaking, delStocktaking, addStocktaking, updateStocktaking, auditStocktaking, checkStocktakingQty } from "@/api/warehouse/stocktaking";
import { assertBillHasActiveEntriesForAudit } from '@/utils/billEntryValidate';
import { listPDFilter } from "@/api/warehouse/inventory";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectPdInventoryFilter from "@/components/SelectModel/SelectPdInventoryFilter";
import SelectInventory from "@/components/SelectModel/SelectInventory";

export default {
  name: "InStocktaking",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectPdInventoryFilter,SelectInventory},
  filters: {
    formatCurrency(value) {
      if (!value && value !== 0) return '--';
      return '¥' + parseFloat(value).toFixed(2);
    }
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoStocktakingEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 盘点表格数据
      inList: [],
      // 盘点明细表格数据
      stkIoStocktakingEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      submitLoading: false,
      whAuditQtyMismatchVisible: false,
      qtyMismatchAuditList: [],
      pendingWhAuditId: null,
      pendingWhAuditExpectedUpdateTime: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        supplerId: null,
        stockDate: null,
        beginDate: null,
        endDate: null,
        warehouseId: null,
        departmentId: null,
        stockStatus: null,
        userId: null,
        stockType: null,
        auditDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        stockDate: [
          { required: true, message: "业务日期不能为空", trigger: "blur" }
        ],
        stockStatus: [
          { required: true, message: "单据状态不能为空", trigger: "change" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "change" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询盘点列表 */
    getList() {
      this.loading = true;
      this.queryParams.stockType = "502";
      listStocktaking(this.queryParams).then(response => {
        this.inList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.warehouseValue = this.form.warehouseId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据（SelectInventory = 仓库库存，item.id 为 stk_inventory.id）
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {

        let obj = {};
        obj.kcNo = item.id;
        obj.materialId = item.material && item.material.id ? item.material.id : item.materialId;
        obj.material = item.material;
        obj.stockQty = item.qty;
        obj.qty = item.qty;
        obj.profitQty = 0;
        obj.price = item.unitPrice;
        obj.stockAmount = item.unitPrice;
        obj.profitAmount = 0;
        obj.amt = item.amt;
        obj.batchNo = item.batchNo;
        obj.batchNumber = item.batchNumber || item.materialNo || '';
        obj.beginTime = item.beginTime;
        obj.endTime = item.endTime;
        obj.remark = item.remark;

        this.stkIoStocktakingEntryList.push(obj);
      });
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
        stockNo: null,
        supplerId: null,
        stockDate: null,
        warehouseId: null,
        departmentId: null,
        stockStatus: null,
        userId: null,
        stockType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.stkIoStocktakingEntryList = [];
      this.resetForm("form");
    },
    //盘点数量改变：盈亏数量 = 盘点(stockQty) − 账面(qty)；盘点金额 = 盘点×单价；盈亏金额 = 盈亏×单价
    stockQtyChange(row){
      const sq = parseFloat(row.stockQty);
      const bq = parseFloat(row.qty);
      const pr = parseFloat(row.price) || 0;
      const totalProfitQty = (Number.isFinite(sq) && Number.isFinite(bq)) ? sq - bq : 0;
      row.profitQty = Number.isFinite(totalProfitQty) ? totalProfitQty.toFixed(2) : '0.00';
      row.profitAmount = (Number.isFinite(totalProfitQty) ? totalProfitQty * pr : 0).toFixed(2);
      row.stockAmount = (Number.isFinite(sq) ? sq * pr : 0).toFixed(2);
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
    // 计算合计数量和金额
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 2) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        // 合计：盘点数量、账面数量、盈亏数量、金额、盘点金额、盈亏金额
        if(['stockQty', 'qty', 'profitQty', 'amt', 'stockAmount', 'profitAmount'].includes(column.property)){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            // 金额类字段保留两位小数
            if(['amt', 'stockAmount', 'profitAmount'].includes(column.property)){
              sums[index] = sums[index].toFixed(2);
            }
            sums[index] += '';
          } else {
            sums[index] = '';
          }
        }
      });
      return sums;
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
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加盘点";
      this.form.stockStatus = '1';
      this.form.stockType = '502';
      // 制单人：与后端一致存用户ID（后端仍会强制覆盖，避免误传昵称）
      this.form.createBy = this.$store.getters.userId != null ? String(this.$store.getters.userId) : '';
      this.form.stockDate = this.getBillDate();
      this.action = true;
    },
    /** 查看按钮操作 */
    handleView(row){

      const id = row.id
      getStocktaking(id).then(response => {
        this.form = response.data;
        this.stkIoStocktakingEntryList = response.data.stkIoStocktakingEntryList;
        this.open = true;
        this.action = false;
        this.form.stockStatus = '1';
        this.form.stockType = '502';
        this.title = "查看盘点";
      });

    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids;
      const stockNo = row && row.stockNo != null ? row.stockNo : id;
      getStocktaking(id).then(res => {
        if (!assertBillHasActiveEntriesForAudit(res.data.stkIoStocktakingEntryList, this, '仓库盘点')) {
          return;
        }
        this.$modal
          .confirm('确定要审核"' + stockNo + '"的数据项？')
          .then(() => checkStocktakingQty({ id }))
        .then((res) => {
          const rows = (res && res.data) || [];
          if (!rows.length) {
            return auditStocktaking({ id, expectedUpdateTime: row.updateTime || row.createTime });
          }
          this.pendingWhAuditId = id;
          this.pendingWhAuditExpectedUpdateTime = row.updateTime || row.createTime;
          this.qtyMismatchAuditList = rows.map((r) => ({
            ...r,
            adjustedStockQty: r.stockQty != null ? r.stockQty : r.currentQty,
            confirmed: false
          }));
          this.whAuditQtyMismatchVisible = true;
          return null;
        })
          .then((result) => {
            if (!result) return;
            this.getList();
            this.$modal.msgSuccess('审核成功！');
          })
          .catch(() => {});
      }).catch(() => {});
    },
    confirmWhAuditMismatchRow(row) {
      const v = parseFloat(row.adjustedStockQty);
      if (!Number.isFinite(v) || v < 0) {
        this.$modal.msgWarning('请输入有效的盘点数量');
        return;
      }
      const cap = parseFloat(row.currentQty);
      if (Number.isFinite(cap) && v > cap) {
        row.adjustedStockQty = cap;
        this.$modal.msgWarning('来源于仓库库存的明细仅允许盘亏，盘点数量已回退为当前库存数量');
      } else {
        row.adjustedStockQty = v;
      }
      row.confirmed = true;
    },
    confirmWhAuditQtyMismatchAndAudit() {
      const unconfirmed = (this.qtyMismatchAuditList || []).some((r) => !r.confirmed);
      if (unconfirmed) {
        this.$modal.msgWarning('请先逐条点击“确定”后再提交');
        return;
      }
      const qtyAdjustList = (this.qtyMismatchAuditList || []).map((r) => ({
        entryId: r.entryId,
        stockQty: r.adjustedStockQty
      }));
      auditStocktaking({
        id: this.pendingWhAuditId,
        qtyAdjustList,
        expectedUpdateTime: this.pendingWhAuditExpectedUpdateTime
      }).then(() => {
        this.whAuditQtyMismatchVisible = false;
        this.qtyMismatchAuditList = [];
        this.pendingWhAuditId = null;
        this.pendingWhAuditExpectedUpdateTime = null;
        this.getList();
        this.$modal.msgSuccess('审核成功！');
      });
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      const ids = this.ids;
      if (!ids || ids.length === 0) {
        this.$modal.msgWarning("请先选择要审核的数据");
        return;
      }
      this.$modal
        .confirm('确定要审核选中的"' + ids.length + '"条数据项？')
        .then(() => {
          const checkTasks = ids.map((id) =>
            checkStocktakingQty({ id }).then((res) => {
              const mismatches = (res && res.data) || [];
              return { id, needManualConfirm: mismatches.length > 0 };
            })
          );
          return Promise.all(checkTasks);
        })
        .then((checkResults) => {
          const rowById = new Map((this.inList || []).map((r) => [r.id, r]));
          const canAuditIds = (checkResults || []).filter((r) => !r.needManualConfirm).map((r) => r.id);
          const blockedIds = (checkResults || []).filter((r) => r.needManualConfirm).map((r) => r.id);
          if (!canAuditIds.length) {
            this.$modal.msgWarning('所选单据均存在需逐条确认的数量差异，请改用单条审核处理。');
            return null;
          }
          return Promise.all(
            canAuditIds.map((id) =>
              auditStocktaking({ id, expectedUpdateTime: (rowById.get(id) || {}).updateTime || (rowById.get(id) || {}).createTime })
            )
          ).then(() => ({
            blockedIds,
            auditedCount: canAuditIds.length
          }));
        })
        .then((result) => {
          if (!result) return;
          this.getList();
          if (result.blockedIds && result.blockedIds.length) {
            this.$modal.msgWarning(
              '已审核' + result.auditedCount + '条；以下单据需单条逐条确认后审核：' + result.blockedIds.join('、')
            );
            return;
          }
          this.$modal.msgSuccess('批量审核成功！');
        })
        .catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getStocktaking(id).then(response => {
        this.form = response.data;
        this.stkIoStocktakingEntryList = response.data.stkIoStocktakingEntryList;
        this.open = true;
        this.title = "修改盘点";
        this.form.stockStatus = '1';
        this.form.stockType = '502';
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (!valid) return;
        if (this.submitLoading) return;
        this.form.stkIoStocktakingEntryList = this.stkIoStocktakingEntryList;
        this.submitLoading = true;
        const isUpdate = this.form.id != null;
        const request = isUpdate ? updateStocktaking(this.form) : addStocktaking(this.form);
        request.then(response => {
          const data = response.data || response;
          if (!isUpdate && data) {
            this.form.id = data.id;
            if (data.stockNo != null) this.form.stockNo = data.stockNo;
          }
          this.$modal.msgSuccess(isUpdate ? "修改成功" : "新增成功");
          this.open = false;
          this.getList();
        }).finally(() => {
          this.submitLoading = false;
        });
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除盘点编号为"' + ids + '"的数据项？').then(function() {
        return delStocktaking(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 盘点列表序号 */
    inListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 盘点明细序号 */
    rowStkIoStocktakingEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 盘点明细添加按钮操作 */
    handleAddStkIoStocktakingEntry() {
      let obj = {};
      obj.commodityId = "";
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";
      this.stkIoStocktakingEntryList.push(obj);
    },
    /** 盘点明细删除按钮操作 */
    handleDeleteStkIoStocktakingEntry() {
      if (this.checkedStkIoStocktakingEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的盘点明细数据");
      } else {
        const stkIoStocktakingEntryList = this.stkIoStocktakingEntryList;
        const checkedStkIoStocktakingEntry = this.checkedStkIoStocktakingEntry;
        this.stkIoStocktakingEntryList = stkIoStocktakingEntryList.filter(function(item) {
          return checkedStkIoStocktakingEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 单行删除明细 */
    handleDeleteDetailRow(row, index) {
      this.stkIoStocktakingEntryList.splice(index, 1);
    },
    /** 盘点初始化 */
    handleStocktakingInit() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }
      
      // 显示确认对话框
      this.$modal.confirm('确定要初始化盘点数据吗？这将加载该仓库的所有库存数据。').then(() => {
        // 显示loading
        const loading = this.$loading({
          lock: true,
          text: '正在加载库存数据，请稍候...',
          spinner: 'el-icon-loading',
          background: 'rgba(0, 0, 0, 0.7)'
        });
        
        // 清空现有明细
        this.stkIoStocktakingEntryList = [];
        
        // 设置超时，防止无限等待
        const timeoutId = setTimeout(() => {
          loading.close();
          this.$message({ 
            message: '加载超时，请检查网络连接或联系管理员', 
            type: 'error' 
          });
        }, 30000); // 30秒超时
        
        // 获取该仓库的所有库存（获取所有批次明细）
        const queryParams = {
          warehouseId: this.form.warehouseId,
          pageNum: 1,
          pageSize: 10000  // 增大pageSize，确保获取所有批次的库存明细
        };
        
        listPDFilter(queryParams).then(response => {
          clearTimeout(timeoutId);
          
          console.log('盘点初始化响应数据:', response);
          let inventoryList = response.rows || response.data || [];
          
          // 过滤数据：只保留该仓库且数量大于0的库存
          const warehouseId = String(this.form.warehouseId);
          inventoryList = inventoryList.filter((item) => {
            // 检查仓库ID是否匹配（使用宽松比较，支持字符串和数字）
            const itemWarehouseId = String((item.warehouse && item.warehouse.id) || item.warehouseId || '');
            // 检查数量是否大于0
            const qty = parseFloat(item.qty) || 0;
            return itemWarehouseId === warehouseId && qty > 0;
          });
          
          console.log('过滤后的库存数据:', inventoryList.length, inventoryList);
          
          if (!inventoryList || inventoryList.length === 0) {
            loading.close();
            this.$message({ 
              message: '该仓库暂无库存数据', 
              type: 'warning' 
            });
            return;
          }
          
          // 直接处理数据，保留完整的item对象，特别是material对象；item.id 为 stk_inventory.id，存为 kcNo 供盈亏审核按库存主键查
          const newList = [];
          inventoryList.forEach((item) => {
            let obj = {};
            obj.kcNo = item.id;
            // 保留完整的material对象，包括所有关联对象
            obj.materialId = (item.material && item.material.id) || item.materialId;
            obj.material = item.material || {};
            obj.stockQty = parseFloat(item.qty) || 0;  // 盘点数量初始化为库存数量
            obj.qty = parseFloat(item.qty) || 0;  // 库存数量
            obj.profitQty = 0;  // 盈亏数量初始化为0
            obj.price = parseFloat(item.unitPrice) || 0;
            obj.stockAmount = (obj.qty * obj.price);  // 盘点金额 = 盘点数量 * 单价
            obj.profitAmount = 0;
            obj.amt = parseFloat(item.amt) || (obj.qty * obj.price);
            obj.batchNo = item.batchNo || '';
            obj.batchNumber = item.batchNumber || item.materialNo || '';
            obj.beginTime = item.beginTime || item.materialDate || '';
            obj.endTime = item.endTime || '';
            obj.remark = item.remark || '';
            
            newList.push(obj);
          });
          
          // 一次性赋值，避免频繁触发响应式更新
          this.stkIoStocktakingEntryList = newList;
          
          loading.close();
          this.$message({ 
            message: `已加载 ${inventoryList.length} 条库存数据`, 
            type: 'success' 
          });
          
        }).catch(error => {
          clearTimeout(timeoutId);
          loading.close();
          console.error('获取库存数据失败:', error);
          this.$message({ 
            message: '获取库存数据失败：' + (error.msg || error.message || '请重试'), 
            type: 'error' 
          });
        });
      }).catch(() => {
        // 用户取消了操作
      });
    },
    /** 复选框选中数据 */
    handleStkIoStocktakingEntrySelectionChange(selection) {
      this.checkedStkIoStocktakingEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('stocktaking/in/export', {
        ...this.queryParams
      }, `仓库盘点单_${new Date().getTime()}.xlsx`)
    },
    /** 单行导出按钮操作 */
    handleExportRow(row) {
      this.download('stocktaking/in/export', {
        stockNo: row.stockNo
      }, `仓库盘点单_${row.stockNo}_${new Date().getTime()}.xlsx`)
    },
    /** 打印按钮操作 */
    handlePrint(row) {
      // TODO: 实现打印功能
      this.$modal.msgInfo("打印功能待实现");
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
  background: rgba(0,0,0,0.4);
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
  min-height: 95vh !important;
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

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  text-align: right;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 10px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  overflow: visible;
}

/* 弹窗内顶部字段容器样式 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  margin-top: -10px;
  border: 1px solid #EBEEF5;
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

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

/* 确保表格可以水平滚动和垂直滚动 */
::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .el-table__fixed-right {
  right: 0 !important;
}

/* 明细表格容器样式 - 确保滚动条正常显示 */
::v-deep .local-modal-content .el-table {
  overflow: visible;
}

/* 弹窗内明细表格高度限制 */
::v-deep .local-modal-content .el-table {
  max-height: 60vh !important;
}

::v-deep .local-modal-content .el-table__body-wrapper {
  max-height: calc(60vh - 48px) !important;
  overflow-y: auto !important;
  overflow-x: auto !important;
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

.el-table .cell {
  padding: 0 8px;
  line-height: 1.5;
}

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

/* 表单样式优化：仅弹窗内保留行距，避免列表查询区被撑高 */
.local-modal-content .el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}

/* 弹窗内搜索条件容器（列表区已改为 query-form-compact，不再用此外层） */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  position: relative;
}

.query-row-second .el-form-item {
  white-space: nowrap;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}
</style>

<style>
/* 库房盘点申请（本页路由）：与到货验收一致（非 scoped） */
.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.app-container.stocktaking-profit-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.stocktaking-profit-page > .el-form.query-form {
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

.app-container.stocktaking-profit-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.stocktaking-profit-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.stocktaking-profit-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.stocktaking-profit-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-second {
  position: relative;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.stocktaking-profit-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container.stocktaking-profit-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.stocktaking-profit-page > .el-table.table-compact {
  margin-top: 0;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.app-container.stocktaking-profit-page > .el-table.table-compact th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.stocktaking-profit-page > .el-table.table-compact th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

.app-container.stocktaking-profit-page > .el-table.table-compact td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.stocktaking-profit-page > .el-table.table-compact tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

.app-container.stocktaking-profit-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 20px !important;
  height: 12px !important;
}

.app-container.stocktaking-profit-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 10px !important;
  border: 2px solid #f1f1f1 !important;
  min-height: 12px !important;
  min-width: 20px !important;
}

.app-container.stocktaking-profit-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 10px !important;
  border: 1px solid #e4e7ed !important;
}
</style>
