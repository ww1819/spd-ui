<template>
  <transition name="modal-fade">
    <div v-if="show" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="show" class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">库存明细</div>
        <el-button icon="el-icon-close" size="mini" circle @click="handleClose" class="close-btn"></el-button>
      </div>
      <div class="modal-body">
        <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-row :gutter="20">

          <el-col :span="6">
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="供应商" prop="supplierId" label-width="100px">
              <SelectSupplier v-model="queryParams.supplierId" :value2="isShow"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="耗材" prop="materialId" label-width="100px">
              <SelectMaterial v-model="queryParams.materialId" />
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

        <el-row :gutter="24">
          <el-col :span="6">
            <el-form-item>
              <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
              <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>

        <el-table ref="singleTable" :data="inventoryList" @selection-change="handleSelectionChange" height="calc(42vh)" border>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="耗材" align="center" prop="material.name" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
          <el-table-column label="库存数量" align="center" prop="qty" width="80" show-overflow-tooltip resizable/>
          <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable/>
          <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable/>
          <el-table-column label="批号" align="center" prop="materialNo" width="200" show-overflow-tooltip resizable/>
          <el-table-column label="生产日期" align="center" prop="beginTime" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期" align="center" prop="endTime" width="140" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
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
      
      <div class="modal-footer">
        <el-button @click="handleClose">取 消</el-button>
        <el-button type="primary" @click="checkBtn">确 定</el-button>
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
  components: {SelectMaterial,SelectWarehouse,SelectSupplier},
  props: ['DialogComponentShow','warehouseValue','supplierValue'], //接受父组件传递过来的数据
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
    this.show = this.DialogComponentShow
    this.queryParams.warehouseId = this.warehouseValue
    this.queryParams.supplierId = this.supplierValue
    this.getList();
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询库存信息列表 */
    getList() {
      this.loading = true;
      listInventory(this.queryParams).then(response => {
        this.inventoryList = response.rows;
        this.total = response.total;
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
      if(!this.selectRow) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      this.$emit('selectData', this.selectRow)   //发送数据到父组件
      this.handleClose()
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

/* 搜索表单样式 */
.el-form {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
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
</style>
