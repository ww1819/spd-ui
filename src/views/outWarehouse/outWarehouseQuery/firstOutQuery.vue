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
                  <el-option label="出库科室" value="department" />
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
                  <template v-else-if="t === 'department'">
                    <div class="query-select-wrapper more-search-warehouse-wrap">
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
                <el-option v-for="dict in dict.type.out_warehouse_bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
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
        <el-tooltip content="单表导出，列布局与枣强出退库明细表一致（后端生成 xlsx，不按供应商拆分）" placement="top">
          <el-button
            type="warning"
            plain
            icon="el-icon-document"
            size="medium"
            @click="handleExportOverall"
            v-hasPermi="['outWarehouse:outWarehouseQuery:exportOverall']"
          >整体导出</el-button>
        </el-tooltip>
        <el-tooltip content="出退库明细表（按供应商、名称、规格、单价）：每供应商一段，七列简表；逐行明细不合并，仅段末合计数量与金额" placement="top">
          <el-button
            type="warning"
            plain
            icon="el-icon-download"
            size="medium"
            @click="handleExportSupplierSimple"
          >简表(供应商)</el-button>
        </el-tooltip>
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
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="table-container">
    <el-table v-loading="loading" :data="warehouseList"
              @selection-change="handleSelectionChange" height="60vh" border stripe>
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="业务单号" align="center" prop="billNo" width="160" show-overflow-tooltip resizable />
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createrNickName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.createrNickName || scope.row.createrUserName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditNickName" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.auditNickName || scope.row.auditUserName || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="型号" align="center" prop="materialModel" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="价格" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice !== null && scope.row.unitPrice !== undefined">{{ formatAmount(scope.row.unitPrice) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialQty !== null && scope.row.materialQty !== undefined">{{ formatQty(scope.row.materialQty) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt !== null && scope.row.materialAmt !== undefined">{{ formatAmount(scope.row.materialAmt) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批次" align="center" prop="batchNo" width="220" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.batchNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="批号" align="center" prop="batchNumber" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="生产日期" align="center" prop="beginDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="生产厂家" align="center" prop="factoryName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ scope.row.supplierName || (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
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
      return formatQuantity(value, 2)
    },
    formatAmount(value) {
      return this.formatNumber(value, 4);
    },
    /** 查询出/退货列表 */
    getList() {
      this.loading = true;
      const queryParams = this.buildListQueryParams();
      listCTKWarehouse(queryParams).then(response => {
        this.warehouseList = response.rows || response || [];
        // 确保 total 正确设置，优先使用 response.total
        if (response && response.total !== undefined && response.total !== null) {
          this.total = Number(response.total);
        } else {
          this.total = 0;
        }
        console.log('分页数据 - total:', this.total, 'rows:', this.warehouseList.length, 'pageNum:', this.queryParams.pageNum, 'pageSize:', this.queryParams.pageSize, 'response:', response);
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0 };
        this.loading = false;
      }).catch(error => {
        console.error('获取数据失败:', error);
        this.warehouseList = [];
        this.total = 0;
        this.totalInfo = { totalAmt: 0, totalQty: 0 };
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
      this.moreSearchTypes = [];
      this.moreSearchKeywords = {};
      this.handleQuery();
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
.table-container ::v-deep .el-table__body-wrapper {
  padding-bottom: 16px;
  overflow-x: auto !important;
  overflow-y: auto !important;
  scrollbar-width: thin;
  scrollbar-color: #a0a0a0 #e8e8e8;
}

/* 表格底部横向滚动条：默认 10px，鼠标悬停 12px */
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 10px;
  transition: height 0.2s ease;
}
.table-container:hover ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #e8e8e8;
  border-radius: 3px;
  margin: 0 2px;
  cursor: pointer;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a0a0a0;
  border-radius: 3px;
  cursor: grab;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #808080;
}

.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:active {
  background: #606060;
  cursor: grabbing;
}

/* 优化表格列间距（与科室库存明细等 first-inventory-page 表头高度一致） */
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
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
</style>
