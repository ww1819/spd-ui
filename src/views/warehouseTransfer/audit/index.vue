<template>
  <div class="app-container list-page warehouseTransfer-audit-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="调拨单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.fromWarehouseId" placeholder="调出仓库" :excludeWarehouseType="['高值', '设备']" clearable />
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.toWarehouseId" placeholder="调入仓库" :excludeWarehouseType="['高值', '设备']" clearable />
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
              <el-radio-group v-model="queryParams.dateQueryType" size="small" class="apply-date-type-group">
                <el-radio-button label="bill">制单日期</el-radio-button>
                <el-radio-button label="audit">审核日期</el-radio-button>
              </el-radio-group>
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
            <el-form-item prop="billStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.billStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                           v-if="dict.label !== '待审核'"
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
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['warehouseTransfer:apply:audit']"
        >审核</el-button>
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
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" :selectable="selectableAuditRow" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="调拨单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="调出仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="调入仓库" align="center" prop="toWarehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'toWarehouse.name')" />
      <el-table-column label="金额" align="center" prop="totalAmount" width="150" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount !== null && scope.row.totalAmount !== undefined && scope.row.totalAmount !== ''">
            {{ scope.row.totalAmount | formatCurrency }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrName" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createrName || (scope.row.creater && (scope.row.creater.nickName || scope.row.creater.userName)) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" width="120" min-width="120" class-name="col-bill-status" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" width="120" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" header-align="center" class-name="apply-action-col small-padding fixed-width" width="180">
        <template slot-scope="scope">
          <span style="white-space: nowrap; display: inline-block;">
            <el-button
              size="small"
              type="text"
              @click="handleUpdate(scope.row)"
              v-if="scope.row.billStatus != 2"
              v-hasPermi="['warehouseTransfer:apply:edit']"
              style="padding: 0 5px; margin: 0;"
            >修改</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrint(scope.row,true)"
              v-if="scope.row.billStatus == 2"
              style="padding: 0 5px; margin: 0;"
            >打印</el-button>
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

    <!-- 添加或修改调拨申请对话框 -->
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
            <el-form-item label="调拨单号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="调出仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true" :excludeWarehouseType="['高值', '设备']"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="调入仓库" prop="departmentId">
              <SelectWarehouse v-model="form.departmentId" :disabled="true" :excludeWarehouseType="['高值', '设备']"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单日期" prop="billDate">
              <el-date-picker clearable
                              v-model="form.billDate"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
            style="width: 100%"
                              placeholder="请选择制单日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <el-input :value="createrDisplayName" :disabled="true" placeholder="制单人" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态" prop="billStatus">
              <el-input :value="form.billStatus == 2 || form.billStatus == '2' ? '已审核' : '未审核'" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" :disabled="true" placeholder="备注" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>调拨申请明细信息</span>
          </el-col>
        </el-row>
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummaries"
                  ref="stkIoBillEntry"
            border
                  height="48vh"
        >
          <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
          <el-table-column label="耗材编码" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
            </el-table-column>
          <el-table-column label="耗材名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="150" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.model" width="150" show-overflow-tooltip resizable/>
          <el-table-column label="调拨数量" prop="qty" width="90" show-overflow-tooltip resizable>
              <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
              </template>
            </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
          <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
              <template slot-scope="scope">
              <span>{{ scope.row.unitPrice != null && scope.row.unitPrice !== '' ? formatPrice(scope.row.unitPrice) : '--' }}</span>
              </template>
            </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt != null && scope.row.amt !== '' ? formatAmount(scope.row.amt) : '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" prop="batchNumber" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="beginTime" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期至" align="center" prop="endTime" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" align="center" prop="batchNo" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="供应商" align="center" prop="material.supplier.name" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.remark || '--' }}</span>
            </template>
          </el-table-column>
          </el-table>
        </div>
        </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <transfer-order-print v-if="printRowData" :row="printRowData" ref="receiptOrderPrintRefAuto"></transfer-order-print>
    </div>

  </div>
</template>

<script>
import { listWarehouseTransfer, getWarehouseTransfer, auditWarehouseTransfer } from '@/api/warehouse/warehouseTransfer';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectUser from '@/components/SelectModel/SelectUser';
import TransferOrderPrint from './transferOrderPrint';
import RMBConverter from '@/utils/tools';

export default {
  name: "WarehouseTransferAudit",
  dicts: ['biz_status'],
  components: {SelectWarehouse, SelectUser, TransferOrderPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      selectedRowMap: {},
      selectedRows: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      mainTableHeight: 400,
      // 调拨表格数据
      transferList: [],
      // 调拨明细表格数据
      stkIoBillEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        fromWarehouseId: null,
        toWarehouseId: null,
        billStatus: null,
        sortScene: 'audit',
        dateQueryType: 'bill',
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
      // 打印数据（用于隐藏的打印组件）
      printRowData: null,
      _lastSidebarNavTick: null
    };
  },
  computed: {
    // 制单人显示名称
    createrDisplayName() {
      // 优先使用表单中的制单人信息
      if (this.form.createrName) {
        return this.form.createrName;
      }
      if (this.form.creater && this.form.creater.nickName) {
        return this.form.creater.nickName;
      }
      if (this.form.creater && this.form.creater.userName) {
        return this.form.creater.userName;
      }
      // 如果没有制单人信息，使用当前登录用户
      const user = this.$store.state.user;
      if (user && user.name) {
        return user.name;
      }
      if (user && user.nickName) {
        return user.nickName;
      }
      return '';
    }
  },
  created() {
    this.getList(true);
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  watch: {
    open(val) {
      if (val) {
        this.$nextTick(() => {
          const t = this.$refs.stkIoBillEntry;
          if (t && typeof t.doLayout === 'function') {
            t.doLayout();
          }
        });
      }
    },
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    }
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
      this.resetPageFromSidebar();
    },
    resetPageFromSidebar() {
      this.open = false;
      this.queryParams.pageNum = 1;
      this.getList(true);
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
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(column.property === 'amt'){
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
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    getStatDate(){
      // 获取前5天日期
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5); // 前5天
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year.toString() + "-" + month + "-" + day + " 00:00:00";
      return statDate;
    },
    getEndDate(){
      // 获取当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year.toString() + "-" + month + "-" + day + " 23:59:59";
      return endDate;
    },
    /** 查询调拨列表 */
    getList(restoreSelection) {
      if (this.open && !restoreSelection) {
        return;
      }
      this.loading = true;
      const queryParams = {
        ...this.queryParams
      };
      if (queryParams.endDate && queryParams.endDate.length === 10) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      listWarehouseTransfer(queryParams).then(response => {
        if (response && response.rows) {
          // 映射后端返回的数据到前端字段
          this.transferList = response.rows.map(row => ({
            ...row,
            // 制单人 - 从多个可能的字段获取
            createrName: row.createrName || row.createrNickName || row.createrUserName || 
                        (row.creater && (row.creater.nickName || row.creater.userName)) ||
                        (row.createBy && (row.createBy.nickName || row.createBy.userName)) || '',
            // 总金额 - 从多个可能的字段获取，确保正确映射
            totalAmount: (row.totalAmount !== undefined && row.totalAmount !== null && row.totalAmount !== '') 
                        ? parseFloat(row.totalAmount) 
                        : ((row.total_amount !== undefined && row.total_amount !== null && row.total_amount !== '') 
                          ? parseFloat(row.total_amount) 
                          : null)
          }));
        } else {
          this.transferList = [];
        }
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.updateMainTableHeight();
          if (restoreSelection) {
            this.restoreMainPageSelection();
          }
          this.scheduleApplyLayoutRefresh();
        });
      }).catch(error => {
        console.error('查询调拨列表失败:', error);
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
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
      this.queryParams.dateQueryType = 'bill';
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.handleQuery();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    applyMainRowClassName({ row, rowIndex }) {
      this.transferListIndex({ row, rowIndex });
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
    // 多选框选中数据（跨页缓存 + 行高亮）
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
      this.selectedRows = Object.values(this.selectedRowMap || {});
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
    },
    selectableAuditRow(row) {
      return row.billStatus != 2;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getWarehouseTransfer(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList || [];
        this.open = true;
        this.title = "查看调拨申请";
        // 映射字段
        this.form.createrName = response.data.creater ? (response.data.creater.nickName || response.data.creater.userName) : '';
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
        return auditWarehouseTransfer({id:id,auditBy:auditBy});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核调拨成功！");
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      const rows = this.selectedRows || [];
      const pending = rows.filter(r => r.billStatus != 2);
      if (pending.length === 0) {
        this.$modal.msgWarning(rows.length ? "已选中的单据均为已审核状态，不能再次审核" : "请先选择要审核的数据");
        return;
      }
      const ids = pending.map(r => r.id);
      const auditBy = this.$store.state.user.userId;
      const skipTip = pending.length < rows.length ? "（已跳过" + (rows.length - pending.length) + "条已审核单据）" : "";
      this.$modal.confirm('确定要审核选中的"' + pending.length + '"条待审核数据？' + skipTip).then(() => {
        const promises = ids.map(id => auditWarehouseTransfer({id: id, auditBy: auditBy}));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("批量审核成功！");
      }).catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      const id = row.id || this.ids
      getWarehouseTransfer(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList || [];
        this.open = true;
        this.title = "修改调拨申请";
        // 映射字段
        this.form.createrName = response.data.creater ? (response.data.creater.nickName || response.data.creater.userName) : '';
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {};
      this.stkIoBillEntryList = [];
      this.resetForm("form");
    },
    /** 调拨明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    transferListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      // 直接获取数据并触发打印
      this.getTransferDetail(row).then(res => {
        // 设置打印数据
        this.printRowData = res
        // 等待组件渲染后调用 start()
        this.$nextTick(() => {
          if (this.$refs['receiptOrderPrintRefAuto']) {
            // start() 方法会直接触发浏览器打印对话框
            this.$refs['receiptOrderPrintRefAuto'].start()
          }
        })
      })
    },
    //组装打印信息
    getTransferDetail(row) {
      //查询详情
      return getWarehouseTransfer(row.id).then(response => {
        const details = response.data.stkIoBillEntryList || []
        const data = response.data

        let detailList = [], totalAmt = 0, totalQty = 0

        details && details.forEach(item => {
          const material = item.material || {}
          totalAmt += parseFloat(item.amt || 0)
          totalQty += parseFloat(item.qty || 0)

          detailList.push({
            materialCode: material.code || '',
            materialName: material.name || '',
            materialSpeci: material.speci || '',
            materialModel: material.model || '',
            unitPrice: item.unitPrice || 0,
            qty: item.qty || 0,
            amt: item.amt || 0,
            batchNumber: item.batchNumber || item.batchNo || '',
            periodDate: item.endTime ? this.parseTime(item.endTime, '{y}-{m}-{d}') : '',
            factoryName: (material.fdFactory && material.fdFactory.factoryName) || '',
            supplierName: (material.supplier && material.supplier.name) || ''
          })
        })

        let totalAmtConverter = RMBConverter.numberToChinese(totalAmt);

        // 获取调出仓库名称 - 优先从详情数据获取，其次从列表行数据获取
        let fromWarehouseName = '';
        if (data.warehouse && data.warehouse.name) {
          fromWarehouseName = data.warehouse.name;
        } else if (data.fromWarehouseName) {
          fromWarehouseName = data.fromWarehouseName;
        } else if (row.warehouse && row.warehouse.name) {
          fromWarehouseName = row.warehouse.name;
        } else if (row.fromWarehouseName) {
          fromWarehouseName = row.fromWarehouseName;
        }

        // 获取调入仓库名称 - 优先从详情数据获取，其次从列表行数据获取
        let toWarehouseName = '';
        if (data.toWarehouse && data.toWarehouse.name) {
          toWarehouseName = data.toWarehouse.name;
        } else if (data.toWarehouseName) {
          toWarehouseName = data.toWarehouseName;
        } else if (row.toWarehouse && row.toWarehouse.name) {
          toWarehouseName = row.toWarehouse.name;
        } else if (row.toWarehouseName) {
          toWarehouseName = row.toWarehouseName;
        }

        return {
          billNo: data.billNo || row.billNo,
          fromWarehouseName: fromWarehouseName,
          toWarehouseName: toWarehouseName,
          billDate: data.billDate ? this.parseTime(data.billDate, '{y}-{m}-{d}') : (row.billDate ? this.parseTime(row.billDate, '{y}-{m}-{d}') : ''),
          auditDate: data.auditDate ? this.parseTime(data.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : (row.auditDate ? this.parseTime(row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : ''),
          createrName: (data.creater && (data.creater.nickName || data.creater.userName)) || 
                      (row.creater && (row.creater.nickName || row.creater.userName)) || 
                      row.createrName || '',
          auditPersonName: (data.auditPerson && (data.auditPerson.nickName || data.auditPerson.userName)) || 
                          (row.auditPerson && (row.auditPerson.nickName || row.auditPerson.userName)) || 
                          row.auditPersonName || '',
          totalAmt: this.toMoneyStorage(totalAmt),
          totalQty: totalQty,
          totalAmtConverter: totalAmtConverter,
          detailList: detailList
        }
      })
    }
  }
};
</script>

<style scoped>
.apply-table-panel > .apply-main-table {
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}

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

.list-query-panel .el-form .apply-date-type-group {
  margin-right: 10px;
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

/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: absolute;
  left: -8px;
  right: -8px;
  top: 0;
  bottom: 0;
  width: auto;
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
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  margin-top: 10px;
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

/* 弹窗内表单字段容器样式 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
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

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
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

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 10px;
}

.local-modal-content .el-table {
  height: 48vh;
  max-height: 48vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
  overflow-y: auto;
}
</style>

<style>
/* 与到货验收页面布局样式保持一致（非 scoped 确保生效） */
.app-container.warehouseTransfer-audit-page {
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

.app-container.warehouseTransfer-audit-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

.app-container.warehouseTransfer-audit-page .list-query-panel,
.app-container.warehouseTransfer-audit-page .list-toolbar {
  flex: 0 0 auto;
}

.app-container.warehouseTransfer-audit-page .apply-table-panel {
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

.app-container.warehouseTransfer-audit-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.warehouseTransfer-audit-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.warehouseTransfer-audit-page .apply-pagination-wrap .pagination-container {
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

.app-container.warehouseTransfer-audit-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__header-wrapper th,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.warehouseTransfer-audit-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.warehouseTransfer-audit-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .col-bill-status .cell {
  white-space: nowrap !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table.el-table {
  position: relative;
}

.app-container.warehouseTransfer-audit-page .apply-main-table th.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table td.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table th.el-table-column--selection,
.app-container.warehouseTransfer-audit-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table td.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.warehouseTransfer-audit-page .apply-main-table th.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table th.apply-action-col,
.app-container.warehouseTransfer-audit-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.warehouseTransfer-audit-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr > td,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr:hover > td,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.warehouseTransfer-audit-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}
</style>
