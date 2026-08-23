<template>
  <div v-show="show" class="local-modal-mask material-filter-mask" :class="{ 'material-filter-mask--nested': nested }">
    <div
      class="local-modal-content material-filter-modal"
      :class="{
        'material-filter-modal--nested': nested,
        'apply-inbound-nested-modal': nested
      }"
    >
      <div class="modal-header">
        <div class="modal-title">{{ modalTitle }}</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <el-form
        :model="queryParams"
        ref="queryForm"
        v-show="showSearch"
        label-width="70px"
        size="small"
        class="modal-form-compact material-filter-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="库房分类" prop="storeroomId">
                <SelectWarehouseCategory
                  v-model="queryParams.storeroomId"
                  :placeholder="nested ? '全部' : ''"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="规格" prop="specKeyword">
                <el-input
                  v-model="queryParams.specKeyword"
                  placeholder="规格或首字母"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="生产厂家" prop="factoryId">
                <SelectFactory v-model="queryParams.factoryId"/>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="财务分类" prop="financeCategoryId">
                <SelectFinanceCategoryLow v-model="queryParams.financeCategoryId" placeholder="全部" />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item :label="nested ? '产品名称' : '耗材'" prop="materialKeyword">
                <el-input
                  v-model="queryParams.materialKeyword"
                  :placeholder="nested ? '产品名称' : '耗材编码、名称或首字母'"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                  @input="handleMaterialKeywordInput"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="按供应商过滤" prop="filterBySupplier" label-width="96px" class="material-filter-radio-item">
                <el-radio-group v-model="queryParams.filterBySupplier">
                  <el-radio :label="true">是</el-radio>
                  <el-radio :label="false">否</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">耗材明细信息</span>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-search"
              @click="handleQuery"
            >搜索</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              icon="el-icon-refresh"
              @click="resetQuery"
            >重置</el-button>
            <el-button size="small" @click="handleClose">取 消</el-button>
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              icon="el-icon-check"
              @click="checkMaterialBtn"
            >确 定</el-button>
          </div>
        </el-row>

        <div
          v-if="nested"
          class="apply-table-panel"
          ref="filterTablePanel"
        >
          <el-table
            ref="singleTable"
            v-loading="loading"
            class="table-compact apply-main-table"
            :data="materialList"
            :row-class-name="materialFilterDetailRowClassName"
            @selection-change="handleSelectionChange"
            :height="filterTableHeight"
            border
            stripe
          >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="耗材编码" align="center" prop="material.code" width="130" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.code')"/>
          <el-table-column label="耗材名称" align="center" prop="material.name" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')"/>
          <el-table-column label="规格" align="center" prop="material.speci" width="100" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="material.model" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="计费" align="center" prop="material.isBilling" width="70" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1)) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="院内码" align="center" prop="inHospitalCode" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="生产日期" align="center" prop="materialDate" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.materialDate">{{ formatDate(scope.row.materialDate) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ formatDate(scope.row.endTime) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="批号" align="center" prop="materialNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="批次号" align="center" prop="batchNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdFactory.factoryName')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="供应商" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证有效期" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.periodDate">
                {{ formatDate(scope.row.material.periodDate) }}
              </span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="存储方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay"/>
              <span v-else>--</span>
            </template>
          </el-table-column>
        </el-table>

          <div class="apply-pagination-wrap" ref="filterPaginationWrap">
            <pagination
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="handlePagination"
            />
          </div>
        </div>

        <div v-else class="modal-detail-section apply-modal-table-panel material-filter-table-panel">
          <div class="table-wrapper" ref="filterTableWrapper">
            <el-table
              ref="singleTable"
              class="apply-detail-table material-filter-detail-table"
              :data="materialList"
              :row-class-name="materialFilterDetailRowClassName"
              @selection-change="handleSelectionChange"
              height="calc(55vh)"
              border
            >
          <el-table-column type="selection" width="60" align="center" class-name="apply-select-col" header-cell-class-name="apply-select-col" />
          <el-table-column label="序号" align="center" width="80" min-width="80" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
            </template>
          </el-table-column>
          <el-table-column label="耗材编码" align="center" prop="material.code" width="130" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.code')"/>
          <el-table-column label="耗材名称" align="center" prop="material.name" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')"/>
          <el-table-column label="规格" align="center" prop="material.speci" width="100" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="型号" align="center" prop="material.model" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdUnit.unitName')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="计费" align="center" prop="material.isBilling" width="70" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1)) ? '是' : '否' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="院内码" align="center" prop="inHospitalCode" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.inHospitalCode || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="生产日期" align="center" prop="materialDate" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.materialDate">{{ formatDate(scope.row.materialDate) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ formatDate(scope.row.endTime) }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="批号" align="center" prop="materialNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.materialNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="批次号" align="center" prop="batchNo" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFinanceCategory && scope.row.material.fdFinanceCategory.financeCategoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdFactory.factoryName')">
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="包装规格" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.packageSpeci) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column v-if="!hideStockDetailColumns" label="供应商" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证有效期" align="center" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.material && scope.row.material.periodDate">
                {{ formatDate(scope.row.material.periodDate) }}
              </span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="存储方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay"/>
              <span v-else>--</span>
            </template>
          </el-table-column>
        </el-table>
          </div>

          <div class="apply-pagination-wrap material-filter-pagination-wrap">
            <pagination
              v-show="total>0"
              class="modal-entry-pagination"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              :hide-on-single-page="false"
              @pagination="handlePagination"
            />
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>


<script>
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectFactory from "@/components/SelectModel/SelectFactory";
import SelectFinanceCategoryLow from "@/components/SelectModel/SelectFinanceCategoryLow";
import { listDepotInventory } from "@/api/gz/depotInventory";
import { listGzDepInventory, listGzDepInventoryPick } from "@/api/gzDepartment/gzDepInventory";
import { listInventory } from "@/api/warehouse/inventory";
import { checkInHospitalCode } from "@/api/gz/order";
import { listMaterialPost, listMaterialDeptSafe } from "@/api/foundation/material";
import { listFixedNumber } from "@/api/monitoring/fixedNumber";
import { isForbiddenError } from "@/utils/requestFallback";
import { matchSpecKeyword, normalizeMaterialSearchKeyword } from "@/utils/materialSearch";

export default {
  name: "SelectMaterialFilter",
  components: {SelectWarehouse, SelectDepartment, SelectSupplier, SelectWarehouseCategory, SelectFactory, SelectFinanceCategoryLow},
  dicts: ['way_status'],
  props: {
    DialogComponentShow: Boolean,
    warehouseValue: [Number, String],
    departmentValue: [Number, String],
    supplierValue: [Number, String], // 供应商ID，用于过滤产品
    gzOrderEntryList: Array,
    useDepInventory: { // 是否使用科室库存（true=科室库存，false=仓库库存）
      type: Boolean,
      default: false
    },
    useStkInventory: { // 是否使用低值仓库库存（true=低值库存 /warehouse/inventory/list，false=高值备货库存 /gz/depotInventory/list）
      type: Boolean,
      default: false
    },
    filterByFixedNumber: { // 是否只显示定数监测产品（仅定数监测页传 true，入库等页面不传则显示全部库存）
      type: Boolean,
      default: false
    },
    useFixedNumberMaterialArchive: { // 入库新增明细：列出该仓库下定数检测的产品档案（来自定数数据，非库存接口）
      type: Boolean,
      default: false
    },
    /** 当前单据明细中已存在的产品档案 id，用于后端排除，避免重复添加 */
    excludeMaterialIds: {
      type: Array,
      default: () => []
    },
    /** 到货验收等选产品档案场景：隐藏数量/金额/院内码/生产日期/有效期/批号/批次号/供应商 */
    hideStockDetailColumns: {
      type: Boolean,
      default: false
    },
    /** 嵌套在父级弹窗内展示 */
    nested: {
      type: Boolean,
      default: false
    },
    modalTitle: {
      type: String,
      default: '添加明细'
    }
  },
  data() {
    return {
      // 遮罩层
      show: false, //弹窗默认隐藏
      selectRow: [], //选择的行数据
      isShow: true,//是否显示
      isDisabled: true,//是否禁用
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 耗材信息表格数据
      materialList: [],
      //单位
      unitOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 定数监测的产品ID列表（用于过滤）
      fixedNumberMaterialIds: [],
      // 定数监测的产品列表（直接显示）
      fixedNumberMaterials: [],
      // 是否使用定数监测模式（有仓库ID且仓库ID来自父组件）
      useFixedNumberMode: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        materialName: undefined,
        materialKeyword: undefined, // 耗材搜索关键词（支持编码、名称、首字母）
        specKeyword: undefined, // 规格（支持文本与拼音首字母）
        warehouseId: undefined,
        departmentId: undefined,
        supplierId: null,
        storeroomId: null, // 库房分类ID
        financeCategoryId: null, // 财务分类ID
        factoryId: null, // 生产厂家ID
        filterBySupplier: true, // 是否按供应商过滤（默认是）
      },
      // 表单参数
      form: {},
      selectedRowMap: {},
      detailSelectedRowMap: {},
      filterTableHeight: 400,
      loading: false,
      clientPagedSpecList: null,
    };
  },
  beforeDestroy() {
    if (this.nested) {
      window.removeEventListener('resize', this.onFilterWindowResize);
    }
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow
    if (this.useDepInventory) {
      this.queryParams.departmentId = this.departmentValue;
    } else {
      this.queryParams.warehouseId = this.warehouseValue;
      // 如果有仓库ID，加载该仓库的定数监测产品列表
      if (this.warehouseValue) {
        this.loadFixedNumberMaterials(this.warehouseValue);
      }
    }
    // 如果有供应商ID，设置查询参数（用于过滤）
    if (this.supplierValue) {
      this.queryParams.supplierId = this.supplierValue;
    }
    this.getList();
    if (this.nested) {
      window.addEventListener('resize', this.onFilterWindowResize);
      this.$nextTick(() => this.updateFilterTableHeight());
    }
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.selectedRowMap = {};
        this.detailSelectedRowMap = {};
        this.selectRow = [];
        this.queryParams.pageNum = 1;
        // 弹窗打开时更新仓库/科室并重新加载数据
        if (this.useDepInventory) {
          this.queryParams.departmentId = this.departmentValue;
        } else {
          this.queryParams.warehouseId = this.warehouseValue;
          // 如果有仓库ID，加载该仓库的定数监测产品列表
          if (this.warehouseValue) {
            this.loadFixedNumberMaterials(this.warehouseValue);
          }
        }
        // 如果有供应商ID，设置查询参数（用于过滤，但不显示在搜索框中）
        if (this.supplierValue) {
          this.queryParams.supplierId = this.supplierValue;
        }
        this.getList();
        if (this.nested) {
          this.$nextTick(() => this.updateFilterTableHeight());
        }
      }
    },
    warehouseValue(newVal) {
      // 当父组件传递的仓库值变化时，更新查询参数
      if (!this.useDepInventory && newVal) {
        this.queryParams.warehouseId = newVal;
        // 加载该仓库的定数监测产品列表
        this.loadFixedNumberMaterials(newVal);
      }
    },
    departmentValue(newVal) {
      // 当父组件传递的科室值变化时，更新查询参数
      if (this.useDepInventory && newVal) {
        this.queryParams.departmentId = newVal;
      }
    },
    excludeMaterialIds: {
      deep: true,
      handler() {
        if (this.show) {
          this.queryParams.pageNum = 1;
          this.getList();
        }
      }
    },
    total() {
      if (this.nested && this.show) {
        this.$nextTick(() => this.updateFilterTableHeight());
      }
    }
  },
  created() {
    // this.getList();
  },
  methods: {
    getRowKey(row) {
      if (!row) return null;
      if (row.id != null) return `id_${row.id}`;
      if (row.material && row.material.id != null && row.batchNo) return `mb_${row.material.id}__${row.batchNo}`;
      if (row.material && row.material.id != null) return `m_${row.material.id}`;
      if (row.materialId != null && row.batchNo) return `ab_${row.materialId}__${row.batchNo}`;
      return null;
    },
    restorePageSelection() {
      if (!this.$refs.singleTable || !this.materialList || this.materialList.length === 0) {
        return;
      }
      this.$refs.singleTable.clearSelection();
      this.materialList.forEach(row => {
        const key = this.getRowKey(row);
        if (key && this.selectedRowMap[key]) {
          this.$refs.singleTable.toggleRowSelection(row, true);
        }
      });
    },
    async loadDeptSafeMaterialRows(query) {
      const safeRows = await listMaterialDeptSafe(query || {});
      const rows = Array.isArray(safeRows) ? safeRows : [];
      const materialList = rows.map(m => ({
        material: m && typeof m === 'object' ? m : { id: m },
        qty: 0,
        unitPrice: (m && m.price) != null ? m.price : 0,
        amt: 0,
        materialNo: '',
        batchNo: '',
        materialDate: null,
        endTime: null,
        inHospitalCode: ''
      }));
      this.materialList = materialList.slice();
      this.total = materialList.length;
      this.loading = false;
      this.$nextTick(() => {
          this.restorePageSelection();
          this.updateFilterTableHeight();
        });
    },
    /** 分页组件回调：与后端分页参数同步后再拉数，避免 total 与当前页条数不一致 */
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      if (this.clientPagedSpecList) {
        const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
        this.materialList = this.clientPagedSpecList.slice(start, start + this.queryParams.pageSize);
        this.$nextTick(() => {
          this.restorePageSelection();
          this.updateFilterTableHeight();
        });
        return;
      }
      this.getList();
    },
    handleFilterPageSizeChange(limit) {
      this.queryParams.pageSize = limit;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleFilterPageChange(page) {
      this.queryParams.pageNum = page;
      this.getList();
    },
    /** 加载定数监测的产品列表 */
    loadFixedNumberMaterials(warehouseId) {
      if (!warehouseId) {
        this.fixedNumberMaterialIds = [];
        this.fixedNumberMaterials = [];
        this.useFixedNumberMode = false;
        return;
      }
      
      try {
        // 从localStorage读取定数监测数据（仓库定数监测类型为'1'）
        const storageKey = `fixedNumber_1_${warehouseId}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          const fixedNumberList = JSON.parse(savedData);
          // 提取所有做了定数监测的产品（只要在列表中就认为是做了定数监测）
          const materials = fixedNumberList
            .filter(item => {
              // 只要在定数监测列表中，就认为是做了定数监测的产品
              return item.material && item.material.id;
            })
            .map(item => {
              // 转换为库存格式，用于显示
              return {
                material: item.material,
                qty: item.stockQuantity || 0, // 库存数量
                unitPrice: item.price || item.material.price || 0, // 单价
                amt: (item.stockQuantity || 0) * (item.price || item.material.price || 0), // 金额
                materialNo: '', // 批号
                batchNo: '', // 批次号
                materialDate: null, // 生产日期
                endTime: null, // 有效期
                inHospitalCode: '', // 院内码
                orderNo: '' // 入库单号
              };
            });
          
          this.fixedNumberMaterials = materials;
          this.fixedNumberMaterialIds = materials.map(m => m.material.id).filter(id => id);
          this.useFixedNumberMode = true;
        } else {
          this.fixedNumberMaterials = [];
          this.fixedNumberMaterialIds = [];
          this.useFixedNumberMode = false;
        }
      } catch (error) {
        console.error('加载定数监测数据失败:', error);
        this.fixedNumberMaterials = [];
        this.fixedNumberMaterialIds = [];
        this.useFixedNumberMode = false;
      }
    },
    /** 查询库存信息列表（有仓库/科室走库存接口，无则走产品档案接口，保证点击搜索会发起请求） */
    getList() {
      const hasWarehouse = !!this.queryParams.warehouseId;
      const hasDepartment = !!this.queryParams.departmentId;
      const needDep = this.useDepInventory;

      // 入库新增明细：从后端定数检测数据中筛选该仓库下的产品（走定数监测列表接口）
      if (this.useFixedNumberMaterialArchive && hasWarehouse) {
        const docSupplierId = this.supplierValue || this.queryParams.supplierId;
        const specKeyword = normalizeMaterialSearchKeyword(this.queryParams.specKeyword);
        const useSpecClientPage = !!specKeyword;
        this.loading = true;
        const params = {
          fixedNumberType: '1',
          warehouseId: this.queryParams.warehouseId,
          onlyEnabled: true,
          pageNum: useSpecClientPage ? 1 : this.queryParams.pageNum,
          pageSize: useSpecClientPage ? 9999 : this.queryParams.pageSize
        };
        if (this.queryParams.filterBySupplier && docSupplierId) {
          params.supplierId = docSupplierId;
        }
        if (this.queryParams.materialKeyword) {
          params.materialName = normalizeMaterialSearchKeyword(this.queryParams.materialKeyword);
        }
        if (this.queryParams.storeroomId) {
          params.storeroomId = this.queryParams.storeroomId;
        }
        if (this.queryParams.financeCategoryId) {
          params.financeCategoryId = this.queryParams.financeCategoryId;
        }
        if (this.queryParams.factoryId) {
          params.factoryId = this.queryParams.factoryId;
        }
        if (specKeyword) {
          params.materialSpeci = specKeyword;
        }
        if (this.excludeMaterialIds && this.excludeMaterialIds.length > 0) {
          params.excludeMaterialIds = this.excludeMaterialIds.join(",");
        }
        listFixedNumber(params).then(response => {
          const rows = Array.isArray(response.rows)
            ? response.rows
            : (response.data && Array.isArray(response.data.rows) ? response.data.rows : []);
          const totalVal =
            response.total !== undefined && response.total !== null
              ? response.total
              : (response.data && response.data.total !== undefined && response.data.total !== null
                ? response.data.total
                : null);
          let materialList = rows.map(row => {
            const material = {
              id: row.materialId,
              code: row.code,
              name: row.name,
              speci: row.specification || row.speci,
              model: row.model,
              price: row.price,
              registerNo: row.registerNo,
              packageSpeci: row.packageSpeci,
              isBilling: row.isBilling,
              fdUnit: row.unitName != null ? { unitName: row.unitName } : null,
              fdFactory: row.factoryName != null ? { factoryName: row.factoryName } : null,
              fdWarehouseCategory: row.warehouseCategoryName != null ? { warehouseCategoryName: row.warehouseCategoryName } : null,
              fdFinanceCategory: row.financeCategoryName != null ? { financeCategoryName: row.financeCategoryName } : null
            };
            return {
              material,
              qty: 0,
              unitPrice: row.price != null ? row.price : 0,
              amt: 0,
              materialNo: '',
              batchNo: '',
              materialDate: null,
              endTime: null,
              inHospitalCode: ''
            };
          });
          if (specKeyword) {
            materialList = materialList.filter(item => matchSpecKeyword(item.material && item.material.speci, specKeyword));
            this.clientPagedSpecList = materialList.slice();
            this.total = materialList.length;
            const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
            this.materialList = materialList.slice(start, start + this.queryParams.pageSize);
          } else {
            this.clientPagedSpecList = null;
            this.materialList = materialList.slice();
            this.total = totalVal != null ? Number(totalVal) : materialList.length;
          }
          this.loading = false;
          this.$nextTick(() => {
          this.restorePageSelection();
          this.updateFilterTableHeight();
        });
        }).catch(() => {
          this.clientPagedSpecList = null;
          this.loading = false;
        });
        return;
      }

      // 未选仓库/科室时：走产品档案列表接口（如入库界面先搜产品再选仓库）
      if (needDep ? !hasDepartment : !hasWarehouse) {
        const docSupplierId = this.supplierValue || this.queryParams.supplierId;
        this.loading = true;
        const query = {};
        if (this.queryParams.filterBySupplier && docSupplierId) {
          query.supplierId = docSupplierId;
        }
        if (this.queryParams.materialKeyword) {
          query.name = normalizeMaterialSearchKeyword(this.queryParams.materialKeyword);
          query.nameSearch = normalizeMaterialSearchKeyword(this.queryParams.materialKeyword);
        }
        if (this.queryParams.storeroomId) query.storeroomId = this.queryParams.storeroomId;
        if (this.queryParams.financeCategoryId) query.financeCategoryId = this.queryParams.financeCategoryId;
        if (this.queryParams.factoryId) query.factoryId = this.queryParams.factoryId;
        const specKeyword = normalizeMaterialSearchKeyword(this.queryParams.specKeyword);
        if (specKeyword) query.speci = specKeyword;
        listMaterialPost({
          pageNum: this.queryParams.pageNum,
          pageSize: this.queryParams.pageSize,
          query
        }).then(response => {
          // 兼容多种返回格式：直接 rows/total、嵌套在 data 中、或 data 本身为数组
          const rows = Array.isArray(response.rows)
            ? response.rows
            : (response.data && Array.isArray(response.data.rows) ? response.data.rows : Array.isArray(response.data) ? response.data : []);
          const totalVal = response.total !== undefined && response.total !== null
            ? response.total
            : (response.data && (response.data.total !== undefined && response.data.total !== null) ? response.data.total : rows.length);
          const materialList = rows.map(m => ({
            material: m && typeof m === 'object' ? m : { id: m },
            qty: 0,
            unitPrice: (m && m.price) != null ? m.price : 0,
            amt: 0,
            materialNo: '',
            batchNo: '',
            materialDate: null,
            endTime: null,
            inHospitalCode: ''
          }));
          this.materialList = materialList.slice();
          this.total = Number(totalVal) || 0;
          this.loading = false;
          this.$nextTick(() => {
          this.restorePageSelection();
          this.updateFilterTableHeight();
        });
        }).catch((err) => {
          if (isForbiddenError(err)) {
            this.loadDeptSafeMaterialRows(query).catch(() => {
              this.loading = false;
            });
            return;
          }
          this.loading = false;
        });
        return;
      }

      this.loading = true;
      this.clientPagedSpecList = null;
      // 根据场景决定使用哪个 API：科室库存 -> 高值科室；低值仓库 -> 低值库存；否则 -> 高值备货库存
      let apiCall;
      const params = { ...this.queryParams };
      if (this.queryParams.materialKeyword) {
        params.materialName = this.queryParams.materialKeyword;
      }
      const specKeyword = normalizeMaterialSearchKeyword(this.queryParams.specKeyword);
      if (specKeyword) {
        params.materialSpeci = specKeyword;
      }
      if (this.queryParams.financeCategoryId) {
        params.financeCategoryIds = [this.queryParams.financeCategoryId];
      }
      if (this.useDepInventory) {
        apiCall = listGzDepInventoryPick(params);
      } else if (this.useStkInventory) {
        apiCall = listInventory(params);
      } else {
        apiCall = listDepotInventory(params);
      }
      apiCall.then(response => {
        // 兼容多种返回格式：直接 rows 或嵌套在 data 中
        let materialList = Array.isArray(response.rows) ? response.rows : (response.data && Array.isArray(response.data.rows) ? response.data.rows : []);
        const totalVal = response.total != null ? Number(response.total)
          : (response.data && response.data.total != null ? Number(response.data.total) : materialList.length);
        
        // 仅当父组件明确要求时（定数监测页）才按定数产品过滤；入库等页面不传 filterByFixedNumber，显示全部库存
        if (this.filterByFixedNumber && !this.useDepInventory && this.fixedNumberMaterialIds.length > 0) {
          materialList = materialList.filter(item => {
            const materialId = item.material && item.material.id;
            return materialId && this.fixedNumberMaterialIds.includes(materialId);
          });
        }
        
        // 根据供应商过滤（优先使用 props 传入的 supplierValue）；库存行可能用 item.supplierId，物料用 item.material.supplierId
        const supplierId = this.supplierValue || this.queryParams.supplierId;
        if (this.queryParams.filterBySupplier && supplierId) {
          materialList = materialList.filter(item => {
            const sid = (item.material && item.material.supplierId != null) ? item.material.supplierId : item.supplierId;
            return sid != null && sid == supplierId;
          });
        }
        
        // 根据库房分类过滤（仅当行/物料有该字段时才过滤，避免因未关联而清空列表）
        if (this.queryParams.storeroomId) {
          materialList = materialList.filter(item => {
            const sid = item.material && item.material.storeroomId != null ? item.material.storeroomId : item.storeroomId;
            if (sid == null) return true;
            return sid == this.queryParams.storeroomId;
          });
        }
        
        // 根据生产厂家过滤
        if (this.queryParams.factoryId) {
          materialList = materialList.filter(item => {
            const fid = item.material && item.material.factoryId != null ? item.material.factoryId : item.factoryId;
            if (fid == null) return true;
            return fid == this.queryParams.factoryId;
          });
        }

        // 根据财务分类过滤
        if (this.queryParams.financeCategoryId) {
          materialList = materialList.filter(item => {
            const fcid = item.material && item.material.financeCategoryId != null
              ? item.material.financeCategoryId
              : (item.material && item.material.fdFinanceCategory && item.material.fdFinanceCategory.financeCategoryId);
            if (fcid == null) return true;
            return fcid == this.queryParams.financeCategoryId;
          });
        }

        // 根据规格过滤（文本 + 拼音首字母）
        const specKeyword = normalizeMaterialSearchKeyword(this.queryParams.specKeyword);
        if (specKeyword) {
          materialList = materialList.filter(item => matchSpecKeyword(item.material && item.material.speci, specKeyword));
        }
        
        // 根据耗材关键词过滤（支持编码、名称、首字母）
        if (this.queryParams.materialKeyword) {
          const keyword = this.queryParams.materialKeyword.toLowerCase().trim();
          materialList = materialList.filter(item => {
            if (!item.material) return false;
            const material = item.material;
            // 检查编码
            if (material.code && material.code.toLowerCase().includes(keyword)) {
              return true;
            }
            // 检查名称
            if (material.name && material.name.toLowerCase().includes(keyword)) {
              return true;
            }
            // 检查首字母（名称简码）
            if (material.referredName && material.referredName.toLowerCase().includes(keyword)) {
              return true;
            }
            return false;
          });
        }
        
        this.materialList = materialList.slice();
        this.total = totalVal;
        this.loading = false;
        this.$nextTick(() => {
          this.restorePageSelection();
          this.updateFilterTableHeight();
        });
      }).catch((err) => {
        this.loading = false;
        if (isForbiddenError(err)) {
          this.$message.warning('暂无权限查询科室库存，请联系管理员开通「高值科室库存查询」权限');
        }
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.clientPagedSpecList = null;
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.clientPagedSpecList = null;
      this.queryParams.materialKeyword = undefined;
      this.queryParams.specKeyword = undefined;
      this.queryParams.storeroomId = null;
      this.queryParams.financeCategoryId = null;
      this.queryParams.factoryId = null;
      this.queryParams.filterBySupplier = true;
      // 保留仓库ID或科室ID，不重置
      this.handleQuery();
    },
    /** 耗材关键词输入处理 */
    handleMaterialKeywordInput(value) {
      // 实时搜索可以在这里实现，或者保持为空，只在点击搜索时查询
      // 如果需要实时搜索，可以调用 this.handleQuery()
    },
    handleSelectionChange(val) {
      const pageKeys = (this.materialList || [])
        .map(row => this.getRowKey(row))
        .filter(Boolean);
      pageKeys.forEach(key => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key);
        }
      });
      (val || []).forEach(row => {
        const key = this.getRowKey(row);
        if (key) {
          this.$set(this.selectedRowMap, key, row);
        }
      });
      this.selectRow = Object.values(this.selectedRowMap);
      const pageIndices = (this.materialList || []).map((row, idx) => idx);
      pageIndices.forEach((idx) => {
        if (this.detailSelectedRowMap[idx]) {
          this.$delete(this.detailSelectedRowMap, idx);
        }
      });
      (val || []).forEach((row) => {
        const idx = this.materialList.indexOf(row);
        if (idx >= 0) {
          this.$set(this.detailSelectedRowMap, idx, true);
        }
      });
    },
    handleClose() {
      //关闭弹窗
      this.show = false
      this.clientPagedSpecList = null;
      this.selectedRowMap = {};
      this.detailSelectedRowMap = {};
      this.selectRow = [];
      this.$emit('closeDialog')
    },
    async checkMaterialBtn() {
      //确定按钮
      if(!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      
      // 检查选择的明细是否有未出库的出库单
      const invalidItems = [];
      for (let i = 0; i < this.selectRow.length; i++) {
        const item = this.selectRow[i];
        const inHospitalCode = item.inHospitalCode;
        if (inHospitalCode) {
          try {
            const response = await checkInHospitalCode({ inHospitalCode: inHospitalCode });
            if (response.code === 200 && response.data && response.data.length > 0) {
              invalidItems.push({
                index: i + 1,
                inHospitalCode: inHospitalCode,
                materialName: (item.material && item.material.name) || item.materialName || '未知',
                orderNos: response.data
              });
            }
          } catch (error) {
            console.error('检查院内码失败:', error);
          }
        }
      }
      
      if (invalidItems.length > 0) {
        let message = '以下明细已有未出库的出库单，不能选择：\n';
        invalidItems.forEach(item => {
          message += `第${item.index}行：${item.materialName}（院内码：${item.inHospitalCode}），出库单号：${item.orderNos.join('、')}\n`;
        });
        this.$message({ 
          message: message, 
          type: 'error',
          duration: 5000,
          dangerouslyUseHTMLString: false
        });
        return;
      }
      
      // 检查选择的明细中是否有院内码已经在父组件的明细列表中
      const duplicateItems = [];
      if (this.gzOrderEntryList && this.gzOrderEntryList.length > 0) {
        for (let i = 0; i < this.selectRow.length; i++) {
          const item = this.selectRow[i];
          const inHospitalCode = item.inHospitalCode || "";
          if (inHospitalCode) {
            // 检查父组件的明细列表中是否已存在相同的院内码
            const exists = this.gzOrderEntryList.some(entry => entry.inHospitalCode === inHospitalCode);
            if (exists) {
              const materialName = (item.material && item.material.name) || item.materialName || '未知';
              duplicateItems.push({
                index: i + 1,
                materialName: materialName,
                inHospitalCode: inHospitalCode
              });
            }
          }
        }
      }
      
      // 如果有重复的院内码，提示用户但不关闭弹窗，让用户继续选择
      if (duplicateItems.length > 0) {
        let message = '请勿重复添加，以下明细的院内码已存在于当前明细列表中：\n\n';
        duplicateItems.forEach(item => {
          message += `第${item.index}行：${item.materialName}（院内码：${item.inHospitalCode}）\n`;
        });
        message += '\n请继续选择其他产品。';
        this.$message({ 
          message: message, 
          type: 'error',
          duration: 5000,
          dangerouslyUseHTMLString: false
        });
        return; // 不关闭弹窗，让用户继续选择
      }
      
      this.$emit('selectData', this.selectRow)   //发送数据到父组件
      this.handleClose()
    },
    
    onFilterWindowResize() {
      this.updateFilterTableHeight();
    },
    updateFilterTableHeight() {
      if (!this.nested || !this.show) return;
      const run = () => {
        const panel = this.$refs.filterTablePanel;
        const pagWrap = this.$refs.filterPaginationWrap;
        if (!panel || !panel.getBoundingClientRect) return;
        const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
        if (!panelH) return;
        const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
        const next = Math.floor(panelH - pagH);
        const height = Math.max(200, next);
        if (Math.abs(this.filterTableHeight - height) >= 2) {
          this.filterTableHeight = height;
        }
        this.$nextTick(() => {
          const table = this.$refs.singleTable;
          if (table && table.doLayout) {
            table.doLayout();
          }
        });
      };
      this.$nextTick(run);
      requestAnimationFrame(run);
      [50, 120, 300].forEach((ms) => setTimeout(run, ms));
    },
    materialFilterDetailRowClassName({ rowIndex }) {
      if (this.detailSelectedRowMap && this.detailSelectedRowMap[rowIndex]) {
        return 'apply-row-selected';
      }
      return '';
    },
    /** 嵌套字段排序：按 path 如 'material.name' 取值后比较 */
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
    /** 格式化日期 */
    formatDate(date) {
      if (!date) return '--';
      if (typeof date === 'string') {
        // 如果是字符串，尝试解析
        const d = new Date(date);
        if (isNaN(d.getTime())) {
          // 如果解析失败，直接返回原字符串（可能是已格式化的日期）
          return date;
        }
        date = d;
      }
      if (date instanceof Date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
      return '--';
    },
    /** 格式化金额 */
    formatCurrency(value) {
      if (!value && value !== 0) return '--';
      return parseFloat(value).toFixed(2);
    },
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0,0,0,0.4);
  z-index: 3000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100vh;
  max-height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #EBEEF5;
  background: #EBEEF5;
  flex-shrink: 0;
  min-height: 40px
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

.modal-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: auto;
  padding: 6px 20px 16px;
  background: #fff;
}

.modal-footer {
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 12px;
}

/* 明细表格：与上方搜索卡片同宽（按钮条仅上下各 8px padding，与卡片底到按钮的 8px 对齐） */
.material-filter-table-section {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
}

.material-filter-detail-table {
  width: 100% !important;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 12px;
}

::v-deep .material-filter-detail-table .el-table__body-wrapper {
  overflow-x: auto;
  overflow-y: auto;
}

::v-deep .material-filter-detail-table th {
  background-color: #EBEEF5 !important;
  color: #606266;
  font-weight: 600;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .material-filter-detail-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

::v-deep .material-filter-detail-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 顶栏查询卡片：与到货验收主弹窗 form-fields-container 同色同边框，并横向拉满 modal-body */
.material-filter-query-card {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  /* 与到货验收 form-fields-container 内边距一致 */
  padding: 8px 16px 8px;
  margin-bottom: 0;
  background: #fff;
  border: 1px solid #c0c4cc;
  border-radius: 8px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}

/* 库房分类行与耗材行之间留出与主弹窗表单行相近的纵向间隙 */
.material-filter-query-card .query-form-row + .query-form-row {
  margin-top: 10px;
}

/* 两容器之间的按钮条：与卡片、表格同宽；底部不外扩 margin，避免按钮—表格间距大于卡片—按钮 */
.material-filter-between-actions {
  margin-left: -20px;
  margin-right: -20px;
  width: calc(100% + 40px);
  box-sizing: border-box;
  padding: 8px 16px;
  margin-top: 0;
  margin-bottom: 0;
  text-align: left;
}

/* 顶部筛选区：表单置于卡片内，不再单独铺白底 */
.query-form {
  background: transparent;
  padding: 0;
  margin: 0;
  border-radius: 0;
  box-shadow: none;
}

.query-form .el-form-item {
  margin-bottom: 0;
}

.query-form .el-form-item__label {
  line-height: 36px;
  padding-right: 8px;
}

.query-form-row {
  margin-bottom: 0 !important;
}

/* 搜索区内：宽度统一；高度统一（含库房分类/生产厂家 el-select 与耗材输入框） */
::v-deep .query-form-compact-fields .el-input,
::v-deep .query-form-compact-fields .el-select {
  width: 220px !important;
  max-width: 220px !important;
}

::v-deep .query-form-compact-fields .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
  min-height: 36px !important;
}

::v-deep .query-form-compact-fields .el-input__inner,
::v-deep .query-form-compact-fields .el-select .el-input__inner,
::v-deep .query-form-compact-fields .el-range-editor.el-input__inner {
  height: 36px !important;
  min-height: 36px !important;
  line-height: 36px !important;
  font-size: 13px !important;
  box-sizing: border-box;
}

::v-deep .query-form-compact-fields .el-input__icon {
  line-height: 36px !important;
}

::v-deep .query-form-compact-fields.el-form--inline .el-form-item {
  vertical-align: middle;
}

::v-deep .query-form-compact-fields .el-radio {
  line-height: 36px;
}

::v-deep .query-form-compact-fields .el-radio__label {
  line-height: 36px;
  font-size: 13px;
}

::v-deep .apply-modal-field--standard .el-input,
::v-deep .apply-modal-field--standard .el-select {
  width: 140px !important;
  max-width: 140px !important;
}

::v-deep .apply-modal-field--material-keyword .el-input {
  width: 110px !important;
  max-width: 110px !important;
}

::v-deep .apply-modal-field--standard .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
}
</style>

<style lang="scss">
.material-filter-mask--nested {
  position: absolute;
  z-index: 3100;
}

.material-filter-mask.material-filter-mask--nested .local-modal-content.material-filter-modal--nested {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

.material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.material-filter-modal-footer {
  flex: 0 0 auto;
  position: relative;
  z-index: 5;
  overflow: visible;
  min-height: 48px;
  padding: 8px 14px 10px;
  margin: 0;
  background: #fff;
  border-top: 1px solid #eef2f7;
  box-sizing: border-box;
}

.material-filter-modal-footer .pagination-container,
.material-filter-modal-footer .pagination-container.modal-entry-pagination {
  position: relative !important;
  width: 100%;
  height: auto !important;
  min-height: 44px !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  display: flex !important;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}

.material-filter-modal-footer .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

.material-filter-form.modal-form-compact {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.material-filter-table-panel {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.material-filter-table-panel .table-wrapper {
  flex: 1 1 0%;
  min-height: 0;
  overflow: hidden;
  margin-top: 0;
  padding-bottom: 0;
}

.material-filter-mask.material-filter-mask--nested .material-filter-form.modal-form-compact > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

/* RK-添加明细：横向滚动条与修改入库 apply-detail-table 完全一致（默认即粗，非 hover 才变粗） */
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  z-index: 2;
  overflow: auto !important;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar:horizontal,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar:horizontal,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-track,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-track,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-track,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  border: none !important;
  box-shadow: none !important;
  background-image: none !important;
  background-clip: border-box !important;
  min-width: 12px !important;
  min-height: 12px !important;
}

html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table > .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed-right::-webkit-scrollbar-thumb:hover,
html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-table__fixed::-webkit-scrollbar-thumb:hover {
  background: #909090 !important;
}

html body .material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal .apply-table-panel > .apply-main-table .el-scrollbar__bar.is-horizontal {
  height: 12px !important;
}

.material-filter-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.material-filter-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap {
  flex: 0 0 auto;
  padding: 0;
  border-top: 1px solid #e2e8f0;
}

.material-filter-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap .pagination-container {
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

.material-filter-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap .pagination-container .el-pagination {
  position: relative !important;
  right: auto !important;
}

/* 嵌套弹窗：查询区 / 工具栏 / 表格区边框（对齐修改入库 apply/index） */
.material-filter-mask.material-filter-mask--nested .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel {
  margin-top: 0;
  margin-bottom: 0;
  flex-shrink: 0;
  padding: 6px 8px;
  border-radius: 0;
  border-left: none;
  border-right: none;
  border-top: 1px solid #e8ecf1;
  border-bottom: 1px solid #e8ecf1;
  box-sizing: border-box;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  gap: 6px;
  margin-bottom: 4px;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
}

.material-filter-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .apply-modal-field--material-keyword .el-input {
  width: 110px !important;
  max-width: 110px !important;
}

.material-filter-mask .local-modal-content .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto;
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
  box-sizing: border-box;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel.material-filter-table-panel {
  flex: 1 1 0%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.material-filter-mask.material-filter-mask--nested .material-filter-table-panel.apply-modal-table-panel {
  overflow: hidden;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel > .table-wrapper {
  overflow: hidden;
  border-bottom: none;
  flex: 1;
  min-height: 0;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table tbody td.el-table__cell {
  padding: 4px 0 !important;
  height: auto !important;
  min-height: 36px;
  vertical-align: middle;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table tbody td.el-table__cell > .cell {
  padding-left: 6px !important;
  padding-right: 6px !important;
  line-height: 28px;
  min-height: 28px;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table thead th.el-table__cell {
  height: auto !important;
  min-height: 0 !important;
  padding: 6px 0 !important;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected > td,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected > td .cell,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected > td.apply-select-col,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected > td.el-table-column--selection {
  background-color: #B8DAFF !important;
}

.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected:hover > td,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected:hover > td .cell,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.material-filter-mask .local-modal-content .apply-modal-table-panel .material-filter-detail-table.el-table.apply-detail-table .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection {
  background-color: #A0CBFF !important;
}

.material-filter-mask .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 12px;
  line-height: 28px;
}

.material-filter-mask:not(.material-filter-mask--nested) .apply-pagination-wrap {
  flex-shrink: 0;
  padding: 4px 0 0;
}

.material-filter-form.modal-form-compact > .material-filter-pagination-wrap {
  flex: 0 0 52px;
  position: relative;
  z-index: 3;
  overflow: visible;
  min-height: 44px;
  padding: 6px 14px 8px;
  margin-bottom: 0;
  background: #fff;
  border-top: 1px solid #eef2f7;
  box-sizing: border-box;
}


.material-filter-mask.material-filter-mask--nested .material-filter-pagination-wrap .pagination-container,
.material-filter-mask.material-filter-mask--nested .material-filter-nested-pagination-wrap .pagination-container,
.material-filter-form.modal-form-compact > .material-filter-pagination-wrap .pagination-container,
.material-filter-mask.material-filter-mask--nested .material-filter-pagination-wrap .pagination-container.modal-entry-pagination,
.material-filter-mask.material-filter-mask--nested .material-filter-nested-pagination-wrap .pagination-container.modal-entry-pagination,
.material-filter-form.modal-form-compact > .material-filter-pagination-wrap .pagination-container.modal-entry-pagination {
  position: relative !important;
  width: 100%;
  height: auto !important;
  min-height: 44px !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent;
  border: none;
  box-shadow: none;
  display: flex;
  justify-content: flex-end;
  align-items: center;
  overflow: visible;
}


.material-filter-mask.material-filter-mask--nested .material-filter-pagination-wrap .pagination-container .el-pagination,
.material-filter-mask.material-filter-mask--nested .material-filter-nested-pagination-wrap .pagination-container .el-pagination,
.material-filter-form.modal-form-compact > .material-filter-pagination-wrap .pagination-container .el-pagination,
.material-filter-mask.material-filter-mask--nested .material-filter-pagination-wrap--nested .rk-material-filter-pagination.el-pagination {
  position: relative !important;
  right: auto !important;
  padding: 0 !important;
  margin: 0 !important;
  visibility: visible !important;
}
</style>

