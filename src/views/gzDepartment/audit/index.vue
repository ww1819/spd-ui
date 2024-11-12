<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="申领单号" prop="applyBillNo" label-width="100px">
            <el-input
              v-model="queryParams.applyBillNo"
              placeholder="请输入申领单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="申请日期" prop="applyBillDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.applyBillDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择申请日期">
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

    <el-table v-loading="loading" :data="applyList" @selection-change="handleSelectionChange">
      <el-table-column label="申领单号" align="center" prop="applyBillNo" >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.applyBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="申请日期" align="center" prop="applyBillDate" width="180">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.applyBillDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" />
      <el-table-column label="操作人" align="center" prop="user.userName" />
      <el-table-column label="申请状态" align="center" prop="applyBillStatus" >
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.applyBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width">
        <template slot-scope="scope">
          <el-dropdown v-if="scope.row.applyBillStatus != 2">
            <el-button type="primary">
              更多操作<i class="el-icon-arrow-down el-icon--right"></i>
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="handleUpdate(scope.row)"
                                v-hasPermi="['gzDepartment:apply:edit']"
              >修改</el-dropdown-item>

              <el-dropdown-item @click.native="handleAudit(scope.row)"
                                v-hasPermi="['gzDepartment:apply:audit']"
              >审核</el-dropdown-item>

              <el-dropdown-item @click.native="handleDelete(scope.row)"
                                v-hasPermi="['gzDepartment:apply:remove']"
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

    <!-- 添加或修改高值科室申领对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="1600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="4">
            <el-form-item label="申领状态" prop="billStatus" label-width="100px">
              <el-select v-model="form.applyBillStatus" placeholder="请选择申领状态"
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
            <el-form-item label="申请日期" prop="applyBillDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.applyBillDate"
                              type="date"
                              style="width: 150px"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
                              placeholder="请选择申请日期">
              </el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="form.warehouseId"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="userId" label-width="100px">
              <SelectUser v-model="form.userId"/>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>高值科室申领明细信息</span>
          </el-col>
          <div v-show="action">
            <el-col :span="1.5">
              <el-button type="primary" icon="el-icon-plus" size="mini" @click="nameBtn">添加</el-button>
            </el-col>
            <el-col :span="1.5">
              <el-button type="danger" icon="el-icon-delete" size="mini" @click="handleDeleteGzDepApplyEntry">删除</el-button>
            </el-col>
          </div>

        </el-row>

        <el-table :data="gzDepApplyEntryList" :row-class-name="rowGzDepApplyEntryIndex"
                  @selection-change="handleGzDepApplyEntrySelectionChange"
                  ref="gzDepApplyEntry">
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="耗材" prop="materialId" width="150">
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="true"/>
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="qty" width="150">
            <template slot-scope="scope">
              <el-input clearable v-model="scope.row.qty" placeholder="请输入数量"
                        onkeyup="value=value.replace(/\D/g,'')"
                        onafterpaste="value=value.replace(/\D/g,'')"
                        @blur="form.result=$event.target.value"
                        @input="qtyChange(scope.row)"
              />
            </template>
          </el-table-column>

          <el-table-column label="单价" prop="unitPrice" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" type='number' @input="priceChange(scope.row)" placeholder="请输入单价" />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="amt" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.amt" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>

          <el-table-column label="批次号" prop="batchNo" width="450">
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNo" :disabled="true" label-width="200px" placeholder="请输入批次号" />
            </template>
          </el-table-column>


          <el-table-column label="批号" prop="batchNumer" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.batchNumer" placeholder="请输入批号" />
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="150">
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
      <div slot="footer" v-show="action" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>

    <!-- 3、使用组件 -->
    <SelectGzDepotInventory
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      :warehouseValue="warehouseValue"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectGzDepotInventory>
  </div>
</template>

<script>
import { listApply, getApply, delApply, addApply, updateApply,auditApply } from "@/api/gzDepartment/apply";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectGzDepotInventory from '@/components/SelectModel/SelectGzDepotInventory';

export default {
  name: "GZDepartmentAudit",
  dicts: ['biz_status'],
  components: {SelectWarehouse,SelectUser,SelectGzDepotInventory},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      warehouseValue: "",
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedGzDepApplyEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 高值科室申领表格数据
      applyList: [],
      // 高值科室申领明细表格数据
      gzDepApplyEntryList: [],
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
        applyBillNo: null,
        applyBillDate: null,
        warehouseId: null,
        userId: null,
        applyBillStatus: null,
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
    /** 查询高值科室申领列表 */
    getList() {
      this.loading = true;
      listApply(this.queryParams).then(response => {
        this.applyList = response.rows;
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
        this.gzDepApplyEntryList.splice(this.gzDepApplyEntryList.length, 0, JSON.parse(JSON.stringify(item)));
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
        applyBillNo: null,
        applyBillDate: null,
        warehouseId: null,
        userId: null,
        applyBillStatus: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.gzDepApplyEntryList = [];
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
      getApply(id).then(response => {
        this.form = response.data;
        this.gzDepApplyEntryList = response.data.gzDepApplyEntryList;
        this.open = true;
        this.action = false;

        if(response.data.applyBillStatus == 1){
          this.form.applyBillStatus = '1';
        }else{
          this.form.applyBillStatus = '2';
        }

        this.title = "查看科室申领";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.action = true;
      this.title = "添加高值科室申领";
      this.form.applyBillStatus = '1';
      this.form.applyBillDate = this.getBillDate();
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getApply(id).then(response => {
        this.form = response.data;
        this.gzDepApplyEntryList = response.data.gzDepApplyEntryList;
        this.open = true;
        this.action = true;
        this.form.applyBillStatus = '1';
        this.title = "修改高值科室申领";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.gzDepApplyEntryList = this.gzDepApplyEntryList;
          if (this.form.id != null) {
            updateApply(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addApply(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      this.reset();
      const id = row.id || this.ids

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(function () {
        return auditApply({id: id});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核入库成功！");
      }).catch(() => {
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除高值科室申领编号为"' + ids + '"的数据项？').then(function() {
        return delApply(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
	/** 高值科室申领明细序号 */
    rowGzDepApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 高值科室申领明细添加按钮操作 */
    handleAddGzDepApplyEntry() {
      let obj = {};
      obj.materialId = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.price = "";
      obj.amt = "";
      obj.batchNo = "";
      obj.batchNumer = "";
      obj.remark = "";
      this.gzDepApplyEntryList.push(obj);
    },
    /** 高值科室申领明细删除按钮操作 */
    handleDeleteGzDepApplyEntry() {
      if (this.checkedGzDepApplyEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的高值科室申领明细数据");
      } else {
        const gzDepApplyEntryList = this.gzDepApplyEntryList;
        const checkedGzDepApplyEntry = this.checkedGzDepApplyEntry;
        this.gzDepApplyEntryList = gzDepApplyEntryList.filter(function(item) {
          return checkedGzDepApplyEntry.indexOf(item.index) == -1
        });
      }
    },
    /** 复选框选中数据 */
    handleGzDepApplyEntrySelectionChange(selection) {
      this.checkedGzDepApplyEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('gzDepartment/apply/export', {
        ...this.queryParams
      }, `apply_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
