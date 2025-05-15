<template>
    <div class="inspection-platform">
      <!-- 顶部搜索栏 -->
      <div class="search-bar">
        <el-form inline>
          <el-form-item label="检验平台：">
            <el-input v-model="searchForm.platform" placeholder="请输入检验平台名称/编码..." clearable></el-input>
          </el-form-item>
          <el-form-item label="仪器：">
            <el-input v-model="searchForm.instrument" placeholder="请输入仪器名称" clearable></el-input>
          </el-form-item>
          <el-form-item label="耗材：">
            <el-input v-model="searchForm.consumable" placeholder="请输入耗材名称/编码..." clearable></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" @click="handleSearch">查询</el-button>
          </el-form-item>
          <el-form-item>
            <el-button icon="el-icon-refresh" @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
  
      <!-- 主内容区域 -->
      <div class="content">
        <!-- 检验平台列表 -->
        <div class="platform-list">
          <div class="panel-header">检验平台列表</div>
          <el-table 
            :data="platformData" 
            border 
            style="width: 100%" 
            :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
            highlight-current-row
            @current-change="handlePlatformSelect"
            @row-click="handlePlatformSelect">
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="name" label="检验平台名称"></el-table-column>
            <el-table-column prop="code" label="检验平台编码"></el-table-column>
          </el-table>
        </div>
  
        <!-- 仪器列表 -->
        <div class="instrument-list">
          <div class="panel-header">仪器列表</div>
          <el-table 
            :data="instrumentData" 
            border 
            style="width: 100%" 
            :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
            highlight-current-row
            @current-change="handleInstrumentSelect"
            @row-click="handleInstrumentSelect">
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="name" label="设备名称"></el-table-column>
          </el-table>
        </div>
  
        <!-- 仪器-耗材 -->
        <div class="instrument-consumable">
          <div class="panel-header">仪器-耗材</div>
          <!-- 仪器-耗材表格 -->
          <el-table 
            :data="instrumentConsumableData" 
            border 
            style="width: 100%" 
            :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
            @selection-change="handleConsumableSelect"
            @row-click="(row, column, event) => toggleRowSelection(row, 'instrumentConsumableTable')"
            ref="instrumentConsumableTable">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="name" label="耗材名称"></el-table-column>
            <el-table-column prop="code" label="耗材编号"></el-table-column>
          </el-table>
        </div>
  
        <!-- 耗材列表 -->
        <div class="consumable-list">
          <div class="panel-header">耗材列表</div>
          <div class="list-header">
            <el-input v-model="consumableSearch" placeholder="耗材名称、编码" clearable></el-input>
            <div class="button-group">
              <el-button icon="el-icon-arrow-left" circle @click="handleMoveLeft"></el-button>
              <el-button icon="el-icon-arrow-right" circle @click="handleMoveRight"></el-button>
              <el-button type="primary" icon="el-icon-check" @click="handleSave">保存</el-button>
            </div>
          </div>
          <el-table 
            :data="consumableData" 
            border 
            style="width: 100%" 
            :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
            @selection-change="handleConsumableSelect"
            @row-click="(row, column, event) => toggleRowSelection(row,'consumableTable')"
            ref="consumableTable">
            <el-table-column type="selection" width="55"></el-table-column>
            <el-table-column type="index" label="序" width="50"></el-table-column>
            <el-table-column prop="name" label="耗材名称"></el-table-column>
            <el-table-column prop="code" label="耗材编号"></el-table-column>
            <el-table-column prop="category" label="耗材分类"></el-table-column>
          </el-table>
          <div class="pagination">
            <el-pagination
              layout="prev, pager, next"
              :total="10"
              background
            ></el-pagination>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        selectedPlatform: null,
        selectedInstrument: null,
        selectedConsumables: [],
        searchForm: {
          platform: '',
          instrument: '',
          consumable: ''
        },
        consumableSearch: '',
        platformData: [
          { name: '免疫平台', code: '230508001' },
          { name: '生化（体检）', code: '230509001' },
          { name: '生化（门急诊）', code: '230509002' },
          { name: '生化（发光）', code: '230608001' },
          { name: '临检', code: '230614001' },
          { name: '免疫', code: '230614002' },
          { name: '微生物室', code: '230619001' },
          { name: '生化（发光）', code: '240721001' },
          { name: 'Sebia电泳', code: '240815001' }
        ],
        instrumentData: [
          { name: 'AU5800（体检）' },
          { name: 'Sebia电泳' }
        ],
        instrumentConsumableData: [
          { name: '全自动免疫检验系统用底物液', code: '28000330659' },
          { name: '葡萄糖测定试剂盒（己糖激酶法）', code: '28000330611' },
          { name: '肌酸激酶检测试剂盒（酶偶联法）', code: '28000394777' },
          { name: '碱性清洗液', code: '28000394964' },
          { name: '酸性清洗液', code: '28000394965' },
          { name: '钙测定试剂盒（偶氮砷III法）', code: '28000337785' },
          { name: '镁测定试剂盒（二甲苯胺蓝法）', code: '28000330615' },
          { name: '肌酐测定试剂盒（苦味酸法）', code: '28000330592' },
          { name: '生化多项校准品(蛇口)(20*5mL)', code: '28000306090' },
          { name: '蛇中液', code: '28000330574' },
          { name: '低密度脂蛋白胆固醇校准品', code: '28000330609' },
          { name: '载脂蛋白B测定试剂盒（免疫比浊法）', code: '28000394780' },
          { name: '载脂蛋白-A1测定试剂盒（免疫比浊法）', code: '28000394779' },
          { name: '二氧化碳结合力测定试剂盒（酶法）', code: '28000330593' },
          { name: '二氧化碳校准品', code: '28000330606' }
        ],
        consumableData: [
          { name: '交叉配血质控品（微柱凝胶法）', code: '28000007528', category: '质控品,输血' },
          { name: '戊型肝炎IgM抗体检测试剂盒（酶联免疫法）', code: '28000000466', category: '免疫,质控品' },
          { name: '甲型肝炎IgM抗体检测试剂盒（酶联免疫法）', code: '28000000707', category: '免疫,质控品' },
          { name: '结核分枝杆菌IgG/IgM抗体检测试剂盒', code: '28000010738', category: '免疫,试剂' },
          { name: '浓缩清洗液(碧瑞)(蛇口)', code: '28000012814', category: '免疫,试剂' },
          { name: '戊型肝炎IgG抗体检测试剂盒（酶联免疫法）', code: '280000104692', category: '免疫,质控品' },
          { name: '抗中性粒细胞胞浆抗体（乙醇）检测试剂盒', code: '28000176472', category: '免疫,试剂' },
          { name: '幽门螺旋杆菌IgG抗体检测试剂盒', code: '28000270204', category: '免疫,试剂' },
          { name: 'EB病毒Rta蛋白抗体检测试剂盒', code: '28000327868', category: '免疫,试剂' },
          { name: '尿蛋白酶原、尿蛋白酶原II测定试剂盒', code: '28000331803', category: '免疫,试剂' },
          { name: '甲胎蛋白/癌胚抗原测定试剂盒（流式荧光法）', code: '28000331804', category: '免疫,试剂' },
          { name: '多肿瘤标志物（7种）检测试剂盒', code: '28000331805', category: '免疫,试剂' },
          { name: '糖类抗原15-3检测试剂盒（流式荧光法）', code: '28000331806', category: '免疫,试剂' },
          { name: '游离/总前列腺特异性抗原检测试剂盒', code: '28000331807', category: '免疫,试剂' }
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
          platform: '',
          instrument: '',
          consumable: ''
        };
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
      },
      handlePlatformSelect(currentRow) {
      this.selectedPlatform = currentRow;
      console.log('选中的检验平台:', currentRow);
    },
    handleInstrumentSelect(currentRow) {
    this.selectedInstrument = currentRow;
    console.log('选中的仪器:', currentRow);
    },
    handleConsumableSelect(selection) {
    this.selectedConsumables = selection;
    console.log('选中的耗材:', selection);
    },
    toggleRowSelection(row, tableRef) {
    this.$refs[tableRef].toggleRowSelection(row);
    },
    handleMoveLeft() {
    if (this.selectedConsumables.length === 0) {
      this.$message.warning('请先选择要移动的耗材');
      return;
    }
    
    // 从耗材列表移除选中的耗材
    this.consumableData = this.consumableData.filter(item => 
      !this.selectedConsumables.some(selected => selected.code === item.code)
    );
    
    // 添加到仪器-耗材列表，避免重复
    this.selectedConsumables.forEach(item => {
      if (!this.instrumentConsumableData.some(exist => exist.code === item.code)) {
        this.instrumentConsumableData.push({...item});
      }
    });
    
    // 清空选中状态
    this.$refs.consumableTable.clearSelection();
    this.selectedConsumables = [];
  },
  
  handleMoveRight() {
    if (this.selectedConsumables.length === 0) {
      this.$message.warning('请先选择要移动的耗材');
      return;
    }
    
    // 从仪器-耗材列表移除选中的耗材
    this.instrumentConsumableData = this.instrumentConsumableData.filter(item => 
      !this.selectedConsumables.some(selected => selected.code === item.code)
    );
    
    // 添加到耗材列表，避免重复
    this.selectedConsumables.forEach(item => {
      if (!this.consumableData.some(exist => exist.code === item.code)) {
        this.consumableData.push({...item});
      }
    });
    
    // 清空选中状态
    this.$refs.instrumentConsumableTable.clearSelection();
    this.selectedConsumables = [];
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
  
  .content {
    display: flex;
    gap: 15px;
  }
  
  .platform-list, .instrument-list, .instrument-consumable, .consumable-list {
    flex: 1;
    background-color: #fff;
    border-radius: 5px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    padding: 10px;
  }
  
  .panel-header {
    font-weight: bold;
    margin-bottom: 10px;
    padding-bottom: 10px;
    border-bottom: 1px solid #e4e7ed;
  }
  
  .list-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  
  .button-group {
    display: flex;
    align-items: center;
  }
  
  .button-group button {
    margin-left: 10px;
  }
  
  .pagination {
    margin-top: 15px;
    text-align: right;
  }
  </style>