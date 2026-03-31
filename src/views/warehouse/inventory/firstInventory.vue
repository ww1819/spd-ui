<template>
  <div class="app-container first-inventory-page">
    <div class="form-fields-container">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="单号" prop="receiptOrderNo" class="query-item-inline">
              <el-input
                v-model="queryParams.receiptOrderNo"
                placeholder="单号"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectSupplier v-model="queryParams.supplierId" />
              </div>
            </el-form-item>
            <el-form-item label="耗材" prop="materialId" class="query-item-inline">
              <div class="query-select-wrapper">
                <MaterialAutocomplete v-model="queryParams.materialName"/>
              </div>
            </el-form-item>
            <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouse v-model="queryParams.warehouseId" :excludeWarehouseType="['设备', '高值']"/>
              </div>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-second">
          <el-col :span="24">
            <el-form-item label="业务日期" style="display: flex; align-items: center;">
              <el-date-picker
                v-model="queryParams.beginDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="起始日期"
                clearable
                style="width: 180px; margin-right: 8px;"
              />
              <span style="margin: 0 4px;">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                value-format="yyyy-MM-dd"
                placeholder="截止日期"
                clearable
                style="width: 180px; margin-left: 8px;"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="16" class="query-row-third">
          <el-col :span="24">
            <el-form-item label="生产批号" prop="batchNumber" class="query-item-inline">
              <el-input
                v-model="queryParams.batchNumber"
                placeholder="生产批号(batch_number)"
                clearable
                style="width: 180px"
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
            <el-form-item label="计费" prop="isBilling" class="query-item-inline">
              <el-select v-model="queryParams.isBilling" placeholder="请选择计费"
                         clearable style="width: 150px">
                <el-option label="是" value="1"/>
                <el-option label="否" value="0"/>
              </el-select>
            </el-form-item>
            <el-form-item label="库房分类" prop="warehouseCategoryId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectWarehouseCategory v-model="queryParams.warehouseCategoryId" />
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
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
        <el-tooltip class="item" effect="dark" content="显隐列" placement="top">
          <el-button size="small" circle icon="el-icon-menu" @click="openColumnDialog" />
        </el-tooltip>
      </div>
    </el-row>

    <!-- 显隐列：挂载在页面内，保存后按当前登录用户持久化 -->
    <el-dialog
      title="显示/隐藏"
      :visible.sync="columnDialogVisible"
      width="640px"
      :append-to-body="false"
      :modal-append-to-body="false"
      :close-on-click-modal="false"
      custom-class="inventory-column-dialog-inpage"
      :show-close="false"
    >
      <el-transfer
        :titles="['显示', '隐藏']"
        v-model="columnHiddenKeys"
        :data="columnTransferData"
        @change="onColumnTransferChange"
      />
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="saveColumnConfig">保 存</el-button>
        <el-button @click="columnDialogVisible = false">关 闭</el-button>
      </div>
    </el-dialog>

    <div class="table-container">
    <el-table v-loading="loading" :data="inventoryList"
              :row-class-name="inventoryListIndex"
              @selection-change="handleSelectionChange" 
              height="57vh"
              border>
      <el-table-column type="selection" width="48" align="center" fixed="left"/>
      <el-table-column type="index" label="序号" width="80" align="center" show-overflow-tooltip resizable v-if="columns[0].visible">
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column key="materialCode" label="耗材编码" align="center" prop="material.code" width="150" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialCode" v-if="columns[1].visible"/>
      <el-table-column key="materialName" label="耗材名称" align="center" prop="material.name" width="160" show-overflow-tooltip resizable sortable :sort-method="sortByMaterialName" v-if="columns[2].visible"/>
      <el-table-column key="speci" label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable sortable :sort-method="sortBySpeci" v-if="columns[3].visible">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="model" label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByModel" v-if="columns[4].visible">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="factory" label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="150" show-overflow-tooltip resizable sortable :sort-method="sortByFactory" v-if="columns[5].visible">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="warehouse" label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByWarehouse" v-if="columns[6].visible"/>
      <el-table-column key="supplier" label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable sortable :sort-method="sortBySupplier" v-if="columns[7].visible"/>
      <el-table-column key="unitPrice" label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByUnitPrice" v-if="columns[8].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="unit" label="单位" align="center" width="80" show-overflow-tooltip resizable v-if="columns[9].visible">
        <template slot-scope="scope">
          <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || (scope.row.material && scope.row.material.unit && (scope.row.material.unit.unitName || scope.row.material.unit.name)) || (scope.row.material && scope.row.material.unitName) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="qty" label="库存数量" align="center" prop="qty" width="120" show-overflow-tooltip resizable v-if="columns[10].visible"/>
      <el-table-column key="amt" label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable sortable :sort-method="sortByAmt" v-if="columns[11].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="入库批次号" align="center" prop="batchNo" width="220" resizable>
        <template slot-scope="scope">
          <span class="batch-no-text">{{ scope.row.batchNo || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="生产批号" align="center" prop="batchNumber" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材批次号" align="center" prop="materialNo" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="主条码" align="center" prop="mainBarcode" width="140" show-overflow-tooltip resizable/>
      <el-table-column label="辅条码" align="center" prop="subBarcode" width="140" show-overflow-tooltip resizable/>
      <el-table-column label="生产日期" align="center" prop="beginTime" width="160" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column key="endTime" label="有效期" align="center" prop="endTime" width="160" show-overflow-tooltip resizable v-if="columns[15].visible">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column key="registerNo" label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable v-if="columns[16].visible">
        <template slot-scope="scope">
          <span>{{ scope.row.material && scope.row.material.registerNo ? scope.row.material.registerNo : '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column key="periodDate" label="注册证有效期" align="center" prop="material.periodDate" width="180" show-overflow-tooltip resizable v-if="columns[17].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.material && scope.row.material.periodDate">{{ parseTime(scope.row.material.periodDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="isBilling" label="计费" align="center" prop="material.isBilling" width="80" show-overflow-tooltip resizable v-if="columns[18].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.material && (scope.row.material.isBilling === '1' || scope.row.material.isBilling === 1 || scope.row.material.isBilling === true || scope.row.material.isBilling === 'true')">是</span>
          <span v-else-if="scope.row.material && (scope.row.material.isBilling === '0' || scope.row.material.isBilling === 0 || scope.row.material.isBilling === '2' || scope.row.material.isBilling === false || scope.row.material.isBilling === 'false')">否</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="receiptOrderNo" label="入库单号" align="center" prop="receiptOrderNo" width="180" show-overflow-tooltip resizable v-if="columns[19].visible"/>
      <el-table-column key="createTime" label="制单日期" align="center" prop="createTime" width="160" show-overflow-tooltip resizable v-if="columns[20].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="createrName" label="制单人" align="center" prop="createrName" width="120" show-overflow-tooltip resizable v-if="columns[21].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.createrName">{{ scope.row.createrName }}</span>
          <span v-else-if="scope.row.creater && scope.row.creater.nickName">{{ scope.row.creater.nickName }}</span>
          <span v-else-if="scope.row.creater && scope.row.creater.userName">{{ scope.row.creater.userName }}</span>
          <span v-else-if="scope.row.createBy">{{ scope.row.createBy }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="auditDate" label="审核日期" align="center" prop="auditDate" width="160" show-overflow-tooltip resizable v-if="columns[22].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          <span v-else-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column key="auditPersonName" label="审核人" align="center" prop="auditPersonName" width="120" show-overflow-tooltip resizable v-if="columns[23].visible">
        <template slot-scope="scope">
          <span v-if="scope.row.auditPersonName">{{ scope.row.auditPersonName }}</span>
          <span v-else-if="scope.row.auditPerson && scope.row.auditPerson.nickName">{{ scope.row.auditPerson.nickName }}</span>
          <span v-else-if="scope.row.auditPerson && scope.row.auditPerson.userName">{{ scope.row.auditPerson.userName }}</span>
          <span v-else-if="scope.row.auditBy">{{ scope.row.auditBy }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>

    </el-table>
    </div>

    <div class="pagination-wrapper">
      <div class="pagination-summary">
        <span class="summary-label">合计：</span>总数量: {{ totalInfo.totalQty != null ? totalInfo.totalQty : 0 }}，总金额: {{ (totalInfo.totalAmt != null ? totalInfo.totalAmt : 0) | formatCurrency }}，当前页数量: {{ pageTotalQty }}，当前页金额: {{ pageTotalAmtFormatted }}
      </div>
      <pagination
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />
    </div>

  </div>
</template>

<script>
import { listInventory } from "@/api/warehouse/inventory";
import { getUserUiConfig, saveUserUiConfig } from "@/api/system/userUiConfig";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectWarehouseCategory from "@/components/SelectModel/SelectWarehouseCategory";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import RightToolbar from "@/components/RightToolbar";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "firstInventory",
  components: {SelectMaterial,SelectWarehouse,SelectSupplier,SelectWarehouseCategory,MaterialAutocomplete,RightToolbar},
  data() {
    return {
      // 遮罩层
      loading: true,
      activeName: 'first',
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
      // 库存明细表格数据
      inventoryList: [],
      totalInfo: {
        totalAmt: 0,
        totalQty: 0
      },
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        receiptOrderNo: null,
        materialId: null,
        warehouseId: null,
        materialName: null,
        supplierId: null,
        beginDate: null,
        endDate: null,
        batchNumber: null,
        materialNo: null,
        isBilling: null,
        warehouseCategoryId: null
      },
      // 表单参数
      form: {},
      // 表格列显隐（与用户管理 right-toolbar 一致，key 须与数组下标一致）
      columns: [
        { key: 0, label: '序号', visible: true },
        { key: 1, label: '耗材编码', visible: true },
        { key: 2, label: '耗材名称', visible: true },
        { key: 3, label: '规格', visible: true },
        { key: 4, label: '型号', visible: true },
        { key: 5, label: '生产厂家', visible: true },
        { key: 6, label: '仓库', visible: true },
        { key: 7, label: '供应商', visible: true },
        { key: 8, label: '单价', visible: true },
        { key: 9, label: '单位', visible: true },
        { key: 10, label: '库存数量', visible: true },
        { key: 11, label: '金额', visible: true },
        { key: 12, label: '批次号', visible: true },
        { key: 13, label: '批号', visible: true },
        { key: 14, label: '生产日期', visible: true },
        { key: 15, label: '有效期', visible: true },
        { key: 16, label: '注册证号', visible: true },
        { key: 17, label: '注册证有效期', visible: true },
        { key: 18, label: '计费', visible: true },
        { key: 19, label: '入库单号', visible: true },
        { key: 20, label: '制单日期', visible: true },
        { key: 21, label: '制单人', visible: true },
        { key: 22, label: '审核日期', visible: true },
        { key: 23, label: '审核人', visible: true }
      ],
      // 表单校验
      rules: {
      },
      columnDialogVisible: false,
      columnHiddenKeys: [],
      columnConfigKey: 'inventory_first_detail_columns'
    };
  },
  computed: {
    /** 穿梭框数据源（key 用字符串，避免 Transfer 对数字 key 异常） */
    columnTransferData() {
      return (this.columns || []).map(c => ({ key: String(c.key), label: c.label }));
    },
    /** 当前页数量合计 */
    pageTotalQty() {
      return (this.inventoryList || []).reduce((s, r) => s + Number(r.qty || 0), 0);
    },
    /** 当前页金额合计（格式化） */
    pageTotalAmtFormatted() {
      const amt = (this.inventoryList || []).reduce((s, r) => s + Number(r.amt || 0), 0);
      return this.$options.filters && this.$options.filters.formatCurrency
        ? this.$options.filters.formatCurrency(amt)
        : String(Number(amt).toFixed(2));
    },
  },
  created() {
    this.loadUserColumnConfig().finally(() => {
      this.getList();
    });
  },
  mounted() {
    listWarehouse().then((res) => {
      this.restaurants = res.rows;
    });
  },
  methods: {
    openColumnDialog() {
      this.columnHiddenKeys = this.columns.filter(c => !c.visible).map(c => String(c.key));
      this.columnDialogVisible = true;
    },
    onColumnTransferChange() {
      this.applyColumnVisibilityFromHiddenKeys();
    },
    applyColumnVisibilityFromHiddenKeys() {
      const hidden = new Set(this.columnHiddenKeys.map(String));
      this.columns.forEach(c => {
        c.visible = !hidden.has(String(c.key));
      });
    },
    loadUserColumnConfig() {
      return getUserUiConfig(this.columnConfigKey)
        .then(res => {
          const payload = res && res.data;
          const val = payload && payload.configValue;
          if (!val || String(val).trim() === '') return;
          try {
            const o = typeof val === 'string' ? JSON.parse(val) : val;
            const hidden = o.hiddenKeys || [];
            const hiddenSet = new Set(hidden.map(k => String(k)));
            this.columns.forEach(c => {
              c.visible = !hiddenSet.has(String(c.key));
            });
          } catch (e) {
            console.warn('loadUserColumnConfig', e);
          }
        })
        .catch(() => {});
    },
    saveColumnConfig() {
      this.applyColumnVisibilityFromHiddenKeys();
      const hiddenKeys = this.columns.filter(c => !c.visible).map(c => c.key);
      saveUserUiConfig({
        configKey: this.columnConfigKey,
        configValue: JSON.stringify({ hiddenKeys })
      }).then(() => {
        this.$modal.msgSuccess('保存成功');
        this.columnDialogVisible = false;
      }).catch((err) => {
        const m = (err && err.message) ? String(err.message) : '';
        if (m.includes('404')) {
          this.$modal.msgError('保存失败（404）：服务器上还没有「用户界面配置」接口。请先重新编译并部署最新 spd-admin；再在数据库执行脚本 spd/sql/create_sys_user_ui_config.sql。仅执行建表不能消除 404。');
        } else if (m.includes('500')) {
          this.$modal.msgError('保存失败：可能是未建表。请在数据库执行 spd/sql/create_sys_user_ui_config.sql 后重试。');
        } else {
          this.$modal.msgError(m ? `保存失败：${m}` : '保存失败，请检查网络或稍后重试');
        }
      });
    },
    /** 表头排序：字符串列 */
    sortByStr(a, b, getVal) {
      const va = (getVal(a) || '').toString().trim();
      const vb = (getVal(b) || '').toString().trim();
      return va.localeCompare(vb, 'zh-CN');
    },
    /** 表头排序：数值列 */
    sortByNum(a, b, prop) {
      const va = Number(a[prop]);
      const vb = Number(b[prop]);
      if (isNaN(va) && isNaN(vb)) return 0;
      if (isNaN(va)) return 1;
      if (isNaN(vb)) return -1;
      return va - vb;
    },
    sortByMaterialCode(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.code) || ''); },
    sortByMaterialName(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.name) || ''); },
    sortBySpeci(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.speci) || ''); },
    sortByModel(a, b) { return this.sortByStr(a, b, r => (r.material && r.material.model) || ''); },
    sortByFactory(a, b) { return this.sortByStr(a, b, r => this.factoryDisplay(r) || ''); },
    /** 生产厂家：库存行 factory_id 与耗材档案厂家合并展示 */
    factoryDisplay(row) {
      const m = row && row.material;
      const fromMat = m && m.fdFactory && m.fdFactory.factoryName;
      return fromMat || '--';
    },
    sortByWarehouse(a, b) { return this.sortByStr(a, b, r => (r.warehouse && r.warehouse.name) || ''); },
    sortBySupplier(a, b) { return this.sortByStr(a, b, r => (r.supplier && r.supplier.name) || ''); },
    sortByUnitPrice(a, b) { return this.sortByNum(a, b, 'unitPrice'); },
    sortByAmt(a, b) { return this.sortByNum(a, b, 'amt'); },
    querySearchAsync(queryString, cb) {
      const res = this.restaurants;
      if(res.length>0) {
        res.forEach(item => {
          item.value = item.name;
        })
      }

      let results = res.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1;
      })
      cb(results);
    },
    /** 查询库存明细列表 */
    getList() {
      this.loading = true;
      // 添加排序参数，让最新的业务显示在最前面
      const queryParams = {
        ...this.queryParams,
        orderByColumn: 'warehouse_date',
        isAsc: 'desc'
      };
      listInventory(queryParams).then(response => {
        this.inventoryList = response.rows || [];
        this.total = response.total;
        this.totalInfo = response.totalInfo || { totalAmt: 0, totalQty: 0, subTotalAmt: 0, subTotalQty: 0 };
        this.loading = false;
      });
    },
    inventoryListIndex({ row, rowIndex }) {
      // 确保 pageNum 和 pageSize 是正整数
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));

      // 计算行索引
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
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
        receiptOrderNo: null,
        materialId: null,
        warehouseId: null,
        supplierId: null,
        beginDate: null,
        endDate: null,
        batchNumber: null,
        materialNo: null,
        isBilling: null,
        warehouseCategoryId: null
      };
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
      this.queryParams.materialName = null;
      this.queryParams.supplierId = null;
      this.queryParams.warehouseCategoryId = null;
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
      this.queryParams.isBilling = null;
      this.queryParams.batchNumber = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/inventory/export', {
        ...this.queryParams
      }, `inventory_${new Date().getTime()}.xlsx`)
    },
  }

};
</script>

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
  margin-top: -12px !important;
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

/* 批次号自动换行显示完整 */
.batch-no-text {
  display: inline-block;
  width: 100%;
  white-space: normal;
  word-break: break-all;
  line-height: 18px;
}
</style>

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

.query-row-second {
  margin-bottom: 2px;
  position: relative;
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

.query-row-third {
  margin-bottom: 2px;
}

.query-row-third .el-form-item {
  margin-bottom: 0;
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
  margin-left: 0;
  margin-right: 0;
  position: relative;
}

/* 表格底部横向滚动条：默认 6px，鼠标悬停自动变粗 12px */
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 6px;
  transition: height 0.2s ease;
}
.table-container ::v-deep .el-table__body-wrapper::-webkit-scrollbar:hover {
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

/* 优化表格列间距 */
.table-container ::v-deep .el-table th.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table td.el-table__cell {
  padding: 10px 12px !important;
}

.table-container ::v-deep .el-table .cell {
  padding: 0 4px;
}

/* 显隐列弹窗限制在本页内容区内，不铺满整个浏览器框架 */
.first-inventory-page {
  position: relative;
  min-height: 400px;
}
.first-inventory-page ::v-deep .inventory-column-dialog-inpage.el-dialog__wrapper {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2001;
}
.first-inventory-page ::v-deep .inventory-column-dialog-inpage .el-dialog {
  margin-top: 0 !important;
  max-height: 90%;
  display: flex;
  flex-direction: column;
}
.first-inventory-page ::v-deep .inventory-column-dialog-inpage .el-dialog__body {
  flex: 1;
  overflow: auto;
}
</style>
