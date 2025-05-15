<template>
    <div class="inspection-platform">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <el-form inline>
          <el-form-item label="关键字：">
            <el-input v-model="searchForm.keyword" placeholder="请输入检验平台名称、编码..." clearable></el-input>
          </el-form-item>
          <el-form-item label="仪器：">
            <el-input v-model="searchForm.instrument" placeholder="请输入仪器名称" clearable></el-input>
          </el-form-item>
          <el-form-item label="项目：">
            <el-input v-model="searchForm.project" placeholder="请输入项目编码、名称..." clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          </el-form-item>
          <el-form-item>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
  
      <!-- 功能按钮 -->
      <div class="function-buttons">
        <el-button type="primary" icon="el-icon-plus" @click="handleAdd">新增</el-button>
        <el-button type="primary" icon="el-icon-edit" @click="handleEdit">修改</el-button>
        <el-button type="primary" icon="el-icon-download" @click="handleExport">导出</el-button>
        <el-button type="primary" icon="el-icon-upload2" @click="handleImport">导入</el-button>
        <el-button type="primary" icon="el-icon-download" @click="handleTemplateDownload">下载模板</el-button>
      </div>
  
      <!-- 主内容区域 -->
      <div class="content">
        <!-- 左侧表格 -->
        <div class="left-table">
          <el-table :data="platformData" border style="width: 100%" :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="name" label="检验平台名称" sortable></el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="scope">
                <el-tag type="success" size="small">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="rank" label="排序号" width="100" sortable></el-table-column>
            <el-table-column prop="code" label="检验平台编码" width="150"></el-table-column>
          </el-table>
        </div>
  
        <!-- 中间表格 -->
        <div class="middle-table">
          <el-table :data="equipmentData" border style="width: 100%" :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="name" label="设备名称"></el-table-column>
            <el-table-column prop="lab" label="使用实验室"></el-table-column>
            <el-table-column prop="fullName" label="设备全称"></el-table-column>
          </el-table>
        </div>
  
        <!-- 右侧表格 -->
        <div class="right-table">
          <div class="right-table-header">
            <div class="header-left">
              <span>设备名称、编码、全称</span>
              <el-select v-model="filterForm.profession" placeholder="专业：" style="margin-left: 10px;">
                <el-option label="全部" value="全部"></el-option>
              </el-select>
            </div>
            <div class="header-right">
              <el-button icon="el-icon-arrow-left" circle @click="handleMoveLeft"></el-button>
              <el-button icon="el-icon-arrow-right" circle @click="handleMoveRight"></el-button>
              <el-button type="primary" icon="el-icon-check" @click="handleSave">保存</el-button>
            </div>
          </div>
          <el-table :data="selectedEquipmentData" border style="width: 100%" :header-cell-style="{background:'#f5f7fa',color:'#606266'}">
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="name" label="设备名称"></el-table-column>
            <el-table-column prop="lab" label="使用实验室"></el-table-column>
            <el-table-column prop="fullName" label="设备全称"></el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        searchForm: {
          keyword: '',
          instrument: '',
          project: ''
        },
        filterForm: {
          profession: '全部'
        },
        platformData: [
          { name: '生化（体检）', status: '有效', rank: 0, code: '230509001' },
          { name: '生化（门急诊）', status: '有效', rank: 0, code: '230509002' },
          { name: '生化（发光）', status: '有效', rank: 0, code: '230608001' },
          { name: '临检', status: '有效', rank: 6, code: '230614001' },
          { name: '免疫', status: '有效', rank: 0, code: '230614002' },
          { name: '微生物室', status: '有效', rank: 0, code: '230619001' }
        ],
        equipmentData: [
          { name: 'AU5800（体检）', lab: '', fullName: '全自动生化分析仪' },
          { name: 'Sebia电泳', lab: '中央实验室', fullName: 'Sebia电泳' }
        ],
        selectedEquipmentData: [
          { name: '雅培SR4000', lab: '中央实验室', fullName: '雅培化学发光' },
          { name: '贝克曼Image800', lab: '中央实验室', fullName: '贝克曼特定蛋白' },
          { name: 'UF-1000i', lab: '', fullName: '尿沉渣分析仪' }
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
          keyword: '',
          instrument: '',
          project: ''
        };
      },
      handleAdd() {
        console.log('新增');
        // 这里可以添加新增逻辑
      },
      handleEdit() {
        console.log('修改');
        // 这里可以添加修改逻辑
      },
      handleExport() {
        console.log('导出');
        // 这里可以添加导出逻辑
      },
      handleImport() {
        console.log('导入');
        // 这里可以添加导入逻辑
      },
      handleTemplateDownload() {
        console.log('下载模板');
        // 这里可以添加下载模板逻辑
      },
      handleMoveLeft() {
        console.log('移动到左侧');
        // 这里可以添加移动到左侧逻辑
      },
      handleMoveRight() {
        console.log('移动到右侧');
        // 这里可以添加移动到右侧逻辑
      },
      handleSave() {
        console.log('保存');
        // 这里可以添加保存逻辑
      }
    }
  };
  </script>
  
  <style scoped>
  .inspection-platform {
    padding: 20px;
    font-family: 'Arial', sans-serif;
  }
  
  .search-bar {
    margin-bottom: 15px;
    padding: 10px;
    background-color: #f5f7fa;
    border-radius: 5px;
  }
  
  .function-buttons {
    margin-bottom: 15px;
  }
  
  .content {
    display: flex;
    gap: 15px;
  }
  
  .left-table, .middle-table, .right-table {
    flex: 1;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px;
  }
  
  .right-table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .header-left, .header-right {
    display: flex;
    align-items: center;
  }
  
  .header-right button {
    margin-left: 10px;
  }
  </style>