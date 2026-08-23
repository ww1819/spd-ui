<template>
  <div class="app-container list-page gzOrder-follow-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.orderNo"
              placeholder="跟台单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectSupplier v-model="queryParams.supplerId"/>
            </div>
            <div class="query-select-wrapper more-search-select-wrap apply-query-field">
              <SelectWarehouse v-model="queryParams.warehouseId" includeWarehouseType="高值" placeholder="仓库"/>
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
              <el-radio-group v-model="queryParams.timeField" size="small" class="apply-date-type-group">
                <el-radio-button label="createTime">制单日期</el-radio-button>
                <el-radio-button label="auditDate">审核日期</el-radio-button>
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
            <el-form-item prop="orderStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.orderStatus" placeholder="单据状态"
                         clearable class="apply-query-field">
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
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          @click="handleAdd"
          v-hasPermi="['gzOrder:follow:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['gzOrder:follow:export']"
        >导出</el-button>
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          :disabled="multiple"
          @click="handleAudit"
          v-hasPermi="['gzOrder:follow:audit']"
        >审核</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
    <el-table ref="applyMainTable" v-loading="loading" :data="orderList" class="table-compact apply-main-table"
              row-key="id"
              :row-class-name="applyMainRowClassName"
              @selection-change="handleSelectionChange"
              :height="mainTableHeight" border stripe>
      <el-table-column type="selection" width="55" align="center" :reserve-selection="true" class-name="apply-select-col" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="跟台单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'supplier.name')" />
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="200" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'warehouse.name')" />
      <el-table-column label="跟台日期" align="center" prop="orderDate" width="180" show-overflow-tooltip resizable sortable :sort-method="sortByOrderDate">
        <template slot-scope="scope">
          <span>{{ scope.row.orderDate ? parseTime(scope.row.orderDate, '{y}-{m}-{d}') : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作人" align="center" show-overflow-tooltip resizable sortable :sort-method="sortByCreatorName">
        <template slot-scope="scope">
          <span>{{ scope.row.createBy || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="单据状态" align="center" prop="orderStatus" width="120" min-width="120" show-overflow-tooltip resizable sortable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable sortable />
      <el-table-column label="操作" align="center" class-name="apply-action-col small-padding fixed-width" width="200">
        <template slot-scope="scope">
          <template v-if="scope.row.orderStatus == '2' || scope.row.orderStatus == 2">
            <el-button
              size="small"
              type="text"
              @click="handleView(scope.row)"
            >查看</el-button>
            <el-button
              size="small"
              type="text"
              @click="handlePrintBarcode(scope.row)"
            >打印条码</el-button>
          </template>
          <template v-else>
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['gzOrder:follow:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleDelete(scope.row)"
            v-hasPermi="['gzOrder:follow:remove']"
          >删除</el-button>
          </template>
        </template>
      </el-table-column>
    </el-table>

    <div class="apply-pagination-wrap" ref="paginationWrap">
    <pagination
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="handlePagination"
    />
    </div>
    </div>

    <!-- 添加或修改跟台管理对话框（顶栏 + 明细区与到货验收新增弹窗一致） -->
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
                  <el-form-item label="跟台单号" prop="orderNo">
                    <el-input v-model="form.orderNo" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="供应商" prop="supplerId">
                    <SelectSupplier v-model="form.supplerId" :value2="gzOrderEntryList.length > 0"/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId">
                    <SelectWarehouse v-model="form.warehouseId" :value2="gzOrderEntryList.length > 0" includeWarehouseType="高值"/>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="制单人" prop="createBy">
                    <el-input v-model="form.creatorName" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="制单日期" prop="orderDate">
                    <el-date-picker clearable
                                    v-model="form.orderDate"
                                    type="date"
                                    :disabled="true"
                                    value-format="yyyy-MM-dd"
                                    style="width: 140px"
                                    placeholder="请选择制单日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="审核人" prop="auditBy">
                    <el-input v-model="form.auditorName" :disabled="true" style="width: 140px" />
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="8">
                <el-col :span="4">
                  <el-form-item label="UDI码" prop="ztm">
                    <el-input v-model="form.ztm"
                              placeholder="请扫描UDI码"
                              clearable
                              style="width: 140px"
                              @keyup.enter.native="sm"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="辅条码" prop="ftm">
                    <el-input v-model="form.ftm"
                              placeholder="请扫描辅条码"
                              clearable
                              style="width: 140px"
                              @keyup.enter.native="sm2"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="备注" prop="remark">
                    <el-input v-model="form.remark" placeholder="备注" clearable :disabled="!action" />
                  </el-form-item>
                </el-col>
              </el-row>
              </div>

              <div class="modal-detail-section">
              <el-row :gutter="10" type="flex" align="middle" class="detail-toolbar-row">
                <el-col :span="1.5">
                  <span>跟台明细信息</span>
                </el-col>
                <template v-if="action">
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="small" @click="checkMaterialBtn" :disabled="!form.warehouseId || !form.supplerId">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteGzOrderEntry">删除</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
                  </el-col>
                </template>
                <el-col :span="1.5">
                  <el-button size="small" icon="el-icon-document" @click="openEntryChangeLog">变更记录</el-button>
                </el-col>
              </el-row>
              <div class="table-wrapper">
                <el-table :data="pagedGzOrderEntryList" :row-class-name="rowGzOrderEntryIndex"
                          @selection-change="handleGzOrderEntrySelectionChange"
                          ref="gzOrderEntry"
                          border
                          :height="detailTableHeight">
                  <el-table-column type="selection" width="60" align="center" fixed="left" />
                  <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
                  <el-table-column label="耗材" prop="materialName" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      {{ scope.row.materialName }}
                    </template>
                  </el-table-column>
                  <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input clearable v-model="scope.row.qty" placeholder="数量"
                                onkeyup="value=value.replace(/\D/g,'')"
                                onafterpaste="value=value.replace(/\D/g,'')"
                                @blur="form.result=$event.target.value"
                                @input="qtyChange(scope.row)"
                      />
                    </template>
                  </el-table-column>
                  <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable align="right">
                    <template slot-scope="scope">
                      {{ scope.row.price ? formatPrice(scope.row.price) : '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable align="right">
                    <template slot-scope="scope">
                      {{ scope.row.amt || '0.00' }}
                    </template>
                  </el-table-column>
                  <el-table-column label="批号" prop="batchNumber" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.batchNumber" placeholder="批号" />
                    </template>
                  </el-table-column>
                  <el-table-column label="生产日期" prop="beginTime" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-date-picker clearable
                                      v-model="scope.row.beginTime"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :picker-options="pickerBeginTimeOptions"
                                      placeholder="请选择生产日期">
                      </el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column label="有效期" prop="endTime" width="180" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-date-picker clearable
                                      v-model="scope.row.endTime"
                                      type="date"
                                      value-format="yyyy-MM-dd"
                                      :picker-options="pickerEndTimeOptions"
                                      placeholder="请选择有效期">
                      </el-date-picker>
                    </template>
                  </el-table-column>
                  <el-table-column label="UDI码" prop="masterBarcode" width="240" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.masterBarcode" :disabled="true" placeholder="UDI码" />
                    </template>
                  </el-table-column>
                  <el-table-column label="辅条码" prop="secondaryBarcode" width="240" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.secondaryBarcode" :disabled="true" placeholder="辅条码" />
                    </template>
                  </el-table-column>
                  <el-table-column label="批次号" prop="batchNo" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="批次号" />
                    </template>
                  </el-table-column>
                  <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
                    <template slot-scope="scope">
                      <el-input v-model="scope.row.remark" placeholder="备注" />
                    </template>
                  </el-table-column>
                </el-table>
              </div>
                <pagination
                  class="modal-entry-pagination"
                  :total="gzOrderEntryList.length"
                  :page.sync="entryPageNum"
                  :limit.sync="entryPageSize"
                  :hide-on-single-page="false"
                  @pagination="handleEntryPagination"
                />
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectGZMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGZMaterialFilter>

    <el-dialog
      title="明细变更记录"
      :visible.sync="entryChangeLogDialog.visible"
      width="1000px"
    >
      <el-table v-loading="entryChangeLogDialog.loading" :data="entryChangeLogDialog.rows" border size="small" max-height="460">
        <el-table-column label="变更时间" min-width="160" align="center">
          <template slot-scope="scope">
            {{ parseTime(scope.row.changeTime, '{y}-{m}-{d} {h}:{i}:{s}') || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="actionType" label="动作" width="90" align="center" />
        <el-table-column prop="entryId" label="明细ID" width="90" align="center" />
        <el-table-column prop="operator" label="操作人" width="120" align="center" show-overflow-tooltip />
        <el-table-column label="变更前" min-width="260">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.beforeJson) }}</span>
            <el-button v-if="scope.row.beforeJson" type="text" size="mini" @click="showJsonDetail('变更前', scope.row.beforeJson)">查看</el-button>
          </template>
        </el-table-column>
        <el-table-column label="变更后" min-width="260">
          <template slot-scope="scope">
            <span>{{ jsonPreview(scope.row.afterJson) }}</span>
            <el-button v-if="scope.row.afterJson" type="text" size="mini" @click="showJsonDetail('变更后', scope.row.afterJson)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="entryChangeLogDialog.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <el-dialog :title="jsonViewer.title" :visible.sync="jsonViewer.visible" width="860px">
      <pre class="json-viewer-pre">{{ jsonViewer.content }}</pre>
      <span slot="footer" class="dialog-footer">
        <el-button @click="jsonViewer.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

  </div>
</template>

<script>
import { listOrder, getOrder, delOrder, addOrder, updateOrder, auditOrder, listEntryChangeLog } from "@/api/gz/order";
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listMaterial,jxFtm,jxTm} from "@/api/foundation/material";
import { listUserAll } from "@/api/system/user";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectGZMaterialFilter from '@/components/SelectModel/SelectGZMaterialFilter';
import { buildCode128Label, normalizeBarcodePayload } from "@/utils/code128DataUrl";

export default {
  name: "Follow",
  dicts: ['biz_status','bill_type','is_yes_no'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectGZMaterialFilter},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedGzOrderEntry: [],
      // 非单个禁用
      single: true,
      pickerBeginTimeOptions: {
        disabledDate(time) {
          return time.getTime() > Date.now();
        },
      },
      pickerEndTimeOptions: {
        disabledDate(time) {
          return time.getTime() < Date.now();
        },
      },
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      mainTableHeight: 400,
      selectedRowMap: {},
      mainListSelectionTick: 0,
      _lastSidebarNavTick: null,
      // 总条数
      total: 0,
      // 跟台管理表格数据
      orderList: [],
      // 高值退货明细表格数据
      gzOrderEntryList: [],
      /** 弹窗内明细表分页（与到货验收弹窗底部翻页一致展示） */
      entryPageNum: 1,
      entryPageSize: 10,
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
        orderNo: null,
        supplerId: null,
        warehouseId: null,
        orderStatus: null,
        orderType: 401,
        timeField: "createTime",
        auditDate: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 用户列表
      userOptions: [],
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
      },
      entryChangeLogDialog: {
        visible: false,
        loading: false,
        rows: []
      },
      jsonViewer: {
        visible: false,
        title: '',
        content: ''
      }
    };
  },
  computed: {
    /** 明细表占剩余高度但封顶，避免挤掉底部分页与工具栏按钮 */
    detailTableHeight() {
      return "clamp(220px, calc(100vh - 440px), 560px)";
    },
    pagedGzOrderEntryList() {
      const start = (this.entryPageNum - 1) * this.entryPageSize;
      return this.gzOrderEntryList.slice(start, start + this.entryPageSize);
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    orderList() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    'queryParams.pageSize'() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    '$store.state.app.sidebarNavTick'(nav) {
      this.handleSidebarNavTick(nav);
    },
    gzOrderEntryList: {
      handler(list) {
        const len = list ? list.length : 0;
        const maxPage = Math.max(1, Math.ceil(len / this.entryPageSize) || 1);
        if (this.entryPageNum > maxPage) {
          this.entryPageNum = maxPage;
        }
      },
      deep: true
    }
  },
  created() {
    this.getList();
    this.getUserList();
  },
  mounted() {
    window.addEventListener('resize', this.onApplyWindowResize);
    this.scheduleApplyLayoutRefresh();
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onApplyWindowResize);
  },
  methods: {
    onApplyWindowResize() {
      this.updateMainTableHeight();
    },
    scheduleApplyLayoutRefresh() {
      this.$nextTick(() => {
        this.updateMainTableHeight();
        requestAnimationFrame(() => this.updateMainTableHeight());
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
        if (table && table.doLayout) table.doLayout();
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
      if (!path) return '';
      const normalized = String(path).replace(/\\/g, '/');
      if (normalized.length > 1 && normalized.endsWith('/')) return normalized.slice(0, -1);
      return normalized;
    },
    isCurrentPagePath(navPath) {
      return this.normalizeRoutePath(navPath) === this.normalizeRoutePath(this.$route.path);
    },
    handleSidebarNavTick(nav) {
      if (!nav || !this.isCurrentPagePath(nav.path)) return;
      if (nav.tick === this._lastSidebarNavTick) return;
      this._lastSidebarNavTick = nav.tick;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    getApplyMainRowKey(row) {
      return row && row.id != null ? String(row.id) : '';
    },
    restoreMainPageSelection() {
      const table = this.$refs.applyMainTable;
      if (!table || !this.orderList || !this.orderList.length) return;
      const keys = this.selectedRowMap || {};
      if (!Object.keys(keys).length) return;
      this.orderList.forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key && keys[key]) table.toggleRowSelection(row, true);
      });
    },
    applyMainRowClassName({ row, rowIndex }) {
      void this.mainListSelectionTick;
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
      const key = this.getApplyMainRowKey(row);
      if (key && this.selectedRowMap && this.selectedRowMap[key]) return 'apply-row-selected';
      return '';
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return '';
        const keys = path.split('.');
        let v = obj;
        for (const k of keys) v = v && v[k];
        return v != null ? String(v) : '';
      };
      const va = getVal(a);
      const vb = getVal(b);
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByCreatorName(a, b) {
      const va = (a && a.createBy) || '';
      const vb = (b && b.createBy) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    sortByOrderDate(a, b) {
      const va = (a && a.orderDate) || '';
      const vb = (b && b.orderDate) || '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    },
    handlePagination({ page, limit } = {}) {
      if (page != null) {
        this.queryParams.pageNum = page;
      }
      if (limit != null) {
        this.queryParams.pageSize = limit;
      }
      this.getList();
    },
    /** 查询跟台管理列表 */
    sm(){
      const obj=jxTm(this.form.ztm);
      const tmh=obj.ztm;
      const ph=obj.ph;
      const yxq=obj.yxq;
      const ftm=obj.ftm;
      const scrq=obj.scrq;
      const udiinfo={
          "udiNo":this.form.ztm
      }
      listMaterial(udiinfo).then(response => {
        response.rows.forEach((item, index) => {
          let obj = {};
          obj.materialId = item.id;
          obj.materialName = item.name || ""; // 保存耗材名称
          obj.qty = "";
          obj.price = item.price;
          obj.amt = "";
          obj.batchNo = "";
          obj.batchNumber = "";
          obj.beginTime = "";
          obj.endTime = "";
          obj.remark = "";
          obj.masterBarcode = item.udiNo;
          obj.secondaryBarcode = "";
          obj.udiNo = item.udiNo || ""; // 保存UDI码
          obj.supplierId = this.form.supplerId || item.supplierId || (item.supplier && item.supplier.id) || null;
          this.gzOrderEntryList.push(obj);
        });
        this.entryPageNum = Math.max(1, Math.ceil(this.gzOrderEntryList.length / this.entryPageSize));
      });
    }
    ,sm2(){
      const length = this.checkedGzOrderEntry.length
      if (length < 1){
        this.$modal.msgError("请先选择明细数据");
      } else {
        const obj=jxFtm(this.form.ftm);
        for (let i = 0; i < length; i++) {
          const idx = this.checkedGzOrderEntry[i] - 1;
          if (idx >= 0 && idx < this.gzOrderEntryList.length) {
            this.gzOrderEntryList[idx].batchNo = obj.batchNo;
            this.gzOrderEntryList[idx].secondaryBarcode = obj.ftm;
            this.gzOrderEntryList[idx].endTime = obj.yxq;
          }
        }
      }
    }
    ,getList() {
      this.loading = true;
      const params = {
        ...this.normalizeQueryDateTime(this.queryParams),
        orderType: 401
      };
      if (params.orderNo && !String(params.orderNo).toUpperCase().startsWith('GT')) {
        params.orderNo = 'GT' + params.orderNo;
      }
      listOrder(params).then(response => {
        this.orderList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
        this.$nextTick(() => {
          this.restoreMainPageSelection();
          this.scheduleApplyLayoutRefresh();
        });
      }).catch((error) => {
        console.error('查询失败:', error);
        this.orderList = [];
        this.total = 0;
        this.loading = false;
        this.scheduleApplyLayoutRefresh();
        this.$modal.msgError('查询失败：' + (error.message || '未知错误'));
      });
    },
    checkMaterialBtn() {
      if(!this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.supplierValue = this.form.supplerId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听"弹窗组件"返回的数据
      this.selectRow = val;
      this.selectRow.forEach((item, index) => {
        let obj = {};
        obj.materialId = item.id;
        obj.materialName = item.name || ""; // 保存耗材名称
        obj.qty = "1"; // 默认数量为1
        // 设置价格：优先使用item.price
        obj.price = item.price || 0;
        // 自动计算金额：数量 * 价格
        obj.amt = (obj.qty && obj.price) ? this.calcLineAmt(obj.qty, obj.price) : "0.00";
        obj.batchNo = "";
        obj.batchNumber = "";
        obj.beginTime = "";
        obj.endTime = "";
        obj.remark = "";
        obj.masterBarcode = item.udiNo || ""; // UDI码赋值给masterBarcode字段用于显示
        obj.secondaryBarcode = "";
        obj.udiNo = item.udiNo || ""; // 保存UDI码
        this.gzOrderEntryList.push(obj);
      });
      this.entryPageNum = Math.max(1, Math.ceil(this.gzOrderEntryList.length / this.entryPageSize));
    },
    //当天日期
    getOrderDate(){
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
        orderNo: null,
        supplerId: null,
        orderDate: null,
        warehouseId: null,
        orderStatus: null,
        orderType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        auditBy: null,
        updateBy: null,
        updateTime: null,
        remark: null,
        masterBarcode: null,
        secondaryBarcode: null,
        isFollowFlag: null

      };
      this.gzOrderEntryList = [];
      this.entryPageNum = 1;
      this.entryPageSize = 10;
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = this.toMoneyStorage(totalAmt);
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.orderNo = null;
      this.queryParams.supplerId = null;
      this.queryParams.warehouseId = null;
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
      this.queryParams.timeField = 'createTime';
      this.queryParams.orderStatus = null;
      this.queryParams.orderType = 401;
      this.handleQuery();
    },
    normalizeQueryDateTime(query) {
      const params = { ...query };
      params.timeField = params.timeField || "createTime";
      params.beginDate = this.normalizeDateTimeValue(params.beginDate, false);
      params.endDate = this.normalizeDateTimeValue(params.endDate, true);
      return params;
    },
    normalizeDateTimeValue(value, isEnd) {
      if (!value) return value;
      if (typeof value !== "string") return value;
      const trimVal = value.trim();
      if (!trimVal) return trimVal;
      if (trimVal.length === 10 && trimVal.indexOf(" ") === -1) {
        return `${trimVal} ${isEnd ? "23:59:59" : "00:00:00"}`;
      }
      return trimVal;
    },
    resolveBillTypeByOrderType() {
      const orderType = String(this.form.orderType || '401');
      if (orderType === '102') return 'GZ_SHIPMENT';
      if (orderType === '103') return 'GZ_REFUND_DEPOT';
      if (orderType === '104') return 'GZ_REFUND_GOODS';
      return 'GZ_ORDER';
    },
    openEntryChangeLog() {
      if (!this.form.id) {
        this.$modal.msgWarning('请先保存单据后再查看变更记录');
        return;
      }
      this.entryChangeLogDialog.visible = true;
      this.entryChangeLogDialog.loading = true;
      this.entryChangeLogDialog.rows = [];
      listEntryChangeLog(this.resolveBillTypeByOrderType(), this.form.id).then((res) => {
        this.entryChangeLogDialog.rows = res.data || [];
      }).finally(() => {
        this.entryChangeLogDialog.loading = false;
      });
    },
    jsonPreview(jsonText) {
      if (!jsonText) return '--';
      const pretty = this.prettyJson(jsonText);
      return pretty.length > 60 ? `${pretty.slice(0, 60)}...` : pretty;
    },
    prettyJson(jsonText) {
      if (!jsonText) return '';
      try {
        return JSON.stringify(JSON.parse(jsonText), null, 2);
      } catch (e) {
        return String(jsonText);
      }
    },
    showJsonDetail(title, jsonText) {
      this.jsonViewer.title = title;
      this.jsonViewer.content = this.prettyJson(jsonText) || '--';
      this.jsonViewer.visible = true;
    },
    getStatDate(){
      const myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      const year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day + " 00:00:00";
    },
    getEndDate(){
      const myDate = new Date();
      const year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day + " 23:59:59";
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      const pageKeys = (this.orderList || []).map((row) => this.getApplyMainRowKey(row)).filter(Boolean);
      pageKeys.forEach((key) => {
        if (this.selectedRowMap[key]) this.$delete(this.selectedRowMap, key);
      });
      (selection || []).forEach((row) => {
        const key = this.getApplyMainRowKey(row);
        if (key) this.$set(this.selectedRowMap, key, row);
      });
      const ids = Object.keys(this.selectedRowMap || {}).map((key) => {
        const n = Number(key);
        return Number.isNaN(n) ? key : n;
      });
      this.ids = ids;
      this.single = ids.length !== 1;
      this.multiple = !ids.length;
      this.mainListSelectionTick += 1;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getOrder(id).then(response => {
        this.form = response.data;
        this.gzOrderEntryList = response.data.gzOrderEntryList || [];
        // 如果有materialList，为每个entry添加materialName
        if (response.data.materialList && response.data.materialList.length > 0) {
          const materialMap = {};
          response.data.materialList.forEach(material => {
            materialMap[material.id] = material.name;
          });
          this.gzOrderEntryList.forEach(entry => {
            if (entry.materialId && materialMap[entry.materialId]) {
              entry.materialName = materialMap[entry.materialId];
            }
            // 确保masterBarcode有值，优先使用masterBarcode，其次使用udiNo
            if (!entry.masterBarcode && entry.udiNo) {
              entry.masterBarcode = entry.udiNo;
            }
          });
        } else {
          // 即使没有materialList，也要确保masterBarcode有值
          this.gzOrderEntryList.forEach(entry => {
            if (!entry.masterBarcode && entry.udiNo) {
              entry.masterBarcode = entry.udiNo;
        }
          });
        }
        // 设置制单人和审核人姓名
        this.form.creatorName = this.getCreatorName(this.form);
        this.form.auditorName = this.getAuditorName(this.form);
        this.entryPageNum = 1;
        this.open = true;
        this.action = false;
        this.form.orderStatus = '1';
        this.form.orderType = '401'; // 跟台类型
        this.title = "查看跟台管理";
      });
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    resolveSysUserDisplayName(rawKey) {
      if (rawKey === null || rawKey === undefined || rawKey === '') {
        return '';
      }
      const key = String(rawKey).trim();
      const list = this.userOptions || [];
      const isNumericId = /^\d+$/.test(key);
      let user = null;
      if (isNumericId) {
        user = list.find(u => String(u.userId) === key || u.userId == key);
      }
      if (!user) {
        user = list.find(u =>
          String(u.userName) === key ||
          (u.nickName != null && String(u.nickName) === key)
        );
      }
      if (user) {
        return user.nickName || user.userName || key;
      }
      return key;
    },
    /** 获取制单人姓名 */
    getCreatorName(row) {
      if (!row || !row.createBy) {
        return '';
      }
      return this.resolveSysUserDisplayName(row.createBy);
    },
    /** 获取审核人姓名（优先 audit_by，兼容历史数据 update_by） */
    getAuditorName(row) {
      if (!row) {
        return '';
      }
      const auditKey =
        row.auditBy != null && String(row.auditBy).trim() !== '' ? row.auditBy : row.updateBy;
      if (!auditKey) {
        return '';
      }
      return this.resolveSysUserDisplayName(auditKey);
    },
    /** 打印条码按钮操作 */
    handlePrintBarcode(row) {
      const id = row.id;
      getOrder(id).then(response => {
        const orderData = response.data;
        const entryList = orderData.gzOrderEntryList || [];
        const materialList = orderData.materialList || [];
        const warehouseId = orderData.warehouseId;
        
        if (entryList.length === 0) {
          this.$modal.msgWarning("该订单没有明细数据，无法打印条码");
          return;
        }
        
        if (!warehouseId) {
          this.$modal.msgWarning("该订单没有仓库信息，无法打印条码");
          return;
        }
        
        // 构建物料映射
        const materialMap = {};
        materialList.forEach(material => {
          materialMap[material.id] = material;
        });
        
        // 查询库存信息，获取所有院内码
        // 通过订单号过滤，确保只获取该订单生成的库存记录
        const queryParams = {
          warehouseId: warehouseId,
          orderNo: orderData.orderNo, // 添加订单号过滤
          includeZeroQty: true, // 库存为 0 仍可补打条码
          pageNum: 1,
          pageSize: 10000
        };
        
        console.log('查询库存参数:', queryParams);
        
        listDepotInventory(queryParams).then(invResponse => {
          const inventoryList = invResponse.rows || [];
          
          console.log('查询到的库存列表:', inventoryList);
          console.log('订单明细列表:', entryList);
          
          // 构建批次号和物料ID组合键到院内码列表的映射
          // 因为同一个批次号可能对应不同的物料，所以需要同时匹配批次号和物料ID
          const keyToInHospitalCodes = {};
          inventoryList.forEach(inv => {
            if (inv.batchNo && inv.inHospitalCode && inv.materialId) {
              // 使用批次号+物料ID作为键，确保精确匹配
              const key = `${inv.batchNo}_${inv.materialId}`;
              if (!keyToInHospitalCodes[key]) {
                keyToInHospitalCodes[key] = [];
              }
              keyToInHospitalCodes[key].push(inv.inHospitalCode);
            }
          });
          
          console.log('构建的院内码映射:', keyToInHospitalCodes);
          
          // 收集所有需要打印的条码数据
          const allBarcodesToPrint = [];
          entryList.forEach((item, entryIndex) => {
            const material = materialMap[item.materialId] || {};
            const batchNo = item.batchNo;
            const materialId = item.materialId;
            const qty = parseInt(item.qty) || 0;
            
            console.log(`明细项 ${entryIndex + 1}:`, {
              batchNo: batchNo,
              materialId: materialId,
              qty: qty,
              item: item
            });
            
            // 使用批次号+物料ID作为键来获取院内码列表
            const key = `${batchNo}_${materialId}`;
            const inHospitalCodes = keyToInHospitalCodes[key] || [];
            
            console.log(`找到的院内码列表 (${key}):`, inHospitalCodes);
            
            // 根据数量生成条码，如果数量是10则生成10个条码
            const codesToPrint = inHospitalCodes.slice(0, qty);
            
            console.log(`需要打印的院内码数量: ${codesToPrint.length}, 明细数量: ${qty}`);
            
            if (codesToPrint.length === 0) {
              console.warn(`批次号 ${batchNo}, 物料ID ${materialId} 没有找到院内码，跳过打印`);
              this.$modal.msgWarning(`批次号 ${batchNo} 没有找到院内码，无法打印条码`);
              return;
            }
            
            if (codesToPrint.length < qty) {
              console.warn(`批次号 ${batchNo} 只找到 ${codesToPrint.length} 个院内码，但明细数量是 ${qty}`);
              this.$modal.msgWarning(`批次号 ${batchNo} 只找到 ${codesToPrint.length} 个院内码，但需要打印 ${qty} 个条码`);
            }
            
            // 为每个院内码收集打印数据
            codesToPrint.forEach((inHospitalCode, codeIndex) => {
              allBarcodesToPrint.push({
                inHospitalCode: inHospitalCode,
                item: item,
                material: material
              });
            });
          });
          
          console.log(`总共需要打印 ${allBarcodesToPrint.length} 个条码`);
          
          if (allBarcodesToPrint.length === 0) {
            this.$modal.msgWarning("没有找到可打印的条码");
            return;
          }
          
          // 构建单个打印页面，包含所有条码，每个条码占一页
          let printContent = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>打印条码</title>';
          printContent += '<style>';
          printContent += '@page {size: 40mm 60mm;margin: 0;}';
          printContent += '*{margin:0;padding:0;box-sizing:border-box;}';
          printContent += 'body{font-family:"Microsoft YaHei",Arial,SimSun,sans-serif;}';
          printContent += '.barcode-page{width:40mm;height:60mm;max-height:60mm;margin:0;padding:0;box-sizing:border-box;overflow:hidden;background-color:#fff;page-break-after:always;page-break-inside:avoid;break-inside:avoid;}';
          printContent += '.barcode-page:last-child{page-break-after:auto;}';
          printContent += '.container{width:100%;height:100%;max-height:100%;border:none;display:flex;flex-direction:column;align-items:stretch;box-sizing:border-box;background-color:#fff;}';
          printContent += '.title-block{width:100%;min-width:100%;max-width:100%;flex-shrink:0;box-sizing:border-box;align-self:stretch;}';
          printContent += '.title{text-align:center;font-weight:bold;font-size:13px;line-height:1.12;padding:0.35mm 0 0.12mm;border:none;background-color:#fff;flex-shrink:0;}';
          printContent += '.barcode-page .title-line{display:block;width:100%;max-width:100%;height:0;margin:0;padding:0;border:none;border-top:0.75pt solid #000!important;background:none!important;flex-shrink:0;box-sizing:content-box;}';
          printContent += '.content{flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden;background-color:#fff;}';
          printContent += '.main-info{flex:0 0 auto;min-height:0;display:flex;flex-direction:column;overflow:hidden;padding:0 1.4mm;align-items:center;background-color:#fff;}';
          printContent += '.info-table{width:100%;max-width:100%;border-collapse:collapse;table-layout:fixed;}';
          printContent += '.info-table col.col-lab{width:14%;}';
          printContent += '.info-table col.col-val-wide{width:38%;}';
          printContent += '.info-table col.col-val{width:34%;}';
          printContent += '.info-table tr.row-two-pair:not(.row-wrap) .value-cell{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:0;}';
          printContent += '.info-table tr.row-two-pair.row-wrap .value-cell{white-space:normal;overflow:visible;word-break:break-all;overflow-wrap:anywhere;line-height:1.22;max-width:0;}';
          printContent += '.info-table tr:not(.row-two-pair) .label-cell{width:34%;padding-right:2.45mm;}';
          printContent += '.info-table tr:not(.row-two-pair) .value-cell{width:66%;padding-left:2.2mm;white-space:normal;overflow:visible;word-break:break-all;overflow-wrap:anywhere;}';
          printContent += '.info-table td{border:none;padding:0.68mm 0.55mm;font-size:10px;line-height:1.42;vertical-align:top;overflow:visible;}';
          printContent += '.info-table tr.row-two-pair td:nth-child(1){padding-left:0.25mm;}';
          printContent += '.info-table tr.row-two-pair:first-child td:nth-child(2){padding-right:2.45mm;}';
          printContent += '.info-table tr.row-two-pair:nth-child(2) td:nth-child(2){padding-right:0.85mm;}';
          printContent += '.info-table tr.row-two-pair:first-child td:nth-child(3){padding-left:2.35mm;padding-right:0.85mm;}';
          printContent += '.info-table tr.row-two-pair:nth-child(2) td:nth-child(3){padding-left:0.55mm;padding-right:0.85mm;}';
          printContent += '.info-table tr.row-two-pair td:nth-child(4){padding-left:1.55mm;padding-right:0.25mm;}';
          printContent += '.info-table tr.row-two-pair:first-child td{padding-bottom:0.82mm;}';
          printContent += '.info-table tr.row-two-pair:nth-child(2) td{padding-top:0.82mm;}';
          printContent += '.label-cell{width:34%;font-weight:bold;background-color:#f9f9f9;text-align:left;vertical-align:top;padding-left:0.6mm;padding-right:1.35mm;white-space:nowrap;}';
          printContent += '.value-cell{width:66%;text-align:left;vertical-align:top;white-space:normal;overflow:visible;word-break:break-all;overflow-wrap:anywhere;padding-left:1mm;padding-right:0.35mm;}';
          printContent += '.barcode-row{flex-shrink:0;width:100%;max-width:100%;margin:0 auto;text-align:center;padding:0.3mm 0 0;box-sizing:border-box;background-color:#fff;}';
          printContent += '.linear-barcode-svg-wrap{display:block;margin:0 auto;overflow:hidden;background:#fff;}';
          printContent += '.linear-barcode-svg-wrap svg{display:block;width:100%;height:100%;shape-rendering:crispEdges;}';
          printContent += '.linear-barcode-img{display:block;margin:0 auto;border:none!important;outline:none!important;box-shadow:none!important;}';
          printContent += '.barcode-code-text{font-size:9px;line-height:1.2;text-align:center;margin-top:0.3mm;padding:0 0.8mm;color:#000;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}';
          printContent += '.barcode-placeholder{font-size:10px;color:#666;text-align:center;padding:1mm 0;}';
          printContent += '@media print{body{margin:0;padding:0;}@page{margin:0;size:40mm 60mm;}';
          printContent += '.barcode-page{page-break-after:always;}}';
          printContent += '</style>';
          printContent += '</head><body>';
          
          // 为每个条码生成一页
          allBarcodesToPrint.forEach((barcodeData, index) => {
            const { inHospitalCode, item, material } = barcodeData;
            
            printContent += '<div class="barcode-page">';
            printContent += '<div class="container">';
            
            // 标题 + 全宽实线（避免仅用 border-bottom 打印断缺）
            printContent += '<div class="title-block"><div class="title">高值备货码</div><div class="title-line"></div></div>';
            
            // 内容：整表 + 院内码下一行一维码（Code128）
            printContent += '<div class="content">';
            printContent += '<div class="main-info">';
            printContent += '<table class="info-table"><colgroup><col class="col-lab" /><col class="col-val-wide" /><col class="col-lab" /><col class="col-val" /></colgroup>';
            const materialName = item.materialName || material.name || '';
            printContent += '<tr class="row-two-pair row-wrap"><td class="label-cell">品名</td><td class="value-cell">' + materialName + '</td><td class="label-cell">规格</td><td class="value-cell">' + (material.speci || '') + '</td></tr>';
            printContent += '<tr class="row-two-pair"><td class="label-cell">批号</td><td class="value-cell">' + (item.batchNumber || '') + '</td><td class="label-cell">单价</td><td class="value-cell">' + (item.price ? this.formatAmount(item.price) : '') + '</td></tr>';
            printContent += '<tr><td class="label-cell">有效期</td><td class="value-cell" colspan="3">' + (item.endTime || '') + '</td></tr>';
            const factoryName = (material.fdFactory && material.fdFactory.factoryName) ? material.fdFactory.factoryName : '';
            printContent += '<tr><td class="label-cell">厂家</td><td class="value-cell" colspan="3">' + factoryName + '</td></tr>';
            printContent += '</table>';
            printContent += '<div class="barcode-row">';
            if (inHospitalCode) {
              const codeNorm = normalizeBarcodePayload(String(inHospitalCode));
              const label = codeNorm ? buildCode128Label(codeNorm) : { dataUrl: "", svgHtml: "", widthMm: 0, heightMm: 0 };
              if (label.svgHtml) {
                const wMm = label.widthMm;
                const hMm = label.heightMm;
                printContent += '<div class="linear-barcode-svg-wrap" style="width:' + wMm + 'mm;height:' + hMm + 'mm;">' + label.svgHtml + "</div>";
              } else if (label.dataUrl) {
                const linearDataUrl = label.dataUrl;
                const wMm = label.widthMm;
                const hMm = label.heightMm;
                const wPx = label.widthPx;
                const hPx = label.heightPx;
                printContent += '<img src="' + linearDataUrl + '" alt="院内码条码" class="linear-barcode-img" width="' + wPx + '" height="' + hPx + '" style="width:' + wMm + 'mm;height:' + hMm + 'mm;" />';
                const codeEsc = String(codeNorm)
                  .replace(/&/g, "&amp;")
                  .replace(/</g, "&lt;")
                  .replace(/>/g, "&gt;")
                  .replace(/"/g, "&quot;");
                printContent += '<div class="barcode-code-text">' + codeEsc + "</div>";
              } else {
                printContent += '<div class="barcode-placeholder">条码未生成</div>';
              }
            } else {
              printContent += '<div class="barcode-placeholder">无院内码</div>';
            }
            printContent += '</div>';
            printContent += '</div>';
            printContent += '</div>';
            printContent += '</div>'; // container
            printContent += '</div>'; // barcode-page
          });
          
          printContent += '</body></html>';
          
          // 只打开一个打印窗口，包含所有条码
          const printWindow = window.open('', '_blank', 'width=800,height=600');
          if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.onload = function() {
              printWindow.print();
            };
            console.log(`成功打开打印窗口，包含 ${allBarcodesToPrint.length} 个条码`);
            this.$modal.msgSuccess(`成功生成 ${allBarcodesToPrint.length} 个条码，请查看打印预览`);
          } else {
            console.error('打印窗口被浏览器阻止');
            this.$modal.msgError('打印窗口被浏览器阻止，请允许弹窗后重试');
          }
          
          // 统计总共需要打印的条码数量
          let totalBarcodes = 0;
          entryList.forEach((item) => {
            const batchNo = item.batchNo;
            const materialId = item.materialId;
            const qty = parseInt(item.qty) || 0;
            const key = `${batchNo}_${materialId}`;
            const inHospitalCodes = keyToInHospitalCodes[key] || [];
            const codesToPrint = inHospitalCodes.slice(0, qty);
            totalBarcodes += codesToPrint.length;
          });
          
          console.log(`总共需要打印 ${totalBarcodes} 个条码`);
          
          if (totalBarcodes > 0) {
            this.$modal.msgSuccess(`正在生成 ${totalBarcodes} 个条码，请允许浏览器弹窗`);
          } else {
            this.$modal.msgWarning("没有找到可打印的条码");
          }
        }).catch(() => {
          this.$modal.msgError("查询库存信息失败");
        });
      }).catch(() => {
        this.$modal.msgError("获取订单信息失败");
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加跟台管理";
      this.form.orderStatus = '1';
      this.form.orderType = '401'; // 跟台类型，使用401生成GT开头的单号
      const uid = this.$store.getters.userId;
      this.form.createBy = uid != null && uid !== '' ? String(uid) : (this.$store.state.user.name || '');
      this.form.creatorName = this.$store.getters.nickName || this.$store.state.user.name || '--';
      this.form.orderDate = this.getOrderDate();
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getOrder(id).then(response => {
        this.form = response.data;
        this.form.orderStatus = '1';
        this.form.orderType = '401'; // 跟台类型，使用401生成GT开头的单号
        this.gzOrderEntryList = response.data.gzOrderEntryList;
        this.entryPageNum = 1;
        this.open = true;
        this.title = "修改跟台管理";
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzOrderEntryList = this.gzOrderEntryList;
          this.form.gzOrderEntryList = this.form.gzOrderEntryList.map(item => ({
            ...item,
            supplierId: this.form.supplerId || item.supplierId || null,
            warehouseId: this.form.warehouseId || item.warehouseId || null
          }));
          if (this.form.id != null) {
            updateOrder(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addOrder(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除跟台管理编号为"' + ids + '"的数据项？').then(function() {
        return delOrder(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 审核按钮操作 */
    handleAudit() {
      const ids = this.ids;
      if (ids.length === 0) {
        this.$modal.msgError("请先选择要审核的数据项");
        return;
      }
      // 检查选中的订单是否都是未审核状态
      const selectedOrders = this.orderList.filter(item => ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '1' && item.orderStatus !== 1);
      
      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能审核未审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }
      
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');
      this.$modal.confirm('确定要审核选中的 ' + ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        // 批量审核
        const auditPromises = ids.map(id => auditOrder({id: id}));
        
        Promise.all(auditPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + ids.length + " 个订单");
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      }).catch(() => {});
    },
    handleEntryPagination({ page, limit }) {
      if (page != null) this.entryPageNum = page;
      if (limit != null) this.entryPageSize = limit;
    },
	/** 高值退货明细序号（全局序号，便于跨页选择与 sm2 按行更新） */
    rowGzOrderEntryIndex({ row, rowIndex }) {
      const base = (this.entryPageNum - 1) * this.entryPageSize;
      row.index = base + rowIndex + 1;
    },
    /** 高值退货明细添加按钮操作 */
    handleAddGzOrderEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";
      obj.masterBarcode = "";
      obj.secondaryBarcode = "";
      this.gzOrderEntryList.push(obj);
    },
    /** 高值退货明细删除按钮操作 */
    handleDeleteGzOrderEntry() {
      if (this.checkedGzOrderEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        const gzOrderEntryList = this.gzOrderEntryList;
        const checkedGzOrderEntry = this.checkedGzOrderEntry;
        this.gzOrderEntryList = gzOrderEntryList.filter(function(item) {
          return checkedGzOrderEntry.indexOf(item.index) == -1
        });
        this.checkedGzOrderEntry = [];
        this.$nextTick(() => {
          if (this.$refs.gzOrderEntry) {
            this.$refs.gzOrderEntry.clearSelection();
          }
        });
      }
    },
    /** 复选框选中数据 */
    handleGzOrderEntrySelectionChange(selection) {
      this.checkedGzOrderEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = {
        ...this.normalizeQueryDateTime(this.queryParams),
        orderType: 401
      };
      if (params.orderNo && !String(params.orderNo).toUpperCase().startsWith('GT')) {
        params.orderNo = 'GT' + params.orderNo;
      }
      this.download('gz/order/export', {
        ...params
      }, `order_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 确保页面容器有相对定位 */
.app-container {
  position: relative;
}

/* 搜索区域样式 */
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

/* 弹窗内明细表容器：高度由 el-table :height 控制；分页在外层，勿整块滚动 */
.local-modal-content .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  margin-top: 10px;
  padding-bottom: 0;
}

.local-modal-content .modal-detail-section .el-table {
  width: 100%;
}

</style>
<style>
/* 本页主容器：顶部与标签栏留 8px 细缝，左右 8px；纵向 flex 铺满视口 */
.app-container.gzOrder-follow-page {
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

.app-container.gzOrder-follow-page .local-modal-content.apply-modal-root-content {
  position: relative;
  overflow: hidden;
}

/* 弹窗整层加宽：向外扩展抵消本页 container 左右 8px，只动外层遮罩不改表单内部 */
.app-container.gzOrder-follow-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  position: absolute;
}

/* RK-添加明细嵌套层：向右铺满父弹窗，消除右侧 8px 黑缝 */
.app-container.gzOrder-follow-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
  position: absolute;
  left: 0;
  right: -8px;
  top: 0;
  bottom: 0;
  width: auto;
  box-sizing: border-box;
  z-index: 3100;
}

/* RK-添加明细：标题栏与修改入库一致 */
.app-container.gzOrder-follow-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #EBEEF5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.app-container.gzOrder-follow-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}

html body .app-container.gzOrder-follow-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}

.app-container.gzOrder-follow-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

/* RK-添加明细：标题栏下、查询区与按钮行留白（与修改入库一致） */
.app-container.gzOrder-follow-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  padding: 8px 14px !important;
  background: #fff !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.03) !important;
}

/* RK-添加明细：明细框与到货验收主列表 apply-table-panel 完全一致 */
.app-container.gzOrder-follow-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
}

.app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致 */
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .app-container.gzOrder-follow-page .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

/* 明细框与按钮行间距由按钮行 margin-bottom 控制，此处不再负 margin */
.app-container.gzOrder-follow-page .local-modal-content .apply-modal-table-panel > .table-wrapper > .apply-detail-table {
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
  margin-top: 4px !important;
  margin-bottom: 4px !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-modal-table-panel {
  margin-left: 0 !important;
  margin-right: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  border-radius: 0;
  border-left: none;
  border-right: none;
  overflow: visible;
}

.app-container.gzOrder-follow-page .list-query-panel,
.app-container.gzOrder-follow-page .list-toolbar {
  flex: 0 0 auto;
}

/* 主列表搜索区：与到货验收 list-page 完全一致（覆盖 scoped 残留） */
.app-container.gzOrder-follow-page > .form-fields-container.list-query-panel {
  background: #fff !important;
  padding: 12px 14px 14px !important;
  border-radius: 10px !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px rgba(15, 23, 42, 0.04) !important;
  border: 1px solid #e2e8f0 !important;
  width: 100% !important;
  max-width: 100% !important;
  margin-left: 0 !important;
  margin-right: 0 !important;
  margin-bottom: 0 !important;
  box-sizing: border-box !important;
  overflow: visible !important;
}

.app-container.gzOrder-follow-page > .form-fields-container.list-query-panel .el-input__inner,
.app-container.gzOrder-follow-page > .form-fields-container.list-query-panel .el-range-editor.el-input__inner {
  height: 32px !important;
  line-height: 32px !important;
  font-size: 13px !important;
}

.app-container.gzOrder-follow-page .apply-table-panel {
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

.app-container.gzOrder-follow-page .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.app-container.gzOrder-follow-page .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
}

.app-container.gzOrder-follow-page .apply-pagination-wrap .pagination-container {
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

.app-container.gzOrder-follow-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

/* 主列表表头：与耗材产品维护 material-main-table 一致 */
.app-container.gzOrder-follow-page .apply-main-table .el-table__header-wrapper th,
.app-container.gzOrder-follow-page .apply-main-table .el-table__header-wrapper th.el-table__cell,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-header-wrapper th,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right-header-wrapper th,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right-header-wrapper th.el-table__cell {
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

.app-container.gzOrder-follow-page .apply-main-table .el-table__header-wrapper th .cell,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  font-family: inherit !important;
}

.app-container.gzOrder-follow-page .apply-main-table .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.app-container.gzOrder-follow-page .apply-main-table .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.app-container.gzOrder-follow-page .apply-main-table .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.app-container.gzOrder-follow-page .apply-main-table .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

/* 弹窗明细表头：与主列表一致 */
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 主列表表头：全部不换行 */
.app-container.gzOrder-follow-page .apply-main-table thead th .cell,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-header-wrapper th .cell,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right-header-wrapper th .cell {
  white-space: nowrap !important;
}

.app-container.gzOrder-follow-page .apply-main-table th.plan-col-status .cell,
.app-container.gzOrder-follow-page .apply-main-table td.plan-col-status .cell {
  white-space: nowrap !important;
}

/* 序号列表头不换行 */
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table thead th:nth-child(2) .cell {
  white-space: nowrap !important;
}

/* 单位列表头不换行 */
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table thead th:nth-child(7) .cell {
  white-space: nowrap !important;
}

/* 弹窗明细表滚动条：与到货验收主列表一致（横向 12px，固定粗细） */
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 主表滚动条：与耗材产品维护 material-main-table 一致 */
.app-container.gzOrder-follow-page .apply-main-table .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:vertical,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-scrollbar__bar.is-vertical {
  width: 6px !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-scrollbar__thumb {
  min-width: 2px !important;
  min-height: 4px !important;
  width: 2px !important;
  height: 4px !important;
  max-width: 2px !important;
  max-height: 4px !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body-wrapper .el-scrollbar__bar,
.app-container.gzOrder-follow-page .apply-main-table .el-table__fixed-right .el-scrollbar__bar {
  z-index: 13 !important;
  position: relative;
}

/* 明细表勾选列 sticky：与到货验收主列表一致，避免 fixed 列导致表头全选框/行高亮失效 */
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table.el-table {
  position: relative;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table th.el-table-column--selection,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table td.apply-select-col,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table th.apply-select-col,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table th.el-table-column--selection {
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table th.el-table-column--selection .cell,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table th.apply-select-col .cell {
  overflow: visible !important;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table th.el-table-column--selection .el-checkbox,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table td.el-table-column--selection .el-checkbox {
  display: inline-block !important;
  visibility: visible !important;
}

/* 勾选列 / 操作列 sticky：横滑条可铺满并压在两侧列上方 */
.app-container.gzOrder-follow-page .apply-main-table.el-table {
  position: relative;
}

.app-container.gzOrder-follow-page .apply-main-table th.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table td.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table th.el-table-column--selection,
.app-container.gzOrder-follow-page .apply-main-table td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gzOrder-follow-page .apply-main-table td.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table td.el-table-column--selection {
  background-color: #fff !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gzOrder-follow-page .apply-main-table th.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa !important;
}

.app-container.gzOrder-follow-page .apply-main-table th.apply-action-col,
.app-container.gzOrder-follow-page .apply-main-table td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.app-container.gzOrder-follow-page .apply-main-table td.apply-action-col {
  right: 0 !important;
  background-color: #fff !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.gzOrder-follow-page .apply-main-table th.apply-action-col {
  right: var(--apply-v-scrollbar, 0px) !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa !important;
}

/* 主表 / 明细表：行悬停、勾选行高亮（对齐耗材产品维护，无列高亮） */
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr > td,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr > td .cell,
.app-container.gzOrder-follow-page .apply-detail-table .el-table__body tr > td,
.app-container.gzOrder-follow-page .apply-detail-table .el-table__body tr > td .cell {
  transition: none !important;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td .cell,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.apply-select-col,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr:hover > td,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr:hover > td .cell,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr:hover > td.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr:hover > td.el-table-column--selection,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td .cell {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.gzOrder-follow-page .local-modal-content .apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td .cell,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-select-col,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.el-table-column--selection,
.app-container.gzOrder-follow-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.app-container.gzOrder-follow-page .apply-main-table .el-table__header th.gutter {
  position: sticky !important;
  right: 0 !important;
  z-index: 5;
  background-color: #f1f5f9 !important;
  border-bottom-color: #e2e8f0 !important;
}

/*
 * Element UI 2.x：show-summary 无数据时表尾被 v-show 隐藏，滚动条易与合计行错位。
 * 强制显示表尾，横向滚动条固定在表体与合计之间。
 */
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}


.app-container.gzOrder-follow-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.gzOrder-follow-page .apply-main-table td.plan-creator-col .cell {
  white-space: nowrap !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}

.app-container.gzOrder-follow-page .local-modal-mask {
  left: -8px;
  right: -8px;
  width: auto;
  overflow: hidden;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed .el-table__fixed-footer-wrapper,
.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-right .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__footer-wrapper {
  position: relative;
  z-index: 30 !important;
}

.app-container.gzOrder-follow-page .local-modal-content .modal-detail-section .el-table .el-table__fixed-footer-wrapper {
  z-index: 31 !important;
}
</style>
<style>
/* 内部弹窗样式 - 占满整个遮罩层 */
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

/* 查询条件容器框样式 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

.modal-body {
  flex: 1;
  overflow: auto;
  padding: 20px;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
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

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}

/* 搜索区域样式 */
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

.local-modal-content /* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

.json-viewer-pre {
  margin: 0;
  max-height: 520px;
  overflow: auto;
  background: #f5f7fa;
  border: 1px solid #ebeef5;
  padding: 12px;
  font-size: 12px;
  line-height: 1.5;
  white-space: pre-wrap;
  word-break: break-all;
}

/* 表格样式优化（弹窗内表格，勿影响主列表 apply-main-table） */
.local-modal-content .el-table:not(.apply-main-table):not(.apply-detail-table) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 10px;
}

/* 搜索区域：卡片样式由外层 .form-fields-container.list-query-panel 承担，内层 el-form 不再重复包一层 */
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

/* 第一行查询条件左对齐紧凑布局 */
.list-query-panel .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.list-query-panel .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.list-query-panel .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.list-query-panel .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.list-query-panel .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.list-query-panel .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.list-query-panel .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 单据状态对齐到仓库下面 - 使用margin-left对齐到第三个位置 */
/* 计算：入库单号(80px label + 180px input + 16px margin) + 供应商(80px label + 180px input + 16px margin) = 552px */
.list-query-panel .el-form .query-row-left .query-item-aligned {
  margin-left: 552px;
}

/* 按钮对齐到仓库下面 - 按钮没有label，所以对齐到仓库input的开始位置 */
/* 仓库起始位置 552px + label 80px = 632px */
.list-query-panel .el-form .query-row-left .query-button-aligned {
  margin-left: 632px;
  display: inline-block;
}

/* 确保第三行的按钮单独显示 */
.list-query-panel .el-form .query-row-left:last-child {
  min-height: 32px;
}

.list-query-panel .el-form .query-row-left:last-child .el-col {
  flex-wrap: nowrap;
}

/* 第二行：inline 表单下列内强制块级，避免日期区溢出盖住「单据状态」 */
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

.apply-table-panel > .apply-main-table {
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}
</style>
