<template>
  <transition name="modal-fade">
    <div v-if="show" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="show" class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">库存明细</div>
        <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
      </div>
      <div class="modal-body">
        <!-- 查询条件容器框（与添加科室申领弹窗一致） -->
        <div ref="formFieldsContainer" class="form-fields-container inventory-query-fields">
          <el-form :model="queryParams" ref="queryForm" :inline="true" size="small" v-show="showSearch" label-width="68px">
            <el-row :gutter="20">

              <el-col :span="6">
                <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                  <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow"/>
                </el-form-item>
              </el-col>

              <el-col :span="6">
                <el-form-item label="供应商" prop="supplierId" label-width="100px">
                  <SelectSupplier v-model="queryParams.supplierId" :value2="false"/>
                </el-form-item>
              </el-col>

              <el-col :span="6">
                <el-form-item label="入库批次号" prop="batchNo" label-width="100px">
                  <el-input
                    v-model="queryParams.batchNo"
                    placeholder="请输入入库批次号"
                    clearable
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>

            </el-row>

            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="耗材" prop="materialId" label-width="100px">
                  <SelectMaterial v-model="queryParams.materialId" />
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
        </div>

        <!-- 操作按钮行（与添加科室申领弹窗的 mb8 一致） -->
        <el-row :gutter="10" class="mb8 action-buttons-row">
          <el-col :span="1.5">
            <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button size="medium" @click="handleClose">取 消</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="primary" size="medium" @click="checkBtn">确 定</el-button>
          </el-col>
        </el-row>

        <!-- 表格区域（与添加科室申领弹窗的 table-wrapper 一致） -->
        <div class="table-wrapper">
        <el-table ref="singleTable" :data="inventoryList" :row-class-name="inventoryIndex" @selection-change="handleSelectionChange" height="100%" border>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
<!--          <el-table-column label="耗材" align="center" prop="material.name" width="120" show-overflow-tooltip resizable/>-->
          <el-table-column label="名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库存数量" align="center" prop="qty" width="80" show-overflow-tooltip resizable/>
          <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="批号" align="center" prop="materialNo" width="200" show-overflow-tooltip resizable/>
          <el-table-column label="有效期" align="center" prop="endTime" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="beginTime" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable/>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="包装规格" align="center" prop="material.packageSpeci" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="库房分类" align="center" prop="material.fdWarehouseCategory.warehouseCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="财务分类" align="center" prop="material.fdFinanceCategory.financeCategoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="储存方式" align="center" prop="material.isWay" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <dict-tag :options="dict.type.way_status" :value="scope.row.material.isWay"/>
            </template>
          </el-table-column>
        </el-table>
        </div>

        <div class="pagination-bottom-wrap">
          <pagination
            v-show="total>0"
            :total="total"
            :page.sync="queryParams.pageNum"
            :limit.sync="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import { listInventory } from "@/api/warehouse/inventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";

export default {
  name: "SelectInventory",
  dicts:['way_status'],
  components: {SelectMaterial,SelectWarehouse,SelectSupplier},
  props: ['DialogComponentShow','warehouseValue','supplierValue','selectedDetails'], //接受父组件传递过来的数据
  data() {
    return {
      // 遮罩层
      show: false, //弹窗默认隐藏
      selectRow: [], //选择的行数据
      isShow: true,//是否显示
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
      // 库存信息表格数据
      inventoryList: [],
      //单位
      unitOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        warehouseId: null,
        materialId: null,
        supplierId: null,
        batchNo: null,
      },
      // 表单参数
      form: {},
    };
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow || false;
    this.queryParams.warehouseId = this.warehouseValue
    this.queryParams.supplierId = this.supplierValue
    if (this.show) {
      this.getList();
      // 动态设置容器样式
      this.$nextTick(() => {
        this.setContainerStyle();
      });
    }
  },
  watch: {
    show(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.setContainerStyle();
        });
      }
    },
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        this.$nextTick(() => {
          this.setContainerStyle();
          // 当弹窗打开时，如果有已选择的明细，标记已添加的项目
          if (this.inventoryList && this.inventoryList.length > 0) {
            this.markSelectedItems();
          }
        });
      }
    },
    selectedDetails: {
      handler() {
        // 当已选择的明细变化时，重新标记
        if (this.show && this.inventoryList && this.inventoryList.length > 0) {
          this.$nextTick(() => {
            this.markSelectedItems();
          });
        }
      },
      deep: true
    }
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 动态设置容器样式（与添加科室申领弹窗一致，由 CSS 类控制样式） */
    setContainerStyle() {
      this.$nextTick(() => {});
    },
    /** 查询库存信息列表 */
    getList() {
      this.loading = true;
      listInventory(this.queryParams).then(response => {
        this.inventoryList = response.rows;
        this.total = response.total;
        this.loading = false;
        // 如果有已选择的明细，标记已添加的项目
        this.$nextTick(() => {
          this.markSelectedItems();
        });
      });
    },
    /** 标记已选择的明细 */
    markSelectedItems() {
      if (!this.selectedDetails || !this.selectedDetails.length || !this.inventoryList || !this.inventoryList.length) {
        return;
      }
      
      // 清空之前的选择
      if (this.$refs.singleTable) {
        this.$refs.singleTable.clearSelection();
      }
      
      // 根据已选择的明细，在库存列表中标记已添加的项目
      const selectedRows = [];
      this.inventoryList.forEach(inventoryItem => {
        // 匹配规则：materialId + batchNo 相同则认为已添加
        const isSelected = this.selectedDetails.some(detail => {
          return detail.materialId === inventoryItem.materialId && 
                 detail.batchNo === inventoryItem.batchNo;
        });
        
        if (isSelected) {
          selectedRows.push(inventoryItem);
        }
      });
      
      // 预选已添加的项目
      if (selectedRows.length > 0 && this.$refs.singleTable) {
        selectedRows.forEach(row => {
          this.$refs.singleTable.toggleRowSelection(row, true);
        });
      }
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    handleSelectionChange(val) {
      //获取选择的行数据
      this.selectRow = val
    },
    handleClose() {
      //关闭弹窗
      this.show = false
      this.$emit('closeDialog')
    },
    checkBtn() {
      //确定按钮
      if(!this.selectRow) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      this.$emit('selectData', this.selectRow)   //发送数据到父组件
      this.handleClose()
    },
    inventoryIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    }
  }
};
</script>

<style scoped>
/* 使用深度选择器确保样式正确应用 */
/* 使用深度选择器确保样式正确应用 */
/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  min-height: 48px;
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

/* 与添加科室申领弹窗一致：内容区白色背景，内边距与 flex 布局 */
.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 10px 6px 24px 6px;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 查询条件容器：降低高度（内边距与表单项间距收紧） */
.modal-body .form-fields-container.inventory-query-fields {
  margin-left: 0;
  margin-right: 0;
  margin-bottom: 8px;
  padding: 10px 16px !important;
  min-height: 0 !important;
  width: 100%;
  max-width: 100%;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

/* 搜索框内表单项间距减小，整体高度降低 */
::v-deep .modal-body .form-fields-container.inventory-query-fields .el-form-item {
  margin-bottom: 8px;
}
::v-deep .modal-body .form-fields-container.inventory-query-fields .el-form-item:last-child {
  margin-bottom: 0;
}

/* 操作按钮行：上边距 -8px，下边距 8px */
.modal-body .mb8.action-buttons-row {
  flex-shrink: 0;
  margin-top: -8px;
  margin-bottom: 8px;
}

/* 表格区域（与添加科室申领弹窗 .table-wrapper 一致） */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  height: 0;
}

.local-modal-content .table-wrapper .el-table {
  height: 100% !important;
  margin-bottom: 0 !important;
}

::v-deep .local-modal-content .table-wrapper .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: calc(100vh - 420px) !important;
}

::v-deep .local-modal-content .table-wrapper .el-table .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .table-wrapper .el-table .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
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

/* 表格样式优化 */
.el-table {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266;
  font-weight: 500;
  height: 50px;
  padding: 8px 0;
  border-bottom: 1px solid #EBEEF5;
}

.el-table td {
  padding: 12px 0;
  color: #606266;
  border-bottom: 1px solid #EBEEF5;
}

.el-table tr:hover > td {
  background-color: #F5F7FA !important;
  transition: all 0.3s;
}

/* 查询条件容器样式 - 与到货验收页面保持一致 */
::v-deep .form-fields-container,
.form-fields-container {
  background: #fff !important;
  padding: 16px 20px !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05) !important;
  margin-bottom: 16px !important;
  border: 1px solid #EBEEF5 !important;
  flex-shrink: 0;
  display: block !important;
  box-sizing: border-box !important;
  width: 100% !important;
  min-height: 100px !important;
}

/* 使用更强的选择器优先级 */
.modal-body .form-fields-container,
.local-modal-content .modal-body .form-fields-container {
  background: #fff !important;
  padding: 16px 20px !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05) !important;
  margin-bottom: 16px !important;
  border: 1px solid #EBEEF5 !important;
  flex-shrink: 0;
  display: block !important;
  box-sizing: border-box !important;
  width: 100% !important;
  min-height: 100px !important;
}

/* 分页上移，紧贴表格，确保可见且与表格间距小 */
.pagination-bottom-wrap {
  flex-shrink: 0;
  padding: 0;
  margin-top: -6px;
  margin-bottom: 0;
}
::v-deep .pagination-bottom-wrap .pagination-container {
  padding: 8px 0 4px 0;
}

/* 搜索表单样式 - 确保在容器内透明 */
::v-deep .form-fields-container .el-form,
.form-fields-container .el-form,
.modal-body .form-fields-container .el-form,
.local-modal-content .form-fields-container .el-form {
  background: transparent !important;
  padding: 0 !important;
  border-radius: 0;
  box-shadow: none;
  margin-bottom: 0;
}

::v-deep .form-fields-container .el-form .el-form-item,
.form-fields-container .el-form .el-form-item,
.modal-body .form-fields-container .el-form .el-form-item,
.local-modal-content .form-fields-container .el-form .el-form-item {
  margin-bottom: 15px;
}

/* 弹窗动画效果 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center center;
}

.modal-zoom-enter {
  opacity: 0;
  transform: scale(0.3) translateY(-50px);
}

.modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>

<style>
/* 非scoped样式，确保容器样式不被覆盖 - 使用最高优先级 */
.local-modal-content .modal-body .form-fields-container,
div.local-modal-content div.modal-body div.form-fields-container {
  background: #fff !important;
  padding: 16px 20px !important;
  border-radius: 8px !important;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05) !important;
  margin-bottom: 16px !important;
  border: 1px solid #EBEEF5 !important;
  flex-shrink: 0 !important;
  display: block !important;
  box-sizing: border-box !important;
  width: 100% !important;
  min-height: 100px !important;
  position: relative !important;
  z-index: 10 !important;
}
</style>
