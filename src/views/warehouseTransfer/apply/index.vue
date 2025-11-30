<template>
  <div class="warehouse-transfer-apply">
    <!-- 错误提示 -->
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      :closable="true"
      @close="errorMessage = ''"
      class="error-alert"
    ></el-alert>

    <!-- 成功提示 -->
    <el-alert
      v-if="successMessage"
      :title="successMessage"
      type="success"
      show-icon
      :closable="true"
      @close="successMessage = ''"
      class="success-alert"
    ></el-alert>

    <div class="search-container">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline">
        <el-form-item label="调拨单号">
          <el-input v-model="queryParams.transferOrderCode" placeholder="请输入调拨单号" clearable></el-input>
        </el-form-item>
        <el-form-item label="调出仓库">
          <SelectWarehouse v-model="queryParams.fromWarehouseId" placeholder="请选择调出仓库" clearable></SelectWarehouse>
        </el-form-item>
        <el-form-item label="调入仓库">
          <SelectWarehouse v-model="queryParams.toWarehouseId" placeholder="请选择调入仓库" clearable></SelectWarehouse>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="queryParams.status" placeholder="请选择状态" clearable>
            <el-option
              v-for="dict in dict.type.biz_status"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            ></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="调拨日期">
          <el-date-picker
            v-model="queryParams.startDate"
            type="date"
            placeholder="开始日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
          <span class="date-range">至</span>
          <el-date-picker
            v-model="queryParams.endDate"
            type="date"
            placeholder="结束日期"
            value-format="yyyy-MM-dd"
          ></el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="getTransferList" :loading="loading">查询</el-button>
          <el-button @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="table-container">
      <div class="table-header">
        <el-button type="primary" @click="addTransfer">新增</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" border>
        <el-table-column prop="transferOrderCode" label="调拨单号" width="180"></el-table-column>
        <el-table-column prop="fromWarehouseName" label="调出仓库" width="180"></el-table-column>
        <el-table-column prop="toWarehouseName" label="调入仓库" width="180"></el-table-column>
        <el-table-column prop="transferDate" label="调拨日期" width="150"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <dict-tag :options="dict.type.biz_status" :value="scope.row.status"></dict-tag>
          </template>
        </el-table-column>
        <el-table-column prop="remark" label="备注"></el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button type="text" @click="viewTransfer(scope.row)" :disabled="dialogLoading">查看</el-button>
            <el-button v-if="scope.row.status === 'PENDING'" type="text" @click="editTransfer(scope.row)" :disabled="dialogLoading">修改</el-button>
            <el-button v-if="scope.row.status === 'PENDING'" type="text" style="color: #f56c6c" @click="deleteTransfer(scope.row)" :disabled="loading">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-container">
        <el-pagination
          background
          layout="prev, pager, next, jumper, total"
          :total="pagination.total"
          :page-size="pagination.pageSize"
          :current-page="pagination.currentPage"
          @current-change="handlePageChange"
          @size-change="handlePageSizeChange"
          :disabled="loading"
        ></el-pagination>
      </div>
    </div>

    <el-dialog
      :title="dialogType === 'add' ? '新增调拨单' : dialogType === 'edit' ? '修改调拨单' : '调拨单详情'"
      :visible.sync="dialogVisible"
      width="80%"
      :before-close="closeDialog"
      v-loading="dialogLoading"
    >
      <el-form ref="transferForm" :model="transferForm" :rules="rules" label-width="120px" class="flow-form">
        <el-form-item label="调拨单号" v-if="dialogType !== 'add'">
          <el-input v-model="transferForm.transferOrderCode" disabled></el-input>
        </el-form-item>
        <el-form-item label="调出仓库" prop="fromWarehouseId">
          <SelectWarehouse v-model="transferForm.fromWarehouseId" placeholder="请选择调出仓库" :disabled="dialogType === 'view'" @change="onWarehouseChange('from', $event)"></SelectWarehouse>
        </el-form-item>
        <el-form-item label="调入仓库" prop="toWarehouseId">
          <SelectWarehouse v-model="transferForm.toWarehouseId" placeholder="请选择调入仓库" :disabled="dialogType === 'view'" @change="onWarehouseChange('to', $event)"></SelectWarehouse>
        </el-form-item>
        <el-form-item label="调拨日期" prop="transferDate">
          <el-date-picker v-model="transferForm.transferDate" type="date" placeholder="请选择调拨日期" value-format="yyyy-MM-dd" :disabled="dialogType === 'view'"></el-date-picker>
        </el-form-item>
        <el-form-item label="状态" v-if="dialogType !== 'add'">
          <dict-tag :options="dict.type.biz_status" :value="transferForm.status"></dict-tag>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="transferForm.remark" type="textarea" rows="3" placeholder="请输入备注" :disabled="dialogType === 'view'"></el-input>
        </el-form-item>

        <!-- 调拨明细 -->
        <el-form-item label="调拨明细">
          <div class="detail-table-container">
            <el-button
              type="primary"
              size="mini"
              @click="addDetail"
              v-if="dialogType !== 'view'"
              :loading="dialogLoading"
            >添加明细</el-button>
            <el-table :data="transferDetails" style="width: 100%" border show-summary :summary-method="getSummaries">
              <el-table-column label="序号" type="index" width="60"></el-table-column>
              <el-table-column prop="materialName" label="耗材名称" width="220">
                <template slot-scope="scope">
                  <el-input
                    v-if="dialogType !== 'view'"
                    v-model="scope.row.materialName"
                    placeholder="请输入耗材名称"
                    :validate-event="false"
                  ></el-input>
                  <span v-else>{{ scope.row.materialName }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="specification" label="规格" width="180">
                <template slot-scope="scope">
                  <el-input
                    v-if="dialogType !== 'view'"
                    v-model="scope.row.specification"
                    placeholder="请输入规格"
                    :validate-event="false"
                  ></el-input>
                  <span v-else>{{ scope.row.specification }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="unit" label="单位" width="80">
                <template slot-scope="scope">
                  <el-input
                    v-if="dialogType !== 'view'"
                    v-model="scope.row.unit"
                    placeholder="单位"
                    :validate-event="false"
                  ></el-input>
                  <span v-else>{{ scope.row.unit }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="transferQuantity" label="调拨数量" width="140">
                <template slot-scope="scope">
                  <el-input
                    v-if="dialogType !== 'view'"
                    v-model.number="scope.row.transferQuantity"
                    type="number"
                    placeholder="数量"
                    :validate-event="false"
                    :min="1"
                  ></el-input>
                  <span v-else>{{ scope.row.transferQuantity }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="unitPrice" label="单价" width="120">
                <template slot-scope="scope">
                  <el-input
                    v-if="dialogType !== 'view'"
                    v-model.number="scope.row.unitPrice"
                    type="number"
                    placeholder="单价"
                    :validate-event="false"
                    :min="0"
                  ></el-input>
                  <span v-else>{{ scope.row.unitPrice }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="batchNumber" label="批号" width="160">
                <template slot-scope="scope">
                  <el-input
                    v-if="dialogType !== 'view'"
                    v-model="scope.row.batchNumber"
                    placeholder="批号"
                    :validate-event="false"
                  ></el-input>
                  <span v-else>{{ scope.row.batchNumber }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="expireDate" label="有效期至" width="160">
                <template slot-scope="scope">
                  <el-date-picker
                    v-if="dialogType !== 'view'"
                    v-model="scope.row.expireDate"
                    type="date"
                    placeholder="有效期至"
                    value-format="yyyy-MM-dd"
                    :validate-event="false"
                  ></el-date-picker>
                  <span v-else>{{ scope.row.expireDate }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" v-if="dialogType !== 'view'">
                <template slot-scope="scope">
                  <el-button
                    type="danger"
                    icon="el-icon-delete"
                    size="mini"
                    @click="deleteDetail(scope.$index)"
                    :disabled="dialogLoading"
                  ></el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-form-item>
      </el-form>

      <div slot="footer" class="dialog-footer">
        <el-button @click="closeDialog" :disabled="submitLoading || dialogLoading">取消</el-button>
        <el-button
          v-if="dialogType !== 'view'"
          type="primary"
          @click="submitTransfer"
          :loading="submitLoading"
        >
          {{ submitLoading ? '提交中...' : '提交' }}
        </el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
export default {
  name: 'WarehouseTransferApply',
  components: {
    SelectWarehouse
  },
  dicts: ['biz_status'],
  data() {
    return {
      // 状态管理
      loading: false,
      dialogLoading: false,
      submitLoading: false,
      errorMessage: '',
      successMessage: '',

      // 弹窗状态
      dialogVisible: false,
      dialogType: 'add', // add, edit, view

      // 调拨单表单数据
      transferForm: {
        transferOrderCode: '',
        fromWarehouseId: '',
        fromWarehouseName: '',
        toWarehouseId: '',
        toWarehouseName: '',
        transferDate: '',
        status: '',
        // statusName: '' - 已改为使用dict.type.biz_status
        remark: ''
      },

      // 调拨明细
      transferDetails: [],

      // 表格数据
      tableData: [],

      // 查询条件
      queryParams: {
        transferOrderCode: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        status: '',
        startDate: '',
        endDate: ''
      },

      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },

      // 弹窗表单验证规则
      rules: {
        fromWarehouseId: [{ required: true, message: '请选择调出仓库', trigger: 'blur' }],
        toWarehouseId: [{ required: true, message: '请选择调入仓库', trigger: 'blur' }],
        transferDate: [{ required: true, message: '请选择调拨日期', trigger: 'blur' }]
      },

      // 明细行验证规则
      detailRules: {
        materialId: [{ required: true, message: '请选择耗材', trigger: 'blur' }],
        transferQuantity: [{ required: true, message: '请输入调拨数量', trigger: 'blur' },
                          { type: 'number', min: 1, message: '调拨数量必须大于0', trigger: 'blur' }],
        unitPrice: [{ type: 'number', min: 0, message: '单价不能小于0', trigger: 'blur' }]
      },

      // 仓库列表
      // warehouseOptions已通过SelectWarehouse组件替代

      // 状态选项 - 已改为使用dict.type.biz_status
    };
  },
  methods: {
    // 表格汇总计算
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const prop = column.property;
        if (prop === 'transferQuantity') {
          const values = data.map(item => Number(item.transferQuantity || 0));
          sums[index] = values.reduce((prev, curr) => {
            const value = Number(curr);
            if (!isNaN(value)) {
              return prev + curr;
            } else {
              return prev;
            }
          }, 0);
          sums[index] += ' 个';
        } else if (prop === 'unitPrice') {
          // 计算总金额 = 数量 * 单价
          const totalAmount = data.reduce((prev, curr) => {
            const quantity = Number(curr.transferQuantity || 0);
            const price = Number(curr.unitPrice || 0);
            if (!isNaN(quantity) && !isNaN(price)) {
              return prev + (quantity * price);
            } else {
              return prev;
            }
          }, 0);
          sums[index] = totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    
    // 显示错误消息
    showError(message) {
      this.errorMessage = message;
      setTimeout(() => {
        this.errorMessage = '';
      }, 3000);
    },

    // 显示成功消息
    showSuccess(message) {
      this.successMessage = message;
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    },

    // 获取调拨单列表
    async getTransferList() {
      this.loading = true;
      try {
        const params = {
          ...this.queryParams,
          pageNum: this.pagination.currentPage,
          pageSize: this.pagination.pageSize
        };

        // 这里应该调用后端API获取数据
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 300));

        // 模拟数据
        this.tableData = [
          {
            id: '1',
            transferOrderCode: 'DB2023001',
            fromWarehouseName: '总仓库',
            toWarehouseName: '一分店仓库',
            transferDate: '2023-05-20',
            status: 'PENDING',
            remark: '日常调拨'
          },
          {
            id: '2',
            transferOrderCode: 'DB2023002',
            fromWarehouseName: '总仓库',
            toWarehouseName: '二分店仓库',
            transferDate: '2023-05-21',
            status: 'APPROVED',
            remark: '紧急调拨'
          },
          {
            id: '3',
            transferOrderCode: 'DB2023003',
            fromWarehouseName: '三分店仓库',
            toWarehouseName: '总仓库',
            transferDate: '2023-05-22',
            status: 'PENDING',
            remark: '退货入库'
          }
        ];
        this.pagination.total = this.tableData.length;
      } catch (error) {
        this.showError('获取调拨单列表失败：' + (error.message || '未知错误'));
        console.error('获取调拨单列表失败', error);
      } finally {
        this.loading = false;
      }
    },

    // 查看调拨单详情
    async viewTransfer(row) {
      this.dialogLoading = true;
      try {
        this.dialogType = 'view';
        this.transferForm = { ...row };

        // 这里应该调用后端API获取明细数据
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 300));

        // 模拟数据
        this.transferDetails = [
          {
            id: '1',
            materialId: '101',
            materialName: '医用口罩',
            specification: 'N95',
            unit: '个',
            transferQuantity: 100,
            unitPrice: 2.5,
            batchNumber: '20230501',
            expireDate: '2024-05-01'
          },
          {
            id: '2',
            materialId: '102',
            materialName: '医用手套',
            specification: '无粉',
            unit: '副',
            transferQuantity: 200,
            unitPrice: 1.2,
            batchNumber: '20230502',
            expireDate: '2024-06-01'
          }
        ];
        this.dialogVisible = true;
      } catch (error) {
        this.showError('获取调拨单详情失败：' + (error.message || '未知错误'));
        console.error('获取调拨单详情失败', error);
      } finally {
        this.dialogLoading = false;
      }
    },

    // 修改调拨单
    async editTransfer(row) {
      if (row.status !== 'PENDING') {
        this.showError('只能修改未审核的调拨单');
        return;
      }

      this.dialogLoading = true;
      try {
        this.dialogType = 'edit';
        this.transferForm = { ...row };

        // 这里应该调用后端API获取明细数据
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 300));

        // 模拟数据
        this.transferDetails = [
          {
            id: '1',
            materialId: '101',
            materialName: '医用口罩',
            specification: 'N95',
            unit: '个',
            transferQuantity: 100,
            unitPrice: 2.5,
            batchNumber: '20230501',
            expireDate: '2024-05-01'
          },
          {
            id: '2',
            materialId: '102',
            materialName: '医用手套',
            specification: '无粉',
            unit: '副',
            transferQuantity: 200,
            unitPrice: 1.2,
            batchNumber: '20230502',
            expireDate: '2024-06-01'
          }
        ];
        this.dialogVisible = true;
      } catch (error) {
        this.showError('获取调拨单详情失败：' + (error.message || '未知错误'));
        console.error('获取调拨单详情失败', error);
      } finally {
        this.dialogLoading = false;
      }
    },

    // 添加调拨单
    addTransfer() {
      this.dialogType = 'add';
      this.transferForm = {
        transferOrderCode: '',
        fromWarehouseId: '',
        fromWarehouseName: '',
        toWarehouseId: '',
        toWarehouseName: '',
        transferDate: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        statusName: '待审核',
        remark: ''
      };
      this.transferDetails = [];
      this.dialogVisible = true;
    },

    // 删除调拨单
    deleteTransfer(row) {
      if (row.status !== 'PENDING') {
        this.showError('只能删除未审核的调拨单');
        return;
      }

      this.$confirm('确定要删除该调拨单吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        this.loading = true;
        try {
          // 这里应该调用后端API删除数据
          // 模拟API调用
          await new Promise(resolve => setTimeout(resolve, 300));

          // 模拟删除成功
          this.getTransferList();
          this.showSuccess('删除成功');
        } catch (error) {
          this.showError('删除失败：' + (error.message || '未知错误'));
          console.error('删除调拨单失败', error);
        } finally {
          this.loading = false;
        }
      }).catch(() => {
        // 取消删除
      });
    },

    // 提交调拨单
    async submitTransfer() {
      this.$refs.transferForm.validate(async (valid) => {
        if (valid) {
          // 验证明细
          if (this.transferDetails.length === 0) {
            this.showError('请添加调拨明细');
            return;
          }

          // 验证明细内容
          const hasError = this.transferDetails.some(detail => {
            return !detail.materialId || !detail.transferQuantity || detail.transferQuantity <= 0;
          });

          if (hasError) {
            this.showError('请检查调拨明细，确保所有必填项都已填写且数量大于0');
            return;
          }

          this.submitLoading = true;
          try {
            // 构建提交数据
            const submitData = {
              ...this.transferForm,
              details: this.transferDetails
            };

            // 这里应该调用后端API保存数据
            // 模拟API调用
            await new Promise(resolve => setTimeout(resolve, 500));

            // 模拟保存成功
            this.dialogVisible = false;
            this.getTransferList();
            this.showSuccess(this.dialogType === 'add' ? '创建成功' : '修改成功');
          } catch (error) {
            this.showError('提交失败：' + (error.message || '未知错误'));
            console.error('提交调拨单失败', error);
          } finally {
            this.submitLoading = false;
          }
        }
      });
    },

    // 添加明细
    addDetail() {
      this.transferDetails.push({
        id: '',
        materialId: '',
        materialName: '',
        specification: '',
        unit: '',
        transferQuantity: 1,
        unitPrice: 0,
        batchNumber: '',
        expireDate: ''
      });
    },

    // 删除明细
    deleteDetail(index) {
      this.transferDetails.splice(index, 1);
    },

    // 重置查询条件
    resetQuery() {
      this.queryParams = {
        transferOrderCode: '',
        fromWarehouseId: '',
        toWarehouseId: '',
        status: '',
        startDate: '',
        endDate: ''
      };
      this.pagination.currentPage = 1;
      this.getTransferList();
    },

    // 分页变更
    handlePageChange(val) {
      this.pagination.currentPage = val;
      this.getTransferList();
    },

    // 页面大小变更
    handlePageSizeChange(val) {
      this.pagination.pageSize = val;
      this.pagination.currentPage = 1;
      this.getTransferList();
    },

    // 关闭弹窗
    closeDialog() {
      this.dialogVisible = false;
      this.$refs.transferForm && this.$refs.transferForm.resetFields();
      this.transferDetails = [];
    },

    // 仓库列表现在通过SelectWarehouse组件获取

    // 仓库选择处理
    onWarehouseChange(type, warehouse) {
      if (type === 'from') {
        this.transferForm.fromWarehouseId = warehouse ? warehouse.id : '';
        this.transferForm.fromWarehouseName = warehouse ? warehouse.name : '';
      } else {
        this.transferForm.toWarehouseId = warehouse ? warehouse.id : '';
        this.transferForm.toWarehouseName = warehouse ? warehouse.name : '';
      }
    }
  },

  // 页面挂载时获取列表数据
  mounted() {
    this.getTransferList();
  }
};
</script>

<style scoped>
.warehouse-transfer-apply {
  padding: 20px;
}

.search-container {
  margin-bottom: 20px;
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-container {
  background: #fff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.table-header {
  margin-bottom: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.detail-table-container {
  margin-top: 10px;
  width: 100%;
  min-height: 500px;
  max-height: 600px;
  overflow-x: auto;
  overflow-y: auto;
}

.detail-table-container .el-table {
  width: 100%;
  min-width: 1400px;
}

.date-range {
  margin: 0 5px;
}

.error-alert,
.success-alert {
  margin-bottom: 15px;
}

/* 流式布局样式 */
.flow-form {
  display: flex;
  flex-wrap: wrap;
}

.flow-form .el-form-item {
  width: 48%;
  margin-right: 2%;
  margin-bottom: 20px;
}

.flow-form .el-form-item:nth-child(2n) {
  margin-right: 0;
}

.flow-form .el-form-item:has(.el-textarea) {
  width: 100%;
  margin-right: 0;
}
</style>
