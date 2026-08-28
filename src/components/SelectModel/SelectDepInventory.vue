<template>
  <div
    v-show="show"
    class="local-modal-mask material-filter-mask dep-inventory-select-mask"
    :class="{
      'material-filter-mask--nested': nested,
      'dep-inventory-select-full-modal': !nested
    }"
  >
    <div
      class="local-modal-content material-filter-modal"
      :class="{
        'material-filter-modal--nested': nested,
        'apply-inbound-nested-modal': nested
      }"
    >
      <div class="modal-header">
        <div class="modal-title">{{ displayModalTitle }}</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <el-form
        :model="queryParams"
        ref="queryForm"
        v-show="showSearch"
        label-width="70px"
        size="small"
        class="modal-form-compact material-filter-form dep-inventory-select-form"
        hide-required-asterisk
        @submit.native.prevent
      >
        <div class="form-fields-container list-query-panel apply-modal-query-panel">
          <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="科室" prop="departmentId">
                <SelectDepartment v-model="queryParams.departmentId" :value2="isShow" :finance-pick-mode="true" />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="耗材" prop="materialId">
                <SelectMaterial v-model="queryParams.materialId" :use-dept-safe-list="true" />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="关键字" prop="materialKeyword">
                <el-input
                  v-model="queryParams.materialKeyword"
                  placeholder="耗材编码/名称/简码"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row v-if="!useMaterialDict" :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="批次号" prop="batchNo">
                <el-input
                  v-model="queryParams.batchNo"
                  placeholder="批次号"
                  clearable
                  size="small"
                  @keyup.enter.native="handleQuery"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard">
              <el-form-item label="财务分类" prop="financeCategoryId" label-width="84px">
                <SelectFinanceCategoryLow
                  v-model="queryParams.financeCategoryId"
                  placeholder="财务分类"
                />
              </el-form-item>
            </el-col>
            <el-col class="apply-modal-field apply-modal-field--standard" />
          </el-row>
        </div>

        <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
          <div class="list-toolbar-left">
            <span class="apply-modal-detail-title">{{ toolbarTitle }}</span>
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
              @click="checkBtn"
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
            :data="inventoryList"
            :row-class-name="inventoryIndex"
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
            <el-table-column label="耗材编码" align="center" width="130" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.code')">
              <template slot-scope="scope">
                <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
            <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.name')" />
            <el-table-column label="规格" align="center" prop="material.speci" width="140" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.speci')" />
            <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable />
            <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable />
            <el-table-column label="库存数量" align="center" min-width="100" width="100" show-overflow-tooltip resizable sortable>
              <template slot-scope="scope">
                <span>{{ useMaterialDict ? '--' : (scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '--') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable sortable />
            <el-table-column label="金额" align="center" prop="amt" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ useMaterialDict ? '--' : (scope.row.amt != null && scope.row.amt !== '' ? scope.row.amt : '--') }}</span>
              </template>
            </el-table-column>
            <el-table-column label="归属仓库" align="center" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="生产批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable />
            <el-table-column label="耗材批次号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable />
            <el-table-column label="有效期" align="center" prop="endDate" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.endDate">{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="生产日期" align="center" prop="beginDate" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.beginDate">{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="批次号" align="center" prop="batchNo" width="160" show-overflow-tooltip resizable />
            <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip resizable sortable :sort-method="(a,b)=>sortByNested(a,b,'material.fdFactory.factoryName')">
              <template slot-scope="scope">
                <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="供应商" align="center" prop="supplier.name" width="150" show-overflow-tooltip resizable />
            <el-table-column label="注册证号" align="center" prop="material.registerNo" width="160" show-overflow-tooltip resizable />
            <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="120" show-overflow-tooltip resizable />
            <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="120" show-overflow-tooltip resizable />
            <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="120" show-overflow-tooltip resizable />
            <el-table-column label="储存方式" align="center" prop="material.isWay" width="100" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay" />
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="耗材日期" align="center" prop="materialDate" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
            <el-table-column label="入库日期" align="center" prop="warehouseDate" width="120" show-overflow-tooltip resizable>
              <template slot-scope="scope">
                <span v-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
                <span v-else>--</span>
              </template>
            </el-table-column>
          </el-table>

          <div class="apply-pagination-wrap" ref="filterPaginationWrap">
            <pagination
              class="modal-entry-pagination"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              :hide-on-single-page="false"
              @pagination="handlePagination"
            />
          </div>
        </div>

        <div v-else class="modal-detail-section apply-modal-table-panel">
          <div class="table-wrapper">
            <el-table
              ref="singleTable"
              v-loading="loading"
              class="apply-detail-table material-filter-detail-table"
              :data="inventoryList"
              :row-class-name="inventoryIndex"
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
              <el-table-column label="耗材编码" align="center" width="130" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="科室" align="center" prop="department.name" width="120" show-overflow-tooltip resizable />
              <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable />
              <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable />
              <el-table-column label="型号" align="center" prop="material.model" width="180" show-overflow-tooltip resizable />
              <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="100" show-overflow-tooltip resizable />
              <el-table-column label="库存数量" align="center" min-width="100" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ useMaterialDict ? '--' : (scope.row.qty != null && scope.row.qty !== '' ? scope.row.qty : '--') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable />
              <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ useMaterialDict ? '--' : (scope.row.amt != null && scope.row.amt !== '' ? scope.row.amt : '--') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="归属仓库" align="center" width="120" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.warehouse && scope.row.warehouse.name) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="生产批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable />
              <el-table-column label="耗材批次号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable />
              <el-table-column label="有效期" align="center" prop="endDate" width="140" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.endDate">{{ parseTime(scope.row.endDate, '{y}-{m}-{d}') }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="生产日期" align="center" prop="beginDate" width="140" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.beginDate">{{ parseTime(scope.row.beginDate, '{y}-{m}-{d}') }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable />
              <el-table-column label="生产厂家" align="center" width="180" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable />
              <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable />
              <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable />
              <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable />
              <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable />
              <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <dict-tag v-if="scope.row.material && scope.row.material.isWay" :options="dict.type.way_status" :value="scope.row.material.isWay" />
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="耗材日期" align="center" prop="materialDate" width="200" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="入库日期" align="center" prop="warehouseDate" width="180" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div class="apply-pagination-wrap">
            <pagination
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="handlePagination"
            />
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import { listInventoryPick } from "@/api/department/depInventory";
import { listMaterial } from "@/api/foundation/material";
import { sortInventoryRowsByNameSpecCodeMaterialId } from "@/utils/stocktakingInventorySort";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectFinanceCategoryLow from "@/components/SelectModel/SelectFinanceCategoryLow";

export default {
  name: "SelectDepInventory",
  components: { SelectMaterial, SelectDepartment, SelectFinanceCategoryLow },
  dicts: ["way_status"],
  props: {
    DialogComponentShow: {},
    departmentValue: {},
    warehouseValue: {},
    selectedDetails: {},
    /** 为 true 时列表按名称、规格、编码、产品档案 id 排序（盘点初始化/盘亏选库存等） */
    stocktakingPickSortByMaterial: {
      type: Boolean,
      default: false
    },
    /** 为 true 时标题为「添加明细」，数据来自耗材字典 /foundation/material/list，不再查科室库存 */
    useMaterialDict: {
      type: Boolean,
      default: false
    },
    modalTitle: {
      type: String,
      default: ""
    },
    /** 嵌套在父业务弹窗内（退库申请添加明细等，对齐到货验收 RK-添加明细） */
    nested: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      show: false,
      loading: false,
      selectRow: [],
      isShow: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      inventoryList: [],
      filterTableHeight: 400,
      unitOptions: [],
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        departmentId: null,
        warehouseId: null,
        materialId: null,
        materialKeyword: null,
        batchNo: null,
        financeCategoryId: null
      },
      form: {},
      selectedRowMap: {}
    };
  },
  mounted() {
    this.show = this.DialogComponentShow;
    this.queryParams.departmentId = this.departmentValue;
    if (this.warehouseValue != null && this.warehouseValue !== "") {
      this.queryParams.warehouseId = this.warehouseValue;
    }
    if (this.show) {
      this.getList();
    }
    if (this.nested) {
      window.addEventListener("resize", this.onFilterWindowResize);
      this.$nextTick(() => this.updateFilterTableHeight());
    }
  },
  beforeDestroy() {
    if (this.nested) {
      window.removeEventListener("resize", this.onFilterWindowResize);
    }
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.selectedRowMap = {};
        this.selectRow = [];
        this.queryParams.pageNum = 1;
        this.queryParams.departmentId = this.departmentValue;
        if (this.warehouseValue != null && this.warehouseValue !== "") {
          this.queryParams.warehouseId = this.warehouseValue;
        }
        this.getList();
        this.$nextTick(() => {
          if (this.nested) this.updateFilterTableHeight();
        });
      }
    }
  },
  computed: {
    displayModalTitle() {
      if (this.modalTitle) return this.modalTitle;
      return this.useMaterialDict ? "添加明细" : "科室库存明细";
    },
    toolbarTitle() {
      return this.useMaterialDict ? "耗材明细信息" : "科室库存明细信息";
    }
  },
  methods: {
    /** 字典耗材 -> 与库存行结构接近的表格行，便于共用列模板 */
    materialDictToTableRow(m) {
      if (!m) return null;
      const unitPrice =
        m.price != null && m.price !== ""
          ? m.price
          : m.salePrice != null && m.salePrice !== ""
            ? m.salePrice
            : null;
      return {
        _fromMaterialDict: true,
        id: m.id,
        materialId: m.id,
        material: m,
        qty: null,
        unitPrice,
        amt: null,
        batchNo: "",
        batchNumber: "",
        materialNo: "",
        beginDate: null,
        endDate: null,
        beginTime: null,
        endTime: null,
        warehouse: null,
        department: null,
        materialDate: null,
        warehouseDate: null,
        supplier: m.supplier || null,
        fdFactory: m.fdFactory || null
      };
    },
    getRowKey(row) {
      if (!row) return null;
      if (this.useMaterialDict) {
        return row.materialId != null ? "dict-" + String(row.materialId) : null;
      }
      if (row.id != null) return "inv-" + String(row.id);
      if (row.materialId != null && row.batchNo != null && row.batchNo !== "") {
        return "inv-" + String(row.materialId) + "__" + String(row.batchNo);
      }
      return row.materialId != null ? "inv-m-" + String(row.materialId) : null;
    },
    restorePageSelection() {
      if (!this.$refs.singleTable || !this.inventoryList || this.inventoryList.length === 0) {
        return;
      }
      this.$refs.singleTable.clearSelection();
      this.inventoryList.forEach(row => {
        const key = this.getRowKey(row);
        if (key && this.selectedRowMap[key]) {
          this.$refs.singleTable.toggleRowSelection(row, true);
        }
      });
    },
    handlePagination({ page, limit }) {
      if (page != null) this.queryParams.pageNum = page;
      if (limit != null) this.queryParams.pageSize = limit;
      this.getList();
    },
    buildInventoryPickParams() {
      const params = { ...this.queryParams };
      if (params.financeCategoryId != null && params.financeCategoryId !== "") {
        params.financeCategoryIds = [params.financeCategoryId];
      } else {
        params.financeCategoryIds = null;
      }
      delete params.financeCategoryId;
      return params;
    },
    getList() {
      this.loading = true;
      if (this.useMaterialDict) {
        const q = {
          pageNum: this.queryParams.pageNum,
          pageSize: this.queryParams.pageSize
        };
        if (this.queryParams.materialId) {
          q.id = this.queryParams.materialId;
        }
        const kw = this.queryParams.materialKeyword;
        if (kw != null && String(kw).trim() !== "") {
          q.name = String(kw).trim();
        }
        listMaterial(q)
          .then((response) => {
            const materials = response.rows || [];
            const rows = materials.map((m) => this.materialDictToTableRow(m)).filter(Boolean);
            // 盘盈等产品字典选择：不过滤单据明细已有 materialId，允许同产品重复选入（如多条盘盈行）
            this.inventoryList = this.stocktakingPickSortByMaterial
              ? sortInventoryRowsByNameSpecCodeMaterialId(rows)
              : rows;
            this.total = response.total != null ? Number(response.total) : 0;
            this.loading = false;
            this.$nextTick(() => {
              this.restorePageSelection();
              if (this.nested) this.updateFilterTableHeight();
            });
          })
          .catch(() => {
            this.loading = false;
          });
        return;
      }
      listInventoryPick(this.buildInventoryPickParams())
        .then(response => {
          const rows = response.rows || [];
          let filteredCount = 0;
          if (this.selectedDetails && this.selectedDetails.length) {
            const existedDepInvIds = new Set(
              this.selectedDetails.flatMap((d) => {
                if (!d) {
                  return [];
                }
                const keys = [];
                if (d.depInventoryId != null && String(d.depInventoryId).trim() !== "") {
                  keys.push(String(d.depInventoryId).trim());
                }
                if (d.kcNo != null && String(d.kcNo).trim() !== "") {
                  keys.push(String(d.kcNo).trim());
                }
                return keys;
              })
            );
            const existedBatchKeys = new Set(
              this.selectedDetails
                .filter(d => d && d.materialId != null && d.batchNo && (d.kcNo == null || d.kcNo === ""))
                .map(d => `${d.materialId}__${d.batchNo}`)
            );
            const filtered = rows.filter(it => {
              if (!it) return true;
              if (it.id != null && existedDepInvIds.has(String(it.id))) {
                filteredCount++;
                return false;
              }
              const legacyKey = it.materialId != null && it.batchNo ? `${it.materialId}__${it.batchNo}` : null;
              if (legacyKey && existedBatchKeys.has(legacyKey)) {
                filteredCount++;
                return false;
              }
              return true;
            });
            this.inventoryList = this.stocktakingPickSortByMaterial
              ? sortInventoryRowsByNameSpecCodeMaterialId(filtered)
              : filtered;
          } else {
            this.inventoryList = this.stocktakingPickSortByMaterial
              ? sortInventoryRowsByNameSpecCodeMaterialId(rows)
              : rows;
          }
          const serverTotal = response.total != null ? Number(response.total) : 0;
          this.total = filteredCount > 0 ? Math.max(0, serverTotal - filteredCount) : serverTotal;
          this.loading = false;
          this.$nextTick(() => {
            this.restorePageSelection();
            if (this.nested) this.updateFilterTableHeight();
          });
        })
        .catch(() => {
          this.loading = false;
        });
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.departmentId = this.departmentValue;
      this.queryParams.materialKeyword = null;
      if (this.warehouseValue != null && this.warehouseValue !== "") {
        this.queryParams.warehouseId = this.warehouseValue;
      } else {
        this.queryParams.warehouseId = null;
      }
      this.queryParams.batchNo = null;
      this.queryParams.financeCategoryId = null;
      this.handleQuery();
    },
    handleSelectionChange(val) {
      const pageKeys = (this.inventoryList || [])
        .map(row => this.getRowKey(row))
        .filter(Boolean);
      pageKeys.forEach(key => {
        if (this.selectedRowMap[key]) {
          delete this.selectedRowMap[key];
        }
      });
      (val || []).forEach(row => {
        const key = this.getRowKey(row);
        if (key) {
          this.selectedRowMap[key] = row;
        }
      });
      this.selectRow = Object.values(this.selectedRowMap);
    },
    handleClose() {
      this.show = false;
      this.selectedRowMap = {};
      this.selectRow = [];
      this.$emit("closeDialog");
    },
    checkBtn() {
      if (!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: "请先选择数据", type: "warning" });
        return;
      }
      this.$emit("selectData", this.selectRow);
      this.handleClose();
    },
    inventoryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    sortByNested(a, b, path) {
      const getVal = (obj) => {
        if (!obj) return "";
        const keys = path.split(".");
        let v = obj;
        for (let i = 0; i < keys.length; i++) {
          v = v ? v[keys[i]] : "";
        }
        return v == null ? "" : String(v);
      };
      return getVal(a).localeCompare(getVal(b), "zh-CN");
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
          if (table && table.doLayout) table.doLayout();
        });
      };
      this.$nextTick(run);
      requestAnimationFrame(run);
      ;[50, 120, 300].forEach((ms) => setTimeout(run, ms));
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.dep-inventory-select-full-modal.local-modal-mask {
  position: fixed;
  width: 100vw;
  height: 100vh;
  background: rgba(0, 0, 0, 0.4);
  z-index: 3000;
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  position: relative;
}

.dep-inventory-select-full-modal .local-modal-content {
  height: 100vh;
  max-height: 100vh;
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

<style lang="scss">
.dep-inventory-select-mask.material-filter-mask--nested {
  position: absolute;
  z-index: 3100;
}

.dep-inventory-select-mask.material-filter-mask--nested .local-modal-content.material-filter-modal--nested {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  overflow: hidden !important;
}

.dep-inventory-select-mask .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}

.dep-inventory-select-mask.material-filter-mask--nested .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dep-inventory-select-mask .local-modal-content .apply-modal-query-panel {
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

.dep-inventory-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  gap: 6px;
  margin-bottom: 4px;
}

.dep-inventory-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row:last-child {
  margin-bottom: 0;
}

.dep-inventory-select-mask .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
}

.dep-inventory-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar {
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

.dep-inventory-select-mask .local-modal-content .apply-modal-toolbar.list-toolbar .list-toolbar-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
}

.dep-inventory-select-mask .apply-modal-detail-title {
  margin-right: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  line-height: 32px;
}

.dep-inventory-select-mask.material-filter-mask--nested .material-filter-form.modal-form-compact > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.dep-inventory-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table {
  margin-top: 0;
  flex: 0 0 auto;
  border-radius: 10px 10px 0 0;
  box-shadow: none;
  margin-bottom: 0;
}

.dep-inventory-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #EBEEF5;
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 4px 8px;
  box-sizing: border-box;
}

.dep-inventory-select-mask.material-filter-mask--nested .apply-table-panel .apply-pagination-wrap .pagination-container {
  padding: 0 !important;
  margin: 0 !important;
  background: transparent;
}

.dep-inventory-select-mask.material-filter-mask--nested .apply-table-panel > .apply-main-table > .el-table__body-wrapper {
  overflow: auto !important;
}
</style>
