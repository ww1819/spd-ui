<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="业务单号" prop="stockNo" class="query-item-inline">
              <el-input v-model="queryParams.stockNo"
                        placeholder="请输入业务单号"
                        clearable
                        style="width: 180px"
                        @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="科室" prop="departmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.departmentId" />
              </div>
            </el-form-item>
            <el-form-item label="状态" prop="stockStatus" class="query-item-inline">
              <el-select v-model="queryParams.stockStatus" placeholder="全部"
                         clearable
                         style="width: 180px">
                <el-option label="全部" :value="null" />
                <el-option label="未审核" :value="1" />
                <el-option label="已审核" :value="2" />
              </el-select>
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
        </el-row>

      </el-form>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['department:stocktakingAudit:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-check"
          size="small"
          @click="handleBatchAudit"
          v-hasPermi="['department:stocktakingAudit:audit']"
        >审核</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          icon="el-icon-close"
          size="small"
          @click="handleBatchReject"
          v-hasPermi="['department:stocktakingAudit:reject']"
        >驳回</el-button>
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

    <el-table v-loading="loading" :data="stocktakingList" :row-class-name="stocktakingListIndex" @selection-change="handleSelectionChange" height="58vh" border>
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
      <el-table-column label="盘点日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="stockStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" prop="creater.nickName" width="120" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="240" fixed="right">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              icon="el-icon-view"
              @click="handleView(scope.row)"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-check"
              @click="handleAudit(scope.row)"
              v-hasPermi="['department:stocktakingAudit:audit']"
              v-if="scope.row.stockStatus == 1"
              style="padding: 0 5px; margin: 0; color: #67C23A;"
            >审核</el-button>
            <el-button
              size="small"
              type="text"
              icon="el-icon-close"
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
                  <el-col :span="4">
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
                  <el-col :span="4">
                    <el-form-item label="科室" prop="departmentId" label-width="80px">
                      <SelectDepartment v-model="form.departmentId" :disabled="true"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="操作人" prop="createBy" label-width="100px">
                      <el-input v-model="form.createBy" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
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
                        placeholder="请输入驳回原因（驳回时必填）" 
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
                <el-table-column label="库存数量" prop="qty" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.qty || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="盘点数量" prop="stockQty" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.stockQty || '--' }}</span>
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

  </div>
</template>

<script>
import { listStocktakingAudit, getStocktakingAudit, auditStocktaking, rejectStocktaking } from "@/api/department/stocktakingAudit";
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
    }
  },
  methods: {
    /** 盘点列表序号 */
    stocktakingListIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
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
        this.form = response.data;
        this.stkIoStocktakingEntryList = response.data.stkIoStocktakingEntryList || [];
        this.open = true;
        this.form.stockType = 502;
        this.title = "查看科室盘点";
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids[0];
      this.$modal.confirm('是否确认审核盘点编号为"' + row.stockNo + '"的数据项？').then(() => {
        return auditStocktaking({ id: id });
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功");
      }).catch(() => {});
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
        // 逐个审核
        const promises = unAuditedIds.map(id => auditStocktaking({ id: id }));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
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
      this.$modal.confirm('是否确认审核盘点编号为"' + this.form.stockNo + '"的数据项？').then(() => {
        return auditStocktaking({ id: id });
      }).then(() => {
        this.getList();
        this.open = false;
        this.$modal.msgSuccess("审核成功");
      }).catch(() => {});
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
    /** 盘点明细序号 */
    rowStkIoStocktakingEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/stocktaking/export', {
        ...this.queryParams
      }, `dept_stocktaking_audit_${new Date().getTime()}.xlsx`)
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

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
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

.app-container > .el-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container > .el-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}
</style>
