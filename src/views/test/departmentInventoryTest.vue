<template>
  <div class="app-container">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>科室库存查询测试</span>
      </div>
      
      <!-- 查询条件 -->
      <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="100px">
        <el-form-item label="科室名称" prop="ksName">
          <el-input
            v-model="queryParams.ksName"
            placeholder="请输入科室名称"
            clearable
            size="small"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="耗材名称" prop="hcName">
          <el-input
            v-model="queryParams.hcName"
            placeholder="请输入耗材名称"
            clearable
            size="small"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="耗材编码" prop="hcCode">
          <el-input
            v-model="queryParams.hcCode"
            placeholder="请输入耗材编码"
            clearable
            size="small"
            style="width: 200px"
          />
        </el-form-item>
        <el-form-item label="期初日期" prop="qcDate">
          <el-date-picker
            v-model="queryParams.qcDate"
            type="date"
            placeholder="选择期初日期"
            size="small"
            style="width: 200px"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item label="结束日期" prop="endDate">
          <el-date-picker
            v-model="queryParams.endDate"
            type="date"
            placeholder="选择结束日期"
            size="small"
            style="width: 200px"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
          <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 数据表格 -->
      <div style="overflow-x: auto;">
        <el-table
          v-loading="loading"
          :data="departmentInventoryList"
          style="width: 100%; min-width: 1800px;"
          border
          stripe
          size="small"
        >
          <el-table-column label="科室编码" align="center" prop="ks_CODE" />
          <el-table-column label="科室名称" align="center" prop="ks_NAME" />
          <el-table-column label="产品编码" align="center" prop="hc_CODE" />
          <el-table-column label="产品名称" align="center" prop="hc_NAME" />
          <el-table-column label="规格" align="center" prop="gg" />
          <el-table-column label="型号" align="center" prop="xh" />
          <el-table-column label="单位" align="center" prop="dw" />
          <el-table-column label="期初数量" align="center" prop="qc_SL" />
          <el-table-column label="期初金额" align="center" prop="qc_JE" />
          <el-table-column label="出库数量" align="center" prop="ck_SL" />
          <el-table-column label="出库金额" align="center" prop="ck_JE" />
          <el-table-column label="退库数量" align="center" prop="tk_SL" />
          <el-table-column label="退库金额" align="center" prop="tk_JE" />
          <el-table-column label="调拨转入数量" align="center" prop="dr_SL" />
          <el-table-column label="调拨转入金额" align="center" prop="dr_JE" />
          <el-table-column label="调拨转出数量" align="center" prop="dc_SL" />
          <el-table-column label="调拨转出金额" align="center" prop="dc_JE" />
          <el-table-column label="科室消耗数量" align="center" prop="ksxh_SL" />
          <el-table-column label="科室消耗金额" align="center" prop="ksxh_JE" />
          <el-table-column label="计费数量" align="center" prop="zzj_SL" />
          <el-table-column label="计费金额" align="center" prop="zzj_JE" />
          <el-table-column label="退费数量" align="center" prop="zzt_SL" />
          <el-table-column label="退费金额" align="center" prop="zzt_JE" />
          <el-table-column label="结存数量" align="center" prop="jc_SL" />
          <el-table-column label="结存金额" align="center" prop="jc_JE" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script>
import { listDepartmentInventory } from "@/api/warehouse/departmentInventory";

export default {
  name: "DepartmentInventoryTest",
  data() {
    return {
      // 遮罩层
      loading: true,
      // 科室库存列表
      departmentInventoryList: [],
      // 查询参数
      queryParams: {
        ksName: '',
        hcName: '',
        hcCode: '',
        qcDate: '',
        endDate: ''
      }
    };
  },
  created() {
    // this.getList();
  },
  methods: {
    /** 查询科室库存列表 */
    getList() {
      this.loading = true;
      listDepartmentInventory(this.queryParams).then(response => {
        this.departmentInventoryList = response.data;
        this.loading = false;
      }).catch(error => {
        console.error('查询失败:', error);
        this.loading = false;
        this.$message.error('查询失败: ' + error.message);
      });
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      // this.handleQuery();
    }
  }
};
</script> 