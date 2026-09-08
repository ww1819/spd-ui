<template>
  <div class="app-container list-page material-compare-page">
    <!-- 左右分栏布局：左边供应商列表，右边耗材明细 -->
    <el-row :gutter="8" class="compare-layout-row">
      <!-- 左边：供应商列表（在 span6 基础上收窄 1/4 → 约 18.75%） -->
      <el-col class="supplier-col">
        <div class="supplier-container">
          <div class="supplier-header">
            <span class="supplier-title">供应商列表</span>
          </div>
          <el-table 
            ref="supplierTable"
            :data="supplierList" 
            height="100%"
            border
            highlight-current-row
            @current-change="handleSupplierChange"
            v-loading="supplierLoading"
            :row-style="{cursor: 'pointer'}"
            style="flex: 1; overflow: hidden;"
          >
            <el-table-column type="index" label="序号" width="60" align="center"/>
            <el-table-column label="供应商名称" prop="name" show-overflow-tooltip>
              <template slot="header">
                <span style="cursor: pointer;" @click.stop="handleShowAll">供应商名称</span>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      
      <!-- 右边：耗材明细（承接左侧收窄后的宽度） -->
      <el-col class="material-col">
        <div class="material-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="compare-query-row">
                <el-input
                  v-model="queryParams.code"
                  placeholder="项目编码"
                  clearable
                  class="compare-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.name"
                  placeholder="名称"
                  clearable
                  class="compare-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.supplierName"
                  placeholder="供应商搜索"
                  clearable
                  class="compare-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.speci"
                  placeholder="规格"
                  clearable
                  class="compare-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-select
                  v-model="queryParams.isBilling"
                  placeholder="是否收费"
                  clearable
                  class="compare-query-control"
                >
                  <el-option label="是" value="1" />
                  <el-option label="否" value="2" />
                </el-select>
                <div class="compare-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
              <div class="compare-query-row compare-query-row--second">
                <el-input
                  v-model="queryParams.hisChargeItemId"
                  placeholder="收费项目ID"
                  clearable
                  class="compare-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-select
                  v-model="queryParams.hisBindStatus"
                  placeholder="是否对照"
                  clearable
                  class="compare-query-control"
                >
                  <el-option label="已对照" value="1" />
                  <el-option label="未对照" value="0" />
                </el-select>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar compare-toolbar">
            <div class="list-toolbar-left">
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleFetchHisChargeItems"
              >抓取收费项目</el-button>
            </div>
          </el-row>

          <div class="apply-table-panel table-container" ref="tablePanel">
            <el-table
              ref="compareTable"
              v-loading="loading"
              :data="materialCompareList"
              class="apply-main-table"
              border
              :height="mainTableHeight"
              :cell-style="{whiteSpace: 'nowrap'}"
              stripe
              :row-class-name="compareRowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column type="index" label="序号" align="center" width="80" />
              <el-table-column label="耗材编码" align="center" prop="code" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="收费项目ID" align="center" prop="hisChargeItemId" width="120" show-overflow-tooltip />
              <el-table-column label="耗材名称" align="center" prop="name" min-width="200" sortable="custom" show-overflow-tooltip />
              <el-table-column label="收费名称" align="center" prop="hisChargeItemName" min-width="180" show-overflow-tooltip />
              <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip />
              <el-table-column label="收费规格" align="center" prop="hisChargeItemSpeci" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip />
              <el-table-column label="单位" align="center" width="80" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdUnit && scope.row.fdUnit.unitName) || scope.row.unitName || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="价格" align="center" prop="price" width="100" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ formatCurrency(scope.row.price) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="收费价" align="center" prop="hisChargeItemPrice" width="100" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span :style="{ color: isChargePriceMismatch(scope.row) ? '#F56C6C' : '' }">{{ scope.row.hisChargeItemPrice != null ? formatCurrency(scope.row.hisChargeItemPrice) : '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="HRP编码" align="center" prop="hrpCode" width="120" show-overflow-tooltip />
              <el-table-column label="供应商" align="center" width="150" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ (scope.row.supplier && scope.row.supplier.name) || scope.row.supplierName || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="生产厂家" align="center" width="150" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || scope.row.factoryName || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" width="120" class-name="apply-action-col">
                <template slot-scope="scope">
                  <el-button
                    size="small"
                    type="text"
                    @click="handleHis(scope.row)"
                  >HIS</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleHrp(scope.row)"
                  >HRP</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="apply-pagination-wrap">
              <pagination
                v-show="total > 0"
                :total="total"
                :page.sync="queryParams.pageNum"
                :limit.sync="queryParams.pageSize"
                @pagination="getList"
              />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- HIS弹窗：不挂到 body，遮罩与弹窗限制在主内容区内，避免盖住顶栏与侧栏 -->
    <el-dialog
      :visible.sync="hisDialogVisible"
      width="100%"
      top="0"
      :append-to-body="false"
      :modal-append-to-body="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      custom-class="material-compare-dialog"
    >
      <div slot="title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>HIS对照</span>
        <el-button type="text" @click="hisDialogVisible = false" style="padding: 0;">关闭</el-button>
      </div>
      <div class="his-current-material-box">
        <div class="his-current-material-title">产品档案基本信息</div>
        <div class="his-current-material-grid">
          <div class="his-current-material-item"><span class="label">产品编码：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.code) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">产品名称：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.name) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">规格：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.speci) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">型号：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.model) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">单位：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.fdUnit && currentMaterialRow.fdUnit.unitName) || (currentMaterialRow && currentMaterialRow.unitName) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">价格：</span><span class="value">{{ formatCurrency(currentMaterialRow && currentMaterialRow.price) }}</span></div>
          <div class="his-current-material-item"><span class="label">供应商：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.supplier && currentMaterialRow.supplier.name) || (currentMaterialRow && currentMaterialRow.supplierName) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">生产厂家：</span><span class="value">{{ (currentMaterialRow && currentMaterialRow.fdFactory && currentMaterialRow.fdFactory.factoryName) || (currentMaterialRow && currentMaterialRow.factoryName) || '--' }}</span></div>
        </div>
        <div class="his-current-material-title his-current-material-subtitle">对照收费项目</div>
        <div class="his-current-material-grid">
          <div class="his-current-material-item"><span class="label">收费编码：</span><span class="value">{{ (currentHisChargeItem && currentHisChargeItem.chargeCode) || (currentMaterialRow && currentMaterialRow.hisCode) || (currentMaterialRow && currentMaterialRow.hisChargeItemId) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">收费名称：</span><span class="value">{{ (currentHisChargeItem && currentHisChargeItem.chargeName) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">收费规格：</span><span class="value">{{ (currentHisChargeItem && currentHisChargeItem.chargeSpeci) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">收费型号：</span><span class="value">{{ (currentHisChargeItem && currentHisChargeItem.chargeModel) || '--' }}</span></div>
          <div class="his-current-material-item"><span class="label">收费单价：</span><span class="value">{{ currentHisChargeItem && currentHisChargeItem.chargePrice != null ? formatCurrency(currentHisChargeItem.chargePrice) : '--' }}</span></div>
        </div>
      </div>
      
      <!-- 搜索框 -->
      <div class="his-query-container">
        <el-form :model="hisQueryParams" ref="hisQueryForm" size="small" :inline="true" label-width="80px">
          <el-row>
            <el-col :span="24">
              <el-form-item label="项目编码" prop="itemCode" class="query-item-inline">
                <el-input
                  v-model="hisQueryParams.itemCode"
                  placeholder="收费编码"
                  clearable
                  @keyup.enter.native="handleHisQuery"
                  style="width: 180px"
                />
              </el-form-item>
              <el-form-item label="名称" prop="name" class="query-item-inline">
                <el-input
                  v-model="hisQueryParams.name"
                  placeholder="收费名称"
                  clearable
                  @keyup.enter.native="handleHisQuery"
                  style="width: 180px"
                />
              </el-form-item>

              <el-form-item label="规格" prop="speci" class="query-item-inline">
                <el-input
                  v-model="hisQueryParams.speci"
                  placeholder="规格"
                  clearable
                  @keyup.enter.native="handleHisQuery"
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item class="query-item-inline his-query-btn-item" label-width="0">
                <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleHisQuery">搜索</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 明细表格：外层 flex 占满剩余高度，仅表体内部滚动，弹窗整体不上下滑动 -->
      <div class="his-table-container material-compare-dialog-table-wrap">
        <div class="material-compare-dialog-table-scroll">
          <el-table v-loading="hisLoading" :data="hisList" border height="100%">
          <el-table-column type="index" label="序号" align="center" width="80" />
          <el-table-column label="收费编码" align="center" prop="chargeCode" width="150" show-overflow-tooltip />
          <el-table-column label="收费名称" align="center" prop="chargeName" min-width="200" show-overflow-tooltip />
          <el-table-column label="收费规格" align="center" prop="chargeSpeci" width="150" show-overflow-tooltip />
          <el-table-column label="收费型号" align="center" prop="chargeModel" width="150" show-overflow-tooltip />
          <el-table-column label="收费单价" align="center" prop="chargePrice" width="120">
            <template slot-scope="scope">
              <span>{{ formatCurrency(scope.row.chargePrice) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" width="100">
            <template slot-scope="scope">
              <el-tag v-if="isBoundHis(scope.row)" type="success" size="mini">已绑定</el-tag>
              <el-tag v-else size="mini">未绑定</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" width="100">
            <template slot-scope="scope">
              <el-button v-if="isBoundHis(scope.row)" type="text" size="mini" @click="handleUnbindHis()">解绑</el-button>
              <el-button v-else type="text" size="mini" @click="handleBindHis(scope.row)">绑定</el-button>
            </template>
          </el-table-column>
          </el-table>
        </div>

        <pagination
          v-show="hisTotal > 0"
          :total="hisTotal"
          :page.sync="hisQueryParams.pageNum"
          :limit.sync="hisQueryParams.pageSize"
          @pagination="getHisList"
        />
      </div>
    </el-dialog>

    <!-- HRP弹窗：与 HIS 一致，限制在主内容区 -->
    <el-dialog
      :visible.sync="hrpDialogVisible"
      width="100%"
      top="0"
      :append-to-body="false"
      :modal-append-to-body="false"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      custom-class="material-compare-dialog"
    >
      <div slot="title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>HRP对照</span>
        <el-button type="text" @click="hrpDialogVisible = false" style="padding: 0;">关闭</el-button>
      </div>
      
      <!-- 搜索框 -->
      <div class="hrp-query-container">
        <el-form :model="hrpQueryParams" ref="hrpQueryForm" size="small" :inline="true" label-width="80px">
          <el-row>
            <el-col :span="24">
              <el-form-item label="名称" prop="name" class="query-item-inline">
                <el-input
                  v-model="hrpQueryParams.name"
                  placeholder="名称"
                  clearable
                  @keyup.enter.native="handleHrpQuery"
                  style="width: 200px"
                />
              </el-form-item>

              <el-form-item label="规格" prop="speci" class="query-item-inline">
                <el-input
                  v-model="hrpQueryParams.speci"
                  placeholder="规格"
                  clearable
                  @keyup.enter.native="handleHrpQuery"
                  style="width: 200px"
                />
              </el-form-item>
              <el-form-item class="query-item-inline" label-width="0">
                <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleHrpQuery">搜索</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 明细表格 -->
      <div class="hrp-table-container material-compare-dialog-table-wrap">
        <div class="material-compare-dialog-table-scroll">
          <el-table v-loading="hrpLoading" :data="hrpList" border height="100%">
          <el-table-column type="index" label="序号" align="center" width="80" />
          <el-table-column label="收费编码" align="center" prop="chargeCode" width="150" show-overflow-tooltip />
          <el-table-column label="收费名称" align="center" prop="chargeName" min-width="200" show-overflow-tooltip />
          <el-table-column label="收费规格" align="center" prop="chargeSpeci" width="150" show-overflow-tooltip />
          <el-table-column label="收费型号" align="center" prop="chargeModel" width="150" show-overflow-tooltip />
          <el-table-column label="收费单价" align="center" prop="chargePrice" width="120">
            <template slot-scope="scope">
              <span>{{ formatCurrency(scope.row.chargePrice) }}</span>
            </template>
          </el-table-column>
          </el-table>
        </div>

        <pagination
          v-show="hrpTotal > 0"
          :total="hrpTotal"
          :page.sync="hrpQueryParams.pageNum"
          :limit.sync="hrpQueryParams.pageSize"
          @pagination="getHrpList"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listMaterial, listHisChargeItem, fetchHisChargeItemMirror, bindMaterialHisChargeItem, unbindMaterialHisChargeItem } from "@/api/foundation/material";
import { listSupplierAll } from "@/api/foundation/supplier";

export default {
  name: "MaterialCompare",
  data() {
    return {
      // 遮罩层
      loading: true,
      supplierLoading: false,
      // 选中数组
      ids: [],
      // 触发行高亮重算（勾选后 el-table 不会自动刷新 row-class-name）
      rowHighlightTick: 0,
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 供应商列表
      supplierList: [],
      // 当前选中的供应商
      selectedSupplier: null,
      // 耗材对照表格数据
      materialCompareList: [],
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        supplierName: null,
        hisBindStatus: null,
        isBilling: null,
        speci: null,
        hisChargeItemId: null,
        supplierId: null,
        orderByColumn: null,
        isAsc: null
      },
      // HIS弹窗相关
      hisDialogVisible: false,
      hisLoading: false,
      hisList: [],
      hisTotal: 0,
      hisQueryParams: {
        pageNum: 1,
        pageSize: 10,
        itemCode: null,
        name: null,
        referredCode: null,
        speci: null
      },
      currentHisChargeItem: null,
      // HRP弹窗相关
      hrpDialogVisible: false,
      hrpLoading: false,
      hrpList: [],
      hrpTotal: 0,
      hrpQueryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        speci: null
      },
      currentMaterialRow: null,
      // 明细表高度（占满明细框剩余空间，减少底部留白）
      mainTableHeight: 400
    };
  },
  created() {
    this.getSupplierList();
    // 默认显示全部供应商的产品
    this.handleShowAll();
  },
  mounted() {
    this.$nextTick(() => {
      this.updateMainTableHeight();
      setTimeout(() => this.updateMainTableHeight(), 80);
      setTimeout(() => this.updateMainTableHeight(), 200);
    });
    window.addEventListener('resize', this.updateMainTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateMainTableHeight);
  },
  methods: {
    /** 只改明细框高度：底边对齐左侧供应商框底边（不改左侧） */
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      if (!panel || !panel.getBoundingClientRect) return;
      const pageEl = this.$el;
      if (!pageEl) return;
      const supplier = pageEl.querySelector('.supplier-container');
      if (!supplier || !supplier.getBoundingClientRect) return;
      // 清掉此前误加的左侧内联高度
      supplier.style.height = '';
      supplier.style.maxHeight = '';
      supplier.style.marginBottom = '';

      const panelTop = panel.getBoundingClientRect().top;
      const targetBottom = supplier.getBoundingClientRect().bottom;
      const pagEl = panel.querySelector('.apply-pagination-wrap');
      let pagH = pagEl ? pagEl.getBoundingClientRect().height : 52;
      if (pagH < 40) pagH = 52;
      const borderY =
        (parseFloat(window.getComputedStyle(panel).borderTopWidth) || 0) +
        (parseFloat(window.getComputedStyle(panel).borderBottomWidth) || 0);
      const next = Math.max(240, Math.floor(targetBottom - panelTop - pagH - borderY));
      if (Math.abs((this.mainTableHeight || 0) - next) >= 2) {
        this.mainTableHeight = next;
      }
      this.$nextTick(() => {
        if (this.$refs.compareTable && this.$refs.compareTable.doLayout) {
          this.$refs.compareTable.doLayout();
        }
        // 校正：若明细框仍低于左侧底边，再压低表高
        const overshoot = panel.getBoundingClientRect().bottom - supplier.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.compareTable && this.$refs.compareTable.doLayout) {
              this.$refs.compareTable.doLayout();
            }
          });
        }
      });
    },
    /** 查询供应商列表 */
    getSupplierList() {
      this.supplierLoading = true;
      listSupplierAll().then(response => {
        this.supplierList = response || [];
        this.supplierLoading = false;
      }).catch(() => {
        this.supplierLoading = false;
      });
    },
    /** 显示全部供应商产品 */
    handleShowAll() {
      this.selectedSupplier = null;
      this.queryParams.supplierId = null;
      this.queryParams.pageNum = 1;
      // 清除供应商表格的选中状态
      if (this.$refs.supplierTable) {
        this.$refs.supplierTable.setCurrentRow(null);
      }
      this.getList();
    },
    /** 供应商选择变化 */
    handleSupplierChange(row) {
      if (row) {
        this.selectedSupplier = row;
        this.queryParams.supplierId = row.id;
        this.queryParams.pageNum = 1;
        this.getList();
      } else {
        this.selectedSupplier = null;
        this.queryParams.supplierId = null;
        this.materialCompareList = [];
        this.total = 0;
      }
    },
    /** 查询耗材对照列表 */
    getList() {
      this.loading = true;
      this.ids = [];
      this.rowHighlightTick += 1;
      listMaterial({ ...this.queryParams }).then(response => {
        this.materialCompareList = response.rows;
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      }).catch(() => {
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 抓取 HIS 收费项目镜像 */
    handleFetchHisChargeItems() {
      this.loading = true;
      fetchHisChargeItemMirror().then(response => {
        const data = (response && response.data) || {};
        const fetched = data.fetchedRows != null ? data.fetchedRows : 0;
        this.$modal.msgSuccess(`抓取成功，本次抓取 ${fetched} 条`);
        if (this.hisDialogVisible) {
          this.hisQueryParams.pageNum = 1;
          this.getHisList();
        }
      }).catch(() => {
        this.$modal.msgError("抓取失败，请稍后重试");
      }).finally(() => {
        this.loading = false;
      });
    },
    /** 重置按钮操作 */
    resetQuery() {
      const supplierId = this.selectedSupplier ? this.selectedSupplier.id : null;
      this.resetForm("queryForm");
      this.queryParams.code = null;
      this.queryParams.name = null;
      this.queryParams.supplierName = null;
      this.queryParams.hisBindStatus = null;
      this.queryParams.isBilling = null;
      this.queryParams.speci = null;
      this.queryParams.hisChargeItemId = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      this.queryParams.supplierId = supplierId;
      this.handleQuery();
    },
    /** 表头排序：服务端分页排序 */
    handleSortChange({ prop, order }) {
      const columnMap = {
        code: 'm.code',
        name: 'm.name',
        hisChargeItemSpeci: 'hci.specModel'
      };
      if (!order) {
        this.queryParams.orderByColumn = null;
        this.queryParams.isAsc = null;
      } else {
        this.queryParams.orderByColumn = columnMap[prop] || prop;
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    // 多选框选中数据（勾选高亮，与耗材产品维护一致）
    handleSelectionChange(selection) {
      this.ids = (selection || []).map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    /** 勾选行高亮 class */
    compareRowClassName({ row }) {
      void this.rowHighlightTick;
      if (row && row.id != null && this.ids.indexOf(row.id) !== -1) {
        return 'apply-row-selected';
      }
      return '';
    },
    /** HIS按钮操作：明细列表默认按当前耗材名称匹配，仅用户点击「搜索」后随条件变化 */
    handleHis(row) {
      this.currentMaterialRow = row;
      this.hisDialogVisible = true;
      this.hisQueryParams.pageNum = 1;
      this.hisQueryParams.pageSize = 10;
      this.hisQueryParams.itemCode = null;
      this.hisQueryParams.name = (row && row.name) ? row.name : null;
      this.hisQueryParams.referredCode = null;
      this.hisQueryParams.speci = null;
      this.loadCurrentHisChargeItem();
      this.getHisList();
    },
    /** 加载当前耗材已对照收费项目 */
    loadCurrentHisChargeItem() {
      const chargeItemId = this.currentMaterialRow && this.currentMaterialRow.hisChargeItemId;
      if (!chargeItemId) {
        this.currentHisChargeItem = null;
        return;
      }
      listHisChargeItem({ chargeItemId, pageNum: 1, pageSize: 1 }).then(response => {
        const rows = (response && response.rows) || [];
        this.currentHisChargeItem = rows.length > 0 ? rows[0] : null;
      }).catch(() => {
        this.currentHisChargeItem = null;
      });
    },
    /** HIS搜索 */
    handleHisQuery() {
      this.hisQueryParams.pageNum = 1;
      this.getHisList();
    },
    /** 查询HIS列表 */
    getHisList() {
      this.hisLoading = true;
      listHisChargeItem(this.hisQueryParams).then(response => {
        this.hisList = response.rows || [];
        this.hisTotal = response.total || 0;
        this.hisLoading = false;
      }).catch(() => {
        this.hisLoading = false;
      });
    },
    isBoundHis(row) {
      if (!this.currentMaterialRow || !row) {
        return false;
      }
      return String(this.currentMaterialRow.hisChargeItemId || '') === String(row.chargeItemId || '');
    },
    /** 产品档案价格与待绑定行收费单价是否不一致（均有值且数值不同） */
    isHisBindPriceMismatch(row) {
      const p = this.currentMaterialRow && this.currentMaterialRow.price;
      const c = row && row.chargePrice;
      if (p == null || p === "" || c == null || c === "") {
        return false;
      }
      return Number(p) !== Number(c);
    },
    /** 执行绑定请求（不含校验与二次确认） */
    submitBindHis(row) {
      return bindMaterialHisChargeItem({
        materialId: this.currentMaterialRow.id,
        chargeItemId: row.chargeItemId
      }).then(() => {
        this.$modal.msgSuccess("绑定成功");
        this.currentMaterialRow.hisChargeItemId = row.chargeItemId;
        this.currentMaterialRow.hisCode = row.chargeCode;
        this.currentMaterialRow.hisChargeItemName = row.chargeName;
        this.currentMaterialRow.hisChargeItemSpeci = row.chargeSpeci;
        this.currentMaterialRow.hisChargeItemPrice = row.chargePrice;
        this.currentHisChargeItem = row;
        this.getHisList();
        this.getList();
      });
    },
    /** 绑定 HIS 收费项目 */
    handleBindHis(row) {
      if (!this.currentMaterialRow || !this.currentMaterialRow.id) {
        this.$modal.msgError("未找到当前耗材");
        return;
      }
      if (!row || !row.chargeItemId) {
        this.$modal.msgError("未找到收费项目ID");
        return;
      }
      if (this.isHisBindPriceMismatch(row)) {
        this.$modal
          .confirm("当前产品的价格跟HIS收费价格不一致！是否需要继续绑定")
          .then(() => this.submitBindHis(row))
          .catch(() => {});
      } else {
        this.submitBindHis(row);
      }
    },
    /** 解绑 HIS 收费项目 */
    handleUnbindHis() {
      if (!this.currentMaterialRow || !this.currentMaterialRow.id) {
        this.$modal.msgError("未找到当前耗材");
        return;
      }
      unbindMaterialHisChargeItem({
        materialId: this.currentMaterialRow.id
      }).then(() => {
        this.$modal.msgSuccess("解绑成功");
        this.currentMaterialRow.hisChargeItemId = null;
        this.currentMaterialRow.hisCode = null;
        this.currentMaterialRow.hisChargeItemName = null;
        this.currentMaterialRow.hisChargeItemSpeci = null;
        this.currentMaterialRow.hisChargeItemPrice = null;
        this.currentHisChargeItem = null;
        this.getHisList();
        this.getList();
      });
    },
    /** HRP按钮操作 */
    handleHrp(row) {
      this.currentMaterialRow = row;
      this.hrpDialogVisible = true;
      this.hrpQueryParams.pageNum = 1;
      this.getHrpList();
    },
    /** HRP搜索 */
    handleHrpQuery() {
      this.hrpQueryParams.pageNum = 1;
      this.getHrpList();
    },
    /** 查询HRP列表 */
    getHrpList() {
      this.hrpLoading = true;
      // TODO: 调用HRP接口
      // 这里先模拟数据
      setTimeout(() => {
        this.hrpList = [];
        this.hrpTotal = 0;
        this.hrpLoading = false;
      }, 500);
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      const id = row.id || this.ids[0];
      this.$router.push("/foundation/materialCompare/edit/" + id);
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除耗材对照编号为"' + ids + '"的数据项？').then(() => {
        // TODO: 实现删除API调用
        this.$modal.msgSuccess("删除成功");
        this.getList();
      }).catch(() => {});
    },
    /** 格式化金额 */
    formatCurrency(value) {
      if (value == null || value === '') {
        return '0.00';
      }
      return this.formatAmount(value);
    },
    /** 收费价与价格均存在且不相等时高亮 */
    isChargePriceMismatch(row) {
      if (!row || row.price == null || row.hisChargeItemPrice == null) {
        return false;
      }
      return Number(row.price) !== Number(row.hisChargeItemPrice);
    }
  }
};
</script>

<style scoped>
/* 页面根：顶/底留白均为 8px，内容区撑满，消除底部多余空隙 */
.material-compare-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

/* 遮罩层与到货验收 local-modal-mask 一致：铺满定位容器、拉伸对齐 */
.material-compare-page ::v-deep .el-dialog__wrapper {
  position: absolute !important;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  margin: 0 !important;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 0;
  box-sizing: border-box;
  z-index: 1000;
  overflow: hidden;
}

/* Element 遮罩默认 fixed 会盖住侧栏顶栏；改为相对本页容器（与到货验收 local-modal-mask 一致） */
.material-compare-page ::v-deep .v-modal {
  position: absolute !important;
  left: 0 !important;
  top: 0 !important;
  width: 100% !important;
  height: 100% !important;
}

/* 弹窗占满遮罩且不整体滚动：顶部标题与信息区固定，仅表格区域内部滚动 */
.material-compare-page ::v-deep .material-compare-dialog.el-dialog {
  margin: 0 !important;
  width: 100% !important;
  max-width: none !important;
  height: 100% !important;
  max-height: 100% !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column;
  box-sizing: border-box;
  background: #fff;
  overflow: hidden;
  padding-bottom: 8px;
}

.material-compare-page ::v-deep .material-compare-dialog .el-dialog__header {
  flex-shrink: 0;
}

.material-compare-page ::v-deep .material-compare-dialog .el-dialog__body {
  flex: 1;
  min-height: 0;
  max-height: none !important;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding-top: 10px;
  padding-bottom: 4px;
}

/* 占满正文剩余高度；翻页在 flex 底部，表体在上方 scroll 区内滚动 */
.material-compare-page ::v-deep .material-compare-dialog-table-wrap {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* flex:1 1 0 + min-height:0 让明细区吃满剩余高度，配合 el-table height=100% 仅表内滚动 */
.material-compare-dialog-table-scroll {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.material-compare-page ::v-deep .material-compare-dialog-table-scroll > .el-table {
  flex: 1;
  min-height: 0;
}

.material-compare-page ::v-deep .material-compare-dialog .el-dialog__body > .his-current-material-box,
.material-compare-page ::v-deep .material-compare-dialog .el-dialog__body > .his-query-container,
.material-compare-page ::v-deep .material-compare-dialog .el-dialog__body > .hrp-query-container,
.material-compare-page ::v-deep .material-compare-dialog .el-dialog__body > .el-row.mb8 {
  flex-shrink: 0;
}

/* 左供应商在原 span6(25%) 基础上收窄 1/4 → 18.75%；右侧承接剩余宽度 */
.compare-layout-row {
  display: flex;
  flex-wrap: nowrap;
  /* 避免右侧明细把左侧一起撑高，导致量到底边失真 */
  align-items: flex-start;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.compare-layout-row > .supplier-col {
  width: 18.75% !important;
  max-width: 18.75% !important;
  flex: 0 0 18.75% !important;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
}

.compare-layout-row > .material-col {
  width: calc(81.25% - 8px) !important;
  max-width: calc(81.25% - 8px) !important;
  flex: 1 1 auto !important;
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 供应商容器：仅由左侧列高度撑满，不受右侧明细影响 */
.supplier-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  max-height: 100%;
  min-height: 0;
  margin-bottom: 0;
  box-sizing: border-box;
}

.supplier-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
}

.supplier-title {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}

/* 左侧供应商列表：悬停 / 当前选中高亮（对齐右侧明细） */
.supplier-container ::v-deep .el-table__body tr > td {
  transition: none !important;
  cursor: pointer;
}

.supplier-container ::v-deep .el-table__body tr:hover > td {
  background-color: #D6EBFF !important;
}

.supplier-container ::v-deep .el-table__body tr.current-row > td {
  background-color: #B8DAFF !important;
}

.supplier-container ::v-deep .el-table__body tr.current-row:hover > td {
  background-color: #A0CBFF !important;
}

/* 右侧明细区：无外层父框，查询区/工具栏/表格各自独立；区块间距收紧 */
.material-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.material-compare-page .material-main > .list-query-panel,
.material-compare-page .material-main > .compare-toolbar,
.material-compare-page .material-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.material-compare-page .material-main > .compare-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.apply-table-panel.table-container {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin-bottom: 0;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  overflow: hidden;
}

.apply-table-panel.table-container > .apply-main-table {
  flex: 0 0 auto;
  min-height: 0;
}

/* 明细表：对齐耗材产品维护 — 表头/行高、悬停蓝、勾选高亮 */
.material-compare-page .apply-main-table ::v-deep th {
  border-right-color: #eef2f7 !important;
  border-bottom-color: #e2e8f0 !important;
  padding: 4px 0 !important;
  height: 34px !important;
}

.material-compare-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.material-compare-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
}

.material-compare-page .apply-main-table ::v-deep td .cell {
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body tr > td,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col {
  background-color: #B8DAFF !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.material-compare-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.material-compare-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.material-compare-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.material-compare-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  /* 翻页上下留白一致 */
  padding: 12px 14px;
  box-sizing: border-box;
}

.apply-pagination-wrap ::v-deep .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent;
  border: none;
  box-shadow: none;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  overflow: visible;
}

/* 取消 ruoyi 绝对定位，否则底边距看不见、看起来像“上有下无” */
.apply-pagination-wrap ::v-deep .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.compare-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.compare-query-row--second {
  margin-top: 8px;
}

.compare-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.compare-query-control.el-select,
.compare-query-control.el-input {
  width: 160px !important;
}

.compare-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* 勾选列 / 操作列用 sticky（不用 fixed），悬停整行可同色高亮 */
.material-compare-page .apply-main-table.el-table {
  position: relative;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.material-compare-page .apply-main-table ::v-deep th.apply-select-col,
.material-compare-page .apply-main-table ::v-deep td.apply-select-col,
.material-compare-page .apply-main-table ::v-deep th.el-table-column--selection,
.material-compare-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.material-compare-page .apply-main-table ::v-deep td.apply-select-col,
.material-compare-page .apply-main-table ::v-deep td.el-table-column--selection {
  background-color: #fff;
  border-right: 1px solid #e2e8f0;
}

.material-compare-page .apply-main-table ::v-deep th.apply-select-col,
.material-compare-page .apply-main-table ::v-deep th.el-table-column--selection {
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-right: 1px solid #e2e8f0;
}

.material-compare-page .apply-main-table ::v-deep th.apply-action-col,
.material-compare-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  z-index: 3;
  box-sizing: border-box !important;
}

.material-compare-page .apply-main-table ::v-deep td.apply-action-col {
  right: 0 !important;
  background-color: #fff;
  border-left: 1px solid #e2e8f0;
}

.material-compare-page .apply-main-table ::v-deep th.apply-action-col {
  right: 0 !important;
  z-index: 4;
  background-color: #f1f5f9 !important;
  border-left: 1px solid #e2e8f0;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped td.apply-select-col,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped td.el-table-column--selection,
.material-compare-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped td.apply-action-col {
  background-color: #fafafa;
}

.material-compare-page .apply-main-table ::v-deep td.apply-select-col .cell,
.material-compare-page .apply-main-table ::v-deep td.el-table-column--selection .cell,
.material-compare-page .apply-main-table ::v-deep td.apply-action-col .cell,
.material-compare-page .apply-main-table ::v-deep th.apply-select-col .cell,
.material-compare-page .apply-main-table ::v-deep th.el-table-column--selection .cell,
.material-compare-page .apply-main-table ::v-deep th.apply-action-col .cell {
  background-color: transparent !important;
}

.app-container > .el-form .el-row {
  margin-bottom: 0px;
}

.form-fields-container .el-form-item {
  margin-bottom: 0;
  padding: 0;
}

.form-fields-container .el-form-item__content {
  line-height: 1 !important;
}

.form-fields-container .el-form-item__label {
  padding-bottom: 0 !important;
  line-height: 32px !important;
}

.query-item-inline {
  margin-right: 20px;
}

.query-select-wrapper {
  width: 200px;
}

.table-container {
  padding: 0;
}

/* 表格单元格不换行 */
.table-container .el-table td {
  white-space: nowrap !important;
}

.table-container .el-table th {
  white-space: nowrap !important;
}

/* HIS弹窗样式 */
.his-query-container {
  margin-bottom: 10px;
  padding: 10px 16px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
  display: flex;
  align-items: center;
  box-sizing: border-box;
}

.his-query-container ::v-deep .el-form {
  margin-bottom: 0;
  width: 100%;
}

.his-query-container ::v-deep .el-row {
  margin-bottom: 0 !important;
}

.his-query-container ::v-deep .el-form--inline .el-form-item {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
  vertical-align: middle;
}

.his-query-container .his-query-btn-item ::v-deep .el-form-item__content {
  margin-left: 0 !important;
}

.his-query-container .his-query-btn-item ::v-deep .el-form-item__label-wrap {
  display: none;
}

/* 覆盖 ruoyi.scss 中 .pagination-container { height: 25px }，否则会裁掉翻页下半截 */
.material-compare-dialog-table-wrap ::v-deep .pagination-container,
.his-table-container ::v-deep .pagination-container,
.hrp-table-container ::v-deep .pagination-container {
  flex-shrink: 0;
  height: auto !important;
  min-height: 44px;
  margin-top: 2px !important;
  margin-bottom: 0 !important;
  padding: 4px 12px !important;
}

.his-current-material-subtitle {
  margin-top: 14px;
  padding-top: 14px;
  border-top: 1px solid #EBEEF5;
}

.his-current-material-box {
  margin-bottom: 12px;
  padding: 10px 14px;
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  background: #fff;
}

.his-current-material-title {
  color: #303133;
  font-weight: 600;
  margin-bottom: 8px;
}

.his-current-material-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 6px 16px;
}

.his-current-material-item {
  min-width: 0;
  color: #606266;
  line-height: 20px;
}

.his-current-material-item .label {
  color: #909399;
}

.his-current-material-item .value {
  color: #303133;
}

.his-table-container {
  padding: 0;
}

.his-table-container .el-table td {
  white-space: nowrap !important;
}

.his-table-container .el-table th {
  white-space: nowrap !important;
}

/* HRP弹窗样式 */
.hrp-query-container {
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
}

.hrp-table-container {
  padding: 0;
}

.hrp-table-container .el-table td {
  white-space: nowrap !important;
}

.hrp-table-container .el-table th {
  white-space: nowrap !important;
}

/* 表格滚动条：横向加粗便于拖动 */
.material-compare-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:vertical,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-body-wrapper::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
  min-height: 24px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
}

.material-compare-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
.material-compare-page .apply-main-table ::v-deep .el-table__fixed-body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #888 !important;
}

/* 弹窗等其它表格沿用较细滚动条 */
.el-table__body-wrapper::-webkit-scrollbar,
.el-table__fixed-body-wrapper::-webkit-scrollbar,
.el-table__fixed-right::-webkit-scrollbar,
.el-table__fixed::-webkit-scrollbar {
  width: 3px !important;
  height: 6px !important;
  transition: width 0.2s ease, height 0.2s ease;
}

.el-table__body-wrapper:hover::-webkit-scrollbar,
.el-table__fixed-body-wrapper:hover::-webkit-scrollbar,
.el-table__fixed-right:hover::-webkit-scrollbar,
.el-table__fixed:hover::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.el-table__body-wrapper::-webkit-scrollbar:vertical,
.el-table__fixed-body-wrapper::-webkit-scrollbar:vertical,
.el-table__fixed-right::-webkit-scrollbar:vertical,
.el-table__fixed::-webkit-scrollbar:vertical {
  width: 3px !important;
  transition: width 0.2s ease;
}

.el-table__body-wrapper:hover::-webkit-scrollbar:vertical,
.el-table__fixed-body-wrapper:hover::-webkit-scrollbar:vertical,
.el-table__fixed-right:hover::-webkit-scrollbar:vertical,
.el-table__fixed:hover::-webkit-scrollbar:vertical {
  width: 8px !important;
}

.el-table__body-wrapper::-webkit-scrollbar:horizontal,
.el-table__fixed-body-wrapper::-webkit-scrollbar:horizontal,
.el-table__fixed-right::-webkit-scrollbar:horizontal,
.el-table__fixed::-webkit-scrollbar:horizontal {
  height: 6px !important;
  transition: height 0.2s ease;
}

.el-table__body-wrapper:hover::-webkit-scrollbar:horizontal,
.el-table__fixed-body-wrapper:hover::-webkit-scrollbar:horizontal,
.el-table__fixed-right:hover::-webkit-scrollbar:horizontal,
.el-table__fixed:hover::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.el-table__body-wrapper::-webkit-scrollbar-track,
.el-table__fixed-body-wrapper::-webkit-scrollbar-track,
.el-table__fixed-right::-webkit-scrollbar-track,
.el-table__fixed::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.el-table__body-wrapper::-webkit-scrollbar-thumb,
.el-table__fixed-body-wrapper::-webkit-scrollbar-thumb,
.el-table__fixed-right::-webkit-scrollbar-thumb,
.el-table__fixed::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 3px !important;
  min-width: 2px !important;
  min-height: 4px !important;
  background-clip: padding-box;
  border: 2px solid transparent;
  transition: background 0.3s ease;
}

.el-table__body-wrapper:hover::-webkit-scrollbar-thumb,
.el-table__fixed-body-wrapper:hover::-webkit-scrollbar-thumb,
.el-table__fixed-right:hover::-webkit-scrollbar-thumb,
.el-table__fixed:hover::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
}
</style>

<style>
/* 与到货验收一致：左右/上下均为 8px，底部与搜索区顶部留白对齐 */
.app-container.material-compare-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  padding-left: 8px !important;
  padding-right: 8px !important;
}

.app-container.material-compare-page .el-dialog__wrapper {
  left: -8px;
  right: -8px;
  width: auto;
}
</style>

