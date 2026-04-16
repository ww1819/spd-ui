<template>
  <div class="app-container batch-consume-page" :class="{ 'is-modal-open': open }">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form query-form-compact">

      <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item prop="consumeBillNo" class="query-item-inline">
              <el-input
                v-model="queryParams.consumeBillNo"
                placeholder="单号"
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
            <el-form-item prop="consumeBillStatus" class="query-item-inline">
              <el-select v-model="queryParams.consumeBillStatus" placeholder="单据状态"
                         :disabled="false"
                         clearable
                         style="width: 180px">
                <el-option v-for="dict in dict.type.biz_status.filter(item => item.value == '1' || item.value == '2' || item.value == 1 || item.value == 2)"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
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
          size="medium"
          @click="handleAdd"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="medium"
          @click="handleExport"
          v-hasPermi="['department:batchConsume:export']"
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
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['department:batchConsume:audit']"
        >审核</el-button>
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

    <!-- 主表格组件 -->
    <MainTable
      :loading="loading"
      :table-data="consumeList"
      :query-params="queryParams"
      @selection-change="handleSelectionChange"
      @view="handleView"
      @update="handleUpdate"
      @delete="handleDelete"
    />

    <div class="pagination-bottom-wrap">
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

    <!-- 添加或修改科室批量消耗对话框（布局与样式与 inWarehouse/audit 到货验收「添加入库」弹窗一致） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact modal-form-wrapper">
              <div class="form-fields-container">
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="单号" prop="consumeBillNo">
                      <el-input v-model="form.consumeBillNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="消耗状态" prop="consumeBillStatus">
                      <el-select v-model="form.consumeBillStatus" placeholder="请选择消耗状态"
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
                    <el-form-item label="科室" prop="departmentId">
                      <SelectDepartment v-model="form.departmentId"/>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="消耗日期" prop="consumeBillDate">
                      <el-date-picker clearable
                                      v-model="form.consumeBillDate"
                                      type="date"
                                      style="width: 100%"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      placeholder="请选择消耗日期">
                      </el-date-picker>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="操作人" prop="userId">
                      <SelectUser v-model="form.userId"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <div class="modal-detail-section">
                <el-row :gutter="10" class="detail-toolbar-row">
                  <el-col :span="1.5">
                    <span class="detail-header-title">科室批量消耗明细信息</span>
                  </el-col>
                  <div v-show="action">
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
                    </el-col>
                  <el-col :span="1.5">
                    <el-button
                      type="primary"
                      plain
                      size="medium"
                      @click="openOutRefDialog"
                      v-hasPermi="['department:batchConsume:refOutOrder']"
                    >引用出库单</el-button>
                  </el-col>
                    <el-col :span="1.5">
                      <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteConsumeEntry">删除</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button size="small" @click="cancel">取 消</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm">保 存</el-button>
                    </el-col>
                  </div>
                </el-row>
                <div class="table-wrapper">
                  <el-table
                    :data="deptBatchConsumeEntryList"
                    :row-class-name="rowDeptBatchConsumeEntryIndex"
                    ref="deptBatchConsumeEntry"
                    :height="detailTableHeight"
                    border
                    show-summary
                    :summary-method="getSummaries"
                    @selection-change="handleConsumeEntrySelectionChange"
                  >
                    <el-table-column type="selection" width="55" align="center" fixed="left" resizable />
                    <el-table-column label="序号" align="center" prop="index" width="80" min-width="80" show-overflow-tooltip resizable />
                    <el-table-column label="名称" align="center" prop="material.name" width="200" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="center" prop="material.speci" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="center" prop="material.model" width="150" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unitPrice || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <el-input
                          v-if="action"
                          clearable
                          v-model="scope.row.qty"
                          placeholder="数量"
                          @input="qtyChange(scope.row)"
                        />
                        <span v-else>{{ scope.row.qty || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.amt || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="200" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column v-if="action" label="操作" align="center" width="100" fixed="right">
                      <template slot-scope="scope">
                        <el-button
                          size="small"
                          type="text"
                          icon="el-icon-delete"
                          @click="handleDeleteDetailRow(scope.$index)"
                          style="padding: 0 5px; margin: 0;"
                        >删除</el-button>
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
      :selectedDetails="deptBatchConsumeEntryList"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectDepInventory>

    <el-dialog title="引用出库单明细" :visible.sync="outRefDialogOpen" width="82%" append-to-body>
      <el-form :inline="true" size="small">
        <el-form-item label="出库单号">
          <el-input v-model="outRefQuery.consumeBillNo" placeholder="请输入出库单号" clearable style="width: 220px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" size="small" @click="loadOutRefRows">搜索</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" size="small" @click="addWholeOutBill">整单引用</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" plain size="small" @click="selectAllOutRefBills">全选当前页单号</el-button>
        </el-form-item>
        <el-form-item>
          <el-button size="small" @click="clearOutRefSelection">清空选择</el-button>
        </el-form-item>
      </el-form>
      <el-table ref="outRefTable" :data="outRefRows" @selection-change="handleOutRefSelectionChange" border height="420px">
        <el-table-column type="selection" width="55" />
        <el-table-column label="出库单号" prop="refOutBillNo" width="160" :span-method="outRefBillSpanMethod" />
        <el-table-column label="整单" width="80" :span-method="outRefBillSpanMethod">
          <template slot-scope="scope">
            <el-checkbox
              v-if="isFirstOutRefBillRow(scope.$index)"
              :value="isBillChecked(scope.row.refOutBillNo)"
              @change="toggleBillSelection(scope.row.refOutBillNo, $event)"
            />
          </template>
        </el-table-column>
        <el-table-column label="耗材名称" prop="materialName" width="180" />
        <el-table-column label="规格" prop="materialSpeci" width="130" />
        <el-table-column label="型号" prop="materialModel" width="130" />
        <el-table-column label="库存剩余" prop="availableQty" width="100" />
        <el-table-column label="出库明细数量" prop="outEntryQty" width="120" />
        <el-table-column label="默认消耗数量" prop="defaultConsumeQty" width="120" />
        <el-table-column label="单价" prop="unitPrice" width="100" />
        <el-table-column label="批次号" prop="batchNo" width="140" />
      </el-table>
      <div slot="footer">
        <el-button @click="outRefDialogOpen = false">取 消</el-button>
        <el-button type="primary" @click="confirmOutRef">确 定</el-button>
      </div>
    </el-dialog>

  </div>
</template>

<script>
import { listConsume, getConsume, delConsume, addConsume, updateConsume, auditConsume, outRefEntryList } from "@/api/department/batchConsume";
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectDepInventory from '@/components/SelectModel/SelectDepInventory';
import MainTable from './components/MainTable.vue';

export default {
  name: "BatchConsume",
  dicts: ['biz_status','way_status'],
  components: {
    SelectDepartment,
    SelectUser,
    SelectDepInventory,
    MainTable
  },
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      departmentValue: "",
      outRefDialogOpen: false,
      outRefRows: [],
      outRefSelectedRows: [],
      outRefBillRowSpan: {},
      outRefQuery: {
        consumeBillNo: null,
      },
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedConsumeEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 科室批量消耗表格数据
      consumeList: [],
      selectRow: [],
      // 科室批量消耗明细表格数据
      deptBatchConsumeEntryList: [],
      // 合计数量
      totalQty: 0,
      // 合计金额
      totalAmount: 0,
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
        consumeBillNo: null,
        beginDate: null,
        endDate: null,
        departmentId: null,
        userId: null,
        consumeBillStatus: null,
        orderByColumn: 'create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        departmentId: [
          { required: true, message: "科室不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 明细框高度：与科室申领新增弹窗（dApply）一致 */
    detailTableHeight() {
      return 'max(300px, calc(100vh - 320px))';
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 明细序号（与申领单审核弹窗一致） */
    rowDeptBatchConsumeEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 明细表合计（与申领单审核弹窗一致） */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
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
          let totalQty = 0;
          data.forEach(item => {
            if (item.qty != null && item.qty !== '' && !isNaN(item.qty)) {
              totalQty += parseFloat(item.qty);
            }
          });
          sums[index] = totalQty;
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach(item => {
            if (item.amt != null && item.amt !== '' && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '￥' + totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    /** 查询科室批量消耗列表 */
    getList() {
      this.loading = true;
      listConsume(this.queryParams).then(response => {
        this.consumeList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(error => {
        console.error('查询科室批量消耗列表失败:', error);
        this.consumeList = [];
        this.total = 0;
        this.loading = false;
        this.$modal.msgError('查询失败：' + (error.msg || error.message || '未知错误'));
      });
    },
    nameBtn() {
      if(!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' })
        return
      }
      //打开"弹窗组件" - 显示科室库存明细
      this.DialogComponentShow = true
      this.departmentValue = this.form.departmentId;
    },
    closeDialog() {
      //关闭"弹窗组件"
      this.DialogComponentShow = false
    },
    openOutRefDialog() {
      if (!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' })
        return
      }
      this.outRefDialogOpen = true;
      this.outRefQuery.consumeBillNo = null;
      this.loadOutRefRows();
    },
    loadOutRefRows() {
      outRefEntryList({
        departmentId: this.form.departmentId,
        consumeBillNo: this.outRefQuery.consumeBillNo
      }).then(response => {
        const sourceRows = response.rows || [];
        const filteredRows = this.filterOutRefRows(sourceRows);
        this.outRefRows = filteredRows;
        const filteredCount = sourceRows.length - filteredRows.length;
        if (filteredCount > 0) {
          this.$message({
            type: 'warning',
            message: `已自动过滤 ${filteredCount} 条重复出库明细`
          });
        }
      });
    },
    filterOutRefRows(rows) {
      const existsRefEntryIds = new Set(
        (this.deptBatchConsumeEntryList || [])
          .map(item => item && item.refOutEntryId)
          .filter(v => v !== null && v !== undefined && v !== '')
          .map(v => String(v))
      );
      const filtered = (rows || []).filter(row => {
        const refEntryId = row.refOutEntryId != null ? String(row.refOutEntryId) : '';
        if (refEntryId && existsRefEntryIds.has(refEntryId)) {
          return false;
        }
        return true;
      });
      this.buildOutRefBillRowSpan(filtered);
      return filtered;
    },
    buildOutRefBillRowSpan(rows) {
      this.outRefBillRowSpan = {};
      let i = 0;
      while (i < rows.length) {
        const billNo = rows[i].refOutBillNo || '';
        let j = i + 1;
        while (j < rows.length && (rows[j].refOutBillNo || '') === billNo) {
          j++;
        }
        this.outRefBillRowSpan[i] = j - i;
        for (let k = i + 1; k < j; k++) {
          this.outRefBillRowSpan[k] = 0;
        }
        i = j;
      }
    },
    outRefBillSpanMethod({ rowIndex, columnIndex }) {
      if (columnIndex === 1 || columnIndex === 2) {
        const rowspan = this.outRefBillRowSpan[rowIndex] || 0;
        return { rowspan, colspan: rowspan > 0 ? 1 : 0 };
      }
      return { rowspan: 1, colspan: 1 };
    },
    isFirstOutRefBillRow(index) {
      return (this.outRefBillRowSpan[index] || 0) > 0;
    },
    isBillChecked(billNo) {
      const rows = (this.outRefRows || []).filter(r => (r.refOutBillNo || '') === (billNo || ''));
      if (!rows.length) return false;
      const selectedIds = new Set(
        (this.outRefSelectedRows || [])
          .map(r => r && r.refOutEntryId)
          .filter(v => v !== null && v !== undefined && v !== '')
          .map(v => String(v))
      );
      return rows.every(r => selectedIds.has(String(r.refOutEntryId || '')));
    },
    toggleBillSelection(billNo, checked) {
      const rows = (this.outRefRows || []).filter(r => (r.refOutBillNo || '') === (billNo || ''));
      if (!this.$refs.outRefTable || !rows.length) return;
      rows.forEach(r => {
        this.$refs.outRefTable.toggleRowSelection(r, !!checked);
      });
    },
    handleOutRefSelectionChange(rows) {
      this.outRefSelectedRows = rows || [];
    },
    addWholeOutBill() {
      if (!this.outRefRows || this.outRefRows.length === 0) {
        this.$modal.msgError("当前没有可引用的出库明细");
        return;
      }
      this.selectData(this.outRefRows);
      this.outRefDialogOpen = false;
    },
    selectAllOutRefBills() {
      if (!this.$refs.outRefTable || !this.outRefRows || this.outRefRows.length === 0) {
        return;
      }
      this.outRefRows.forEach(r => {
        this.$refs.outRefTable.toggleRowSelection(r, true);
      });
    },
    clearOutRefSelection() {
      if (this.$refs.outRefTable) {
        this.$refs.outRefTable.clearSelection();
      }
      this.outRefSelectedRows = [];
    },
    confirmOutRef() {
      if (!this.outRefSelectedRows || this.outRefSelectedRows.length === 0) {
        this.$modal.msgError("请先选择要引用的出库明细");
        return;
      }
      this.selectData(this.outRefSelectedRows);
      this.outRefDialogOpen = false;
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据
      this.selectRow = val;
      let skippedCount = 0;

      this.selectRow.forEach((item, index) => {
        const incomingDepInventoryId = item.depInventoryId || item.id || null;
        const incomingRefOutEntryId = item.refOutEntryId || (item.billEntryId != null ? String(item.billEntryId) : null);
        const duplicated = (this.deptBatchConsumeEntryList || []).some(exist => {
          const sameDepInventory = incomingDepInventoryId && exist.depInventoryId && String(exist.depInventoryId) === String(incomingDepInventoryId);
          const sameRefOutEntry = incomingRefOutEntryId && exist.refOutEntryId && String(exist.refOutEntryId) === String(incomingRefOutEntryId);
          return sameDepInventory || sameRefOutEntry;
        });
        if (duplicated) {
          skippedCount++;
          return;
        }
        const entry = {
          depInventoryId: item.depInventoryId || item.id || null,
          kcNo: item.kcNo || null,
          materialId: item.materialId || item.material?.id,
          material: item.material || {
            id: item.materialId || null,
            name: item.materialName || '',
            speci: item.materialSpeci || '',
            model: item.materialModel || ''
          },
          batchId: item.batchId || null,
          warehouseId: item.warehouseId || item.warehouse?.id || null,
          departmentId: item.departmentId || item.department?.id || this.form.departmentId || null,
          supplierId: item.supplierId || item.supplier?.id || null,
          factoryId: item.factoryId || item.fdFactory?.factoryId || item.material?.fdFactory?.factoryId || null,
          unitPrice: item.unitPrice || 0,
          qty: item.defaultConsumeQty || item.qty || 0,
          price: item.price || 0,
          amt: item.defaultConsumeQty ? (parseFloat(item.defaultConsumeQty || 0) * parseFloat(item.unitPrice || 0)).toFixed(2) : (item.amt || 0),
          batchNo: item.batchNo || '',
          batchNumer: item.batchNumer || item.materialNo || '',
          materialNo: item.materialNo || '',
          beginTime: item.beginTime || item.materialDate,
          endTime: item.endTime,
          materialDate: item.materialDate || null,
          warehouseDate: item.warehouseDate || null,
          settlementType: item.settlementType || '',
          materialName: item.materialName || item.material?.name || '',
          materialSpeci: item.materialSpeci || item.material?.speci || '',
          materialModel: item.materialModel || item.material?.model || '',
          materialFactoryId: item.materialFactoryId || item.material?.factoryId || item.factoryId || null,
          refOutBillId: item.refOutBillId || (item.billId != null ? String(item.billId) : null),
          refOutBillNo: item.refOutBillNo || item.billNo || null,
          refOutEntryId: item.refOutEntryId || (item.billEntryId != null ? String(item.billEntryId) : null),
          refOutEntryQty: item.outEntryQty || null,
          refOutAvailableQty: item.availableQty || item.qty || null,
          refDefaultConsumeQty: item.defaultConsumeQty || item.qty || null,
          mainBarcode: item.mainBarcode || '',
          subBarcode: item.subBarcode || '',
          remark: ''
        };
        this.deptBatchConsumeEntryList.push(entry);
      });
      if (skippedCount > 0) {
        this.$message({
          type: 'warning',
          message: `已自动过滤 ${skippedCount} 条重复明细`
        });
      }
      this.calculateTotals();
    },
    //当天日期
    getBillDate(){
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
        consumeBillDate: null,
        departmentId: null,
        userId: null,
        consumeBillStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.deptBatchConsumeEntryList = [];
      this.calculateTotals();
      this.resetForm("form");
    },
    //计算合计数量和金额
    calculateTotals() {
      let totalQty = 0;
      let totalAmount = 0;
      
      this.deptBatchConsumeEntryList.forEach(item => {
        if (item.qty && !isNaN(item.qty)) {
          totalQty += parseFloat(item.qty);
        }
        if (item.amt && !isNaN(item.amt)) {
          totalAmount += parseFloat(item.amt);
        }
      });
      
      this.totalQty = totalQty;
      this.totalAmount = totalAmount;
    },
    
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = parseFloat(row.qty) * parseFloat(row.unitPrice);
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
      this.calculateTotals();
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
      getConsume(id).then(response => {
        this.form = response.data;
        this.deptBatchConsumeEntryList = response.data.deptBatchConsumeEntryList || [];
        this.open = true;
        this.calculateTotals();
        this.action = false;

        if(response.data.consumeBillStatus == 1){
          this.form.consumeBillStatus = '1';
        }else{
          this.form.consumeBillStatus = '2';
        }

        this.title = "查看科室批量消耗";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.consumeBillStatus = '1';
      this.form.consumeBillDate = this.getBillDate();
      this.title = "添加科室批量消耗";
      this.action = true;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getConsume(id).then(response => {
        this.form = response.data;
        this.deptBatchConsumeEntryList = response.data.deptBatchConsumeEntryList || [];
        this.open = true;
        this.calculateTotals();
        this.action = true;
        this.form.consumeBillStatus = '1';
        this.title = "修改科室批量消耗";
      });
    },
    /** 提交按钮 */
    submitForm() {
      // 验证科室是否选择
      if (!this.form.departmentId) {
        this.$modal.msgError("请先选择科室");
        return;
      }
      
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.deptBatchConsumeEntryList = this.deptBatchConsumeEntryList;
          var totalAmt = 0;
          this.deptBatchConsumeEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          this.form.totalAmount = totalAmt.toFixed(2);
          if (this.form.id != null) {
            updateConsume(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "修改成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              this.getList();
            });
          } else {
            addConsume(this.form).then(response => {
              this.$modal.msgSuccess((response && response.msg) || "新增成功");
              const filteredCount = Number(response && response.data && response.data.dedupFilteredCount) || 0;
              if (filteredCount > 0) this.$message.warning(`后台已自动过滤 ${filteredCount} 条重复明细`);
              if (response && response.data) {
                if (response.data.id) {
                  this.form.id = response.data.id;
                }
                if (response.data.consumeBillNo) {
                  this.form.consumeBillNo = response.data.consumeBillNo;
                }
                this.title = "修改科室批量消耗";
              }
              this.getList();
            }).catch(error => {
              console.error("新增失败:", error);
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      const billNo = row.consumeBillNo || '';
      this.$modal.confirm('是否确认删除消耗单，单号"' + billNo + '"的数据项？').then(function() {
        return delConsume(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 科室批量消耗明细删除按钮操作 */
    handleDeleteConsumeEntry() {
      if (this.checkedConsumeEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的科室批量消耗明细数据");
      } else {
        const consumeEntryList = this.deptBatchConsumeEntryList;
        const checkedConsumeEntry = this.checkedConsumeEntry;
        this.deptBatchConsumeEntryList = consumeEntryList.filter(function(item) {
          return checkedConsumeEntry.indexOf(item.index) == -1
        });
        this.calculateTotals();
      }
    },
    /** 删除明细行 */
    handleDeleteDetailRow(index) {
      this.deptBatchConsumeEntryList.splice(index, 1);
      this.calculateTotals();
    },
    /** 复选框选中数据 */
    handleConsumeEntrySelectionChange(selection) {
      this.checkedConsumeEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/batchConsume/export', {
        ...this.queryParams
      }, `batchConsume_${new Date().getTime()}.xlsx`)
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据");
        return;
      }
      
      // 检查选中的数据是否都是未审核状态
      const selectedRows = this.consumeList.filter(item => this.ids.includes(item.id));
      const unreviewedRows = selectedRows.filter(row => row.consumeBillStatus == 1 || row.consumeBillStatus == '1');
      
      if (unreviewedRows.length === 0) {
        this.$modal.msgError("选中的数据中没有未审核的记录");
        return;
      }
      
      if (unreviewedRows.length < selectedRows.length) {
        this.$modal.confirm('选中的数据中包含已审核的记录，是否只审核未审核的记录？').then(() => {
          this.doBatchAudit(unreviewedRows.map(row => row.id));
        }).catch(() => {});
      } else {
        this.$modal.confirm('确认审核选中的 ' + unreviewedRows.length + ' 条数据？').then(() => {
          this.doBatchAudit(unreviewedRows.map(row => row.id));
        }).catch(() => {});
      }
    },
    /** 执行批量审核 */
    doBatchAudit(ids) {
      const auditBy = this.$store.state.user.userName || this.$store.state.user.nickName || 'admin';
      let successCount = 0;
      let failCount = 0;
      
      // 循环调用审核接口
      const auditPromises = ids.map(id => {
        return auditConsume({ id: id.toString(), auditBy: auditBy }).then(() => {
          successCount++;
        }).catch(() => {
          failCount++;
        });
      });
      
      Promise.all(auditPromises).then(() => {
        if (successCount > 0) {
          this.$modal.msgSuccess(`成功审核 ${successCount} 条数据${failCount > 0 ? '，失败 ' + failCount + ' 条' : ''}`);
          this.getList();
        } else {
          this.$modal.msgError('审核失败');
        }
      });
    }
  }
};
</script>

<style scoped>
/* ========= 内部弹窗：与科室申领 dApply 一致（不用 95vh，避免明细下大块留白） ========= */
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
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow-x: hidden;
  overflow-y: hidden;
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
  min-height: 0;
  overflow: hidden;
  padding: 6px 20px 12px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

.local-modal-content .el-form.modal-form-wrapper {
  padding: 6px 20px 12px;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
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

.detail-header-title {
  font-weight: 500;
}

.local-modal-content .modal-detail-section .table-wrapper {
  /* 直接照抄申领单审核（dApplyAudit）：外层不出纵向滚动条，仅表体滚动 */
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  overflow: hidden;
  margin-top: 0;
  padding-bottom: 4px;
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

.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
  margin-bottom: 0;
  box-shadow: none;
}

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
  padding-bottom: 0;
  box-sizing: border-box;
  overflow-y: auto !important;
  overflow-x: auto !important;
  scrollbar-width: thin;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.25);
  border-radius: 4px;
}

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
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

::v-deep .local-modal-content:not(.template-dialog-content) {
  min-height: 0 !important;
  max-height: 100% !important;
  height: 100% !important;
}

::v-deep .local-modal-content .el-table .el-table__body-wrapper {
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.25) rgba(0, 0, 0, 0.06);
}

/* 防止表格列自动换行（与科室申领弹窗一致） */
::v-deep .local-modal-content .modal-detail-section .table-wrapper .el-table .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .modal-detail-section .table-wrapper .el-table .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
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

/* 表格样式优化（与科室申领 dApply scoped 一致） */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #EBEEF5 !important;
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

/* 搜索区域：与科室申领一致 */
.app-container.batch-consume-page > .el-form.query-form {
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

.app-container.batch-consume-page > .el-form.query-form .el-row {
  margin-bottom: 8px;
}

.app-container.batch-consume-page > .el-form.query-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container.batch-consume-page > .el-form.query-form .el-form-item {
  margin-bottom: 0;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-left .query-item-inline .el-select {
  width: 180px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-row-second {
  position: relative;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container.batch-consume-page > .el-form.query-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.mb8 {
  margin-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 列表主表：固定列与滚动条（仅主列表，不影响弹窗内表） */
::v-deep .batch-consume-page > .el-table .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

::v-deep .batch-consume-page > .el-table .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .batch-consume-page > .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
}

::v-deep .batch-consume-page > .el-table .el-table__fixed-right {
  right: 0 !important;
  z-index: 12 !important;
}

::v-deep .batch-consume-page > .el-table .el-table__fixed-header-wrapper {
  z-index: 11;
}

::v-deep .batch-consume-page > .el-table .el-table__fixed-right-patch {
  right: 0 !important;
  z-index: 12 !important;
}

::v-deep .batch-consume-page > .el-table .el-table__fixed-right .el-table__header-wrapper {
  z-index: 12 !important;
}

::v-deep .batch-consume-page > .el-table .el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}

::v-deep .batch-consume-page > .el-table .el-table__fixed {
  position: absolute !important;
}

::v-deep .batch-consume-page > .el-table .el-table__fixed-right {
  position: absolute !important;
  right: 0 !important;
}

::v-deep .batch-consume-page > .el-table {
  overflow-x: auto;
}
</style>

<style>
/* 与到货验收 inWarehouse-audit-page 页边距、遮罩外扩一致 */
.app-container.batch-consume-page {
  position: relative;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 8px !important;
}

.app-container.batch-consume-page > .el-form.query-form-compact {
  margin-top: -12px !important;
}

.app-container.batch-consume-page > .el-row.button-row-compact {
  margin-top: -8px !important;
  padding-top: 0 !important;
  margin-bottom: 8px !important;
}

/* 弹窗打开时，隐藏底层分页区域，避免透出“蓝色条” */
.app-container.batch-consume-page.is-modal-open .pagination-bottom-wrap {
  display: none;
}

.app-container.batch-consume-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

/* 主列表表头与到货验收一致 */
.app-container.batch-consume-page > .el-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600 !important;
  font-size: 15px !important;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.app-container.batch-consume-page > .el-table th .cell {
  font-weight: 600 !important;
  font-size: 15px !important;
}

/* 弹窗明细：名称/规格/型号/生产厂家最多两行（与到货验收一致） */
.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table tbody td {
  vertical-align: middle;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .cell {
  vertical-align: top;
  text-align: left;
  white-space: normal;
  word-break: break-word;
  padding: 8px 10px 8px 12px;
}

.app-container.batch-consume-page .local-modal-content .modal-detail-section .el-table td.detail-col-text-wrap .detail-text-cell-2line {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-word;
  line-height: 1.45;
  max-height: calc(1.45em * 2 + 2px);
}
</style>
