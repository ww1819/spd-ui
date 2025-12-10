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
          <el-table 
            :data="platformData" 
            border 
            style="width: 100%" 
            :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
            height="calc(100vh - 330px)">
            <el-table-column type="selection" width="55" align="center"></el-table-column>
            <el-table-column type="index" label="序" width="50" align="center"></el-table-column>
            <el-table-column prop="name" label="检验平台名称" width="180" align="center"></el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="scope">
                <el-tag type="success" size="small">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="rank" label="排序号" width="100" align="center" sortable></el-table-column>
            <el-table-column prop="code" label="检验平台编码" width="150" align="center"></el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
              <template slot-scope="scope">
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleEdit(scope.row)"
                >修改</el-button>
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDelete(scope.row)"
                >删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
  
        <!-- 中间表格 -->
        <div class="middle-table">
          <el-table 
            :data="equipmentData" 
            border 
            style="width: 100%" 
            :header-cell-style="{background:'#f5f7fa',color:'#606266'}"
            height="calc(100vh - 330px)">
            <el-table-column type="index" label="序" width="50" align="center"></el-table-column>
            <el-table-column prop="name" label="设备名称" width="180" align="center"></el-table-column>
            <el-table-column prop="lab" label="使用实验室" width="180" align="center"></el-table-column>
            <el-table-column prop="fullName" label="设备全称" width="180" align="center"></el-table-column>
            <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
              <template slot-scope="scope">
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-edit"
                  @click="handleEditEquipment(scope.row)"
                >修改</el-button>
                <el-button
                  size="small"
                  type="text"
                  icon="el-icon-delete"
                  @click="handleDeleteEquipment(scope.row)"
                >删除</el-button>
              </template>
            </el-table-column>
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

      <!-- 新增/修改弹窗 -->
      <div v-if="open" class="local-modal-mask">
        <div class="local-modal-content">
          <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
          <el-form ref="form" :model="form" :rules="rules" label-width="100px">
            <el-row :gutter="20">
              <el-col :span="6">
                <el-form-item label="平台名称" prop="name">
                  <el-input v-model="form.name" placeholder="请输入平台名称" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="平台编码" prop="code">
                  <el-input v-model="form.code" placeholder="请输入平台编码" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="排序号" prop="rank">
                  <el-input v-model="form.rank" placeholder="请输入排序号" />
                </el-form-item>
              </el-col>
              <el-col :span="6">
                <el-form-item label="状态" prop="status">
                  <el-select v-model="form.status" placeholder="请选择状态" style="width: 100%">
                    <el-option label="有效" value="有效"></el-option>
                    <el-option label="无效" value="无效"></el-option>
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>
          </el-form>
          <div class="dialog-footer" style="text-align:right;margin-top:16px;">
            <el-button type="primary" @click="submitForm">确 定</el-button>
            <el-button @click="cancel">取 消</el-button>
          </div>
        </div>
      </div>

      <!-- 导入弹窗 -->
      <div v-if="upload.open" class="local-modal-mask">
        <div class="local-modal-content" style="width: 500px;">
          <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
          <el-upload
            ref="upload"
            :limit="1"
            accept=".xlsx, .xls"
            :headers="upload.headers"
            :action="upload.url + '?updateSupport=' + upload.updateSupport"
            :disabled="upload.isUploading"
            :on-progress="handleFileUploadProgress"
            :on-success="handleFileSuccess"
            :auto-upload="false"
            drag
          >
            <i class="el-icon-upload"></i>
            <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
            <div class="el-upload__tip text-center" slot="tip">
              <div class="el-upload__tip" slot="tip">
                <el-checkbox v-model="upload.updateSupport" /> 是否更新已经存在的数据
              </div>
              <span>仅允许导入xls、xlsx格式文件。</span>
              <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="handleTemplateDownload">下载模板</el-link>
            </div>
          </el-upload>
          <div class="dialog-footer" style="text-align:right;margin-top:16px;">
            <el-button type="primary" @click="submitFileForm">确 定</el-button>
            <el-button @click="upload.open = false">取 消</el-button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script>
  import { getToken } from "@/utils/auth";
  
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
        ],
        // 弹窗相关
        open: false,
        title: "",
        form: {},
        rules: {
          name: [
            { required: true, message: "平台名称不能为空", trigger: "blur" }
          ],
          code: [
            { required: true, message: "平台编码不能为空", trigger: "blur" }
          ]
        },
        // 导入相关
        upload: {
          open: false,
          title: "",
          isUploading: false,
          updateSupport: 0,
          headers: { Authorization: "Bearer " + getToken() },
          url: process.env.VUE_APP_BASE_API + "/foundation/testplat/importData"
        }
      };
    },
    methods: {
      handleSearch() {
        console.log('查询条件:', this.searchForm);
      },
      handleReset() {
        this.searchForm = {
          keyword: '',
          instrument: '',
          project: ''
        };
      },
      handleAdd() {
        this.open = true;
        this.title = "添加检验平台";
        this.form = {
          name: '',
          code: '',
          rank: 0,
          status: '有效'
        };
      },
      handleEdit(row) {
        this.open = true;
        this.title = "修改检验平台";
        this.form = { ...row };
      },
      handleDelete(row) {
        this.$modal.confirm('是否确认删除该检验平台？').then(() => {
          // 这里添加删除逻辑
          this.$modal.msgSuccess("删除成功");
        });
      },
      handleEditEquipment(row) {
        // 这里添加修改设备逻辑
      },
      handleDeleteEquipment(row) {
        this.$modal.confirm('是否确认删除该设备？').then(() => {
          // 这里添加删除设备逻辑
          this.$modal.msgSuccess("删除成功");
        });
      },
      handleExport() {
        // 这里添加导出逻辑
      },
      handleImport() {
        this.upload.title = "导入检验平台";
        this.upload.open = true;
      },
      handleTemplateDownload() {
        // 这里添加下载模板逻辑
      },
      submitForm() {
        this.$refs["form"].validate(valid => {
          if (valid) {
            // 这里添加提交表单逻辑
            this.open = false;
            this.$modal.msgSuccess("保存成功");
          }
        });
      },
      cancel() {
        this.open = false;
        this.reset();
      },
      reset() {
        this.form = {
          name: '',
          code: '',
          rank: 0,
          status: '有效'
        };
      },
      // 文件上传相关方法
      handleFileUploadProgress(event, file, fileList) {
        this.upload.isUploading = true;
      },
      handleFileSuccess(response, file, fileList) {
        this.upload.open = false;
        this.upload.isUploading = false;
        this.$refs.upload.clearFiles();
        this.$alert("<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" + response.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
      },
      submitFileForm() {
        this.$refs.upload.submit();
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
  
  .local-modal-mask {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
  }
  
  .local-modal-content {
    background-color: #fff;
    padding: 24px;
    border-radius: 6px;
    min-width: 600px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
  
  .dialog-footer {
    text-align: right;
    margin-top: 16px;
  }
  </style>