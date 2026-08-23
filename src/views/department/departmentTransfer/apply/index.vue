<template>
  <div class="app-container list-page departmentTransfer-apply-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.transferBillNo"
              placeholder="单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectDepartment v-model="queryParams.outDepartmentId" field-placeholder="调出科室" />
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectDepartment v-model="queryParams.inDepartmentId" field-placeholder="调入科室" />
            </div>
            <div class="query-actions">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="datetime"
                value-format="yyyy-MM-dd HH:mm:ss"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item prop="transferBillStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.transferBillStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option v-for="dict in dict.type.biz_status.filter(item => item.value == '1' || item.value == '2' || item.value == 1 || item.value == 2)"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          @click="handleAdd"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['departmentTransfer:apply:export']"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="transferList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="单号" align="center" prop="transferBillNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.transferBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调出科室" align="center" prop="outDepartment.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByOutDepartment(a,b)">
        <template slot-scope="scope">
          <span>{{ (scope.row.outDepartment && scope.row.outDepartment.name) || (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="调入科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'department.name')" />
      <el-table-column label="金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount && parseFloat(scope.row.totalAmount) > 0">¥{{ scope.row.totalAmount | formatCurrency }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNmae" width="100" show-overflow-tooltip resizable sortable />
      <el-table-column label="申请状态" align="center" prop="transferBillStatus" width="100" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.transferBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable sortable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="驳回原因" align="center" prop="rejectReason" width="160" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span>{{ scope.row.rejectReason || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
              v-if="scope.row.transferBillStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-hasPermi="['departmentTransfer:apply:edit']"
              v-if="scope.row.transferBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handleDelete(scope.row)"
              v-hasPermi="['departmentTransfer:apply:remove']"
              v-if="scope.row.transferBillStatus != 2"
              style="padding: 0 5px; margin: 0;"
            >删除</el-button>
          </span>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>
    </div>

    <!-- 添加或修改转科申请对话框 -->
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
                    <el-form-item label="单号" prop="transferBillNo">
                      <el-input v-model="form.transferBillNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="转科状态" prop="transferBillStatus">
                      <el-select v-model="form.transferBillStatus" placeholder="请选择转科状态"
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
                    <el-form-item label="调出科室" prop="outDepartmentId" class="transfer-dept-label-item">
                      <SelectDepartment v-model="form.outDepartmentId" :value2="transferDeptSelectDisabled"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="4">
                    <el-form-item label="调入科室" prop="inDepartmentId" class="transfer-dept-label-item">
                      <SelectDepartment v-model="form.inDepartmentId" :value2="transferDeptSelectDisabled"/>
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="8">
                  <el-col :span="4">
                    <el-form-item label="申请日期" prop="transferBillDate">
                      <el-date-picker clearable
                                      v-model="form.transferBillDate"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :disabled="true"
                                      style="width: 100%"
                                      placeholder="请选择申请日期">
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
                    <span>转科申请明细信息</span>
                  </el-col>
                  <div v-show="action">
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-plus" size="small" @click="nameBtn">添加</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteTransferEntry">删除</el-button>
                    </el-col>
                    <el-col :span="1.5">
                      <el-button type="primary" icon="el-icon-check" size="small" @click="submitForm">保 存</el-button>
                    </el-col>
                  </div>
                </el-row>
                <div class="table-wrapper">
              <el-table :data="transferEntryList" :row-class-name="rowTransferEntryIndex"
                        @selection-change="handleTransferEntrySelectionChange" ref="transferEntry"
                        border
                        :summary-method="getSummaries" show-summary
                        :height="detailTableHeight">
                <el-table-column type="selection" width="50" align="center" resizable />
                <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
                <el-table-column label="名称" align="center" prop="material.name" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="型号" align="center" prop="material.model" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unitPrice != null && scope.row.unitPrice !== '' ? formatPrice(scope.row.unitPrice) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="数量" prop="qty" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input clearable v-model="scope.row.qty" placeholder="数量"
                              onkeyup="value=value.replace(/\D/g,'')"
                              onafterpaste="value=value.replace(/\D/g,'')"
                              @blur="form.result=$event.target.value"
                              @input="qtyChange(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="140" show-overflow-tooltip resizable/>
                <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="注册证号" align="center" prop="material.registerNo" width="120" show-overflow-tooltip resizable/>
                <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
                  </template>
                </el-table-column>

                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.remark" placeholder="备注" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="100" fixed="right">
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
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectDepInventory>

  </div>
</template>

<script>
import { listDepartmentTransfer, getDepartmentTransfer, delDepartmentTransfer, addDepartmentTransfer, updateDepartmentTransfer } from "@/api/department/departmentTransfer";
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import { parseTime } from '@/utils/ruoyi';

function buildListDefaultDateRange() {
  const today = new Date();
  const endDate = parseTime(today, '{y}-{m}-{d}') + ' 23:59:59';
  const begin = new Date(today);
  begin.setDate(begin.getDate() - 5);
  const beginDate = parseTime(begin, '{y}-{m}-{d}') + ' 00:00:00';
  return { beginDate, endDate };
}

export default {
  name: "departmentTransfer",
  dicts: ['biz_status','way_status'],
  components: {SelectDepartment,SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      departmentValue: "",
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedTransferEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      // 总条数
      total: 0,
      // 转科申请表格数据
      transferList: [],
      selectRow: [],
      // 转科申请明细表格数据
      transferEntryList: [],
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
        transferBillNo: null,
        ...buildListDefaultDateRange(),
        outDepartmentId: null,
        inDepartmentId: null,
        userId: null,
        transferBillStatus: null,
        orderByColumn: 'create_time',
        isAsc: 'desc',
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        outDepartmentId: [
          { required: true, message: "调出科室不能为空", trigger: "blur" }
        ],
        inDepartmentId: [
          { required: true, message: "调入科室不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    /** 与到货验收「添加入库」弹窗明细表高度一致 */
    detailTableHeight() {
      return 'max(260px, calc(100vh - 368px))';
    },
    /** 已有明细（含已保存的耗材行）时禁止改调出/调入科室；查看模式始终禁用 */
    transferDeptSelectDisabled() {
      if (!this.action) {
        return true;
      }
      const list = this.transferEntryList || [];
      return list.some(row => row && (row.materialId != null || (row.material && row.material.id)));
    }
  },
  created() {
    this.getList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    },
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight();
    },
    scheduleApplyLayoutRefresh() {
      const run = () => this.updateMainTableHeight();
      this.$nextTick(() => {
        run();
        requestAnimationFrame(() => {
          run();
          [50, 120, 300].forEach((ms) => setTimeout(run, ms));
        });
      });
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const next = Math.floor(panelH - pagH);
      const height = Math.max(200, next);
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.doLayout) {
          table.doLayout();
        }
        this.$nextTick(() => {
          this.syncApplyTableSticky();
          requestAnimationFrame(() => this.syncApplyTableSticky());
        });
      });
    },
    syncApplyTableSticky() {
      const table = this.$refs.applyMainTable;
      const root = table && table.$el;
      if (!root) return;
      const bodyWrap = root.querySelector('.el-table__body-wrapper');
      if (!bodyWrap) return;
      const sw = Math.max(0, bodyWrap.offsetWidth - bodyWrap.clientWidth);
      root.style.setProperty('--apply-v-scrollbar', `${sw}px`);
    },
    normalizeRoutePath(path) {
      if (!path) {
        return '';
      }
      const normalized = String(path).replace(/\\/g, '/');
      if (normalized.length > 1 && normalized.endsWith('/')) {
        return normalized.slice(0, -1);
      }
      return normalized;
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path);
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) {
        return;
      }
      if (nav.tick === this._lastSidebarNavTick) {
        return;
      }
      this._lastSidebarNavTick = nav.tick;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) {
          v = v && v[k];
        }
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByOutDepartment(a, b) {
      const getName = (row) => {
        if (!row) return '';
        if (row.outDepartment && row.outDepartment.name) return String(row.outDepartment.name);
        if (row.warehouse && row.warehouse.name) return String(row.warehouse.name);
        return '';
      };
      const va = getName(a);
      const vb = getName(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    applyMainRowClassName({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) {
        return 'apply-row-selected';
      }
      return '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.transferList || !this.transferList.length) {
        return;
      }
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) {
        return;
      }
      this.transferList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) {
          table.toggleRowSelection(row, true);
        }
      });
    },
    /** 查询转科申请列表 */
    getList() {
      this.loading = true;
      const q = { ...this.queryParams };
      const params = {
        ...q,
        warehouseId: q.outDepartmentId,
        departmentId: q.inDepartmentId,
        applyBillNo: q.transferBillNo,
        applyBillStatus: q.transferBillStatus,
        beginDate: q.beginDate,
        endDate: q.endDate
      };
      listDepartmentTransfer(params).then(response => {
        this.transferList = (response.rows || []).map(item => ({
          ...item,
          transferBillNo: item.applyBillNo,
          transferBillStatus: item.applyBillStatus
        }));
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(() => {
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
      });
    },
    nameBtn() {
      if(!this.form.outDepartmentId) {
        this.$message({ message: '请先选择调出科室', type: 'warning' })
        return
      }
      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.departmentValue = this.form.outDepartmentId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
        this.transferEntryList.splice(this.transferEntryList.length, 0, JSON.parse(JSON.stringify(item)));
      });
      this.calculateTotals();
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
        transferBillDate: null,
        outDepartmentId: null,
        inDepartmentId: null,
        userId: null,
        transferBillStatus: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.transferEntryList = [];
      this.calculateTotals();
      this.resetForm("form");
    },
    //计算合计数量和金额
    calculateTotals() {
      let totalQty = 0;
      let totalAmount = 0;
      
      this.transferEntryList.forEach(item => {
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
    // 表格合计方法
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '';
          return;
        }
        if (index === 1) {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'qty') {
          let totalQty = 0;
          data.forEach(item => {
            if (item.qty && !isNaN(item.qty)) {
              totalQty += parseFloat(item.qty);
            }
          });
          sums[index] = totalQty;
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach(item => {
            if (item.amt && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '￥' + this.formatAmount(totalAmount);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
      this.calculateTotals();
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
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
      this.queryParams.transferBillNo = null;
      this.queryParams.outDepartmentId = null;
      this.queryParams.inDepartmentId = null;
      this.queryParams.transferBillStatus = null;
      Object.assign(this.queryParams, buildListDefaultDateRange());
      this.handleQuery();
    },
    // 多选框选中数据（跨页缓存）
    handleSelectionChange(selection) {
      const pageKeys = (this.transferList || [])
        .map((row) => this.getApplyMainRowKey(row))
        .filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key);
        }
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) {
          this.$set(this.selectedRowMap, key, row);
        }
      });
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getDepartmentTransfer(id).then(response => {
        // 字段映射：warehouseId -> outDepartmentId, departmentId -> inDepartmentId
        this.form = {
          ...response.data,
          outDepartmentId: response.data.warehouseId,
          inDepartmentId: response.data.departmentId,
          transferBillNo: response.data.applyBillNo,
          transferBillStatus: response.data.applyBillStatus,
          transferBillDate: response.data.applyBillDate
        };
        this.transferEntryList = response.data.basApplyEntryList || response.data.transferEntryList || [];
        this.open = true;
        this.calculateTotals();
        this.action = false;

        if(response.data.applyBillStatus == 1){
          this.form.transferBillStatus = '1';
        }else{
          this.form.transferBillStatus = '2';
        }

        this.title = "查看转科申请";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.transferBillStatus = '1';
      this.form.transferBillDate = this.getBillDate();
      this.title = "添加转科申请";
      this.action = true;
      var userName = this.$store.state.user.name;
      var userId = this.$store.state.user.userId;
      this.form.createBy = userId;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getDepartmentTransfer(id).then(response => {
        // 字段映射：warehouseId -> outDepartmentId, departmentId -> inDepartmentId
        this.form = {
          ...response.data,
          outDepartmentId: response.data.warehouseId,
          inDepartmentId: response.data.departmentId,
          transferBillNo: response.data.applyBillNo,
          transferBillStatus: response.data.applyBillStatus,
          transferBillDate: response.data.applyBillDate
        };
        this.transferEntryList = response.data.basApplyEntryList || response.data.transferEntryList || [];
        this.open = true;
        this.calculateTotals();
        this.action = true;
        this.form.transferBillStatus = '1';
        this.title = "修改转科申请";
      });
    },
    /** 提交按钮 */
    submitForm() {
      // 验证调出科室是否选择
      if (!this.form.outDepartmentId) {
        this.$modal.msgError("请先选择调出科室");
        return;
      }
      // 验证调入科室是否选择
      if (!this.form.inDepartmentId) {
        this.$modal.msgError("请先选择调入科室");
        return;
      }
      // 验证明细是否添加
      if (!this.transferEntryList || this.transferEntryList.length === 0) {
        this.$modal.msgError("请添加明细！");
        return;
      }
      
      this.$refs["form"].validate(valid => {
        if (valid) {
          // 字段映射：outDepartmentId -> warehouseId, inDepartmentId -> departmentId
          const submitData = {
            ...this.form,
            warehouseId: this.form.outDepartmentId,
            departmentId: this.form.inDepartmentId,
            applyBillNo: this.form.transferBillNo,
            applyBillStatus: this.form.transferBillStatus,
            applyBillDate: this.form.transferBillDate,
            basApplyEntryList: this.transferEntryList
          };
          var totalAmt = 0;
          this.transferEntryList.forEach(item => {
            if(item.amt){
              totalAmt += parseFloat(item.amt);
            }
          });
          submitData.totalAmount = this.toMoneyStorage(totalAmt);
          if (this.form.id != null) {
            updateDepartmentTransfer(submitData).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addDepartmentTransfer(submitData).then(response => {
              this.$modal.msgSuccess("新增成功");
              if (response && response.data) {
                if (response.data.id) {
                  this.form.id = response.data.id;
                }
                if (response.data.applyBillNo) {
                  this.form.transferBillNo = response.data.applyBillNo;
                }
                this.title = "修改转科申请";
              }
              this.open = false;
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
      const billNo = row.transferBillNo || '';
      this.$modal.confirm('你好！是否确认删除转科申请单，单号"' + billNo + '"的数据项？').then(function() {
        return delDepartmentTransfer(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 转科申请明细序号 */
    rowTransferEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 转科申请明细删除按钮操作 */
    handleDeleteTransferEntry() {
      if (this.checkedTransferEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的转科申请明细数据");
      } else {
        const transferEntryList = this.transferEntryList;
        const checkedTransferEntry = this.checkedTransferEntry;
        this.transferEntryList = transferEntryList.filter(function(item) {
          return checkedTransferEntry.indexOf(item.index) == -1
        });
        this.calculateTotals();
      }
    },
    /** 删除明细行 */
    handleDeleteDetailRow(index) {
      this.transferEntryList.splice(index, 1);
      this.calculateTotals();
    },
    /** 复选框选中数据 */
    handleTransferEntrySelectionChange(selection) {
      this.checkedTransferEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      this.download('department/transfer/export', params, `transfer_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗：与到货验收 inWarehouse/audit 弹窗一致 */
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
  flex-shrink: 0;
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
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 12px;
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

.local-modal-content .modal-detail-section .table-wrapper {
  margin-top: 0;
}

.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  /* 仅由表体 .el-table__body-wrapper 承担横向滚动，避免与合计行下方再出现一条重复滚动条 */
  overflow: hidden;
  margin-top: 10px;
  padding-bottom: 4px;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
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

/* 调出/调入科室：标签红色且不显示必填星号（Element 表单项 DOM 在子组件内，需 ::v-deep 穿透 scoped） */
.local-modal-content .transfer-dept-label-item.is-required ::v-deep .el-form-item__label::before,
.local-modal-content .transfer-dept-label-item.is-required ::v-deep .el-form-item__label:before {
  display: none !important;
  content: '' !important;
  margin-right: 0 !important;
}

.local-modal-content .transfer-dept-label-item ::v-deep .el-form-item__label {
  color: #f56c6c !important;
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

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__body-wrapper {
  padding-bottom: 6px;
  box-sizing: border-box;
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

::v-deep .local-modal-content .modal-detail-section .el-table .el-table__cell {
  white-space: nowrap !important;
}

::v-deep .local-modal-content .modal-detail-section .el-table .cell {
  white-space: nowrap !important;
}

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

/* 搜索区域：卡片样式由外层 .form-fields-container.list-query-panel 承担 */
.list-query-panel .el-form {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  background: transparent;
  padding: 0;
  border: none;
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}

.list-query-panel .el-form .el-row {
  margin-bottom: 8px;
}

.list-query-panel .el-form .el-row:last-child {
  margin-bottom: 0;
}

.list-query-panel .el-form .el-form-item {
  margin-bottom: 0;
}

.list-query-panel .el-form .query-row-first {
  margin-bottom: 10px;
}

.list-query-panel .el-form .query-row-first-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.list-query-panel .el-form .apply-query-field,
.list-query-panel .el-form .query-row-first-inner .apply-query-input {
  width: 170px;
  flex-shrink: 0;
}

.list-query-panel .el-form .query-row-first-inner .more-search-select-wrap.apply-query-field > * {
  width: 100%;
}

.list-query-panel .el-form .query-row-second .apply-query-field.el-select {
  width: 170px;
}

.list-query-panel .el-form .query-row-first-inner .query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.list-query-panel .el-form .query-row-first-inner .query-actions .el-button + .el-button {
  margin-left: 0;
}

.list-query-panel .el-form .query-row-second {
  margin-bottom: 0;
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.list-query-panel .el-form .apply-query-date.el-date-editor {
  width: 200px;
}

.list-query-panel .el-form .query-row-second > .el-col > .el-form-item {
  display: block !important;
  width: 100% !important;
  box-sizing: border-box;
  vertical-align: top;
}

.list-query-panel .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) {
  white-space: nowrap;
}

.list-query-panel .el-form .query-row-second .query-date-range-form-item {
  white-space: normal;
}

.list-query-panel .el-form .query-row-second .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
  max-width: 100%;
}

.list-query-panel .el-form .query-row-second .el-form-item:not(.query-date-range-form-item) .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.list-query-panel .el-form .query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
}

.list-query-panel .el-form .query-row-second > .query-row-second-inner > .el-form-item {
  display: inline-flex !important;
  width: auto !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  flex: 0 0 auto;
  vertical-align: middle;
}

.list-query-panel .el-form .query-row-second-inner .query-date-range-form-item .el-form-item__content {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 8px;
}

/* 按钮行样式（仅弹窗内，勿影响主列表 list-toolbar 与搜索区间的全局留白） */
.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-top: 0 !important;
  margin-bottom: 10px !important;
}

</style>



<style>
/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.departmentTransfer-apply-page {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: calc(100vh - 84px);
  height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  overflow: hidden;
  box-sizing: border-box;
  padding-top: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
  padding-bottom: 14px !important;
}


.app-container.departmentTransfer-apply-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
  overflow: hidden;
}



.app-container.departmentTransfer-apply-page .list-query-panel,
.app-container.departmentTransfer-apply-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.departmentTransfer-apply-page .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.app-container.departmentTransfer-apply-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.departmentTransfer-apply-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.departmentTransfer-apply-page .apply-pagination-wrap .pagination-container {
  height: auto !important;
  min-height: 52px;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding: 10px 14px 14px !important;
  background: #fff;
  border: none;
  border-top: 1px solid #eef2f7;
  border-radius: 0 0 10px 10px;
  box-shadow: none;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.app-container.departmentTransfer-apply-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__header-wrapper th,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
  font-family: inherit !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.departmentTransfer-apply-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.departmentTransfer-apply-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.departmentTransfer-apply-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table.el-table {
  position: relative;
}

.app-container.departmentTransfer-apply-page .apply-main-table th.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table td.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table th.el-table-column--selection,
.app-container.departmentTransfer-apply-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table td.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.departmentTransfer-apply-page .apply-main-table th.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table th.apply-action-col,
.app-container.departmentTransfer-apply-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.departmentTransfer-apply-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr > td,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr:hover > td,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.departmentTransfer-apply-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.departmentTransfer-apply-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

.app-container.departmentTransfer-apply-page.is-modal-open .apply-table-panel {
  visibility: hidden;
}

.app-container.departmentTransfer-apply-page .local-modal-content .transfer-dept-label-item.is-required .el-form-item__label::before,
.app-container.departmentTransfer-apply-page .local-modal-content .transfer-dept-label-item.is-required .el-form-item__label:before {
  display: none !important;
  content: none !important;
  margin-right: 0 !important;
}

.app-container.departmentTransfer-apply-page .local-modal-content .transfer-dept-label-item .el-form-item__label {
  color: #f56c6c !important;
}
</style>

.app-container.departmentTransfer-apply-page.is-modal-open .apply-table-panel {
  visibility: hidden;
}

.app-container.departmentTransfer-apply-page .apply-main-table thead th.col-expected-delivery-header .cell {
  white-space: nowrap !important;
}
</style>
