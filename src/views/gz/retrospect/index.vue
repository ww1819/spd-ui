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
          <el-form-item label="单价" prop="unitPrice" label-width="100px">
            <el-input
              v-model="queryParams.unitPrice"
              placeholder="请输入单价"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
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

    <el-table v-loading="loading" :data="depotInventoryList" @selection-change="handleSelectionChange">
      <el-table-column label="耗材编码" align="center" prop="material.id" width="80"/>
      <el-table-column label="耗材" align="center" prop="material.name" width="160"/>
      <el-table-column label="收费编码" align="center" width="160"/>
      <el-table-column label="病人姓名" align="center" width="80"/>
      <el-table-column label="病人性别" align="center" width="80"/>
      <el-table-column label="手术医生" align="center" width="160"/>
      <el-table-column label="手术诊断" align="center" width="160"/>
      <el-table-column label="计费时间" align="center" width="160"/>
      <el-table-column label="UDI码" align="center" width="160"/>
      <el-table-column label="主条码" align="center" width="160"/>
      <el-table-column label="辅条码" align="center" width="160"/>

      <el-table-column label="耗材日期" align="center" prop="materialDate" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.materialDate, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
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
      <el-table-column label="高值入库日期" align="center" prop="warehouseDate" width="160">
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
import { listDepotInventory } from "@/api/gz/depotInventory";
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import {listWarehouse} from "@/api/foundation/warehouse";

export default {
  name: "RetrospectInventory",
  components: {WarehouseAutocomplete,MaterialAutocomplete},
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
      // 高值备货库存明细表格数据
      depotInventoryList: [],
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
        amt: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null,
        supplierId: null
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
    /** 查询高值备货库存明细列表 */
    getList() {
      this.loading = true;
      listDepotInventory(this.queryParams).then(response => {
        // this.depotInventoryList = response.rows;
        // this.total = response.total;
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
        amt: null,
        batchNo: null,
        materialNo: null,
        materialDate: null,
        warehouseDate: null,
        supplierId: null
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
      this.download('gz/depotInventory/export', {
        ...this.queryParams
      }, `depotInventory_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>
