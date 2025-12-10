<template>
  <div class="inventory-management">
    <!-- 左侧树形菜单 -->
    <div class="sidebar">
      <el-tree :data="treeData" :props="treeProps" default-expand-all></el-tree>
    </div>

    <!-- 右侧内容区域 -->
    <div class="content">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <el-form inline>
          <el-form-item label="盘点仓库：">
            <el-select v-model="searchForm.warehouse" placeholder="请选择仓库">
              <el-option label="医学检验科试剂室..." value="医学检验科试剂室"></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="耗材名称：">
            <el-input v-model="searchForm.name" placeholder="请输入耗材名称"></el-input>
          </el-form-item>
          <el-form-item label="耗材代号：">
            <el-input v-model="searchForm.code" placeholder="请输入耗材代号"></el-input>
          </el-form-item>
          <el-form-item label="供应商：">
            <el-select v-model="searchForm.supplier" placeholder="请选择供应商">
              <el-option label="请选择供应商" value=""></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="耗材分类：">
            <el-select v-model="searchForm.category" placeholder="请选择耗材分类">
              <el-option label="请选择耗材分类" value=""></el-option>
            </el-select>
          </el-form-item>
          <el-form-item label="条码号：">
            <el-input v-model="searchForm.barcode" placeholder="请扫描条码进行盘点"></el-input>
          </el-form-item>
        </el-form>
      </div>

      <!-- 操作按钮 -->
      <div class="operation-buttons">
        <el-button type="primary">重新盘点</el-button>
        <el-button type="primary">开始盘点</el-button>
        <el-button type="primary">提交盘点</el-button>
        <el-button type="primary">取消盘点</el-button>
      </div>

      <!-- 数据表格 -->
      <div class="data-table">
        <el-table :data="tableData" border style="width: 100%" :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
          <el-table-column type="index" label="序" width="50"></el-table-column>
          <el-table-column prop="code" label="耗材代号"></el-table-column>
          <el-table-column prop="name" label="耗材名称"></el-table-column>
          <el-table-column prop="batch" label="耗材批号"></el-table-column>
          <el-table-column prop="stock" label="库存数"></el-table-column>
          <el-table-column prop="count" label="盘点数"></el-table-column>
          <el-table-column prop="unit" label="单位"></el-table-column>
          <el-table-column prop="spec" label="规格"></el-table-column>
          <el-table-column prop="category" label="耗材分类"></el-table-column>
          <el-table-column prop="price" label="单价"></el-table-column>
          <el-table-column prop="supplier" label="供应商"></el-table-column>
          <el-table-column prop="manufacturer" label="制造商"></el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 右侧信息面板 -->
    <div class="info-panel">
      <div class="panel-header">条码信息</div>
      <div class="panel-content">
        <el-table 
          :data="selectedBarcode ? [selectedBarcode] : []" 
          border 
          style="width: 100%"
          :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
          :fit="true">
          <el-table-column prop="id" label="序号" width="80"></el-table-column>
          <el-table-column prop="status" label="状态" width="100"></el-table-column>
          <el-table-column prop="code" label="条码号" width="auto"></el-table-column>
        </el-table>
        <div v-if="!selectedBarcode" class="no-data">无数据...</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  // 修改数据初始化部分
  data() {
    return {
      treeData: [
        {
          label: '耗材',
          children: [
            { label: '校准品' },
            { label: '质控品' },
            { label: '免疫' },
            { label: '临检' },
            { label: '自配试剂' },
            { label: '危毒品' },
            { label: '生化' },
            { label: '微生物' },
            { label: '输血' }
          ]
        },
        {
          label: '仪器',
          children: [
            { label: '雅培发光' },
            { label: '雅培曼发光' },
            { label: '雅培曼发光' },
            { label: '罗氏发光' },
            { label: '西门子' }
          ]
        }
      ],
      treeProps: {
        label: 'label',
        children: 'children'
      },
      searchForm: {
        warehouse: '医学检验科试剂室',
        name: '',
        code: '',
        supplier: '',
        category: '',
        barcode: ''
      },
      tableData: [{
        code: 'TEST001',
        name: '测试耗材',
        batch: 'BATCH001',
        stock: 10,
        count: 5,
        unit: '个',
        spec: '标准规格',
        category: '测试类',
        price: 100,
        supplier: '测试供应商',
        manufacturer: '测试制造商'
      }],
      selectedBarcode: {  // 修正条件判断逻辑
        id: 1,
        status: '正常',
        code: 'BARCODE123'
      }
    }
  },
  mounted() {
    console.log('组件已挂载', this.tableData, this.selectedBarcode);
    // 检查控制台是否有输出
  }
}
</script>

<style scoped>
.inventory-management {
  display: flex;
  height: calc(91vh); /* 根据实际导航栏高度调整 */
  min-width: 1200px; /* 确保有足够宽度 */
}

.sidebar, .info-panel {
  flex-shrink: 0; /* 防止侧边栏被压缩 */
}

.sidebar {
  width: 200px;
  background-color: #f5f7fa;
  border-right: 1px solid #e4e7ed;
}

.content {
  flex: 1;
  padding: 20px;
}

.search-bar {
  margin-bottom: 15px;
  padding: 10px;
  background-color: #f5f7fa;
  border-radius: 5px;
}

.operation-buttons {
  margin-bottom: 15px;
}

.data-table {
  background-color: #fff;
  border-radius: 5px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 15px;
}

.info-panel {
  width: 280px; /* 稍微加宽面板 */
  background-color: #f5f7fa;
  border-left: 1px solid #e4e7ed;
  padding: 15px;
}

.panel-header {
  font-weight: bold;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.panel-content {
  .el-table {
    width: 100% !important;
    margin-top: 10px;
    
    /* 隐藏横向滚动条 */
    .el-table__body-wrapper {
      overflow-x: hidden;
    }
  }
  
  .no-data {
    text-align: center;
    padding: 20px;
    color: #999;
  }
}
</style>