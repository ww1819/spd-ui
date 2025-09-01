<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="盘点单号" prop="billNo" label-width="100px">
            <el-input v-model="queryParams.billNo"
                      placeholder="请输入盘点单号"
                      clearable
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="盘点日期" prop="warehouseDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.warehouseDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择盘点日期">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="耗材" prop="materialId" label-width="100px">
            <SelectMaterial v-model="queryParams.materialId" />
          </el-form-item>

        </el-col>

        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId"/>
          </el-form-item>

        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6" label-width="100px">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="mini"
          @click="handleAdd"
          v-hasPermi="['outWarehouse:apply:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="mini"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['outWarehouse:apply:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="mini"
          :disabled="multiple"
          @click="handleDelete"
          v-hasPermi="['outWarehouse:apply:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['outWarehouse:apply:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="warehouseList" @selection-change="handleSelectionChange" height="54vh" border>
      <el-table-column type="selection" width="55" align="center" resizable />
      <el-table-column label="盘点单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="盘点日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" show-overflow-tooltip resizable />
      <el-table-column label="单据状态" align="center" prop="billStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="盘点类型" align="center" prop="billType" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.billType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button
            size="mini"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['outWarehouse:apply:edit']"
          >修改</el-button>
          <el-button
            size="mini"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['outWarehouse:apply:remove']"
          >删除</el-button>
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

    <!-- 添加或修改盘点对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="mini" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">

        <el-row>
          <el-col :span="4">
            <el-form-item label="单据状态" prop="billStatus" label-width="100px">
              <el-select v-model="form.billStatus" placeholder="请选择单据状态"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.biz_status"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
<!--          <el-col :span="4">-->
<!--            <el-form-item label="盘点类型" prop="billType" label-width="100px">-->
<!--              <el-select v-model="form.billType" placeholder="请选择盘点类型"-->
<!--                         :disabled="true"-->
<!--                         clearable style="width: 150px">-->
<!--                <el-option v-for="dict in dict.type.bill_type"-->
<!--                           :key="dict.value"-->
<!--                           :label="dict.label"-->
<!--                           :value="dict.value"-->
<!--                />-->
<!--              </el-select>-->
<!--            </el-form-item>-->
<!--          </el-col>-->
          <el-col :span="4">
            <el-form-item label="盘点日期" prop="billDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.billDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择盘点日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="80px">
              <SelectWarehouse v-model="form.warehouseId"/>
            </el-form-item>

          </el-col>
<!--          <el-col :span="4">-->
<!--            <el-form-item label="科室" prop="departmentId" label-width="100px">-->
<!--              <SelectDepartment v-model="form.departmentId"/>-->
<!--            </el-form-item>-->

<!--          </el-col>-->
          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
<!--              <SelectUser v-model="form.userId"/>-->
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

        </el-row>
        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>盘点明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
  <!--            <el-button type="primary" icon="el-icon-plus" size="mini" @click="handleAddStkIoBillEntry">添加</el-button>-->
              <el-button type="primary" icon="el-icon-plus" size="mini" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteStkIoBillEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  @selection-change="handleStkIoBillEntrySelectionChange"
                  ref="stkIoBillEntry" height="calc(42vh)" border
        >
          <el-table-column type="selection" width="50" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
<!--              <SelectMaterial v-model="scope.row.materialId" :disabled="isShow" />-->
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow" />
            </template>
          </el-table-column>

          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.qty" type='number' @input="qtyChange(scope.row)" placeholder="请输入数量" />
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
<!--              <el-input v-model="scope.row.unitPrice" placeholder="请输入单价" />-->
              <el-input v-model="scope.row.unitPrice" type='number' :disabled="true"
                        @input="priceChange(scope.row)" placeholder="请输入单价" />
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="请输入批次号" />
            </template>
          </el-table-column>

          <el-table-column label="批号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" label-width="200px" placeholder="请输入批号" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="beginTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择盘点日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择盘点日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="400" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
            </el-form>
            <div class="modal-footer" v-show="action">
              <el-button @click="cancel">取 消</el-button>
              <el-button type="primary" @click="submitForm">确 定</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 3、使用组件 -->
    <SelectInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectInventory>

  </div>
</template>

<script>
import { listOutWarehouse, getOutWarehouse, delOutWarehouse, addOutWarehouse, updateOutWarehouse } from "@/api/warehouse/outWarehouse";
import { listInventoryMaterialAll } from "@/api/warehouse/inventory";
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectUser from '@/components/SelectModel/SelectUser';

import SelectInventory from '@/components/SelectModel/SelectInventory';

export default {
  name: "Warehouse",
  dicts: ['biz_status','bill_type'],
  components: {SelectMaterial,SelectWarehouse,SelectDepartment,SelectUser,SelectInventory},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoBillEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 盘点表格数据
      warehouseList: [],
      selectRow: [],
      // 盘点明细表格数据
      stkIoBillEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      //是否显示
      action: true,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        billNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        billDate: [
          { required: true, message: "盘点日期不能为空", trigger: "blur" }
        ],
        warehouseId: [
          { required: true, message: "仓库ID不能为空", trigger: "blur" }
        ],
        departmentId: [
          { required: true, message: "科室ID不能为空", trigger: "blur" }
        ],
        billType: [
          { required: true, message: "盘点类型不能为空", trigger: "change" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询盘点列表 */
    getList() {
      this.loading = true;
      this.queryParams.billStatus = "1";
      this.queryParams.billType = "201";
      listOutWarehouse(this.queryParams).then(response => {
        this.warehouseList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    nameBtn() {
      if(!this.form.warehouseId) {
        this.$message({ message: '请先选择仓库', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.warehouseValue = this.form.warehouseId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
        this.stkIoBillEntryList.splice(this.stkIoBillEntryList.length, 0, JSON.parse(JSON.stringify(item)));
      });
    },
    //当天日期
    getBillDate(){
      let now = new Date();
      let year = now.getFullYear();
      let month = now.getMonth() + 1;
      let day = now.getDate();
      return year + "-" + month + "-" + day;
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
        billNo: null,
        supplerId: null,
        billDate: null,
        warehouseId: null,
        departmentId: null,
        billStatus: null,
        userId: null,
        billType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.stkIoBillEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.unitPrice){
        totalAmt = row.qty * row.unitPrice;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
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
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 查看按钮操作 */
    handleView(row){
      const id = row.id
      getOutWarehouse(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = false;
        this.form.billStatus = '1';
        this.form.billType = '201';
        this.title = "查看盘点";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.billStatus = '1';
      this.form.billType = '201';
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.billDate = this.getBillDate();
      this.title = "添加盘点";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getOutWarehouse(id).then(response => {
        this.form = response.data;
        this.form.billStatus = '1';
        this.form.billType = '201';
        this.stkIoBillEntryList = response.data.stkIoBillEntryList;
        this.open = true;
        this.action = true;
        this.title = "修改盘点";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.stkIoBillEntryList = this.stkIoBillEntryList;
          if (this.form.id != null) {
            updateOutWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addOutWarehouse(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除盘点编号为"' + ids + '"的数据项？').then(function() {
        return delOutWarehouse(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 盘点明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 盘点明细添加按钮操作 */
    handleAddStkIoBillEntry() {
      let obj = {};
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.andTime = "";
      obj.remark = "";

      this.stkIoBillEntryList.push(obj);
    },
    /** 盘点明细删除按钮操作 */
    handleDeleteStkIoBillEntry() {
      if (this.checkedStkIoBillEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的盘点明细数据");
      } else {
        const stkIoBillEntryList = this.stkIoBillEntryList;
        const checkedStkIoBillEntry = this.checkedStkIoBillEntry;
        this.stkIoBillEntryList = stkIoBillEntryList.filter(function(item) {
          return checkedStkIoBillEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleStkIoBillEntrySelectionChange(selection) {
      this.checkedStkIoBillEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/warehouse/export', {
        ...this.queryParams
      }, `warehouse_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 - 占满整个遮罩层 */
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 1000;
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

.modal-footer {
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  text-align: right;
  flex-shrink: 0;
}

.modal-footer .el-button {
  margin-left: 10px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
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

/* 表格样式优化 */
.el-table {
  border-radius: 4px;
  overflow: hidden;
}

.el-table th {
  background-color: #F5F7FA !important;
  color: #606266 !important;
  font-weight: 600 !important;
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table td {
  border-right: 1px solid #EBEEF5 !important;
  border-bottom: 1px solid #EBEEF5 !important;
}

.el-table .cell {
  padding: 0 8px;
  line-height: 1.5;
}

/* 表单样式优化 */
.el-form-item {
  margin-bottom: 18px;
}

.el-form-item__label {
  color: #606266;
  font-weight: 500;
}
</style>
