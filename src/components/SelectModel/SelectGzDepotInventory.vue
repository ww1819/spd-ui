<template>
  <transition name="modal-fade">
    <div v-if="show" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="show" class="local-modal-content">
          <div class="modal-header">
            <div class="modal-title">高值备货库存明细</div>
            <el-button @click="handleClose" class="close-btn">关闭</el-button>
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
            <el-form-item label="院内码" prop="inHospitalCode" label-width="100px">
              <el-input
                v-model="queryParams.inHospitalCode"
                placeholder="请输入院内码（支持模糊搜索）"
                clearable
                @keyup.enter.native="handleQuery"
              />
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

        </el-row>

        <el-row :gutter="20">
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
      </el-form>

      <div class="button-container">
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
        <el-button size="small" @click="handleClose">取 消</el-button>
        <el-button type="primary" size="small" @click="checkBtn">确 定</el-button>
      </div>

      <el-table ref="singleTable" :data="depotInventoryList" :row-class-name="rowIndex" @selection-change="handleSelectionChange" height="calc(95vh - 380px)" border style="overflow: hidden;">
        <el-table-column type="selection" width="55" align="center" />
        <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
        <el-table-column label="耗材" align="center" prop="material.name" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="规格" align="center" prop="material.speci" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.speci) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="型号" align="center" prop="material.model" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.model) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="库存数量" align="center" prop="qty" width="80" show-overflow-tooltip resizable/>
        <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="生产日期" align="center" prop="materialDate" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="有效期" align="center" prop="endTime" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="批号" align="center" prop="materialNo" width="150" show-overflow-tooltip resizable/>
        <el-table-column label="院内码" align="center" prop="inHospitalCode" width="180" show-overflow-tooltip resizable/>
        <el-table-column label="批次号" align="center" prop="batchNo" width="200" show-overflow-tooltip resizable/>
        <el-table-column label="仓库" align="center" prop="warehouse.name" width="120" show-overflow-tooltip resizable/>
        <el-table-column label="供应商" align="center" prop="supplier.name" width="160" show-overflow-tooltip resizable/>
        <el-table-column label="耗材日期" align="center" prop="materialDate" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.materialDate">{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="入库日期" align="center" prop="warehouseDate" width="140" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.warehouseDate">{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
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
import { listDepotInventory } from "@/api/gz/depotInventory";
import { parseTime } from "@/utils/ruoyi";
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
      depotInventoryList: [],
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
        inHospitalCode: null,
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
      listDepotInventory(this.queryParams).then(response => {
        this.depotInventoryList = response.rows;
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
    /** 表格序号 */
    rowIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    handleClose() {
      //关闭弹窗
      this.show = false
      this.$emit('closeDialog')
    },
    checkBtn() {
      //确定按钮
      if(!this.selectRow || this.selectRow.length === 0) {
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
  z-index: 3000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 20px;
  overflow: hidden;
}

.local-modal-content {
  background: #fff;
  width: 95%;
  max-width: 1600px;
  height: calc(100vh - 40px);
  max-height: calc(100vh - 40px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
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
  padding: 5px 15px;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}

.button-container {
  display: flex;
  justify-content: flex-start;
  align-items: center;
  padding: 16px 20px;
  background: #fff;
  border-top: 1px solid #EBEEF5;
  border-bottom: 1px solid #EBEEF5;
  margin-bottom: 20px;
}

.button-container .el-button {
  margin-right: 12px;
}

.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 20px;
  display: flex;
  flex-direction: column;
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
  height: calc(95vh - 380px);
  min-height: 400px;
}

/* 隐藏表格滚动条并固定高度 */
.el-table__body-wrapper {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
  overflow: hidden !important; /* 禁止滚动 */
}

.el-table__body-wrapper::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}

.el-table {
  overflow: hidden !important;
}

.el-table__body {
  overflow: hidden !important;
}

/* 隐藏弹窗内容区域的滚动条 */
.modal-body {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.modal-body::-webkit-scrollbar {
  display: none; /* Chrome Safari */
}

/* 隐藏整个弹窗的滚动条 */
.local-modal-content {
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE 10+ */
}

.local-modal-content::-webkit-scrollbar {
  display: none; /* Chrome Safari */
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
