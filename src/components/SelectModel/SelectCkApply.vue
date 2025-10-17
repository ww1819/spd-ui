<template>
  <transition name="modal-fade">
    <div v-if="show" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="show" class="local-modal-content">
      <div class="modal-header">
        <div class="modal-title">出库单</div>
        <el-button icon="el-icon-close" size="mini" circle @click="handleClose" class="close-btn"></el-button>
      </div>
      <div class="modal-body">
        <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
        <el-row :gutter="20">

          <el-col :span="6">
            <el-form-item label="采购订单号" prop="billNo" label-width="100px">
              <el-input
                v-model="queryParams.billNo"
                placeholder="请输入采购订单号"
                clearable
                @keyup.enter.native="handleQuery"
              />
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="queryParams.warehouseId" :value2="isShow"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="供应商" prop="supplierId" label-width="100px">
              <SelectWarehouse v-model="queryParams.supplierId" :value2="isShow"/>
            </el-form-item>
          </el-col>

          <el-col :span="6">
            <el-form-item label="科室" prop="departmentId" label-width="100px">
              <SelectWarehouse v-model="queryParams.departmentId" :value2="isShow"/>
            </el-form-item>
          </el-col>


          <el-col :span="6">
            <el-form-item label="耗材" prop="materialId" label-width="100px">
              <SelectMaterial v-model="queryParams.materialId" />
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

        <el-table ref="singleTable" :data="warehouseList" :row-class-name="warehouseListIndex" @selection-change="handleSelectionChange" height="calc(42vh)" border>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
          <el-table-column label="出库单号" align="center" prop="billNo" width="180">
            <template slot-scope="scope">
              <el-button type="text" @click="handleView(scope.row)">
                <span>{{ scope.row.billNo }}</span>
              </el-button>
            </template>
          </el-table-column>
          <el-table-column label="供应商" align="center" prop="supplier.name" width="180"/>
          <el-table-column label="订单日期" align="center" prop="orderDate" width="180">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="仓库" align="center" prop="warehouse.name" />
          <el-table-column label="金额" align="center" prop="totalAmount" >
            <template slot-scope="scope">
              <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="订单状态" align="center" prop="orderStatus">
            <template slot-scope="scope">
              <dict-tag :options="dict.type.biz_status" :value="scope.row.orderStatus"/>
            </template>
          </el-table-column>
          <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="id" align="center" prop="id" show-overflow-tooltip resizable />
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-button
                size="mini"
                type="text"
                icon="el-icon-view"
                @click="handleView(scope.row)"
                v-hasPermi="['department:dApply:view']"
              >查看</el-button>
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
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import { listOutWarehouse,getOutWarehouse } from "@/api/warehouse/outWarehouse";

export default {
  name: "SelectCkApply",
  dicts:['way_status'],
  components: {SelectMaterial,SelectWarehouse,SelectDepartment,SelectSupplier},
  props: ['DialogComponentShow','warehouseValue','departmentValue','materialValue','supplierValue'], //接受父组件传递过来的数据
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
      //出库单列表
      warehouseList: [],
      // 出库明细列表
      stkIoBillEntryList: [],
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
        applyBillNo:null,
        warehouseId: null,
        departmentId: null,
        supplierId: null,
        materialId: null
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
    this.queryParams.departmentId = this.departmentValue
    this.queryParams.materialId = this.materialValue
    this.
    this.getList();
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询科室申请单 */
    getList() {
      this.queryParams.billType = "201";
      this.loading = true;
      listOutWarehouse(this.queryParams).then(response => {
        this.warehouseList = response.rows;
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
    warehouseListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getOutWarehouse(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = false;
        this.form.orderStatus = '0';
        this.form.orderType = '1';
        this.title = "查看订单";
      });
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
