<template>
  <div class="app-container list-page first-inventory-page">
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
                  v-model="queryParams.warehouseIds"
                  :multiple="true"
                  excludeWarehouseType="高值"
                  placeholder="仓库多选"
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
            <el-form-item prop="isGz" class="query-item-inline">
              <el-select v-model="queryParams.isGz" placeholder="高值" clearable class="more-search-short-select">
                <el-option label="是" value="1" />
                <el-option label="否" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item prop="financeCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectFinanceCategoryLow v-model="queryParams.financeCategoryIds" :multiple="true" placeholder="财务分类多选" />
              </div>
            </el-form-item>
            <el-form-item prop="warehouseCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouseCategoryLow v-model="queryParams.warehouseCategoryIds" :multiple="true" placeholder="库房分类多选" />
              </div>
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
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
        >导出</el-button>
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
            filterable
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
          icon="el-icon-check"
          class="spd-btn"
          @click="saveMoreSearchDefaults"
        >保存查询条件</el-button>
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container" ref="tablePanel">
      <el-table
              ref="rthSummaryTable"
              class="rth-summary-main-table"
              v-loading="loading"
              :data="pagedList"
              :row-key="getSummaryRowKey"
              :row-class-name="rthSummaryRowClassName"
              :height="tableHeight"
              border
              stripe
              @selection-change="handleSelectionChange"
              @row-dblclick="handleSummaryRowDblclick"
              @sort-change="handleSortChange">
      <el-table-column type="selection" width="55" align="center" header-align="center" class-name="rth-select-col col-serial-center" />
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="产品编码" align="center" prop="materialCode" width="145" min-width="130" class-name="col-material-code" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" v-if="columns[0].visible"/>
      <el-table-column label="产品名称" align="center" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" v-if="columns[1].visible"/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="130" min-width="110" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" v-if="columns[2].visible"/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="200" min-width="180" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" v-if="columns[3].visible"/>
      <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" v-if="columns[4].visible"/>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="110" min-width="100" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" v-if="columns[5].visible"/>
      <el-table-column label="单位" align="center" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" v-if="columns[6].visible"/>
      <el-table-column label="生产厂家" align="center" prop="factoryName" width="120" show-overflow-tooltip resizable v-if="columns[7].visible"/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="130" min-width="120" show-overflow-tooltip resizable sortable="custom" :sort-orders="['ascending', 'descending']" v-if="columns[8].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice != null && scope.row.unitPrice !== undefined && scope.row.unitPrice !== ''">{{ scope.row.unitPrice | formatPrice }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="120" show-overflow-tooltip resizable v-if="columns[9].visible"/>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable v-if="columns[10].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt != null && scope.row.materialAmt !== undefined && scope.row.materialAmt !== ''">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>

      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable v-if="columns[11].visible"/>
      <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable v-if="columns[12].visible"/>
      <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable v-if="columns[13].visible"/>
      <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable v-if="columns[14].visible"/>
      <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable v-if="columns[15].visible">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <div class="pagination-container">
        <el-pagination
          background
          :current-page="queryParams.pageNum"
          :page-size="queryParams.pageSize"
          :page-sizes="[10, 20, 30, 50]"
          :total="total"
          :pager-count="11"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>

  </div>
</template>

<script>
import { listRTHSummary} from "@/api/warehouse/warehouse";
import { exportRTHSummaryListStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectFinanceCategoryLow from '@/components/SelectModel/SelectFinanceCategoryLow';
import SelectWarehouseCategoryLow from '@/components/SelectModel/SelectWarehouseCategoryLow';
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "secondQuery",
  dicts: ['biz_status','bill_type','way_status'],
  components: { SelectWarehouse, SelectFinanceCategoryLow, SelectWarehouseCategoryLow, RightToolbar },
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      isShow: true,
      // 选中数组
      ids: [],
      selectedRowKeys: [],
      toolbarMoreHover: false,
      toolbarMoreCloseTimer: null,
      // 子表选中数据
      checkedStkIoBillEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      tableHeight: 400,
      // 总条数
      total: 0,
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      // 入/退货汇总全量数据（前端分页）
      warehouseList: [],
      stkMaterialList: [],
      // 入/退货明细表格数据
      stkIoBillEntryList: [],
      moreSearchTypes: [],
      moreSearchKeywords: {},
      moreSearchOptions: [
        { value: "factory", label: "生产厂家" },
        { value: "materialName", label: "产品" },
        { value: "materialSpeci", label: "规格" },
        { value: "materialModel", label: "型号" },
        { value: "warehouse", label: "仓库" },
        { value: "financeCategoryKeyword", label: "财务分类" },
        { value: "warehouseCategoryKeyword", label: "库房分类" }
      ],
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
        billNo: null,
        supplerId: null,
        billDate: null,
        materialNameLike: null,
        materialSpeciLike: null,
        materialModelLike: null,
        supplierKeyword: null,
        factoryKeyword: null,
        warehouseIds: [],
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        financeCategoryKeyword: null,
        warehouseCategoryKeyword: null,
        isGz: null,
        financeCategoryIds: [],
        warehouseCategoryIds: [],
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        supplerId: [
          { required: true, message: "供应商ID不能为空", trigger: "blur" }
        ],
        billDate: [
          { required: true, message: "入/退货日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库ID不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "入/退货类型不能为空", trigger: "change" }
        ],
      },
      // 列显隐配置
      columns: [
        { key: 0, label: `产品编码`, visible: true },
        { key: 1, label: `产品名称`, visible: true },
        { key: 2, label: `仓库`, visible: true },
        { key: 3, label: `供应商`, visible: true },
        { key: 4, label: `型号`, visible: true },
        { key: 5, label: `规格`, visible: true },
        { key: 6, label: `单位`, visible: true },
        { key: 7, label: `生产厂家`, visible: true },
        { key: 8, label: `单价`, visible: true },
        { key: 9, label: `数量`, visible: true },
        { key: 10, label: `金额`, visible: true },
        { key: 11, label: `注册证号`, visible: true },
        { key: 12, label: `包装规格`, visible: true },
        { key: 13, label: `库房分类`, visible: true },
        { key: 14, label: `财务分类`, visible: true },
        { key: 15, label: `储存方式`, visible: true }
      ],
      sortProp: null,
      sortOrder: null,
      numericSortProps: ['unitPrice']
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.inWarehouse.query.second.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return [];
    },
    sortedWarehouseList() {
      const list = [...(this.warehouseList || [])];
      if (!this.sortProp || !this.sortOrder) {
        return list;
      }
      const prop = this.sortProp;
      const asc = this.sortOrder === 'ascending';
      const isNumeric = this.numericSortProps.includes(prop);
      list.sort((a, b) => {
        let va = a[prop];
        let vb = b[prop];
        if (isNumeric) {
          va = Number(va) || 0;
          vb = Number(vb) || 0;
          return asc ? va - vb : vb - va;
        }
        va = va != null ? String(va) : '';
        vb = vb != null ? String(vb) : '';
        const cmp = va.localeCompare(vb, 'zh-CN');
        return asc ? cmp : -cmp;
      });
      return list;
    },
    pagedList() {
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
      const end = start + this.queryParams.pageSize;
      return this.sortedWarehouseList.slice(start, end);
    },
    pageTotalQty() {
      return (this.pagedList || []).reduce((s, r) => s + Number(r.materialQty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.pagedList || []).reduce((s, r) => s + Number(r.materialAmt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    },
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateTableHeight());
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange(this.moreSearchTypes);
    this.getList();
  },
  mounted() {
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
  methods: {
    updateTableHeight() {
      this.$nextTick(() => {
        const panel = this.$refs.tablePanel;
        if (!panel) return;
        const h = Math.floor(panel.clientHeight);
        if (h > 120) {
          this.tableHeight = h;
          this.$nextTick(() => {
            if (this.$refs.rthSummaryTable && this.$refs.rthSummaryTable.doLayout) {
              this.$refs.rthSummaryTable.doLayout();
            }
          });
        }
      });
    },
    /** 查询入/退货汇总列表 */
    getList() {
      this.loading = true;
      const queryParams = this.buildListQueryParams();
      listRTHSummary(queryParams).then(response => {
        const rows = Array.isArray(response) ? response : (response && response.rows ? response.rows : []);
        this.warehouseList = (rows || []).map((item, idx) => ({
          ...item,
          unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
          materialAmt: item.materialAmt != null ? Number(item.materialAmt) : null,
          materialQty: item.materialQty != null ? Number(item.materialQty) : 0,
          _rowKey: [
            item.warehouseId,
            item.materialCode,
            item.unitPrice,
            item.supplierName,
            idx
          ].map(v => (v == null ? '' : String(v))).join('|')
        }));
        this.total = this.warehouseList.length;
        this.totalInfo = this.warehouseList.reduce(
          (acc, r) => {
            acc.totalQty += Number(r.materialQty || 0);
            acc.totalAmt += Number(r.materialAmt || 0);
            return acc;
          },
          { totalQty: 0, totalAmt: 0 }
        );
        this.queryParams.pageNum = 1;
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
      }).catch(() => {
        this.warehouseList = [];
        this.total = 0;
        this.totalInfo = { totalAmt: 0, totalQty: 0 };
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
      });
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
    },
    handleSortChange({ prop, order }) {
      this.sortProp = order ? prop : null;
      this.sortOrder = order || null;
      this.queryParams.pageNum = 1;
    },
    getStatDate(){
      // 与明细表保持一致：当前日期往前推5天
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      return year + "-" + month + "-" + day;
    },
    getEndDate(){
      // 与明细表保持一致：当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
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
        billNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.stkIoBillEntryList = [];
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
      this.queryParams.materialNameLike = null;
      this.queryParams.materialSpeciLike = null;
      this.queryParams.materialModelLike = null;
      this.queryParams.supplierKeyword = null;
      this.queryParams.factoryKeyword = null;
      this.queryParams.warehouseIds = [];
      this.queryParams.supplerId = null;
      this.queryParams.financeCategoryKeyword = null;
      this.queryParams.warehouseCategoryKeyword = null;
      this.queryParams.financeCategoryIds = [];
      this.queryParams.warehouseCategoryIds = [];
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.moreSearchKeywords = {};
      this.onMoreSearchTypesChange(this.moreSearchTypes);
      this.handleQuery();
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
      return (list || []).filter(v => v !== "supplier");
    },
    onMoreSearchTypesChange(val) {
      const set = new Set((val || []).filter(v => v !== "supplier"));
      if (!set.has("warehouse")) {
        this.queryParams.warehouseIds = [];
      }
      Object.keys(this.moreSearchKeywords).forEach(k => {
        if (!set.has(k) || k === "supplier") {
          this.$delete(this.moreSearchKeywords, k);
        }
      });
      Array.from(set).forEach(k => {
        if (k === "warehouse") {
          return;
        }
        if (!Object.prototype.hasOwnProperty.call(this.moreSearchKeywords, k)) {
          this.$set(this.moreSearchKeywords, k, "");
        }
      });
    },
    moreSearchTypeLabel(t) {
      const map = {
        factory: "生产厂家",
        materialName: "产品",
        materialSpeci: "规格",
        materialModel: "型号",
        warehouse: "仓库",
        financeCategoryKeyword: "财务分类",
        warehouseCategoryKeyword: "库房分类"
      };
      return map[t] || t;
    },
    moreSearchPlaceholderFor(t) {
      const map = {
        factory: "生产厂家编码/名称/简码",
        materialName: "产品编码/名称/简码",
        materialSpeci: "规格模糊",
        materialModel: "型号模糊",
        financeCategoryKeyword: "财务分类编码/名称/简拼",
        warehouseCategoryKeyword: "库房分类编码/名称/简拼"
      };
      return map[t] || "请输入关键字";
    },
    buildListQueryParams() {
      const queryParams = { ...this.queryParams };
      queryParams.materialNameLike = null;
      queryParams.materialSpeciLike = null;
      queryParams.materialModelLike = null;
      queryParams.factoryKeyword = null;
      queryParams.financeCategoryKeyword = null;
      queryParams.warehouseCategoryKeyword = null;
      queryParams.supplerId = null;
      // 供应商固定首行
      const supplierKw = queryParams.supplierKeyword != null ? String(queryParams.supplierKeyword).trim() : '';
      queryParams.supplierKeyword = supplierKw || null;
      if (!queryParams.beginDate || queryParams.beginDate === '') {
        queryParams.beginDate = null;
      }
      if (!queryParams.endDate || queryParams.endDate === '') {
        queryParams.endDate = null;
      } else if (queryParams.endDate && queryParams.endDate.length === 10) {
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      if (Array.isArray(queryParams.financeCategoryIds) && queryParams.financeCategoryIds.length === 0) {
        queryParams.financeCategoryIds = null;
      }
      if (Array.isArray(queryParams.warehouseCategoryIds) && queryParams.warehouseCategoryIds.length === 0) {
        queryParams.warehouseCategoryIds = null;
      }
      if (Array.isArray(queryParams.warehouseIds) && queryParams.warehouseIds.length === 0) {
        queryParams.warehouseIds = null;
      }
      queryParams.warehouseId = null;
      const types = this.moreSearchTypes || [];
      if (!types.includes("warehouse")) {
        queryParams.warehouseIds = null;
      }
      types.forEach(t => {
        if (t === "warehouse" || t === "supplier") {
          return;
        }
        const raw = this.moreSearchKeywords[t];
        const kw = raw != null ? String(raw).trim() : "";
        if (!kw) {
          return;
        }
        switch (t) {
          case "factory":
            queryParams.factoryKeyword = kw;
            break;
          case "materialName":
            queryParams.materialNameLike = kw;
            break;
          case "materialSpeci":
            queryParams.materialSpeciLike = kw;
            break;
          case "materialModel":
            queryParams.materialModelLike = kw;
            break;
          case "financeCategoryKeyword":
            queryParams.financeCategoryKeyword = kw;
            break;
          case "warehouseCategoryKeyword":
            queryParams.warehouseCategoryKeyword = kw;
            break;
          default:
            break;
        }
      });
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '') queryParams[key] = null;
      });
      return queryParams;
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
      this.selectedRowKeys = (selection || []).map(row => this.getSummaryRowKey(row))
    },
    /** 双击行：切换勾选（已选则取消，未选则选中） */
    handleSummaryRowDblclick(row) {
      const table = this.$refs.rthSummaryTable;
      if (!table || !row) return;
      const key = this.getSummaryRowKey(row);
      const selected = key && this.selectedRowKeys.indexOf(key) !== -1;
      table.toggleRowSelection(row, !selected);
    },
    getSummaryRowKey(row) {
      return (row && row._rowKey) || [
        row && row.warehouseId,
        row && row.materialCode,
        row && row.unitPrice,
        row && row.supplierName
      ].map(v => (v == null ? '' : String(v))).join('|');
    },
    rthSummaryRowClassName({ row }) {
      const key = this.getSummaryRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'rth-row-selected';
      }
      return '';
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
      }, 120);
    },
    onToolbarMoreVisibleChange(visible) {
      if (!visible) {
        this.toolbarMoreHover = false;
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const rows = (this.warehouseList || []).map(item => ({
        ...item,
        unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
        materialAmt: item.materialAmt != null ? Number(item.materialAmt) : null,
        materialQty: item.materialQty != null ? Number(item.materialQty) : 0,
      }));
      if (!rows.length) {
        this.$message && this.$message.warning('暂无数据可导出');
        return;
      }
      const wayOpts = this.dict.type.way_status || [];
      const resolveWay = v => {
        if (v == null || v === '') return '';
        const hit = wayOpts.find(d => String(d.value) === String(v));
        return hit ? hit.label : String(v);
      };
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      try {
        await exportRTHSummaryListStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `入退货汇总表${dateStr}.xlsx`,
          resolveWay,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      }
    },
  }
};
</script>

<style>
/* 取消内层 app-container 的左右 padding；高度由外层 flex 分配，勿再套 100vh
 * 注意：根节点不要写 display:!important，否则会盖掉 v-show 的 display:none，导致多页签叠在一起 */
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

/* 入/退货汇总表：表头对齐出/退库汇总（#f1f5f9 / 13px / 600 / 34px） */
.first-inventory-page .rth-summary-main-table .el-table__header-wrapper th,
.first-inventory-page .rth-summary-main-table .el-table__header-wrapper th.el-table__cell {
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
.first-inventory-page .rth-summary-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.first-inventory-page .rth-summary-main-table .el-table__header-wrapper th > .cell,
.first-inventory-page .rth-summary-main-table .el-table__header-wrapper th.el-table__cell > .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 20px !important;
}
.first-inventory-page .rth-summary-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .rth-summary-main-table .el-table__body tr.rth-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .rth-summary-main-table .el-table__body tr.rth-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.first-inventory-page .rth-summary-main-table th.rth-select-col,
.first-inventory-page .rth-summary-main-table td.rth-select-col,
.first-inventory-page .rth-summary-main-table th.el-table-column--selection,
.first-inventory-page .rth-summary-main-table td.el-table-column--selection {
  position: sticky;
  left: 0;
  z-index: 2;
  box-shadow: 2px 0 0 0 #e2e8f0;
}
.first-inventory-page .rth-summary-main-table th.rth-select-col,
.first-inventory-page .rth-summary-main-table th.el-table-column--selection {
  z-index: 3;
  background-color: #f1f5f9 !important;
}
.first-inventory-page .rth-summary-main-table td.rth-select-col,
.first-inventory-page .rth-summary-main-table td.el-table-column--selection {
  background-color: #fff;
}
.first-inventory-page .rth-summary-main-table .el-table__body tr.el-table__row--striped td.rth-select-col,
.first-inventory-page .rth-summary-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa;
}
.first-inventory-page .rth-summary-main-table .el-table__body tr:hover > td.rth-select-col,
.first-inventory-page .rth-summary-main-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF;
}
.first-inventory-page .rth-summary-main-table .el-table__body tr.rth-row-selected > td.rth-select-col,
.first-inventory-page .rth-summary-main-table .el-table__body tr.rth-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF;
}
.first-inventory-page .rth-summary-main-table .el-table__body tr.rth-row-selected:hover > td.rth-select-col,
.first-inventory-page .rth-summary-main-table .el-table__body tr.rth-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF;
}
.first-inventory-page .rth-summary-main-table td.rth-select-col .cell,
.first-inventory-page .rth-summary-main-table td.el-table-column--selection .cell,
.first-inventory-page .rth-summary-main-table th.rth-select-col .cell,
.first-inventory-page .rth-summary-main-table th.el-table-column--selection .cell {
  text-align: center !important;
  justify-content: center !important;
  background: transparent;
}

.first-inventory-page .list-toolbar {
  display: flex !important;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
}
.first-inventory-page .list-toolbar-left {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  gap: 8px;
}
.first-inventory-page .list-toolbar-right {
  margin-left: auto;
  display: inline-flex !important;
  align-items: center;
  justify-content: flex-end;
  gap: 6px !important;
  flex: 0 0 auto !important;
  width: auto !important;
  flex-wrap: nowrap;
}
.first-inventory-page .list-toolbar-right > * {
  flex: 0 0 auto;
}
.first-inventory-page .toolbar-more-search {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.first-inventory-page .toolbar-more-search .more-search-type,
.first-inventory-page .toolbar-more-search .more-search-type.el-select,
.first-inventory-page .toolbar-more-search .el-select {
  width: 148px !important;
  min-width: 148px !important;
  max-width: 148px !important;
}
.first-inventory-page .toolbar-more-search .el-select > .el-input,
.first-inventory-page .toolbar-more-search .el-select .el-input__inner {
  width: 148px !important;
  max-width: 148px !important;
}
.first-inventory-page .toolbar-more-search .el-select-dropdown {
  min-width: 148px !important;
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
  align-items: flex-start;
  max-width: 100%;
}
.more-search-dynamic-field {
  display: inline-flex;
  align-items: center;
  flex-wrap: nowrap;
  gap: 6px;
  margin-top: 2px;
}
.more-search-field-label {
  color: #606266;
  font-size: 12px;
  white-space: nowrap;
  flex-shrink: 0;
}
.more-search-label {
  color: #606266;
  font-size: 12px;
  white-space: nowrap;
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
.category-multi-wrap {
  width: 158px !important;
  max-width: 158px;
}
.category-multi-wrap >>> .el-select {
  width: 100%;
  max-width: 100%;
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
.query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  overflow: visible;
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

.query-row-second .el-form-item {
  white-space: nowrap;
  margin-bottom: 0;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
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

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 138px;
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

.form-fields-container {
  margin-bottom: 4px;
  margin-top: 0;
  margin-left: 0;
  margin-right: 0;
  flex: 0 0 auto;
}

.ctk-list-toolbar.list-toolbar {
  margin-top: 0 !important;
  margin-bottom: 4px !important;
  flex: 0 0 auto;
}

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

.table-container ::v-deep .el-table th.col-material-code .cell {
  white-space: nowrap;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}
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
</style>
