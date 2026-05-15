<template>
  <div class="app-container stocktaking-audit-page">
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
            <el-form-item prop="stockStatus" class="query-item-inline">
              <el-select v-model="queryParams.stockStatus" placeholder="单据状态"
                         clearable
                         style="width: 180px">
                <el-option label="未审核" :value="1" />
                <el-option label="已审核" :value="2" />
              </el-select>
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
          size="small"
          @click="handleExport"
          v-hasPermi="['department:stocktakingAudit:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleBatchAudit"
          v-hasPermi="['department:stocktakingAudit:audit']"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleBatchReject"
          v-hasPermi="['department:stocktakingAudit:reject']"
        >驳回</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="stocktakingList" :row-class-name="stocktakingListIndex" @selection-change="handleSelectionChange" height="58vh" border stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="盘点单号" align="center" prop="stockNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
      <el-table-column label="制单人" align="center" prop="createBy" width="110" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createUserNickName || scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单时间" align="center" prop="createTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
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
          <span v-if="scope.row.stockStatus == 2">{{ scope.row.auditUserNickName || scope.row.updateBy || '--' }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="审核时间" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.stockStatus == 2 && scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else-if="scope.row.stockStatus == 2 && scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
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
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="300" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              v-if="scope.row.stockStatus == 2"
              size="small"
              type="text"
              v-hasPermi="['department:stocktakingAudit:export', 'department:stocktaking:export']"
              @click="handleExportRow(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >导出</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleAudit(scope.row)"
              v-hasPermi="['department:stocktakingAudit:audit']"
              v-if="scope.row.stockStatus == 1"
              style="padding: 0 5px; margin: 0; color: #67C23A;"
            >审核</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleReject(scope.row)"
              v-hasPermi="['department:stocktakingAudit:reject']"
              v-if="scope.row.stockStatus == 1"
              style="padding: 0 5px; margin: 0; color: #F56C6C;"
            >驳回</el-button>
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

    <!-- 查看盘点对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
              <div class="form-input-container">
                <el-row>
                  <el-col :span="4">
                    <el-form-item label="单据状态" prop="stockStatus" label-width="100px">
                      <el-input v-model="stockStatusText" :disabled="true" style="width: 150px" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="盘点单号" prop="stockNo" label-width="100px">
                      <el-input v-model="form.stockNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="盘点日期" prop="stockDate" label-width="100px">
                      <el-date-picker clearable
                                      v-model="form.stockDate"
                                      type="date"
                                      :disabled="true"
                                      value-format="yyyy-MM-dd"
                                      style="width: 150px"
                                      placeholder="请选择盘点日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="科室" prop="departmentId" label-width="80px">
                      <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="5">
                    <el-form-item label="制单人" prop="createBy" label-width="100px">
                      <el-input :value="deptFormCreatorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="制单时间" label-width="100px">
                      <el-input :value="deptFormCreateTimeText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="审核人" label-width="100px">
                      <el-input :value="deptFormAuditorName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="5">
                    <el-form-item label="审核时间" label-width="100px">
                      <el-input :value="deptFormAuditTimeText" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="总金额" label-width="100px">
                      <el-input :value="totalAmountText" :disabled="true" style="width: 150px; font-weight: bold; color: #409EFF;" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <!-- 驳回原因输入框（仅未审核时显示） -->
                <el-row v-if="form.stockStatus == 1">
                  <el-col :span="12">
                    <el-form-item label="驳回原因" prop="rejectReason" label-width="100px">
                      <el-input 
                        v-model="form.rejectReason" 
                        type="textarea" 
                        :rows="3"
                        placeholder="驳回原因（驳回时必填）" 
                        style="width: 100%" 
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>
              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>盘点明细信息</span>
                </el-col>
              </el-row>
              <el-table :data="stkIoStocktakingEntryList" :row-class-name="rowStkIoStocktakingEntryIndex"
                        ref="stkIoStocktakingEntry" height="calc(42vh)" border
              >
                <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
                <el-table-column label="耗材编码" align="center" prop="material.code" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.material && scope.row.material.code">{{ scope.row.material.code }}</span>
                    <span v-else>--</span>
                  </template>
                </el-table-column>
                <el-table-column label="耗材名称" prop="materialId" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span v-if="scope.row.material">{{ scope.row.material.name || '--' }}</span>
                    <span v-else>--</span>
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
                    <span v-if="scope.row.material">{{ scope.row.material.model || '--' }}</span>
                    <span v-else>--</span>
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
                <el-table-column label="明细账面数量" prop="qty" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatEntryQtyDisplay(scope.row, 'qty') }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="实盘数量" prop="stockQty" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatEntryQtyDisplay(scope.row, 'stockQty') }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="当前库存数量" width="120" align="center" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ formatEntryCurrentInventoryQty(scope.row) }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt ? parseFloat(scope.row.amt).toFixed(2) : '--' }}</span>
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
                    <span>{{ scope.row.batchNo || '--' }}</span>
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
                <el-table-column label="备注" prop="remark" width="400" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.remark || '--' }}</span>
                  </template>
                </el-table-column>
              </el-table>
            </el-form>
            <!-- 审核操作按钮（仅未审核时显示） -->
            <div class="modal-footer" v-if="form.stockStatus == 1">
              <el-button @click="cancel">取 消</el-button>
              <el-button type="danger" @click="handleRejectSubmit">驳 回</el-button>
              <el-button type="primary" @click="handleAuditSubmit">审 核</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <el-dialog title="库存数量不一致校验" :visible.sync="qtyMismatchDialogVisible" width="980px" append-to-body>
      <div style="margin-bottom: 8px; color: #e6a23c;">检测到明细「库存数量」与当前科室账面库存不一致（非普通盘盈/盘亏），请逐条确认盘点数量后再审核；确认后系统将按当前科室库存更新账面并回写盈亏。</div>
      <el-table :data="qtyMismatchList" border size="small">
        <el-table-column label="耗材" prop="materialName" min-width="150" />
        <el-table-column label="批次号" prop="batchNo" min-width="150" />
        <el-table-column label="明细内库存数量" prop="detailQty" width="140" />
        <el-table-column label="科室账面库存数量" prop="currentQty" width="140" />
        <el-table-column label="盘点数量" min-width="140">
          <template slot-scope="scope">
            <el-input
              v-model="scope.row.adjustedStockQty"
              type="number"
              :disabled="scope.row.confirmed"
              placeholder="请输入盘点数量"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template slot-scope="scope">
            <el-button type="text" @click="confirmMismatchRow(scope.row)">{{ scope.row.confirmed ? '已确定' : '确定' }}</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div slot="footer">
        <el-button @click="qtyMismatchDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="confirmQtyMismatchAndAudit">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { listStocktakingAudit, getStocktakingAudit, auditStocktaking, rejectStocktaking, checkStocktakingQty } from "@/api/department/stocktakingAudit";
import { listInventoryPick } from "@/api/department/depInventory";
import { listStocktakingExportRows } from "@/api/department/stocktaking";
import { exportDeptStocktakingDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "StocktakingAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectDepartment, RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
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
      // 盘点明细表格数据
      stkIoStocktakingEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        stockNo: null,
        departmentId: null,
        stockStatus: null,
        stockType: 502, // 盘点类型：502表示盘点
        beginDate: null,
        endDate: null,
      },
      // 表单参数
      form: {},
      qtyMismatchDialogVisible: false,
      qtyMismatchList: [],
      pendingAuditId: null,
      pendingAuditStockNo: null,
      // 表单校验
      rules: {
        rejectReason: [
          { required: false, message: "驳回原因不能为空", trigger: "blur" }
        ]
      }
    };
  },
  created() {
    this.getList();
  },
  computed: {
    // 单据状态文本显示
    stockStatusText() {
      if (this.form.stockStatus == 1) {
        return '未审核';
      } else if (this.form.stockStatus == 2) {
        return '已审核';
      } else if (this.form.stockStatus == 3) {
        return '已驳回';
      } else {
        return '未审核';
      }
    },
    // 计算总金额（优先主单汇总字段，避免明细未映射时显示 0）
    totalAmountText() {
      const head = this.form && this.form.totalAmount;
      if (head != null && head !== '') {
        const n = parseFloat(head);
        if (Number.isFinite(n)) {
          return '￥' + n.toFixed(2);
        }
      }
      let total = 0;
      if (this.stkIoStocktakingEntryList && this.stkIoStocktakingEntryList.length > 0) {
        this.stkIoStocktakingEntryList.forEach(item => {
          const amt = parseFloat(item.amt || 0);
          total += amt;
        });
      }
      return '￥' + total.toFixed(2);
    },
    deptFormCreatorName() {
      const f = this.form || {};
      return f.createUserNickName || f.createBy || '--';
    },
    deptFormCreateTimeText() {
      const f = this.form || {};
      if (!f.createTime) return '--';
      return this.parseTime(f.createTime, '{y}-{m}-{d} {h}:{i}:{s}');
    },
    deptFormAuditorName() {
      const f = this.form || {};
      if (f.stockStatus !== 2) return '--';
      return f.auditUserNickName || f.updateBy || '--';
    },
    deptFormAuditTimeText() {
      const f = this.form || {};
      if (f.stockStatus !== 2) return '--';
      if (f.auditDate) return this.parseTime(f.auditDate, '{y}-{m}-{d} {h}:{i}:{s}');
      if (f.updateTime) return this.parseTime(f.updateTime, '{y}-{m}-{d} {h}:{i}:{s}');
      return '--';
    }
  },
  methods: {
    /** 盘点列表序号 */
    stocktakingListIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },
    /** 列表总金额展示（与科室盘点申请列表一致） */
    formatStocktakingListAmount(val) {
      if (val == null || val === '') return '--';
      const n = parseFloat(val);
      if (!Number.isFinite(n)) return '--';
      return '￥' + n.toFixed(2);
    },
    /** 列表盈亏金额展示（与科室盘点申请列表一致） */
    formatStocktakingListProfitAmount(val) {
      if (val == null || val === '') return '--';
      const n = parseFloat(val);
      if (!Number.isFinite(n)) return '--';
      const prefix = n > 0 ? '+' : '';
      return prefix + '￥' + n.toFixed(2);
    },
    /** 查询盘点列表 */
    getList() {
      this.loading = true;
      this.queryParams.stockType = 502; // 盘点类型：502表示盘点
      listStocktakingAudit(this.queryParams).then(response => {
        this.stocktakingList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.stockStatus = null;
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
      getStocktakingAudit(id).then(response => {
        const data = response && response.data;
        if (!data) {
          this.$modal.msgError('获取盘点单失败');
          return;
        }
        this.form = data;
        this.stkIoStocktakingEntryList = this.normalizeAuditEntries(data.stkIoStocktakingEntryList || []);
        this.open = true;
        this.form.stockType = 502;
        this.title = "查看科室盘点";
        this.$nextTick(() => {
          this.hydrateDeptEntryCurrentInventoryQty();
        });
      });
    },
    normalizeAuditEntries(list) {
      return (list || []).map((row) => {
        if (!row) return row;
        if (row.countedFlag == null || row.countedFlag === '') {
          row.countedFlag = 0;
        } else {
          row.countedFlag = Number(row.countedFlag) === 1 ? 1 : 0;
        }
        return row;
      });
    },
    formatEntryQtyDisplay(row, field) {
      if (!row) return '0';
      const v = row[field];
      if (v == null || v === '') return '0';
      const n = parseFloat(v);
      return Number.isFinite(n) ? String(n) : '0';
    },
    formatEntryCurrentInventoryQty(row) {
      if (!row) return '--';
      if (row._currentInventoryQtyLoading) return '加载中…';
      const v = row._currentInventoryQty;
      if (v == null || v === '') return '--';
      const n = parseFloat(v);
      return Number.isFinite(n) ? String(n) : '--';
    },
    async _fetchAllDeptInventoryPickForView(departmentId) {
      const pageSize = 500;
      const allRows = [];
      const fetchNext = async (pageNum) => {
        const res = await listInventoryPick({
          departmentId,
          pageNum,
          pageSize,
          receiptConfirmStatus: 1
        });
        const rows = (res && res.rows) || [];
        allRows.push(...rows);
        if (rows.length === 0 || rows.length < pageSize) {
          return allRows;
        }
        return fetchNext(pageNum + 1);
      };
      return fetchNext(1);
    },
    async hydrateDeptEntryCurrentInventoryQty() {
      const list = this.stkIoStocktakingEntryList || [];
      list.forEach((row) => {
        if (!row) return;
        this.$set(row, '_currentInventoryQty', null);
        this.$set(row, '_currentInventoryQtyLoading', true);
      });
      const deptId = this.form && this.form.departmentId;
      let invById = null;
      try {
        if (deptId != null && deptId !== '') {
          const invRows = await this._fetchAllDeptInventoryPickForView(deptId);
          invById = new Map();
          (invRows || []).forEach((inv) => {
            if (inv && inv.id != null) {
              invById.set(String(inv.id), inv);
            }
          });
        }
        for (const row of list) {
          if (!row) continue;
          let live = null;
          if (row.depInventoryId) {
            const idStr = String(row.depInventoryId).trim();
            if (invById && invById.has(idStr)) {
              const inv = invById.get(idStr);
              live = inv && inv.qty != null && inv.qty !== '' ? inv.qty : 0;
            } else if (!invById) {
              const idNum = parseInt(idStr, 10);
              if (Number.isFinite(idNum)) {
                try {
                  const res = await listInventoryPick({ id: idNum, pageNum: 1, pageSize: 1 });
                  const pickRows = (res && res.rows) || [];
                  if (pickRows[0] && pickRows[0].qty != null && pickRows[0].qty !== '') {
                    live = pickRows[0].qty;
                  }
                } catch (e) {
                  live = null;
                }
              }
            }
          }
          this.$set(row, '_currentInventoryQty', live);
          this.$set(row, '_currentInventoryQtyLoading', false);
        }
      } catch (e) {
        list.forEach((row) => {
          if (!row) return;
          this.$set(row, '_currentInventoryQty', null);
          this.$set(row, '_currentInventoryQtyLoading', false);
        });
      }
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids[0];
      this.runAuditWithQtyCheck(id, row.stockNo, false);
    },
    /** 批量审核 */
    handleBatchAudit() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据");
        return;
      }
      // 检查选中的数据是否都是未审核状态
      const selectedRows = this.stocktakingList.filter(item => ids.includes(item.id));
      const unAuditedRows = selectedRows.filter(row => row.stockStatus == 1);
      if (unAuditedRows.length === 0) {
        this.$modal.msgError("所选数据中没有未审核的记录");
        return;
      }
      if (unAuditedRows.length < selectedRows.length) {
        this.$modal.msgWarning("部分选中的数据不是未审核状态，将只审核未审核的记录");
      }
      const unAuditedIds = unAuditedRows.map(row => row.id);
      this.$modal.confirm('是否确认审核选中的' + unAuditedIds.length + '条数据项？').then(() => {
        // 批量审核也做数量校验：存在库存不一致的单据需改走单条逐条确认
        const checkTasks = unAuditedRows.map((row) =>
          checkStocktakingQty({ id: row.id }).then((res) => {
            const mismatches = (res && res.data) || [];
            const needManualConfirm = mismatches.length > 0;
            return {
              id: row.id,
              stockNo: row.stockNo,
              needManualConfirm
            };
          })
        );
        return Promise.all(checkTasks);
      }).then((checkResults) => {
        const canAuditIds = (checkResults || []).filter((r) => !r.needManualConfirm).map((r) => r.id);
        const blockedStockNos = (checkResults || []).filter((r) => r.needManualConfirm).map((r) => r.stockNo);
        if (!canAuditIds.length) {
          this.$modal.msgWarning("所选单据均存在需逐条确认的数量差异，请改用单条审核处理。");
          return null;
        }
        const auditTasks = canAuditIds.map((id) => auditStocktaking({ id }));
        return Promise.all(auditTasks).then(() => ({ blockedStockNos, auditedCount: canAuditIds.length }));
      }).then((result) => {
        if (!result) return;
        this.getList();
        if (result.blockedStockNos && result.blockedStockNos.length) {
          this.$modal.msgWarning("已审核" + result.auditedCount + "条；以下单据需单条逐条确认后审核：" + result.blockedStockNos.join("、"));
          return;
        }
        this.$modal.msgSuccess("批量审核成功");
      }).catch(() => {});
    },
    /** 驳回按钮操作 */
    handleReject(row) {
      this.handleView(row);
      // 打开弹窗后，用户可以在弹窗中输入驳回原因并点击驳回按钮
    },
    /** 批量驳回 */
    handleBatchReject() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要驳回的数据");
        return;
      }
      // 检查选中的数据是否都是未审核状态
      const selectedRows = this.stocktakingList.filter(item => ids.includes(item.id));
      const unAuditedRows = selectedRows.filter(row => row.stockStatus == 1);
      if (unAuditedRows.length === 0) {
        this.$modal.msgError("所选数据中没有未审核的记录");
        return;
      }
      if (unAuditedRows.length < selectedRows.length) {
        this.$modal.msgWarning("部分选中的数据不是未审核状态，将只驳回未审核的记录");
      }
      // 批量驳回需要逐个处理，因为需要驳回原因
      this.$modal.msgWarning("批量驳回功能需要逐个输入驳回原因，请使用单条驳回功能");
    },
    /** 审核提交 */
    handleAuditSubmit() {
      const id = this.form.id;
      if (!id) {
        this.$modal.msgError("数据异常，无法审核");
        return;
      }
      this.runAuditWithQtyCheck(id, this.form.stockNo, true);
    },
    runAuditWithQtyCheck(id, stockNo, closeOnSuccess) {
      this.$modal.confirm('是否确认审核盘点编号为"' + stockNo + '"的数据项？').then(() => {
        return checkStocktakingQty({ id });
      }).then((res) => {
        const rows = (res && res.data) || [];
        if (!rows.length) {
          return auditStocktaking({ id });
        }
        this.pendingAuditId = id;
        this.pendingAuditStockNo = stockNo;
        this.qtyMismatchList = rows.map((r) => ({
          ...r,
          adjustedStockQty: r.stockQty != null ? r.stockQty : r.currentQty,
          confirmed: false
        }));
        this.qtyMismatchDialogVisible = true;
        return null;
      }).then((result) => {
        if (!result) return;
        this.getList();
        if (closeOnSuccess) this.open = false;
        this.$modal.msgSuccess("审核成功");
      }).catch(() => {});
    },
    confirmMismatchRow(row) {
      const v = parseFloat(row.adjustedStockQty);
      if (!Number.isFinite(v) || v < 0) {
        this.$modal.msgWarning('请输入有效的盘点数量');
        return;
      }
      row.adjustedStockQty = v;
      row.confirmed = true;
    },
    confirmQtyMismatchAndAudit() {
      const unconfirmed = (this.qtyMismatchList || []).some((r) => !r.confirmed);
      if (unconfirmed) {
        this.$modal.msgWarning('请先逐条点击“确定”后再提交');
        return;
      }
      const qtyAdjustList = (this.qtyMismatchList || []).map((r) => ({
        entryId: r.entryId,
        stockQty: r.adjustedStockQty
      }));
      auditStocktaking({ id: this.pendingAuditId, qtyAdjustList }).then(() => {
        this.qtyMismatchDialogVisible = false;
        this.qtyMismatchList = [];
        this.getList();
        this.open = false;
        this.$modal.msgSuccess("审核成功");
      });
    },
    /** 驳回提交 */
    handleRejectSubmit() {
      if (!this.form.rejectReason || this.form.rejectReason.trim() === '') {
        this.$modal.msgError("驳回原因不能为空");
        return;
      }
      const id = this.form.id;
      if (!id) {
        this.$modal.msgError("数据异常，无法驳回");
        return;
      }
      this.$modal.confirm('是否确认驳回盘点编号为"' + this.form.stockNo + '"的数据项？').then(() => {
        return rejectStocktaking({ id: id, rejectReason: this.form.rejectReason });
      }).then(() => {
        this.getList();
        this.open = false;
        this.$modal.msgSuccess("驳回成功");
      }).catch(() => {});
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
        stockDate: null,
        departmentId: null,
        stockStatus: null,
        stockType: null,
        createBy: null,
        rejectReason: null,
        remark: null
      };
      this.stkIoStocktakingEntryList = [];
      this.resetForm("form");
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
    /** 盘点明细序号 */
    rowStkIoStocktakingEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 单行导出（与科室盘点申请页同款 xlsx） */
    async handleExportRow(row) {
      this.loading = true;
      try {
        const response = await listStocktakingExportRows({
          stockNo: row.stockNo,
          stockType: this.queryParams.stockType || 502,
        });
        const rows = (response && response.data) || [];
        if (!rows.length) {
          this.$modal.msgWarning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        await exportDeptStocktakingDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `科室盘点明细表_${row.stockNo}_${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$modal.msgError('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    /** 导出：与「库存查询 → 库存明细查询」同款版式 */
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
          fileName: `科室盘点明细表_审核${dateStr}.xlsx`,
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

/* 表单输入框容器样式 */
.form-input-container {
  background: #F5F7FA;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 16px 20px;
  margin-bottom: 16px;
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

/* 搜索区域：与科室申领一致 */
.app-container.stocktaking-audit-page > .el-form.query-form {
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

.app-container.stocktaking-audit-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.stocktaking-audit-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.stocktaking-audit-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-row-second {
  position: relative;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.stocktaking-audit-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}
</style>

<style>
.app-container.stocktaking-audit-page {
  position: relative;
  max-width: 100%;
  overflow-x: hidden;
  box-sizing: border-box;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 8px !important;
}

.app-container.stocktaking-audit-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.stocktaking-audit-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

.app-container.stocktaking-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.stocktaking-audit-page > .el-table th.stocktaking-col-stock-status .cell,
.app-container.stocktaking-audit-page > .el-table td.stocktaking-col-stock-status .cell {
  white-space: nowrap !important;
}
</style>
