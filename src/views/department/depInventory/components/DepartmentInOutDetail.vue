<template>
  <div class="app-container">
    <div class="query-container">
      <div class="form-fields-container">
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="耗材" prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectMaterial v-model="queryParams.materialId" />
                </div>
              </el-form-item>
              <el-form-item label="科室" prop="departmentId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectDepartment v-model="queryParams.departmentId" />
                </div>
              </el-form-item>
              <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectWarehouse v-model="queryParams.warehouseId" />
                </div>
              </el-form-item>
              <el-form-item label="单据类型" prop="billType" class="query-item-inline">
                <el-select v-model="queryParams.billType" placeholder="请选择单据类型" clearable style="width: 180px">
                  <el-option label="全部" value="" />
                  <el-option label="入库" value="101" />
                  <el-option label="出库" value="102" />
                  <el-option label="调拨" value="103" />
                  <el-option label="盘点" value="104" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16" class="query-row-second">
            <el-col :span="6">
              <el-form-item label="开始日期" prop="beginDate" label-width="100px">
                <el-date-picker clearable
                                v-model="queryParams.beginDate"
                                type="date"
                                value-format="yyyy-MM-dd"
                                placeholder="请选择开始日期"
                                style="width: 180px">
                </el-date-picker>
              </el-form-item>
            </el-col>

            <el-col :span="6">
              <el-form-item label="结束日期" prop="endDate" label-width="100px">
                <el-date-picker clearable
                                v-model="queryParams.endDate"
                                type="date"
                                value-format="yyyy-MM-dd"
                                placeholder="请选择结束日期"
                                style="width: 180px">
                </el-date-picker>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 0; margin-top: 0; margin-bottom: 16px;">
      <el-col :span="1.5">
        <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
      </el-col>
    </el-row>

    <div class="table-container">
    <el-table v-loading="loading" :data="inOutList"
              :row-class-name="inOutListIndex"
              show-summary :summary-method="getSummaries"
              height="51vh" border>
      <el-table-column label="序号" align="center" prop="index" width="50" show-overflow-tooltip resizable/>
      <el-table-column label="单据编号" align="center" prop="billNo" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <el-button type="text" @click="handleView(scope.row)">
            <span>{{ scope.row.billNo }}</span>
          </el-button>
        </template>
      </el-table-column>
      <el-table-column label="单据类型" align="center" prop="billType" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.bill_type" :value="scope.row.billType"/>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="billDate" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.billDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" show-overflow-tooltip resizable />
      <el-table-column label="规格" align="center" prop="specification" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span :style="{ color: scope.row.billType === '101' ? '#67C23A' : '#F56C6C' }">
            {{ scope.row.billType === '101' ? '+' : '-' }}{{ scope.row.qty }}
          </span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amount" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amount">{{ scope.row.amount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" prop="batchNo" width="150" show-overflow-tooltip resizable/>
      <el-table-column label="操作人" align="center" prop="createBy" width="100" show-overflow-tooltip resizable />
      <el-table-column label="备注" align="center" prop="remark" show-overflow-tooltip resizable />
    </el-table>
    </div>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 查看单据对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="80%" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-row>
          <el-col :span="6">
            <el-form-item label="单据编号" prop="billNo">
              <el-input v-model="form.billNo" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单据类型" prop="billType">
              <el-select v-model="form.billType" :disabled="true" clearable>
                <el-option v-for="dict in dict.type.bill_type"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="单据状态" prop="billStatus">
              <el-select v-model="form.billStatus" :disabled="true" clearable>
                <el-option v-for="dict in dict.type.biz_status"
                          :key="dict.value"
                          :label="dict.label"
                          :value="dict.value" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="制单日期" prop="billDate">
              <el-date-picker v-model="form.billDate" type="date" :disabled="true" value-format="yyyy-MM-dd" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-row>
          <el-col :span="6">
            <el-form-item label="科室" prop="departmentId">
              <SelectDepartment v-model="form.departmentId" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="仓库" prop="warehouseId">
              <SelectWarehouse v-model="form.warehouseId" :disabled="true"/>
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="操作人" prop="createBy">
              <el-input v-model="form.createBy" :disabled="true" />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="总金额" prop="totalAmount">
              <el-input v-model="form.totalAmount" :disabled="true" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="cancel">关 闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listDepartmentInOutDetail, getInWarehouse } from "@/api/department/depInventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectDepartment from "@/components/SelectModel/SelectDepartment";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";

export default {
  name: "DepartmentInOutDetail",
  dicts: ['biz_status','bill_type'],
  components: {SelectMaterial,SelectDepartment,SelectWarehouse},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 进销存明细表格数据
      inOutList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 表单参数
      form: {},
      // 表单校验
      rules: {},
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        departmentId: null,
        warehouseId: null,
        billType: null,
        billStatus: null,
        beginDate: null,
        endDate: null
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询进销存明细列表 */
    getList() {
      this.loading = true;
      listDepartmentInOutDetail(this.queryParams).then(response => {
        this.inOutList = response.rows;
        this.total = response.total;
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
      this.handleQuery();
    },
    /** 查看按钮操作 */
    handleView(row) {
      const id = row.id;
      getInWarehouse(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "查看单据";
      });
    },
    /** 取消按钮 */
    cancel() {
      this.open = false;
      this.reset();
    },
    /** 表单重置 */
    reset() {
      this.form = {
        id: null,
        billNo: null,
        billType: null,
        billStatus: null,
        billDate: null,
        departmentId: null,
        warehouseId: null,
        createBy: null,
        totalAmount: null
      };
      this.resetForm("form");
    },
    /** 行序号计算 */
    inOutListIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },
    /** 合计行计算 */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if (column.property === 'qty' || column.property === 'amount') {
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            if (column.property === 'amount') {
              sums[index] = sums[index].toFixed(2);
            }
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    }
  }
};
</script>

<style scoped>
/* 查询条件样式 */
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

/* 查询容器样式 */
.query-container {
  margin-top: -20px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 12px 16px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
}

.table-container {
  margin-top: 0px;
  overflow: visible;
  width: 100%;
  position: relative;
}

/* 表格滚动条样式（稍微加粗） */
.table-container ::-webkit-scrollbar {
  height: 12px;
}

.table-container ::-webkit-scrollbar-thumb {
  border-radius: 6px;
  background-color: #c0c4cc;
}

.table-container ::-webkit-scrollbar-track {
  background-color: #f5f7fa;
}
</style>
