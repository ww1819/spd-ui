<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">

        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item class="query-item-inline more-search-item">
              <div class="more-search-row more-search-row--multi">
                <span class="more-search-label">更多检索</span>
                <el-select
                  v-model="moreSearchTypes"
                  multiple
                  collapse-tags
                  placeholder="选择检索条件（可多选）"
                  class="more-search-type"
                  @change="onMoreSearchTypesChange"
                >
                  <el-option label="供应商" value="supplier" />
                  <el-option label="生产厂家" value="factory" />
                  <el-option label="耗材" value="materialName" />
                  <el-option label="单号" value="billNo" />
                  <el-option label="规格" value="materialSpeci" />
                  <el-option label="型号" value="materialModel" />
                  <el-option label="批号" value="batchNo" />
                  <el-option label="批次号" value="batchNumber" />
                  <el-option label="仓库" value="warehouse" />
                  <el-option label="财务分类" value="financeCategoryKeyword" />
                  <el-option label="库房分类" value="warehouseCategoryKeyword" />
                </el-select>
                <div
                  v-for="t in moreSearchTypes"
                  :key="t"
                  class="more-search-dynamic-field"
                >
                  <span class="more-search-field-label">{{ moreSearchTypeLabel(t) }}</span>
                  <template v-if="t === 'warehouse'">
                    <div class="query-select-wrapper more-search-warehouse-wrap">
                      <SelectWarehouse
                        v-model="queryParams.warehouseId"
                        excludeWarehouseType="高值"
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
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item label="业务日期" class="query-item-inline query-item-date-range">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-start"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-end"
              />
            </el-form-item>

            <el-form-item label="单据类型" prop="billType" class="query-item-inline">
              <el-select v-model="queryParams.billType" placeholder="单据类型"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.in_warehouse_bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="计费" prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="计费"
                         clearable style="width: 150px">
                <el-option label="是" value="1" />
                <el-option label="否" value="0" />
              </el-select>
            </el-form-item>
            <el-form-item prop="isGz" class="query-item-inline">
              <el-select v-model="queryParams.isGz" placeholder="是否高值" clearable style="width: 130px">
                <el-option label="是" value="1" />
                <el-option label="否" value="2" />
              </el-select>
            </el-form-item>
            <el-form-item prop="financeCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper category-multi-wrap">
                <SelectFinanceCategoryLow v-model="queryParams.financeCategoryIds" :multiple="true" placeholder="财务分类多选" />
              </div>
            </el-form-item>
            <el-form-item prop="warehouseCategoryIds" class="query-item-inline">
              <div class="query-select-wrapper category-multi-wrap">
                <SelectWarehouseCategoryLow v-model="queryParams.warehouseCategoryIds" :multiple="true" placeholder="库房分类多选" />
              </div>
            </el-form-item>
          </el-col>
        </el-row>

      </el-form>
    </div>

    <el-row :gutter="10" class="mb8 button-row-inventory button-row-inventory-flex">
      <div class="button-row-left">
        <el-button
          type="warning"
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
        >导出</el-button>
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </div>
      <div class="button-row-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" :columns="columns"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
      <el-table v-loading="loading" :data="displayData"
                height="60vh"
                border
                stripe
                style="width: 100%">
      <el-table-column label="序号" width="80" align="center" header-align="center" class-name="col-serial-center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span class="col-serial-center-text">{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="145" min-width="130" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode" v-if="columns[0].visible"/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="185" min-width="170" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" v-if="columns[1].visible"/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="130" min-width="110" show-overflow-tooltip resizable sortable :sort-method="sortByWarehouse" v-if="columns[2].visible"/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="200" min-width="180" show-overflow-tooltip resizable sortable :sort-method="sortBySupplier" v-if="columns[3].visible"/>
      <el-table-column label="业务单号" align="center" prop="billNo" width="200" min-width="180" show-overflow-tooltip resizable sortable :sort-method="sortByBillNo" v-if="columns[4].visible" />
      <el-table-column label="业务日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable v-if="columns[5].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>

      <el-table-column label="型号" align="center" prop="materialModel" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByModel" v-if="columns[6].visible"/>

      <el-table-column label="规格" align="center" prop="materialSpeci" width="110" min-width="100" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci" v-if="columns[7].visible"/>
      <el-table-column label="单位" align="center" prop="unitName" width="100" min-width="90" show-overflow-tooltip resizable sortable :sort-method="sortByUnitName" v-if="columns[8].visible"/>
      <el-table-column label="价格" align="center" prop="unitPrice" width="130" min-width="120" class-name="col-in-sum-price" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice" v-if="columns[10].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="120" class-name="col-in-sum-qty" show-overflow-tooltip resizable v-if="columns[11].visible">
        <template slot-scope="scope">
          {{ scope.row.materialQty }}
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable v-if="columns[12].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批号" align="center" prop="batchNumber" width="80" show-overflow-tooltip resizable v-if="columns[14].visible"/>
      <el-table-column label="生产日期" align="center" prop="beginDate" width="180" show-overflow-tooltip resizable v-if="columns[15].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endDate" width="180" show-overflow-tooltip resizable v-if="columns[16].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产厂家" align="center" prop="factoryName" width="120" show-overflow-tooltip resizable v-if="columns[9].visible"/>
      <el-table-column label="批次" align="center" prop="batchNo" width="220" show-overflow-tooltip resizable v-if="columns[13].visible"/>

      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable v-if="columns[17].visible"/>
      <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable v-if="columns[18].visible"/>
      <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable v-if="columns[19].visible"/>
      <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable v-if="columns[20].visible"/>
      <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable v-if="columns[21].visible">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
        </template>
      </el-table-column>
      <el-table-column label="计费" align="center" prop="material.isBilling" width="80" show-overflow-tooltip resizable v-if="columns[22].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1)">是</span>
          <span v-else-if="scope.row.material && (scope.row.material.isBilling === '0' || scope.row.material.isBilling === 0 || scope.row.material.isBilling === '2')">否</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="180" show-overflow-tooltip resizable v-if="columns[23].visible">
        <template slot-scope="scope">
          <span>{{ scope.row.remark || (scope.row.material && scope.row.material.remark) || '--' }}</span>
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
import { listRTHWarehouse} from "@/api/warehouse/warehouse";
import { exportRTHWarehouseDetailStyledXlsx } from "@/utils/departmentOutSummaryExport";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectFinanceCategoryLow from '@/components/SelectModel/SelectFinanceCategoryLow';
import SelectWarehouseCategoryLow from '@/components/SelectModel/SelectWarehouseCategoryLow';
import RightToolbar from "@/components/RightToolbar";

export default {
  name: "firstQuery",
  dicts: ['biz_status','bill_type','in_warehouse_bill_type','way_status'],
  components: { SelectWarehouse, SelectFinanceCategoryLow, SelectWarehouseCategoryLow, RightToolbar },
  data() {
      return {
        // 遮罩层
        loading: true,
        DialogComponentShow: false,
        isShow: true,
        // 选中数组
        ids: [],
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
        // 入/退货表格数据
        warehouseList: [],
        displayData: [],
        totalInfo: {
          totalAmt: 0,
          totalQty: 0
        },
      stkMaterialList: [],
        // 入/退货明细表格数据
      stkIoBillEntryList: [],
      /** 更多检索：已选检索维度（多选） */
      moreSearchTypes: [],
      /** 各维度关键字，键与 moreSearchTypes 取值一致 */
      moreSearchKeywords: {},
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
        batchNo: null,
        batchNumberKeyword: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        isBilling: null,
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
        { key: 0, label: `耗材编码`, visible: true },
        { key: 1, label: `耗材名称`, visible: true },
        { key: 2, label: `仓库`, visible: true },
        { key: 3, label: `供应商`, visible: true },
        { key: 4, label: `业务单号`, visible: true },
        { key: 5, label: `业务日期`, visible: true },
        { key: 6, label: `型号`, visible: true },
        { key: 7, label: `规格`, visible: true },
        { key: 8, label: `单位`, visible: true },
        { key: 9, label: `生产厂家`, visible: true },
        { key: 10, label: `价格`, visible: true },
        { key: 11, label: `数量`, visible: true },
        { key: 12, label: `金额`, visible: true },
        { key: 13, label: `批次`, visible: true },
        { key: 14, label: `批号`, visible: true },
        { key: 15, label: `生产日期`, visible: true },
        { key: 16, label: `有效期`, visible: true },
        { key: 17, label: `注册证号`, visible: true },
        { key: 18, label: `包装规格`, visible: true },
        { key: 19, label: `库房分类`, visible: true },
        { key: 20, label: `财务分类`, visible: true },
        { key: 21, label: `储存方式`, visible: true },
        { key: 22, label: `计费`, visible: true },
        { key: 23, label: `备注`, visible: true }
      ]
    };
  },
  computed: {
    pageTotalQty() {
      return (this.displayData || []).reduce((s, r) => s + Number(r.materialQty || 0), 0);
    },
    pageTotalAmtFormatted() {
      const amt = (this.displayData || []).reduce((s, r) => s + Number(r.materialAmt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询入/退货列表 */
    getList() {
      this.loading = true;
      const queryParams = this.buildListQueryParams();
      listRTHWarehouse(queryParams).then(response => {
        this.warehouseList = response.rows || [];
        this.total = response.total != null ? Number(response.total) : 0;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0 };
        this.displayData = this.warehouseList.map(item => ({
          ...item,
          unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
          materialQty: item.materialQty != null ? Number(item.materialQty) : 0,
          materialAmt: item.materialAmt != null ? Number(item.materialAmt) : 0
        }));
        this.loading = false;
      }).catch(() => {
        this.warehouseList = [];
        this.displayData = [];
        this.total = 0;
        this.totalInfo = { totalAmt: 0, totalQty: 0 };
        this.loading = false;
      });
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
    sortByWarehouse(a, b) { return this.sortByStr(a, b, r => r.warehouseName || ''); },
    sortBySupplier(a, b) { return this.sortByStr(a, b, r => r.supplierName || ''); },
    sortByBillNo(a, b) { return this.sortByStr(a, b, r => r.billNo || ''); },
    sortBySpeci(a, b) { return this.sortByStr(a, b, r => r.materialSpeci || ''); },
    sortByModel(a, b) { return this.sortByStr(a, b, r => r.materialModel || ''); },
    sortByUnitName(a, b) { return this.sortByStr(a, b, r => r.unitName || ''); },
    sortByUnitPrice(a, b) { return this.sortByNum(a, b, 'unitPrice'); },
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
      this.queryParams.billNo = null;
      this.queryParams.materialNameLike = null;
      this.queryParams.materialSpeciLike = null;
      this.queryParams.materialModelLike = null;
      this.queryParams.supplierKeyword = null;
      this.queryParams.batchNo = null;
      this.queryParams.batchNumberKeyword = null;
      this.queryParams.warehouseId = null;
      this.queryParams.financeCategoryIds = [];
      this.queryParams.warehouseCategoryIds = [];
      this.queryParams.financeCategoryKeyword = null;
      this.queryParams.warehouseCategoryKeyword = null;
      this.moreSearchTypes = [];
      this.moreSearchKeywords = {};
      this.handleQuery();
    },
    handleSizeChange(val) {
      this.queryParams.pageSize = val;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleCurrentChange(val) {
      this.queryParams.pageNum = val;
      this.getList();
    },
    onMoreSearchTypesChange(val) {
      const set = new Set(val || []);
      if (!set.has("warehouse")) {
        this.queryParams.warehouseId = null;
      }
      Object.keys(this.moreSearchKeywords).forEach(k => {
        if (!set.has(k)) {
          this.$delete(this.moreSearchKeywords, k);
        }
      });
      (val || []).forEach(k => {
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
        supplier: "供应商",
        factory: "生产厂家",
        materialName: "耗材",
        billNo: "单号",
        materialSpeci: "规格",
        materialModel: "型号",
        batchNo: "批号",
        batchNumber: "批次号",
        warehouse: "仓库",
        financeCategoryKeyword: "财务分类",
        warehouseCategoryKeyword: "库房分类"
      };
      return map[t] || t;
    },
    moreSearchPlaceholderFor(t) {
      const map = {
        supplier: "供应商编码/名称",
        factory: "生产厂家编码/名称/简码",
        materialName: "耗材编码/名称/简码",
        billNo: "业务单号模糊",
        materialSpeci: "规格模糊",
        materialModel: "型号模糊",
        batchNo: "入库明细批号(batch_no)",
        batchNumber: "入库明细批次号(batch_number)",
        financeCategoryKeyword: "财务分类编码/名称/简拼",
        warehouseCategoryKeyword: "库房分类编码/名称/简拼"
      };
      return map[t] || "请输入关键字";
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出：与出/退库汇总(供应商)相同版式（xlsx、宋体、标题、表头加粗、空行、合计红色） */
    async handleExport() {
      const queryParams = this.buildListQueryParams();
      const requestParams = { ...queryParams, pageNum: 1, pageSize: 10000 };
      this.loading = true;
      try {
        const response = await listRTHWarehouse(requestParams);
        const rows = (response.rows || []).map(item => ({
          ...item,
          unitPrice: item.unitPrice != null ? Number(item.unitPrice) : null,
          materialQty: item.materialQty != null ? Number(item.materialQty) : 0,
          materialAmt: item.materialAmt != null ? Number(item.materialAmt) : 0,
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
        await exportRTHWarehouseDetailStyledXlsx({
          rows,
          beginDate: this.queryParams.beginDate || '',
          endDate: this.queryParams.endDate || this.queryParams.beginDate || '',
          fileName: `入退货明细表${dateStr}.xlsx`,
          resolveWay,
        });
      } catch (e) {
        console.error(e);
        this.$message && this.$message.error('导出失败，请稍后重试');
      } finally {
        this.loading = false;
      }
    },
    buildListQueryParams() {
      const queryParams = { ...this.queryParams };
      if (!queryParams.beginDate || queryParams.beginDate === '') {
        queryParams.beginDate = null;
      }
      if (!queryParams.endDate || queryParams.endDate === '') {
        queryParams.endDate = null;
      } else if (queryParams.endDate && queryParams.endDate.length === 10) {
        queryParams.endDate = `${queryParams.endDate} 23:59:59`;
      }
      if (Array.isArray(queryParams.financeCategoryIds) && queryParams.financeCategoryIds.length === 0) {
        queryParams.financeCategoryIds = null;
      }
      if (Array.isArray(queryParams.warehouseCategoryIds) && queryParams.warehouseCategoryIds.length === 0) {
        queryParams.warehouseCategoryIds = null;
      }
      const types = this.moreSearchTypes || [];
      if (!types.includes("warehouse")) {
        queryParams.warehouseId = null;
      }
      types.forEach(t => {
        if (t === "warehouse") {
          return;
        }
        const raw = this.moreSearchKeywords[t];
        const kw = raw != null ? String(raw).trim() : "";
        if (!kw) {
          return;
        }
        switch (t) {
          case "supplier":
            queryParams.supplierKeyword = kw;
            break;
          case "factory":
            queryParams.factoryKeyword = kw;
            break;
          case "materialName":
            queryParams.materialNameLike = kw;
            break;
          case "billNo":
            queryParams.billNo = kw;
            break;
          case "materialSpeci":
            queryParams.materialSpeciLike = kw;
            break;
          case "materialModel":
            queryParams.materialModelLike = kw;
            break;
          case "batchNo":
            queryParams.batchNo = kw;
            break;
          case "batchNumber":
            queryParams.batchNumberKeyword = kw;
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
  }
};
</script>

<style>
/* 与出/退库明细、库存明细一致：内层不叠加左右 padding */
.app-container.first-inventory-page {
  padding-left: 0 !important;
  padding-right: 0 !important;
}

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
</style>

<style scoped>
.app-container {
  margin-top: -10px;
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
.query-row-second-inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  overflow: visible;
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
@media (min-width: 1680px) {
  .query-row-second-inner {
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
  }
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

.form-fields-container {
  background: #fff;
  padding: 6px 8px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 8px;
  margin-top: -20px;
  margin-left: 0;
  margin-right: 0;
  border: 1px solid #EBEEF5;
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
  margin-top: 8px;
  margin-bottom: 0;
  overflow-x: auto;
  overflow-y: visible;
  width: 100%;
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

/* 表体区域横向滚动：底部滚动条不被其它层挡住 */
.table-container ::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  padding-bottom: 10px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 10px;
  width: 10px;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 4px;
  margin: 0 2px;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #909399;
  border-radius: 4px;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #606266;
}

.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}
.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table th.col-serial-center .cell,
.table-container ::v-deep .el-table td.col-serial-center .cell {
  text-align: center !important;
}

.table-container ::v-deep .col-serial-center-text {
  display: block;
  width: 100%;
  text-align: center;
}
</style>
