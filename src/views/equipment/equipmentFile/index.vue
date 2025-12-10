<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" label-width="68px">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="文件名称" prop="fileName">
            <el-input
              v-model="queryParams.fileName"
              placeholder="请输入文件名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="文件类型" prop="fileType">
            <el-select v-model="queryParams.fileType" placeholder="请选择文件类型" clearable>
              <el-option
                v-for="dict in dict.type.file_type"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
              ></el-option>
            </el-select>
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="关联设备" prop="equipmentName">
            <el-input
              v-model="queryParams.equipmentName"
              placeholder="请输入设备名称"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item label="上传用户" prop="uploadUser">
            <el-input
              v-model="queryParams.uploadUser"
              placeholder="请输入上传用户"
              clearable
              @keyup.enter.native="handleQuery"
            />
          </el-form-item>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="6">
          <el-form-item label="上传时间" prop="uploadTime">
            <el-date-picker
              v-model="queryParams.uploadTime"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="yyyy-MM-dd"
            />
          </el-form-item>
        </el-col>
        <el-col :span="6">
          <el-form-item>
            <el-button type="primary" icon="el-icon-search" size="small" @click="handleQuery">搜索</el-button>
            <el-button icon="el-icon-refresh" size="small" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-col>
      </el-row>
    </el-form>

    <!-- 文件统计信息 -->
    <el-row :gutter="20" class="mb8">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ fileStats.totalFiles }}</div>
            <div class="stat-label">总文件数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ fileStats.totalSize }}</div>
            <div class="stat-label">总文件大小</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ fileStats.pdfCount }}</div>
            <div class="stat-label">PDF文档</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <div class="stat-number">{{ fileStats.excelCount }}</div>
            <div class="stat-label">Excel表格</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['equipment:file:add']"
        >新增</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="success"
          plain
          icon="el-icon-edit"
          size="small"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['equipment:file:edit']"
        >修改</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="danger"
          plain
          icon="el-icon-delete"
          size="small"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['equipment:file:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="info"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleBatchDownload"
          v-hasPermi="['equipment:file:download']"
        >批量下载</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="fileList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="编号" align="center" prop="fileId" width="60"/>
      <el-table-column label="文件名称" align="center" prop="fileName" width="200"/>
      <el-table-column label="文件类型" align="center" prop="fileType" width="100">
        <template slot-scope="scope">
          <dict-tag :options="dict.type.file_type" :value="scope.row.fileType"/>
        </template>
      </el-table-column>
      <el-table-column label="文件大小" align="center" prop="fileSize" width="100"/>
      <el-table-column label="关联设备" align="center" prop="equipmentName" width="120"/>
      <el-table-column label="上传用户" align="center" prop="uploadUser" width="100"/>
      <el-table-column label="上传时间" align="center" prop="uploadTime" width="120">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.uploadTime, '{y}-{m}-{d} {h}:{i}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="备注" align="center" prop="remark" width="200" show-overflow-tooltip/>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="150">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-view"
            @click="handleView(scope.row)"
            v-hasPermi="['equipment:file:view']"
          >查看</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-download"
            @click="handleDownload(scope.row)"
            v-hasPermi="['equipment:file:download']"
          >下载</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['equipment:file:edit']"
          >编辑</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['equipment:file:remove']"
          >删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total>0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />

    <!-- 添加或修改设备文件对话框 -->
    <el-dialog :title="title" :visible.sync="open" width="600px" append-to-body>
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="文件名称" prop="fileName">
              <el-input v-model="form.fileName" placeholder="请输入文件名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="文件类型" prop="fileType">
              <el-select v-model="form.fileType" placeholder="请选择文件类型">
                <el-option
                  v-for="dict in dict.type.file_type"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                ></el-option>
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="关联设备" prop="equipmentName">
              <el-input v-model="form.equipmentName" placeholder="请输入关联设备名称" />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="上传用户" prop="uploadUser">
              <el-input v-model="form.uploadUser" placeholder="请输入上传用户" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="文件上传" prop="file">
              <el-upload
                ref="upload"
                :action="upload.url"
                :headers="upload.headers"
                :on-progress="handleFileUploadProgress"
                :on-success="handleFileSuccess"
                :auto-upload="false"
                drag
              >
                <i class="el-icon-upload"></i>
                <div class="el-upload__text">将文件拖到此处，或<em>点击上传</em></div>
              </el-upload>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="24">
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" placeholder="请输入备注" />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="submitForm">确 定</el-button>
        <el-button @click="cancel">取 消</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { listEquipmentFile, getEquipmentFile, delEquipmentFile, addEquipmentFile, updateEquipmentFile, downloadEquipmentFile } from "@/api/equipment/equipmentFile";
import { getToken } from "@/utils/auth";

export default {
  name: "EquipmentFile",
  dicts: ['file_type'],
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
      // 设备文件表格数据
      fileList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        fileName: null,
        fileType: null,
        equipmentName: null,
        uploadUser: null,
        uploadTime: null
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        fileName: [
          { required: true, message: "文件名称不能为空", trigger: "blur" }
        ],
        fileType: [
          { required: true, message: "文件类型不能为空", trigger: "change" }
        ]
      },
      // 文件上传
      upload: {
        // 是否禁用上传
        isUploading: false,
        // 设置上传的请求头部
        headers: { Authorization: "Bearer " + getToken() },
        // 上传的地址
        url: process.env.VUE_APP_BASE_API + "/common/upload"
      },
      // 文件统计信息
      fileStats: {
        totalFiles: 0,
        totalSize: '0MB',
        pdfCount: 0,
        excelCount: 0
      }
    };
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询设备文件列表 */
    getList() {
      this.loading = true;
      // 模拟数据
      setTimeout(() => {
        this.fileList = [
          {
            fileId: 1,
            fileName: '数控车床操作手册.pdf',
            fileType: 'pdf',
            fileSize: '2.5MB',
            uploadTime: '2024-01-15 10:00:00',
            uploadUser: '张三',
            equipmentName: '数控车床',
            remark: '设备操作说明书，包含详细的操作步骤和安全注意事项'
          },
          {
            fileId: 2,
            fileName: '激光切割机维护手册.pdf',
            fileType: 'pdf',
            fileSize: '1.8MB',
            uploadTime: '2024-01-20 14:00:00',
            uploadUser: '李四',
            equipmentName: '激光切割机',
            remark: '设备维护保养手册，包含日常维护和定期保养内容'
          },
          {
            fileId: 3,
            fileName: '立式加工中心技术参数.xlsx',
            fileType: 'xlsx',
            fileSize: '856KB',
            uploadTime: '2024-01-25 09:00:00',
            uploadUser: '王五',
            equipmentName: '立式加工中心',
            remark: '设备技术参数表，包含各项技术指标和性能参数'
          },
          {
            fileId: 4,
            fileName: '折弯机安全操作规程.docx',
            fileType: 'docx',
            fileSize: '1.2MB',
            uploadTime: '2024-01-30 11:00:00',
            uploadUser: '赵六',
            equipmentName: '折弯机',
            remark: '安全操作规程文档，确保操作人员安全'
          },
          {
            fileId: 5,
            fileName: '冲床故障排除指南.pdf',
            fileType: 'pdf',
            fileSize: '3.1MB',
            uploadTime: '2024-02-05 13:00:00',
            uploadUser: '钱七',
            equipmentName: '冲床',
            remark: '故障排除和维修指南，包含常见故障处理方法'
          },
          {
            fileId: 6,
            fileName: '设备验收报告模板.docx',
            fileType: 'docx',
            fileSize: '680KB',
            uploadTime: '2024-02-10 16:00:00',
            uploadUser: '孙八',
            equipmentName: '通用',
            remark: '设备验收标准报告模板，用于新设备验收'
          },
          {
            fileId: 7,
            fileName: '设备保养计划表.xlsx',
            fileType: 'xlsx',
            fileSize: '1.1MB',
            uploadTime: '2024-02-12 09:30:00',
            uploadUser: '周九',
            equipmentName: '通用',
            remark: '年度设备保养计划表，包含各设备保养时间安排'
          },
          {
            fileId: 8,
            fileName: '设备维修记录表.xlsx',
            fileType: 'xlsx',
            fileSize: '920KB',
            uploadTime: '2024-02-15 14:20:00',
            uploadUser: '吴十',
            equipmentName: '通用',
            remark: '设备维修记录模板，用于记录维修过程和结果'
          },
          {
            fileId: 9,
            fileName: '设备校准证书.pdf',
            fileType: 'pdf',
            fileSize: '2.8MB',
            uploadTime: '2024-02-18 11:45:00',
            uploadUser: '郑十一',
            equipmentName: '通用',
            remark: '设备校准证书模板，用于设备精度校准记录'
          },
          {
            fileId: 10,
            fileName: '设备使用培训视频.mp4',
            fileType: 'mp4',
            fileSize: '15.6MB',
            uploadTime: '2024-02-20 10:15:00',
            uploadUser: '王十二',
            equipmentName: '通用',
            remark: '设备操作培训视频，包含详细的操作演示'
          },
          {
            fileId: 11,
            fileName: '设备管理制度.pdf',
            fileType: 'pdf',
            fileSize: '1.5MB',
            uploadTime: '2024-02-22 15:30:00',
            uploadUser: '李十三',
            equipmentName: '通用',
            remark: '设备管理制度文档，规范设备管理流程'
          },
          {
            fileId: 12,
            fileName: '设备档案卡片模板.docx',
            fileType: 'docx',
            fileSize: '450KB',
            uploadTime: '2024-02-25 08:45:00',
            uploadUser: '张十四',
            equipmentName: '通用',
            remark: '设备档案卡片模板，用于建立设备档案'
          },
          {
            fileId: 13,
            fileName: '设备安全检查表.pdf',
            fileType: 'pdf',
            fileSize: '980KB',
            uploadTime: '2024-02-28 13:20:00',
            uploadUser: '陈十五',
            equipmentName: '通用',
            remark: '设备安全检查表，确保设备安全运行'
          },
          {
            fileId: 14,
            fileName: '设备报废申请表.docx',
            fileType: 'docx',
            fileSize: '620KB',
            uploadTime: '2024-03-01 16:10:00',
            uploadUser: '刘十六',
            equipmentName: '通用',
            remark: '设备报废申请表格，规范报废流程'
          },
          {
            fileId: 15,
            fileName: '设备借用登记表.xlsx',
            fileType: 'xlsx',
            fileSize: '750KB',
            uploadTime: '2024-03-05 09:00:00',
            uploadUser: '赵十七',
            equipmentName: '通用',
            remark: '设备借用登记表格，记录设备借用情况'
          }
        ];
        this.total = 15;
        this.loading = false;
        this.calculateFileStats();
      }, 500);
    },
    /** 计算文件统计信息 */
    calculateFileStats() {
      const files = this.fileList;
      this.fileStats.totalFiles = files.length;
      
      // 计算总文件大小
      let totalSizeBytes = 0;
      let pdfCount = 0;
      let excelCount = 0;
      
      files.forEach(file => {
        // 解析文件大小
        const sizeStr = file.fileSize;
        if (sizeStr.includes('MB')) {
          totalSizeBytes += parseFloat(sizeStr) * 1024 * 1024;
        } else if (sizeStr.includes('KB')) {
          totalSizeBytes += parseFloat(sizeStr) * 1024;
        } else {
          totalSizeBytes += parseFloat(sizeStr);
        }
        
        // 统计文件类型
        if (file.fileType === 'pdf') {
          pdfCount++;
        } else if (file.fileType === 'xlsx') {
          excelCount++;
        }
      });
      
      // 格式化总大小
      if (totalSizeBytes > 1024 * 1024) {
        this.fileStats.totalSize = (totalSizeBytes / (1024 * 1024)).toFixed(1) + 'MB';
      } else if (totalSizeBytes > 1024) {
        this.fileStats.totalSize = (totalSizeBytes / 1024).toFixed(1) + 'KB';
      } else {
        this.fileStats.totalSize = totalSizeBytes + 'B';
      }
      
      this.fileStats.pdfCount = pdfCount;
      this.fileStats.excelCount = excelCount;
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        fileId: null,
        fileName: null,
        fileType: null,
        fileSize: null,
        equipmentName: null,
        uploadUser: null,
        uploadTime: null,
        remark: null
      };
      this.resetForm("form");
    },
    /** 搜索按钮操作 */
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    /** 重置按钮操作 */
    resetQuery() {
      this.resetForm("queryForm");
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.fileId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加设备文件";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const fileId = row.fileId || this.ids
      getEquipmentFile(fileId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改设备文件";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.fileId != null) {
            updateEquipmentFile(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addEquipmentFile(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const fileIds = row.fileId || this.ids;
      this.$modal.confirm('是否确认删除设备文件编号为"' + fileIds + '"的数据项？').then(function() {
        return delEquipmentFile(fileIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    /** 查看按钮操作 */
    handleView(row) {
      this.$modal.msgInfo(`查看文件：${row.fileName}`);
    },
    /** 下载按钮操作 */
    handleDownload(row) {
      this.$modal.msgSuccess(`下载文件：${row.fileName}`);
    },
    /** 批量下载按钮操作 */
    handleBatchDownload() {
      if (this.ids.length === 0) {
        this.$modal.msgWarning("请选择要下载的文件");
        return;
      }
      this.$modal.msgSuccess(`批量下载 ${this.ids.length} 个文件`);
    },
    // 文件上传中处理
    handleFileUploadProgress(event, file, fileList) {
      this.upload.isUploading = true;
    },
    // 文件上传成功处理
    handleFileSuccess(response, file, fileList) {
      this.upload.isUploading = false;
      this.form.fileName = file.name;
      this.form.fileSize = file.size;
      this.$modal.msgSuccess("上传成功");
    }
  }
};
</script>

<style scoped>
.stat-card {
  border-radius: 8px;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-content {
  text-align: center;
  padding: 10px;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.mb8 {
  margin-bottom: 8px;
}
</style>