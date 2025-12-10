<template>
  <div class="report-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">

      <el-row class="query-row-left">
        <el-col :span="24">
          <el-form-item label="计划单号" prop="planNo" class="query-item-inline">
            <el-input v-model="queryParams.planNo"
                      placeholder="请输入计划单号"
                      clearable
                      style="width: 180px"
                      @keyup.enter.native="handleQuery"
            />
          </el-form-item>
          <el-form-item label="供应商" prop="supplierId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectSupplier v-model="queryParams.supplierId"/>
            </div>
          </el-form-item>
          <el-form-item label="仓库" prop="warehouseId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectWarehouse v-model="queryParams.warehouseId"/>
            </div>
          </el-form-item>
          <el-form-item label="耗材" prop="materialId" class="query-item-inline">
            <div class="query-select-wrapper">
              <SelectMaterial v-model="queryParams.materialId" />
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
          <el-form-item label="单据状态" prop="planStatus" class="query-item-status-aligned">
            <el-select v-model="queryParams.planStatus" placeholder="全部"
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
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetQuery"
        >重置</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
        >导出</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="reportList"
              show-summary
              :summary-method="getSummaries"
              height="51vh"
              border>
      <el-table-column type="index" label="序号" width="80" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          {{ (queryParams.pageNum - 1) * queryParams.pageSize + scope.$index + 1 }}
        </template>
      </el-table-column>
      <el-table-column label="计划单号" align="center" prop="planNo" width="180" show-overflow-tooltip resizable/>
      <el-table-column label="耗材编码" align="center" prop="materialCode" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="耗材名称" align="center" prop="materialName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="规格" align="center" prop="materialSpec" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="单位" align="center" prop="materialUnit" width="80" show-overflow-tooltip resizable/>
      <el-table-column label="供应商" align="center" prop="supplierName" width="160" show-overflow-tooltip resizable/>
      <el-table-column label="仓库" align="center" prop="warehouseName" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="数量" align="center" prop="qty" width="100" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.qty">{{ scope.row.qty }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="单价" align="center" prop="price" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.price">{{ scope.row.price | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="金额" align="center" prop="amt" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.amt">{{ scope.row.amt | formatCurrency}}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单日期" align="center" prop="createTime" width="180" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <span v-if="scope.row.createTime">{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
          <span v-else>--</span>
        </template>
      </el-table-column>
      <el-table-column label="制单人" align="center" prop="createBy" width="120" show-overflow-tooltip resizable/>
      <el-table-column label="计划状态" align="center" prop="planStatus" width="120" show-overflow-tooltip resizable>
        <template slot-scope="scope">
          <dict-tag :options="dict.type.biz_status" :value="scope.row.planStatus"/>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="dataLoaded"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="handlePagination"
    />
  </div>
</template>

<script>
import { listPurchasePlan, getPurchasePlan } from "@/api/caigou/purchasePlan";
import SelectSupplier from '@/components/SelectModel/SelectSupplier';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';

export default {
  name: "PlanDetailReport",
  dicts: ['biz_status'],
  components: {SelectSupplier,SelectMaterial,SelectWarehouse},
  data() {
    return {
      // 遮罩层
      loading: true,
      // 显示搜索条件
      showSearch: true,
      // 总条数
      total: 0,
      // 所有明细数据（未分页）
      allDetailList: [],
      // 报表数据（分页后）
      reportList: [],
      // 是否已加载数据（用于控制分页显示）
      dataLoaded: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        planNo: null,
        supplierId: null,
        warehouseId: null,
        materialId: null,
        planStatus: null,
        beginDate: null,
        endDate: null,
      }
    };
  },
  created() {
    this.queryParams.beginDate = this.getStatDate();
    this.queryParams.endDate = this.getEndDate();
    this.getList();
  },
  methods: {
    /** 查询报表列表 */
    getList() {
      this.loading = true;
      this.dataLoaded = false;
      // 构建查询参数，确保日期字段正确
      const params = {
        ...this.queryParams,
        // 确保日期字段名正确
        beginDate: this.queryParams.beginDate,
        endDate: this.queryParams.endDate
      };
      // 移除空值参数
      Object.keys(params).forEach(key => {
        if (params[key] === null || params[key] === undefined || params[key] === '') {
          delete params[key];
        }
      });
      
      console.log('查询参数:', params);
      
      // 先获取计划列表
      listPurchasePlan(params).then(response => {
        console.log('计划列表响应:', response);
        const planList = response.rows || [];
        
        if (planList.length === 0) {
          this.allDetailList = [];
          this.reportList = [];
          this.total = 0;
          this.dataLoaded = true;
          this.loading = false;
          return;
        }
        
        // 批量获取每个计划的明细数据
        this.fetchPlanDetails(planList);
      }).catch(error => {
        console.error('获取计划列表失败:', error);
        this.reportList = [];
        this.total = 0;
        this.loading = false;
      });
    },
    /** 批量获取计划明细数据 */
    fetchPlanDetails(planList) {
      console.log('开始获取计划明细，计划数量:', planList.length);
      
      // 使用 Promise.all 并发获取所有计划的明细
      const detailPromises = planList.map(plan => {
        if (!plan.id) {
          console.warn('计划没有ID:', plan);
          return Promise.resolve({
            ...plan,
            purchasePlanEntryList: []
          });
        }
        
        return getPurchasePlan(plan.id).then(response => {
          console.log(`计划 ${plan.planNo} (ID: ${plan.id}) 详情响应:`, response);
          const entryList = response.data?.purchasePlanEntryList || response.data?.purchasePlanEntryList || [];
          console.log(`计划 ${plan.planNo} 的明细条数:`, entryList.length);
          return {
            ...plan,
            purchasePlanEntryList: entryList
          };
        }).catch(error => {
          console.error(`获取计划 ${plan.planNo} (ID: ${plan.id}) 明细失败:`, error);
          return {
            ...plan,
            purchasePlanEntryList: []
          };
        });
      });
      
      Promise.all(detailPromises).then(plansWithDetails => {
        console.log('所有计划明细数据:', plansWithDetails);
        console.log('明细数据统计:', plansWithDetails.map(p => ({
          planNo: p.planNo,
          entryCount: (p.purchasePlanEntryList || []).length
        })));
        
        // 处理数据，将计划明细展开
        const detailList = this.processPlanData(plansWithDetails);
        console.log('展开后的明细数据条数:', detailList.length);
        
        // 根据查询条件过滤明细数据
        const filteredList = this.filterDetailData(detailList);
        console.log('过滤后的明细数据条数:', filteredList.length);
        
        // 保存所有明细数据
        this.allDetailList = filteredList;
        // 明细条数作为总数
        this.total = filteredList.length;
        
        // 应用分页
        this.applyPagination();
        this.dataLoaded = true;
        this.loading = false;
      }).catch(error => {
        console.error('批量获取明细数据失败:', error);
        this.allDetailList = [];
        this.reportList = [];
        this.total = 0;
        this.dataLoaded = true;
        this.loading = false;
      });
    },
    /** 根据查询条件过滤明细数据 */
    filterDetailData(detailList) {
      let filtered = detailList;
      
      // 如果后端接口不支持按耗材查询，前端过滤
      if (this.queryParams.materialId) {
        filtered = filtered.filter(item => {
          // 匹配耗材ID
          const itemMaterialId = item.materialId || '';
          const queryMaterialId = String(this.queryParams.materialId);
          return itemMaterialId === queryMaterialId || String(itemMaterialId) === queryMaterialId;
        });
      }
      
      return filtered;
    },
    /** 处理计划数据，展开明细 */
    processPlanData(planList) {
      const detailList = [];
      if (planList && planList.length > 0) {
        planList.forEach(plan => {
          // 检查是否有明细数据
          const entryList = plan.purchasePlanEntryList || plan.entryList || [];
          console.log(`计划单 ${plan.planNo} 的明细数据:`, entryList, '类型:', typeof entryList, '长度:', entryList?.length);
          
          if (entryList && Array.isArray(entryList) && entryList.length > 0) {
            entryList.forEach((entry, index) => {
              console.log(`处理明细项 ${index}:`, entry);
              // 获取耗材ID，用于过滤
              const materialId = entry.materialId || (entry.material && entry.material.id) || '';
              
              // 获取耗材信息
              const material = entry.material || {};
              const materialCode = entry.materialCode || material.code || '';
              const materialName = entry.materialName || material.name || '';
              const materialSpec = entry.speci || entry.materialSpec || material.speci || '';
              const materialUnit = entry.materialUnit || (material.fdUnit && material.fdUnit.unitName) || '';
              
              detailList.push({
                planNo: plan.planNo,
                materialId: materialId,
                materialCode: materialCode,
                materialName: materialName,
                materialSpec: materialSpec,
                materialUnit: materialUnit,
                supplierName: entry.supplierName || (material.supplier && material.supplier.name) || '',
                warehouseName: plan.warehouseName || (plan.warehouse && plan.warehouse.name) || '',
                qty: entry.qty || 0,
                price: entry.price || 0,
                amt: entry.amt || 0,
                createTime: plan.createTime || plan.planDate,
                createBy: plan.createBy || '',
                planStatus: plan.planStatus
              });
            });
          } else {
            // 如果没有明细数据，记录警告
            console.warn('计划单没有明细数据:', plan.planNo, 'entryList:', entryList);
          }
        });
      } else {
        console.warn('计划列表为空或未返回数据');
      }
      console.log('处理后的明细数据条数:', detailList.length);
      if (detailList.length > 0) {
        console.log('第一条明细数据示例:', detailList[0]);
      }
      return detailList;
    },
    getStatDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let statDate = myDate.getFullYear().toString() + "-"  + month + "-" + "01";
      return statDate;
    },
    getEndDate(){
      let myDate = new Date();
      let month = myDate.getMonth() + 1;
      month = month < 10 ? "0" + month : month;
      let dayEnd = new Date(myDate.getFullYear(), month, 0).getDate();
      let endDate = myDate.getFullYear().toString() + "-" + month  + "-" + dayEnd;
      return endDate;
    },
    /** 应用分页 */
    applyPagination() {
      const { pageNum, pageSize } = this.queryParams;
      const start = (pageNum - 1) * pageSize;
      const end = start + pageSize;
      this.reportList = this.allDetailList.slice(start, end);
    },
    /** 分页变化事件 */
    handlePagination() {
      this.applyPagination();
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
    /** 合计行计算 */
    getSummaries(param) {
      const { columns, data } = param;
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        if (column.property === 'qty' || column.property === 'amt') {
          const values = data.map(item => Number(item[column.property]) || 0);
          if (!values.every(value => isNaN(value))) {
            const sum = values.reduce((prev, curr) => {
              const value = Number(curr);
              if (!isNaN(value)) {
                return prev + curr;
              } else {
                return prev;
              }
            }, 0);
            sums[index] = column.property === 'amt' ? 
              this.$options.filters.formatCurrency(sum) : 
              sum.toFixed(2);
          } else {
            sums[index] = '--';
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('caigou/purchasePlan/export', {
        ...this.queryParams
      }, `采购计划明细表_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.report-container {
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

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

.query-status-col {
  position: absolute;
  left: 552px;
  width: auto;
  padding-left: 0;
  padding-right: 0;
  display: flex;
  align-items: center;
}

.query-item-status-aligned {
  margin-left: 0;
}

.query-item-status-aligned .el-form-item__label {
  width: 80px !important;
}
</style>

