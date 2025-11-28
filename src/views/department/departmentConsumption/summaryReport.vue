<template>
  <div class="department-consumption-container">
    <div class="title-section">
      <h3>科室消耗追溯汇总报表</h3>
    </div>
    
    <!-- 查询条件区域 -->
    <div class="search-section">
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="科室" prop="departmentId" label-width="100px">
          <SelectDepartment v-model="searchForm.departmentId" />
        </el-form-item>
        
        <el-form-item label="耗材" prop="materialId" label-width="100px">
          <SelectMaterial v-model="searchForm.materialId" />
        </el-form-item>
        <el-form-item label="耗材名称">
          <el-input v-model="searchForm.materialName" placeholder="请输入耗材名称" clearable />
        </el-form-item>
        <el-form-item label="规格">
          <el-input v-model="searchForm.specification" placeholder="请输入规格" clearable />
        </el-form-item>
        <el-form-item label="型号">
          <el-input v-model="searchForm.model" placeholder="请输入型号" clearable />
        </el-form-item>
        <el-form-item label="HIS收费编码">
          <el-input v-model="searchForm.hisChargeCode" placeholder="请输入HIS收费编码" clearable />
        </el-form-item>
        <el-form-item label="患者住院号/门诊号">
          <el-input v-model="searchForm.patientId" placeholder="请输入患者住院号/门诊号" clearable />
        </el-form-item>
        <el-form-item label="日期范围">
          <el-date-picker
            v-model="searchForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <!-- 数据表格区域 -->
    <div class="table-section">
      <el-table
        :data="tableData"
        style="width: 100%"
        stripe
        border
        @sort-change="handleSortChange"
        show-summary
        :summary-method="getSummaries"
      >
        <el-table-column type="index" label="序号" width="80" />
        <el-table-column prop="departmentName" label="科室" min-width="120" sortable />
        <el-table-column prop="materialName" label="名称" min-width="150" sortable />
        <el-table-column prop="specification" label="规格" min-width="120" />
        <el-table-column prop="model" label="型号" min-width="120" />
        <el-table-column prop="unit" label="单位" min-width="80" />
        <el-table-column prop="totalQuantity" label="消耗数量" min-width="120" sortable />
        <el-table-column prop="totalAmount" label="消耗金额" min-width="120" sortable>
          <template slot-scope="scope">
            {{ formatCurrency(scope.row.totalAmount) }}
          </template>
        </el-table-column>
        <el-table-column prop="averagePrice" label="平均单价" min-width="120" sortable>
          <template slot-scope="scope">
            {{ formatCurrency(scope.row.averagePrice) }}
          </template>
        </el-table-column>
        <el-table-column prop="usageRate" label="使用率(%)" min-width="120" sortable>
          <template slot-scope="scope">
            {{ formatPercentage(scope.row.usageRate) }}
          </template>
        </el-table-column>
        <el-table-column prop="category" label="耗材分类" min-width="120" />
      </el-table>
      
      <!-- 分页组件 -->
      <div class="pagination-section">
        <el-pagination
          v-model="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
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
      // 表格数据
      tableData: [],
      // 分页信息
      currentPage: 1,
      pageSize: 20,
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
      this.currentPage = 1
      this.getDepartmentConsumptionSummary()
    },
    
    // 重置查询条件
    resetSearch() {
        this.searchForm = {
          departmentId: '',
          materialId: '',
          materialName: '',
          specification: '',
          model: '',
          hisChargeCode: '',
          patientId: '',
          dateRange: []
        }
        this.currentPage = 1
        this.getDepartmentConsumptionSummary()
      },
    
    // 处理排序变化
    handleSortChange({ prop, order }) {
      this.sortProp = prop
      this.sortOrder = order
      this.getDepartmentConsumptionSummary()
    },
    
    // 处理页面大小变化
    handleSizeChange(size) {
      this.pageSize = size
      this.getDepartmentConsumptionSummary()
    },
    
    // 处理当前页码变化
    handleCurrentChange(current) {
      this.currentPage = current
      this.getDepartmentConsumptionSummary()
    },
    
    // 获取科室消耗汇总数据
    getDepartmentConsumptionSummary() {
      // 构建查询参数
      const params = {
        ...this.searchForm,
        page: this.currentPage,
        pageSize: this.pageSize
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
      //   })
      
      // 模拟数据
      this.mockDepartmentConsumptionSummary()
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
      for (let i = 0; i < this.pageSize; i++) {
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
      const sums = [];
      columns.forEach((column, index) => {
        if (index === 0) {
          sums[index] = '合计';
          return;
        }
        const values = data.map(item => Number(item[column.property]));
        // 只对数量和金额进行汇总
        if (column.property === 'totalQuantity' || column.property === 'totalAmount') {
          if (!values.every(value => isNaN(value))) {
            sums[index] = values.reduce((prev, curr) => {
              const value = Number(curr);
              return isNaN(value) ? prev : prev + value;
            }, 0);
            if (column.property === 'totalAmount') {
              sums[index] = sums[index].toFixed(2);
            }
          } else {
            sums[index] = '--';
          }
        } else if (column.property === 'usageRate') {
          // 计算平均使用率
          if (!values.every(value => isNaN(value))) {
            const avgRate = values.reduce((prev, curr) => {
              const value = Number(curr);
              return isNaN(value) ? prev : prev + value;
            }, 0) / values.length;
            sums[index] = avgRate.toFixed(2);
          } else {
            sums[index] = '--';
          }
        } else {
          sums[index] = '';
        }
      });
      return sums;
    }
  }
}
</script>

<style scoped>
.department-consumption-container {
  padding: 20px;
  background-color: #ffffff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.title-section {
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.title-section h3 {
  margin: 0;
  color: #303133;
  font-size: 18px;
  font-weight: 500;
}

.search-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 4px;
  margin-bottom: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-form {
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
}

.table-section {
  background-color: #ffffff;
  padding: 20px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pagination-section {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

/* 响应式布局 */
@media (max-width: 768px) {
  .department-consumption-container {
    padding: 10px;
  }
  
  .search-form {
    flex-direction: column;
  }
  
  .search-form .el-form-item {
    width: 100%;
  }
}
</style>