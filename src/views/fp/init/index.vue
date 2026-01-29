<template>
    <div class="procurement-management" style="position: relative;">
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
      <div class="table-wrapper">
        <el-table 
          :data="tableData" 
          border 
          style="width: 100%" 
          height="58vh"
          v-loading="loading"
          @selection-change="handleSelectionChange"
          :row-class-name="tableRowClassName"
        >
        <el-table-column type="selection" width="55" fixed="left" resizable></el-table-column>
        <el-table-column type="index" label="序号" align="center" width="80" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
          </template>
        </el-table-column>
        <el-table-column prop="billNo" label="单号" align="center" width="180" show-overflow-tooltip resizable></el-table-column>
        <el-table-column prop="warehouse" label="仓库" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.warehouse && scope.row.warehouse.name ? scope.row.warehouse.name : (scope.row.warehouseName || '--') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="supplier" label="供应商" align="center" width="250" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.supplier && scope.row.supplier.name ? scope.row.supplier.name : (scope.row.supplierName || '--') }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createrName" label="制单人" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.creater && scope.row.creater.nickName">{{ scope.row.creater.nickName }}</span>
            <span v-else-if="scope.row.creater && scope.row.creater.userName">{{ scope.row.creater.userName }}</span>
            <span v-else-if="scope.row.createrName">{{ scope.row.createrName }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
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
        <el-table-column prop="invoiceAmount" label="发票金额" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.invoiceAmount">{{ parseFloat(scope.row.invoiceAmount).toFixed(2) }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="totalAmount" label="总金额" align="center" show-overflow-tooltip resizable></el-table-column>
        <el-table-column prop="auditBy" label="审核人" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span>{{ scope.row.auditPerson && scope.row.auditPerson.nickName ? scope.row.auditPerson.nickName : (scope.row.auditPerson && scope.row.auditPerson.userName ? scope.row.auditPerson.userName : (scope.row.auditor && scope.row.auditor.nickName ? scope.row.auditor.nickName : (scope.row.auditor && scope.row.auditor.userName ? scope.row.auditor.userName : (scope.row.auditByNickName || scope.row.auditByUserName || scope.row.auditBy || '--')))) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="auditDate" label="审核日期" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="补录日期" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.invoiceNumber && scope.row.updateTime">{{ parseTime(scope.row.updateTime, '{y}-{m}-{d}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column prop="updateBy" label="补录人" align="center" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.invoiceNumber && scope.row.updateByPerson && scope.row.updateByPerson.nickName">{{ scope.row.updateByPerson.nickName }}</span>
            <span v-else-if="scope.row.invoiceNumber && scope.row.updateByPerson && scope.row.updateByPerson.userName">{{ scope.row.updateByPerson.userName }}</span>
            <span v-else-if="scope.row.invoiceNumber && scope.row.updateByNickName">{{ scope.row.updateByNickName }}</span>
            <span v-else-if="scope.row.invoiceNumber && scope.row.updateByUserName">{{ scope.row.updateByUserName }}</span>
            <span v-else-if="scope.row.invoiceNumber && scope.row.updateBy">{{ scope.row.updateBy }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" fixed="right" resizable width="100">
          <template slot-scope="scope">
            <el-button type="primary" size="small" @click="handleView(scope.row)">查看</el-button>
          </template>
        </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination-wrapper">
        <pagination
          :total="total"
          :page.sync="queryParams.pageNum"
          :limit.sync="queryParams.pageSize"
          @pagination="getList"
        />
      </div>

      <!-- 查看发票详情弹窗（容器内显示） -->
      <transition name="modal-fade">
        <div v-if="detailDialogVisible" class="local-modal-mask">
          <transition name="modal-zoom">
            <div v-if="detailDialogVisible" class="local-modal-content">
              <div class="modal-header">
                <div class="modal-title">查看发票详情</div>
                <el-button size="small" @click="closeDetailView" class="close-btn">关闭</el-button>
              </div>
              <div class="modal-body">
                <el-form ref="detailForm" :model="detailForm" label-width="120px" size="small">
                  <div class="form-fields-container">
                    <el-row :gutter="8">
                      <el-col :span="4">
                        <el-form-item label="单号">
                          <el-input v-model="detailForm.billNo" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="供应商">
                          <el-input v-model="detailForm.supplierName" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="仓库">
                          <el-input v-model="detailForm.warehouseName" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="制单人">
                          <el-input v-model="detailForm.createrName" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="制单日期">
                          <el-input v-model="detailForm.billDate" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="总金额">
                          <el-input v-model="detailForm.totalAmount" :disabled="true" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                    <el-row :gutter="8">
                      <el-col :span="4">
                        <el-form-item label="发票号">
                          <el-input v-model="detailForm.invoiceNumber" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="发票金额">
                          <el-input v-model="detailForm.invoiceAmount" :disabled="true" />
                        </el-form-item>
                      </el-col>
                      <el-col :span="4">
                        <el-form-item label="发票日期">
                          <el-input v-model="detailForm.invoiceTime" :disabled="true" />
                        </el-form-item>
                      </el-col>
                    </el-row>
                  </div>
                </el-form>
                <div class="detail-table-container">
                  <el-table 
                    :data="detailForm.stkIoBillEntryList" 
                    border 
                    height="calc(100vh - 550px)"
                    style="width: 100%"
                  >
                    <el-table-column type="index" label="序号" align="center" width="80" show-overflow-tooltip></el-table-column>
                    <el-table-column label="耗材编码" align="center" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialCode || (scope.row.material && scope.row.material.code) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="耗材名称" align="center" width="180" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialName || (scope.row.material && scope.row.material.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="规格" align="center" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialSpeci || (scope.row.material && scope.row.material.speci) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="型号" align="center" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.materialModel || (scope.row.material && scope.row.material.model) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="单位" align="center" width="80" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.unitName || (scope.row.material && scope.row.material.fdUnit && scope.row.material.fdUnit.unitName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="数量" align="center" prop="qty" width="100" show-overflow-tooltip></el-table-column>
                    <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span v-if="scope.row.unitPrice">{{ parseFloat(scope.row.unitPrice).toFixed(2) }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span v-if="scope.row.amt">{{ parseFloat(scope.row.amt).toFixed(2) }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="批号" align="center" prop="batchNumber" width="150" show-overflow-tooltip></el-table-column>
                    <el-table-column label="有效期" align="center" prop="endTime" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产日期" align="center" prop="beginTime" width="120" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
                        <span v-else>--</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="生产厂家" align="center" width="180" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.factoryName || (scope.row.material && scope.row.material.fdFactory && scope.row.material.fdFactory.factoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="供应商" align="center" width="200" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.supplierName || (scope.row.supplier && scope.row.supplier.name) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="注册证号" align="center" width="150" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.registerNo || (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
                      </template>
                    </el-table-column>
                    <el-table-column label="库房分类" align="center" width="150" show-overflow-tooltip>
                      <template slot-scope="scope">
                        <span>{{ scope.row.warehouseCategoryName || (scope.row.material && scope.row.material.fdWarehouseCategory && scope.row.material.fdWarehouseCategory.warehouseCategoryName) || '--' }}</span>
                      </template>
                    </el-table-column>
                  </el-table>
                </div>
              </div>
            </div>
          </transition>
        </div>
      </transition>

      <!-- 发票补录弹窗 -->
      <el-dialog
        title="发票补录"
        :visible.sync="invoiceDialogVisible"
        width="600px"
        :close-on-click-modal="false"
        v-if="!viewMode"
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
        detailDialogVisible: false,
        viewMode: false,
        invoiceForm: {
          id: null,
          billNo: '',
          invoiceNumber: '',
          invoiceAmount: null,
          invoiceTime: null
        },
        detailForm: {
          id: null,
          billNo: '',
          supplierName: '',
          warehouseName: '',
          createrName: '',
          billDate: '',
          totalAmount: '',
          invoiceNumber: '',
          invoiceAmount: '',
          invoiceTime: '',
          stkIoBillEntryList: []
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
      /** 表格行类名 */
      tableRowClassName({ row, rowIndex }) {
        return '';
      },
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
        // 查看发票详情
        getInWarehouse(row.id).then(response => {
          const data = response.data;
          console.log('入库单详情数据:', data);
          console.log('供应商数据:', data.supplier);
          console.log('仓库数据:', data.warehouse);
          console.log('明细列表:', data.stkIoBillEntryList);
          
          // 处理明细数据，确保字段正确映射
          const entryList = (data.stkIoBillEntryList || []).map(item => {
            return {
              ...item,
              materialCode: (item.material && item.material.code) || item.materialCode || '--',
              materialName: (item.material && item.material.name) || item.materialName || '--',
              materialSpeci: (item.material && item.material.speci) || item.materialSpeci || '--',
              materialModel: (item.material && item.material.model) || item.materialModel || '--',
              unitName: (item.material && item.material.fdUnit && item.material.fdUnit.unitName) || item.unitName || '--',
              factoryName: (item.material && item.material.fdFactory && item.material.fdFactory.factoryName) || item.factoryName || '--',
              supplierName: (item.material && item.material.supplier && item.material.supplier.name) || (item.supplier && item.supplier.name) || item.supplierName || '--',
              registerNo: (item.material && item.material.registerNo) || item.registerNo || '--',
              warehouseCategoryName: (item.material && item.material.fdWarehouseCategory && item.material.fdWarehouseCategory.warehouseCategoryName) || item.warehouseCategoryName || '--'
            };
          });
          
          // 设置详情表单数据
          this.detailForm = {
            id: data.id,
            billNo: data.billNo || '--',
            supplierName: (data.supplier && data.supplier.name) || (data.supplierName) || '--',
            warehouseName: (data.warehouse && data.warehouse.name) || (data.warehouseName) || '--',
            createrName: (data.creater && data.creater.nickName) || (data.creater && data.creater.userName) || (data.createrName) || '--',
            billDate: data.billDate ? parseTime(data.billDate, '{y}-{m}-{d}') : '--',
            totalAmount: data.totalAmount ? parseFloat(data.totalAmount).toFixed(2) : '--',
            invoiceNumber: data.invoiceNumber || '--',
            invoiceAmount: data.invoiceAmount ? parseFloat(data.invoiceAmount).toFixed(2) : '--',
            invoiceTime: data.invoiceTime ? parseTime(data.invoiceTime, '{y}-{m}-{d}') : '--',
            stkIoBillEntryList: entryList
          };
          console.log('处理后的详情数据:', this.detailForm);
          console.log('明细列表数量:', this.detailForm.stkIoBillEntryList.length);
          console.log('明细列表数据:', this.detailForm.stkIoBillEntryList);
          this.detailDialogVisible = true;
        }).catch(error => {
          console.error('获取入库单详情失败:', error);
          this.$modal.msgError('获取入库单详情失败');
        });
      },
      /** 关闭详情视图 */
      closeDetailView() {
        this.detailDialogVisible = false;
        this.detailForm = {
          id: null,
          billNo: '',
          supplierName: '',
          warehouseName: '',
          createrName: '',
          billDate: '',
          totalAmount: '',
          invoiceNumber: '',
          invoiceAmount: '',
          invoiceTime: '',
          stkIoBillEntryList: []
        };
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
        this.viewMode = false;
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
                this.viewMode = false;
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

  /* 表格容器横向滚动 */
  .table-wrapper {
    overflow-x: auto;
    width: 100%;
  }

  .table-wrapper .el-table {
    min-width: 100%;
  }

  /* 优化主表格滚动条 */
  .table-wrapper ::-webkit-scrollbar {
    height: 12px;
  }

  .table-wrapper ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 8px;
  }

  .table-wrapper ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 8px;
  }

  .table-wrapper ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* 容器内弹窗样式 */
  .local-modal-mask {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    z-index: 2000;
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

  .modal-body {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .form-fields-container {
    background: #fff;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
    margin-bottom: 16px;
    border: 1px solid #EBEEF5;
  }

  .detail-table-container {
    margin-top: 16px;
    overflow-x: auto;
  }

  .detail-table-container .el-table {
    min-width: 100%;
  }

  /* 优化表格滚动条 */
  .detail-table-container ::-webkit-scrollbar {
    height: 12px;
  }

  .detail-table-container ::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 8px;
  }

  .detail-table-container ::-webkit-scrollbar-thumb {
    background: #c1c1c1;
    border-radius: 8px;
  }

  .detail-table-container ::-webkit-scrollbar-thumb:hover {
    background: #a8a8a8;
  }

  /* 分页组件样式 */
  .pagination-wrapper {
    margin-top: -20px;
    margin-bottom: 10px;
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
    transform: scale(0.3) translateY(-50px);
  }
  </style>
