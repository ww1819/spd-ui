<template>
  <transition name="modal-fade">
    <div v-if="show" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="show" class="local-modal-content">
          <div class="modal-header">
            <div class="modal-title">选择耗材产品</div>
            <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
          </div>
          <div class="modal-body">
            <div class="form-fields-container">
              <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="耗材编码" prop="code" label-width="100px">
                      <el-input
                        v-model="queryParams.code"
                        placeholder="请输入耗材编码"
                        clearable
                        @keyup.enter.native="handleQuery"
                      />
                    </el-form-item>
                  </el-col>

                  <el-col :span="6">
                    <el-form-item label="供应商" prop="supplierId" label-width="100px">
                      <SelectSupplier v-model="queryParams.supplierId"/>
                    </el-form-item>
                  </el-col>

                  <el-col :span="6">
                    <el-form-item label="品牌" prop="brand" label-width="100px">
                      <el-input
                        v-model="queryParams.brand"
                        placeholder="请输入品牌"
                        clearable
                        @keyup.enter.native="handleQuery"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="耗材名称" prop="name" label-width="100px">
                      <el-input
                        v-model="queryParams.name"
                        placeholder="请输入耗材名称"
                        clearable
                        @keyup.enter.native="handleQuery"
                      />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>

            <!-- 搜索、重置、取消、确认按钮放在查询条件容器和表格之间 -->
            <div style="text-align: left; margin: 10px 0;">
              <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="medium" @click="resetQuery" style="margin-left: 10px;">重置</el-button>
              <el-button size="medium" @click="handleClose" style="margin-left: 10px;">取 消</el-button>
              <el-button type="primary" size="medium" @click="checkBtn" style="margin-left: 10px;">确 定</el-button>
            </div>

            <el-table ref="singleTable" :data="materialList" :row-class-name="rowMaterialIndex" @selection-change="handleSelectionChange" height="calc(48vh)" border>
              <el-table-column type="selection" width="55" align="center" />
              <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
                </template>
              </el-table-column>
              <el-table-column label="耗材编码" align="center" prop="code" width="120" show-overflow-tooltip resizable/>
              <el-table-column label="耗材名称" align="center" prop="name" width="150" show-overflow-tooltip resizable/>
              <el-table-column label="规格" align="center" prop="speci" width="120" show-overflow-tooltip resizable/>
              <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable/>
              <el-table-column label="单位" align="center" width="80" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdUnit && scope.row.fdUnit.unitName) || (scope.row.unit && scope.row.unit.unitName) || (scope.row.unit && scope.row.unit.name) || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="单价" align="center" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span v-if="scope.row.price || scope.row.prince">¥{{ parseFloat(scope.row.price || scope.row.prince).toFixed(2) }}</span>
                  <span v-else>--</span>
                </template>
              </el-table-column>
              <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
              <el-table-column label="生产厂家" align="center" width="160" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ (scope.row.fdFactory && scope.row.fdFactory.factoryName) || scope.row.producer || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="注册证号" align="center" width="150" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.registerNo || scope.row.register_no || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="计费" align="center" width="100" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.isBilling == '1' || scope.row.isBilling == 1 ? '是' : '否' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="品牌" align="center" prop="brand" width="120" show-overflow-tooltip resizable/>
              <el-table-column label="备注" align="center" prop="remark" width="150" show-overflow-tooltip resizable>
                <template slot-scope="scope">
                  <span>{{ scope.row.remark || '--' }}</span>
                </template>
              </el-table-column>
            </el-table>

            <pagination
              v-show="total>0"
              :total="total"
              :page.sync="queryParams.pageNum"
              :limit.sync="queryParams.pageSize"
              @pagination="getList"
            />
          </div>
        </div>
      </transition>
    </div>
  </transition>
</template>

<script>
import { listMaterial } from "@/api/foundation/material";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";

export default {
  name: "SelectMaterialForPurchase",
  components: {SelectSupplier},
  props: {
    DialogComponentShow: Boolean, //接受父组件传递过来的数据
    warehouseValue: [Number, String] // 仓库ID，用于过滤定数监测数据
  },
  data() {
    return {
      // 遮罩层
      show: false, //弹窗默认隐藏
      selectRow: [], //选择的行数据
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
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        supplierId: null,
        brand: null,
        isGz: '2' // 普通耗材
      },
      // 表单参数
      form: {},
      // 定数监测的产品ID列表（用于过滤）
      fixedNumberMaterialIds: [],
      // 所有过滤后的材料列表（用于分页）
      allFilteredMaterials: [],
    };
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        // 弹窗打开时，如果有仓库ID，加载定数监测数据
        if (this.warehouseValue) {
          this.loadFixedNumberMaterials(this.warehouseValue);
        }
        this.getList();
      }
    },
    warehouseValue(newVal) {
      // 当仓库值变化时，重新加载定数监测数据
      if (newVal) {
        this.loadFixedNumberMaterials(newVal);
        this.getList();
      } else {
        this.fixedNumberMaterialIds = [];
        this.getList();
      }
    }
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow;
    // 如果有仓库ID，加载定数监测数据
    if (this.warehouseValue) {
      this.loadFixedNumberMaterials(this.warehouseValue);
    }
    this.getList();
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 加载定数监测的产品列表 */
    loadFixedNumberMaterials(warehouseId) {
      if (!warehouseId) {
        this.fixedNumberMaterialIds = [];
        return;
      }
      
      try {
        // 从localStorage读取定数监测数据（仓库定数监测类型为'1'）
        const storageKey = `fixedNumber_1_${warehouseId}`;
        const savedData = localStorage.getItem(storageKey);
        
        if (savedData) {
          const fixedNumberList = JSON.parse(savedData);
          // 提取所有做了定数监测的产品ID
          this.fixedNumberMaterialIds = fixedNumberList
            .filter(item => item.material && item.material.id)
            .map(item => item.material.id)
            .filter(id => id);
        } else {
          this.fixedNumberMaterialIds = [];
        }
      } catch (error) {
        console.error('加载定数监测数据失败:', error);
        this.fixedNumberMaterialIds = [];
      }
    },
    /** 查询耗材信息列表 */
    getList() {
      this.loading = true;
      // 如果使用定数监测过滤，需要获取所有数据
      const queryParams = { ...this.queryParams };
      if (this.fixedNumberMaterialIds.length > 0) {
        // 获取所有数据，不分页
        queryParams.pageNum = 1;
        queryParams.pageSize = 9999;
      }
      
      listMaterial(queryParams).then(response => {
        let materialList = response.rows || [];
        
        // 如果有定数监测产品ID列表，只显示这些产品
        if (this.fixedNumberMaterialIds.length > 0) {
          materialList = materialList.filter(item => {
            return item.id && this.fixedNumberMaterialIds.includes(item.id);
          });
        }
        
        // 保存所有过滤后的数据
        this.allFilteredMaterials = materialList;
        this.total = materialList.length;
        
        // 客户端分页
        const start = (this.queryParams.pageNum - 1) * this.queryParams.pageSize;
        const end = start + this.queryParams.pageSize;
        this.materialList = materialList.slice(start, end);
        
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
      if(!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: '请先选择耗材产品', type: 'warning' })
        return
      }
      this.$emit('selectData', this.selectRow)   //发送数据到父组件
      this.handleClose()
    },
    /** 耗材序号 */
    rowMaterialIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 删除行 */
    handleDeleteRow(index) {
      this.materialList.splice(index, 1);
      this.total = this.materialList.length;
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
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 95vh !important;
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
  border: 1px solid #DCDFE6;
  background: #fff;
  padding: 7px 15px;
}

.close-btn:hover {
  background: #F5F7FA;
  border-color: #C0C4CC;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
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

/* 搜索条件容器样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

/* 搜索表单样式 */
.el-form {
  background: transparent;
  padding: 0;
  margin-bottom: 0;
}

.el-form .el-form-item {
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

/* 确保操作列固定 */
::v-deep .el-table__fixed-right {
  right: 0 !important;
  z-index: 12 !important;
  position: absolute !important;
}

::v-deep .el-table__fixed-header-wrapper {
  z-index: 11;
}

::v-deep .el-table__fixed-right-patch {
  right: 0 !important;
  z-index: 12 !important;
}

/* 确保固定列头部和主体都有正确的z-index */
::v-deep .el-table__fixed-right .el-table__header-wrapper {
  z-index: 12 !important;
}

::v-deep .el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}

/* 确保固定列在滚动时保持固定 */
::v-deep .el-table__fixed {
  position: absolute !important;
}

/* 底部滚动条样式 */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 6px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 6px;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}
</style>
