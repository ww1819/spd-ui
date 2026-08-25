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
              <el-form-item label="生产厂家" prop="factoryId">
                <SelectFactory v-model="queryParams.factoryId"/>
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="财务分类" prop="financeCategoryId">
                <SelectFinanceCategoryLow v-model="queryParams.financeCategoryId" placeholder="全部" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="耗材编码" prop="codeKeyword">
                <el-input
                  v-model="queryParams.codeKeyword"
                  placeholder="耗材编码"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="耗材名称" prop="nameKeyword">
                <el-input
                  v-model="queryParams.nameKeyword"
                  placeholder="名称或首字母"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="型号" prop="modelKeyword">
                <el-input
                  v-model="queryParams.modelKeyword"
                  placeholder="型号或首字母"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
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
            <el-table-column label="耗材编码" align="center" prop="code" width="130" show-overflow-tooltip resizable sortable />
            <el-table-column label="耗材名称" align="center" prop="name" width="150" show-overflow-tooltip resizable sortable />
            <el-table-column label="规格" align="center" prop="speci" width="100" show-overflow-tooltip resizable sortable>
              <template slot-scope="scope">
                <span>{{ scope.row.speci || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable sortable>
              <template slot-scope="scope">
                <span>{{ scope.row.model || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'fdUnit.unitName')">
              <template slot-scope="scope">
                <span>{{ (scope.row.fdUnit && scope.row.fdUnit.unitName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" align="center" prop="price" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByPrice">
              <template slot-scope="scope">
                <span v-if="scope.row.price != null && scope.row.price !== ''">{{ formatPrice4(scope.row.price) }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="计费" align="center" prop="isBilling" width="70" show-overflow-tooltip resizable sortable :sort-method="sortByBilling">
              <template slot-scope="scope">
                <span>{{ (scope.row.isBilling === '1' || scope.row.isBilling === 1) ? '是' : '否' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'fdWarehouseCategory.warehouseCategoryName')">
              <template slot-scope="scope">
                <span>{{ (scope.row.fdWarehouseCategory && scope.row.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'fdFinanceCategory.financeCategoryName')">
              <template slot-scope="scope">
                <span>{{ (scope.row.fdFinanceCategory && scope.row.fdFinanceCategory.financeCategoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'fdFactory.factoryName')">
              <template slot-scope="scope">
                <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="包装规格" align="center" width="120" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'packageSpeci')">
              <template slot-scope="scope">
                <span>{{ scope.row.packageSpeci || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="供应商" align="center" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'supplier.name')">
              <template slot-scope="scope">
                <span>{{ (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="注册证号" align="center" prop="registerNo" width="180" show-overflow-tooltip resizable sortable />
            <el-table-column label="注册证有效期" align="center" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByPeriodDate">
              <template slot-scope="scope">
                <span v-if="scope.row.periodDate">{{ formatDate(scope.row.periodDate) }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="存储方式" align="center" prop="isWay" width="100" show-overflow-tooltip resizable sortable :sort-method="sortByWay">
              <template slot-scope="scope">
                <dict-tag v-if="scope.row.isWay" :options="dict.type.way_status" :value="scope.row.isWay"/>
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
              v-loading="loading"
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
              <el-table-column label="耗材编码" align="center" prop="code" width="130" show-overflow-tooltip resizable sortable />
              <el-table-column label="耗材名称" align="center" prop="name" width="150" show-overflow-tooltip resizable sortable />
              <el-table-column label="规格" align="center" prop="speci" width="100" show-overflow-tooltip resizable sortable>
                <template slot-scope="scope">
                  <span>{{ scope.row.speci || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="型号" align="center" prop="model" width="100" show-overflow-tooltip resizable sortable>
                <template slot-scope="scope">
                  <span>{{ scope.row.model || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdUnit && scope.row.fdUnit.unitName) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="单价" align="center" prop="price" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.price != null && scope.row.price !== ''">{{ formatPrice4(scope.row.price) }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="计费" align="center" prop="isBilling" width="70" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.isBilling === '1' || scope.row.isBilling === 1) ? '是' : '否' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="库房分类" align="center" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdWarehouseCategory && scope.row.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="财务分类" align="center" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdFinanceCategory && scope.row.fdFinanceCategory.financeCategoryName) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="供应商" align="center" width="150" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="注册证号" align="center" prop="registerNo" width="180" show-overflow-tooltip resizable />
              <el-table-column label="注册证有效期" align="center" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.periodDate">{{ formatDate(scope.row.periodDate) }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="存储方式" align="center" prop="isWay" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <dict-tag v-if="scope.row.isWay" :options="dict.type.way_status" :value="scope.row.isWay"/>
                  <span v-else>--</span>
                </template>
              </el-table-column>
            </el-table>
          </div>

          <div class="apply-pagination-wrap material-filter-pagination-wrap">
            <pagination
              v-show="total > 0"
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
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import SelectFactory from "@/components/SelectModel/SelectFactory";
import SelectFinanceCategoryLow from "@/components/SelectModel/SelectFinanceCategoryLow";
import { listMaterialPurchasePlanPickPost, listMaterialDeptSafe } from "@/api/foundation/material";
import { isForbiddenError } from "@/utils/requestFallback";
import {
  deriveMaterialNameSearchParams,
  matchMaterialCodeKeyword,
  matchMaterialNameKeyword,
  matchModelKeyword,
  normalizeMaterialSearchKeyword
} from "@/utils/materialSearch";

export default {
  name: "SelectMMaterialFilter",
  components: { SelectWarehouseCategory, SelectFactory, SelectFinanceCategoryLow },
  dicts: ['way_status'],
  props: {
    DialogComponentShow: Boolean,
    supplierValue: [String, Number],
    warehouseValue: [Number, String],
    excludeMaterialIds: {
      type: Array,
      default() {
        return [];
      }
    },
    isGzValue: {
      type: [String, Number],
      default: null
    },
    nested: {
      type: Boolean,
      default: false
    },
    modalTitle: {
      type: String,
      default: 'JH-添加明细'
    }
  },
  data() {
    return {
      show: false,
      selectRow: [],
      showSearch: true,
      total: 0,
      materialList: [],
      loading: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        codeKeyword: undefined,
        nameKeyword: undefined,
        modelKeyword: undefined,
        supplierId: undefined,
        storeroomId: null,
        factoryId: null,
        financeCategoryId: null,
      },
      deptSafePagingMode: false,
      deptSafeAllRows: [],
      clientModelPagingMode: false,
      clientModelPagedRows: [],
      clientKeywordPagingMode: false,
      clientKeywordPagedRows: [],
      detailSelectedRowMap: {},
      filterTableHeight: 400,
    };
  },
  beforeDestroy() {
    if (this.nested) {
      window.removeEventListener('resize', this.onFilterWindowResize);
    }
  },
  mounted() {
    this.show = this.DialogComponentShow;
    this.queryParams.supplierId = this.supplierValue;
    if (this.DialogComponentShow) {
      this.getList();
    }
    if (this.nested) {
      window.addEventListener('resize', this.onFilterWindowResize);
      this.$nextTick(() => this.updateFilterTableHeight());
    }
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.queryParams.supplierId = this.supplierValue;
        this.detailSelectedRowMap = {};
        this.getList();
        if (this.nested) {
          this.$nextTick(() => this.updateFilterTableHeight());
        }
      }
    },
    warehouseValue() {
      if (this.show) {
        this.queryParams.pageNum = 1;
        this.getList();
      }
    },
    isGzValue() {
      if (this.show) {
        this.queryParams.pageNum = 1;
        this.getList();
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
    }
  },
  methods: {
    normalizeKeyword(raw) {
      return normalizeMaterialSearchKeyword(raw);
    },
    needsClientModelPaging(modelKeyword) {
      const kw = this.normalizeKeyword(modelKeyword);
      return !!kw && /^[a-zA-Z]+$/.test(kw);
    },
    needsClientNamePaging(nameKeyword) {
      const kw = this.normalizeKeyword(nameKeyword);
      return !!kw && /^[a-zA-Z]+$/.test(kw);
    },
    needsClientKeywordPaging() {
      return this.needsClientNamePaging(this.queryParams.nameKeyword)
        || this.needsClientModelPaging(this.queryParams.modelKeyword);
    },
    applyMaterialClientFilters(rows) {
      let list = Array.isArray(rows) ? rows.slice() : [];
      const codeKw = this.normalizeKeyword(this.queryParams.codeKeyword);
      const nameKw = this.normalizeKeyword(this.queryParams.nameKeyword);
      const modelKw = this.normalizeKeyword(this.queryParams.modelKeyword);
      if (codeKw) {
        list = list.filter((row) => matchMaterialCodeKeyword(row, codeKw));
      }
      if (nameKw) {
        list = list.filter((row) => matchMaterialNameKeyword(row, nameKw));
      }
      if (modelKw) {
        list = list.filter((row) => matchModelKeyword(row && row.model, modelKw));
      }
      if (this.queryParams.financeCategoryId) {
        const fcid = this.queryParams.financeCategoryId;
        list = list.filter((row) => {
          const rowFcid = row && row.financeCategoryId != null
            ? row.financeCategoryId
            : (row && row.fdFinanceCategory && row.fdFinanceCategory.financeCategoryId);
          return rowFcid == fcid;
        });
      }
      if (this.queryParams.storeroomId) {
        const sid = this.queryParams.storeroomId;
        list = list.filter((row) => {
          const rowSid = row && row.storeroomId != null
            ? row.storeroomId
            : (row && row.fdWarehouseCategory && row.fdWarehouseCategory.warehouseCategoryId);
          return rowSid == sid;
        });
      }
      if (this.queryParams.factoryId) {
        const fid = this.queryParams.factoryId;
        list = list.filter((row) => {
          const rowFid = row && row.factoryId != null
            ? row.factoryId
            : (row && row.fdFactory && row.fdFactory.factoryId);
          return rowFid == fid;
        });
      }
      return list;
    },
    applyClientKeywordPage() {
      const all = this.clientKeywordPagedRows || [];
      this.total = all.length;
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
      const end = start + this.queryParams.pageSize;
      this.materialList = all.slice(start, end);
      this.$nextTick(() => this.updateFilterTableHeight());
    },
    formatPrice4(value) {
      if (value === null || value === undefined || value === '') {
        return '';
      }
      const n = Number(value);
      if (Number.isNaN(n)) {
        return value;
      }
      return n.toFixed(4);
    },
    applyDeptSafeClientPage() {
      const filtered = this.applyMaterialClientFilters(this.deptSafeAllRows || []);
      this.total = filtered.length;
      const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
      const end = start + this.queryParams.pageSize;
      this.materialList = filtered.slice(start, end);
      this.$nextTick(() => this.updateFilterTableHeight());
    },
    buildDeptSafeQuery() {
      const q = {};
      const nameDerived = deriveMaterialNameSearchParams(this.queryParams.nameKeyword);
      if (nameDerived.name) {
        q.name = nameDerived.name;
      } else if (nameDerived.nameSearch) {
        q.keyword = nameDerived.nameSearch;
      }
      if (this.isGzValue != null && this.isGzValue !== '') {
        q.isGz = String(this.isGzValue);
      }
      return q;
    },
    loadDeptSafeMaterials() {
      const q = this.buildDeptSafeQuery();
      return listMaterialDeptSafe(q).then(response => {
        const materialList = Array.isArray(response) ? response : [];
        this.deptSafeAllRows = materialList;
        this.applyDeptSafeClientPage();
        this.loading = false;
      });
    },
    buildPurchasePlanPickBody(options = {}) {
      const { omitModel = false, omitName = false, pageNum, pageSize } = options;
      const nameDerived = omitName
        ? { name: undefined, nameSearch: undefined }
        : deriveMaterialNameSearchParams(this.queryParams.nameKeyword);
      const q = {
        warehouseId: this.warehouseValue || undefined,
        storeroomId: this.queryParams.storeroomId,
        factoryId: this.queryParams.factoryId,
        name: nameDerived.name,
        nameSearch: nameDerived.nameSearch,
        financeCategoryId: this.queryParams.financeCategoryId || undefined,
        supplierId: this.queryParams.supplierId || undefined
      };
      const codeKw = this.normalizeKeyword(this.queryParams.codeKeyword);
      if (codeKw) {
        q.code = codeKw;
      }
      const modelKw = this.normalizeKeyword(this.queryParams.modelKeyword);
      if (modelKw && !omitModel) {
        q.model = modelKw;
      }
      if (this.isGzValue != null && this.isGzValue !== '') {
        q.isGz = String(this.isGzValue);
      }
      const exclude = (this.excludeMaterialIds || []).filter(
        id => id !== null && id !== undefined && id !== ""
      );
      if (exclude.length > 0) {
        q.excludeMaterialIds = [...new Set(exclude.map(id => String(id)))].join(",");
      }
      return {
        pageNum: pageNum != null ? pageNum : this.queryParams.pageNum,
        pageSize: pageSize != null ? pageSize : this.queryParams.pageSize,
        query: q
      };
    },
    getList() {
      this.loading = true;
      this.deptSafePagingMode = false;
      this.deptSafeAllRows = [];
      const useClientKeywordPaging = this.needsClientKeywordPaging();
      this.clientKeywordPagingMode = useClientKeywordPaging;
      this.clientModelPagingMode = useClientKeywordPaging;
      if (useClientKeywordPaging) {
        listMaterialPurchasePlanPickPost(this.buildPurchasePlanPickBody({
          omitName: this.needsClientNamePaging(this.queryParams.nameKeyword),
          omitModel: this.needsClientModelPaging(this.queryParams.modelKeyword),
          pageNum: 1,
          pageSize: 2000
        }))
          .then(response => {
            this.clientKeywordPagedRows = this.applyMaterialClientFilters(response.rows || []);
            this.clientModelPagedRows = this.clientKeywordPagedRows;
            this.queryParams.pageNum = 1;
            this.applyClientKeywordPage();
            this.loading = false;
          })
          .catch(error => {
            if (isForbiddenError(error)) {
              this.deptSafePagingMode = true;
              this.clientKeywordPagingMode = false;
              this.clientModelPagingMode = false;
              this.loadDeptSafeMaterials().catch(() => {
                this.loading = false;
              });
              return;
            }
            console.error("查询耗材列表失败:", error);
            this.loading = false;
          });
        return;
      }
      this.clientKeywordPagingMode = false;
      this.clientModelPagingMode = false;
      this.clientKeywordPagedRows = [];
      this.clientModelPagedRows = [];
      listMaterialPurchasePlanPickPost(this.buildPurchasePlanPickBody())
        .then(response => {
          this.materialList = response.rows || [];
          this.total = response.total != null ? Number(response.total) : 0;
          this.loading = false;
          this.$nextTick(() => this.updateFilterTableHeight());
        })
        .catch(error => {
          if (isForbiddenError(error)) {
            this.deptSafePagingMode = true;
            this.loadDeptSafeMaterials().catch(() => {
              this.loading = false;
            });
            return;
          }
          console.error("查询耗材列表失败:", error);
          this.loading = false;
        });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handlePagination(pagination) {
      if (pagination) {
        this.queryParams.pageNum = pagination.page;
        this.queryParams.pageSize = pagination.limit;
      }
      if (this.clientKeywordPagingMode || this.clientModelPagingMode) {
        this.applyClientKeywordPage();
      } else if (this.deptSafePagingMode) {
        this.applyDeptSafeClientPage();
      } else {
        this.getList();
      }
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(val) {
      this.selectRow = val || [];
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
      this.show = false;
      this.selectRow = [];
      this.detailSelectedRowMap = {};
      this.$emit('closeDialog');
    },
    formatDate(date) {
      if (!date) return '--';
      if (typeof date === 'string') {
        const d = new Date(date);
        if (isNaN(d.getTime())) {
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
    checkMaterialBtn() {
      if (!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: '请先选择数据', type: 'warning' });
        return;
      }
      this.$emit('selectData', this.selectRow);
      this.handleClose();
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
    sortByPrice(a, b) {
      const va = a && a.price != null && a.price !== '' ? Number(a.price) : 0;
      const vb = b && b.price != null && b.price !== '' ? Number(b.price) : 0;
      return va - vb;
    },
    sortByBilling(a, b) {
      const va = a && (a.isBilling === '1' || a.isBilling === 1) ? 1 : 0;
      const vb = b && (b.isBilling === '1' || b.isBilling === 1) ? 1 : 0;
      return va - vb;
    },
    sortByPeriodDate(a, b) {
      const va = a && a.periodDate ? new Date(a.periodDate).getTime() : 0;
      const vb = b && b.periodDate ? new Date(b.periodDate).getTime() : 0;
      return va - vb;
    },
    sortByWay(a, b) {
      const va = a && a.isWay != null ? String(a.isWay) : '';
      const vb = b && b.isWay != null ? String(b.isWay) : '';
      if (va < vb) return -1;
      if (va > vb) return 1;
      return 0;
    }
  }
};
</script>

<style scoped>
.local-modal-mask:not(.material-filter-mask--nested) {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
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
  min-height: 40px;
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

::v-deep .apply-modal-field--standard .el-input,
::v-deep .apply-modal-field--standard .el-select {
  width: 140px !important;
  max-width: 140px !important;
}

::v-deep .apply-modal-field--standard .el-select .el-input {
  width: 100% !important;
  max-width: 100% !important;
}
</style>

<style lang="scss" src="./material-filter-mask-common.scss"></style>
