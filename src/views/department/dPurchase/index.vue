<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="申购单号" prop="purchaseBillNo" label-width="100px">
            <el-input
              v-model="queryParams.purchaseBillNo"
              placeholder="请输入申购单号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="申请日期" prop="purchaseBillDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.purchaseBillDate"
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
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
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
          size="small"
          @click="handleAdd"
          v-hasPermi="['department:purchase:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['department:purchase:export']"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="purchaseList" @selection-change="handleSelectionChange" height="54vh" border>
      <el-table-column label="申购单号" align="center" prop="purchaseBillNo" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.purchaseBillNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="申请日期" align="center" prop="purchaseBillDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.purchaseBillDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="科室" align="center" prop="department.name" show-overflow-tooltip resizable />
      <el-table-column label="操作人" align="center" prop="user.userName" show-overflow-tooltip resizable />
      <el-table-column label="申购状态" align="center" prop="purchaseBillStatus" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.purchase_status" :value="scope.row.purchaseBillStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="紧急程度" align="center" prop="urgencyLevel" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.urgency_level" :value="scope.row.urgencyLevel"/>
        </template>
      </el-table-column>
      <el-table-column label="总金额" align="center" prop="totalAmount" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>¥{{ scope.row.totalAmount }}</span>
        </template>
      </el-table-column>
      <el-table-column label="期望到货日期" align="center" prop="expectedDeliveryDate" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.expectedDeliveryDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['department:purchase:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['department:purchase:remove']"
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

    <!-- 添加或修改科室申购对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="cancel" class="close-btn"></el-button>
            </div>
            <el-form ref="form" :model="form" :rules="rules" label-width="80px">
              <el-row>
                <el-col :span="4">
                  <el-form-item label="申购状态" prop="purchaseBillStatus" label-width="100px">
                    <el-select v-model="form.purchaseBillStatus" placeholder="请选择申购状态"
                               :disabled="true"
                               clearable style="width: 150px">
                      <el-option v-for="dict in dict.type.purchase_status"
                                 :key="dict.value"
                                 :label="dict.label"
                                 :value="dict.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="仓库" prop="warehouseId" label-width="100px">
                    <SelectWarehouse v-model="form.warehouseId"/>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="申请日期" prop="purchaseBillDate" label-width="100px">
                    <el-date-picker clearable
                                    v-model="form.purchaseBillDate"
                                    type="date"
                                    style="width: 150px"
                                    value-format="yyyy-MM-dd"
                                    :disabled="true"
                                    placeholder="请选择申请日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="操作人" prop="userId" label-width="100px">
                    <SelectUser v-model="form.userId"/>
                  </el-form-item>
                </el-col>

                <el-col :span="4">
                  <el-form-item label="紧急程度" prop="urgencyLevel" label-width="100px">
                    <el-select v-model="form.urgencyLevel" placeholder="请选择紧急程度"
                               clearable style="width: 150px">
                      <el-option v-for="dict in dict.type.urgency_level"
                                 :key="dict.value"
                                 :label="dict.label"
                                 :value="dict.value"
                      />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row>
                <el-col :span="4">
                  <el-form-item label="期望到货日期" prop="expectedDeliveryDate" label-width="100px">
                    <el-date-picker clearable
                                    v-model="form.expectedDeliveryDate"
                                    type="date"
                                    style="width: 150px"
                                    value-format="yyyy-MM-dd"
                                    placeholder="请选择期望到货日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>科室申购明细信息</span>
                </el-col>

                <div v-show="action">
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="small" @click="addMaterialRow">添加耗材</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="small" @click="handleDeleteDepPurchaseApplyEntry">删除</el-button>
                  </el-col>
                </div>
              </el-row>

              <el-table :data="depPurchaseApplyEntryList" :row-class-name="rowDepPurchaseApplyEntryIndex" @selection-change="handleDepPurchaseApplyEntrySelectionChange" ref="depPurchaseApplyEntry" height="calc(42vh)" border>
                <el-table-column type="selection" width="50" align="center" resizable />
                <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
                <el-table-column label="耗材" prop="materialId" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <div v-if="scope.row.materialName">
                      <span>{{ scope.row.materialName }}</span>
                      <el-button type="text" size="small" @click="clearMaterial(scope.row)" style="margin-left: 5px;">清除</el-button>
                    </div>
                    <el-button v-else type="primary" size="small" @click="selectMaterial(scope.row)">选择耗材</el-button>
                  </template>
                </el-table-column>
                <el-table-column label="规格型号" prop="materialSpec" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.materialSpec }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" prop="unit" width="80" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.unit }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="申购数量" prop="qty" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input clearable v-model="scope.row.qty" placeholder="请输入申购数量"
                              type="number"
                              @input="qtyChange(scope.row)"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="预估单价" prop="unitPrice" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.unitPrice" type='number' @input="priceChange(scope.row)" placeholder="请输入预估单价" />
                  </template>
                </el-table-column>
                <el-table-column label="预估金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.amt" :disabled="true" placeholder="预估金额" />
                  </template>
                </el-table-column>
                <el-table-column label="品牌" prop="brand" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.brand }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="建议供应商" prop="supplierName" width="150" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.supplierName }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="申购理由" prop="reason" width="200" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.reason" type="textarea" :rows="2" placeholder="请输入申购理由" />
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" width="150" show-overflow-tooltip resizable>
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

    <!-- 耗材选择组件 -->
    <SelectMaterialForPurchase
      v-if="DialogComponentShow"
      :DialogComponentShow="DialogComponentShow"
      @closeDialog="closeDialog"
      @selectData="selectData"
    ></SelectMaterialForPurchase>
  </div>
</template>

<script>
import { listPurchase, getPurchase, delPurchase, addPurchase, updatePurchase } from "@/api/department/purchase";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectUser from '@/components/SelectModel/SelectUser';
import SelectMaterialForPurchase from '@/components/SelectModel/SelectMaterialForPurchase';

export default {
  name: "dPurchase",
  dicts: ['purchase_status', 'urgency_level'],
  components: {SelectWarehouse, SelectUser, SelectMaterialForPurchase},
  data() {
    return {
      // 遮罩层
      loading: true,
      DialogComponentShow: false,
      currentRow: null, // 当前选择耗材的行
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedDepPurchaseApplyEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 科室申购表格数据
      purchaseList: [],
      // 科室申购明细表格数据
      depPurchaseApplyEntryList: [],
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
        purchaseBillNo: null,
        purchaseBillDate: null,
        warehouseId: null,
        userId: null,
        purchaseBillStatus: null,
        urgencyLevel: null,
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        warehouseId: [
          { required: true, message: "仓库不能为空", trigger: "blur" }
        ],
        urgencyLevel: [
          { required: true, message: "紧急程度不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询科室申购列表 */
    getList() {
      this.loading = true;
      this.queryParams.purchaseBillStatus = "1";
      listPurchase(this.queryParams).then(response => {
        this.purchaseList = response.rows;
        this.total = response.total;
        this.loading = false;
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
        purchaseBillNo: null,
        purchaseBillDate: null,
        warehouseId: null,
        departmentId: null,
        userId: null,
        purchaseBillStatus: null,
        totalAmount: null,
        urgencyLevel: null,
        expectedDeliveryDate: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        remark: null
      };
      this.depPurchaseApplyEntryList = [];
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
      this.calculateTotalAmount();
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
      this.calculateTotalAmount();
    },
    //计算总金额
    calculateTotalAmount(){
      let total = 0;
      this.depPurchaseApplyEntryList.forEach(item => {
        if(item.amt){
          total += parseFloat(item.amt);
        }
      });
      this.form.totalAmount = total.toFixed(2);
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
      getPurchase(id).then(response => {
        this.form = response.data;
        this.depPurchaseApplyEntryList = response.data.depPurchaseApplyEntryList;
        this.open = true;
        this.action = false;

        if(response.data.purchaseBillStatus == 1){
          this.form.purchaseBillStatus = '1';
        }else if(response.data.purchaseBillStatus == 2){
          this.form.purchaseBillStatus = '2';
        }else{
          this.form.purchaseBillStatus = '3';
        }

        this.title = "查看科室申购";
      });
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.form.purchaseBillStatus = '1';
      this.form.purchaseBillDate = this.getBillDate();
      this.form.urgencyLevel = '1';
      this.title = "添加科室申购";
      this.action = true;
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids
      getPurchase(id).then(response => {
        this.form = response.data;
        this.depPurchaseApplyEntryList = response.data.depPurchaseApplyEntryList;
        this.open = true;
        this.action = true;
        this.form.purchaseBillStatus = '1';
        this.title = "修改科室申购";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          this.form.depPurchaseApplyEntryList = this.depPurchaseApplyEntryList;
          if (this.form.id != null) {
            updatePurchase(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addPurchase(this.form).then(response => {
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
      this.$modal.confirm('是否确认删除科室申购编号为"' + ids + '"的数据项？').then(function() {
        return delPurchase(ids);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 科室申购明细序号 */
    rowDepPurchaseApplyEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 科室申购明细添加按钮操作 */
    handleAddDepPurchaseApplyEntry() {
      let obj = {};
      obj.materialId = null;
      obj.materialName = "";
      obj.materialSpec = "";
      obj.unit = "";
      obj.unitPrice = "";
      obj.qty = "";
      obj.amt = "";
      obj.reason = "";
      obj.supplierName = "";
      obj.brand = "";
      obj.model = "";
      obj.remark = "";
      this.depPurchaseApplyEntryList.push(obj);
    },
    /** 添加耗材行 */
    addMaterialRow() {
      this.currentRow = null; // 标记为批量添加
      this.DialogComponentShow = true;
    },
    /** 选择耗材 */
    selectMaterial(row) {
      this.currentRow = row;
      this.DialogComponentShow = true;
    },
    /** 清除耗材 */
    clearMaterial(row) {
      row.materialId = null;
      row.materialName = "";
      row.materialSpec = "";
      row.unit = "";
      row.unitPrice = "";
      row.brand = "";
      row.supplierName = "";
      row.model = "";
      row.qty = "";
      row.amt = "";
      this.calculateTotalAmount();
    },
    /** 关闭选择耗材弹窗 */
    closeDialog() {
      this.DialogComponentShow = false;
      this.currentRow = null;
    },
    /** 处理选择的耗材数据 */
    selectData(val) {
      if (val && val.length > 0) {
        if (this.currentRow) {
          // 单行修改模式
          const material = val[0]; // 只取第一个选择的耗材
          this.fillMaterialData(this.currentRow, material);
        } else {
          // 批量添加模式
          val.forEach(material => {
            let obj = {};
            this.fillMaterialData(obj, material);
            this.depPurchaseApplyEntryList.push(obj);
          });
        }
      }
      this.closeDialog();
    },
    /** 填充耗材数据到行 */
    fillMaterialData(row, material) {
      row.materialId = material.id;
      row.materialName = material.name;
      row.materialSpec = material.speci || '';
      row.unit = material.unit ? material.unit.name : '';
      row.unitPrice = material.prince || '';
      row.brand = material.brand || '';
      row.supplierName = material.supplier ? material.supplier.name : '';
      row.model = material.model || '';
      row.qty = row.qty || '';
      row.amt = row.amt || '';
      row.reason = row.reason || '';
      row.remark = row.remark || '';
      
      // 如果有数量，自动计算金额
      if (row.qty && row.unitPrice) {
        this.qtyChange(row);
      }
    },
    /** 科室申购明细删除按钮操作 */
    handleDeleteDepPurchaseApplyEntry() {
      if (this.checkedDepPurchaseApplyEntry.length == 0) {
        this.$modal.msgError("请先选择要删除的科室申购明细数据");
      } else {
        const depPurchaseApplyEntryList = this.depPurchaseApplyEntryList;
        const checkedDepPurchaseApplyEntry = this.checkedDepPurchaseApplyEntry;
        this.depPurchaseApplyEntryList = depPurchaseApplyEntryList.filter(function(item) {
          return checkedDepPurchaseApplyEntry.indexOf(item.index) == -1
        });
        this.calculateTotalAmount();
      }
    },
    /** 复选框选中数据 */
    handleDepPurchaseApplyEntrySelectionChange(selection) {
      this.checkedDepPurchaseApplyEntry = selection.map(item => item.index)
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('department/purchase/export', {
        ...this.queryParams
      }, `purchase_${new Date().getTime()}.xlsx`)
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
