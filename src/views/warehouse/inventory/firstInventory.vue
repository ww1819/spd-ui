<template>
  <div class="app-container list-page first-inventory-page inv-detail-query">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <div class="ctk-query-top-fields">
          <div class="more-search-dynamic-field more-search-field--text">
            <el-input
              v-model="queryParams.supplierKeyword"
              placeholder="供应商编码/名称"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="t === 'warehouse' ? 'more-search-field--select' : 'more-search-field--text'"
          >
            <template v-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse
                  v-model="queryParams.warehouseId"
                  :excludeWarehouseType="['设备', '高值']"
                  placeholder="仓库编码/名称/简码搜索"
                />
              </div>
            </template>
            <el-input
              v-else
              v-model="moreSearchKeywords[t]"
              :placeholder="moreSearchPlaceholderFor(t)"
              clearable
              class="more-search-input more-search-input--dynamic"
              @keyup.enter.native="handleQuery"
            />
          </div>
        </div>
        <!-- 仅用于读写「更多检索」本地默认，界面不展示 -->
        <more-search-bar
          ref="moreSearchBar"
          class="ctk-more-search-bar--hidden"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          :show-picker="false"
          :show-save="false"
          :show-search-actions="false"
          @change="onMoreSearchTypesChange"
        />

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker query-date-end"
              />
            </el-form-item>
            <el-form-item prop="financeCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper more-search-select-wrap inv-category-multi">
                <SelectFinanceCategoryLow
                  v-model="queryParams.financeCategoryIds"
                  :multiple="true"
                  placeholder="财务分类多选"
                />
              </div>
            </el-form-item>
            <el-form-item prop="warehouseCategoryId" class="query-item-inline">
              <div class="query-select-wrapper more-search-select-wrap inv-category-multi">
                <SelectWarehouseCategory v-model="queryParams.warehouseCategoryId" placeholder="库房分类" />
              </div>
            </el-form-item>
            <el-form-item prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="计费"
                         clearable class="more-search-short-select">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
            </el-form-item>
            <el-form-item prop="materialIsUse" class="query-item-inline">
              <el-select v-model="queryParams.materialIsUse" placeholder="产品档案" clearable class="more-search-short-select">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item class="query-item-inline query-item-zero-stock">
              <el-button
                size="small"
                icon="el-icon-box"
                :class="showZeroStock ? 'spd-btn spd-btn--primary' : 'spd-btn spd-btn--secondary'"
                :type="showZeroStock ? 'primary' : 'default'"
                @click="toggleShowZeroStock"
              >零库存</el-button>
            </el-form-item>
            <div class="ctk-query-actions query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="list-toolbar ctk-list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          type="warning"
          size="small"
          class="spd-btn"
          @click="handleExport"
        ><i class="el-icon-download"></i><span>导出</span></el-button>
      </div>
      <div class="list-toolbar-right">
        <div
          class="toolbar-more-search"
          @mouseenter="onToolbarMoreEnter"
          @mouseleave="onToolbarMoreLeave"
        >
          <span class="more-search-label">更多检索</span>
          <el-select
            ref="toolbarMoreSelect"
            v-model="moreSearchTypes"
            multiple
            collapse-tags
            size="small"
            :popper-append-to-body="false"
            placeholder="选择检索条件（可多选）"
            class="more-search-type"
            @change="onMoreSearchTypesChange"
            @visible-change="onToolbarMoreVisibleChange"
          >
            <el-option
              v-for="opt in moreSearchOptions"
              :key="opt.value"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>
        <el-button
          type="success"
          size="small"
          class="spd-btn"
          @click="saveMoreSearchDefaults"
        ><i class="el-icon-check"></i><span>保存查询条件</span></el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        <el-tooltip class="item" effect="dark" content="显隐列" placement="top">
          <el-button size="small" circle icon="el-icon-menu" @click="openColumnDialog" />
        </el-tooltip>
      </div>
    </el-row>

    <!-- 显隐列：挂载在页面内，保存后按当前登录用户持久化 -->
    <el-dialog
      title="显示/隐藏"
      :visible.sync="columnDialogVisible"
      width="640px"
      :append-to-body="false"
      :modal-append-to-body="false"
      :close-on-click-modal="false"
      custom-class="inventory-column-dialog-inpage"
      :show-close="false"
    >
      <el-transfer
        :titles="['显示', '隐藏']"
        v-model="columnHiddenKeys"
        :data="columnTransferData"
        @change="onColumnTransferChange"
      />
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="saveColumnConfig">保 存</el-button>
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="columnDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <div class="table-container" ref="tablePanel">
    <el-table
      ref="invDetailTable"
      class="inv-detail-main-table"
      v-loading="loading"
      :data="inventoryList"
      :row-key="getDetailRowKey"
      :row-class-name="invDetailRowClassName"
      @selection-change="handleSelectionChange"
      @row-dblclick="handleDetailRowDblclick"
      :height="tableHeight"
      border
      stripe
    >
      <el-table-column type="selection" width="55" align="center" header-align="center" class-name="inv-select-col col-serial-center"/>
      <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable v-if="columns[0].visible">
        <template slot-scope="scope">
          <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column key="materialCode" label="产品编码" align="center" prop="material.code" width="150" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode" v-if="columns[1].visible"/>
      <el-table-column key="materialName" label="产品名称" align="center" prop="material.name" width="160" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" v-if="columns[2].visible"/>
      <el-table-column key="speci" label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci" v-if="columns[3].visible">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="model" label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByModel" v-if="columns[4].visible">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="factory" label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="150" show-overflow-tooltip resizable sortable :sort-method="sortByFactory" v-if="columns[5].visible">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="warehouse" label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByWarehouse" v-if="columns[6].visible"/>
      <el-table-column key="supplier" label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable sortable :sort-method="sortBySupplier" v-if="columns[7].visible"/>
      <el-table-column key="unitPrice" label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice" v-if="columns[8].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatPrice }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="unit" label="单位" align="center" width="80" show-overflow-tooltip resizable v-if="columns[9].visible">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || (scope.row.material && scope.row.material.unit && (scope.row.material.unit.unitName || scope.row.material.unit.name)) || (scope.row.material && scope.row.material.unitName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="qty" label="库存数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable v-if="columns[10].visible"/>
      <el-table-column key="amt" label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmt" v-if="columns[11].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="batchNo" label="入库批次号" align="center" prop="batchNo" width="220" resizable v-if="columns[12].visible">
        <template slot-scope="scope">
          <span class="batch-no-text">{{ scope.row.batchNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="materialNo" label="批号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable v-if="columns[13].visible"/>
      <el-table-column label="主条码" align="center" prop="mainBarcode" width="140" show-overflow-tooltip resizable/>
      <el-table-column label="辅条码" align="center" prop="subBarcode" width="140" show-overflow-tooltip resizable/>
      <el-table-column key="beginTime" label="生产日期" align="center" prop="beginTime" width="160" show-overflow-tooltip resizable v-if="columns[14].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column key="endTime" label="有效期" align="center" prop="endTime" width="160" show-overflow-tooltip resizable v-if="columns[15].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column key="registerNo" label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable v-if="columns[16].visible">
        <template slot-scope="scope">
          <span>{{ scope.row.material && scope.row.material.registerNo ? scope.row.material.registerNo : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="periodDate" label="注册证有效期" align="center" prop="material.periodDate" width="180" show-overflow-tooltip resizable v-if="columns[17].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="isBilling" label="计费" align="center" prop="material.isBilling" width="80" show-overflow-tooltip resizable v-if="columns[18].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1 || scope.row.material.isBilling === true || scope.row.material.isBilling === 'true')">是</span>
          <span v-else-if="scope.row.material && (scope.row.material.isBilling === '0' || scope.row.material.isBilling === 0 || scope.row.material.isBilling === '2' || scope.row.material.isBilling === false || scope.row.material.isBilling === 'false')">否</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="materialUseStatus" label="产品档案状态" align="center" width="110" show-overflow-tooltip resizable v-if="columns[24].visible">
        <template slot-scope="scope">
          <span>{{ materialUseDictLabel(scope.row.material && scope.row.material.isUse) }}</span>
        </template>
      </el-table-column>
      <el-table-column key="receiptOrderNo" label="入库单号" align="center" prop="receiptOrderNo" width="180" show-overflow-tooltip resizable v-if="columns[19].visible"/>
      <el-table-column key="createTime" label="制单日期" align="center" prop="createTime" width="160" show-overflow-tooltip resizable v-if="columns[20].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="createrName" label="制单人" align="center" prop="createrName" width="120" show-overflow-tooltip resizable v-if="columns[21].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.createrName">{{ scope.row.createrName }}</span>
          <span v-else-if="scope.row.creater && scope.row.creater.nickName">{{ scope.row.creater.nickName }}</span>
          <span v-else-if="scope.row.creater && scope.row.creater.userName">{{ scope.row.creater.userName }}</span>
          <span v-else-if="scope.row.createBy">{{ scope.row.createBy }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="auditDate" label="审核日期" align="center" prop="auditDate" width="160" show-overflow-tooltip resizable v-if="columns[22].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="auditPersonName" label="审核人" align="center" prop="auditPersonName" width="120" show-overflow-tooltip resizable v-if="columns[23].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.auditPersonName">{{ scope.row.auditPersonName }}</span>
          <span v-else-if="scope.row.auditPerson && scope.row.auditPerson.nickName">{{ scope.row.auditPerson.nickName }}</span>
          <span v-else-if="scope.row.auditPerson && scope.row.auditPerson.userName">{{ scope.row.auditPerson.userName }}</span>
          <span v-else-if="scope.row.auditBy">{{ scope.row.auditBy }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column
        v-for="col in hisChargeItemColumnDefs"
        :key="'his-charge-' + col.key"
        :label="col.label"
        :min-width="col.width"
        align="center"
        show-overflow-tooltip
        resizable
        label-class-name="col-header-nowrap"
        class-name="col-header-nowrap"
      >
        <template slot-scope="scope">
          <span>{{ col.text(scope.row) }}</span>
        </template>
      </el-table-column>

    </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <div class="pagination-container">
        <pagination
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </div>

  </div>
</template>

<script>
import { listInventory } from "@/api/warehouse/inventory";
import { exportWarehouseInventoryDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import { getUserUiConfig, saveUserUiConfig } from "@/api/system/userUiConfig";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectFinanceCategoryLow from "@/components/SelectModel/SelectFinanceCategoryLow";
import RightToolbar from "@/components/RightToolbar";
import hisChargeItemTableColumnsMixin from "@/mixins/hisChargeItemTableColumns";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "firstInventory",
  dicts: ['is_use_status'],
  mixins: [hisChargeItemTableColumnsMixin],
  components: {SelectWarehouse,SelectWarehouseCategory,SelectFinanceCategoryLow,RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      activeName: 'first',
      // 选中数组
      ids: [],
      selectedRowKeys: [],
      tableHeight: 400,
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 库存明细表格数据
      inventoryList: [],
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        receiptOrderNo: null,
        materialId: null,
        warehouseId: null,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        supplierId: null,
        supplierKeyword: null,
        beginDate: null,
        endDate: null,
        batchNumber: null,
        materialNo: null,
        isBilling: null,
        warehouseCategoryId: null,
        financeCategoryIds: [],
        materialIsUse: null,
        hisChargeItemId: null
      },
      // 表单参数
      form: {},
      // 表格列显隐（与用户管理 right-toolbar 一致，key 须与数组下标一致）
      columns: [
        { key: 0, label: '序号', visible: true },
        { key: 1, label: '产品编码', visible: true },
        { key: 2, label: '产品名称', visible: true },
        { key: 3, label: '规格', visible: true },
        { key: 4, label: '型号', visible: true },
        { key: 5, label: '生产厂家', visible: true },
        { key: 6, label: '仓库', visible: true },
        { key: 7, label: '供应商', visible: true },
        { key: 8, label: '单价', visible: true },
        { key: 9, label: '单位', visible: true },
        { key: 10, label: '库存数量', visible: true },
        { key: 11, label: '金额', visible: true },
        { key: 12, label: '入库批次号', visible: true },
        { key: 13, label: '批号', visible: true },
        { key: 14, label: '生产日期', visible: true },
        { key: 15, label: '有效期', visible: true },
        { key: 16, label: '注册证号', visible: true },
        { key: 17, label: '注册证有效期', visible: true },
        { key: 18, label: '计费', visible: true },
        { key: 19, label: '入库单号', visible: true },
        { key: 20, label: '制单日期', visible: true },
        { key: 21, label: '制单人', visible: true },
        { key: 22, label: '审核日期', visible: true },
        { key: 23, label: '审核人', visible: true },
        { key: 24, label: '产品档案状态', visible: true }
      ],
      // 表单校验
      rules: {
      },
      columnDialogVisible: false,
      columnHiddenKeys: [],
      columnConfigKey: 'inventory_first_detail_columns',
      /** 是否显示零库存明细（默认不显示） */
      showZeroStock: false,
      moreSearchTypes: [],
      moreSearchKeywords: {},
      moreSearchOptions: [
        { value: "receiptOrderNo", label: "单号" },
        { value: "warehouse", label: "仓库" },
        { value: "materialName", label: "产品" },
        { value: "materialSpeci", label: "规格" },
        { value: "materialModel", label: "型号" },
        { value: "hisChargeItemId", label: "收费项目ID" },
        { value: "batchNumber", label: "生产批号" }
      ]
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.warehouse.inventory.first.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      // 与出/退库明细首行一致：默认带出「产品」检索框
      return ['materialName'];
    },
    /** 穿梭框数据源（key 用字符串，避免 Transfer 对数字 key 异常） */
    columnTransferData() {
      return (this.columns || []).map(c => ({ key: String(c.key), label: c.label }));
    },
    /** 当前页数量合计 */
    pageTotalQty() {
      return (this.inventoryList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    /** 当前页金额合计（格式化） */
    pageTotalAmtFormatted() {
      const amt = (this.inventoryList || []).reduce((s, r) => s + Number(r.amt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    },
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange(this.moreSearchTypes);
    this.loadUserColumnConfig().finally(() => {
      this.getList();
    });
  },
  mounted() {
    listWarehouse().then((res) => {
      this.restaurants = res.rows;
    });
    this.$nextTick(() => {
      this.updateTableHeight();
      setTimeout(() => this.updateTableHeight(), 80);
    });
    window.addEventListener('resize', this.updateTableHeight);
  },
  activated() {
    this.$nextTick(() => this.updateTableHeight());
  },
  beforeDestroy() {
    this.clearToolbarMoreCloseTimer();
    window.removeEventListener('resize', this.updateTableHeight);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateTableHeight());
    }
  },
  methods: {
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        const h = Math.floor(panel.clientHeight);
        if (h > 120) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.invDetailTable && this.$refs.invDetailTable.doLayout) {
              this.$refs.invDetailTable.doLayout();
            }
          });
        }
      });
    },
    openColumnDialog() {
      this.columnHiddenKeys = this.columns.filter(c => !c.visible).map(c => String(c.key));
      this.columnDialogVisible = true;
    },
    onColumnTransferChange() {
      this.applyColumnVisibilityFromHiddenKeys();
    },
    applyColumnVisibilityFromHiddenKeys() {
      const hidden = new Set(this.columnHiddenKeys.map(String));
      this.columns.forEach(c => {
        c.visible = !hidden.has(String(c.key));
      });
    },
    loadUserColumnConfig() {
      return getUserUiConfig(this.columnConfigKey)
        .then(res => {
          const payload = res && res.data;
          const val = payload && payload.configValue;
          if (!val || String(val).trim() === '') return;
          try {
            const o = typeof val === 'string' ? JSON.parse(val) : val;
            const hidden = o.hiddenKeys || [];
            const hiddenSet = new Set(hidden.map(k => String(k)));
            this.columns.forEach(c => {
              c.visible = !hiddenSet.has(String(c.key));
            });
          } catch (e) {
            console.warn('loadUserColumnConfig', e);
          }
        })
        .catch(() => {});
    },
    saveColumnConfig() {
      this.applyColumnVisibilityFromHiddenKeys();
      const hiddenKeys = this.columns.filter(c => !c.visible).map(c => c.key);
      saveUserUiConfig({
        configKey: this.columnConfigKey,
        configValue: JSON.stringify({ hiddenKeys })
      }).then(() => {
        this.$modal.msgSuccess('保存成功');
        this.columnDialogVisible = false;
      }).catch((err) => {
        const m = (err && err.message) ? String(err.message) : '';
        if (m.includes('404')) {
          this.$modal.msgError('保存失败（404）：服务器上还没有「用户界面配置」接口。请先重新编译并部署最新 spd-admin；再在数据库执行脚本 spd/sql/create_sys_user_ui_config.sql。仅执行建表不能消除 404。');
        } else if (m.includes('500')) {
          this.$modal.msgError('保存失败：可能是未建表。请在数据库执行 spd/sql/create_sys_user_ui_config.sql 后重试。');
        } else {
          this.$modal.msgError(m ? `保存失败：${m}` : '保存失败，请检查网络或稍后重试');
        }
      });
    },
    /** 表头排序：字符串列 */
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    /** 表头排序：数值列 */
    sortByNum(a, b, prop) {
      const va = Number(a[prop]);
      const vb = Number(b[prop]);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortByMaterialCode(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.code) || ''); },
    sortByMaterialName(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.name) || ''); },
    sortBySpeci(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.speci) || ''); },
    sortByModel(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.model) || ''); },
    sortByFactory(a, b) { return this.sortByStr(a, b, r => this.factoryDisplay(r) || ''); },
    /** 生产厂家：库存行 factory_id 与耗材档案厂家合并展示 */
    factoryDisplay(row) {
      const m = row && row.material;
      const fromMat = m && m.fdFactory && m.fdFactory.factoryName;
      return fromMat || '--';
    },
    sortByWarehouse(a, b) { return this.sortByStr(a, b, r => (r.warehouse && r.warehouse.name) || ''); },
    sortBySupplier(a, b) { return this.sortByStr(a, b, r => (r.supplier && r.supplier.name) || ''); },
    sortByUnitPrice(a, b) { return this.sortByNum(a, b, 'unitPrice'); },
    sortByAmt(a, b) { return this.sortByNum(a, b, 'amt'); },
    materialUseDictLabel(isUse) {
      if (isUse === undefined || isUse === null || isUse === '') return '--';
      const v = this.selectDictLabel && this.dict && this.dict.type && this.dict.type.is_use_status
        ? this.selectDictLabel(this.dict.type.is_use_status, String(isUse))
        : '';
      return v || '--';
    },
    querySearchAsync(queryString, cb) {
      const res = this.restaurants;
      if(res.length>0) {
        res.forEach(item => {
          item.value = item.name;
        })
      }

      let results = res.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1;
      })
      cb(results);
    },
    buildListQueryParams(extra = {}) {
      const params = { ...this.queryParams, ...extra };
      if (this.showZeroStock) {
        params.onlyZeroQty = true;
        delete params.excludeZeroQty;
      } else {
        params.excludeZeroQty = true;
        delete params.onlyZeroQty;
      }
      params.receiptOrderNo = null;
      params.supplierId = null;
      params.materialName = null;
      params.materialSpeci = null;
      params.materialModel = null;
      params.hisChargeItemId = null;
      params.batchNumber = null;
      // 供应商固定首行
      const supplierKw = params.supplierKeyword != null ? String(params.supplierKeyword).trim() : '';
      params.supplierKeyword = supplierKw || null;
      const types = this.moreSearchTypes || [];
      if (!types.includes('warehouse')) {
        params.warehouseId = null;
      }
      types.forEach(t => {
        if (t === 'warehouse' || t === 'supplier') {
          return;
        }
        const raw = this.moreSearchKeywords[t];
        const kw = raw != null ? String(raw).trim() : '';
        if (!kw) {
          return;
        }
        switch (t) {
          case 'receiptOrderNo':
            params.receiptOrderNo = kw;
            break;
          case 'materialName':
            params.materialName = kw;
            break;
          case 'materialSpeci':
            params.materialSpeci = kw;
            break;
          case 'materialModel':
            params.materialModel = kw;
            break;
          case 'hisChargeItemId':
            params.hisChargeItemId = kw;
            break;
          case 'batchNumber':
            params.batchNumber = kw;
            break;
          default:
            break;
        }
      });
      if (Array.isArray(params.financeCategoryIds) && params.financeCategoryIds.length === 0) {
        params.financeCategoryIds = null;
      }
      Object.keys(params).forEach(key => {
        if (params[key] === '') {
          params[key] = null;
        }
      });
      return params;
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      let list = [];
      if (bar && typeof bar.loadDefaults === "function") {
        list = bar.loadDefaults() || [];
      } else {
        const fallback = this.builtInMoreSearchDefaults.slice();
        try {
          const raw = localStorage.getItem(this.moreSearchStorageKey);
          if (!raw) return fallback;
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return fallback;
          const allow = new Set(this.moreSearchOptions.map(o => o.value));
          const cleaned = parsed.filter(v => allow.has(v));
          list = cleaned.length ? cleaned : fallback;
        } catch (e) {
          return fallback;
        }
      }
      return (list || []).filter(v => v !== 'supplier');
    },
    onMoreSearchTypesChange(val) {
      const set = new Set((val || []).filter(v => v !== 'supplier'));
      if (!set.has('warehouse')) {
        this.queryParams.warehouseId = null;
      }
      Object.keys(this.moreSearchKeywords).forEach(k => {
        if (!set.has(k) || k === 'supplier') {
          this.$delete(this.moreSearchKeywords, k);
        }
      });
      Array.from(set).forEach(k => {
        if (k === 'warehouse') {
          return;
        }
        if (!Object.prototype.hasOwnProperty.call(this.moreSearchKeywords, k)) {
          this.$set(this.moreSearchKeywords, k, '');
        }
      });
    },
    moreSearchTypeLabel(t) {
      const map = {
        receiptOrderNo: '单号',
        warehouse: '仓库',
        materialName: '产品',
        materialSpeci: '规格',
        materialModel: '型号',
        hisChargeItemId: '收费项目ID',
        batchNumber: '生产批号'
      };
      return map[t] || t;
    },
    moreSearchPlaceholderFor(t) {
      const map = {
        receiptOrderNo: '入库单号模糊',
        materialName: '产品编码/名称/简码',
        materialSpeci: '规格模糊',
        materialModel: '型号模糊',
        hisChargeItemId: '收费项目ID模糊',
        batchNumber: '生产批号模糊'
      };
      return map[t] || '请输入关键字';
    },
    saveMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.saveDefaults === 'function') {
        bar.saveDefaults();
      }
    },
    clearToolbarMoreCloseTimer() {
      if (this.toolbarMoreCloseTimer) {
        clearTimeout(this.toolbarMoreCloseTimer);
        this.toolbarMoreCloseTimer = null;
      }
    },
    setToolbarMoreVisible(visible) {
      const sel = this.$refs.toolbarMoreSelect;
      if (!sel) return;
      if (sel.visible === visible) return;
      sel.visible = visible;
      if (!visible && typeof sel.blur === 'function') {
        sel.blur();
      }
    },
    onToolbarMoreEnter() {
      this.toolbarMoreHover = true;
      this.clearToolbarMoreCloseTimer();
      this.setToolbarMoreVisible(true);
    },
    onToolbarMoreLeave() {
      this.toolbarMoreHover = false;
      this.clearToolbarMoreCloseTimer();
      this.toolbarMoreCloseTimer = setTimeout(() => {
        if (!this.toolbarMoreHover) {
          this.setToolbarMoreVisible(false);
        }
      }, 280);
    },
    onToolbarMoreVisibleChange(visible) {
      if (!visible) {
        this.toolbarMoreHover = false;
      }
    },
    toggleShowZeroStock() {
      this.showZeroStock = !this.showZeroStock;
      this.handleQuery();
    },
    /** 查询库存明细列表（默认按耗材品名排序，同品名相邻便于查找） */
    getList() {
      this.loading = true;
      listInventory(this.buildListQueryParams()).then(response => {
        this.inventoryList = (response.rows || []).map((item, idx) => {
          const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
          return {
            ...item,
            _rowKey: `${pageBase + idx}_${item.id || ''}_${(item.material && item.material.code) || ''}_${item.batchNo || ''}`
          };
        });
        this.total = response.total;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0, subTotalAmt: 0, subTotalQty: 0 };
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
        this.$nextTick(() => this.updateTableHeight());
      }).catch(() => {
        this.inventoryList = [];
        this.total = 0;
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
      });
    },
    getDetailRowKey(row) {
      return (row && row._rowKey) || (row && row.id) || '';
    },
    invDetailRowClassName({ row }) {
      const key = this.getDetailRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'inv-row-selected';
      }
      return '';
    },
    /** 双击行其他列：未选中则勾选，已选中则取消 */
    handleDetailRowDblclick(row) {
      const table = this.$refs.invDetailTable;
      if (!table || !row) return;
      const key = this.getDetailRowKey(row);
      const storeSelection = (table.store && table.store.states && table.store.states.selection) || table.selection || [];
      const selected = !!(key && (
        this.selectedRowKeys.indexOf(key) !== -1 ||
        storeSelection.some(r => this.getDetailRowKey(r) === key)
      ));
      table.toggleRowSelection(row, !selected);
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
        receiptOrderNo: null,
        materialId: null,
        warehouseId: null,
        supplierId: null,
        beginDate: null,
        endDate: null,
        batchNumber: null,
        materialNo: null,
        isBilling: null,
        warehouseCategoryId: null
      };
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
      this.queryParams.receiptOrderNo = null;
      this.queryParams.materialName = null;
      this.queryParams.materialSpeci = null;
      this.queryParams.materialModel = null;
      this.queryParams.supplierId = null;
      this.queryParams.supplierKeyword = null;
      this.queryParams.warehouseId = null;
      this.queryParams.hisChargeItemId = null;
      this.queryParams.warehouseCategoryId = null;
      this.queryParams.financeCategoryIds = [];
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.isBilling = null;
      this.queryParams.materialIsUse = null;
      this.queryParams.batchNumber = null;
      this.showZeroStock = false;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.moreSearchKeywords = {};
      this.onMoreSearchTypesChange(this.moreSearchTypes);
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
      this.selectedRowKeys = (selection || []).map(row => this.getDetailRowKey(row))
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const requestParams = this.buildListQueryParams({
        pageNum: 1,
        pageSize: 10000,
      });
      this.loading = true;
      try {
        const response = await listInventory(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        await exportWarehouseInventoryDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `库存明细查询表${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
  }

};
</script>

<style>
/* 取消内层左右 padding；高度由外层 flex 分配，勿再套 100vh */
.app-container.first-inventory-page {
  padding-top: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
  padding-bottom: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

/* 分页行：与出/退库明细底部留白一致 */
.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  flex: 0 0 auto !important;
  gap: 12px !important;
  margin-top: 4px !important;
  margin-bottom: 0 !important;
  padding: 4px 0 6px !important;
  min-height: 40px !important;
  overflow: visible !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex: 0 1 auto;
  min-width: 0;
  font-size: 13px;
  line-height: 32px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 32px !important;
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  margin-left: auto !important;
  padding: 0 4px !important;
  flex: 0 0 auto !important;
  overflow: visible !important;
  background: transparent !important;
}
.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  white-space: nowrap;
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
}

/* 仅加粗明细表底部横向滚动条 */
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}

/* 批次号自动换行显示完整 */
.batch-no-text {
  display: inline-block;
  width: 100%;
  white-space: normal;
  word-break: break-all;
  line-height: 18px;
}

/* 表头单行显示，列宽不足时由 min-width 撑开 */
.first-inventory-page .el-table th .cell {
  white-space: nowrap;
}

/* 库存明细表：表头对齐出/退库明细 */
.first-inventory-page .inv-detail-main-table .el-table__header-wrapper th,
.first-inventory-page .inv-detail-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .inv-detail-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}

/* 本页「更多检索」多选：调短（覆盖 list-page 190px） */
.inv-detail-query .ctk-list-toolbar .toolbar-more-search .more-search-type,
.inv-detail-query .ctk-list-toolbar .toolbar-more-search .more-search-type.el-select,
.inv-detail-query .ctk-list-toolbar .toolbar-more-search .el-select {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  height: 32px !important;
  overflow: visible !important;
}
.inv-detail-query .ctk-list-toolbar .toolbar-more-search .el-select > .el-input,
.inv-detail-query .ctk-list-toolbar .toolbar-more-search .el-select .el-input__inner {
  width: 160px !important;
  max-width: 160px !important;
  height: 32px !important;
  min-height: 32px !important;
  max-height: 32px !important;
}
.inv-detail-query .ctk-list-toolbar .toolbar-more-search .el-select-dropdown {
  min-width: 160px !important;
}

/* 勾选/双击选中行高亮，与出/退库明细一致 */
.first-inventory-page .inv-detail-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body tr.inv-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .inv-detail-main-table .el-table__body tr.inv-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
</style>

<style scoped>
.app-container {
  margin-top: 0;
  padding-top: 0 !important;
  display: flex;
  flex-direction: column;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
}

/* 查询条件样式 */
.query-row-left {
  margin-bottom: 2px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 2px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-item-inline .el-form-item {
  margin-bottom: 0;
}

.query-select-wrapper {
  width: 180px;
}

.more-search-item >>> .el-form-item__content {
  line-height: 32px;
  max-width: 100%;
}
.more-search-row {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 8px;
}
.more-search-row--multi {
  flex-wrap: wrap;
  align-items: center;
  max-width: 100%;
}
.more-search-dynamic-field {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  height: 32px;
}
.more-search-field-label {
  color: #606266;
  font-size: 12px;
  line-height: 32px;
  white-space: nowrap;
  flex-shrink: 0;
}
.more-search-label {
  color: #606266;
  font-size: 12px;
  line-height: 32px;
  white-space: nowrap;
}

/* 第一行与底行留 8px */
.ctk-query-top-fields {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  margin-bottom: 8px;
  box-sizing: border-box;
}
.ctk-more-search-bar--hidden {
  display: none !important;
  height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}
.more-search-type {
  width: 148px;
  min-width: 148px;
  max-width: 148px;
}
.more-search-input {
  width: 200px;
}
.more-search-input--dynamic {
  width: 180px;
}
.more-search-warehouse-wrap {
  width: 210px;
}
.more-search-warehouse-wrap >>> .el-select {
  width: 100%;
}

.query-row-second {
  margin-top: 0;
  margin-bottom: 0;
}

.query-row-second .el-form-item {
  white-space: nowrap;
  margin-bottom: 0;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

/* 第二行：与出/退库明细底行一致，行高与上下留白对齐 */
.query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  width: 100%;
  gap: 8px;
  padding-bottom: 0;
}

.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 0;
  white-space: nowrap;
}

.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.ctk-query-actions {
  margin-left: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 138px;
}

/* 财务分类多选：标签单行不撑高，行高与出退库一致 */
.inv-category-multi.more-search-select-wrap {
  width: 138px !important;
  min-width: 138px !important;
  max-width: 138px !important;
  height: 32px !important;
  overflow: hidden;
}
.inv-category-multi >>> .el-select,
.inv-category-multi >>> .el-select .el-input {
  width: 100% !important;
  height: 32px !important;
  min-height: 32px !important;
}
.inv-category-multi >>> .el-select--multiple .el-select__tags {
  display: flex !important;
  flex-wrap: nowrap !important;
  align-items: center !important;
  overflow: hidden !important;
  max-width: calc(100% - 28px) !important;
  white-space: nowrap !important;
}
.inv-category-multi >>> .el-select--multiple .el-tag {
  max-width: 72px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex-shrink: 1;
  height: 20px !important;
  line-height: 18px !important;
  margin: 2px 0 2px 4px !important;
}
.inv-category-multi >>> .el-select--multiple .el-input__inner {
  height: 32px !important;
  min-height: 32px !important;
}

.query-item-date-range .query-date-start {
  margin-right: 6px;
}
.query-item-date-range .query-date-end {
  margin-left: 6px;
}
.query-item-date-range .query-date-sep {
  margin: 0 2px;
  flex-shrink: 0;
}

.query-input-batch {
  width: 150px;
}
.query-input-material-name {
  width: 170px;
}
.query-input-material-spec,
.query-input-material-model {
  width: 130px;
}
.query-select-billing {
  width: 120px;
}
.query-select-warehouse-cat {
  width: 160px;
}
.query-select-finance-cat {
  width: 200px;
}

.query-item-zero-stock {
  margin-right: 0;
  vertical-align: middle;
}
.query-item-zero-stock .el-button {
  min-width: 72px;
}

.query-row-third {
  margin-bottom: 2px;
}

.query-row-third .el-form-item {
  margin-bottom: 0;
}

/* 查询条件容器：恢复正常留白，勿用负 margin 顶到页签 */
.form-fields-container {
  margin-bottom: 4px;
  margin-top: 0;
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
}

/* 工具栏与搜索区/明细表间距 4px */
.ctk-list-toolbar.list-toolbar {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  flex: 0 0 auto;
  flex-wrap: nowrap !important;
  align-items: center !important;
}
.ctk-list-toolbar .list-toolbar-right {
  flex-wrap: nowrap !important;
  flex-shrink: 0;
}

/* 导出/搜索/重置 */
.button-row-inventory {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding-top: 0 !important;
}

.button-row-inventory-flex {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.button-row-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.button-row-right {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
}

.table-container {
  margin-top: 0;
  margin-bottom: 0;
  overflow: hidden;
  width: 100%;
  min-width: 0;
  min-height: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
  flex: 1 1 auto;
}

/* 仅加粗明细表底部横向滚动条 */
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8 !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909090 !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .inv-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #707070 !important;
}

/* 优化表格列间距（与出/退库明细表头高度一致） */
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 4px 6px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 6px !important;
}

.table-container ::v-deep .el-table thead th.el-table__cell > .cell,
.table-container ::v-deep .el-table tbody td.el-table__cell > .cell {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 23px;
  word-break: normal;
}

.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}

.table-container ::v-deep .el-table th.col-serial-center .cell,
.table-container ::v-deep .el-table td.col-serial-center .cell {
  text-align: center !important;
  justify-content: center;
}

.table-container ::v-deep .col-serial-center-text {
  display: block;
  width: 100%;
  text-align: center;
}

/* 显隐列弹窗限制在本页内容区内，不铺满整个浏览器框架 */
.first-inventory-page {
  position: relative;
  min-height: 400px;
}
.first-inventory-page ::v-deep .inventory-column-dialog-inpage.el-dialog__wrapper {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
}
.first-inventory-page ::v-deep .inventory-column-dialog-inpage .el-dialog {
  margin-top: 0 !important;
  max-height: 90%;
  display: flex;
  flex-direction: column;
}
.first-inventory-page ::v-deep .inventory-column-dialog-inpage .el-dialog__body {
  flex: 1;
  overflow: auto;
}
</style>
