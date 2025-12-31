<template>
  <div class="app-container">
    <div class="query-container">
      <div class="form-fields-container">
        <el-form :model="searchForm" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="80px">
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="科室" prop="departmentId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectDepartment v-model="searchForm.departmentId" />
                </div>
              </el-form-item>
              <el-form-item label="耗材" prop="materialId" class="query-item-inline">
                <div class="query-select-wrapper">
                  <SelectMaterial v-model="searchForm.materialId" />
                </div>
              </el-form-item>
              <el-form-item label="耗材名称" prop="materialName" class="query-item-inline">
                <el-input v-model="searchForm.materialName" placeholder="请输入耗材名称" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="规格" prop="specification" class="query-item-inline">
                <el-input v-model="searchForm.specification" placeholder="请输入规格" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="型号" prop="model" class="query-item-inline">
                <el-input v-model="searchForm.model" placeholder="请输入型号" clearable style="width: 180px" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row class="query-row-left">
            <el-col :span="24">
              <el-form-item label="HIS收费编码" prop="hisChargeCode" class="query-item-inline">
                <el-input v-model="searchForm.hisChargeCode" placeholder="请输入HIS收费编码" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="患者住院号/门诊号" prop="patientId" class="query-item-inline">
                <el-input v-model="searchForm.patientId" placeholder="请输入患者住院号/门诊号" clearable style="width: 180px" />
              </el-form-item>
              <el-form-item label="日期范围" prop="dateRange" class="query-item-inline">
                <el-date-picker
                  v-model="searchForm.dateRange"
                  type="daterange"
                  range-separator="至"
                  start-placeholder="开始日期"
                  end-placeholder="结束日期"
                  value-format="yyyy-MM-dd"
                  clearable
                  style="width: 240px"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>
    </div>

    <el-row :gutter="10" class="mb8" style="padding-top: 0px; margin-top: 0px; margin-bottom: 16px;">
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleSearch"
        >搜索</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          icon="el-icon-refresh"
          size="small"
          @click="resetSearch"
        >重置</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="handleSearch"></right-toolbar>
    </el-row>

    <div class="table-container">
      <el-table
        :data="tableData"
        v-loading="loading"
        :row-class-name="tableDataIndex"
        height="54vh"
        border
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip resizable />
        <el-table-column label="科室" align="center" prop="departmentName" width="120" show-overflow-tooltip resizable />
        <el-table-column label="名称" align="center" prop="materialName" width="150" show-overflow-tooltip resizable />
        <el-table-column label="规格" align="center" prop="specification" width="120" show-overflow-tooltip resizable />
        <el-table-column label="型号" align="center" prop="model" width="120" show-overflow-tooltip resizable />
        <el-table-column label="单位" align="center" prop="unit" width="80" show-overflow-tooltip resizable />
        <el-table-column label="消耗数量" align="center" prop="totalQuantity" width="120" show-overflow-tooltip resizable />
        <el-table-column label="消耗金额" align="center" prop="totalAmount" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.totalAmount">{{ formatCurrency(scope.row.totalAmount) }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="平均单价" align="center" prop="averagePrice" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.averagePrice">{{ formatCurrency(scope.row.averagePrice) }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="使用率(%)" align="center" prop="usageRate" width="120" show-overflow-tooltip resizable>
          <template slot-scope="scope">
            <span v-if="scope.row.usageRate !== null && scope.row.usageRate !== undefined">{{ formatPercentage(scope.row.usageRate) }}</span>
            <span v-else>--</span>
          </template>
        </el-table-column>
        <el-table-column label="耗材分类" align="center" prop="category" width="120" show-overflow-tooltip resizable />
      </el-table>
    </div>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="handleSearch"
    />
  </div>
</template>

<script>
import SelectDepartment from '@/components/SelectModel/SelectDepartment';
import SelectMaterial from '@/components/SelectModel/SelectMaterial';

export default {
  name: 'SummaryReport',
  components: { SelectDepartment, SelectMaterial },
  data() {
    return {
      // 遮罩层
      loading: false,
      // 显示搜索条件
      showSearch: true,
      // 查询表单
      searchForm: {
        departmentId: '',
        materialId: '',
        materialName: '',
        specification: '',
        model: '',
        hisChargeCode: '',
        patientId: '',
        dateRange: []
      },
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10
      },
      // 表格数据
      tableData: [],
      // 总条数
      total: 0,
      // 排序信息
      sortProp: '',
      sortOrder: ''
    }
  },
  created() {
    // 组件创建时获取初始数据
    this.getDepartmentConsumptionSummary()
  },
  methods: {
    // 格式化金额
    formatCurrency(value) {
      if (!value && value !== 0) return '0.00'
      return Number(value).toFixed(2)
    },
    
    // 格式化百分比
    formatPercentage(value) {
      if (!value && value !== 0) return '0.00'
      return Number(value).toFixed(2)
    },
    
    // 查询数据
    handleSearch() {
      this.queryParams.pageNum = 1
      this.getDepartmentConsumptionSummary()
    },
    
    // 重置查询条件
    resetSearch() {
      this.resetForm("queryForm")
      this.queryParams.pageNum = 1
      this.handleSearch()
    },
    
    // 处理排序变化
    handleSortChange({ prop, order }) {
      this.sortProp = prop
      this.sortOrder = order
      this.getDepartmentConsumptionSummary()
    },
    
    // 序号生成
    tableDataIndex({ row, rowIndex }) {
      const pageNum = Math.max(1, parseInt(this.queryParams.pageNum, 10));
      const pageSize = Math.max(1, parseInt(this.queryParams.pageSize, 10));
      row.index = (pageNum - 1) * pageSize + rowIndex + 1;
    },
    
    // 获取科室消耗汇总数据
    getDepartmentConsumptionSummary() {
      this.loading = true
      // 构建查询参数
      const params = {
        ...this.searchForm,
        pageNum: this.queryParams.pageNum,
        pageSize: this.queryParams.pageSize
      }
      
      // 添加排序参数
      if (this.sortProp && this.sortOrder) {
        params.sortField = this.sortProp
        params.sortOrder = this.sortOrder === 'ascending' ? 'asc' : 'desc'
      }
      
      // 模拟API调用（实际项目中替换为真实API调用）
      // this.$axios.get('/api/department/consumption/summary', { params })
      //   .then(res => {
      //     this.tableData = res.data.list
      //     this.total = res.data.total
      //     this.loading = false
      //   })
      
      // 模拟数据
      setTimeout(() => {
        this.mockDepartmentConsumptionSummary()
        this.loading = false
      }, 300)
    },
    
    // 模拟科室消耗汇总数据
    mockDepartmentConsumptionSummary() {
      // 生成模拟数据
      const mockData = []
      const departments = ['内科', '外科', '妇产科', '儿科', '眼科', '口腔科', '耳鼻喉科', '皮肤科']
      const materials = [
        { name: '一次性使用无菌注射器', spec: '2ml', model: 'SYR-2', unit: '支', category: '注射穿刺器械' },
        { name: '医用外科口罩', spec: '成人型', model: 'MKZ-1', unit: '个', category: '医用卫生材料及敷料' },
        { name: '一次性使用手术衣', spec: 'XL', model: 'SY-1', unit: '件', category: '医用卫生材料及敷料' },
        { name: '医用橡胶手套', spec: '无粉', model: 'G-1', unit: '副', category: '医用卫生材料及敷料' },
        { name: '一次性使用输液器', spec: '0.55mm', model: 'SYQ-1', unit: '套', category: '注射穿刺器械' },
        { name: '医用纱布', spec: '8cm×8cm', model: 'SB-1', unit: '包', category: '医用卫生材料及敷料' },
        { name: '医用脱脂棉', spec: '500g', model: 'TM-1', unit: '包', category: '医用卫生材料及敷料' },
        { name: '医用胶带', spec: '2cm×10m', model: 'JD-1', unit: '卷', category: '医用卫生材料及敷料' }
      ]
      
      // 生成当前页数据
      for (let i = 0; i < this.queryParams.pageSize; i++) {
        const material = materials[Math.floor(Math.random() * materials.length)]
        const totalQuantity = Math.floor(Math.random() * 1000) + 100
        const averagePrice = Math.random() * 50 + 5
        const totalAmount = totalQuantity * averagePrice
        const usageRate = Math.random() * 100
        
        mockData.push({
          departmentName: departments[Math.floor(Math.random() * departments.length)],
          materialName: material.name,
          specification: material.spec,
          model: material.model,
          unit: material.unit,
          totalQuantity: totalQuantity,
          totalAmount: totalAmount,
          averagePrice: averagePrice,
          usageRate: usageRate,
          category: material.category
        })
      }
      
      // 设置表格数据和总数
      this.tableData = mockData
      this.total = 400 // 模拟总数
    },
    
    // 表格汇总方法
    getSummaries(param) {
      const { columns, data } = param;
      const sums = Array(columns.length).fill('');
      
      // 第一列显示"合计"
      sums[0] = '合计';
      
      // 计算合计数量和金额
      let totalQty = 0;
      let totalAmt = 0;
      
      // 计算总和
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        totalQty += Number(item.totalQuantity || 0);
        totalAmt += Number(item.totalAmount || 0);
      }
      
      // 遍历所有列，为指定列设置合计值
      columns.forEach((column, index) => {
        if (column.property === 'totalQuantity') {
          sums[index] = totalQty.toFixed(2);
        } else if (column.property === 'totalAmount') {
          sums[index] = '￥' + totalAmt.toFixed(2);
        }
      });
      
      return sums;
    }
  }
}
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

/* 查询容器样式 */
.query-container {
  margin-top: -20px;
  margin-bottom: 16px;
}

/* 查询条件容器框样式 */
.form-fields-container {
  background: #fff;
  padding: 16px 20px;
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

/* 加粗表格底部滚动条，提升可操作性 */
.table-container ::-webkit-scrollbar {
  height: 12px;
}

.table-container ::-webkit-scrollbar-thumb {
  height: 12px;
  border-radius: 6px;
}
</style>