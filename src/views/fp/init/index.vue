<template>
    <div class="procurement-management">
      <!-- 搜索框 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="仓库：">
          <SelectWarehouse v-model="searchForm.warehouseId" style="width: 180px;" />
        </el-form-item>
        <el-form-item label="供应商：">
          <SelectSupplier v-model="searchForm.supplierId" style="width: 180px;" />
        </el-form-item>
        <el-form-item label="单号：">
          <el-input v-model="searchForm.billNo" placeholder="请输入单号" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="类型：">
          <el-select v-model="searchForm.type" placeholder="请选择类型" clearable style="width: 180px;">
            <el-option label="全部" value=""></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="发票号：">
          <el-input v-model="searchForm.invoiceNumber" placeholder="请输入发票号" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="制单人：">
          <el-input v-model="searchForm.createrName" placeholder="请输入制单人" clearable style="width: 180px;"></el-input>
        </el-form-item>
        <el-form-item label="日期：">
          <el-date-picker
            v-model="searchForm.beginDate"
            type="date"
            placeholder="选择日期"
            value-format="yyyy-MM-dd"
            clearable
            style="width: 180px;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="止：">
          <el-date-picker
            v-model="searchForm.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="yyyy-MM-dd"
            clearable
            style="width: 180px;"
          ></el-date-picker>
        </el-form-item>
        <el-form-item label="复核状态：">
          <el-select v-model="searchForm.reviewStatus" placeholder="请选择复核状态" clearable style="width: 180px;">
            <el-option label="已复核" value="已复核"></el-option>
            <el-option label="未复核" value="未复核"></el-option>
          </el-select>
        </el-form-item>
      </el-form>
  
      <!-- 功能按钮 -->
      <div class="function-buttons">
        <el-button type="danger" icon="el-icon-plus" @click="onInvoiceSupplement" :disabled="selectedRows.length === 0">发票补录</el-button>
        <el-button type="primary" icon="el-icon-check" @click="onReviewEntry">复核入库</el-button>
        <el-button icon="el-icon-upload2" @click="onUploadPlatform">上传供应链平台</el-button>
        <el-button icon="el-icon-download" @click="onExport">导出</el-button>
        <el-button type="primary" icon="el-icon-search" @click="onSearch">搜索</el-button>
      </div>
  
      <!-- 表格 -->
      <el-table 
        :data="tableData" 
        border 
        style="width: 100%" 
        height="58vh"
        v-loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" resizable></el-table-column>
        <el-table-column prop="billNo" label="单号" align="center" show-overflow-tooltip resizable></el-table-column>
        <el-table-column prop="warehouse" label="仓库" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.warehouse && scope.row.warehouse.name ? scope.row.warehouse.name : (scope.row.warehouseName || '--') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.supplier && scope.row.supplier.name ? scope.row.supplier.name : (scope.row.supplierName || '--') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createrName" label="制单人" align="center" show-overflow-tooltip resizable></el-table-column>
        <el-table-column prop="billDate" label="制单日期" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="invoiceNumber" label="发票号码" align="center" show-overflow-tooltip resizable></el-table-column>
        <el-table-column prop="invoiceTime" label="发票日期" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.invoiceTime">{{ parseTime(scope.row.invoiceTime, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="invoiceAmount" label="发票金额" align="center" show-overflow-tooltip resizable></el-table-column>
        <el-table-column prop="totalAmount" label="总金额" align="center" show-overflow-tooltip resizable></el-table-column>
        <el-table-column prop="auditBy" label="审核人" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.auditPerson && scope.row.auditPerson.nickName ? scope.row.auditPerson.nickName : (scope.row.auditPerson && scope.row.auditPerson.userName ? scope.row.auditPerson.userName : (scope.row.auditor && scope.row.auditor.nickName ? scope.row.auditor.nickName : (scope.row.auditor && scope.row.auditor.userName ? scope.row.auditor.userName : (scope.row.auditByNickName || scope.row.auditByUserName || scope.row.auditBy || '--')))) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="auditDate" label="审核日期" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" resizable width="100">
          <template slot-scope="scope">
            <el-button type="primary" size="small" @click="handleView(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total > 0"
        :total="total"
        :page.sync="queryParams.pageNum"
        :limit.sync="queryParams.pageSize"
        @pagination="getList"
      />

      <!-- 发票补录弹窗 -->
      <el-dialog
        title="发票补录"
        :visible.sync="invoiceDialogVisible"
        width="600px"
        :close-on-click-modal="false"
      >
        <el-form ref="invoiceForm" :model="invoiceForm" :rules="invoiceRules" label-width="120px">
          <el-form-item label="单号">
            <el-input v-model="invoiceForm.billNo" :disabled="true" />
          </el-form-item>
          <el-form-item label="发票号" prop="invoiceNumber">
            <el-input v-model="invoiceForm.invoiceNumber" placeholder="请输入发票号" />
          </el-form-item>
          <el-form-item label="发票金额" prop="invoiceAmount">
            <el-input v-model="invoiceForm.invoiceAmount" placeholder="请输入发票金额" type="number" />
          </el-form-item>
          <el-form-item label="发票日期" prop="invoiceTime">
            <el-date-picker
              v-model="invoiceForm.invoiceTime"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="请选择发票日期"
              style="width: 100%;"
            />
          </el-form-item>
        </el-form>
        <div slot="footer" class="dialog-footer">
          <el-button @click="invoiceDialogVisible = false">取 消</el-button>
          <el-button type="primary" @click="submitInvoiceForm">保 存</el-button>
        </div>
      </el-dialog>
    </div>
  </template>
  
  <script>
  import SelectWarehouse from '@/components/SelectModel/SelectWarehouse'
  import SelectSupplier from '@/components/SelectModel/SelectSupplier'
  import { listWarehouse, getInWarehouse, updateWarehouse } from '@/api/warehouse/warehouse'
  import { parseTime } from '@/utils/ruoyi'
  import Pagination from '@/components/Pagination'

  export default {
    name: 'InvoiceEntry',
    components: {
      SelectWarehouse,
      SelectSupplier,
      Pagination
    },
    data() {
      return {
        loading: false,
        searchForm: {
          warehouseId: null,
          supplierId: null,
          billNo: '',
          type: '',
          invoiceNumber: '',
          createrName: '',
          beginDate: '',
          endDate: '',
          reviewStatus: ''
        },
        queryParams: {
          pageNum: 1,
          pageSize: 10
        },
        tableData: [],
        total: 0,
        selectedRows: [],
        invoiceDialogVisible: false,
        invoiceForm: {
          id: null,
          billNo: '',
          invoiceNumber: '',
          invoiceAmount: null,
          invoiceTime: null
        },
        invoiceRules: {
          invoiceNumber: [
            { required: true, message: '请输入发票号', trigger: 'blur' }
          ],
          invoiceTime: [
            { required: true, message: '请选择发票日期', trigger: 'change' }
          ]
        }
      };
    },
    created() {
      // 不自动加载，等待用户选择仓库后查询
    },
    watch: {
      'searchForm.warehouseId'(newVal) {
        // 当选择仓库后，自动查询入库单
        if (newVal) {
          this.queryParams.pageNum = 1;
          this.getList();
        } else {
          // 清空仓库时，清空表格数据
          this.tableData = [];
          this.total = 0;
        }
      }
    },
    methods: {
      parseTime,
      /** 搜索 */
      onSearch() {
        this.queryParams.pageNum = 1;
        this.getList();
      },
      /** 查询入库单列表 */
      getList() {
        this.loading = true;
        const params = {
          ...this.queryParams,
          billType: '101', // 入库单
          warehouseId: this.searchForm.warehouseId,
          supplierId: this.searchForm.supplierId,
          billNo: this.searchForm.billNo,
          invoiceNumber: this.searchForm.invoiceNumber,
          createrName: this.searchForm.createrName,
          beginDate: this.searchForm.beginDate,
          endDate: this.searchForm.endDate ? this.searchForm.endDate + ' 23:59:59' : ''
        };
        
        listWarehouse(params).then(response => {
          this.tableData = response.rows || [];
          this.total = response.total || 0;
          this.loading = false;
        }).catch(error => {
          console.error('查询入库单列表失败:', error);
          this.$modal.msgError('查询失败');
          this.loading = false;
        });
      },
      /** 表格选择变化 */
      handleSelectionChange(selection) {
        this.selectedRows = selection;
      },
      /** 查看 */
      handleView(row) {
        // 查看详情功能
        console.log('查看', row);
      },
      /** 发票补录 */
      onInvoiceSupplement() {
        if (this.selectedRows.length === 0) {
          this.$modal.msgWarning('请先选择要补录发票的入库单');
          return;
        }
        if (this.selectedRows.length > 1) {
          this.$modal.msgWarning('请只选择一条入库单进行发票补录');
          return;
        }
        const row = this.selectedRows[0];
        this.invoiceForm = {
          id: row.id,
          billNo: row.billNo,
          invoiceNumber: row.invoiceNumber || '',
          invoiceAmount: row.invoiceAmount || null,
          invoiceTime: row.invoiceTime || null
        };
        this.invoiceDialogVisible = true;
      },
      /** 提交发票表单 */
      submitInvoiceForm() {
        this.$refs['invoiceForm'].validate(valid => {
          if (valid) {
            // 先获取完整的入库单信息
            getInWarehouse(this.invoiceForm.id).then(response => {
              const formData = response.data;
              // 更新发票信息
              formData.invoiceNumber = this.invoiceForm.invoiceNumber;
              formData.invoiceAmount = this.invoiceForm.invoiceAmount;
              formData.invoiceTime = this.invoiceForm.invoiceTime;
              
              updateWarehouse(formData).then(response => {
                this.$modal.msgSuccess('发票补录成功');
                this.invoiceDialogVisible = false;
                this.getList();
                // 清空选择
                this.selectedRows = [];
              }).catch(error => {
                console.error('更新失败:', error);
                this.$modal.msgError('发票补录失败');
              });
            }).catch(error => {
              console.error('获取入库单详情失败:', error);
              this.$modal.msgError('获取入库单详情失败');
            });
          }
        });
      },
      /** 复核入库 */
      onReviewEntry() {
        // 复核入库功能实现
        console.log('复核入库功能触发');
      },
      /** 上传供应链平台 */
      onUploadPlatform() {
        // 上传供应链平台功能实现
        console.log('上传供应链平台功能触发');
      },
      /** 导出 */
      onExport() {
        // 导出功能实现
        console.log('导出功能触发');
      }
    }
  };
  </script>
  
  <style scoped>
  .procurement-management {
    padding: 20px;
  }
  
  .search-form {
    margin-bottom: 20px;
  }
  
  .function-buttons {
    margin-bottom: 20px;
    text-align: left;
  }

  /* 表格样式优化 */
  .el-table {
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
    border: 1px solid #EBEEF5 !important;
  }

  .el-table .el-table__border-left-patch {
    border-top: 1px solid #EBEEF5;
  }

  .el-table .el-table__border-right-patch {
    border-top: 1px solid #EBEEF5;
  }

  .el-table th {
    background-color: #F5F7FA !important;
    color: #606266;
    font-weight: 500;
    height: 50px;
    padding: 8px 0;
    border-bottom: 1px solid #EBEEF5 !important;
    border-right: 1px solid #EBEEF5 !important;
  }

  .el-table td {
    padding: 12px 0;
    color: #606266;
    border-bottom: 1px solid #EBEEF5 !important;
    border-right: 1px solid #EBEEF5 !important;
  }

  .el-table th:first-child,
  .el-table td:first-child {
    border-left: 1px solid #EBEEF5 !important;
  }

  .el-table tr:hover > td {
    background-color: #F5F7FA !important;
    transition: all 0.3s;
  }

  /* 按钮样式 */
  .el-button--text {
    padding: 0 4px;
  }

  .el-button--text:hover {
    color: #409EFF;
  }

  /* 搜索区域样式 */
  .search-form {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 20px;
  }

  .search-form .el-form-item {
    margin-bottom: 15px;
  }
  </style>
