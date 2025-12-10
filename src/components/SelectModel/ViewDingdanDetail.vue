<template>
  <div>
    <!-- 查看订单详情弹窗 -->
    <transition name="modal-fade">
      <div v-if="open" class="view-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="view-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ title }}</div>
              <el-button icon="el-icon-close" size="small" circle @click="close" class="close-btn"></el-button>
            </div>
            <div class="modal-body">
              <el-form ref="form" :model="form" label-width="100px">
                <el-row>
                  <el-col :span="6">
                    <el-form-item label="订单单号" prop="orderNo">
                      <el-input v-model="form.orderNo" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="供应商" prop="supplierName">
                      <el-input :value="form.supplier ? form.supplier.name : ''" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="仓库" prop="warehouseName">
                      <el-input :value="form.warehouse ? form.warehouse.name : ''" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="科室" prop="departmentName">
                      <el-input :value="form.department ? form.department.name : ''" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="6">
                    <el-form-item label="订单日期" prop="orderDate">
                      <el-input v-model="form.orderDate" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="订单状态" prop="orderStatus">
                      <dict-tag :options="dict.type.biz_status" :value="form.orderStatus"/>
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="总金额" prop="totalAmount">
                      <el-input v-model="form.totalAmount" :disabled="true" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="审核日期" prop="auditDate">
                      <el-input v-model="form.auditDate" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
                <el-row>
                  <el-col :span="24">
                    <el-form-item label="备注" prop="remark">
                      <el-input v-model="form.remark" type="textarea" :disabled="true" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>

              <!-- 订单明细表格 -->
              <el-divider content-position="left">订单明细</el-divider>
              <el-table :data="purchaseOrderEntryList" border>
                <el-table-column label="序号" align="center" width="60">
                  <template slot-scope="scope">
                    {{ scope.$index + 1 }}
                  </template>
                </el-table-column>
                <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" />
                <el-table-column label="耗材名称" align="center" prop="materialName" width="180" />
                <el-table-column label="规格" align="center" prop="materialSpec" width="120" />
                <el-table-column label="单位" align="center" prop="materialUnit" width="80" />
                <el-table-column label="数量" align="center" prop="orderQty" width="100" />
                <el-table-column label="单价" align="center" prop="unitPrice" width="100" />
                <el-table-column label="金额" align="center" prop="totalAmount" width="120" />
                <el-table-column label="备注" align="center" prop="remark" />
              </el-table>
            </div>
            <div class="modal-footer">
              <el-button @click="close">关 闭</el-button>
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import { getDingdan } from "@/api/caigou/dingdan";

export default {
  name: "ViewDingdanDetail",
  dicts: ['biz_status'],
  props: {
    orderId: {
      type: [Number, String],
      default: null
    }
  },
  data() {
    return {
      open: false,
      title: "查看订单",
      form: {},
      purchaseOrderEntryList: []
    };
  },
  watch: {
    orderId(newVal) {
      if (newVal) {
        this.loadOrderDetail(newVal);
      }
    }
  },
  methods: {
    /** 加载订单详情 */
    loadOrderDetail(id) {
      getDingdan(id).then(response => {
        this.form = response.data;
        this.purchaseOrderEntryList = response.data.purchaseOrderEntryList || [];
        this.open = true;
        
        // 格式化日期显示
        if (this.form.orderDate) {
          this.form.orderDate = this.parseTime(this.form.orderDate, '{y}-{m}-{d}');
        }
        if (this.form.auditDate) {
          this.form.auditDate = this.parseTime(this.form.auditDate, '{y}-{m}-{d}');
        }
      }).catch(error => {
        this.$message.error("获取订单详情失败");
        console.error(error);
      });
    },
    /** 关闭弹窗 */
    close() {
      this.open = false;
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
/* 查看订单详情弹窗样式 */
.view-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  z-index: 2100;
  display: flex;
  align-items: center;
  justify-content: center;
}

.view-modal-content {
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
  margin-top: 20px;
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

/* 表单样式 */
.el-form {
  background: #fff;
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

