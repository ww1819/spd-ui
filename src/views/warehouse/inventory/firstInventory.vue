<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="库存数量" prop="qty" label-width="100px">
            <el-input
              v-model="queryParams.qty"
              placeholder="请输入库存数量"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="耗材" prop="materialId" label-width="100px">
            <MaterialAutocomplete v-model="queryParams.materialName"/>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="仓库" prop="warehouseId" label-width="100px">
            <WarehouseAutocomplete v-model="queryParams.warehouseName"/>
          </el-form-item>
        </el-col>

        <el-col :span="6">
          <el-form-item label="入库日期" prop="warehouseDate" label-width="100px">
            <el-date-picker clearable
                            v-model="queryParams.warehouseDate"
                            type="date"
                            value-format="yyyy-MM-dd"
                            placeholder="请选择入库日期">
            </el-date-picker>
          </el-form-item>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="批次号" prop="batchNo" label-width="100px">
            <el-input
              v-model="queryParams.batchNo"
              placeholder="请输入批次号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="批号" prop="materialNo" label-width="100px">
            <el-input
              v-model="queryParams.materialNo"
              placeholder="请输入批号"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-form-item label="耗材日期" prop="materialDate" label-width="100px">
          <el-date-picker clearable
                          v-model="queryParams.materialDate"
                          type="date"
                          value-format="yyyy-MM-dd"
                          placeholder="请选择耗材日期">
          </el-date-picker>
        </el-form-item>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="mini" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-table v-loading="loading" :data="inventoryList"
              show-summary :summary-method="getTotalSummaries"
              @selection-change="handleSelectionChange">
<!--      <el-table-column label="编号" align="center" prop="id" width="50"/>-->
      <el-table-column type="index" label="序号" width="80">
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="material.code" width="80"/>
      <el-table-column label="耗材" align="center" prop="material.name" width="160"/>
      <el-table-column label="仓库" align="center" prop="warehouse.name" width="120"/>
      <el-table-column label="供应商" align="center" prop="supplier.name" width="160"/>
      <el-table-column label="库存数量" align="center" prop="qty" width="80"/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amt" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="批次号" align="center" prop="batchNo" width="200"/>
      <el-table-column label="批号" align="center" prop="materialNo" width="120"/>
      <el-table-column label="生产日期" align="center" prop="beginTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.beginTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="有效期" align="center" prop="endTime" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="入库单号" align="center" prop="receiptOrderNo" width="180"/>
      <el-table-column label="申请日期" align="center" prop="materialDate" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="入库日期" align="center" prop="warehouseDate" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.warehouseDate, '{y}-{m}-{d}') }}</span>
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

  </div>
</template>

<script>
import { listInventory } from "@/api/warehouse/inventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "firstInventory",
  components: {SelectMaterial,SelectWarehouse,WarehouseAutocomplete,MaterialAutocomplete},
  data() {
    return {
      // 遮罩层
      loading: true,
      activeName: 'first',
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
      // 库存明细表格数据
      inventoryList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        qty: null,
        materialId: null,
        warehouseId: null,
        warehouseName: null,
        materialName: null,
        unitPrice: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
      }
    };
  },
  created() {
    this.getList();
  },
  mounted() {
    listWarehouse().then((res) => {
      this.restaurants = res.rows;
    });
  },
  methods: {
    getTotalSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        if(index === 4 || index === 5 || index === 6){
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
    querySearchAsync(queryString, cb) {
      const res = this.restaurants;
      if(res.length>0) {
        res.forEach(item => {
          item.value = item.name;
        })
      }

      let results = res.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1;
      })
      cb(results);
    },
    /** 查询库存明细列表 */
    getList() {
      this.loading = true;
      listInventory(this.queryParams).then(response => {
        this.inventoryList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
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
        qty: null,
        materialId: null,
        warehouseId: null,
        unitPrice: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null
      };
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
      this.queryParams.warehouseName = null;
      this.queryParams.materialName = null;
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('warehouse/inventory/export', {
        ...this.queryParams
      }, `inventory_${new Date().getTime()}.xlsx`)
    },
  }

};
</script>
