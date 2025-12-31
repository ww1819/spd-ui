<template>
  <div class="app-container">
    <div class="form-fields-container">
      <el-form :inline="true" :model="queryParams" class="demo-form-inline" label-width="80px">
        <el-row class="query-row-left">
          <el-col :span="24">
            <el-form-item label="调拨单号" prop="transferOrderCode" class="query-item-inline">
              <el-input v-model="queryParams.transferOrderCode" placeholder="请输入调拨单号" clearable style="width: 180px"></el-input>
            </el-form-item>
            <el-form-item label="调出科室" prop="fromDepartmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.fromDepartmentId" placeholder="请选择调出科室" clearable></SelectDepartment>
              </div>
            </el-form-item>
            <el-form-item label="调入科室" prop="toDepartmentId" class="query-item-inline">
              <div class="query-select-wrapper">
                <SelectDepartment v-model="queryParams.toDepartmentId" placeholder="请选择调入科室" clearable></SelectDepartment>
              </div>
            </el-form-item>
            <el-form-item label="单据状态" prop="status" class="query-item-inline">
              <el-select v-model="queryParams.status" placeholder="请选择状态" clearable style="width: 180px">
                <el-option
                  v-for="dict in dict.type.biz_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
        <el-row :gutter="16" class="query-row-second">
          <el-col :span="12">
            <el-form-item label="调拨日期" style="display: flex; align-items: center;">
              <el-date-picker
                v-model="queryParams.startDate"
                type="date"
                placeholder="起始日期"
                value-format="yyyy-MM-dd"
                clearable
                style="width: 180px; margin-right: 8px;"
              ></el-date-picker>
              <span style="margin: 0 4px;">至</span>
              <el-date-picker
                v-model="queryParams.endDate"
                type="date"
                placeholder="截止日期"
                value-format="yyyy-MM-dd"
                clearable
                style="width: 180px; margin-left: 8px;"
              ></el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="medium"
          @click="addTransfer"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="medium"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="getTransferList"
          :loading="loading"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="medium"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getTransferList"></right-toolbar>
    </el-row>

    <el-table :data="tableData" v-loading="loading" :row-class-name="rowTransferIndex" @selection-change="handleSelectionChange" height="54vh" border>
        <el-table-column type="selection" width="55" align="center" fixed="left" />
        <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
        <el-table-column label="调拨单号" align="center" prop="transferOrderCode" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <el-button type="text" @click="viewTransfer(scope.row)">
              <span>{{ scope.row.transferOrderCode }}</span>
            </el-button>
          </template>
        </el-table-column>
        <el-table-column label="调出科室" align="center" prop="fromDepartmentName" width="180" show-overflow-tooltip resizable></el-table-column>
        <el-table-column label="调入科室" align="center" prop="toDepartmentName" width="180" show-overflow-tooltip resizable></el-table-column>
        <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            <span v-else-if="scope.row.transferDate">{{ scope.row.transferDate }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" align="center" prop="status" width="100" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.status == 2 || scope.row.status == '2'">已审核</span>
            <span v-else>未审核</span>
          </template>
        </el-table-column>
        <el-table-column label="审核人" align="center" prop="auditPersonName" width="100" show-overflow-tooltip resizable></el-table-column>
        <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable></el-table-column>
        <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="180" fixed="right">
          <template slot-scope="scope">
            <span style="white-space: nowrap; display: inline-block;">
              <el-button
                size="small"
                type="text"
                icon="el-icon-view"
                @click="viewTransfer(scope.row)"
                :disabled="dialogLoading"
                v-if="scope.row.status == 2 || scope.row.status == '2'"
                style="padding: 0 5px; margin: 0;"
              >查看</el-button>
              <el-button
                size="small"
                type="text"
                icon="el-icon-edit"
                @click="editTransfer(scope.row)"
                :disabled="dialogLoading"
                v-if="scope.row.status != 2 && scope.row.status != '2'"
                style="padding: 0 5px; margin: 0;"
              >修改</el-button>
              <el-button
                size="small"
                type="text"
                icon="el-icon-delete"
                @click="deleteTransfer(scope.row)"
                :disabled="loading"
                v-if="scope.row.status != 2 && scope.row.status != '2'"
                style="padding: 0 5px; margin: 0;"
              >删除</el-button>
            </span>
          </template>
        </el-table-column>
      </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getTransferList"
    />

    <!-- 添加或修改转科申请对话框 -->
    <transition name="modal-fade">
      <div v-if="dialogVisible" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="dialogVisible" class="local-modal-content">
            <div class="modal-header">
              <div class="modal-title">{{ dialogType === 'add' ? '新增转科申请' : dialogType === 'edit' ? '修改转科申请' : '转科申请详情' }}</div>
              <el-button size="small" @click="closeDialog" class="close-btn">关闭</el-button>
            </div>
            <el-form ref="transferForm" :model="transferForm" :rules="rules" label-width="80px" class="modal-form-wrapper">
              <div class="form-fields-container">
              <el-row>
                <el-col :span="4">
                  <el-form-item label="调拨单号" prop="transferOrderCode" label-width="100px">
                    <el-input v-model="transferForm.transferOrderCode" :disabled="true" style="width: 150px" />
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="状态" prop="status" label-width="100px" v-if="dialogType !== 'add'">
                    <el-select v-model="transferForm.status" placeholder="请选择状态"
                               :disabled="true"
                               clearable style="width: 150px">
                      <el-option label="未审核" value="1"></el-option>
                      <el-option label="已审核" value="2"></el-option>
                    </el-select>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="调出科室" prop="fromDepartmentId" label-width="100px">
                    <SelectDepartment v-model="transferForm.fromDepartmentId" placeholder="请选择调出科室" :disabled="dialogType === 'view'" @change="onDepartmentChange('from', $event)"></SelectDepartment>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="调入科室" prop="toDepartmentId" label-width="100px">
                    <SelectDepartment v-model="transferForm.toDepartmentId" placeholder="请选择调入科室" :disabled="dialogType === 'view'" @change="onDepartmentChange('to', $event)"></SelectDepartment>
                  </el-form-item>
                </el-col>
              </el-row>
              <el-row>
                <el-col :span="4">
                  <el-form-item label="调拨日期" prop="transferDate" label-width="100px">
                    <el-date-picker clearable
                                    v-model="transferForm.transferDate"
                                    type="date"
                                    style="width: 150px"
                                    value-format="yyyy-MM-dd"
                                    :disabled="dialogType === 'view'"
                                    placeholder="请选择调拨日期">
                    </el-date-picker>
                  </el-form-item>
                </el-col>
                <el-col :span="4">
                  <el-form-item label="备注" prop="remark" label-width="100px">
                    <el-input v-model="transferForm.remark" placeholder="请输入备注" style="width: 150px" :disabled="dialogType === 'view'" />
                  </el-form-item>
                </el-col>
              </el-row>
              </div>

              <el-row :gutter="10" class="mb8">
                <el-col :span="1.5">
                  <span>转科申请明细信息</span>
                </el-col>

                <div v-show="dialogType !== 'view'">
                  <el-col :span="1.5">
                    <el-button type="primary" icon="el-icon-plus" size="medium" @click="addDetail">添加</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="danger" icon="el-icon-delete" size="medium" @click="handleDeleteTransferDetail">删除</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button @click="closeDialog">取 消</el-button>
                  </el-col>
                  <el-col :span="1.5">
                    <el-button type="primary" @click="submitTransfer" :loading="submitLoading">保 存</el-button>
                  </el-col>
                </div>
              </el-row>
              <div class="table-wrapper">
              <el-table :data="transferDetails" :row-class-name="rowTransferDetailIndex" @selection-change="handleTransferDetailSelectionChange" ref="transferDetail" height="100%" border :summary-method="getSummaries" show-summary>
                <el-table-column type="selection" width="50" align="center" resizable v-if="dialogType !== 'view'" />
                <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
                <el-table-column label="耗材名称" align="center" prop="materialName" width="180" show-overflow-tooltip resizable>
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
                <el-table-column label="规格" align="center" prop="specification" width="120" show-overflow-tooltip resizable>
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
                <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input
                      v-if="dialogType !== 'view'"
                      v-model="scope.row.model"
                      placeholder="请输入型号"
                      :validate-event="false"
                    ></el-input>
                    <span v-else>{{ scope.row.model }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable>
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
                <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input
                      v-if="dialogType !== 'view'"
                      v-model.number="scope.row.unitPrice"
                      type="number"
                      placeholder="单价"
                      :validate-event="false"
                      :min="0"
                    ></el-input>
                    <span v-else>{{ scope.row.unitPrice || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="调拨数量" prop="transferQuantity" width="90" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input clearable v-model="scope.row.transferQuantity" placeholder="请输入数量"
                              onkeyup="value=value.replace(/\D/g,'')"
                              onafterpaste="value=value.replace(/\D/g,'')"
                              @input="qtyChange(scope.row)"
                              :disabled="dialogType === 'view'"
                    />
                  </template>
                </el-table-column>
                <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <span>{{ scope.row.amt || '--' }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="批号" align="center" prop="batchNumber" width="160" show-overflow-tooltip resizable>
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
                <el-table-column label="有效期至" align="center" prop="expireDate" width="160" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-date-picker
                      v-if="dialogType !== 'view'"
                      v-model="scope.row.expireDate"
                      type="date"
                      placeholder="有效期至"
                      value-format="yyyy-MM-dd"
                      :validate-event="false"
                      style="width: 100%"
                    ></el-date-picker>
                    <span v-else>{{ scope.row.expireDate }}</span>
                  </template>
                </el-table-column>
                <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
                  <template slot-scope="scope">
                    <el-input v-model="scope.row.remark" placeholder="请输入备注" :disabled="dialogType === 'view'" />
                  </template>
                </el-table-column>
                <el-table-column label="操作" align="center" width="100" fixed="right" v-if="dialogType !== 'view'">
                  <template slot-scope="scope">
                    <el-button
                      size="small"
                      type="text"
                      icon="el-icon-delete"
                      @click="deleteDetail(scope.$index)"
                      style="padding: 0 5px; margin: 0;"
                    >删除</el-button>
                  </template>
                </el-table-column>
              </el-table>
              </div>
            </el-form>
          </div>
        </transition>
      </div>
    </transition>
  </div>
</template>

<script>
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
export default {
  name: 'WarehouseTransferApply',
  components: {
    SelectWarehouse,
    SelectDepartment
  },
  dicts: ['biz_status'],
  data() {
    return {
      // 状态管理
      loading: false,
      dialogLoading: false,
      submitLoading: false,
      showSearch: true,

      // 弹窗状态
      dialogVisible: false,
      dialogType: 'add', // add, edit, view

      // 调拨单表单数据
      transferForm: {
        transferOrderCode: '',
        fromDepartmentId: '',
        fromDepartmentName: '',
        toDepartmentId: '',
        toDepartmentName: '',
        transferDate: '',
        status: '',
        remark: ''
      },

      // 调拨明细
      transferDetails: [],
      checkedTransferDetail: [],
      action: true,

      // 表格数据
      tableData: [],
      ids: [],
      single: true,
      multiple: true,

      // 查询条件
      queryParams: {
        transferOrderCode: '',
        fromDepartmentId: '',
        toDepartmentId: '',
        status: '',
        startDate: '',
        endDate: '',
        pageNum: 1,
        pageSize: 10
      },

      // 分页信息
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      total: 0,

      // 弹窗表单验证规则
      rules: {
        fromDepartmentId: [{ required: true, message: '请选择调出科室', trigger: 'blur' }],
        toDepartmentId: [{ required: true, message: '请选择调入科室', trigger: 'blur' }],
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
        if (index === 1) {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'transferQuantity') {
          let totalQty = 0;
          data.forEach(item => {
            if (item.transferQuantity && !isNaN(item.transferQuantity)) {
              totalQty += parseFloat(item.transferQuantity);
            }
          });
          sums[index] = totalQty;
        } else if (column.property === 'amt') {
          let totalAmount = 0;
          data.forEach(item => {
            if (item.amt && !isNaN(item.amt)) {
              totalAmount += parseFloat(item.amt);
            }
          });
          sums[index] = '￥' + totalAmount.toFixed(2);
        } else {
          sums[index] = '';
        }
      });
      return sums;
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
            transferOrderCode: 'ZK-20230520001',
            fromDepartmentName: '总仓库',
            toDepartmentName: '一分店仓库',
            createTime: '2023-05-20 10:30:00',
            transferDate: '2023-05-20',
            status: '1',
            auditPersonName: '',
            auditDate: '',
            remark: '日常调拨'
          },
          {
            id: '2',
            transferOrderCode: 'ZK-20230521001',
            fromDepartmentName: '总仓库',
            toDepartmentName: '二分店仓库',
            createTime: '2023-05-21 14:20:00',
            transferDate: '2023-05-21',
            status: '2',
            auditPersonName: '张三',
            auditDate: '2023-05-21 15:30:00',
            remark: '紧急调拨'
          },
          {
            id: '3',
            transferOrderCode: 'ZK-20230522001',
            fromDepartmentName: '三分店仓库',
            toDepartmentName: '总仓库',
            createTime: '2023-05-22 09:15:00',
            transferDate: '2023-05-22',
            status: '1',
            auditPersonName: '',
            auditDate: '',
            remark: '退货入库'
          }
        ];
        this.pagination.total = this.tableData.length;
        this.total = this.tableData.length;
      } catch (error) {
        this.$modal.msgError('获取调拨单列表失败：' + (error.message || '未知错误'));
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
        this.action = false;

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
            model: '',
            unit: '个',
            transferQuantity: 100,
            unitPrice: 2.5,
            amt: 250,
            batchNumber: '20230501',
            expireDate: '2024-05-01',
            remark: ''
          },
          {
            id: '2',
            materialId: '102',
            materialName: '医用手套',
            specification: '无粉',
            model: '',
            unit: '副',
            transferQuantity: 200,
            unitPrice: 1.2,
            amt: 240,
            batchNumber: '20230502',
            expireDate: '2024-06-01',
            remark: ''
          }
        ];
        this.dialogVisible = true;
      } catch (error) {
        this.$modal.msgError('获取调拨单详情失败：' + (error.message || '未知错误'));
        console.error('获取调拨单详情失败', error);
      } finally {
        this.dialogLoading = false;
      }
    },

    // 修改调拨单
    async editTransfer(row) {
      if (row.status == 2 || row.status == '2') {
        this.$modal.msgError('只能修改未审核的调拨单');
        return;
      }

      this.dialogLoading = true;
      try {
        this.dialogType = 'edit';
        this.transferForm = { ...row };
        this.action = true;

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
            model: '',
            unit: '个',
            transferQuantity: 100,
            unitPrice: 2.5,
            amt: 250,
            batchNumber: '20230501',
            expireDate: '2024-05-01',
            remark: ''
          },
          {
            id: '2',
            materialId: '102',
            materialName: '医用手套',
            specification: '无粉',
            model: '',
            unit: '副',
            transferQuantity: 200,
            unitPrice: 1.2,
            amt: 240,
            batchNumber: '20230502',
            expireDate: '2024-06-01',
            remark: ''
          }
        ];
        this.dialogVisible = true;
      } catch (error) {
        this.$modal.msgError('获取调拨单详情失败：' + (error.message || '未知错误'));
        console.error('获取调拨单详情失败', error);
      } finally {
        this.dialogLoading = false;
      }
    },

    // 添加调拨单
    addTransfer() {
      this.dialogType = 'add';
      this.action = true;
      // 生成调拨单号 ZK-开头
      const dateStr = new Date().toISOString().split('T')[0].replace(/-/g, '');
      const timestamp = Date.now().toString().substring(8);
      const transferOrderCode = `ZK-${dateStr}${timestamp}`;
      
      this.transferForm = {
        transferOrderCode: transferOrderCode,
        fromDepartmentId: '',
        fromDepartmentName: '',
        toDepartmentId: '',
        toDepartmentName: '',
        transferDate: new Date().toISOString().split('T')[0],
        status: '1',
        remark: ''
      };
      this.transferDetails = [];
      this.checkedTransferDetail = [];
      this.dialogVisible = true;
    },

    // 序号生成
    rowTransferIndex({ row, rowIndex }) {
      row.index = (this.pagination.currentPage - 1) * this.pagination.pageSize + rowIndex + 1;
    },

    // 选择框变化
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
    },

    // 删除调拨单
    deleteTransfer(row) {
      if (row.status == 2 || row.status == '2') {
        this.$modal.msgError('只能删除未审核的调拨单');
        return;
      }

      const billNo = row.transferOrderCode;
      this.$modal.confirm('是否确认删除转科申请单，单号"' + billNo + '"的数据项？').then(() => {
        this.loading = true;
        // 这里应该调用后端API删除数据
        // 模拟API调用
        setTimeout(() => {
          // 模拟删除成功
          this.getTransferList();
          this.$modal.msgSuccess('删除成功');
          this.loading = false;
        }, 300);
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
            this.$modal.msgError('请添加调拨明细');
            return;
          }

          // 验证明细内容
          const hasError = this.transferDetails.some(detail => {
            return !detail.materialName || !detail.transferQuantity || detail.transferQuantity <= 0;
          });

          if (hasError) {
            this.$modal.msgError('请检查调拨明细，确保所有必填项都已填写且数量大于0');
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
            this.$modal.msgSuccess(this.dialogType === 'add' ? '新增成功' : '修改成功');
          } catch (error) {
            this.$modal.msgError('提交失败：' + (error.message || '未知错误'));
            console.error('提交调拨单失败', error);
          } finally {
            this.submitLoading = false;
          }
        }
      });
    },

    // 添加明细
    addDetail() {
      let obj = {};
      obj.materialId = '';
      obj.materialName = '';
      obj.specification = '';
      obj.model = '';
      obj.unit = '';
      obj.transferQuantity = '';
      obj.unitPrice = '';
      obj.amt = '';
      obj.batchNumber = '';
      obj.expireDate = '';
      obj.remark = '';
      this.transferDetails.push(obj);
      this.calculateTotals();
    },

    // 删除明细
    deleteDetail(index) {
      this.transferDetails.splice(index, 1);
      this.calculateTotals();
    },

    // 删除选中的明细
    handleDeleteTransferDetail() {
      if (this.checkedTransferDetail.length == 0) {
        this.$modal.msgError("请先选择要删除的转科申请明细数据");
      } else {
        const transferDetails = this.transferDetails;
        const checkedTransferDetail = this.checkedTransferDetail;
        this.transferDetails = transferDetails.filter(function(item) {
          return checkedTransferDetail.indexOf(item.index) == -1
        });
        this.calculateTotals();
      }
    },

    // 明细选择变化
    handleTransferDetailSelectionChange(selection) {
      this.checkedTransferDetail = selection.map(item => item.index);
    },

    // 明细序号
    rowTransferDetailIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },

    // 数量变化计算金额
    qtyChange(row) {
      if (row.transferQuantity && row.unitPrice) {
        row.amt = (parseFloat(row.transferQuantity) * parseFloat(row.unitPrice)).toFixed(2);
      } else {
        row.amt = '';
      }
      this.calculateTotals();
    },

    // 计算合计
    calculateTotals() {
      // 合计计算在表格的summary-method中处理
    },

    // 重置查询条件
    resetQuery() {
      this.queryParams = {
        transferOrderCode: '',
        fromDepartmentId: '',
        toDepartmentId: '',
        status: '',
        startDate: '',
        endDate: '',
        pageNum: 1,
        pageSize: 10
      };
      this.pagination.currentPage = 1;
      this.queryParams.pageNum = 1;
      this.getTransferList();
    },

    // 导出
    handleExport() {
      // TODO: 实现导出功能
      this.download('warehouseTransfer/apply/export', {
        ...this.queryParams
      }, `transfer_${new Date().getTime()}.xlsx`)
    },

    // 分页变更（通过pagination组件触发）
    handlePaginationChange() {
      this.pagination.currentPage = this.queryParams.pageNum;
      this.pagination.pageSize = this.queryParams.pageSize;
      this.getTransferList();
    },

    // 关闭弹窗
    closeDialog() {
      this.dialogVisible = false;
      this.$refs.transferForm && this.$refs.transferForm.resetFields();
      this.transferDetails = [];
      this.checkedTransferDetail = [];
    },

    // 科室选择处理
    onDepartmentChange(type, department) {
      if (type === 'from') {
        this.transferForm.fromDepartmentId = department ? department.id : '';
        this.transferForm.fromDepartmentName = department ? department.name : '';
      } else {
        this.transferForm.toDepartmentId = department ? department.id : '';
        this.transferForm.toDepartmentName = department ? department.name : '';
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
/* 搜索条件容器样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

.query-row-left {
  margin-bottom: 10px;
}

.query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 10px;
}

.query-item-inline .el-form-item__label {
  width: 80px !important;
}

.query-select-wrapper {
  width: 180px;
}

.query-row-second {
  margin-bottom: 10px;
  position: relative;
}

.query-row-second .el-form-item {
  white-space: nowrap;
}

.query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
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
  min-height: 95vh !important;
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

.local-modal-content .el-form {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 24px;
}

.modal-form-wrapper {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.local-modal-content .form-fields-container {
  flex-shrink: 0;
}

.local-modal-content .mb8 {
  flex-shrink: 0;
  margin-bottom: 10px;
}

.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  min-height: 0;
  height: 0;
}

.local-modal-content .table-wrapper .el-table {
  height: 100% !important;
}

::v-deep .local-modal-content .table-wrapper .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
  max-height: calc(100vh - 450px) !important;
}

/* 防止表格列自动换行 */
::v-deep .local-modal-content .table-wrapper .el-table .el-table__cell {
  white-space: nowrap !important;
  overflow: hidden !important;
}

::v-deep .local-modal-content .table-wrapper .el-table .cell {
  white-space: nowrap !important;
  overflow: hidden !important;
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

/* 确保表格可以水平滚动和垂直滚动 */
::v-deep .el-table__body-wrapper {
  overflow-x: auto !important;
  overflow-y: auto !important;
}

/* 增大底部滚动条 */
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  height: 12px !important;
}

::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  height: 12px !important;
  border-radius: 6px;
}

/* 确保操作列固定 */
::v-deep .el-table__fixed-right {
  right: 0 !important;
  z-index: 12 !important;
}

::v-deep .el-table__fixed-header-wrapper {
  z-index: 11;
}

::v-deep .el-table__fixed-right-patch {
  right: 0 !important;
  z-index: 12 !important;
}

/* 确保固定列头部和主体都有正确的z-index */
::v-deep .el-table__fixed-right .el-table__header-wrapper {
  z-index: 12 !important;
}

::v-deep .el-table__fixed-right .el-table__body-wrapper {
  z-index: 12 !important;
}

/* 确保固定列在滚动时保持固定 */
::v-deep .el-table__fixed {
  position: absolute !important;
}

::v-deep .el-table__fixed-right {
  position: absolute !important;
  right: 0 !important;
}

/* 确保表格可以水平滚动 */
::v-deep .el-table {
  overflow-x: auto;
}
</style>
