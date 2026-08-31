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

            <el-form-item label="单据类型" prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="单据类型"
                         clearable class="more-search-select-wrap">
                <el-option v-for="dict in dict.type.out_warehouse_bill_type"
                           :key="dict.value"
                           :label="formatCtkBillTypeLabel(dict.value)"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item prop="isGz" class="query-item-inline">
              <el-select v-model="queryParams.isGz" placeholder="是否高值" clearable class="more-search-short-select">
                <el-option label="是" value="1" />
                <el-option label="否" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item prop="financeCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectFinanceCategoryLow v-model="queryParams.financeCategoryIds" :multiple="true" placeholder="财务分类多选" />
              </div>
            </el-form-item>
            <el-form-item prop="materialIsProcure" class="query-item-inline">
              <el-select v-model="queryParams.materialIsProcure" placeholder="集采" clearable class="more-search-short-select">
                <el-option label="是" value="1" />
                <el-option label="否" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item prop="warehouseCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper more-search-select-wrap">
                <SelectWarehouseCategoryLow v-model="queryParams.warehouseCategoryIds" :multiple="true" placeholder="库房分类多选" />
              </div>
            </el-form-item>
            <el-form-item prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="计费"
                         clearable class="more-search-short-select">
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
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
        <el-tooltip content="单表导出，列布局与枣强出退库明细表一致（后端生成 xlsx，不按供应商拆分）" placement="top">
          <el-button
            size="small"
            class="spd-btn spd-btn--secondary"
            @click="handleExportOverall"
            v-hasPermi="['outWarehouse:outWarehouseQuery:exportOverall']"
          >整体导出</el-button>
        </el-tooltip>
        <el-tooltip content="出退库明细表（按供应商、名称、规格、单价）：每供应商一段，七列简表；逐行明细不合并，仅段末合计数量与金额" placement="top">
          <el-button
            size="small"
            class="spd-btn spd-btn--secondary"
            @click="handleExportSupplierSimple"
          >简表(供应商)</el-button>
        </el-tooltip>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
    <el-table
      ref="ctkDetailTable"
      class="ctk-detail-main-table"
      v-loading="loading"
      :data="warehouseList"
      :row-key="getDetailRowKey"
      :row-class-name="ctkDetailRowClassName"
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
      <el-table-column label="单据类型" align="center" header-align="center" prop="billType" width="100" show-overflow-tooltip resizable class-name="col-serial-center">
        <template slot-scope="scope">
          <span>{{ formatCtkBillTypeLabel(scope.row.billType) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="left" header-align="center" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode" class-name="ctk-col-left"/>
      <el-table-column label="耗材名称" align="left" header-align="center" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" class-name="ctk-col-left"/>
      <el-table-column label="规格" align="left" header-align="center" prop="materialSpeci" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci" class-name="ctk-col-left"/>
      <el-table-column label="型号" align="left" header-align="center" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByModel" class-name="ctk-col-left"/>
      <el-table-column label="单位" align="left" header-align="center" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByUnitName" class-name="ctk-col-left"/>
      <el-table-column label="数量" align="center" prop="materialQty" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialQty">
        <template slot-scope="scope">
          <span v-if="scope.row.materialQty !== null && scope.row.materialQty !== undefined">{{ formatQty(scope.row.materialQty) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" prop="unitPrice" width="130" min-width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice !== null && scope.row.unitPrice !== undefined">{{ formatPrice(scope.row.unitPrice) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt !== null && scope.row.materialAmt !== undefined">{{ formatAmount(scope.row.materialAmt) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批号" align="left" header-align="center" prop="batchNumber" width="100" show-overflow-tooltip resizable class-name="ctk-col-left"/>
      <el-table-column label="生产日期" align="left" header-align="center" prop="beginDate" width="120" show-overflow-tooltip resizable class-name="ctk-col-left">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="left" header-align="center" prop="endDate" width="120" show-overflow-tooltip resizable class-name="ctk-col-left">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="left" header-align="center" prop="factoryName" width="180" min-width="160" show-overflow-tooltip resizable sortable :sort-method="sortByFactory" class-name="ctk-col-left"/>
      <el-table-column label="供应商" align="left" header-align="center" prop="supplierName" width="200" min-width="180" show-overflow-tooltip resizable sortable :sort-method="sortBySupplier" class-name="ctk-col-left">
        <template slot-scope="scope">
          <span>{{ scope.row.supplierName || (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="left" header-align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable class-name="ctk-col-left"/>
      <el-table-column label="科室" align="left" header-align="center" prop="departmentName" width="120" show-overflow-tooltip resizable class-name="ctk-col-left"/>
      <el-table-column label="业务单号" align="center" prop="billNo" width="160" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="createTime" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNickName" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createrNickName || scope.row.createrUserName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditNickName" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.auditNickName || scope.row.auditUserName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="批次" align="left" header-align="center" prop="batchNo" width="220" show-overflow-tooltip resizable class-name="ctk-col-left">
        <template slot-scope="scope">
          <span>{{ scope.row.batchNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="left" header-align="center" prop="material.registerNo" width="140" show-overflow-tooltip resizable class-name="ctk-col-left"/>
      <el-table-column label="包装规格" align="left" header-align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable class-name="ctk-col-left"/>
      <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag v-if="scope.row.material" :options="dict.type.way_status" :value="scope.row.material.isWay"/>
          <span v-else>--</span>
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
      <el-table-column label="集采" align="center" header-align="center" width="90" class-name="col-yn-center" resizable>
        <template slot-scope="scope">
          <span v-if="formatProcureYesNo(scope.row) === '--'">--</span>
          <span
            v-else
            class="material-yn-btn"
            :class="isProcureYes(scope.row) ? 'material-yn-btn--yes' : 'material-yn-btn--no'"
          >{{ formatProcureYesNo(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.remark || (scope.row.material && scope.row.material.remark) || '--' }}</span>
        </template>
      </el-table-column>
    </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ formatQty(totalInfo.totalQty) }}，总金额: {{ formatAmount(totalInfo.totalAmt) }}，当前页数量: {{ pageTotalQtyFormatted }}，当前页金额: {{ pageTotalAmtFormatted }}
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
import { listCTKWarehouse} from "@/api/warehouse/outWarehouse";
import { formatQuantity } from '@/utils/format-quantity'
import { formatAmount as formatAmountByTenant, formatPrice as formatPriceByTenant } from '@/utils/moneyFormat'
import { exportCTKWarehouseDetailStyledXlsx, exportCTKWarehouseDetailSupplierSimpleXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectFinanceCategoryLow from '@/components/SelectModel/SelectFinanceCategoryLow';
import SelectWarehouseCategoryLow from '@/components/SelectModel/SelectWarehouseCategoryLow';
import RightToolbar from "@/components/RightToolbar";

import SelectInventory from '@/components/SelectModel/SelectInventory';

export default {
  name: "firstOutQuery",
  dicts: ['biz_status','bill_type','out_warehouse_bill_type','way_status'],
  components: {SelectWarehouse,SelectDepartment,SelectUser,SelectFinanceCategoryLow,SelectWarehouseCategoryLow,RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      isShow: true,
      // 选中数组
      ids: [],
      // 当前页勾选行的 rowKey，用于整行选中高亮
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
        { value: "billNo", label: "单号" },
        { value: "materialSpeci", label: "规格" },
        { value: "materialModel", label: "型号" },
        { value: "batchNo", label: "批号" },
        { value: "batchNumber", label: "批次号" },
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
        batchNo: null,
        batchNumberKeyword: null,
        financeCategoryKeyword: null,
        warehouseCategoryKeyword: null,
        isGz: null,
        isBilling: null,
        materialIsProcure: null,
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
      return "spd.outWarehouse.query.first.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return [];
    },
    /** 当前页数量合计 */
    pageTotalQty() {
      return (this.warehouseList || []).reduce((s, r) => s + Number(r.materialQty || 0), 0);
    },
    pageTotalQtyFormatted() {
      return this.formatQty(this.pageTotalQty);
    },
    /** 当前页金额合计（格式化） */
    pageTotalAmtFormatted() {
      const amt = (this.warehouseList || []).reduce((s, r) => s + Number(r.materialAmt || 0), 0);
      return this.formatAmount(amt);
    },
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange(this.moreSearchTypes);
    this.getList();
  },
  methods: {
    formatNumber(value, scale) {
      const num = Number(value);
      if (Number.isNaN(num)) {
        return (0).toFixed(scale);
      }
      return num.toFixed(scale);
    },
    formatQty(value) {
      return formatQuantity(value)
    },
    formatPrice(value) {
      return formatPriceByTenant(value, '0');
    },
    formatAmount(value) {
      return formatAmountByTenant(value, '0');
    },
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
    formatProcureYesNo(row) {
      const v = row && row.material ? row.material.isProcure : null;
      if (v === '1' || v === 1) return '是';
      if (v === '2' || v === 2) return '否';
      return '--';
    },
    isProcureYes(row) {
      const v = row && row.material ? row.material.isProcure : null;
      return v === '1' || v === 1;
    },
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
    /** 查询出/退货列表 */
    getList() {
      this.loading = true;
      const queryParams = this.buildListQueryParams();
      listCTKWarehouse(queryParams).then(response => {
        const rows = response.rows || response || [];
        const pageBase = ((this.queryParams.pageNum || 1) - 1) * (this.queryParams.pageSize || 10);
        this.warehouseList = (rows || []).map((row, idx) => {
          if (row && row._rowKey == null) {
            row._rowKey = `${pageBase + idx}_${row.id || ''}_${row.billNo || ''}_${row.materialCode || ''}`;
          }
          return row;
        });
        // 确保 total 正确设置，优先使用 response.total
        if (response && response.total !== undefined && response.total !== null) {
          this.total = Number(response.total);
        } else {
          this.total = 0;
        }
        console.log('分页数据 - total:', this.total, 'rows:', this.warehouseList.length, 'pageNum:', this.queryParams.pageNum, 'pageSize:', this.queryParams.pageSize, 'response:', response);
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0 };
        this.selectedRowKeys = [];
        this.ids = [];
        this.loading = false;
      }).catch(error => {
        console.error('获取数据失败:', error);
        this.warehouseList = [];
        this.total = 0;
        this.totalInfo = { totalAmt: 0, totalQty: 0 };
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
      this.queryParams.batchNo = null;
      this.queryParams.batchNumberKeyword = null;
      this.queryParams.billNo = null;
      this.queryParams.warehouseId = null;
      this.queryParams.departmentId = null;
      this.queryParams.supplerId = null;
      this.queryParams.financeCategoryKeyword = null;
      this.queryParams.warehouseCategoryKeyword = null;
      this.queryParams.financeCategoryIds = [];
      this.queryParams.warehouseCategoryIds = [];
      this.queryParams.materialIsProcure = null;
      this.queryParams.isBilling = null;
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
        billNo: '单号',
        materialSpeci: '规格',
        materialModel: '型号',
        batchNo: '批号',
        batchNumber: '批次号',
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
        billNo: '业务单号',
        materialSpeci: '规格模糊',
        materialModel: '型号模糊',
        batchNo: '批号模糊',
        batchNumber: '批次号模糊',
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
      queryParams.batchNo = null;
      queryParams.batchNumberKeyword = null;
      queryParams.billNo = null;
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
          case 'billNo':
            queryParams.billNo = kw;
            break;
          case 'materialSpeci':
            queryParams.materialSpeciLike = kw;
            break;
          case 'materialModel':
            queryParams.materialModelLike = kw;
            break;
          case 'batchNo':
            queryParams.batchNo = kw;
            break;
          case 'batchNumber':
            queryParams.batchNumberKeyword = kw;
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
      this.selectedRowKeys = (selection || []).map(row => this.getDetailRowKey(row))
    },
    getDetailRowKey(row) {
      return (row && row._rowKey) || (row && row.id) || '';
    },
    /**
     * 出/退库明细「单据类型」展示：
     * 科室领用(201)→出库，科室退库(401)→退库；其余走字典原文
     */
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
    /** 勾选行高亮 class；与悬停样式独立 */
    ctkDetailRowClassName({ row }) {
      const key = this.getDetailRowKey(row);
      if (key && this.selectedRowKeys.indexOf(key) !== -1) {
        return 'ctk-row-selected';
      }
      return '';
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 与列表筛选一致，拉取导出用全量（最多 10000 条） */
    buildCTKExportRequestParams() {
      return { ...this.buildListQueryParams(), pageNum: 1, pageSize: 10000 };
    },
    /** 导出：按供应商分段，每段标题「供应商+出/退库明细+日期」、全列表头、明细、空行、合计数量/金额（红色） */
    async handleExport() {
      const requestParams = this.buildCTKExportRequestParams();
      this.loading = true;
      try {
        const response = await listCTKWarehouse(requestParams);
        const rows = response.rows || [];
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
        await exportCTKWarehouseDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `出退库明细表${dateStr}.xlsx`,
          resolveWay,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    /** 出退库明细简表（按供应商）：七列版式，逐行明细，每供应商段末合计 */
    async handleExportSupplierSimple() {
      const requestParams = this.buildCTKExportRequestParams();
      this.loading = true;
      try {
        const response = await listCTKWarehouse(requestParams);
        const rows = response.rows || [];
        if (!rows.length) {
          this.$message && this.$message.warning('暂无数据可导出');
          return;
        }
        const now = new Date();
        const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
        await exportCTKWarehouseDetailSupplierSimpleXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `出退库明细_供方名称规格单价_${dateStr}.xlsx`,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    /** 整体导出：POST /warehouse/rthWarehouse/exportCTKOverall，与后端枣强样式单表一致 */
    handleExportOverall() {
      const queryParams = this.buildListQueryParams();
      delete queryParams.pageNum;
      delete queryParams.pageSize;
      Object.keys(queryParams).forEach(key => {
        if (queryParams[key] === '') {
          queryParams[key] = null;
        }
      });
      const b = queryParams.beginDate || '';
      const e = (queryParams.endDate && String(queryParams.endDate).length >= 10)
        ? String(queryParams.endDate).substring(0, 10)
        : (queryParams.endDate || '');
      this.download('warehouse/rthWarehouse/exportCTKOverall', queryParams,
        `出退库明细_统计时间${b}至${e}_${new Date().getTime()}.xlsx`);
    },
    /** 分页大小改变 */
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 当前页改变 */
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    },
  }
};
</script>

<style scoped>
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
  width: 190px;
  min-width: 190px;
  max-width: 190px;
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
  min-width: 0;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

/* 表内合计行已关闭；全量/当前页合计见下方 pagination-summary */
.table-container ::v-deep .ctk-detail-main-table .el-table__body-wrapper {
  padding-bottom: 0;
  overflow-x: auto !important;
  overflow-y: auto !important;
  overscroll-behavior: contain;
  /* 不用 translateZ/will-change：会与固定列合成层冲突，加重上下滑动延迟 */
  scrollbar-width: auto;
  scrollbar-color: #909399 #e4e7ed;
}

/* 表格滚动条：横向加粗固定尺寸，悬停只变色不增粗 */
.table-container ::v-deep .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 16px !important;
}
.table-container ::v-deep .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 16px !important;
}
.table-container ::v-deep .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:vertical {
  width: 10px !important;
}

.table-container ::v-deep .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e4e7ed !important;
  border-radius: 4px !important;
}

.table-container ::v-deep .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 4px !important;
  border: none !important;
  min-height: 24px;
}

.table-container ::v-deep .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #606266 !important;
}

.table-container ::v-deep .ctk-detail-main-table .el-table__body td,
.table-container ::v-deep .ctk-detail-main-table .el-table__body td .cell {
  transition: none !important;
}

/* 优化表格列间距（与科室库存明细等 first-inventory-page 表头高度一致） */
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
  justify-content: center;
}

.table-container ::v-deep .col-serial-center-text {
  display: block;
  width: 100%;
  text-align: center;
}

/* 计费、集采列：是/否标签居中 */
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
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
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

/* 列表「计费」「集采」列：是/否按钮式展示（与耗材档案一致） */
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
  flex-wrap: wrap !important;
  gap: 12px !important;
  margin-top: 0 !important;
  padding-bottom: 0 !important;
  margin-bottom: 0 !important;
}
.first-inventory-page .pagination-wrapper .pagination-summary {
  flex-shrink: 0;
  font-size: 14px;
  color: #606266;
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

/* 出/退库明细表：表头/悬停对齐耗材产品维护；勾选列轻量 sticky（避免 Element fixed 纵滑同步卡顿） */
.first-inventory-page .ctk-detail-main-table .el-table__header-wrapper th,
.first-inventory-page .ctk-detail-main-table .el-table__header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-right-color: #e2e8f0 !important;
  border-bottom-color: #e2e8f0 !important;
  height: 34px !important;
}
.first-inventory-page .ctk-detail-main-table .el-table__header th.gutter {
  background-color: #f1f5f9 !important;
}

/* 指定文本列：表头居中、明细靠左 */
.first-inventory-page .ctk-detail-main-table th.ctk-col-left .cell {
  text-align: center !important;
  justify-content: center !important;
}
.first-inventory-page .ctk-detail-main-table td.ctk-col-left .cell {
  text-align: left !important;
  justify-content: flex-start !important;
}

.first-inventory-page .ctk-detail-main-table .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}

/* 勾选选中行常驻变色；取消勾选后恢复；不覆盖未选中行的悬停 */
.first-inventory-page .ctk-detail-main-table .el-table__body tr.ctk-row-selected > td {
  background-color: #B8DAFF !important;
}
.first-inventory-page .ctk-detail-main-table .el-table__body tr.ctk-row-selected:hover > td {
  background-color: #A0CBFF !important;
}

/* 勾选列：仅 sticky 定位 + 轻阴影，不强制覆盖斑马纹/悬停背景（减少纵滑重绘） */
.first-inventory-page .ctk-detail-main-table th.ctk-select-col,
.first-inventory-page .ctk-detail-main-table td.ctk-select-col,
.first-inventory-page .ctk-detail-main-table th.el-table-column--selection,
.first-inventory-page .ctk-detail-main-table td.el-table-column--selection {
  position: sticky;
  left: 0;
  z-index: 2;
  box-shadow: 2px 0 0 0 #e2e8f0;
}
.first-inventory-page .ctk-detail-main-table th.ctk-select-col,
.first-inventory-page .ctk-detail-main-table th.el-table-column--selection {
  z-index: 3;
  background-color: #f1f5f9;
}
/* 默认白底，保证横滑时不被后面列透出；悬停交给上面的 tr:hover */
.first-inventory-page .ctk-detail-main-table td.ctk-select-col,
.first-inventory-page .ctk-detail-main-table td.el-table-column--selection {
  background-color: #fff;
}
.first-inventory-page .ctk-detail-main-table .el-table__body tr.el-table__row--striped td.ctk-select-col,
.first-inventory-page .ctk-detail-main-table .el-table__body tr.el-table__row--striped td.el-table-column--selection {
  background-color: #fafafa;
}
.first-inventory-page .ctk-detail-main-table .el-table__body tr:hover > td.ctk-select-col,
.first-inventory-page .ctk-detail-main-table .el-table__body tr:hover > td.el-table-column--selection {
  background-color: #D6EBFF;
}
.first-inventory-page .ctk-detail-main-table .el-table__body tr.ctk-row-selected > td.ctk-select-col,
.first-inventory-page .ctk-detail-main-table .el-table__body tr.ctk-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF;
}
.first-inventory-page .ctk-detail-main-table .el-table__body tr.ctk-row-selected:hover > td.ctk-select-col,
.first-inventory-page .ctk-detail-main-table .el-table__body tr.ctk-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF;
}
.first-inventory-page .ctk-detail-main-table td.ctk-select-col .cell,
.first-inventory-page .ctk-detail-main-table td.el-table-column--selection .cell,
.first-inventory-page .ctk-detail-main-table th.ctk-select-col .cell,
.first-inventory-page .ctk-detail-main-table th.el-table-column--selection .cell {
  text-align: center !important;
  justify-content: center !important;
  background: transparent;
}

/* 横向滚动条加粗（非 scoped，避免被全局 thin 覆盖） */
.first-inventory-page .ctk-detail-main-table .el-table__body-wrapper {
  scrollbar-width: auto !important;
  scrollbar-color: #909399 #e4e7ed !important;
}
.first-inventory-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar {
  width: 10px !important;
  height: 16px !important;
}
.first-inventory-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 16px !important;
}
.first-inventory-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399 !important;
  border-radius: 4px !important;
  border: none !important;
}
.first-inventory-page .ctk-detail-main-table .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e4e7ed !important;
  border-radius: 4px !important;
}
</style>
