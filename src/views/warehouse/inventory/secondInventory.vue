<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
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
      </el-row>

      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>

    </el-form>

    <el-table v-loading="loading" :data="inventoryList"
              show-summary
              @selection-change="handleSelectionChange" 
              height="51vh"
              border>
      <el-table-column type="index" label="序号" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="materialSpeci" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="型号" align="center" prop="materialModel" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="unitName" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="单价" align="center" prop="unitPrice" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.unitPrice">{{ scope.row.unitPrice | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="数量" align="center" prop="materialQty" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="金额" align="center" prop="materialAmt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.materialAmt">{{ scope.row.materialAmt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="厂家" align="center" prop="factoryName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable/>

    </el-table>

    <!-- 手动添加合计信息 -->
    <div v-if="inventoryList.length > 0" style="margin-top: 10px; padding: 10px; background-color: #f5f7fa; border: 1px solid #ebeef5; border-radius: 4px; text-align: right;">
      <span style="margin-right: 20px; font-weight: bold;">
        合计数量：{{ calculateTotalQty }}
      </span>
      <span style="margin-right: 20px; font-weight: bold;">
        合计金额：{{ calculateTotalAmt }}
      </span>
    </div>

    <!-- 汇总查询不需要分页 -->
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
import { listInventorySummary, listInventory } from "@/api/warehouse/inventory";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "secondInventory",
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
      totalInfo:{
        totalQty: 0,
        totalAmt:0
      },

      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialId: null,
        warehouseId: null,
        warehouseName: null,
        materialName: null
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
  computed: {
    // 计算合计数量
    calculateTotalQty() {
      // 添加调试日志以监控数据处理
      const totalQty = this.inventoryList.reduce((sum, item) => {
        const qty = Number(item.materialQty) || 0;
        return sum + qty;
      }, 0);
      console.log('计算合计数量:', totalQty);
      return totalQty.toFixed(2);
    },
    // 计算合计金额
    calculateTotalAmt() {
      const totalAmt = this.inventoryList.reduce((sum, item) => {
        const amt = Number(item.materialAmt) || 0;
        return sum + amt;
      }, 0);
      console.log('计算合计金额:', totalAmt);
      return '￥' + totalAmt.toFixed(2);
    }
  },
  methods: {
    // 表格合计方法 - 参考项目中成功的实现

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
      listInventorySummary(this.queryParams).then(response => {
        // 汇总数据直接赋值，不使用分页结构
        this.inventoryList = Array.isArray(response) ? response : (response.rows || []);
        this.total = response.total;
        this.loading = false;
        console.log('汇总数据加载完成，共', this.total, '条记录');
      }).catch(error => {
        console.error('汇总数据加载失败:', error);
        this.inventoryList = [];
        this.total = 0;
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
