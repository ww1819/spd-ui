<template>
    <div class="consumable-inventory">
      <!-- 顶部工具栏 -->
      <div class="toolbar">
        <div class="search-box">
          <el-form :inline="true" :model="searchForm" class="compact-form">
            <el-row :gutter="10">
              <!-- 第一行五个条件 -->
              <el-col :span="4.8">
                <el-form-item label="仓库：" class="compact-item">
                  <el-select v-model="searchForm.warehouse" placeholder="请选择仓库"></el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4.8">
                <el-form-item label="供应商：" class="compact-item">
                  <el-select v-model="searchForm.supplier" placeholder="请选择供应商"></el-select>
                </el-form-item>
              </el-col>
              <el-col :span="4.8">
                <el-form-item label="耗材名称：" class="compact-item">
                  <el-input v-model="searchForm.name" placeholder="请输入耗材名称"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4.8">
                <el-form-item label="耗材代号：" class="compact-item">
                  <el-input v-model="searchForm.code" placeholder="请输入耗材代号"></el-input>
                </el-form-item>
              </el-col>
              <el-col :span="4.8">
                <el-form-item label="验证状态：" class="compact-item">
                  <el-select v-model="searchForm.status" placeholder="请选择验证状态"></el-select>
                </el-form-item>
              </el-col>
            </el-row>
            <el-row :gutter="10" class="condition-row">
              <!-- 第二行条件 -->
              <el-col :span="4.8">
                <el-form-item label="过期天数：" class="compact-item">
                  <el-input v-model="searchForm.expiry" placeholder="输入天数内过期耗材"></el-input>
                </el-form-item>
              </el-col>
            </el-row>
            <!-- 按钮行 -->
            <el-row class="button-row">
              <el-col :span="24">
                <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
                <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
                <el-button icon="el-icon-download" @click="handleExport">导出</el-button>
              </el-col>
            </el-row>
          </el-form>
          </div>
        </div>
  
      <!-- 数据表格 -->
      <div class="data-table">
        <el-table :data="tableData" border style="width: 100%" :header-cell-style="{background:'#f5f7fa',color:'#606266'}" height="500">
          <el-table-column type="index" label="序" width="50"></el-table-column>
          <el-table-column prop="code" label="耗材代号" width="150"></el-table-column>
          <el-table-column prop="name" label="耗材名称" min-width="200"></el-table-column>
          <el-table-column prop="udi" label="UDI" width="150"></el-table-column>
          <el-table-column prop="stock" label="库存量" width="80"></el-table-column>
          <el-table-column prop="unit" label="单位" width="60"></el-table-column>
          <el-table-column prop="spec" label="规格" min-width="150"></el-table-column>
          <el-table-column prop="batch" label="批号" width="120"></el-table-column>
          <el-table-column prop="expiryDate" label="有效期" width="120"></el-table-column>
          <el-table-column prop="category" label="耗材分类" width="100"></el-table-column>
          <el-table-column prop="status" label="验证状态" width="100">
            <template #default="scope">
              <el-tag v-if="scope.row.status === '已验证'" type="success">已验证</el-tag>
              <el-tag v-else type="info">未验证</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="price" label="单价" width="80"></el-table-column>
          <el-table-column prop="total" label="总金额" width="100"></el-table-column>
          <el-table-column prop="maxStock" label="库存上限" width="100"></el-table-column>
        </el-table>
      </div>
  
      <!-- 底部工具栏 -->
      <div class="bottom-toolbar">
        <div class="pagination">
          <el-pagination
            layout="prev, pager, next"
            :total="100"
            background
          ></el-pagination>
        </div>
        <div class="summary">
          <span>共469条 / 5页</span>
          <el-pagination
            layout="sizes"
            :page-sizes="[10, 20, 50, 100]"
            :page-size="20"
          ></el-pagination>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        searchForm: {
          warehouse: '',
          supplier: '',
          name: '',
          code: '',
          status: '',
          expiry: ''
        },
        tableData: [
          {
            code: '28000784021',
            name: '人类免疫缺陷病毒抗原抗体检测试剂盒...',
            udi: '',
            stock: 8,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240601',
            expiryDate: '2025-09-08',
            category: '试剂,生化',
            status: '已验证',
            price: 1386,
            total: 11088,
            maxStock: 1680
          },
          {
            code: '28000784021',
            name: '人类免疫缺陷病毒抗原抗体检测试剂盒...',
            udi: '',
            stock: 1,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240401',
            expiryDate: '2025-06-07',
            category: '试剂,生化',
            status: '已验证',
            price: 1386,
            total: -8316,
            maxStock: 1680
          },
          {
            code: '28000784041',
            name: '乙型肝炎病毒核心抗体检测试剂盒...',
            udi: '',
            stock: 9,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240601',
            expiryDate: '2025-07-13',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: 4308,
            maxStock: 1680
          },
          {
            code: '28000784041',
            name: '乙型肝炎病毒核心抗体检测试剂盒...',
            udi: '',
            stock: 10,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240601',
            expiryDate: '2025-07-13',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: 7180,
            maxStock: 1680
          },
          {
            code: '28000784041',
            name: '乙型肝炎病毒核心抗体检测试剂盒...',
            udi: '',
            stock: 1,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240401',
            expiryDate: '2025-05-28',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: -1436,
            maxStock: 1680
          },
          {
            code: '28000784037',
            name: '乙型肝炎病毒抗体检测试剂盒...',
            udi: '',
            stock: 8,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240401',
            expiryDate: '2025-06-20',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: 1436,
            maxStock: 1680
          },
          {
            code: '28000784037',
            name: '乙型肝炎病毒抗体检测试剂盒...',
            udi: '',
            stock: 14,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240401',
            expiryDate: '2025-06-20',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: 10052,
            maxStock: 1680
          },
          {
            code: '28000784038',
            name: '乙型肝炎病毒e抗体检测试剂盒...',
            udi: '',
            stock: 11,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240401',
            expiryDate: '2025-07-03',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: 7898,
            maxStock: 1680
          },
          {
            code: '28000784038',
            name: '乙型肝炎病毒e抗体检测试剂盒...',
            udi: '',
            stock: 20,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240401',
            expiryDate: '2025-07-03',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: 14360,
            maxStock: 1680
          },
          {
            code: '28000704039',
            name: '乙型肝炎病毒表面抗体检测试剂盒...',
            udi: '',
            stock: 9,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20241101',
            expiryDate: '2025-12-06',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: 2154,
            maxStock: 1680
          },
          {
            code: '28000704039',
            name: '乙型肝炎病毒表面抗体检测试剂盒...',
            udi: '',
            stock: 40,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20241101',
            expiryDate: '2025-12-06',
            category: '试剂,生化',
            status: '已验证',
            price: 718,
            total: 28720,
            maxStock: 1680
          },
          {
            code: '28000704039',
            name: '乙型肝炎病毒表面抗体检测试剂盒...',
            udi: '',
            stock: 2,
            unit: '盒',
            spec: 'R1:2x3.5mL+R2:2x4.0mL',
            batch: '20240302',
            expiryDate: '2025-05-18',
            category: '试剂,生化',
            status: '未验证',
            price: 718,
            total: -2154,
            maxStock: 1680
          },
          {
            code: '28000681894',
            name: '丙氨酸氨基转移酶检测试剂盒...',
            udi: '',
            stock: 1,
            unit: '盒',
            spec: '255ml(R1:88ml×3/R2:17ml×3)',
            batch: 'AUZ3264',
            expiryDate: '2025-06-01',
            category: '试剂,生化',
            status: '已验证',
            price: 52.53,
            total: 52.53,
            maxStock: 47600
          },
          {
            code: '28000681894',
            name: '丙氨酸氨基转移酶检测试剂盒...',
            udi: '',
            stock: 2,
            unit: '盒',
            spec: '255ml(R1:88ml×3/R2:17ml×3)',
            batch: 'AUZ3264',
            expiryDate: '2025-06-01',
            category: '试剂,生化',
            status: '已验证',
            price: 52.53,
            total: 52.53,
            maxStock: 47600
          },
          {
            code: '28000681894',
            name: '丙氨酸氨基转移酶检测试剂盒...',
            udi: '',
            stock: 12,
            unit: '盒',
            spec: '255ml(R1:88ml×3/R2:17ml×3)',
            batch: 'AUZ3264',
            expiryDate: '2025-06-01',
            category: '试剂,生化',
            status: '已验证',
            price: 52.53,
            total: 630.36,
            maxStock: 47600
          }
        ]
      };
    },
    methods: {
      handleSearch() {
        console.log('查询条件:', this.searchForm);
        // 这里可以添加查询逻辑
      },
      handleReset() {
        this.searchForm = {
          warehouse: '',
          supplier: '',
          name: '',
          code: '',
          status: '',
          expiry: ''
        };
      },
      handleExport() {
        console.log('导出');
        // 这里可以添加导出逻辑
      }
    }
  };
  </script>
  
  <style scoped>
  .consumable-inventory {
    padding: 20px;
    font-family: 'Arial', sans-serif;
  }
  
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;  /* 修改为flex-start */
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 5px;
  }
  
  .search-box {
    display: flex;
    flex: 1;  /* 添加这行 */
    margin-right: 20px;  /* 添加这行 */
  }
  
  .summary {
    display: flex;
    gap: 20px;
  }
  
  .data-table {
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 15px;
  }
  
  .bottom-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 15px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 5px;
  }
  
  /* 新增紧凑表单样式 */
  .compact-form {
    margin-bottom: 0;
  }
  
  .compact-form .condition-row {
    margin-top: 8px;  /* 减少行间距 */
  }
  
  .compact-form .button-row {
    margin-top: 8px;  /* 减少按钮行间距 */
  }
  
  .compact-form .compact-item {
    margin-bottom: 8px;  /* 减少表单项间距 */
  }
  
  /* 原有样式保持不变 */
  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 5px;
  }
  </style>