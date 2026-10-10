<template>
  <div class="app-container list-page price-adjust-page" :class="{ 'is-modal-open': open }">
    <div class="form-fields-container list-query-panel" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
        <el-row :gutter="16" class="query-row-first">
          <el-col :span="24" class="query-row-first-inner">
            <el-input
              v-model="queryParams.billNo"
              placeholder="单号"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <el-select
              v-model="queryParams.adjustType"
              placeholder="调价类型"
              clearable
              class="apply-query-field"
            >
              <el-option
                v-for="item in adjustTypeOptions"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
            <el-input
              v-model="queryParams.createByName"
              placeholder="制单人"
              clearable
              class="apply-query-input apply-query-field"
              @keyup.enter.native="handleQuery"
            />
            <div class="query-actions">
              <el-button type="primary" size="small" icon="el-icon-search" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
              <el-button size="small" icon="el-icon-refresh" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
            </div>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24" class="query-row-second-inner">
            <el-form-item class="query-date-range-form-item query-item-inline">
              <el-radio-group v-model="queryParams.dateQueryType" size="small" class="apply-date-type-group">
                <el-radio-button label="bill">制单日期</el-radio-button>
                <el-radio-button label="audit">审核日期</el-radio-button>
              </el-radio-group>
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                class="query-date-picker apply-query-date"
              />
              <span class="query-date-sep">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                class="query-date-picker apply-query-date"
              />
            </el-form-item>
            <el-form-item prop="billStatus" class="query-item-inline query-item-status">
              <el-select v-model="queryParams.billStatus" placeholder="单据状态" clearable class="apply-query-field">
                <el-option
                  v-for="item in billStatusOptions"
                  :key="item.value"
                  :label="item.label"
                  :value="item.value"
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
          icon="el-icon-plus"
          class="spd-btn spd-btn--primary"
          @click="handleAdd"
        >新增</el-button>
        <el-button
          type="warning"
          size="small"
          icon="el-icon-download"
          class="spd-btn"
          @click="handleExport"
        >导出</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <div class="apply-table-panel" ref="tablePanel">
      <el-table
        ref="applyMainTable"
        v-loading="loading"
        :data="dataList"
        class="table-compact apply-main-table"
        row-key="id"
        :height="mainTableHeight"
        border
        stripe
      >
        <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
        <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable />
        <el-table-column label="单号" align="center" prop="billNo" min-width="160" show-overflow-tooltip resizable sortable>
          <template slot-scope="scope">
            <el-button type="text">
              <span>{{ scope.row.billNo || '--' }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="调价类型" align="center" prop="adjustTypeName" min-width="120" show-overflow-tooltip resizable />
        <el-table-column label="制单人" align="center" prop="createByName" min-width="100" show-overflow-tooltip resizable />
        <el-table-column label="制单日期" align="center" prop="billDate" min-width="170" show-overflow-tooltip resizable sortable>
          <template slot-scope="scope">
            <span>{{ scope.row.billDate || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="审核人" align="center" prop="auditByName" min-width="100" show-overflow-tooltip resizable />
        <el-table-column label="审核日期" align="center" prop="auditDate" min-width="170" show-overflow-tooltip resizable sortable>
          <template slot-scope="scope">
            <span>{{ scope.row.auditDate || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="打印人" align="center" prop="printByName" min-width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.printByName || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="打印日期" align="center" prop="printDate" min-width="170" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.printDate || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" min-width="160" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.remark || '--' }}</span>
          </template>
        </el-table-column>
      </el-table>

      <div class="apply-pagination-wrap apply-pager-bar" ref="paginationWrap">
        <div class="pagination-summary" />
        <pagination
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </div>
    </div>

    <!-- 新增/编辑调价弹窗（布局对齐到货验收 apply-modal） -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content apply-modal-root-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
            </div>

            <el-form ref="form" :model="form" label-width="70px" size="small" class="modal-form-compact" hide-required-asterisk>
              <div class="form-fields-container list-query-panel apply-modal-query-panel">
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-first" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="单据号" prop="billNo" class="form-item-header-billno">
                      <el-input v-model="form.billNo" :disabled="true" :title="form.billNo || ''" placeholder="保存后生成" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="调价类型" prop="adjustType" class="apply-modal-label-required">
                      <el-select v-model="form.adjustType" placeholder="调价类型" clearable class="header-field-select-compact">
                        <el-option
                          v-for="item in adjustTypeOptions"
                          :key="item.value"
                          :label="item.label"
                          :value="item.value"
                        />
                      </el-select>
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--compact">
                    <el-form-item label="供应商" prop="supplerId" class="form-item-header-supplier apply-modal-label-required">
                      <SelectSupplier v-model="form.supplerId" :onlyEnabled="true" placeholder="供应商" class="header-field-select-compact" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="制单日期" prop="billDate">
                      <el-date-picker
                        v-model="form.billDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="制单日期"
                        style="width: 100%"
                        clearable
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="制单人">
                      <el-input v-model="form.createByName" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="联系人" prop="contactName">
                      <el-input v-model="form.contactName" placeholder="联系人" clearable />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="联系方式" prop="contactPhone">
                      <el-input v-model="form.contactPhone" placeholder="联系方式" clearable />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="0" class="apply-modal-form-row apply-modal-row-second" type="flex">
                  <el-col class="apply-modal-field apply-modal-field--standard">
                    <el-form-item label="审核人">
                      <el-input v-model="form.auditByName" :disabled="true" placeholder="审核后生成" />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--date">
                    <el-form-item label="审核日期" prop="auditDate">
                      <el-date-picker
                        v-model="form.auditDate"
                        type="date"
                        value-format="yyyy-MM-dd"
                        placeholder="审核后生成"
                        style="width: 100%"
                        disabled
                      />
                    </el-form-item>
                  </el-col>
                  <el-col class="apply-modal-field apply-modal-field--remark">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" placeholder="备注" clearable />
                    </el-form-item>
                  </el-col>
                </el-row>
              </div>

              <el-row :gutter="0" class="list-toolbar apply-modal-toolbar">
                <div class="list-toolbar-left">
                  <span class="apply-modal-detail-title">调价明细信息</span>
                  <el-button
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    icon="el-icon-plus"
                    @click="handleAddDetail"
                  >添加</el-button>
                  <el-button
                    type="danger"
                    size="small"
                    icon="el-icon-delete"
                    @click="handleDeleteDetail"
                  >删除</el-button>
                  <el-button
                    type="primary"
                    size="small"
                    class="spd-btn spd-btn--primary"
                    icon="el-icon-check"
                    @click="submitForm"
                  >保 存</el-button>
                </div>
              </el-row>

              <div class="modal-detail-section apply-modal-table-panel">
                <div class="table-wrapper">
                  <el-table
                    :data="detailList"
                    class="apply-detail-table"
                    border
                    show-summary
                    :summary-method="getSummaries"
                    :height="detailTableHeight"
                    @selection-change="handleDetailSelectionChange"
                  >
                    <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
                    <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable />
                    <el-table-column label="产品编码" align="center" prop="materialCode" min-width="120" show-overflow-tooltip resizable sortable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialCode || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column
                      label="产品名称"
                      align="left"
                      header-align="center"
                      prop="materialName"
                      min-width="160"
                      :show-overflow-tooltip="false"
                      class-name="detail-col-text-wrap"
                      resizable
                      sortable
                    >
                      <template slot-scope="scope">
                        <span class="detail-text-cell-2line" :title="scope.row.materialName || '--'">{{ scope.row.materialName || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="center" prop="speci" min-width="110" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.speci || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="center" prop="model" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.model || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" prop="unit" width="70" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unit || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="原价" align="center" prop="oldPrice" min-width="100" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span class="price-cell-red">{{ scope.row.oldPrice != null && scope.row.oldPrice !== '' ? scope.row.oldPrice : '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="现价" align="center" prop="newPrice" min-width="110" resizable>
                      <template slot-scope="scope">
                        <el-input
                          v-model="scope.row.newPrice"
                          size="small"
                          class="detail-input-compact price-input-red"
                          placeholder="现价"
                          clearable
                          @input="onNewPriceInput(scope.row)"
                        />
                      </template>
                    </el-table-column>
                    <el-table-column label="财务分类" align="center" prop="financeClass" min-width="110" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.financeClass || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" prop="manufacturer" min-width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.manufacturer || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" align="center" prop="regNo" min-width="140" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.regNo || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证有效期" align="center" prop="regValidDate" min-width="120" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.regValidDate || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="包装规格" align="center" prop="packSpeci" min-width="110" show-overflow-tooltip resizable>
                      <template slot-scope="scope">
                        <span>{{ scope.row.packSpeci || '--' }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </el-form>
            <SelectMaterialFilter
              :nested="true"
              v-show="dialogMaterialShow"
              :DialogComponentShow="dialogMaterialShow"
              :supplierValue="form.supplerId"
              :excludeMaterialIds="excludeMaterialIds"
              :hideStockDetailColumns="true"
              column-preset="priceAdjust"
              modal-title="TJ-添加明细"
              @closeDialog="closeMaterialDialog"
              @selectData="selectMaterialData"
            />
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import SelectMaterialFilter from '@/components/SelectModel/SelectMaterialFilter';

export default {
  name: "PriceAdjust",
  components: { SelectMaterialFilter },
  data() {
    return {
      loading: false,
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      dataList: [],
      open: false,
      title: "",
      dialogMaterialShow: false,
      detailList: [],
      detailSelection: [],
      adjustTypeOptions: [
        { label: "档案调价", value: "archive" },
        { label: "仓库调价", value: "warehouse" },
        { label: "科室调价", value: "department" }
      ],
      billStatusOptions: [
        { label: "草稿", value: "0" },
        { label: "已审核", value: "2" }
      ],
      form: {
        billNo: "",
        adjustType: null,
        supplerId: null,
        billDate: null,
        createByName: "",
        contactName: "",
        contactPhone: "",
        auditByName: "",
        auditDate: null,
        remark: ""
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        adjustType: null,
        createByName: null,
        billStatus: null,
        dateQueryType: "bill",
        beginDate: this.getStatDate(),
        endDate: this.getEndDate()
      }
    };
  },
  computed: {
    detailTableHeight() {
      return "max(240px, calc(100vh - 360px))";
    },
    excludeMaterialIds() {
      return (this.detailList || [])
        .map((d) => d.materialId)
        .filter((id) => id != null && id !== "");
    }
  },
  mounted() {
    this.getList();
    this.$nextTick(() => this.updateMainTableHeight());
    window.addEventListener("resize", this.onWindowResize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.onWindowResize);
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    total() {
      this.$nextTick(() => this.updateMainTableHeight());
    },
    open(val) {
      if (!val) {
        this.$nextTick(() => this.updateMainTableHeight());
      }
    }
  },
  methods: {
    getStatDate() {
      const d = new Date();
      d.setDate(d.getDate() - 5);
      return this.formatDate(d);
    },
    getEndDate() {
      return this.formatDate(new Date());
    },
    formatDate(d) {
      const pad = (n) => (n < 10 ? "0" + n : "" + n);
      return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
    },
    onWindowResize() {
      this.updateMainTableHeight();
    },
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      const pagWrap = this.$refs.paginationWrap;
      if (!panel || !panel.getBoundingClientRect) return;
      const panelH = panel.clientHeight || panel.getBoundingClientRect().height;
      if (!panelH) return;
      const pagH = Math.max((pagWrap && pagWrap.offsetHeight) || 0, 56) + 8;
      const height = Math.max(200, Math.floor(panelH - pagH));
      if (Math.abs(this.mainTableHeight - height) >= 2) {
        this.mainTableHeight = height;
      }
      this.$nextTick(() => {
        const table = this.$refs.applyMainTable;
        if (table && table.doLayout) table.doLayout();
      });
    },
    /** 前端占位：暂不请求接口 */
    getList() {
      this.loading = false;
      this.dataList = [];
      this.total = 0;
      this.$nextTick(() => this.updateMainTableHeight());
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        adjustType: null,
        createByName: null,
        billStatus: null,
        dateQueryType: "bill",
        beginDate: this.getStatDate(),
        endDate: this.getEndDate()
      };
      this.getList();
    },
    handleAdd() {
      this.resetForm();
      this.title = "添加调价";
      this.open = true;
    },
    resetForm() {
      const nick =
        (this.$store.getters.nickName) ||
        (this.$store.state.user && this.$store.state.user.nickName) ||
        "";
      this.form = {
        billNo: "",
        adjustType: null,
        supplerId: null,
        billDate: this.getEndDate(),
        createByName: nick,
        contactName: "",
        contactPhone: "",
        auditByName: "",
        auditDate: null,
        remark: ""
      };
      this.detailList = [];
      this.detailSelection = [];
    },
    cancel() {
      this.open = false;
      this.dialogMaterialShow = false;
      this.resetForm();
    },
    handleAddDetail() {
      if (!this.form.supplerId) {
        this.$message({ message: "请先选择供应商", type: "warning" });
        return;
      }
      this.dialogMaterialShow = true;
    },
    closeMaterialDialog() {
      this.dialogMaterialShow = false;
    },
    selectMaterialData(val) {
      const rows = Array.isArray(val) ? val : [];
      rows.forEach((item) => {
        const material = item.material || item;
        const exists = this.detailList.some(
          (d) => d.materialId != null && d.materialId === (material.id || item.id)
        );
        if (exists) return;
        this.detailList.push({
          materialId: material.id || item.id,
          materialCode: material.code || "",
          materialName: material.name || "",
          speci: material.speci || "",
          model: material.model || "",
          unit: (material.fdUnit && material.fdUnit.unitName) || material.unitName || "",
          oldPrice: item.unitPrice != null ? item.unitPrice : (material.price != null ? material.price : null),
          newPrice: null,
          financeClass:
            (material.fdFinanceCategory && material.fdFinanceCategory.financeCategoryName) || "",
          manufacturer:
            (material.fdFactory && material.fdFactory.factoryName) || material.factoryName || "",
          supplierName: (material.supplier && material.supplier.name) || "",
          regNo: material.registerNo || "",
          regValidDate: material.periodDate || "",
          packSpeci: material.packageSpeci || ""
        });
      });
      this.detailList.forEach((row, idx) => {
        row.index = idx + 1;
      });
    },
    onNewPriceInput(row) {
      if (!row) return;
      let v = row.newPrice;
      if (v === "" || v == null) {
        row.newPrice = null;
        return;
      }
      // 仅允许数字与小数点，与原价/单价同为数值类型
      v = String(v).replace(/[^\d.]/g, "");
      const parts = v.split(".");
      if (parts.length > 2) {
        v = parts[0] + "." + parts.slice(1).join("");
      }
      if (v === "" || v === ".") {
        row.newPrice = v === "." ? "0." : null;
        return;
      }
      const num = Number(v);
      row.newPrice = Number.isNaN(num) ? null : (v.endsWith(".") ? v : num);
    },
    handleDeleteDetail() {
      if (!this.detailSelection.length) {
        this.$message({ message: "请先勾选要删除的明细", type: "warning" });
        return;
      }
      const removeIds = new Set(
        this.detailSelection.map((r) => r.materialId).filter((id) => id != null)
      );
      this.detailList = this.detailList
        .filter((r) => !removeIds.has(r.materialId))
        .map((r, idx) => ({ ...r, index: idx + 1 }));
      this.detailSelection = [];
    },
    handleDetailSelectionChange(selection) {
      this.detailSelection = selection || [];
    },
    getSummaries(param) {
      const { columns } = param;
      const sums = columns.map(() => "");
      let placed = false;
      columns.forEach((column, index) => {
        if (column.type === "selection") {
          sums[index] = "";
          return;
        }
        if (!placed && (column.property === "index" || column.label === "序号")) {
          sums[index] = "合计";
          placed = true;
        }
      });
      return sums;
    },
    submitForm() {
      this.$modal.msg("调价功能开发中，当前仅展示界面");
    },
    handleExport() {
      this.$modal.msg("调价功能开发中，当前仅展示列表界面");
    }
  }
};
</script>

<style scoped>
.apply-pager-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px 16px;
  min-height: 40px;
  padding: 4px 0;
  box-sizing: border-box;
}
.apply-pager-bar .pagination-summary {
  flex: 1 1 auto;
  min-width: 120px;
}
.apply-pager-bar .pagination-container {
  margin-top: 0 !important;
  margin-left: auto;
}

/* 弹窗打开时去掉页底留白，避免露出灰色底边 */
.app-container.price-adjust-page.is-modal-open {
  padding-bottom: 0 !important;
}

/* 弹窗：对齐到货验收——左右外扩抵消 padding，顶部保留 8px 与页签间隙 */
.local-modal-mask {
  position: absolute;
  left: -8px;
  right: -8px;
  top: 0;
  bottom: 0;
  width: auto;
  height: auto;
  background: rgba(0, 0, 0, 0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  overflow: hidden;
}
.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
.local-modal-content.apply-modal-root-content {
  position: relative;
  padding-bottom: 0;
  overflow: hidden;
  background: #fff;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 8px;
  border-bottom: 1px solid #ebeef5;
  background: #ebeef5;
  min-height: 40px;
  flex: 0 0 auto;
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
/* 仅主弹窗表单，避免嵌套「添加明细」顶部留白被吃掉 */
.local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  padding: 8px 0 0;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.detail-text-cell-2line {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-all;
  line-height: 1.35;
  white-space: normal;
}
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-zoom-enter-active,
.modal-zoom-leave-active {
  transition: transform 0.2s ease, opacity 0.2s ease;
}
.modal-zoom-enter,
.modal-zoom-leave-to {
  transform: scale(0.98);
  opacity: 0;
}
</style>

<style>
/*
 * 非 scoped：对齐到货验收——通栏铺满、上下仅 4px 间距，左右无额外内缩
 */
.app-container.price-adjust-page.is-modal-open {
  padding-bottom: 0 !important;
}
.app-container.price-adjust-page .local-modal-mask {
  left: -8px !important;
  right: -8px !important;
  top: 0 !important;
  bottom: 0 !important;
  width: auto !important;
  height: auto !important;
  position: absolute !important;
  overflow: hidden !important;
}

/* 仅主弹窗表单；勿覆盖添加明细嵌套层 material-filter-form 顶部 8px 留白 */
.app-container.price-adjust-page .local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) {
  padding: 8px 0 0 !important;
  box-sizing: border-box;
  background: #fff !important;
}

/* —— 1. 主弹窗表头容器（不含添加明细嵌套层） —— */
.app-container.price-adjust-page .local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) .apply-modal-query-panel {
  flex: 0 0 auto;
  margin: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
  padding: 12px 8px !important;
  border-radius: 0 !important;
  border: none !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: none !important;
  background: #fff !important;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .el-row {
  margin-bottom: 10px;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .el-row:last-child {
  margin-bottom: 0;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row.el-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
  margin-left: 0 !important;
  margin-right: 0 !important;
  padding-left: 12px;
  box-sizing: border-box;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row > .el-col {
  width: auto !important;
  flex: 0 0 auto;
  max-width: none;
  padding-left: 0 !important;
  padding-right: 0 !important;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item {
  margin-bottom: 0;
  white-space: nowrap;
  display: inline-flex;
  align-items: center;
  vertical-align: top;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__label {
  float: none;
  width: auto !important;
  flex: 0 0 auto;
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-form-row .el-form-item__content {
  flex: 0 0 auto;
  margin-left: 0 !important;
  line-height: 28px;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required .el-form-item__label {
  color: #f56c6c !important;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .el-form-item.apply-modal-label-required.is-required .el-form-item__label::before {
  content: none !important;
  display: none !important;
}
.app-container.price-adjust-page .local-modal-content .modal-form-compact .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .form-item-header-billno .el-input,
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-input,
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--compact .el-select,
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--compact .header-field-select-compact {
  width: 162px !important;
  max-width: 162px !important;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--standard .el-input,
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--standard .el-select,
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--standard .el-date-editor {
  width: 140px !important;
  max-width: 140px !important;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--date .el-date-editor {
  width: 150px !important;
  max-width: 150px !important;
}
/* 备注 ≈ 两个紧凑输入框 */
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--remark {
  width: auto !important;
  flex: 0 0 auto !important;
  max-width: none !important;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--remark .el-form-item {
  width: auto;
  display: inline-flex;
  white-space: nowrap;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--remark .el-form-item__content {
  flex: 0 0 auto;
}
.app-container.price-adjust-page .local-modal-content .apply-modal-query-panel .apply-modal-field--remark .el-input {
  width: 336px !important;
  max-width: 336px !important;
}

/* —— 2. 主弹窗按钮行（不含添加明细嵌套层） —— */
.app-container.price-adjust-page .local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) .apply-modal-toolbar.list-toolbar {
  flex: 0 0 auto !important;
  display: flex !important;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin: 4px 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
  padding: 6px 12px !important;
  background: #fff !important;
  border: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: visible !important;
}
.app-container.price-adjust-page .local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) .apply-modal-toolbar .list-toolbar-left {
  display: inline-flex !important;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  padding-left: 0;
}
.app-container.price-adjust-page .local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) .apply-modal-detail-title {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
  margin-right: 4px;
  line-height: 32px;
}

/* —— 3. 主弹窗明细框 —— */
.app-container.price-adjust-page .local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) .apply-modal-table-panel {
  margin: 0 !important;
  width: 100% !important;
  max-width: 100% !important;
  box-sizing: border-box;
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff !important;
  border: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
  overflow: hidden;
}
.app-container.price-adjust-page .local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) .apply-modal-table-panel .table-wrapper {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  width: 100%;
  box-sizing: border-box;
}
.app-container.price-adjust-page .local-modal-content > .el-form.modal-form-compact:not(.material-filter-form) .apply-modal-table-panel .apply-detail-table {
  margin-bottom: 0 !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}

/* 明细表头高度：与到货验收一致 34px */
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th,
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th.el-table__cell,
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th,
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th.el-table__cell {
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
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__header-wrapper th .cell,
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__fixed-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

/* 合计行 */
.app-container.price-adjust-page .local-modal-content .modal-detail-section .el-table.apply-detail-table > .el-table__footer-wrapper,
.app-container.price-adjust-page .local-modal-content .modal-detail-section .el-table.apply-detail-table .el-table__fixed-footer-wrapper {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
  background-color: #f1f5f9 !important;
  position: relative;
  z-index: 30 !important;
}
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper tr {
  height: 38px !important;
}
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td,
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td.el-table__cell {
  height: 38px !important;
  min-height: 38px !important;
  padding: 6px 0 !important;
  line-height: 24px !important;
  box-sizing: border-box !important;
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  border-top: 1px solid #e2e8f0 !important;
  border-bottom: none !important;
}
.app-container.price-adjust-page .local-modal-content .modal-detail-section .apply-detail-table .el-table__footer-wrapper td .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 24px !important;
  text-align: center !important;
}

/* 添加明细嵌套弹窗：与到货验收 RK-添加明细一致 */
.app-container.price-adjust-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested {
  position: absolute;
  left: 0;
  right: -8px;
  top: 0;
  bottom: 0;
  width: auto;
  box-sizing: border-box;
  z-index: 3100;
}
.app-container.price-adjust-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-header {
  padding: 6px 8px !important;
  background: #ebeef5 !important;
  min-height: 40px !important;
  border-bottom: 1px solid #ebeef5 !important;
}
.app-container.price-adjust-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested .modal-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
}
html body .app-container.price-adjust-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .local-modal-content.material-filter-modal--nested.apply-inbound-nested-modal {
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
}
.app-container.price-adjust-page .apply-modal-root-content > .material-filter-mask.material-filter-mask--nested > .material-filter-modal--nested {
  width: 100%;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  overflow: hidden;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
}
html body .app-container.price-adjust-page .apply-inbound-nested-modal > .material-filter-form.modal-form-compact {
  padding: 8px 0 12px !important;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: #fff !important;
  box-sizing: border-box !important;
}
/* 标题栏与搜索容器之间可见留白（与到货验收 RK-添加明细一致） */
html body .app-container.price-adjust-page .apply-inbound-nested-modal .material-filter-form > .apply-modal-query-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  padding: 12px 8px !important;
  border-radius: 0 !important;
  border-left: none !important;
  border-right: none !important;
  border-top: 1px solid #e8ecf1 !important;
  border-bottom: 1px solid #e8ecf1 !important;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04) !important;
  background: #fff !important;
}
.app-container.price-adjust-page .apply-inbound-nested-modal .apply-modal-toolbar.list-toolbar {
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
.app-container.price-adjust-page .apply-inbound-nested-modal .material-filter-form > .apply-table-panel {
  flex: 1 1 auto;
  min-height: 0;
  margin-bottom: 0;
}

/* 原价/现价：仅单元格内容红色，表头不变色 */
.app-container.price-adjust-page .apply-detail-table .price-cell-red {
  color: #f56c6c;
  font-weight: 500;
}
.app-container.price-adjust-page .apply-detail-table .price-input-red .el-input__inner {
  color: #f56c6c !important;
  font-weight: 500;
}
.app-container.price-adjust-page .apply-detail-table .detail-input-compact .el-input__inner {
  height: 28px;
  line-height: 28px;
  padding: 0 8px;
  text-align: center;
}
</style>
