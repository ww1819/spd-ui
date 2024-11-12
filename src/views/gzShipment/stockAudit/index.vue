<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="退库单号" prop="stockNo" label-width="100px">
            <el-input v-model="queryParams.stockNo"
                      placeholder="请输入退库单号"
                      clearable
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="退库日期" prop="stockDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.stockDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择退库日期">
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

    <el-table v-loading="loading" :data="stockList" @selection-change="handleSelectionChange">
      <el-table-column label="退库单号" align="center" prop="stockNo" width="180">
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.stockNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="退库日期" align="center" prop="stockDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.stockDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" />
      <el-table-column label="科室" align="center" prop="department.name" />
      <el-table-column label="单据状态" align="center" prop="stockStatus">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.stockStatus"/>
        </template>
      </el-table-column>

      <el-table-column label="操作人" align="center" prop="createBy" />
      <el-table-column label="退库类型" align="center" prop="stockType" >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.stockType"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />

      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-dropdown v-if="scope.row.stockStatus != 2">
            <el-button type="primary">
              更多操作<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleUpdate(scope.row)"
                                v-hasPermi="['gzShipment:stockApply:edit']"
              >修改</el-dropdown-item>

              <el-dropdown-item @click.native="handleAudit(scope.row)"
                                v-hasPermi="['gzShipment:stockApply:audit']"
              >审核</el-dropdown-item>

              <el-dropdown-item @click.native="handleDelete(scope.row)"
                                v-hasPermi="['gzShipment:stockApply:remove']"
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

    <!-- 添加或修改高值退库对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1600px" append-to-body>
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
            <el-form-item label="科室" prop="departmentId" label-width="100px">
              <SelectDepartment v-model="form.departmentId"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="80px">
              <SelectWarehouse v-model="form.warehouseId"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="退库类型" prop="stockType" label-width="100px">
              <el-select v-model="form.stockType" placeholder="请选择退库类型"
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

          <el-col :span="4">
            <el-form-item label="退库日期" prop="stockDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.stockDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择退库日期">
              </el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>高值退货明细信息</span>
          </el-col>

          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="mini" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteGzRefundStockEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>
        <el-table :data="gzRefundStockEntryList" :row-class-name="rowGzRefundStockEntryIndex"
                  @selection-change="handleGzRefundStockEntrySelectionChange"
                  ref="gzRefundStockEntry">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="耗材" prop="materialId" width="120">
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow" />
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="120">
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="请输入数量"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="unitPrice" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" type='number' :disabled="true"
                        @input="priceChange(scope.row)" placeholder="请输入单价" />
            </template>
          </el-table-column>

          <el-table-column label="金额" prop="amt" width="120">
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="批次号" prop="batchNo" width="240">
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" placeholder="请输入批次号" />
            </template>
          </el-table-column>

          <el-table-column label="批号" prop="batchNo" width="240">
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumber" label-width="200px" placeholder="请输入批号" />
            </template>
          </el-table-column>
          <el-table-column label="生产日期" prop="batchNo" width="240">
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.beginTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择退库日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="有效期" prop="batchNo" width="240">
            <template slot-scope="scope">
              <el-date-picker clearable
                              v-model="scope.row.andTime"
                              type="date"
                              value-format="yyyy-MM-dd"
                              placeholder="请选择退库日期">
              </el-date-picker>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="400">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 3、使用组件 -->
    <SelectGzDepInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :departmentValue="departmentValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGzDepInventory>
  </div>
</template>

<script>
import { listStock, getStock, delStock, addStock, updateStock,auditStock } from "@/api/gz/stock";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectGzDepInventory from "@/components/SelectModel/SelectGzDepInventory";

export default {
  name: "StockAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectMaterial,SelectWarehouse,SelectDepartment,SelectGzDepInventory},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      departmentValue: "",
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedGzRefundStockEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 高值退库表格数据
      stockList: [],
      // 高值退货明细表格数据
      gzRefundStockEntryList: [],
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
        departmentId: null,
        stockDate: null,
        warehouseId: null,
        stockStatus: null,
        stockType: null,
        auditDate: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询高值退库列表 */
    getList() {
      this.loading = true;
      this.queryParams.stockStatus = "1";
      listStock(this.queryParams).then(response => {
        this.stockList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    nameBtn() {
      if(!this.form.departmentId) {
        this.$message({ message: '请先选择科室', type: 'warning' })
        return
      }

      //打开“弹窗组件”
      this.DialogComponentShow = true
      this.departmentValue = this.form.departmentId;
    },
    closeDialog() {
      //关闭“弹窗组件”
      this.DialogComponentShow = false
    },
    selectData(val) {
      //监听“弹窗组件”返回的数据
      this.selectRow = val;

      this.selectRow.forEach((item, index) => {
        this.gzRefundStockEntryList.splice(this.gzRefundStockEntryList.length, 0, JSON.parse(JSON.stringify(item)));
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
        departmentId: null,
        stockDate: null,
        warehouseId: null,
        stockStatus: null,
        stockType: null,
        delFlag: null,
        auditDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.gzRefundStockEntryList = [];
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
      getStock(id).then(response => {
        this.form = response.data;
        this.gzRefundStockEntryList = response.data.gzRefundStockEntryList;
        this.open = true;
        this.action = false;
        this.form.stockStatus = '1';
        this.form.stockType = '401';
        this.title = "查看高值退库";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.stockStatus = '1';
      this.form.stockType = '401';
      //操作人
      var userName = this.$store.state.user.name;
      this.form.createBy = userName;
      this.form.stockDate = this.getBillDate();
      this.title = "添加高值退库";
      this.action = true;
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(function() {
        return auditStock({id:id});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核退库成功！");
      }).catch(() => {});

    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getStock(id).then(response => {
        this.form = response.data;
        this.gzRefundStockEntryList = response.data.gzRefundStockEntryList;
        this.open = true;
        this.title = "修改高值退库";
        this.form.stockStatus = '1';
        this.form.stockType = '401';
        this.action = true;
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzRefundStockEntryList = this.gzRefundStockEntryList;
          if (this.form.id != null) {
            updateStock(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addStock(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除高值退库编号为"' + ids + '"的数据项？').then(function() {
        return delStock(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 高值退货明细序号 */
    rowGzRefundStockEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 高值退货明细添加按钮操作 */
    handleAddGzRefundStockEntry() {
      let obj = {};
      obj.materialId = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumber = "";
      obj.beginTime = "";
      obj.andTime = "";
      obj.remark = "";
      this.gzRefundStockEntryList.push(obj);
    },
    /** 高值退货明细删除按钮操作 */
    handleDeleteGzRefundStockEntry() {
      if (this.checkedGzRefundStockEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值退货明细数据");
      } else {
        const gzRefundStockEntryList = this.gzRefundStockEntryList;
        const checkedGzRefundStockEntry = this.checkedGzRefundStockEntry;
        this.gzRefundStockEntryList = gzRefundStockEntryList.filter(function(item) {
          return checkedGzRefundStockEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleGzRefundStockEntrySelectionChange(selection) {
      this.checkedGzRefundStockEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('gz/stock/export', {
        ...this.queryParams
      }, `stock_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
