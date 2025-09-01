<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="业务单号" prop="stockNo" label-width="100px">
            <el-input v-model="queryParams.stockNo"
                      placeholder="请输入业务单号"
                      clearable
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="制单日期" prop="stockDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.stockDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择制单日期">
            </el-date-picker>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId"/>
          </el-form-item>
        </el-col>

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
          v-hasPermi="['stocktaking:in:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="mini"
          @click="handleExport"
          v-hasPermi="['stocktaking:in:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="inList" @selection-change="handleSelectionChange" height="54vh" border>
      <el-table-column label="业务单号" align="center" prop="stockNo" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="制单日期" align="center" prop="stockDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="单据状态" align="center" prop="stockStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="操作人" align="center" prop="createBy" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="盘点类型" align="center" prop="stockType" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.stockType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-dropdown v-if="scope.row.stockStatus != 2">
            <el-button type="primary">
              更多操作<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleUpdate(scope.row)"
                                v-hasPermi="['stocktaking:in:edit']"
              >修改</el-dropdown-item>

              <el-dropdown-item @click.native="handleAudit(scope.row)"
                                v-hasPermi="['stocktaking:in:audit']"
              >审核</el-dropdown-item>

              <el-dropdown-item @click.native="handleDelete(scope.row)"
                                v-hasPermi="['stocktaking:in:remove']"
              >删除</el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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
            <el-form-item label="单据状态" prop="stockStatus" label-width="100px">
              <el-select v-model="form.stockStatus" placeholder="请选择单据状态"
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
          <el-col :span="4">
            <el-form-item label="供应商" prop="supplerId" label-width="100px">
              <SelectSupplier v-model="form.supplerId" :disabled="true" />
            </el-form-item>

          </el-col>
          <el-col :span="4">
            <el-form-item label="制单日期" prop="stockDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.stockDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择制单日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="form.warehouseId"/>
            </el-form-item>

          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="盘点类型" prop="stockType" label-width="100px">
              <el-select v-model="form.stockType" placeholder="请选择盘点类型"
                         :disabled="true"
                         clearable style="width: 150px">
                <el-option v-for="dict in dict.type.bill_type"
                           :key="dict.value"
                           :label="dict.label"
                           :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>盘点明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="mini" @click="checkMaterialBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteStkIoStocktakingEntry">删除</el-button>
            </el-col>
          </div>
        </el-row>

        <el-table :data="stkIoStocktakingEntryList" :row-class-name="rowStkIoStocktakingEntryIndex" @selection-change="handleStkIoStocktakingEntrySelectionChange" ref="stkIoStocktakingEntry" height="calc(42vh)" border>
          <el-table-column type="selection" width="50" align="center" resizable />
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow"/>
            </template>
          </el-table-column>

          <el-table-column label="数量" prop="qty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="请输入数量"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="价格" prop="price" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.price" type='number' @input="priceChange(scope.row)" placeholder="请输入价格" />
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>

          <el-table-column label="批次号" prop="batchNo" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" label-width="200px" placeholder="请输入批次号" />
            </template>
          </el-table-column>

          <el-table-column label="批号" prop="batchNumber" width="240" show-overflow-tooltip resizable>
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
                              placeholder="请选择出库日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="endTime" width="240" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.endTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择出库日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
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
    <SelectMaterialFilter
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :supplierValue="supplierValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialFilter>
  </div>
</template>

<script>
import { listStocktaking, getStocktaking, delStocktaking, addStocktaking, updateStocktaking,auditStocktaking } from "@/api/warehouse/stocktaking";
import SelectSupplier from "@/components/SelectModel/SelectSupplier";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectMaterialFilter from "@/components/SelectModel/SelectMaterialFilter";

export default {
  name: "InStocktaking",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectDepartment,SelectMaterialFilter},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      supplierValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedStkIoStocktakingEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 盘点表格数据
      inList: [],
      // 盘点明细表格数据
      stkIoStocktakingEntryList: [],
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
        stockNo: null,
        supplerId: null,
        stockDate: null,
        warehouseId: null,
        departmentId: null,
        stockStatus: null,
        userId: null,
        stockType: null,
        auditDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        stockDate: [
          { required: true, message: "业务日期不能为空", trigger: "blur" }
        ],
        stockStatus: [
          { required: true, message: "单据状态不能为空", trigger: "change" }
        ],
        supplerId: [
          { required: true, message: "供应商不能为空", trigger: "change" }
        ],
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "change" }
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
      this.queryParams.stockType = "501";
      listStocktaking(this.queryParams).then(response => {
        this.inList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    checkMaterialBtn() {
      if(!this.form.supplerId) {
        this.$message({ message: '请先选择供应商', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.supplierValue = this.form.supplerId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
        let obj = {};
        obj.materialId = item.id;
        obj.qty = "";
        obj.price = "";
        obj.amt = "";
        obj.batchNo = "";
        obj.batchNumber = "";
        obj.beginTime = "";
        obj.endTime = "";
        obj.remark = "";

        this.stkIoStocktakingEntryList.push(obj);
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
        stockNo: null,
        supplerId: null,
        stockDate: null,
        warehouseId: null,
        departmentId: null,
        stockStatus: null,
        userId: null,
        stockType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.stkIoStocktakingEntryList = [];
      this.resetForm("form");
    },
    //数量改变事件
    qtyChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
      }else{
        totalAmt = 0;
      }
      row.amt = totalAmt.toFixed(2);
    },
    //价格改变事件
    priceChange(row){
      let totalAmt = 0;
      if(row.qty && row.price){
        totalAmt = row.qty * row.price;
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
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加盘点";
      this.form.stockStatus = '1';
      this.form.stockType = '501';
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.stockDate = this.getBillDate();
      this.action = true;
    },
    /** 查看按钮操作 */
    handleView(row){

      const id = row.id
      getStocktaking(id).then(response => {
        this.form = response.data;
        this.stkIoStocktakingEntryList = response.data.stkIoStocktakingEntryList;
        this.open = true;
        this.action = false;
        this.form.stockStatus = '1';
        this.form.stockType = '501';
        this.title = "查看盘点";
      });

    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(function() {
        return auditStocktaking({id:id});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功！");
      }).catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getStocktaking(id).then(response => {
        this.form = response.data;
        this.stkIoStocktakingEntryList = response.data.stkIoStocktakingEntryList;
        this.open = true;
        this.title = "修改盘点";
        this.form.stockStatus = '1';
        this.form.stockType = '501';
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.stkIoStocktakingEntryList = this.stkIoStocktakingEntryList;
          if (this.form.id != null) {
            updateStocktaking(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addStocktaking(this.form).then(response => {
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
        return delStocktaking(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 盘点明细序号 */
    rowStkIoStocktakingEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 盘点明细添加按钮操作 */
    handleAddStkIoStocktakingEntry() {
      let obj = {};
      obj.commodityId = "";
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.endTime = "";
      obj.remark = "";
      this.stkIoStocktakingEntryList.push(obj);
    },
    /** 盘点明细删除按钮操作 */
    handleDeleteStkIoStocktakingEntry() {
      if (this.checkedStkIoStocktakingEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的盘点明细数据");
      } else {
        const stkIoStocktakingEntryList = this.stkIoStocktakingEntryList;
        const checkedStkIoStocktakingEntry = this.checkedStkIoStocktakingEntry;
        this.stkIoStocktakingEntryList = stkIoStocktakingEntryList.filter(function(item) {
          return checkedStkIoStocktakingEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleStkIoStocktakingEntrySelectionChange(selection) {
      this.checkedStkIoStocktakingEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('stocktaking/in/export', {
        ...this.queryParams
      }, `in_${new Date().getTime()}.xlsx`)
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
