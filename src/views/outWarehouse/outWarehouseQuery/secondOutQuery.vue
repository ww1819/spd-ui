<template>
  <div class="app-container list-page first-inventory-page">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <more-search-bar
          ref="moreSearchBar"
          v-model="moreSearchTypes"
          :options="moreSearchOptions"
          :storage-key="moreSearchStorageKey"
          :default-types="builtInMoreSearchDefaults"
          :auto-load="false"
          @change="onMoreSearchTypesChange"
          @search="handleQuery"
          @reset="resetQuery"
        >
          <div
            v-for="t in moreSearchTypes"
            :key="t"
            class="more-search-dynamic-field"
            :class="(t === 'warehouse' || t === 'department') ? 'more-search-field--select' : 'more-search-field--text'"
          >
            <template v-if="t === 'warehouse'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouse
                  v-model="queryParams.warehouseId"
                  excludeWarehouseType="高值"
                  placeholder="仓库编码/名称/简码搜索"
                />
              </div>
            </template>
            <template v-else-if="t === 'department'">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectDepartment v-model="queryParams.departmentId" />
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
        </more-search-bar>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
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
              <el-select v-model="queryParams.isGz" placeholder="是否高值" clearable class="more-search-short-select">
                <el-option label="是" value="1" />
                <el-option label="否" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item label="单据类型" prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="单据类型" clearable class="more-search-select-wrap">
                <el-option
                  v-for="dict in dict.type.out_warehouse_bill_type"
                  :key="dict.value"
                  :label="formatCtkBillTypeLabel(dict.value)"
                  :value="dict.value"
                />
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
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="0" class="mb8 list-toolbar">
      <div class="list-toolbar-left">
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
    <el-table
      ref="ctkSummaryTable"
      class="ctk-summary-main-table"
      v-loading="loading"
      :data="warehouseList"
      :row-key="getSummaryRowKey"
      :row-class-name="ctkSummaryRowClassName"
      @selection-change="handleSelectionChange"
      height="60vh"
      border
      stripe
    >
      <el-table-column type="selection" width="55" align="center" header-align="center" class-name="ctk-select-col col-serial-center" />
      <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="left" header-align="center" prop="warehouseName" width="130" min-width="110" show-overflow-tooltip resizable class-name="ctk-col-left"/>
      <el-table-column label="耗材编码" align="left" header-align="center" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode" class-name="ctk-col-left"/>
      <el-table-column label="耗材名称" align="left" header-align="center" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" class-name="ctk-col-left"/>
      <el-table-column label="型号" align="left" header-align="center" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByModel" class-name="ctk-col-left"/>
      <el-table-column label="规格" align="left" header-align="center" prop="materialSpeci" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci" class-name="ctk-col-left"/>
      <el-table-column label="单位" align="left" header-align="center" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByUnitName" class-name="ctk-col-left"/>
      <el-table-column label="生产厂家" align="left" header-align="center" prop="factoryName" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByFactory" class-name="ctk-col-left"/>
      <el-table-column label="供应商" align="left" header-align="center" prop="supplierName" width="200" min-width="180" show-overflow-tooltip resizable sortable :sort-method="sortBySupplier" class-name="ctk-col-left">
        <template slot-scope="scope">
          <span>{{ scope.row.supplierName || (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="价格" align="center" prop="unitPrice" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice !== null && scope.row.unitPrice !== undefined && scope.row.unitPrice !== ''">{{ scope.row.unitPrice | formatPrice }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialQty">
        <template slot-scope="scope">
          <span v-if="scope.row.materialQty !== null && scope.row.materialQty !== undefined">{{ scope.row.materialQty }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt !== null && scope.row.materialAmt !== undefined">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="left" header-align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable class-name="ctk-col-left"/>
      <el-table-column label="包装规格" align="left" header-align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable class-name="ctk-col-left"/>
      <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" header-align="center" width="80" class-name="col-yn-center" resizable>
        <template slot-scope="scope">
          <span v-if="formatBillingYesNo(scope.row) === '--'">--</span>
          <span
            v-else
            class="material-yn-btn"
            :class="isBillingYes(scope.row) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
          >{{ formatBillingYesNo(scope.row) }}</span>
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
import { listCTKWarehouseSummary} from "@/api/warehouse/outWarehouse";
import { exportCTKWarehouseSummaryListStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectFinanceCategoryLow from '@/components/SelectModel/SelectFinanceCategoryLow';
import SelectWarehouseCategoryLow from '@/components/SelectModel/SelectWarehouseCategoryLow';
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "secondOutQuery",
  dicts: ['biz_status','bill_type','out_warehouse_bill_type','way_status'],
  components: {SelectWarehouse,SelectDepartment,SelectFinanceCategoryLow,SelectWarehouseCategoryLow,RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      isShow: true,
      // 选中数组
      ids: [],
      // 当前页勾选行 rowKey，用于整行选中高亮
      selectedRowKeys: [],
      // 子表选中数据
      checkedStkIoBillEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 出/退货表格数据
      warehouseList: [],
      // 合计信息
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      selectRow: [],
      // 出/退货明细表格数据
      stkIoBillEntryList: [],
      moreSearchTypes: [],
      moreSearchKeywords: {},
      moreSearchOptions: [
        { value: "supplier", label: "供应商" },
        { value: "factory", label: "生产厂家" },
        { value: "materialName", label: "耗材" },
        { value: "materialSpeci", label: "规格" },
        { value: "materialModel", label: "型号" },
        { value: "warehouse", label: "仓库" },
        { value: "department", label: "出库科室" },
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
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        materialNameLike: null,
        materialSpeciLike: null,
        materialModelLike: null,
        supplierKeyword: null,
        factoryKeyword: null,
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
        billDate: [
          { required: true, message: "出/退货日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库ID不能为空", trigger: "blur" }
        ],
        departmentId: [
          { required: true, message: "科室ID不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "出/退货类型不能为空", trigger: "change" }
        ],
      }
    };
  },
  computed: {
    moreSearchStorageKey() {
      return "spd.outWarehouse.query.second.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return [];
    },
    /** 当前页数量合计 */
    pageTotalQty() {
      return (this.warehouseList || []).reduce((s, r) => s + Number(r.materialQty || 0), 0);
    },
    /** 当前页金额合计（格式化） */
    pageTotalAmtFormatted() {
      const amt = (this.warehouseList || []).reduce((s, r) => s + Number(r.materialAmt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(this.formatAmount(amt));
    },
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange(this.moreSearchTypes);
    // 汇总表在父组件切换到此 tab 时再加载（见 index.vue handleTabClick），避免与明细表同时请求
  },
  methods: {
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    sortByNum(a, b, prop) {
      const va = Number(a[prop]);
      const vb = Number(b[prop]);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortByMaterialCode(a, b) { return this.sortByStr(a, b, r => r.materialCode || ''); },
    sortByMaterialName(a, b) { return this.sortByStr(a, b, r => r.materialName || ''); },
    sortBySpeci(a, b) { return this.sortByStr(a, b, r => r.materialSpeci || ''); },
    sortByModel(a, b) { return this.sortByStr(a, b, r => r.materialModel || ''); },
    sortByUnitName(a, b) { return this.sortByStr(a, b, r => r.unitName || ''); },
    sortByMaterialQty(a, b) { return this.sortByNum(a, b, 'materialQty'); },
    sortByUnitPrice(a, b) { return this.sortByNum(a, b, 'unitPrice'); },
    sortByFactory(a, b) { return this.sortByStr(a, b, r => r.factoryName || ''); },
    sortBySupplier(a, b) {
      return this.sortByStr(a, b, r => r.supplierName || (r.supplier && r.supplier.name) || '');
    },
    /** 计费：取耗材档案 isBilling，1=是，0/2=否 */
    formatBillingYesNo(row) {
      const v = row && row.material ? row.material.isBilling : null;
      if (v === '1' || v === 1) return '是';
      if (v === '0' || v === 0 || v === '2' || v === 2) return '否';
      return '--';
    },
    isBillingYes(row) {
      const v = row && row.material ? row.material.isBilling : null;
      return v === '1' || v === 1;
    },
    /** 同仓库 + 同耗材编码 + 同单价合并；单价不同则分行 */
    mergeSummaryRowsByWarehouseMaterial(rows) {
      if (!rows || !rows.length) return [];
      const map = new Map();
      rows.forEach((row) => {
        const wh = row.warehouseId != null && row.warehouseId !== ''
          ? `id:${row.warehouseId}`
          : `name:${(row.warehouseName || '').trim()}`;
        const code = (row.materialCode || '').trim();
        const priceNum = row.unitPrice == null || row.unitPrice === '' ? NaN : Number(row.unitPrice);
        const priceKey = Number.isFinite(priceNum) ? priceNum.toFixed(2) : 'null';
        const key = `${wh}||${code}||${priceKey}`;
        const exist = map.get(key);
        if (!exist) {
          const cloned = { ...row };
          cloned._rowKey = key;
          map.set(key, cloned);
          return;
        }
        const qty = Number(exist.materialQty || 0) + Number(row.materialQty || 0);
        const amt = Number(exist.materialAmt || 0) + Number(row.materialAmt || 0);
        exist.materialQty = qty;
        exist.materialAmt = amt;
        // 同单价合并，价格保持原值
        if (exist.unitPrice == null && row.unitPrice != null) exist.unitPrice = row.unitPrice;
        if (!exist.supplierName && row.supplierName) exist.supplierName = row.supplierName;
        if (!exist.factoryName && row.factoryName) exist.factoryName = row.factoryName;
      });
      // 净数量为 0（出退库抵消）的行不展示
      return Array.from(map.values()).filter((r) => Number(r.materialQty || 0) !== 0);
    },
    /** 查询出/退货列表 */
    getList() {
      this.loading = true;
      const queryParams = this.buildListQueryParams();
      listCTKWarehouseSummary(queryParams).then(response => {
        // 同仓库+同耗材编码+同单价兜底合并；单价不同保留分行
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        const rawRows = (response.rows || response || []).map((item, idx) => {
          const row = {
            ...item,
            unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
            materialAmt: item.materialAmt != null ? Number(item.materialAmt) : null,
            materialQty: item.materialQty != null ? Number(item.materialQty) : 0
          };
          row._rowKey = [
            pageBase + idx,
            row.warehouseId,
            row.materialCode,
            row.unitPrice
          ].map(v => (v == null ? '' : String(v))).join('|');
          return row;
        });
        this.warehouseList = this.mergeSummaryRowsByWarehouseMaterial(rawRows);
        // 确保 total 正确设置，优先使用 response.total
        if (response && response.total !== undefined && response.total !== null) {
          this.total = Number(response.total);
        } else {
          this.total = 0;
        }
        console.log('分页数据 - total:', this.total, 'rows:', this.warehouseList.length, 'response:', response);
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0 };
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
      }).catch(error => {
        console.error('获取数据失败:', error);
        this.warehouseList = [];
        this.total = 0;
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
      });
    },
    getStatDate(){
      // 当前日期往前推5天
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5);
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year + "-" + month + "-" + day;
      return statDate;
    },
    getEndDate(){
      // 当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year + "-" + month + "-" + day;
      return endDate;
    },
    /** 分页大小改变 */
    handleSizeChange(val) {
      this.$set(this.queryParams, 'pageSize', val);
      this.$set(this.queryParams, 'pageNum', 1);
      this.getList();
    },
    /** 当前页改变 */
    handleCurrentChange(val) {
      this.$set(this.queryParams, 'pageNum', val);
      this.getList();
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
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.supplerId = null;
      this.queryParams.financeCategoryKeyword = null;
      this.queryParams.warehouseCategoryKeyword = null;
      this.queryParams.financeCategoryIds = [];
      this.queryParams.warehouseCategoryIds = [];
      this.queryParams.billType = null;
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.moreSearchKeywords = {};
      this.onMoreSearchTypesChange(this.moreSearchTypes);
      this.handleQuery();
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.loadDefaults === "function") {
        return bar.loadDefaults();
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v));
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    onMoreSearchTypesChange(val) {
      const set = new Set(val || []);
      if (!set.has('warehouse')) {
        this.queryParams.warehouseId = null;
      }
      if (!set.has('department')) {
        this.queryParams.departmentId = null;
      }
      Object.keys(this.moreSearchKeywords).forEach(k => {
        if (!set.has(k)) {
          this.$delete(this.moreSearchKeywords, k);
        }
      });
      (val || []).forEach(k => {
        if (k === 'warehouse' || k === 'department') {
          return;
        }
        if (!Object.prototype.hasOwnProperty.call(this.moreSearchKeywords, k)) {
          this.$set(this.moreSearchKeywords, k, '');
        }
      });
    },
    moreSearchTypeLabel(t) {
      const map = {
        supplier: '供应商',
        factory: '生产厂家',
        materialName: '耗材',
        materialSpeci: '规格',
        materialModel: '型号',
        warehouse: '仓库',
        department: '出库科室',
        financeCategoryKeyword: '财务分类',
        warehouseCategoryKeyword: '库房分类'
      };
      return map[t] || t;
    },
    moreSearchPlaceholderFor(t) {
      const map = {
        supplier: '供应商编码/名称',
        factory: '生产厂家编码/名称/简码',
        materialName: '耗材编码/名称/简码',
        materialSpeci: '规格模糊',
        materialModel: '型号模糊',
        financeCategoryKeyword: '财务分类编码/名称/简拼',
        warehouseCategoryKeyword: '库房分类编码/名称/简拼'
      };
      return map[t] || '请输入关键字';
    },
    buildListQueryParams() {
      const queryParams = { ...this.queryParams };
      queryParams.materialNameLike = null;
      queryParams.materialSpeciLike = null;
      queryParams.materialModelLike = null;
      queryParams.supplierKeyword = null;
      queryParams.factoryKeyword = null;
      queryParams.financeCategoryKeyword = null;
      queryParams.warehouseCategoryKeyword = null;
      queryParams.supplerId = null;
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
      const types = this.moreSearchTypes || [];
      if (!types.includes('warehouse')) {
        queryParams.warehouseId = null;
      }
      if (!types.includes('department')) {
        queryParams.departmentId = null;
      }
      types.forEach(t => {
        if (t === 'warehouse' || t === 'department') {
          return;
        }
        const raw = this.moreSearchKeywords[t];
        const kw = raw != null ? String(raw).trim() : '';
        if (!kw) {
          return;
        }
        switch (t) {
          case 'supplier':
            queryParams.supplierKeyword = kw;
            queryParams.supplerId = null;
            break;
          case 'factory':
            queryParams.factoryKeyword = kw;
            break;
          case 'materialName':
            queryParams.materialNameLike = kw;
            break;
          case 'materialSpeci':
            queryParams.materialSpeciLike = kw;
            break;
          case 'materialModel':
            queryParams.materialModelLike = kw;
            break;
          case 'financeCategoryKeyword':
            queryParams.financeCategoryKeyword = kw;
            break;
          case 'warehouseCategoryKeyword':
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
    getSummaryRowKey(row) {
      return (row && row._rowKey) || [
        row && row.warehouseId,
        row && row.materialCode,
        row && row.unitPrice
      ].map(v => (v == null ? '' : String(v))).join('|');
    },
    /** 勾选行高亮；与悬停样式独立 */
    ctkSummaryRowClassName({ row }) {
      const key = this.getSummaryRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'ctk-row-selected';
      }
      return '';
    },
    /** 单据类型展示：201→出库，401→退库 */
    formatCtkBillTypeLabel(billType) {
      if (billType == null || billType === '') return '--';
      const v = String(billType);
      if (v === '201') return '出库';
      if (v === '401') return '退库';
      const opts = (this.dict && this.dict.type && (
        this.dict.type.out_warehouse_bill_type || this.dict.type.bill_type
      )) || [];
      const hit = opts.find(d => String(d.value) === v);
      if (!hit || !hit.label) return v;
      const label = String(hit.label);
      if (label.indexOf('科室领用') !== -1 || label === '领用') return '出库';
      if (label.indexOf('科室退库') !== -1 || label === '退货' || label.indexOf('退库') !== -1) return '退库';
      return label;
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const requestParams = { ...this.buildListQueryParams(), pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await listCTKWarehouseSummary(requestParams);
        const rows = this.mergeSummaryRowsByWarehouseMaterial((response.rows || []).map(item => ({
          ...item,
          unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
          materialAmt: item.materialAmt != null ? Number(item.materialAmt) : null,
          materialQty: item.materialQty != null ? Number(item.materialQty) : 0,
        })));
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
        await exportCTKWarehouseSummaryListStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `出退库汇总表${dateStr}.xlsx`,
          resolveWay,
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

<style scoped>
/* 与库存明细查询保持一致的顶部偏移 */
.app-container {
  margin-top: -10px;
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
.more-search-type {
  min-width: 220px;
  width: auto;
  max-width: 360px;
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
  margin-bottom: 2px;
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

/* 第二行：强制同一行不换行（避免宽度不足时“掉到下一行”） */
.query-row-second-inner {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  overflow-x: auto;
  overflow-y: hidden;
  width: 100%;
  gap: 4px;
  padding-bottom: 2px;
}

.query-row-second-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 8px;
  white-space: nowrap;
}

.query-row-second-inner .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.query-item-date-range .query-date-start,
.query-item-date-range .query-date-end {
  width: 150px;
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

.query-row-third {
  margin-bottom: 2px;
}

.query-row-third .el-form-item {
  margin-bottom: 0;
}
.query-row-third-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  overflow: visible;
  width: 100%;
  gap: 4px;
  padding-bottom: 2px;
}
.query-row-third-inner .el-form-item {
  flex: 0 0 auto;
  margin-bottom: 0 !important;
  margin-right: 8px;
  white-space: nowrap;
}
@media (min-width: 1680px) {
  .query-row-third-inner {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
  }
}

/* 查询条件容器框样式：由外层 inventory-query-page 统一左右 8px，此处占满内容区 */
.form-fields-container {
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
}

/* 导出/搜索/重置：与顶部搜索框、底部明细框间距均为 8px */
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
  margin-top: 8px;
  margin-bottom: 0;
  overflow: visible;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

/* 保持 Element 默认合计行行为，避免合计列错位/缺失 */
.table-container ::v-deep .ctk-summary-main-table .el-table__body-wrapper {
  padding-bottom: 0;
  overflow-x: auto !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  scrollbar-width: auto;
  scrollbar-color: #909399 #e4e7ed;
}

.table-container ::v-deep .el-table__footer-wrapper {
  position: static;
  bottom: auto;
  z-index: auto;
  background: #fff;
}

.table-container ::v-deep .el-table__fixed-footer-wrapper {
  position: static;
  bottom: auto;
  z-index: auto;
  background: #fff;
}

/* 合计行数量/金额等单元格不要自动换行，避免合计撑高 */
.table-container ::v-deep .el-table__footer-wrapper td.el-table__cell,
.table-container ::v-deep .el-table__footer-wrapper .cell {
  white-space: nowrap;
  overflow: visible;
  text-overflow: initial;
}
.table-container ::v-deep .el-table__fixed-footer-wrapper td.el-table__cell,
.table-container ::v-deep .el-table__fixed-footer-wrapper .cell {
  white-space: nowrap;
  overflow: visible;
  text-overflow: initial;
}

/* 横向滚动条：固定 16px，悬停不增粗（与明细表一致） */
.table-container ::v-deep .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 16px !important;
}
.table-container ::v-deep .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 16px !important;
}
.table-container ::v-deep .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 10px !important;
}
.table-container ::v-deep .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e4e7ed !important;
  border-radius: 4px !important;
}
.table-container ::v-deep .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 4px !important;
  border: none !important;
}
.table-container ::v-deep .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #606266 !important;
}

.table-container ::v-deep .ctk-summary-main-table .el-table__body td,
.table-container ::v-deep .ctk-summary-main-table .el-table__body td .cell {
  transition: none !important;
}

/* 优化表格列间距（略加大横向空隙，便于阅读） */
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 4px 10px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 10px !important;
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
  padding: 0 8px;
}

/* 指定列：表头居中，明细靠左 */
.table-container ::v-deep .el-table th.ctk-col-left .cell {
  text-align: center !important;
  justify-content: center !important;
}
.table-container ::v-deep .el-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
}

/* 序号列：表头与单元格内容居中 */
.table-container ::v-deep .el-table th.col-serial-center .cell,
.table-container ::v-deep .el-table td.col-serial-center .cell {
  text-align: center !important;
}

.table-container ::v-deep .col-serial-center-text {
  display: block;
  width: 100%;
  text-align: center;
}

/* 计费列：是/否标签居中 */
.table-container ::v-deep .el-table th.col-yn-center .cell,
.table-container ::v-deep .el-table td.col-yn-center .cell {
  text-align: center !important;
  justify-content: center;
}
</style>

<style>
/* 取消内层 app-container 的左右 padding，避免叠加全局 20px；左右 8px 由外层 inventory-query-page 统一控制 */
.app-container.first-inventory-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* 分页行：合计在左、翻页在右，同一行；翻页下方不留白 */
.first-inventory-page .pagination-wrapper {
  display: flex !important;
  align-items: center !important;
  flex-wrap: nowrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
}
.first-inventory-page .pagination-wrapper .pagination-summary .summary-label {
  font-weight: 700;
}
.first-inventory-page .pagination-wrapper .pagination-container {
  margin-top: 0 !important;
  margin-left: auto !important;
  padding: 4px 0 4px 16px !important;
  flex-shrink: 0;
}
.first-inventory-page .pagination-wrapper .pagination-container .el-pagination {
  padding: 2px 0 !important;
}

/* 列表「计费」列：是/否按钮式展示（与耗材档案、出退库明细一致） */
.material-yn-btn {
  display: inline-block;
  min-width: 36px;
  padding: 2px 10px;
  border-radius: 4px;
  font-size: 12px;
  line-height: 20px;
  text-align: center;
  color: #fff;
  cursor: default;
  user-select: none;
  box-sizing: border-box;
}
.material-yn-btn--yes {
  background-color: #409eff;
}
.material-yn-btn--no {
  background-color: #909399;
}

/* 出/退库汇总表：表头/悬停/勾选/选中，对齐明细表 */
.first-inventory-page .ctk-summary-main-table .el-table__header-wrapper th,
.first-inventory-page .ctk-summary-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .ctk-summary-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}
.first-inventory-page .ctk-summary-main-table th.ctk-col-left .cell {
  text-align: center !important;
  justify-content: center !important;
}
.first-inventory-page .ctk-summary-main-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
}
.first-inventory-page .ctk-summary-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}
.first-inventory-page .ctk-summary-main-table .el-table__body tr.ctk-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .ctk-summary-main-table .el-table__body tr.ctk-row-selected:hover > td {
  background-color: #A0CBFF !important;
}
.first-inventory-page .ctk-summary-main-table th.ctk-select-col,
.first-inventory-page .ctk-summary-main-table td.ctk-select-col,
.first-inventory-page .ctk-summary-main-table th.el-table-column--selection,
.first-inventory-page .ctk-summary-main-table td.el-table-column--selection {
  position: sticky;
  left: 0;
  z-index: 2;
  box-shadow: 2px 0 0 0 #e2e8f0;
}
.first-inventory-page .ctk-summary-main-table th.ctk-select-col,
.first-inventory-page .ctk-summary-main-table th.el-table-column--selection {
  z-index: 3;
  background-color: #f1f5f9;
}
.first-inventory-page .ctk-summary-main-table td.ctk-select-col,
.first-inventory-page .ctk-summary-main-table td.el-table-column--selection {
  background-color: #fff;
}
.first-inventory-page .ctk-summary-main-table .el-table__body tr.el-table__row--striped td.ctk-select-col,
.first-inventory-page .ctk-summary-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa;
}
.first-inventory-page .ctk-summary-main-table .el-table__body tr:hover > td.ctk-select-col,
.first-inventory-page .ctk-summary-main-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF;
}
.first-inventory-page .ctk-summary-main-table .el-table__body tr.ctk-row-selected > td.ctk-select-col,
.first-inventory-page .ctk-summary-main-table .el-table__body tr.ctk-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF;
}
.first-inventory-page .ctk-summary-main-table .el-table__body tr.ctk-row-selected:hover > td.ctk-select-col,
.first-inventory-page .ctk-summary-main-table .el-table__body tr.ctk-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF;
}
.first-inventory-page .ctk-summary-main-table td.ctk-select-col .cell,
.first-inventory-page .ctk-summary-main-table td.el-table-column--selection .cell,
.first-inventory-page .ctk-summary-main-table th.ctk-select-col .cell,
.first-inventory-page .ctk-summary-main-table th.el-table-column--selection .cell {
  text-align: center !important;
  justify-content: center !important;
  background: transparent;
}
.first-inventory-page .ctk-summary-main-table .el-table__body-wrapper {
  scrollbar-width: auto !important;
  scrollbar-color: #909399 #e4e7ed !important;
}
.first-inventory-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 16px !important;
}
.first-inventory-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 16px !important;
}
.first-inventory-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 4px !important;
  border: none !important;
}
.first-inventory-page .ctk-summary-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e4e7ed !important;
  border-radius: 4px !important;
}
</style>
