<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row>
        <el-col :span="6">
          <div class="block">
            <span class="demonstration" style="padding-left: 50px">月份</span>
            <el-date-picker
              v-model="queryParams.demonstration"
              type="month"
              placeholder="选择月">
            </el-date-picker>
          </div>
        </el-col>

        <el-col :span="12">
          <el-form-item>
            <el-button type="primary" plain icon="el-icon-search" size="mini" @click="handleQuery">搜索</el-button>
            <el-button type="primary" plain icon="el-icon-plus" size="mini" @click="handleQuery">初始化</el-button>
            <el-button type="success" plain icon="el-icon-check" size="mini" @click="monthHandle">月结处理</el-button>
            <el-button type="danger" plain icon="el-icon-delete" size="mini" @click="monthClear">清除月结</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <el-table v-loading="loading" :data="monthInitList"
              show-summary :summary-method="getTotalSummaries">

      <el-table-column label="分类" align="center" prop="wCategoryName" width="160"/>
      <el-table-column label="期初金额" align="center" prop="initAmount" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.initAmount">{{ scope.row.initAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="进项金额" align="center" prop="beginAmount" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.beginAmount">{{ scope.row.beginAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="出项金额" align="center" prop="endAmount" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.endAmount">{{ scope.row.endAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="结存金额" align="center" prop="settleAmount" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.settleAmount">{{ scope.row.settleAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="盘盈金额" align="center" prop="profitAmount" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.profitAmount">{{ scope.row.profitAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="盘亏金额" align="center" prop="loseAmount" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.loseAmount">{{ scope.row.loseAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="结存实物金额" align="center" prop="settleRealityAmount" width="120">
        <template slot-scope="scope">
          <span v-if="scope.row.settleRealityAmount">{{ scope.row.settleRealityAmount | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>

    </el-table>

  </div>
</template>

<script>
import { monthInitDataList,monthHandleData,monthClearData } from "@/api/yj/init";
import SelectMaterial from "@/components/SelectModel/SelectMaterial";
import SelectWarehouse from "@/components/SelectModel/SelectWarehouse";
import WarehouseAutocomplete from "@/components/SelectModel/WarehouseAutocomplete";
import MaterialAutocomplete from "@/components/SelectModel/MaterialAutocomplete";
import { listWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "init",
  dicts: ['bill_type'],
  components: {SelectMaterial,SelectWarehouse,WarehouseAutocomplete,MaterialAutocomplete},
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
      // 月结初始化表格数据
      monthInitList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        demonstration: null,
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
        if(index !== 0){
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] += '';
          } else {
            sums[index] = '';
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
    /** 查询月结初始化列表 */
    getList() {
      this.loading = true;
      let demonstration = this.queryParams.demonstration;
      let query = null;
      if(demonstration != null){
        query = this.getQueryParams(demonstration);
      }
      monthInitDataList(query).then(response => {
        this.monthInitList = response;
        // this.total = response.total;
        this.loading = false;
      });
    },
    getQueryParams(demonstration){
      let statDate = this.getStatDate(demonstration);
      let endDate = this.getEndDate(demonstration);
      let toStatDate = this.getToStatDate(demonstration);
      let toEndDate = this.getToEndDate(demonstration);
      let query = {beginDate:statDate,endDate:endDate,toStatDate:toStatDate,toEndDate:toEndDate};
      return query;
    },
    getStatDate(demonstration){
      let myDate = new Date(demonstration);
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01"; //月初
      return statDate;
    },
    getEndDate(demonstration){
      let myDate = new Date(demonstration);
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd; //月末
      return endDate;
    },
    getToStatDate(demonstration){
      let myDate = new Date(demonstration);
      let year = myDate.getFullYear();
      let month = myDate.getMonth();
      if(month == 0){
        month = 12;
        year = year-1;
      }
      month = month < 10 ? "0" + month : month;
      let toStatDate = year + "-"  + month + "-" + "01"; //月初
      return toStatDate;
    },
    getToEndDate(demonstration){
      let myDate = new Date(demonstration);
      let year = myDate.getFullYear();
      let month = myDate.getMonth();
      if(month == 0){
        month = 12;
        year = year-1;
      }
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate(); //获取当月一共有多少天
      let toEndDate = year + "-" + month  + "-" + dayEnd; //月末
      return toEndDate;
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        materialDate: null,
        warehouseDate: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      if(!this.queryParams.demonstration){
        this.$message({ message: '请先选择月份', type: 'warning' })
        return
      }
      this.getList();
    },
    /** 月结处理按钮操作 */
    monthHandle(){
      if(!this.queryParams.demonstration){
        this.$message({ message: '请先选择月份', type: 'warning' })
        return
      }
      let beginDate = this.getStatDate(this.queryParams.demonstration);
      let endDate = this.getEndDate(this.queryParams.demonstration);
      let query = {beginDate:beginDate,endDate:endDate};
      monthHandleData(query).then(response => {
        if(response.code == 200){
          this.$modal.msgSuccess("处理成功！");
        }
      });
      this.handleQuery();
    },
    /** 清除月结按钮操作 */
    monthClear(){
      if(!this.queryParams.demonstration){
        this.$message({ message: '请先选择月份', type: 'warning' })
        return
      }
      let statDate = this.getStatDate(this.queryParams.demonstration);
      let endDate = this.getEndDate(this.queryParams.demonstration);
      let query = {beginDate:statDate,endDate:endDate};
      monthClearData(query).then(response => {
        if(response.code == 200){
          this.$modal.msgSuccess("清除成功！");
        }
      });
      this.handleQuery();
    },
  }

};
</script>
