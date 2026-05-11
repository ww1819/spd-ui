<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="业务单号" prop="stockNo" label-width="100px">
            <el-input v-model="queryParams.stockNo"
                      placeholder="业务单号"
                      clearable
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="制单日期" prop="stockDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.stockDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择制单日期">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId"/>
          </el-form-item>
        </el-col>

        <el-col :span="6" label-width="100px">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>

      </el-row>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['stocktaking:in:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['stocktaking:in:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inList" @selection-change="handleSelectionChange" height="54vh" border stripe>
      <el-table-column label="业务单号" align="center" prop="stockNo" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="制单日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="单据状态" align="center" prop="stockStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盘点类型" align="center" prop="stockType" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.stockType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-dropdown v-if="scope.row.stockStatus != 2">
            <el-button type="primary">
              更多操作<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleUpdate(scope.row)"
                                v-hasPermi="['stocktaking:in:edit']"
              >修改</el-dropdown-item>

              <el-dropdown-item @click.native="handleAudit(scope.row)"
                                v-hasPermi="['stocktaking:in:audit']"
              >审核</el-dropdown-item>

              <el-dropdown-item @click.native="handleDelete(scope.row)"
                                v-hasPermi="['stocktaking:in:remove']"
              >删除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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

    <!-- 添加或修改盘点对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
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
            <el-form-item label="供应商" prop="supplerId" label-width="100px">
              <SelectSupplier v-model="form.supplerId" :disabled="true" />
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
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="form.warehouseId" :disabled="!action || warehouseLockedByAction"/>
            </el-form-item>

          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="盘点类型" prop="stockType" label-width="100px">
              <el-select v-model="form.stockType" placeholder="请选择盘点类型"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
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
              <el-button type="primary" icon="el-icon-refresh" size="small" :loading="whInventoryInitLoading" @click="handleStocktakingInitFromWarehouseInventory">盘点初始化</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
            </el-col>
          </div>
        </el-row>

        <el-table :data="stkIoStocktakingEntryList" :row-class-name="rowStkIoStocktakingEntryIndex" @selection-change="handleStkIoStocktakingEntrySelectionChange" ref="stkIoStocktakingEntry" height="calc(42vh)" border>
          <el-table-column type="selection" width="50" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="耗材名称" prop="materialId" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-if="!scope.row.kcNo && action" v-model="scope.row.materialId" :value2="isShow"/>
              <span v-else>{{ scope.row.material ? (scope.row.material.name || '--') : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="material.speci" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material">{{ scope.row.material.speci || '--' }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>

          <el-table-column label="库存数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : 0 }}</span>
            </template>
          </el-table-column>

          <el-table-column label="盘点数量" prop="stockQty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.stockQty" type="number" :disabled="!action" @input="stockQtyChangeWh(scope.row)" placeholder="盘点数量" />
            </template>
          </el-table-column>
          <el-table-column v-if="action" label="盘盈复制" width="96" align="center" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-button type="text" size="small" @click="copyDetailToProfitDialog(scope.row)">盘盈复制</el-button>
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-if="!scope.row.kcNo && action" v-model="scope.row.price" type="number" @input="priceChange(scope.row)" placeholder="单价" />
              <span v-else>{{ scope.row.unitPrice != null ? parseFloat(scope.row.unitPrice).toFixed(2) : (scope.row.price != null ? parseFloat(scope.row.price).toFixed(2) : '--') }}</span>
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="金额" />
            </template>
          </el-table-column>

          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" label-width="200px" placeholder="批次号" />
            </template>
          </el-table-column>

          <el-table-column label="批号" prop="batchNumber" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" label-width="200px" placeholder="批号" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择出库日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择出库日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="备注" />
            </template>
          </el-table-column>
        </el-table>
            </el-form>
            <div class="modal-footer" v-show="action">
              <el-button @click="cancel">取 消</el-button>
              <el-button type="primary" @click="submitForm" :loading="submitLoading">确 定</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <SelectInventory
      v-if="dialogInvShow"
      :DialogComponentShow="dialogInvShow"
      :warehouseValue="form.warehouseId"
      :selected-details="stkIoStocktakingEntryList"
      @closeDialog="closeInvDialog"
      @selectData="selectWhInventoryData"
    />
    <SelectDepInventory
      v-if="dialogDepShow"
      :DialogComponentShow="dialogDepShow"
      :department-value="''"
      :use-material-dict="true"
      @closeDialog="closeDepDialog"
      @selectData="selectProfitMaterialData"
    />
    <el-dialog
      custom-class="profit-pending-dialog"
      title="新增盘盈明细信息"
      :visible.sync="newEntryDialogVisible"
      width="1080px"
      append-to-body
      :close-on-click-modal="false"
    >
      <el-table :data="pendingNewEntries" border size="small" v-loading="profitNameSpecStockLoading">
        <el-table-column label="耗材编码" width="120" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材名称" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">{{ scope.row.material && scope.row.material.name ? scope.row.material.name : '--' }}</template>
        </el-table-column>
        <el-table-column label="规格" min-width="120" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ scope.row.material && scope.row.material.speci ? scope.row.material.speci : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单价" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.unitPrice" type="number" placeholder="请输入单价" @input="priceChangePending(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="盘点数量" min-width="120">
          <template slot-scope="scope">
            <el-input v-model="scope.row.stockQty" type="number" placeholder="请输入盘点数量" @input="stockQtyChangePending(scope.row)" />
          </template>
        </el-table-column>
        <el-table-column label="当前库存" width="110" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span>{{ formatProfitNameSpecStockQty(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" min-width="340" width="360">
          <template slot-scope="scope">
            <div class="profit-batch-cell">
              <el-input
                v-model="scope.row.batchNumber"
                type="textarea"
                :autosize="{ minRows: 2, maxRows: 14 }"
                :disabled="scope.row._batchLocked"
                placeholder="请输入批号"
                class="profit-batch-textarea"
                @input="onProfitBatchNumberInput(scope.row)"
              />
              <div class="profit-batch-checks">
                <el-checkbox v-model="scope.row._cbBatchNone" @change="() => profitBatchNoneChange(scope.row)">无</el-checkbox>
                <el-checkbox v-model="scope.row._cbBatchUnknown" @change="() => profitBatchUnknownChange(scope.row)">未知</el-checkbox>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="有效期" min-width="240">
          <template slot-scope="scope">
            <div class="profit-expiry-cell">
              <el-date-picker
                v-model="scope.row.endTime"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="请选择"
                :disabled="scope.row._longTerm"
                style="width: 150px"
                @change="onProfitExpiryManualChange(scope.row)"
              />
              <el-checkbox v-model="scope.row._longTerm" @change="profitLongTermChange(scope.row)">长期</el-checkbox>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="生产日期" min-width="140">
          <template slot-scope="scope">
            <el-date-picker v-model="scope.row.beginTime" type="date" value-format="yyyy-MM-dd" placeholder="可不填" />
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="cancelPendingNewEntries">取 消</el-button>
        <el-button type="primary" @click="confirmPendingNewEntries">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="保存前确认（明细库存与仓库实物不一致）"
      :visible.sync="saveQtyConfirmVisible"
      width="1020px"
      append-to-body
      :close-on-click-modal="false"
      v-loading="saveQtyConfirmLoading"
    >
      <div style="margin-bottom: 8px; color: #e6a23c;">
        以下明细「库存数量」与当前仓库库存明细不一致，请逐条点击「确定」确认；确认后将把明细中的库存数量更新为当前实物数量，并重新计算金额。普通盘盈/盘亏（仅盘点数量与账面不同、但与仓库库存一致）不会进入本表。
      </div>
      <el-table :data="saveQtyConfirmList" border size="small">
        <el-table-column label="耗材编码" width="120" align="center" show-overflow-tooltip>
          <template slot-scope="scope">
            <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材名称" min-width="150" show-overflow-tooltip>
          <template slot-scope="scope">{{ (scope.row.material && scope.row.material.name) || '--' }}</template>
        </el-table-column>
        <el-table-column label="批次号" prop="batchNo" min-width="140" />
        <el-table-column label="明细库存数量" prop="detailQty" width="120" align="center" />
        <el-table-column label="当前仓库库存" prop="currentQty" width="120" align="center" />
        <el-table-column label="盘点数量" min-width="100" align="center">
          <template slot-scope="scope">
            <span>{{ scope.row.adjustedStockQty != null && scope.row.adjustedStockQty !== '' ? scope.row.adjustedStockQty : '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="盈亏数量" width="120">
          <template slot-scope="scope">
            <span>{{ formatWhSaveConfirmProfitQty(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="confirmWhSaveQtyRow(scope.row)">{{ scope.row.confirmed ? '已确定' : '确定' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="saveQtyConfirmVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmWhSaveQtyAndSubmit">确 定</el-button>
      </div>
    </el-dialog>

    <el-dialog
      title="审核前确认（明细库存与仓库实物不一致）"
      :visible.sync="whAuditQtyMismatchVisible"
      width="980px"
      append-to-body
      :close-on-click-modal="false"
    >
      <div style="margin-bottom: 8px; color: #e6a23c;">
        以下明细「库存数量」与当前仓库库存不一致，请逐条确认盘点数量后再审核；确认后将把明细账面库存更新为当前仓库数量并回写盈亏。仅账面与仓库实物不一致时需确认，普通盘盈盘亏不进入本表。
      </div>
      <el-table :data="qtyMismatchAuditList" border size="small">
        <el-table-column label="耗材" prop="materialName" min-width="150" />
        <el-table-column label="批次号" prop="batchNo" min-width="150" />
        <el-table-column label="明细内库存数量" prop="detailQty" width="140" />
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
import { listInventory, listInventoryPick, listInventoryStocktakingProfitQtySummary } from "@/api/warehouse/inventory";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectInventory from "@/components/SelectModel/SelectInventory";
import SelectDepInventory from "@/components/SelectModel/SelectDepInventory";

export default {
  name: "InStocktaking",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectInventory,SelectDepInventory},
  data() {
    return {
      // 遮罩层
      loading: true,
      dialogInvShow: false,
      dialogDepShow: false,
      whInventoryInitLoading: false,
      stocktakingBatchSeqCounter: 0,
      newEntryDialogVisible: false,
      pendingNewEntries: [],
      profitNameSpecStockMap: {},
      profitNameSpecStockLoading: false,
      supplierValue: "",
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
      saveQtyConfirmVisible: false,
      saveQtyConfirmList: [],
      saveQtyConfirmLoading: false,
      whAuditQtyMismatchVisible: false,
      qtyMismatchAuditList: [],
      pendingWhAuditId: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        supplerId: null,
        stockDate: null,
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
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "change" }
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
  watch: {
    newEntryDialogVisible(val) {
      if (val) {
        this.$nextTick(() => this.refreshProfitNameSpecStockWh());
      }
    }
  },
  computed: {
    warehouseLockedByAction() {
      return Array.isArray(this.stkIoStocktakingEntryList) && this.stkIoStocktakingEntryList.length > 0;
    }
  },
  methods: {
    normalizeLoadedEntries(list) {
      (list || []).forEach((row) => {
        if (row && (row.stockQty == null || row.stockQty === '')) {
          row.stockQty = row.qty != null && row.qty !== '' ? row.qty : 0;
        }
      });
      return list || [];
    },
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
    mapWhInventoryToStocktakingEntry(item) {
      const book = item.qty != null && item.qty !== '' ? item.qty : 0;
      const up = item.unitPrice != null && item.unitPrice !== '' ? item.unitPrice : (item.price != null ? item.price : null);
      const stockQty = book;
      const unitPriceNum = parseFloat(up || 0);
      const amt = (parseFloat(stockQty) || 0) * (Number.isFinite(unitPriceNum) ? unitPriceNum : 0);
      return {
        kcNo: item.id,
        materialId: item.materialId,
        material: item.material || null,
        supplierId: item.supplierId || (item.material && item.material.supplierId) || null,
        unitPrice: up,
        price: up,
        qty: book,
        stockQty,
        amt: amt.toFixed(2),
        batchNo: item.batchNo || '',
        batchNumber: item.batchNumber || item.materialNo || '',
        beginTime: item.beginTime ? (typeof item.beginTime === 'string' ? item.beginTime : this.parseTime(item.beginTime, '{y}-{m}-{d}')) : '',
        endTime: item.endTime ? (typeof item.endTime === 'string' ? item.endTime : this.parseTime(item.endTime, '{y}-{m}-{d}')) : '',
        remark: ''
      };
    },
    openAddLossEntry() {
      if (!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' });
        return;
      }
      this.dialogInvShow = true;
    },
    openAddProfitEntry() {
      if (!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' });
        return;
      }
      this.dialogDepShow = true;
    },
    closeInvDialog() {
      this.dialogInvShow = false;
    },
    closeDepDialog() {
      this.dialogDepShow = false;
    },
    selectWhInventoryData(val) {
      const rows = (val || []).map((it) => this.mapWhInventoryToStocktakingEntry(it));
      const exists = new Set(
        (this.stkIoStocktakingEntryList || [])
          .map((r) => (r && r.kcNo != null ? String(r.kcNo) : ''))
          .filter((s) => s)
      );
      const toAdd = [];
      let skip = 0;
      rows.forEach((r) => {
        const k = r && r.kcNo != null ? String(r.kcNo) : '';
        if (!k) {
          skip += 1;
          return;
        }
        if (exists.has(k)) {
          skip += 1;
          return;
        }
        exists.add(k);
        toAdd.push(r);
      });
      if (toAdd.length) {
        this.stkIoStocktakingEntryList.push(...toAdd);
      }
      if (skip) {
        this.$modal.msgWarning(`已过滤 ${skip} 条重复或无效的仓库库存明细`);
      }
    },
    selectProfitMaterialData(val) {
      const rows = (val || []).map((row) => {
        const mat = row.material || null;
        const materialPrice =
          mat && mat.price != null && mat.price !== ''
            ? mat.price
            : mat && mat.salePrice != null && mat.salePrice !== ''
              ? mat.salePrice
              : null;
        return {
          materialId: row.materialId != null ? row.materialId : mat && mat.id,
          material: mat,
          unitPrice: materialPrice,
          price: materialPrice,
          qty: 0,
          stockQty: '',
          amt: '0.00',
          batchNo: this.nextStocktakingBatchNo(),
          batchNumber: '',
          beginTime: '',
          endTime: '',
          remark: ''
        };
      });
      rows.forEach((r) => this.initProfitPendingEntryMeta(r));
      this.pendingNewEntries = rows;
      this.newEntryDialogVisible = rows.length > 0;
    },
    initProfitPendingEntryMeta(row) {
      if (!row) return;
      const b = row.batchNumber != null ? String(row.batchNumber).trim() : "";
      const isNone = b === "无";
      const isUnknown = b === "未知";
      this.$set(row, "_cbBatchNone", isNone);
      this.$set(row, "_cbBatchUnknown", isUnknown);
      this.$set(row, "_batchLocked", isNone || isUnknown);
      const et = row.endTime != null ? String(row.endTime).trim() : "";
      this.$set(row, "_longTerm", et === "2099-01-01");
    },
    profitBatchNoneChange(row) {
      if (row._cbBatchNone) {
        row._cbBatchUnknown = false;
        row.batchNumber = "无";
        row._batchLocked = true;
      } else {
        if (String(row.batchNumber || "").trim() === "无") {
          row.batchNumber = "";
        }
        row._batchLocked = !!row._cbBatchUnknown;
      }
    },
    profitBatchUnknownChange(row) {
      if (row._cbBatchUnknown) {
        row._cbBatchNone = false;
        row.batchNumber = "未知";
        row._batchLocked = true;
      } else {
        if (String(row.batchNumber || "").trim() === "未知") {
          row.batchNumber = "";
        }
        row._batchLocked = !!row._cbBatchNone;
      }
    },
    onProfitBatchNumberInput(row) {
      if (row._batchLocked) return;
      const t = String(row.batchNumber || "").trim();
      row._cbBatchNone = t === "无";
      row._cbBatchUnknown = t === "未知";
    },
    profitLongTermChange(row) {
      if (row._longTerm) {
        row.endTime = "2099-01-01";
      } else if (String(row.endTime || "").trim() === "2099-01-01") {
        row.endTime = "";
      }
    },
    onProfitExpiryManualChange(row) {
      if (String(row.endTime || "").trim() === "2099-01-01") {
        row._longTerm = true;
      } else {
        row._longTerm = false;
      }
    },
    formatDateYmdForProfitCopy(value) {
      if (value == null || value === "") return "";
      if (typeof value === "string") {
        const s = value.trim();
        return s.length >= 10 ? s.slice(0, 10) : s;
      }
      try {
        return this.parseTime(value, "{y}-{m}-{d}");
      } catch (e) {
        return "";
      }
    },
    getProfitNameSpecKey(row) {
      const m = row && row.material ? row.material : null;
      const name = m && m.name != null ? String(m.name).trim() : "";
      const spec = m && m.speci != null ? String(m.speci).trim() : "";
      return `${name}||${spec}`;
    },
    formatProfitNameSpecStockQty(row) {
      const k = this.getProfitNameSpecKey(row);
      if (!k || k === "||") return "--";
      const v = this.profitNameSpecStockMap[k];
      if (v == null || !Number.isFinite(v)) return "0";
      const n = Number(v);
      return Math.abs(n - Math.round(n)) < 1e-6 ? String(Math.round(n)) : n.toFixed(2);
    },
    async refreshProfitNameSpecStockWh() {
      if (!this.newEntryDialogVisible || !this.form.warehouseId) {
        this.profitNameSpecStockMap = {};
        return;
      }
      this.profitNameSpecStockLoading = true;
      const map = {};
      try {
        const res = await listInventoryStocktakingProfitQtySummary({
          warehouseId: this.form.warehouseId
        });
        const rows = Array.isArray(res.data) ? res.data : [];
        rows.forEach((it) => {
          const name = it.materialName != null ? String(it.materialName).trim() : "";
          const spec = it.materialSpeci != null ? String(it.materialSpeci).trim() : "";
          const key = `${name}||${spec}`;
          const q = parseFloat(it.materialQty);
          const add = Number.isFinite(q) ? q : 0;
          map[key] = (map[key] || 0) + add;
        });
        this.profitNameSpecStockMap = map;
      } catch (e) {
        this.profitNameSpecStockMap = {};
      } finally {
        this.profitNameSpecStockLoading = false;
      }
    },
    copyDetailToProfitDialog(detailRow) {
      if (!this.form.warehouseId) {
        this.$message({ message: "请先选择仓库", type: "warning" });
        return;
      }
      const mid = detailRow.materialId || (detailRow.material && detailRow.material.id);
      if (!mid) {
        this.$modal.msgWarning("当前行缺少耗材信息，无法复制");
        return;
      }
      const mat = detailRow.material ? { ...detailRow.material } : { id: mid };
      const materialPrice =
        mat.price != null && mat.price !== ""
          ? mat.price
          : mat.salePrice != null && mat.salePrice !== ""
            ? mat.salePrice
            : null;
      const unitPrice =
        detailRow.unitPrice != null && detailRow.unitPrice !== ""
          ? detailRow.unitPrice
          : detailRow.price != null && detailRow.price !== ""
            ? detailRow.price
            : materialPrice;
      const batchNumber = detailRow.batchNumber != null ? String(detailRow.batchNumber) : "";
      const endTime = this.formatDateYmdForProfitCopy(detailRow.endTime);
      const beginTime = this.formatDateYmdForProfitCopy(detailRow.beginTime);
      const entry = {
        materialId: mid,
        material: mat,
        supplierId: mat.supplierId || null,
        unitPrice,
        price: unitPrice,
        qty: 0,
        stockQty: "",
        amt: "0.00",
        batchNo: this.nextStocktakingBatchNo(),
        batchNumber,
        beginTime,
        endTime,
        remark: ""
      };
      this.initProfitPendingEntryMeta(entry);
      if (!Array.isArray(this.pendingNewEntries)) {
        this.pendingNewEntries = [];
      }
      this.pendingNewEntries.push(entry);
      this.newEntryDialogVisible = true;
      this.$nextTick(() => this.refreshProfitNameSpecStockWh());
    },
    cancelPendingNewEntries() {
      this.newEntryDialogVisible = false;
      this.pendingNewEntries = [];
    },
    confirmPendingNewEntries() {
      const invalid = (this.pendingNewEntries || []).find(
        (r) =>
          !r.batchNumber ||
          !r.endTime ||
          r.unitPrice == null ||
          r.unitPrice === '' ||
          r.stockQty == null ||
          r.stockQty === ''
      );
      if (invalid) {
        this.$modal.msgWarning('请完整填写新增明细的批号、有效期、单价、盘点数量');
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
      const badDate = (this.pendingNewEntries || []).find(
        (r) => r.beginTime && r.endTime && new Date(r.endTime).getTime() < new Date(r.beginTime).getTime()
      );
      if (badDate) {
        this.$modal.msgWarning('有效期不能早于生产日期');
        return;
      }
      (this.pendingNewEntries || []).forEach((r) => {
        delete r._cbBatchNone;
        delete r._cbBatchUnknown;
        delete r._batchLocked;
        delete r._longTerm;
        r.price = r.unitPrice;
        const a = (parseFloat(r.stockQty) || 0) * (parseFloat(r.unitPrice) || 0);
        r.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
        r.kcNo = null;
      });
      this.stkIoStocktakingEntryList.push(...this.pendingNewEntries);
      this.newEntryDialogVisible = false;
      this.pendingNewEntries = [];
    },
    priceChangePending(row) {
      const a = (parseFloat(row.stockQty) || 0) * (parseFloat(row.unitPrice) || 0);
      row.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
      row.price = row.unitPrice;
    },
    stockQtyChangePending(row) {
      const a = (parseFloat(row.stockQty) || 0) * (parseFloat(row.unitPrice) || 0);
      row.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
    },
    handleStocktakingInitFromWarehouseInventory() {
      if (!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' });
        return;
      }
      const run = () => {
        this.whInventoryInitLoading = true;
        const pageSize = 500;
        const allRows = [];
        const fetchNext = (pageNum) =>
          listInventory({
            warehouseId: this.form.warehouseId,
            pageNum,
            pageSize
          }).then((res) => {
            const rows = res.rows || [];
            if (!rows.length) {
              return allRows;
            }
            allRows.push(...rows);
            if (rows.length < pageSize) {
              return allRows;
            }
            return fetchNext(pageNum + 1);
          });
        fetchNext(1)
          .then((rows) => {
            this.stocktakingBatchSeqCounter = 0;
            this.stkIoStocktakingEntryList = (rows || []).map((it) => this.mapWhInventoryToStocktakingEntry(it));
            this.$modal.msgSuccess(`已加载 ${this.stkIoStocktakingEntryList.length} 条仓库库存明细`);
          })
          .catch(() => this.$modal.msgError('加载仓库库存失败'))
          .finally(() => {
            this.whInventoryInitLoading = false;
          });
      };
      if (this.stkIoStocktakingEntryList && this.stkIoStocktakingEntryList.length > 0) {
        this.$modal
          .confirm('将清空当前盘点明细，并按所选仓库库存重新加载明细，是否继续？')
          .then(run)
          .catch(() => {});
      } else {
        run();
      }
    },
    stockQtyChangeWh(row) {
      const up = parseFloat(row.unitPrice != null ? row.unitPrice : row.price || 0);
      const sq = parseFloat(row.stockQty || 0);
      const a = sq * (Number.isFinite(up) ? up : 0);
      row.amt = Number.isFinite(a) ? a.toFixed(2) : '0.00';
    },
    /** 查询盘点列表 */
    getList() {
      this.loading = true;
      this.queryParams.stockType = "501";
      listStocktaking(this.queryParams).then(response => {
        this.inList = response.rows;
        this.total = response.total;
        this.loading = false;
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
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      const n = parseFloat(row.stockQty != null ? row.stockQty : row.qty);
      const p = parseFloat(row.price);
      if (Number.isFinite(n) && Number.isFinite(p)) {
        totalAmt = n * p;
      }
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      row.unitPrice = row.price;
      this.qtyChange(row);
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
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加盘点";
      this.form.stockStatus = '1';
      this.form.stockType = '501';
      this.stocktakingBatchSeqCounter = 0;
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.stockDate = this.getBillDate();
      this.action = true;
    },
    /** 查看按钮操作 */
    handleView(row){

      const id = row.id
      getStocktaking(id).then(response => {
        this.form = response.data;
        this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(response.data.stkIoStocktakingEntryList || []);
        this.open = true;
        this.action = false;
        this.form.stockStatus = '1';
        this.form.stockType = '501';
        this.title = "查看盘点";
      });

    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids;
      const stockNo = row && row.stockNo != null ? row.stockNo : id;
      this.$modal
        .confirm('确定要审核"' + stockNo + '"的数据项？')
        .then(() => checkStocktakingQty({ id }))
        .then((res) => {
          const rows = (res && res.data) || [];
          if (!rows.length) {
            return auditStocktaking({ id });
          }
          this.pendingWhAuditId = id;
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
      auditStocktaking({ id: this.pendingWhAuditId, qtyAdjustList }).then(() => {
        this.whAuditQtyMismatchVisible = false;
        this.qtyMismatchAuditList = [];
        this.pendingWhAuditId = null;
        this.getList();
        this.$modal.msgSuccess('审核成功！');
      });
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getStocktaking(id).then(response => {
        this.form = response.data;
        this.stkIoStocktakingEntryList = this.normalizeLoadedEntries(response.data.stkIoStocktakingEntryList || []);
        this.open = true;
        this.title = "修改盘点";
        this.form.stockStatus = '1';
        this.form.stockType = '501';
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (!valid) return;
        if (!this.stkIoStocktakingEntryList || this.stkIoStocktakingEntryList.length === 0) {
          this.$modal.msgWarning('请至少添加一条盘点明细');
          return;
        }
        if (this.submitLoading) return;
        this.openSaveQtyConfirmDialogWarehouse();
      });
    },
    async openSaveQtyConfirmDialogWarehouse() {
      const list = this.stkIoStocktakingEntryList || [];
      this.saveQtyConfirmLoading = true;
      try {
        const rows = await Promise.all(
          list.map(async (row, idx) => {
            if (!row || row.kcNo == null || row.kcNo === '') {
              return null;
            }
            try {
              const idRaw = row.kcNo;
              const idNum = typeof idRaw === 'number' ? idRaw : parseInt(String(idRaw).trim(), 10);
              if (!Number.isFinite(idNum)) {
                return null;
              }
              const res = await listInventoryPick({
                id: idNum,
                pageNum: 1,
                pageSize: 1
              });
              const pickRows = (res && res.rows) || [];
              if (!pickRows.length) {
                return { _fetchError: true };
              }
              const inv = pickRows[0];
              const live = inv != null && inv.qty != null && inv.qty !== '' ? parseFloat(inv.qty) : NaN;
              const book = row.qty != null && row.qty !== '' ? parseFloat(row.qty) : NaN;
              if (!Number.isFinite(live) || !Number.isFinite(book) || book === live) {
                return null;
              }
              return {
                _confirmKey: `${row.id || 'new'}_${idx}`,
                _rowIndex: idx,
                id: row.id,
                material: row.material,
                batchNo: row.batchNo,
                detailQty: row.qty,
                currentQty: live,
                adjustedStockQty: row.stockQty != null && row.stockQty !== '' ? row.stockQty : row.qty,
                confirmed: false
              };
            } catch (e) {
              return { _fetchError: true };
            }
          })
        );
        if (rows.some((r) => r && r._fetchError)) {
          this.$modal.msgError('加载仓库库存明细失败，请检查网络后重试');
          return;
        }
        this.saveQtyConfirmList = rows.filter((r) => r && !r._fetchError);
        if (!this.saveQtyConfirmList.length) {
          this.doSubmitStocktakingForm();
          return;
        }
        this.saveQtyConfirmVisible = true;
      } finally {
        this.saveQtyConfirmLoading = false;
      }
    },
    confirmWhSaveQtyRow(row) {
      const idx = row && row._rowIndex;
      if (idx == null || idx < 0) return;
      const target = (this.stkIoStocktakingEntryList || [])[idx];
      if (!target) return;
      const live = parseFloat(row.currentQty);
      if (!Number.isFinite(live) || live < 0) {
        this.$modal.msgWarning('当前仓库库存数据无效');
        return;
      }
      this.$set(target, 'qty', live);
      this.stockQtyChangeWh(target);
      this.$set(row, 'confirmed', true);
    },
    formatWhSaveConfirmProfitQty(row) {
      const stockQty = parseFloat((row && row.adjustedStockQty) || 0);
      const bookAfter = parseFloat((row && row.currentQty) || 0);
      const v = stockQty - bookAfter;
      if (!Number.isFinite(v)) return '--';
      return v > 0 ? `+${v.toFixed(2)}` : v.toFixed(2);
    },
    confirmWhSaveQtyAndSubmit() {
      const unconfirmed = (this.saveQtyConfirmList || []).some((r) => !r.confirmed);
      if (unconfirmed) {
        this.$modal.msgWarning('请先逐条点击“确定”后再提交保存');
        return;
      }
      this.saveQtyConfirmVisible = false;
      this.doSubmitStocktakingForm();
    },
    doSubmitStocktakingForm() {
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
    /** 复选框选中数据 */
    handleStkIoStocktakingEntrySelectionChange(selection) {
      this.checkedStkIoStocktakingEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('stocktaking/in/export', {
        ...this.queryParams
      }, `in_${new Date().getTime()}.xlsx`)
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
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266 !important;
  font-weight: 600 !important;
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table td {
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table .cell {
  padding: 0 8px;
  line-height: 1.5;
}

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}

.profit-pending-dialog .el-table .cell {
  vertical-align: top;
}
.profit-pending-dialog .profit-batch-cell {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 0;
}
.profit-pending-dialog .profit-batch-textarea .el-textarea__inner {
  min-height: 48px !important;
  line-height: 1.5;
  word-break: break-word;
  white-space: pre-wrap;
  resize: vertical;
}
.profit-pending-dialog .profit-batch-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}
.profit-pending-dialog .profit-expiry-cell {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}
</style>
