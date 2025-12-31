<template>
  <div class="app-container">
    <!-- 左右分栏布局：左边供应商列表，右边耗材明细 -->
    <el-row :gutter="10" style="margin-top: -10px;">
      <!-- 左边：供应商列表 -->
      <el-col :span="5">
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
      
      <!-- 右边：耗材明细信息 -->
      <el-col :span="19">
        <div class="material-container">
          <div class="material-header">
            <span class="material-title">耗材明细</span>
            <span v-if="selectedSupplier" class="selected-supplier">当前供应商：{{ selectedSupplier.name }}</span>
            <span v-else class="selected-supplier">当前供应商：全部</span>
          </div>
          
          <!-- 搜索框容器 -->
          <div class="query-container" style="margin-bottom: 0px;">
            <div class="form-fields-container">
              <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="80px">
                <el-row class="query-row-first">
                  <el-col :span="24">
                    <el-form-item label="耗材编码" prop="code" class="query-item-inline">
                      <el-input
                        v-model="queryParams.code"
                        placeholder="请输入耗材编码"
                        clearable
                        @keyup.enter.native="handleQuery"
                        style="width: 200px"
                      />
                    </el-form-item>

                    <el-form-item label="规格" prop="speci" class="query-item-inline">
                      <el-input
                        v-model="queryParams.speci"
                        placeholder="请输入规格"
                        clearable
                        @keyup.enter.native="handleQuery"
                        style="width: 200px"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>
          </div>

          <!-- 搜索按钮 -->
          <el-row :gutter="10" class="mb8" style="margin-top: 2px; margin-bottom: 16px; padding: 0 16px;">
            <el-col :span="1.5">
              <el-button
                type="primary"
                icon="el-icon-search"
                size="medium"
                @click="handleQuery"
              >搜索</el-button>
            </el-col>
          </el-row>

          <!-- 明细表格 -->
          <div class="table-container" style="margin-top: -30px;">
            <el-table v-loading="loading" :data="materialCompareList" border height="calc(100vh - 340px)" :cell-style="{whiteSpace: 'nowrap'}">
              <el-table-column type="selection" width="55" align="center" fixed="left" />
              <el-table-column type="index" label="序号" align="center" width="80" />
              <el-table-column label="耗材编码" align="center" prop="code" width="120" show-overflow-tooltip />
              <el-table-column label="耗材名称" align="center" prop="name" min-width="200" show-overflow-tooltip />
              <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip />
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
              <el-table-column label="HRP编码" align="center" prop="hrpCode" width="120" show-overflow-tooltip />
              <el-table-column label="HIS编码" align="center" prop="hisCode" width="120" show-overflow-tooltip />
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
              <el-table-column label="操作" align="center" width="150" fixed="right">
                <template slot-scope="scope">
                  <el-button
                    size="small"
                    type="text"
                    icon="el-icon-edit"
                    @click="handleHis(scope.row)"
                  >HIS</el-button>
                  <el-button
                    size="small"
                    type="text"
                    icon="el-icon-delete"
                    @click="handleHrp(scope.row)"
                  >HRP</el-button>
                </template>
              </el-table-column>
            </el-table>

            <pagination
              v-show="total > 0"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="getList"
            />
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- HIS弹窗 -->
    <el-dialog
      :visible.sync="hisDialogVisible"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
    >
      <div slot="title" style="display: flex; justify-content: space-between; align-items: center;">
        <span>HIS对照</span>
        <el-button type="text" @click="hisDialogVisible = false" style="padding: 0;">关闭</el-button>
      </div>
      
      <!-- 搜索框 -->
      <div class="his-query-container">
        <el-form :model="hisQueryParams" ref="hisQueryForm" size="small" :inline="true" label-width="80px">
          <el-row>
            <el-col :span="24">
              <el-form-item label="名称" prop="name" class="query-item-inline">
                <el-input
                  v-model="hisQueryParams.name"
                  placeholder="请输入名称"
                  clearable
                  @keyup.enter.native="handleHisQuery"
                  style="width: 200px"
                />
              </el-form-item>

              <el-form-item label="规格" prop="speci" class="query-item-inline">
                <el-input
                  v-model="hisQueryParams.speci"
                  placeholder="请输入规格"
                  clearable
                  @keyup.enter.native="handleHisQuery"
                  style="width: 200px"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 搜索按钮 -->
      <el-row :gutter="10" class="mb8" style="margin-top: 8px; margin-bottom: 16px; padding: 0 20px;">
        <el-col :span="1.5">
          <el-button
            type="primary"
            icon="el-icon-search"
            size="medium"
            @click="handleHisQuery"
          >搜索</el-button>
        </el-col>
      </el-row>

      <!-- 明细表格 -->
      <div class="his-table-container">
        <el-table v-loading="hisLoading" :data="hisList" border height="400px">
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

        <pagination
          v-show="hisTotal > 0"
          :total="hisTotal"
          :page.sync="hisQueryParams.pageNum"
          :limit.sync="hisQueryParams.pageSize"
          @pagination="getHisList"
        />
      </div>
    </el-dialog>

    <!-- HRP弹窗 -->
    <el-dialog
      :visible.sync="hrpDialogVisible"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
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
                  placeholder="请输入名称"
                  clearable
                  @keyup.enter.native="handleHrpQuery"
                  style="width: 200px"
                />
              </el-form-item>

              <el-form-item label="规格" prop="speci" class="query-item-inline">
                <el-input
                  v-model="hrpQueryParams.speci"
                  placeholder="请输入规格"
                  clearable
                  @keyup.enter.native="handleHrpQuery"
                  style="width: 200px"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <!-- 搜索按钮 -->
      <el-row :gutter="10" class="mb8" style="margin-top: 8px; margin-bottom: 16px; padding: 0 20px;">
        <el-col :span="1.5">
          <el-button
            type="primary"
            icon="el-icon-search"
            size="medium"
            @click="handleHrpQuery"
          >搜索</el-button>
        </el-col>
      </el-row>

      <!-- 明细表格 -->
      <div class="hrp-table-container">
        <el-table v-loading="hrpLoading" :data="hrpList" border height="400px">
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
import { listMaterial } from "@/api/foundation/material";
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
        speci: null,
        supplierId: null
      },
      // HIS弹窗相关
      hisDialogVisible: false,
      hisLoading: false,
      hisList: [],
      hisTotal: 0,
      hisQueryParams: {
        pageNum: 1,
        pageSize: 10,
        name: null,
        speci: null
      },
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
      currentMaterialRow: null
    };
  },
  created() {
    this.getSupplierList();
    // 默认显示全部供应商的产品
    this.handleShowAll();
  },
  methods: {
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
      listMaterial(this.queryParams).then(response => {
        this.materialCompareList = response.rows;
        this.total = response.total;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.supplierId = this.selectedSupplier ? this.selectedSupplier.id : null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },
    /** HIS按钮操作 */
    handleHis(row) {
      this.currentMaterialRow = row;
      this.hisDialogVisible = true;
      this.hisQueryParams.pageNum = 1;
      this.getHisList();
    },
    /** HIS搜索 */
    handleHisQuery() {
      this.hisQueryParams.pageNum = 1;
      this.getHisList();
    },
    /** 查询HIS列表 */
    getHisList() {
      this.hisLoading = true;
      // TODO: 调用HIS接口
      // 这里先模拟数据
      setTimeout(() => {
        this.hisList = [];
        this.hisTotal = 0;
        this.hisLoading = false;
      }, 500);
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
      return parseFloat(value).toFixed(2);
    }
  }
};
</script>

<style scoped>
/* 供应商容器 */
.supplier-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
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

/* 耗材容器 */
.material-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
  overflow: hidden;
}

.material-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.material-title {
  font-weight: bold;
  font-size: 14px;
  color: #303133;
}

.selected-supplier {
  font-size: 13px;
  color: #409EFF;
}

.query-container {
  margin: 16px;
  margin-bottom: 16px;
}

.form-fields-container {
  background: #fafafa;
  padding: 6px 20px;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
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
  padding: 16px;
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
  margin-bottom: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 4px;
  border: 1px solid #EBEEF5;
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

/* 表格滚动条样式 */
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

