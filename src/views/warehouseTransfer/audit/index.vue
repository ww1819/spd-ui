<template>
  <div class="warehouse-approval-container">
    <div class="title-section">
      <h3>仓库调拨单审核</h3>
    </div>

    <!-- 查询条件 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="调拨单号">
          <el-input v-model="searchForm.transferCode" placeholder="请输入调拨单号" />
        </el-form-item>
        <el-form-item label="调出仓库">
          <SelectWarehouse v-model="searchForm.outWarehouseId" placeholder="请选择调出仓库" />
        </el-form-item>
        <el-form-item label="调入仓库">
          <SelectWarehouse v-model="searchForm.inWarehouseId" placeholder="请选择调入仓库" />
        </el-form-item>
        <el-form-item label="调拨日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="审核状态">
          <el-select v-model="searchForm.status" placeholder="请选择审核状态">
            <el-option label="待审核" value="PENDING" />
            <el-option label="已通过" value="APPROVED" />
            <el-option label="已拒绝" value="REJECTED" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 调拨单列表 -->
    <div class="table-section">
      <div class="table-header-actions">
        <el-button
          v-if="hasPendingOrders()"
          type="primary"
          @click="batchApprove"
          :disabled="!hasSelectedRows()"
          :loading="batchLoading"
        >
          批量通过
        </el-button>
        <el-button
          v-if="hasPendingOrders()"
          type="danger"
          @click="batchReject"
          :disabled="!hasSelectedRows()"
          :loading="batchLoading"
        >
          批量拒绝
        </el-button>
      </div>
      <el-table
          :data="transferOrderList"
          style="width: 100%"
          stripe
          border
          @selection-change="handleSelectionChange"
          ref="transferTable"
          v-loading="loading"
          element-loading-text="加载中..."
          element-loading-background="rgba(0, 0, 0, 0.8)"
        >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="transferCode" label="调拨单号" min-width="180" />
        <el-table-column prop="outWarehouseName" label="调出仓库" min-width="120" />
        <el-table-column prop="inWarehouseName" label="调入仓库" min-width="120" />
        <el-table-column prop="transferDate" label="调拨日期" min-width="120" />
        <el-table-column prop="transferPerson" label="调拨人" min-width="100" />
        <el-table-column prop="totalAmount" label="调拨总金额" min-width="120">
          <template slot-scope="scope">
            {{ formatCurrency(scope.row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="审核状态" min-width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="auditor" label="审核人" min-width="100" />
        <el-table-column prop="auditTime" label="审核时间" min-width="150" />
        <el-table-column label="操作" min-width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="primary" size="small" @click="viewTransferDetail(scope.row)" :loading="loading">查看详情</el-button>
            <el-button
              v-if="scope.row.status === 'PENDING'"
              type="success"
              size="small"
              @click="approveTransfer(scope.row)"
              :loading="loading"
            >
              通过
            </el-button>
            <el-button
              v-if="scope.row.status === 'PENDING'"
              type="danger"
              size="small"
              @click="rejectTransfer(scope.row)"
              :loading="loading"
            >
              拒绝
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination-section">
      <el-pagination
        background
        layout="prev, pager, next, jumper, sizes, total"
        :total="total"
        :page-size.sync="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        @current-change="handleCurrentChange"
        @size-change="handleSizeChange"
      />
    </div>

    <!-- 调拨单详情对话框 -->
    <el-dialog
      title="调拨单详情"
      :visible.sync="detailDialogVisible"
      width="80%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <div v-if="currentTransferOrder">
        <!-- 调拨单基本信息 -->
        <div class="dialog-basic-info">
          <el-descriptions border :column="4">
            <el-descriptions-item label="调拨单号">{{ currentTransferOrder.transferCode }}</el-descriptions-item>
            <el-descriptions-item label="调出仓库">{{ currentTransferOrder.outWarehouseName }}</el-descriptions-item>
            <el-descriptions-item label="调入仓库">{{ currentTransferOrder.inWarehouseName }}</el-descriptions-item>
            <el-descriptions-item label="调拨日期">{{ currentTransferOrder.transferDate }}</el-descriptions-item>
            <el-descriptions-item label="调拨人">{{ currentTransferOrder.transferPerson }}</el-descriptions-item>
            <el-descriptions-item label="审核状态">
              <el-tag :type="getStatusTagType(currentTransferOrder.status)">
                {{ getStatusText(currentTransferOrder.status) }}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="审核人">{{ currentTransferOrder.auditor || '-' }}</el-descriptions-item>
            <el-descriptions-item label="审核时间">{{ currentTransferOrder.auditTime || '-' }}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="4">{{ currentTransferOrder.remark || '-' }}</el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 调拨明细 -->
        <div class="dialog-detail-section">
          <h4>调拨明细</h4>
          <el-table
            :data="currentTransferOrder.details || []"
            style="width: 100%"
            stripe
            border
          >
            <el-table-column prop="index" label="序号" width="80">
              <template slot-scope="scope">{{ scope.$index + 1 }}</template>
            </el-table-column>
            <el-table-column prop="materialName" label="耗材名称" min-width="180" />
            <el-table-column prop="specification" label="规格" min-width="120" />
            <el-table-column prop="model" label="型号" min-width="120" />
            <el-table-column prop="unit" label="单位" min-width="80" />
            <el-table-column prop="quantity" label="调拨数量" min-width="120" />
            <el-table-column prop="unitPrice" label="单价" min-width="120">
              <template slot-scope="scope">
                {{ formatCurrency(scope.row.unitPrice) }}
              </template>
            </el-table-column>
            <el-table-column prop="amount" label="金额" min-width="120">
              <template slot-scope="scope">
                {{ formatCurrency(scope.row.amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="batchNumber" label="批次号" min-width="150" />
          </el-table>
        </div>

        <!-- 底部金额统计 -->
        <div class="dialog-total-section" v-if="currentTransferOrder.details && currentTransferOrder.details.length > 0">
          <div class="total-info">
            <span>调拨总数：{{ getTotalQuantity() }}</span>
            <span>调拨总金额：{{ formatCurrency(getTotalAmount()) }}</span>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 审核对话框 -->
    <el-dialog
      title="审核"
      :visible.sync="auditDialogVisible"
      width="50%"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
    >
      <el-form :model="auditForm">
        <el-form-item label="调拨单号" prop="transferCode">
          <el-input v-model="auditForm.transferCode" readonly />
        </el-form-item>
        <el-form-item label="审核结果" prop="auditResult">
          <el-radio-group v-model="auditForm.auditResult">
            <el-radio label="APPROVED">通过</el-radio>
            <el-radio label="REJECTED">拒绝</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="审核意见" prop="auditRemark">
          <el-input
            v-model="auditForm.auditRemark"
            type="textarea"
            placeholder="请输入审核意见"
            rows="4"
          />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="auditDialogVisible = false" :disabled="loading">取消</el-button>
        <el-button type="primary" @click="submitAudit" :loading="loading">提交审核</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse.vue';

export default {
  name: 'WarehouseTransferApproval',
  components: {
    SelectWarehouse
  },
  data() {
    return {
      // 查询条件
      searchForm: {
        transferCode: '',
        outWarehouseId: '',
        outWarehouseName: '',
        inWarehouseId: '',
        inWarehouseName: '',
        status: ''
      },
      dateRange: [],

      // 调拨单列表
      transferOrderList: [],

      // 分页信息
      total: 0,
      pageSize: 10,
      currentPage: 1,

      // 选中的行
      selectedRows: [],

      // 详情对话框
      detailDialogVisible: false,
      currentTransferOrder: null,

      // 审核对话框
      auditDialogVisible: false,
      auditForm: {
        transferCode: '',
        auditResult: 'APPROVED',
        auditRemark: ''
      },

      // 待审核的调拨单
      pendingAuditOrder: null,

      // 加载状态
      loading: false,

      // 错误信息
      errorMessage: '',

      // 批量操作加载状态
      batchLoading: false
    }
  },
  created() {
    // 加载调拨单列表
    this.loadTransferOrders();
  },
  methods: {
    // 检查是否有选中的行
    hasSelectedRows() {
      return this.selectedRows && this.selectedRows.length > 0;
    },

    // 检查是否有待审核的订单
    hasPendingOrders() {
      return this.transferOrderList.some(row => row.status === 'PENDING');
    },

    // 批量通过
    batchApprove() {
      // 检查是否只选择了待审核的订单
      const invalidOrders = this.selectedRows.filter(row => row.status !== 'PENDING');
      if (invalidOrders.length > 0) {
        this.$message.warning('只能批量审核待审核状态的调拨单');
        return;
      }

      this.$confirm(`确定要批量通过选中的${this.selectedRows.length}条调拨单吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.batchLoading = true;

        // 构建批量审核数据
        const batchAuditData = {
          transferIds: this.selectedRows.map(row => row.id),
          status: 'APPROVED',
          auditRemark: '批量审核通过',
          auditTime: new Date().toISOString().replace('T', ' ').substr(0, 19)
        };

        try {
          // 提交批量审核
          // 实际项目中替换为真实API调用
          // this.$axios.post('/api/warehouse/transfer/approval/batch-audit', batchAuditData)
          //   .then(res => {
          //     this.$message.success('批量审核成功');
          //     this.$refs.transferTable.clearSelection();
          //     this.loadTransferOrders();
          //   })
          //   .catch(err => {
          //     this.$message.error('批量审核失败：' + err.message);
          //   })
          //   .finally(() => {
          //     this.batchLoading = false;
          //   });

          // 模拟批量审核延迟
          setTimeout(() => {
            this.$message.success('批量审核成功');
            this.$refs.transferTable.clearSelection();
            this.loadTransferOrders();
            this.batchLoading = false;
          }, 500);
        } catch (error) {
          this.$message.error('批量审核失败：' + error.message);
          this.batchLoading = false;
        }
      }).catch(() => {
        this.$message.info('已取消批量审核');
      });
    },

    // 批量拒绝
    batchReject() {
      // 检查是否只选择了待审核的订单
      const invalidOrders = this.selectedRows.filter(row => row.status !== 'PENDING');
      if (invalidOrders.length > 0) {
        this.$message.warning('只能批量审核待审核状态的调拨单');
        return;
      }

      // 弹出输入审核意见的对话框
      this.$prompt('请输入拒绝原因', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        inputValidator: (value) => {
          if (!value || value.trim() === '') {
            return '拒绝原因不能为空';
          }
          return true;
        }
      }).then(({ value }) => {
        this.batchLoading = true;

        // 构建批量审核数据
        const batchAuditData = {
          transferIds: this.selectedRows.map(row => row.id),
          status: 'REJECTED',
          auditRemark: value,
          auditTime: new Date().toISOString().replace('T', ' ').substr(0, 19)
        };

        try {
          // 提交批量审核
          // 实际项目中替换为真实API调用
          // this.$axios.post('/api/warehouse/transfer/approval/batch-audit', batchAuditData)
          //   .then(res => {
          //     this.$message.success('批量拒绝成功');
          //     this.$refs.transferTable.clearSelection();
          //     this.loadTransferOrders();
          //   })
          //   .catch(err => {
          //     this.$message.error('批量拒绝失败：' + err.message);
          //   })
          //   .finally(() => {
          //     this.batchLoading = false;
          //   });

          // 模拟批量审核延迟
          setTimeout(() => {
            this.$message.success('批量拒绝成功');
            this.$refs.transferTable.clearSelection();
            this.loadTransferOrders();
            this.batchLoading = false;
          }, 500);
        } catch (error) {
          this.$message.error('批量拒绝失败：' + error.message);
          this.batchLoading = false;
        }
      }).catch(() => {
        this.$message.info('已取消批量拒绝');
      });
    },

    // 格式化金额
    formatCurrency(value) {
      if (!value && value !== 0) return '0.00';
      return Number(value).toFixed(2);
    },

    // 获取状态对应的标签类型
    getStatusTagType(status) {
      switch (status) {
        case 'PENDING':
          return 'warning';
        case 'APPROVED':
          return 'success';
        case 'REJECTED':
          return 'danger';
        default:
          return 'info';
      }
    },

    // 获取状态文本
    getStatusText(status) {
      switch (status) {
        case 'PENDING':
          return '待审核';
        case 'APPROVED':
          return '已通过';
        case 'REJECTED':
          return '已拒绝';
        default:
          return '未知状态';
      }
    },

    // 加载调拨单列表
    loadTransferOrders() {
      this.loading = true;
      this.errorMessage = '';

      // 构建查询参数
      const params = {
        pageNum: this.currentPage,
        pageSize: this.pageSize,
        ...this.searchForm
      };

      // 如果有日期范围，则添加到查询参数
      if (this.dateRange && this.dateRange.length === 2) {
        params.startDate = this.dateRange[0];
        params.endDate = this.dateRange[1];
      }

      try {
        // 模拟API调用
        // 实际项目中替换为真实API调用
        // this.$axios.get('/api/warehouse/transfer/approval/list', { params })
        //   .then(res => {
        //     this.transferOrderList = res.data.list;
        //     this.total = res.data.total;
        //   })
        //   .catch(err => {
        //     this.$message.error('加载失败：' + err.message);
        //   })
        //   .finally(() => {
        //     this.loading = false;
        //   });

        // 模拟加载延迟
        setTimeout(() => {
          // 模拟数据
          this.transferOrderList = [
            {
              id: '1',
              transferCode: 'DB202306150001',
              outWarehouseId: '101',
              outWarehouseName: '中央仓库',
              inWarehouseId: '102',
              inWarehouseName: '急诊药房',
              transferDate: '2023-06-15',
              transferPerson: '张三',
              totalAmount: 5680.00,
              status: 'PENDING',
              auditor: '',
              auditTime: '',
              remark: '紧急调拨'
            },
            {
              id: '2',
              transferCode: 'DB202306140002',
              outWarehouseId: '102',
              outWarehouseName: '急诊药房',
              inWarehouseId: '101',
              inWarehouseName: '中央仓库',
              transferDate: '2023-06-14',
              transferPerson: '李四',
              totalAmount: 2340.00,
              status: 'APPROVED',
              auditor: '王五',
              auditTime: '2023-06-14 15:30:00',
              remark: '库存调整'
            },
            {
              id: '3',
              transferCode: 'DB202306130003',
              outWarehouseId: '101',
              outWarehouseName: '中央仓库',
              inWarehouseId: '103',
              inWarehouseName: '住院药房',
              transferDate: '2023-06-13',
              transferPerson: '赵六',
              totalAmount: 8970.00,
              status: 'REJECTED',
              auditor: '孙七',
              auditTime: '2023-06-13 10:20:00',
              remark: '月度调拨'
            }
          ];
          this.total = this.transferOrderList.length;
          this.loading = false;
        }, 300);
      } catch (error) {
        this.errorMessage = '加载数据失败：' + error.message;
        this.$message.error(this.errorMessage);
        this.loading = false;
      }
    },

    // 查询
    handleSearch() {
      this.currentPage = 1;
      this.loadTransferOrders();
    },

    // 重置查询条件
    resetSearch() {
      this.searchForm = {
        transferCode: '',
        outWarehouseId: '',
        outWarehouseName: '',
        inWarehouseId: '',
        inWarehouseName: '',
        status: ''
      };
      this.dateRange = [];
      this.currentPage = 1;
      this.loadTransferOrders();
    },

    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedRows = selection;
    },

    // 处理页码变化
    handleCurrentChange(val) {
      this.currentPage = val;
      this.loadTransferOrders();
    },

    // 处理每页条数变化
    handleSizeChange(val) {
      this.pageSize = val;
      this.currentPage = 1;
      this.loadTransferOrders();
    },

    // 查看调拨单详情
    viewTransferDetail(row) {
      this.loading = true;

      try {
        // 加载调拨单详情
        // 实际项目中替换为真实API调用
        // this.$axios.get(`/api/warehouse/transfer/approval/detail/${row.id}`)
        //   .then(res => {
        //     this.currentTransferOrder = res.data;
        //     this.detailDialogVisible = true;
        //   })
        //   .catch(err => {
        //     this.$message.error('加载详情失败：' + err.message);
        //   })
        //   .finally(() => {
        //     this.loading = false;
        //   });

        // 模拟加载延迟
        setTimeout(() => {
          // 模拟详情数据
          this.currentTransferOrder = {
            ...row,
            details: [
              {
                materialName: '一次性使用输液器',
                specification: '7#',
                model: 'A-1',
                unit: '支',
                quantity: 100,
                unitPrice: 3.50,
                amount: 350.00,
                batchNumber: 'A20230501'
              },
              {
                materialName: '一次性使用注射器',
                specification: '5ml',
                model: 'B-2',
                unit: '支',
                quantity: 200,
                unitPrice: 2.80,
                amount: 560.00,
                batchNumber: 'B20230502'
              },
              {
                materialName: '医用脱脂棉',
                specification: '500g',
                model: 'C-3',
                unit: '包',
                quantity: 50,
                unitPrice: 15.00,
                amount: 750.00,
                batchNumber: 'C20230503'
              }
            ]
          };
          this.detailDialogVisible = true;
          this.loading = false;
        }, 300);
      } catch (error) {
        this.$message.error('加载详情失败：' + error.message);
        this.loading = false;
      }
    },

    // 获取调拨总数
    getTotalQuantity() {
      if (!this.currentTransferOrder || !this.currentTransferOrder.details) return 0;
      return this.currentTransferOrder.details.reduce((total, item) => {
        return total + (item.quantity || 0);
      }, 0);
    },

    // 获取调拨总金额
    getTotalAmount() {
      if (!this.currentTransferOrder || !this.currentTransferOrder.details) return 0;
      return this.currentTransferOrder.details.reduce((total, item) => {
        return total + (item.amount || 0);
      }, 0);
    },

    // 审批通过
    approveTransfer(row) {
      this.prepareAuditForm(row, 'APPROVED');
    },

    // 拒绝审批
    rejectTransfer(row) {
      this.prepareAuditForm(row, 'REJECTED');
    },

    // 准备审核表单
    prepareAuditForm(row, result) {
      this.pendingAuditOrder = row;
      this.auditForm = {
        transferCode: row.transferCode,
        auditResult: result,
        auditRemark: ''
      };
      this.auditDialogVisible = true;
    },

    // 提交审核
    submitAudit() {
      // 验证审核意见
      if (this.auditForm.auditResult === 'REJECTED' && !this.auditForm.auditRemark.trim()) {
        this.$message.error('拒绝时必须填写审核意见');
        return;
      }

      this.loading = true;

      try {
        // 构建审核数据
        const auditData = {
          transferId: this.pendingAuditOrder.id,
          status: this.auditForm.auditResult,
          auditRemark: this.auditForm.auditRemark,
          auditTime: new Date().toISOString().replace('T', ' ').substr(0, 19)
        };

        // 提交审核
        // 实际项目中替换为真实API调用
        // this.$axios.post('/api/warehouse/transfer/approval/audit', auditData)
        //   .then(res => {
        //     this.$message.success('审核成功');
        //     this.auditDialogVisible = false;
        //     this.loadTransferOrders();
        //   })
        //   .catch(err => {
        //     this.$message.error('审核失败：' + err.message);
        //   })
        //   .finally(() => {
        //     this.loading = false;
        //   });

        // 模拟审核延迟
        setTimeout(() => {
          this.$message.success('审核成功');
          this.auditDialogVisible = false;
          this.loadTransferOrders();
          this.loading = false;
        }, 300);
      } catch (error) {
        this.$message.error('审核失败：' + error.message);
        this.loading = false;
      }
    }
  }
}
</script>

<style scoped>
.warehouse-approval-container {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-section {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.title-section h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 500;
}

.search-section {
  background-color: #f5f7fa;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.table-section {
  background-color: #ffffff;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-header-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 15px;
  padding: 10px 0;
  border-bottom: 1px solid #e4e7ed;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

/* 对话框样式 */
.dialog-basic-info {
  margin-bottom: 20px;
}

.dialog-detail-section {
  margin-bottom: 20px;
}

.dialog-detail-section h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.dialog-total-section {
  display: flex;
  justify-content: flex-end;
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #e4e7ed;
}

.total-info {
  display: flex;
  gap: 30px;
  font-weight: 500;
  color: #303133;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .warehouse-approval-container {
    padding: 10px;
  }

  .search-form {
    flex-direction: column;
  }

  .search-form .el-form-item {
    width: 100%;
  }

  .pagination-section {
    justify-content: center;
  }

  .total-info {
    flex-direction: column;
    gap: 10px;
  }
}
</style>
