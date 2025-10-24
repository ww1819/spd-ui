<template>
  <div>
    <!-- 引用采购订单弹窗 -->
    <div v-show="show" class="purchase-modal-mask">
      <div v-show="show" class="purchase-modal-content">
        <div class="modal-header">
          <div class="modal-title">采购订单</div>
          <el-button icon="el-icon-close" size="mini" circle @click="show = false" class="close-btn"></el-button>
        </div>
        <div class="modal-body">
          <el-form :model="queryParams" ref="queryForm" :inline="true" v-show="showSearch" label-width="68px">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="采购订单号" prop="orderNo" label-width="100px">
                  <el-input
                    v-model="queryParams.orderNo"
                    placeholder="请输入采购订单号"
                    clearable
                    @keyup.enter.native="handleQuery"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                  <SelectWarehouse v-model="queryParams.warehouseId"/>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="供应商" prop="supplierId" label-width="100px">
                  <SelectSupplier v-model="queryParams.supplierId"/>
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="科室" prop="departmentId" label-width="100px">
                  <SelectDepartment v-model="queryParams.departmentId"/>
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

          <el-table ref="singleTable" :data="orderList" :row-class-name="orderListIndex" @selection-change="handleSelectionChange" height="calc(42vh)" border v-loading="loading">
            <el-table-column type="selection" width="55" align="center" />
            <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
            <el-table-column label="订单单号" align="center" prop="orderNo" width="180">
              <template slot-scope="scope">
                <el-button type="text" @click="handleView(scope.row)">
                  <span>{{ scope.row.orderNo }}</span>
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
                  v-hasPermi="['caigou:dingdan:view']"
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
          <el-button @click="show = false">取 消</el-button>
          <el-button type="primary" @click="checkBtn">确 定</el-button>
        </div>
      </div>
    </div>

    <!-- 查看订单详情组件 -->
    <ViewDingdanDetail :orderId="viewOrderId" @close="handleViewClose" />
  </div>
</template>

<script>
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import ViewDingdanDetail from "@/components/SelectModel/ViewDingdanDetail";
import { listDingdan } from "@/api/caigou/dingdan";

export default {
  name: "SelectDingdan",
  dicts:['biz_status'],
  components: {SelectMaterial,SelectWarehouse,SelectDepartment,SelectSupplier,ViewDingdanDetail},
  props: ['DialogComponentShow','warehouseValue','departmentValue','materialValue','supplierValue'], //接受父组件传递过来的数据
  data() {
    return {
      // 遮罩层
      loading: true,
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
      //订单列表
      orderList: [],
      // 查看订单的ID
      viewOrderId: null,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        warehouseId: null,
        departmentId: null,
        supplierId: null,
        materialId: null,
        orderStatus: null
      }
    };
  },
  mounted() {
    //显示弹窗
    this.show = this.DialogComponentShow
    this.queryParams.warehouseId = this.warehouseValue
    this.queryParams.supplierId = this.supplierValue
    this.queryParams.departmentId = this.departmentValue
    this.queryParams.materialId = this.materialValue
    this.getList();
  },
  created() {
    // this.getList();
  },
  watch: {
    show(newVal) {
      if (!newVal) {
        this.$emit('closeDialog')
      }
    },
    DialogComponentShow(newVal) {
      this.show = newVal;
      if (newVal) {
        // 弹窗打开时更新查询参数并重新加载数据
        this.queryParams.warehouseId = this.warehouseValue;
        this.queryParams.supplierId = this.supplierValue;
        this.queryParams.departmentId = this.departmentValue;
        this.queryParams.materialId = this.materialValue;
        this.getList();
      }
    }
  },
  methods: {
    /** 查询采购订单 */
    getList() {
      this.loading = true;
      // 只查询已审核的采购订单
      this.queryParams.orderStatus = "2";
      listDingdan(this.queryParams).then(response => {
        this.orderList = response.rows;
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
      this.queryParams.warehouseId = this.warehouseValue;
      this.queryParams.supplierId = this.supplierValue;
      this.queryParams.departmentId = this.departmentValue;
      this.queryParams.materialId = this.materialValue;
      this.handleQuery();
    },
    handleSelectionChange(val) {
      //获取选择的行数据
      this.selectRow = val
    },
    checkBtn() {
      //确定按钮
      if(!this.selectRow || this.selectRow.length === 0) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      this.$emit('selectData', this.selectRow)   //发送数据到父组件
      this.show = false
    },
    orderListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 查看按钮操作 */
    handleView(row){
      this.viewOrderId = row.id;
    },
    /** 关闭查看详情弹窗 */
    handleViewClose() {
      this.viewOrderId = null;
    },
  }
};
</script>

<style scoped>
/* 引用采购订单弹窗样式 */
.purchase-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.purchase-modal-content {
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
</style>
