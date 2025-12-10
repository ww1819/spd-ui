<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="订单单号" prop="orderNo" label-width="100px">
            <el-input v-model="queryParams.orderNo"
                      placeholder="请输入订单单号"
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
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <SelectWarehouse v-model="queryParams.warehouseId"/>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="单据状态" prop="orderStatus" label-width="100px">
            <el-select v-model="queryParams.orderStatus" placeholder="请选择单据状态" clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
            </el-select>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="制单日期" prop="beginDate" label-width="100px">
            <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 150px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
              style="width: 150px; margin-left: 8px;"
            />
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['caigou:publish:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-check"
          size="small"
          @click="handleBatchAudit"
          :disabled="multiple"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="orderList"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange"
              height="54vh"
              border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}</span>
        </template>
      </el-table-column>
      <el-table-column label="订单单号" align="center" prop="orderNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.orderNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="订单日期" align="center" prop="orderDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.orderDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouse.name" show-overflow-tooltip resizable />
      <el-table-column label="金额" align="center" prop="totalAmount" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <span v-if="scope.row.totalAmount">{{ scope.row.totalAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="订单状态" align="center" prop="orderStatus" show-overflow-tooltip resizable>
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
      <el-table-column label="审核人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditBy">{{ getAuditorName(scope.row) }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.planNo">{{ scope.row.planNo }}</span>
          <span v-else-if="scope.row.remark && scope.row.remark.includes('从采购计划')">
            {{ extractPlanNoFromRemark(scope.row.remark) }}
          </span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150" fixed="right" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
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

    <!-- 查看订单对话框 -->
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
            <el-form-item label="单据状态" prop="orderStatus" label-width="100px">
              <el-select v-model="form.orderStatus" placeholder="请选择单据状态"
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
            <el-form-item label="仓库" prop="warehouseId" label-width="100px">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="制单日期" prop="orderDate" label-width="100px">
              <el-date-picker clearable
                              v-model="form.orderDate"
                              type="date"
                              :disabled="true"
                              value-format="yyyy-MM-dd"
                              style="width: 150px"
                              placeholder="请选择制单日期">
              </el-date-picker>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="操作人" prop="createBy" label-width="100px">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="联系电话" prop="contactPhone" label-width="100px">
              <el-input v-model="form.contactPhone" :disabled="true" placeholder="请输入联系电话" />
            </el-form-item>
          </el-col>

        </el-row>

        <el-row>

          <el-col :span="4">
            <el-form-item label="采购员" prop="contactPerson" label-width="100px">
              <SelectUser v-model="form.contactPerson" :disabled="true"/>
            </el-form-item>
          </el-col>

          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount" label-width="100px">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="请输入总金额" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>订单明细信息</span>
          </el-col>
        </el-row>
        <el-table :data="purchaseOrderEntryList" :row-class-name="rowPurchaseOrderEntryIndex"
                  show-summary :summary-method="getSummaries"
                  @selection-change="handlePurchaseOrderEntrySelectionChange"
                  ref="purchaseOrderEntry"
                  height="calc(42vh)"
                  border
        >
          <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
          <el-table-column label="耗材" prop="materialId" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <SelectMaterial v-model="scope.row.materialId" :value2="isShow" :disabled="true"/>
            </template>
          </el-table-column>
          <el-table-column label="规格" prop="materialSpec" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.materialSpec" :disabled="true" placeholder="无" />
            </template>
          </el-table-column>
          <el-table-column label="型号" prop="materialUnit" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.materialUnit" :disabled="true" placeholder="无" />
            </template>
          </el-table-column>
          <el-table-column label="数量" prop="orderQty" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.orderQty" :disabled="true" placeholder="请输入数量" />
            </template>
          </el-table-column>
          <el-table-column label="价格" prop="unitPrice" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.unitPrice" :disabled="true" placeholder="请输入价格" />
            </template>
          </el-table-column>
          <el-table-column label="金额" prop="totalAmount" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.totalAmount" :disabled="true" placeholder="请输入金额" />
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="200" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <el-input v-model="scope.row.remark" :disabled="true" placeholder="请输入备注" />
            </template>
          </el-table-column>
        </el-table>
      </el-form>
            <div class="modal-footer">
              <el-button @click="cancel">关 闭</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>

  </div>
</template>

<script>
import { listDingdan, getDingdan, auditDingdan } from "@/api/caigou/dingdan";
import { listUserAll } from "@/api/system/user";
import SelectSupplier from '@/components/SelectModel/SelectSupplier.vue';
import SelectMaterial from '@/components/SelectModel/SelectMaterial.vue';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse.vue';
import SelectUser from '@/components/SelectModel/SelectUser.vue';

export default {
  name: "PurchaseOrderAudit",
  dicts: ['biz_status','bill_type'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse,SelectUser},
  data() {
    return {
      // 遮罩层
      loading: true,
      isShow: true,
      // 选中数组
      ids: [],
      // 子表选中数据
      checkedPurchaseOrderEntry: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 订单表格数据
      orderList: [],
      // 订单明细表格数据
      purchaseOrderEntryList: [],
      // 用户列表
      userOptions: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        orderNo: null,
        supplierId: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null, // 单据状态查询条件
        userId: null,
        orderType: "1", // 采购订单类型
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {}
    };
  },
  created() {
    this.getList();
    this.getUserList();
  },
  methods: {
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 3 || index === 4 || index === 5){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] = sums[index].toFixed(2);
          }
        }
      });
      return sums;
    },
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 4){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] = sums[index].toFixed(2);
          }
        }
      });
      return sums;
    },
    /** 查询订单列表 */
    getList() {
      this.loading = true;
      listDingdan(this.queryParams).then(response => {
        this.orderList = response.rows;
        this.total = response.total;
        this.loading = false;

      });
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01"; //月初
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd; //月末
      return endDate;
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
        orderNo: null,
        supplierId: null,
        orderDate: null,
        warehouseId: null,
        departmentId: null,
        orderStatus: null,
        userId: null,
        orderType: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        delPerson: null,
        contactPhone: null,
        totalAmount: null,
        invoiceAmount: null,
        invoiceTime: null,
        contactPerson: null,
        remark: null
      };
      this.purchaseOrderEntryList = [];
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = null;
      this.queryParams.endDate = null;
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
      getDingdan(id).then(response => {
        this.form = response.data;
        this.purchaseOrderEntryList = response.data.purchaseOrderEntryList;
        this.open = true;
        this.form.orderStatus = row.orderStatus;
        this.form.orderType = '1';
        this.title = "查看订单";
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;

      this.$modal.confirm('确定要审核订单编号为"' + row.orderNo + '"的数据项？').then(function() {
        return auditDingdan({id:id, auditBy:auditBy, auditOpinion:''});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核成功！");
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      if (this.ids.length === 0) {
        this.$modal.msgError("请先选择要审核的订单！");
        return;
      }

      // 检查选中的订单是否都是待审核状态
      const selectedOrders = this.orderList.filter(item => this.ids.includes(item.id));
      const nonPendingOrders = selectedOrders.filter(item => item.orderStatus !== '0' && item.orderStatus !== 0);

      // 调试信息
      console.log('选中的订单:', selectedOrders);
      console.log('非待审核状态的订单:', nonPendingOrders);
      selectedOrders.forEach(order => {
        console.log(`订单 ${order.orderNo} 状态: ${order.orderStatus} (类型: ${typeof order.orderStatus})`);
      });

      if (nonPendingOrders.length > 0) {
        const statusInfo = nonPendingOrders.map(order => `${order.orderNo}(状态:${order.orderStatus})`).join(', ');
        this.$modal.msgError(`只能审核待审核状态的订单！以下订单状态不正确：${statusInfo}`);
        return;
      }

      const auditBy = this.$store.state.user.userId;
      const orderNos = selectedOrders.map(item => item.orderNo).join('、');

      this.$modal.confirm('确定要审核选中的 ' + this.ids.length + ' 个订单吗？\n订单编号：' + orderNos).then(() => {
        // 批量审核
        const auditPromises = this.ids.map(id => auditDingdan({id: id, auditBy: auditBy, auditOpinion: ''}));

        Promise.all(auditPromises).then(() => {
          this.getList();
          this.$modal.msgSuccess("批量审核成功！共审核 " + this.ids.length + " 个订单");
        }).catch(() => {
          this.$modal.msgError("批量审核失败！");
        });
      }).catch(() => {});
    },
    /** 订单明细序号 */
    rowPurchaseOrderEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    /** 复选框选中数据 */
    handlePurchaseOrderEntrySelectionChange(selection) {
      this.checkedPurchaseOrderEntry = selection.map(item => item.index)
    },
    /** 获取用户列表 */
    getUserList() {
      listUserAll().then(response => {
        this.userOptions = response || [];
      });
    },
    /** 获取审核人姓名 */
    getAuditorName(row) {
      if (row.auditBy) {
        // 先尝试通过userId查找用户（支持数字和字符串类型）
        const userById = this.userOptions.find(u => {
          return u.userId == row.auditBy || 
                 u.userId === row.auditBy || 
                 String(u.userId) === String(row.auditBy) ||
                 u.userId === Number(row.auditBy);
        });
        if (userById) {
          return userById.nickName || userById.userName;
        }
        // 再尝试通过userName查找用户
        const userByName = this.userOptions.find(u => u.userName === row.auditBy);
        if (userByName) {
          return userByName.nickName || userByName.userName;
        }
        // 再尝试通过nickName查找用户
        const userByNickName = this.userOptions.find(u => u.nickName === row.auditBy);
        if (userByNickName) {
          return userByNickName.nickName || userByNickName.userName;
        }
        // 如果auditBy不是纯数字，可能是姓名，直接返回
        if (!/^\d+$/.test(String(row.auditBy))) {
          return row.auditBy;
        }
        // 如果auditBy是纯数字但找不到用户，返回"--"而不是空字符串
        return '--';
      }
      return '--';
    },
    // 从备注中提取计划单号
    extractPlanNoFromRemark(remark) {
      if (!remark) return '';
      // 备注格式：从采购计划JH2025120700002生成
      const match = remark.match(/从采购计划([A-Z0-9]+)/);
      if (match && match[1]) {
        return match[1];
      }
      return '';
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('caigou/dingdan/export', {
        ...this.queryParams
      }, `订单_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
/* 内部弹窗样式 */
.local-modal-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  width: 100%;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  min-height: 48px;
  flex-shrink: 0;
}

.modal-title {
  font-size: 16px;
  font-weight: 500;
  color: #303133;
  margin: 0;
}

.close-btn {
  border: none;
  background: transparent;
}

.local-modal-content .el-form {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.modal-footer {
  padding: 12px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
  width: 100%;
  box-sizing: border-box;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.modal-footer .el-button {
  margin-left: 12px;
}

/* 弹窗动画 */
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter, .modal-fade-leave-to {
  opacity: 0;
}

.modal-zoom-enter-active, .modal-zoom-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.modal-zoom-enter, .modal-zoom-leave-to {
  opacity: 0;
  transform: scale(0.7) translateY(-50px);
}

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}
</style>
