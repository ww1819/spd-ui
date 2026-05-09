<template>
  <div class="app-container stocktaking-apply-page">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item prop="stockNo" class="query-item-inline">
              <el-input v-model="queryParams.stockNo"
                        placeholder="业务单号"
                        clearable
                        style="width: 180px"
                        @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
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
        </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8 button-row-compact">
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleAdd"
          v-hasPermi="['department:stocktaking:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:stocktaking:export']"
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

    <el-table v-loading="loading" :data="stocktakingList" class="table-compact" :row-class-name="stocktakingListIndex" @selection-change="handleSelectionChange" height="calc(100vh - 340px)" border stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="盘点单号" align="center" prop="stockNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createBy" width="110" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="盘点日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column
        label="单据状态"
        align="center"
        prop="stockStatus"
        width="120"
        min-width="112"
        show-overflow-tooltip
        resizable
        label-class-name="stocktaking-col-stock-status"
        class-name="stocktaking-col-stock-status"
      >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="updateBy" width="110" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.stockStatus == 2 && scope.row.updateBy">{{ scope.row.updateBy }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatStocktakingListAmount(scope.row.totalAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盈亏金额" align="center" prop="profitAmount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ formatStocktakingListProfitAmount(scope.row.profitAmount) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盘点类型" align="center" prop="stockType" show-overflow-tooltip resizable v-if="false">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.stockType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleExportRow(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row,true)"
              v-if="scope.row.stockStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['department:stocktaking:edit']"
              v-if="scope.row.stockStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['department:stocktaking:remove']"
              v-if="scope.row.stockStatus != 2"
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

    <!-- 添加或修改盘点对话框（布局与到货验收 inWarehouse/audit 弹窗一致） -->
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
                    <el-form-item label="单据状态" prop="stockStatus">
                      <el-input v-model="stockStatusText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="单号" prop="stockNo">
                      <el-input v-model="form.stockNo" :disabled="true" placeholder="保存后生成" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="盘点日期" prop="stockDate" class="form-item-stock-date-no-star">
                      <el-date-picker clearable
                                      v-model="form.stockDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 100%"
                                      placeholder="请选择盘点日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="科室" prop="departmentId">
                      <SelectDepartment v-model="form.departmentId" :disabled="!action || isDepartmentLocked || departmentLockedByAction"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="操作人" prop="createBy">
                      <el-input v-model="form.createBy" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="2" />
                </el-row>
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="总金额">
                      <el-input :value="totalAmountText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="20" />
                </el-row>
              </div>

              <div class="modal-detail-section">
                <el-row :gutter="10" class="detail-toolbar-row">
                  <el-col :span="1.5">
                    <span>盘点明细信息</span>
                  </el-col>
                  <div v-show="action">
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-minus" size="small" @click="openAddLossEntry">新增盘亏明细</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="warning" icon="el-icon-plus" size="small" @click="openAddProfitEntry">新增盘盈明细</el-button>
                    </el-col>
                    <el-col :span="2">
                      <el-button type="primary" icon="el-icon-refresh" size="small" :loading="deptInventoryInitLoading" @click="handleStocktakingInitFromDeptInventory">盘点初始化</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm" :loading="submitLoading">保 存</el-button>
                    </el-col>
                  </div>
                </el-row>
                <div class="table-wrapper">
        <el-table :data="stkIoStocktakingEntryList" :row-class-name="rowStkIoStocktakingEntryIndex"
                  @selection-change="handleStkIoStocktakingEntrySelectionChange"
                  ref="stkIoStocktakingEntry"
                  border
                  show-summary
                  :summary-method="getSummaries"
                  :height="detailTableHeight"
        >
          <el-table-column type="selection" width="60" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable/>
          <el-table-column label="耗材名称" prop="materialId" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.material ? (scope.row.material.name || '--') : '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material">{{ scope.row.material.speci || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material">{{ scope.row.material.model || '' }}</span>
              <span v-else></span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.fdUnit">{{ scope.row.material.fdUnit.unitName || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.unitPrice ? parseFloat(scope.row.unitPrice).toFixed(2) : '--' }}</span>
            </template>
          </el-table-column>

          <el-table-column label="库存数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="盘点数量" prop="stockQty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input
                v-model="scope.row.stockQty"
                :disabled="!action"
                type='number'
                @input="stockQtyChange(scope.row)"
                @blur="handleStockQtyBlur(scope.row)"
                placeholder="盘点数量"
              />
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="金额" />
            </template>
          </el-table-column>
          <el-table-column label="盈亏数量" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ getProfitQty(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏标志" align="center" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ formatProfitLossFlag(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="盈亏金额" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ getProfitAmount(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="批次号" />
            </template>
          </el-table-column>

          <el-table-column label="批号" prop="batchNumber" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.beginTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.endTime || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.fdFactory">{{ scope.row.material.fdFactory.factoryName || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" prop="material.supplier.name" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.supplier">{{ scope.row.material.supplier.name || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="所属仓库" align="center" prop="returnWarehouseId" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ stocktakingWarehouseDisplay(scope.row) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="400" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.remark || '--' }}</span>
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

    <!-- 使用科室库存选择组件 -->
    <SelectDepInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :departmentValue="departmentValue"
      :use-material-dict="useMaterialDictForSelect"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectDepInventory>

    <el-dialog
      title="新增盘盈明细信息"
      :visible.sync="newEntryDialogVisible"
      width="760px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-table :data="pendingNewEntries" border size="small">
        <el-table-column label="耗材" min-width="150">
          <template slot-scope="scope">{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '--' }}</template>
        </el-table-column>
        <el-table-column label="单价" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.unitPrice" type="number" placeholder="请输入单价" @input="priceChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="盘点数量" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.stockQty" type="number" placeholder="请输入盘点数量" @input="stockQtyChange(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="批号" min-width="140">
          <template slot-scope="scope">
            <el-input v-model="scope.row.batchNumber" placeholder="请输入批号" />
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="140">
          <template slot-scope="scope">
            <el-date-picker v-model="scope.row.endTime" type="date" value-format="yyyy-MM-dd" placeholder="请选择" />
          </template>
        </el-table-column>
        <el-table-column label="生产日期" min-width="140">
          <template slot-scope="scope">
            <el-date-picker v-model="scope.row.beginTime" type="date" value-format="yyyy-MM-dd" placeholder="可不填" />
          </template>
        </el-table-column>
        <el-table-column label="归属仓库" min-width="180">
          <template slot-scope="scope">
            <SelectWarehouse v-model="scope.row.returnWarehouseId" finance-pick-mode placeholder="请选择仓库" />
          </template>
        </el-table-column>
        <el-table-column label="供应商" min-width="150">
          <template slot-scope="scope">{{ scope.row._supplierName || '--' }}</template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="cancelPendingNewEntries">取 消</el-button>
        <el-button type="primary" @click="confirmPendingNewEntries">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="保存前确认盘点数量"
      :visible.sync="saveQtyConfirmVisible"
      width="980px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 8px; color: #e6a23c;">请逐条确认盘点数量，确认后再保存。</div>
      <el-table :data="saveQtyConfirmList" border size="small">
        <el-table-column label="耗材" min-width="150">
          <template slot-scope="scope">{{ (scope.row.material && scope.row.material.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="批次号" prop="batchNo" min-width="140" />
        <el-table-column label="库存数量" prop="qty" width="120" />
        <el-table-column label="盘点数量" min-width="140">
          <template slot-scope="scope">
            <el-input v-model="scope.row.adjustedStockQty" type="number" :disabled="scope.row.confirmed" />
          </template>
        </el-table-column>
        <el-table-column label="盈亏数量" width="120">
          <template slot-scope="scope">
            <span>{{ formatConfirmProfitQty(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盈亏金额" width="140">
          <template slot-scope="scope">
            <span>{{ formatConfirmProfitAmt(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="confirmSaveQtyRow(scope.row)">{{ scope.row.confirmed ? '已确定' : '确定' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="saveQtyConfirmVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmSaveQtyAndSubmit">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { listStocktaking, listStocktakingExportRows, getStocktaking, delStocktaking, addStocktaking, updateStocktaking } from "@/api/department/stocktaking";
import { exportDeptStocktakingDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import { listInventoryPick } from "@/api/department/depInventory";
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import RightToolbar from "@/components/RightToolbar";
import SelectDepInventory from '@/components/SelectModel/SelectDepInventory';

export default {
  name: "DeptStocktaking",
  dicts: ['biz_status','bill_type'],
  components: {SelectDepartment, SelectWarehouse, SelectDepInventory, RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      departmentValue: "",
      deptInventoryInitLoading: false,
      /** 盘点明细批次号 PC+时间+序号，保证同页不重复 */
      stocktakingBatchSeqCounter: 0,
      departmentLockedByAction: false,
      addEntryMode: 'LOSS',
      useMaterialDictForSelect: false,
      newEntryDialogVisible: false,
      pendingNewEntries: [],
      saveQtyConfirmVisible: false,
      saveQtyConfirmList: [],
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
      stocktakingList: [],
      selectRow: [],
      // 盘点明细表格数据
      stkIoStocktakingEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      submitLoading: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        departmentId: null,
        stockStatus: null,
        stockType: null,
        beginDate: null,
        endDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        stockDate: [
          { required: true, message: "盘点日期不能为空", trigger: "blur" }
        ],
        departmentId: [
          { required: true, message: "科室ID不能为空", trigger: "blur" }
        ],
        stockType: [
          { required: true, message: "盘点类型不能为空", trigger: "change" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  watch: {
    open(val) {
      if (val) {
        this.$nextTick(() => {
          const t = this.$refs.stkIoStocktakingEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    },
    stkIoStocktakingEntryList: {
      deep: true,
      handler() {
        this.$nextTick(() => {
          const t = this.$refs.stkIoStocktakingEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    }
  },
  computed: {
    /** 与到货验收 inWarehouse/audit 弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    },
    // 单据状态文本显示
    stockStatusText() {
      if (this.form.stockStatus == 1) {
        return '未审核';
      } else if (this.form.stockStatus == 2) {
        return '已审核';
      } else {
        return '未审核';
      }
    },
    // 计算总金额
    totalAmountText() {
      let total = 0;
      if (this.stkIoStocktakingEntryList && this.stkIoStocktakingEntryList.length > 0) {
        this.stkIoStocktakingEntryList.forEach(item => {
          const amt = parseFloat(item.amt || 0);
          total += amt;
        });
      }
      return '￥' + total.toFixed(2);
    },
    isDepartmentLocked() {
      return Array.isArray(this.stkIoStocktakingEntryList) && this.stkIoStocktakingEntryList.length > 0;
    }
  },
  methods: {
    /** 明细合计（与到货验收弹窗表尾一致；按列 property 汇总，避免列顺序变化错位） */
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
        if (column.property === 'stockQty') {
          sums[index] = sumNum('stockQty');
          return;
        }
        if (column.property === 'amt') {
          const total = sumNum('amt');
          sums[index] = '￥' + total.toFixed(2);
          return;
        }
        if (column.label === '盈亏数量') {
          let t = 0;
          data.forEach((item) => {
            t += parseFloat(item.stockQty || 0) - parseFloat(item.qty || 0);
          });
          sums[index] = t > 0 ? '+' + t.toFixed(2) : t.toFixed(2);
          return;
        }
        if (column.label === '盈亏金额') {
          let t = 0;
          data.forEach((item) => {
            const pq = parseFloat(item.stockQty || 0) - parseFloat(item.qty || 0);
            t += pq * parseFloat(item.unitPrice || 0);
          });
          const prefix = t > 0 ? '+' : '';
          sums[index] = prefix + '￥' + t.toFixed(2);
          return;
        }
        sums[index] = '';
      });
      return sums;
    },
    /** 盘点列表序号 */
    stocktakingListIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },
    /** 列表总金额展示 */
    formatStocktakingListAmount(val) {
      if (val == null || val === '') return '--';
      const n = parseFloat(val);
      if (!Number.isFinite(n)) return '--';
      return '￥' + n.toFixed(2);
    },
    /** 列表盈亏金额展示（盘盈带 +） */
    formatStocktakingListProfitAmount(val) {
      if (val == null || val === '') return '--';
      const n = parseFloat(val);
      if (!Number.isFinite(n)) return '--';
      const prefix = n > 0 ? '+' : '';
      return prefix + '￥' + n.toFixed(2);
    },
    /** 打印操作 */
    handlePrint(row, isPrint) {
      // 打印功能实现
      this.$message.info('打印功能待实现');
    },
    /** 查询盘点列表 */
    getList() {
      this.loading = true;
      this.queryParams.stockStatus = "1";
      this.queryParams.stockType = "502"; // 盘点类型：502表示盘点
      listStocktaking(this.queryParams).then(response => {
        this.stocktakingList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    openAddLossEntry() {
      if(!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' })
        return
      }
      this.addEntryMode = 'LOSS';
      this.useMaterialDictForSelect = false;
      this.DialogComponentShow = true
      this.departmentValue = this.form.departmentId;
    },
    openAddProfitEntry() {
      if(!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' })
        return
      }
      this.addEntryMode = 'PROFIT';
      this.useMaterialDictForSelect = true;
      this.DialogComponentShow = true
      this.departmentValue = this.form.departmentId;
    },
    /** 科室库存行 -> 盘点明细行（与弹窗勾选确定逻辑一致） */
    /** 仅「新增 / 耗材字典」盘盈明细生成新追溯批次号；盘点初始化须用科室库存自带 batchNo */
    nextStocktakingBatchNo() {
      this.stocktakingBatchSeqCounter = (this.stocktakingBatchSeqCounter || 0) + 1;
      const d = new Date();
      const p = (n) => (n < 10 ? '0' + n : '' + n);
      const ts =
        d.getFullYear() +
        p(d.getMonth() + 1) +
        p(d.getDate()) +
        p(d.getHours()) +
        p(d.getMinutes()) +
        p(d.getSeconds());
      return 'PC' + ts + String(this.stocktakingBatchSeqCounter).padStart(4, '0');
    },
    /** 盘点初始化行：展示归属仓库名称 */
    stocktakingWarehouseDisplay(row) {
      if (!row) return '--';
      if (row.warehouse && row.warehouse.name) return row.warehouse.name;
      if (row._warehouseName) return row._warehouseName;
      if (row.returnWarehouseId != null && row.returnWarehouseId !== '') return String(row.returnWarehouseId);
      return '--';
    },
    mapDepInventoryToStocktakingEntry(item) {
      const fromInit = !!item._fromStocktakingInit;
      const customerId =
        this.$store && this.$store.getters ? this.$store.getters.customerId : '';
      const defaultProfitWarehouseId =
        !fromInit && customerId === 'hengsui-third-001' ? 10 : null;
      const materialPrice = item.material && item.material.price != null && item.material.price !== ''
        ? item.material.price
        : item.material && item.material.salePrice != null && item.material.salePrice !== ''
          ? item.material.salePrice
          : null;
      const beginTime = item.beginTime || item.beginDate;
      const endTime = item.endTime || item.endDate;
      /** 盘点初始化：账面库存数量取科室库存；新增（字典）：库存数量为 0 */
      let qty;
      if (fromInit) {
        const q = item.qty;
        qty = q != null && q !== '' ? q : 0;
      } else {
        qty = 0;
      }
      const stockRaw = item.stockQty;
      let stockQty;
      if (fromInit) {
        stockQty =
          stockRaw != null && stockRaw !== ''
            ? stockRaw
            : qty;
      } else {
        stockQty = stockRaw != null && stockRaw !== '' ? stockRaw : 0;
      }
      let amt = item.amt;
      if (amt == null || amt === '') {
        const up = parseFloat(item.unitPrice || 0);
        const a = (parseFloat(stockQty) || 0) * up;
        amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
      }
      const wh = item.warehouse || null;
      const wid =
        item.returnWarehouseId != null && item.returnWarehouseId !== ''
          ? item.returnWarehouseId
          : wh && wh.id != null
            ? wh.id
            : item.warehouseId != null
              ? item.warehouseId
              : null;
      const warehouseName =
        (wh && wh.name) ||
        (item._warehouseName != null && item._warehouseName !== '' ? item._warehouseName : '') ||
        '';
      const batchNo =
        fromInit && item.batchNo != null && String(item.batchNo).trim() !== ''
          ? String(item.batchNo).trim()
          : this.nextStocktakingBatchNo();
      return {
        depInventoryId: fromInit ? (item.depInventoryId || (item.id != null ? String(item.id) : null)) : null,
        materialId: item.materialId,
        material: item.material || null,
        supplierId: item.supplierId || (item.material && item.material.supplierId) || null,
        _supplierName: (item.material && item.material.supplier && item.material.supplier.name) || '',
        unitPrice: item.unitPrice != null && item.unitPrice !== '' ? item.unitPrice : materialPrice,
        qty,
        stockQty,
        amt,
        batchNo,
        batchNumber: item.batchNumber || item.materialNo || '',
        beginTime: beginTime ? (typeof beginTime === 'string' ? beginTime : this.parseTime(beginTime, '{y}-{m}-{d}')) : '',
        endTime: endTime ? (typeof endTime === 'string' ? endTime : this.parseTime(endTime, '{y}-{m}-{d}')) : '',
        remark: '',
        fromStocktakingInit: fromInit,
        returnWarehouseId: fromInit ? wid : defaultProfitWarehouseId,
        warehouse: wh,
        _warehouseName: warehouseName
      };
    },
    /** 按当前科室拉取全部科室库存，填充盘点明细 */
    handleStocktakingInitFromDeptInventory() {
      if (!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' });
        return;
      }
      const runLoad = () => {
        this.deptInventoryInitLoading = true;
        const pageSize = 500;
        const allRows = [];
        const fetchNext = (pageNum) => {
          // 与科室库存查询「已确认」一致：只拉已收货确认的明细，未确认出库不计入盘点初始化
          return listInventoryPick({
            departmentId: this.form.departmentId,
            pageNum,
            pageSize,
            receiptConfirmStatus: 1
          }).then((res) => {
            const rows = res.rows || [];
            if (rows.length === 0) {
              return allRows;
            }
            allRows.push(...rows);
            if (rows.length < pageSize) {
              return allRows;
            }
            return fetchNext(pageNum + 1);
          });
        };
        fetchNext(1)
          .then((rows) => {
            this.stocktakingBatchSeqCounter = 0;
            this.stkIoStocktakingEntryList = (rows || []).map((it) =>
              this.mapDepInventoryToStocktakingEntry({ ...it, _fromStocktakingInit: true })
            );
            this.departmentLockedByAction = true;
            this.$modal.msgSuccess(`已加载 ${this.stkIoStocktakingEntryList.length} 条科室库存明细`);
          })
          .catch(() => {
            this.$modal.msgError('加载科室库存失败');
          })
          .finally(() => {
            this.deptInventoryInitLoading = false;
          });
      };
      if (this.stkIoStocktakingEntryList && this.stkIoStocktakingEntryList.length > 0) {
        this.$modal
          .confirm('将清空当前盘点明细，并按所选科室「已收货确认」的库存重新加载明细，是否继续？')
          .then(runLoad)
          .catch(() => {});
      } else {
        runLoad();
      }
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
      this.useMaterialDictForSelect = false;
    },
    selectData(val) {
      if (val && val.length > 0) {
        this.departmentLockedByAction = true;
      }
      if (this.addEntryMode === 'LOSS') {
        // 盘亏明细：来源科室库存，直接入明细（保留 depInventoryId），仅允许改盘点数量
        const rows = (val || []).map((item) =>
          this.mapDepInventoryToStocktakingEntry({ ...item, _fromStocktakingInit: true })
        );
        const exists = new Set(
          (this.stkIoStocktakingEntryList || [])
            .map((r) => (r && r.depInventoryId ? String(r.depInventoryId) : ''))
            .filter((s) => s)
        );
        const toAdd = [];
        let skipCount = 0;
        rows.forEach((r) => {
          const key = r && r.depInventoryId ? String(r.depInventoryId) : '';
          if (!key) {
            skipCount += 1;
            return;
          }
          if (exists.has(key)) {
            skipCount += 1;
            return;
          }
          exists.add(key);
          toAdd.push(r);
        });
        if (toAdd.length > 0) {
          this.stkIoStocktakingEntryList.push(...toAdd);
        }
        if (skipCount > 0) {
          this.$modal.msgWarning(`已过滤 ${skipCount} 条重复或无效的科室库存明细`);
        }
        return;
      }
      // 盘盈明细：先二次录入归属仓库/批号/生产日期/有效期后再入明细
      this.selectRow = val;
      const rows = (val || []).map((item) => this.mapDepInventoryToStocktakingEntry({ ...item, _fromStocktakingInit: false }));
      this.pendingNewEntries = rows;
      this.newEntryDialogVisible = rows.length > 0;
    },
    cancelPendingNewEntries() {
      this.newEntryDialogVisible = false;
      this.pendingNewEntries = [];
    },
    confirmPendingNewEntries() {
      const invalid = (this.pendingNewEntries || []).find((r) =>
        !r.returnWarehouseId || !r.batchNumber || !r.endTime || r.unitPrice == null || r.unitPrice === '' || r.stockQty == null || r.stockQty === ''
      );
      if (invalid) {
        this.$modal.msgWarning('请完整填写新增明细的归属仓库、批号、有效期、单价、盘点数量');
        return;
      }
      const invalidNum = (this.pendingNewEntries || []).find((r) => {
        const unitPrice = parseFloat(r.unitPrice);
        const stockQty = parseFloat(r.stockQty);
        return !Number.isFinite(unitPrice) || !Number.isFinite(stockQty) || unitPrice < 0 || stockQty <= 0;
      });
      if (invalidNum) {
        this.$modal.msgWarning('单价必须为不小于 0 的数字，盘点数量必须大于 0');
        return;
      }
      const badDate = (this.pendingNewEntries || []).find((r) =>
        r.beginTime && r.endTime && new Date(r.endTime).getTime() < new Date(r.beginTime).getTime()
      );
      if (badDate) {
        this.$modal.msgWarning('有效期不能早于生产日期');
        return;
      }
      this.stkIoStocktakingEntryList.push(...this.pendingNewEntries);
      this.newEntryDialogVisible = false;
      this.pendingNewEntries = [];
    },
    //当天日期
    getStockDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + (month < 10 ? "0" + month : month) + "-" + (day < 10 ? "0" + day : day);
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
        departmentId: null,
        stockStatus: null,
        userId: null,
        stockType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.stkIoStocktakingEntryList = [];
      this.stocktakingBatchSeqCounter = 0;
      this.departmentLockedByAction = false;
      this.resetForm("form");
    },
    //盘点数量改变事件
    stockQtyChange(row){
      let totalAmt = 0;
      if(row.stockQty && row.unitPrice){
        totalAmt = row.stockQty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    handleStockQtyBlur(row) {
      if (!row) return;
      if (!row.depInventoryId) return;
      const stockQty = parseFloat(row.stockQty || 0);
      const qty = parseFloat(row.qty || 0);
      if (!Number.isFinite(stockQty) || !Number.isFinite(qty)) return;
      if (stockQty > qty) {
        row.stockQty = qty;
        this.stockQtyChange(row);
        this.$modal.msgWarning('盘点数量不能大于库存数量。盘盈请点击“新增盘盈明细”。');
      }
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.stockQty && row.unitPrice){
        totalAmt = row.stockQty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    // 计算盈亏数量
    getProfitQty(row) {
      const stockQty = parseFloat(row.stockQty || 0);
      const qty = parseFloat(row.qty || 0);
      const profitQty = stockQty - qty;
      return profitQty > 0 ? '+' + profitQty.toFixed(2) : profitQty.toFixed(2);
    },
    // 计算盈亏金额
    getProfitAmount(row) {
      const stockQty = parseFloat(row.stockQty || 0);
      const qty = parseFloat(row.qty || 0);
      const unitPrice = parseFloat(row.unitPrice || 0);
      const profitQty = stockQty - qty;
      const profitAmount = profitQty * unitPrice;
      const prefix = profitAmount > 0 ? '+' : '';
      return prefix + '￥' + profitAmount.toFixed(2);
    },
    // 盈亏标志展示：优先后端字段，缺省时前端兜底
    formatProfitLossFlag(row) {
      const flag = (row && row.profitLossFlag ? String(row.profitLossFlag) : '').toUpperCase();
      if (flag === 'PROFIT') return '盘盈';
      if (flag === 'LOSS') return '盘亏';
      if (flag === 'EQUAL') return '持平';
      const stockQty = parseFloat((row && row.stockQty) || 0);
      const qty = parseFloat((row && row.qty) || 0);
      if (!Number.isFinite(stockQty) || !Number.isFinite(qty)) return '--';
      if (stockQty > qty) return '盘盈';
      if (stockQty < qty) return '盘亏';
      return '持平';
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
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
      getStocktaking(id).then(response => {
        this.form = response.data;
        this.stkIoStocktakingEntryList = response.data.stkIoStocktakingEntryList || [];
        this.open = true;
        this.action = false;
        // 查看须保留服务端返回的单据状态，勿写死为未审核（否则已审核单显示错误）
        this.form.stockType = 502;
        this.title = "查看科室盘点";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.stockStatus = 1;
      this.form.stockType = 502; // 盘点类型：502表示盘点
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.stockDate = this.getStockDate();
      this.title = "添加科室盘点";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getStocktaking(id).then(response => {
        this.form = response.data;
        this.form.stockStatus = 1;
        this.form.stockType = 502;
        this.stkIoStocktakingEntryList = response.data.stkIoStocktakingEntryList || [];
        this.open = true;
        this.action = true;
        this.title = "修改科室盘点";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (!valid) return;
        if (this.submitLoading) return;
        const needWh = (this.stkIoStocktakingEntryList || []).filter((r) => !r.fromStocktakingInit);
        const missingWh = needWh.some(
          (r) => r.returnWarehouseId == null || r.returnWarehouseId === ''
        );
        if (missingWh) {
          this.$modal.msgWarning('请为「新增」添加的明细选择所属仓库');
          return;
        }
        const missingBatchMeta = needWh.some(
          (r) => !r.batchNumber || !r.endTime
        );
        if (missingBatchMeta) {
          this.$modal.msgWarning('新增明细请补全批号、有效期');
          return;
        }
        const badDate = (this.stkIoStocktakingEntryList || []).some(
          (r) => r.beginTime && r.endTime && new Date(r.endTime).getTime() < new Date(r.beginTime).getTime()
        );
        if (badDate) {
          this.$modal.msgWarning('有效期不能早于生产日期');
          return;
        }
        const hasProfitOnDepInventory = (this.stkIoStocktakingEntryList || []).some((r) => {
          if (!r.depInventoryId) return false;
          const stockQty = parseFloat(r.stockQty || 0);
          const qty = parseFloat(r.qty || 0);
          return stockQty > qty;
        });
        if (hasProfitOnDepInventory) {
          this.$modal.msgWarning('来源于科室库存的明细仅允许盘亏，不允许盘盈');
          return;
        }
        this.openSaveQtyConfirmDialog();
      });
    },
    openSaveQtyConfirmDialog() {
      this.saveQtyConfirmList = (this.stkIoStocktakingEntryList || [])
        .map((row, idx) => ({
          _confirmKey: `${row.id || 'new'}_${idx}`,
          id: row.id,
          material: row.material,
          batchNo: row.batchNo,
          qty: row.qty,
          unitPrice: row.unitPrice,
          depInventoryId: row.depInventoryId,
          adjustedStockQty: row.stockQty != null ? row.stockQty : row.qty,
          confirmed: false
        }))
        .filter((row) => {
          const detailQty = parseFloat(row.qty || 0);
          const stockQty = parseFloat(row.adjustedStockQty || 0);
          return Number.isFinite(detailQty) && Number.isFinite(stockQty) && detailQty !== stockQty;
        });
      if (!this.saveQtyConfirmList.length) {
        this.doSubmitFormRequest();
        return;
      }
      this.saveQtyConfirmVisible = true;
    },
    confirmSaveQtyRow(row) {
      const v = parseFloat(row.adjustedStockQty);
      if (!Number.isFinite(v) || v < 0) {
        this.$modal.msgWarning('请输入有效的盘点数量');
        return;
      }
      const qty = parseFloat(row.qty || 0);
      if (row.depInventoryId && v > qty) {
        row.adjustedStockQty = qty;
        this.$modal.msgWarning('来源于科室库存的明细仅允许盘亏，盘点数量已回退为库存数量');
      } else {
        row.adjustedStockQty = v;
      }
      row.confirmed = true;
    },
    formatConfirmProfitQty(row) {
      const stockQty = parseFloat((row && row.adjustedStockQty) || 0);
      const qty = parseFloat((row && row.qty) || 0);
      const v = stockQty - qty;
      if (!Number.isFinite(v)) return '--';
      return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    },
    formatConfirmProfitAmt(row) {
      const stockQty = parseFloat((row && row.adjustedStockQty) || 0);
      const qty = parseFloat((row && row.qty) || 0);
      const unitPrice = parseFloat((row && row.unitPrice) || 0);
      const v = (stockQty - qty) * unitPrice;
      if (!Number.isFinite(v)) return '--';
      const prefix = v > 0 ? '+' : '';
      return `${prefix}￥${v.toFixed(2)}`;
    },
    confirmSaveQtyAndSubmit() {
      const unconfirmed = (this.saveQtyConfirmList || []).some((r) => !r.confirmed);
      if (unconfirmed) {
        this.$modal.msgWarning('请先逐条点击“确定”后再提交保存');
        return;
      }
      const adjustMap = new Map((this.saveQtyConfirmList || []).map((r) => [r._confirmKey, r.adjustedStockQty]));
      (this.stkIoStocktakingEntryList || []).forEach((row, idx) => {
        const key = `${row.id || 'new'}_${idx}`;
        if (adjustMap.has(key)) {
          row.stockQty = adjustMap.get(key);
          this.stockQtyChange(row);
        }
      });
      this.saveQtyConfirmVisible = false;
      this.doSubmitFormRequest();
    },
    doSubmitFormRequest() {
      this.form.stkIoStocktakingEntryList = (this.stkIoStocktakingEntryList || []).map((row) => {
        const { fromStocktakingInit, warehouse, _warehouseName, ...rest } = row;
        return rest;
      });
      this.submitLoading = true;
      const isUpdate = this.form.id != null;
      const request = isUpdate ? updateStocktaking(this.form) : addStocktaking(this.form);
      request.then(response => {
        if (response.data) {
          this.form = response.data;
          this.stkIoStocktakingEntryList = response.data.stkIoStocktakingEntryList || [];
        } else if (!isUpdate && this.form.id) {
          getStocktaking(this.form.id).then(res => {
            this.form = res.data;
            this.stkIoStocktakingEntryList = res.data.stkIoStocktakingEntryList || [];
          });
        }
        this.$modal.msgSuccess(isUpdate ? "修改成功" : "新增成功");
        this.open = false;
        this.getList();
      }).finally(() => {
        this.submitLoading = false;
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
    /** 盘点明细序号 */
    rowStkIoStocktakingEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
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
    /** 复选框选中数据 */
    handleStkIoStocktakingEntrySelectionChange(selection) {
      this.checkedStkIoStocktakingEntry = selection.map(item => item.index)
    },
    /** 导出：与「库存查询 → 库存明细查询」同款版式（合并标题、宋体、边框、空行、合计红色） */
    async handleExport() {
      const exportQuery = { ...this.queryParams };
      delete exportQuery.pageNum;
      delete exportQuery.pageSize;
      this.loading = true;
      try {
        const response = await listStocktakingExportRows(exportQuery);
        const rows = (response && response.data) || [];
        if (!rows.length) {
          this.$modal.msgWarning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDeptStocktakingDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室盘点明细表${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$modal.msgError("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    },
    /** 单行导出（同上版式） */
    async handleExportRow(row) {
      this.loading = true;
      try {
        const response = await listStocktakingExportRows({
          stockNo: row.stockNo,
          stockType: this.queryParams.stockType || "502",
        });
        const rows = (response && response.data) || [];
        if (!rows.length) {
          this.$modal.msgWarning("暂无数据可导出");
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
        await exportDeptStocktakingDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || "",
          endDate: this.queryParams.endDate || this.queryParams.beginDate || "",
          fileName: `科室盘点明细表_${row.stockNo}_${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$modal.msgError("导出失败，请稍后重试");
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 与到货验收 inWarehouse/audit 弹窗一致 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
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

/* 弹窗内顶部字段区：与到货验收一致 */
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

/* 盘点日期：保留 rules 校验，仅隐藏必填星号（与 el-form-item label-wrap 两种结构兼容） */
::v-deep .form-fields-container .form-item-stock-date-no-star.is-required .el-form-item__label::before,
::v-deep .form-fields-container .form-item-stock-date-no-star.el-form-item--required .el-form-item__label::before,
::v-deep .form-fields-container .form-item-stock-date-no-star.is-required .el-form-item__label-wrap > .el-form-item__label::before {
  display: none !important;
  content: none !important;
}

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

/* 明细框表头：与到货验收一致 */
::v-deep .local-modal-content .el-table th {
  font-size: 15px !important;
  font-weight: 600 !important;
  background-color: #EBEEF5 !important;
}

::v-deep .local-modal-content .el-table th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table thead th {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table thead th .cell {
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .el-table th.is-leaf {
  background-color: #EBEEF5 !important;
  font-size: 15px !important;
  font-weight: 600 !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 6px;
  box-sizing: border-box;
  overflow-x: auto !important;
  overflow-y: auto !important;
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

::v-deep .local-modal-content {
  min-height: 95vh !important;
}

::v-deep .local-modal-content .el-table .el-table__body-wrapper {
  scrollbar-width: thin;
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

.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 仅列表主表滚动条样式（勿用全局 .el-table，避免影响弹窗内表与合计行） */
::v-deep .stocktaking-apply-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar {
  width: 16px !important;
  height: 8px !important;
}

::v-deep .stocktaking-apply-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 8px;
}

::v-deep .stocktaking-apply-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 8px;
}

::v-deep .stocktaking-apply-page > .el-table.table-compact .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>

<style>
/* 与科室申领列表页布局一致（非 scoped） */
.app-container.stocktaking-apply-page {
  position: relative;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 8px !important;
}

/* 搜索区：非 scoped，确保 el-form 根节点能套上到货验收同款白底/边框/阴影 */
.app-container.stocktaking-apply-page > .el-form.query-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  border: 1px solid #c0c4cc;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  margin-bottom: 16px;
  margin-top: -12px !important;
}

.app-container.stocktaking-apply-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.stocktaking-apply-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.stocktaking-apply-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-second {
  position: relative;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.stocktaking-apply-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container.stocktaking-apply-page .query-item-inline .el-form-item__label {
  width: 80px !important;
}

.app-container.stocktaking-apply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.stocktaking-apply-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.stocktaking-apply-page > .el-table.table-compact {
  margin-top: 0;
}

/* 主表格表头样式：与到货验收一致 */
.app-container.stocktaking-apply-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.stocktaking-apply-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
  font-family: 'Roboto', sans-serif !important;
}

/* 单据状态列：表头与内容不换行（须配合 label-class-name / class-name，勿用 nth-child：含勾选列会错位） */
.app-container.stocktaking-apply-page > .el-table th.stocktaking-col-stock-status .cell,
.app-container.stocktaking-apply-page > .el-table td.stocktaking-col-stock-status .cell {
  white-space: nowrap !important;
}

/*
 * Element UI 2.x：show-summary 时表尾带 v-show="data && data.length > 0"，
 * 无数据时合计行被隐藏。强制显示表尾，与到货验收/科室批量消耗等页一致。
 */
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.stocktaking-apply-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
</style>
