<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="调拨单号" prop="billNo" class="query-item-inline">
            <el-input v-model="queryParams.billNo"
                      placeholder="请输入调拨单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
        </el-form-item>
          <el-form-item label="调出仓库" prop="fromWarehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.fromWarehouseId" :excludeWarehouseType="['高值', '设备']"/>
            </div>
        </el-form-item>
          <el-form-item label="调入仓库" prop="toWarehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.toWarehouseId" :excludeWarehouseType="['高值', '设备']"/>
            </div>
        </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="16" class="query-row-second">
        <el-col :span="12">
          <el-form-item label="制单日期" style="display: flex; align-items: center;">
          <el-date-picker
              v-model="queryParams.beginDate"
              type="date"
            value-format="yyyy-MM-dd"
              placeholder="起始日期"
              clearable
              style="width: 180px; margin-right: 8px;"
            />
            <span style="margin: 0 4px;">至</span>
            <el-date-picker
              v-model="queryParams.endDate"
              type="date"
              value-format="yyyy-MM-dd"
              placeholder="截止日期"
              clearable
              style="width: 180px; margin-left: 8px;"
          />
        </el-form-item>
        </el-col>
        <el-col :span="12" class="query-status-col">
          <el-form-item label="单据状态" prop="billStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.billStatus" placeholder="全部"
                       clearable style="width: 150px">
              <el-option v-for="dict in dict.type.biz_status"
                         :key="dict.value"
                         :label="dict.label"
                         :value="dict.value"
              />
          </el-select>
        </el-form-item>
        </el-col>
      </el-row>

      </el-form>

    <el-row :gutter="10" class="mb8" style="padding-top: 10px">
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="medium"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          icon="el-icon-check"
          size="medium"
          :disabled="multiple"
          @click="handleBatchAudit"
          v-hasPermi="['warehouseTransfer:apply:audit']"
        >审核</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="transferList"
              :row-class-name="transferListIndex"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange" height="58vh" border>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" show-overflow-tooltip resizable />
      <el-table-column label="调拨单号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable >
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
        </el-button>
        </template>
      </el-table-column>
      <el-table-column label="调出仓库" align="center" prop="warehouse.name" width="180" show-overflow-tooltip resizable />
      <el-table-column label="调入仓库" align="center" prop="toWarehouse.name" width="180" show-overflow-tooltip resizable />
      <el-table-column label="制单人" align="center" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createrName">{{ scope.row.createrName }}</span>
          <span v-else-if="scope.row.creater && scope.row.creater.nickName">{{ scope.row.creater.nickName }}</span>
          <span v-else-if="scope.row.creater && scope.row.creater.userName">{{ scope.row.creater.userName }}</span>
          <span v-else-if="scope.row.createrNickName">{{ scope.row.createrNickName }}</span>
          <span v-else-if="scope.row.createrUserName">{{ scope.row.createrUserName }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="billDate" width="180" show-overflow-tooltip resizable>
          <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else-if="scope.row.billDate">{{ parseTime(scope.row.billDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
          </template>
        </el-table-column>
      <el-table-column label="金额" align="center" width="120" show-overflow-tooltip resizable >
          <template slot-scope="scope">
          <span v-if="scope.row.totalAmount !== null && scope.row.totalAmount !== undefined && scope.row.totalAmount !== ''">
            {{ parseFloat(scope.row.totalAmount).toFixed(2) }}
          </span>
          <span v-else>--</span>
          </template>
        </el-table-column>
      <el-table-column label="单据状态" align="center" prop="billStatus" show-overflow-tooltip resizable>
          <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.billStatus"/>
        </template>
      </el-table-column>
      <el-table-column label="审核人" align="center" prop="auditPerson.nickName" show-overflow-tooltip resizable />
      <el-table-column label="审核日期" align="center" prop="auditDate" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.auditDate">{{ parseTime(scope.row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handlePrint(scope.row,true)"
            v-if="scope.row.billStatus == 2"
          >打印</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-if="scope.row.billStatus != 2"
            v-hasPermi="['warehouseTransfer:apply:edit']"
          >修改</el-button>
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

    <!-- 添加或修改调拨申请对话框 -->
    <transition name="modal-fade">
      <div v-if="open" class="local-modal-mask">
        <transition name="modal-zoom">
          <div v-if="open" class="local-modal-content">
        <div class="modal-header">
          <div class="modal-title">{{ title }}</div>
          <el-button size="small" @click="cancel" class="close-btn">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="70px" size="small" class="modal-form-compact">

        <div class="form-fields-container">
        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="调拨单号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="调出仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true" :excludeWarehouseType="['高值', '设备']"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="调入仓库" prop="departmentId">
              <SelectWarehouse v-model="form.departmentId" :disabled="true" :excludeWarehouseType="['高值', '设备']"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <SelectUser v-model="form.createrName" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单日期" prop="billDate">
              <el-date-picker clearable
                              v-model="form.billDate"
                              type="date"
                              value-format="yyyy-MM-dd"
                              :disabled="true"
            style="width: 100%"
                              placeholder="请选择制单日期">
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="8">
          <el-col :span="4">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" placeholder="总金额" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="制单人" prop="createrName">
              <el-input :value="createrDisplayName" :disabled="true" placeholder="制单人" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="状态" prop="billStatus">
              <el-input :value="form.billStatus == 2 || form.billStatus == '2' ? '已审核' : '未审核'" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" :disabled="true" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
        </div>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <span>调拨申请明细信息</span>
          </el-col>
        </el-row>
        <div class="table-wrapper">
        <el-table :data="stkIoBillEntryList" :row-class-name="rowStkIoBillEntryIndex"
                  show-summary :summary-method="getSummaries"
                  ref="stkIoBillEntry"
            border
                  height="48vh"
        >
          <el-table-column label="序号" align="center" prop="index" width="60" show-overflow-tooltip resizable/>
          <el-table-column label="耗材编码" align="center" width="150" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.code) || '--' }}</span>
            </template>
            </el-table-column>
          <el-table-column label="耗材名称" align="center" prop="material.name" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="规格" align="center" prop="material.speci" width="150" show-overflow-tooltip resizable/>
          <el-table-column label="型号" align="center" prop="material.model" width="150" show-overflow-tooltip resizable/>
          <el-table-column label="调拨数量" prop="qty" width="90" show-overflow-tooltip resizable>
              <template slot-scope="scope">
              <span>{{ scope.row.qty || '--' }}</span>
              </template>
            </el-table-column>
          <el-table-column label="单位" align="center" prop="material.fdUnit.unitName" width="80" show-overflow-tooltip resizable/>
          <el-table-column label="单价" prop="unitPrice" width="90" show-overflow-tooltip resizable>
              <template slot-scope="scope">
              <span>{{ scope.row.unitPrice || '--' }}</span>
              </template>
            </el-table-column>
          <el-table-column label="金额" prop="amt" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.amt || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="批号" align="center" prop="batchNumber" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNumber || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产日期" align="center" prop="beginTime" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.beginTime">{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="有效期至" align="center" prop="endTime" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span v-if="scope.row.endTime">{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
              <span v-else>--</span>
            </template>
          </el-table-column>
          <el-table-column label="批次号" align="center" prop="batchNo" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.batchNo || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="注册证号" align="center" prop="material.registerNo" width="180" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.registerNo) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="生产厂家" align="center" prop="material.fdFactory.factoryName" width="180" show-overflow-tooltip resizable/>
          <el-table-column label="供应商" align="center" prop="material.supplier.name" width="160" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ (scope.row.material && scope.row.material.supplier && scope.row.material.supplier.name) || '--' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="remark" width="120" show-overflow-tooltip resizable>
            <template slot-scope="scope">
              <span>{{ scope.row.remark || '--' }}</span>
            </template>
          </el-table-column>
          </el-table>
        </div>
        </el-form>
          </div>
        </transition>
      </div>
    </transition>

    <!-- 隐藏的打印组件（用于直接打印，不显示对话框） -->
    <div v-show="false">
      <transfer-order-print v-if="printRowData" :row="printRowData" ref="receiptOrderPrintRefAuto"></transfer-order-print>
    </div>

  </div>
</template>

<script>
import { listWarehouseTransfer, getWarehouseTransfer, auditWarehouseTransfer } from '@/api/warehouse/warehouseTransfer';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import SelectUser from '@/components/SelectModel/SelectUser';
import TransferOrderPrint from './transferOrderPrint';
import RMBConverter from '@/utils/tools';

export default {
  name: "WarehouseTransferAudit",
  dicts: ['biz_status'],
  components: {SelectWarehouse, SelectUser, TransferOrderPrint},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 选中数组
      ids: [],
      // 非单个禁用
      single: true,
      // 非多个禁用
      multiple: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 调拨表格数据
      transferList: [],
      // 调拨明细表格数据
      stkIoBillEntryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
      pageSize: 10,
        billNo: null,
        fromWarehouseId: null,
        toWarehouseId: null,
        billStatus: null,
        beginDate: this.getStatDate(),
        endDate: this.getEndDate(),
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
      // 打印数据（用于隐藏的打印组件）
      printRowData: null
    };
  },
  computed: {
    // 制单人显示名称
    createrDisplayName() {
      // 优先使用表单中的制单人信息
      if (this.form.createrName) {
        return this.form.createrName;
      }
      if (this.form.creater && this.form.creater.nickName) {
        return this.form.creater.nickName;
      }
      if (this.form.creater && this.form.creater.userName) {
        return this.form.creater.userName;
      }
      // 如果没有制单人信息，使用当前登录用户
      const user = this.$store.state.user;
      if (user && user.name) {
        return user.name;
      }
      if (user && user.nickName) {
        return user.nickName;
      }
      return '';
    }
  },
  created() {
    this.getList();
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
        if(column.property === 'amt'){
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
        } else {
          sums[index] = '';
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
        if(column.property === 'totalAmount'){
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
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    getStatDate(){
      // 获取前5天日期
      let myDate = new Date();
      myDate.setDate(myDate.getDate() - 5); // 前5天
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let statDate = year.toString() + "-" + month + "-" + day;
      return statDate;
    },
    getEndDate(){
      // 获取当前日期
      let myDate = new Date();
      let year = myDate.getFullYear();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let day = myDate.getDate();
      day = day < 10 ? "0" + day : day;
      let endDate = year.toString() + "-" + month + "-" + day;
      return endDate;
    },
    /** 查询调拨列表 */
    getList() {
      this.loading = true;
      // 处理截止日期，确保包含当天的所有数据（23:59:59）
      const queryParams = {
        ...this.queryParams
      };
      if (queryParams.endDate && queryParams.endDate.length === 10) {
        // 如果 endDate 只有日期部分（yyyy-MM-dd），添加时间部分为 23:59:59
        queryParams.endDate = queryParams.endDate + ' 23:59:59';
      }
      listWarehouseTransfer(queryParams).then(response => {
        if (response && response.rows) {
          // 映射后端返回的数据到前端字段
          this.transferList = response.rows.map(row => ({
            ...row,
            // 制单人 - 从多个可能的字段获取
            createrName: row.createrName || row.createrNickName || row.createrUserName || 
                        (row.creater && (row.creater.nickName || row.creater.userName)) ||
                        (row.createBy && (row.createBy.nickName || row.createBy.userName)) || '',
            // 总金额 - 从多个可能的字段获取，确保正确映射
            totalAmount: (row.totalAmount !== undefined && row.totalAmount !== null && row.totalAmount !== '') 
                        ? parseFloat(row.totalAmount) 
                        : ((row.total_amount !== undefined && row.total_amount !== null && row.total_amount !== '') 
                          ? parseFloat(row.total_amount) 
                          : null)
          }));
        } else {
          this.transferList = [];
        }
        this.total = response.total || 0;
        this.loading = false;
      }).catch(error => {
        console.error('查询调拨列表失败:', error);
        this.loading = false;
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.queryParams.beginDate = this.getStatDate();
      this.queryParams.endDate = this.getEndDate();
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
      getWarehouseTransfer(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList || [];
        this.open = true;
        this.title = "查看调拨申请";
        // 映射字段
        this.form.createrName = response.data.creater ? (response.data.creater.nickName || response.data.creater.userName) : '';
      });
    },
    /** 审核按钮操作 */
    handleAudit(row) {
      const id = row.id || this.ids
      const auditBy = this.$store.state.user.userId;

      this.$modal.confirm('确定要审核"' + id + '"的数据项？').then(() => {
        return auditWarehouseTransfer({id:id,auditBy:auditBy});
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("审核调拨成功！");
      }).catch(() => {});
    },
    /** 批量审核按钮操作 */
    handleBatchAudit() {
      const ids = this.ids;
      if (!ids || ids.length === 0) {
        this.$modal.msgWarning("请先选择要审核的数据");
        return;
      }
      const auditBy = this.$store.state.user.userId;
      this.$modal.confirm('确定要审核选中的"' + ids.length + '"条数据项？').then(() => {
        // 批量审核：循环调用审核接口
        const promises = ids.map(id => auditWarehouseTransfer({id: id, auditBy: auditBy}));
        return Promise.all(promises);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("批量审核成功！");
      }).catch(() => {});
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      const id = row.id || this.ids
      getWarehouseTransfer(id).then(response => {
        this.form = response.data;
        this.stkIoBillEntryList = response.data.stkIoBillEntryList || [];
        this.open = true;
        this.title = "修改调拨申请";
        // 映射字段
        this.form.createrName = response.data.creater ? (response.data.creater.nickName || response.data.creater.userName) : '';
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {};
      this.stkIoBillEntryList = [];
      this.resetForm("form");
    },
    /** 调拨明细序号 */
    rowStkIoBillEntryIndex({ row, rowIndex }) {
      row.index = rowIndex + 1;
    },
    transferListIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 打印按钮操作 */
    handlePrint(row, print){
      // 直接获取数据并触发打印
      this.getTransferDetail(row).then(res => {
        // 设置打印数据
        this.printRowData = res
        // 等待组件渲染后调用 start()
        this.$nextTick(() => {
          if (this.$refs['receiptOrderPrintRefAuto']) {
            // start() 方法会直接触发浏览器打印对话框
            this.$refs['receiptOrderPrintRefAuto'].start()
          }
        })
      })
    },
    //组装打印信息
    getTransferDetail(row) {
      //查询详情
      return getWarehouseTransfer(row.id).then(response => {
        const details = response.data.stkIoBillEntryList || []
        const data = response.data

        let detailList = [], totalAmt = 0, totalQty = 0

        details && details.forEach(item => {
          const material = item.material || {}
          totalAmt += parseFloat(item.amt || 0)
          totalQty += parseFloat(item.qty || 0)

          detailList.push({
            materialCode: material.code || '',
            materialName: material.name || '',
            materialSpeci: material.speci || '',
            materialModel: material.model || '',
            unitPrice: item.unitPrice || 0,
            qty: item.qty || 0,
            amt: item.amt || 0,
            batchNumber: item.batchNumber || item.batchNo || '',
            periodDate: item.endTime ? this.parseTime(item.endTime, '{y}-{m}-{d}') : '',
            factoryName: (material.fdFactory && material.fdFactory.factoryName) || '',
            supplierName: (material.supplier && material.supplier.name) || ''
          })
        })

        let totalAmtConverter = RMBConverter.numberToChinese(totalAmt);

        // 获取调出仓库名称 - 优先从详情数据获取，其次从列表行数据获取
        let fromWarehouseName = '';
        if (data.warehouse && data.warehouse.name) {
          fromWarehouseName = data.warehouse.name;
        } else if (data.fromWarehouseName) {
          fromWarehouseName = data.fromWarehouseName;
        } else if (row.warehouse && row.warehouse.name) {
          fromWarehouseName = row.warehouse.name;
        } else if (row.fromWarehouseName) {
          fromWarehouseName = row.fromWarehouseName;
        }

        // 获取调入仓库名称 - 优先从详情数据获取，其次从列表行数据获取
        let toWarehouseName = '';
        if (data.toWarehouse && data.toWarehouse.name) {
          toWarehouseName = data.toWarehouse.name;
        } else if (data.toWarehouseName) {
          toWarehouseName = data.toWarehouseName;
        } else if (row.toWarehouse && row.toWarehouse.name) {
          toWarehouseName = row.toWarehouse.name;
        } else if (row.toWarehouseName) {
          toWarehouseName = row.toWarehouseName;
        }

        return {
          billNo: data.billNo || row.billNo,
          fromWarehouseName: fromWarehouseName,
          toWarehouseName: toWarehouseName,
          billDate: data.billDate ? this.parseTime(data.billDate, '{y}-{m}-{d}') : (row.billDate ? this.parseTime(row.billDate, '{y}-{m}-{d}') : ''),
          auditDate: data.auditDate ? this.parseTime(data.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : (row.auditDate ? this.parseTime(row.auditDate, '{y}-{m}-{d} {h}:{i}:{s}') : ''),
          createrName: (data.creater && (data.creater.nickName || data.creater.userName)) || 
                      (row.creater && (row.creater.nickName || row.creater.userName)) || 
                      row.createrName || '',
          auditPersonName: (data.auditPerson && (data.auditPerson.nickName || data.auditPerson.userName)) || 
                          (row.auditPerson && (row.auditPerson.nickName || row.auditPerson.userName)) || 
                          row.auditPersonName || '',
          totalAmt: totalAmt.toFixed(2),
          totalQty: totalQty,
          totalAmtConverter: totalAmtConverter,
          detailList: detailList
        }
      })
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
  background: rgba(0,0,0,0.3);
  z-index: 1000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}

.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
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
  padding: 16px 24px;
  text-align: right;
  border-top: 1px solid #EBEEF5;
  background: #F5F7FA;
  margin-top: 10px;
}

.modal-footer .el-button {
  margin-left: 12px;
}

.local-modal-content .el-form {
  flex: 1;
  overflow: visible;
  padding: 24px;
  background: #fff;
  box-shadow: none;
  margin-bottom: 0;
  display: flex;
  flex-direction: column;
}

/* 弹窗内表格样式 */
.local-modal-content .el-table {
  max-height: calc(42vh);
  min-height: 300px;
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
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
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

/* 按钮样式 */
.el-button--text {
  padding: 0 4px;
}

.el-button--text:hover {
  color: #409EFF;
}

/* 搜索区域样式 */
.app-container > .el-form {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
}

.app-container > .el-form .el-row {
  margin-bottom: 8px;
}

.app-container > .el-form .el-row:last-child {
  margin-bottom: 0;
}

.app-container > .el-form .el-form-item {
  margin-bottom: 0;
}

/* 第一行查询条件左对齐紧凑布局 */
.app-container > .el-form .query-row-left .el-col {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
}

.app-container > .el-form .query-row-left .query-item-inline {
  display: inline-block;
  margin-right: 16px;
  margin-bottom: 0;
  vertical-align: top;
}

.app-container > .el-form .query-row-left .query-item-inline:last-child {
  margin-right: 0;
}

/* 统一控制查询条件输入框宽度 */
.app-container > .el-form .query-row-left .query-item-inline .el-input {
  width: 180px;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper {
  width: 180px;
  display: inline-block;
}

.app-container > .el-form .query-row-left .query-item-inline .query-select-wrapper > * {
  width: 100%;
}

.app-container > .el-form .query-row-left .query-item-inline .el-select {
  width: 150px;
}

/* 第二行单据状态对齐到仓库位置 */
.app-container > .el-form .query-row-second {
  position: relative;
}

/* 确保制单日期的两个日期选择器在同一行 */
.app-container > .el-form .query-row-second .el-form-item {
  white-space: nowrap;
}

.app-container > .el-form .query-row-second .el-form-item .el-form-item__content {
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
}

.app-container > .el-form .query-row-second .query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
}

.query-item-status-aligned {
  margin-left: 0;
}

.query-item-status-aligned .el-form-item__label {
  width: 80px !important;
}

/* 弹窗内表单字段容器样式 */
.local-modal-content .form-fields-container {
  background: #fff;
  padding: 16px 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 16px;
  border: 1px solid #EBEEF5;
}

/* 弹窗内表单紧凑布局 */
.local-modal-content .modal-form-compact .el-row {
  margin-bottom: 10px;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-input,
.local-modal-content .modal-form-compact .el-select,
.local-modal-content .modal-form-compact .el-date-picker {
  width: 140px;
  max-width: 140px;
}

/* 缩小所有输入框高度 */
.local-modal-content .modal-form-compact .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
  font-size: 13px !important;
}

.local-modal-content .modal-form-compact .el-input__icon {
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-select .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor.el-input {
  height: 28px !important;
}

.local-modal-content .modal-form-compact .el-date-editor .el-input__inner {
  height: 28px !important;
  line-height: 28px !important;
}

.local-modal-content .modal-form-compact .el-form-item {
  margin-bottom: 0;
}

.local-modal-content .modal-form-compact .el-form-item__content {
  margin-left: 0 !important;
  line-height: 28px;
}

.local-modal-content .modal-form-compact .el-form-item__label {
  text-align: left;
  padding-right: 6px;
  line-height: 28px;
  height: 28px;
  font-size: 13px;
}

/* 弹窗内表格样式 - 高度调到确定按钮上面一点 */
.local-modal-content .table-wrapper {
  flex: 1;
  overflow: hidden;
  margin-top: 10px;
}

.local-modal-content .el-table {
  height: 48vh;
  max-height: 48vh;
}

.local-modal-content .el-table__body-wrapper {
  max-height: calc(48vh - 48px);
  overflow-y: auto;
}

/* 确保页面容器有相对定位，以便内部弹窗正确定位 */
.app-container {
  position: relative;
}

/* 主表格滚动条样式 */
::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar,
::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 16px !important;
  height: 8px !important;
}

::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb,
::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #c1c1c1 !important;
  border-radius: 8px !important;
}

::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-thumb:hover,
::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8 !important;
}

::v-deep .el-table .el-table__body-wrapper::-webkit-scrollbar-track,
::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 8px !important;
}
</style>
