<template>
  <el-dialog
    :title="title"
    :visible.sync="dialogVisible"
    width="95%"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    class="print-dialog"
    :show-close="false"
    @close="handleClose"
  >
    <div class="print-dialog-wrapper">
      <!-- 左侧打印内容区域 -->
      <div class="print-content-wrapper" id="printContentWrapper">
        <!-- 打印内容 -->
        <div class="print-content" id="printContent">
          <slot name="content"></slot>
        </div>
      </div>

      <!-- 右侧打印设置面板 -->
      <div class="print-settings-panel">
        <div class="settings-header">
          <h3>打印</h3>
        </div>
        <div class="settings-content">
          <div class="setting-item">
            <label class="setting-label">目标打印机</label>
            <el-select v-model="printSettings.printer" placeholder="选择打印机" style="width: 100%">
              <el-option label="Microsoft Print to PDF" value="pdf"></el-option>
              <el-option label="默认打印机" value="default"></el-option>
            </el-select>
          </div>
          <div class="setting-item">
            <label class="setting-label">页面</label>
            <el-select v-model="printSettings.pageRange" placeholder="选择页面" style="width: 100%">
              <el-option label="全部" value="all"></el-option>
              <el-option label="当前页" value="current"></el-option>
              <el-option label="自定义" value="custom"></el-option>
            </el-select>
          </div>
          <div class="setting-item">
            <label class="setting-label">布局</label>
            <el-select v-model="printSettings.layout" placeholder="选择布局" style="width: 100%">
              <el-option label="纵向" value="portrait"></el-option>
              <el-option label="横向" value="landscape"></el-option>
            </el-select>
          </div>
          <div class="setting-item">
            <label class="setting-label">彩色</label>
            <el-select v-model="printSettings.color" placeholder="选择颜色" style="width: 100%">
              <el-option label="彩色" value="color"></el-option>
              <el-option label="黑白" value="grayscale"></el-option>
            </el-select>
          </div>
          <div class="setting-item">
            <el-collapse v-model="printSettings.activeCollapse">
              <el-collapse-item title="更多设置" name="more">
                <div class="more-settings">
                  <div class="more-setting-item">
                    <label>份数：</label>
                    <el-input-number v-model="printSettings.copies" :min="1" :max="99" style="width: 100%"></el-input-number>
                  </div>
                  <div class="more-setting-item">
                    <label>缩放：</label>
                    <el-select v-model="printSettings.scale" placeholder="选择缩放" style="width: 100%">
                      <el-option label="100%" value="100"></el-option>
                      <el-option label="75%" value="75"></el-option>
                      <el-option label="50%" value="50"></el-option>
                      <el-option label="适合页面" value="fit"></el-option>
                    </el-select>
                  </div>
                  <div class="more-setting-item">
                    <el-checkbox v-model="printSettings.backgroundGraphics">背景图形</el-checkbox>
                  </div>
                  <div class="more-setting-item">
                    <el-checkbox v-model="printSettings.headersFooters">页眉和页脚</el-checkbox>
                  </div>
                </div>
              </el-collapse-item>
            </el-collapse>
          </div>
        </div>
        <div class="settings-footer">
          <el-button type="primary" icon="el-icon-printer" @click="handlePrint" style="width: 100%; margin-bottom: 10px;">打印</el-button>
          <el-button @click="handleCancel" style="width: 100%;">取消</el-button>
        </div>

        <!-- 操作列表 -->
        <div class="operations-list">
          <div class="operations-header">
            <h4>操作记录</h4>
          </div>
          <div class="operations-content">
            <el-table
              :data="operationsList"
              border
              size="mini"
              height="300"
              style="width: 100%"
            >
              <el-table-column prop="printDate" label="打印日期" width="120" align="center">
                <template slot-scope="scope">
                  <span>{{ scope.row.printDate || '--' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="150" align="center">
                <template slot-scope="scope">
                  <span v-if="scope.$index === 0" style="white-space: nowrap;">
                    <el-button
                      size="mini"
                      type="text"
                      icon="el-icon-edit"
                      @click="handleModifyOperation(scope.row)"
                      style="padding: 0 3px; margin: 0;"
                    >修改</el-button>
                    <el-button
                      size="mini"
                      type="text"
                      icon="el-icon-delete"
                      @click="handleDeleteOperation(scope.row)"
                      style="padding: 0 3px; margin: 0;"
                    >删除</el-button>
                  </span>
                  <el-button
                    v-else
                    size="mini"
                    type="text"
                    icon="el-icon-printer"
                    @click="handleReprint(scope.row)"
                    style="padding: 0 3px; margin: 0; color: #409EFF;"
                  >打印</el-button>
                </template>
              </el-table-column>
            </el-table>
            <!-- 分页 -->
            <div class="operations-pagination">
              <span>共{{ operationsTotal }}条</span>
              <el-select v-model="operationsPageSize" size="mini" style="width: 80px; margin: 0 10px;">
                <el-option label="10条/页" :value="10"></el-option>
                <el-option label="20条/页" :value="20"></el-option>
                <el-option label="50条/页" :value="50"></el-option>
              </el-select>
              <el-pagination
                :current-page="operationsPageNum"
                :page-size="operationsPageSize"
                :total="operationsTotal"
                layout="prev, pager, next"
                small
                @current-change="handleOperationsPageChange"
              ></el-pagination>
              <span style="margin-left: 10px;">前往</span>
              <el-input-number
                v-model="operationsGoToPage"
                :min="1"
                :max="operationsTotalPages"
                size="mini"
                style="width: 60px; margin: 0 5px;"
                @change="handleGoToPage"
              ></el-input-number>
              <span>页</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </el-dialog>
</template>

<script>
export default {
  name: "PrintDialog",
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    title: {
      type: String,
      default: "打印"
    },
    // 操作列表数据（从父组件传入）
    operations: {
      type: Array,
      default: () => []
    },
    // 操作列表总数
    operationsTotalProp: {
      type: Number,
      default: 0
    }
  },
  data() {
    return {
      dialogVisible: false,
      printSettings: {
        printer: 'pdf',
        pageRange: 'all',
        layout: 'portrait',
        color: 'color',
        copies: 1,
        scale: '100',
        backgroundGraphics: true,
        headersFooters: false,
        activeCollapse: []
      },
      // 操作列表
      operationsList: [],
      operationsPageNum: 1,
      operationsPageSize: 10,
      operationsTotal: 0,
      operationsGoToPage: 1
    };
  },
  computed: {
    operationsTotalPages() {
      return Math.ceil(this.operationsTotal / this.operationsPageSize);
    }
  },
  watch: {
    visible(val) {
      this.dialogVisible = val;
      if (val) {
        // 弹窗打开时加载操作列表
        this.loadOperationsList();
      }
    },
    dialogVisible(val) {
      if (!val) {
        this.$emit('update:visible', false);
        this.$emit('close');
      }
    },
    // 监听外部传入的操作列表
    operations: {
      handler(val) {
        if (val && val.length > 0) {
          this.operationsList = val.map((item, index) => ({
            ...item,
            index: index
          }));
          this.operationsTotal = val.length;
        }
      },
      immediate: true,
      deep: true
    },
    operationsTotalProp: {
      handler(val) {
        if (val > 0) {
          this.operationsTotal = val;
        }
      },
      immediate: true
    }
  },
  methods: {
    handlePrint() {
      // 根据设置应用打印样式
      this.applyPrintSettings();
      
      // 延迟执行打印，确保样式已应用
      setTimeout(() => {
        window.print();
        // 打印后添加到操作列表
        this.addPrintOperation();
      }, 100);
    },
    /** 添加打印操作记录 */
    addPrintOperation() {
      const now = new Date();
      const printDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      
      // 将新的打印记录添加到列表开头（第一条记录保持为当前单据，显示修改和删除）
      // 如果列表为空，先添加一条当前单据记录
      if (this.operationsList.length === 0) {
        this.operationsList.push({
          index: 0,
          printDate: '--'
        });
      }
      
      // 添加新的打印记录（从第二条开始）
      this.operationsList.push({
        index: this.operationsList.length,
        printDate: printDate
      });
      this.operationsTotal = this.operationsList.length;
      
      // 触发事件通知父组件
      this.$emit('print-success', {
        printDate: printDate
      });
    },
    /** 修改操作 */
    handleModifyOperation(row) {
      this.$emit('modify-operation', row);
    },
    /** 删除操作 */
    handleDeleteOperation(row) {
      this.$emit('delete-operation', row);
    },
    /** 重新打印 */
    handleReprint(row) {
      this.$emit('reprint', row);
      // 重新打印时也执行打印
      this.handlePrint();
    },
    /** 操作列表分页变化 */
    handleOperationsPageChange(page) {
      this.operationsPageNum = page;
      this.operationsGoToPage = page;
      this.loadOperationsList();
    },
    /** 跳转到指定页 */
    handleGoToPage(page) {
      if (page >= 1 && page <= this.operationsTotalPages) {
        this.operationsPageNum = page;
        this.loadOperationsList();
      }
    },
    /** 加载操作列表 */
    loadOperationsList() {
      // 如果父组件传入了操作列表数据，使用父组件的数据
      if (this.operations && this.operations.length > 0) {
        this.operationsList = this.operations.map((item, index) => ({
          ...item,
          index: index
        }));
        this.operationsTotal = this.operations.length;
      } else {
        // 否则初始化一个空列表，第一条记录为当前单据（显示修改和删除）
        if (this.operationsList.length === 0) {
          this.operationsList = [{
            index: 0,
            printDate: '--'
          }];
          this.operationsTotal = 1;
        }
      }
    },
    applyPrintSettings() {
      const printContent = document.getElementById('printContent');
      if (!printContent) return;
      
      // 应用布局设置
      if (this.printSettings.layout === 'landscape') {
        printContent.style.width = '297mm';
        printContent.style.height = '210mm';
      } else {
        printContent.style.width = '210mm';
        printContent.style.height = '297mm';
      }
      
      // 应用缩放设置
      if (this.printSettings.scale !== '100' && this.printSettings.scale !== 'fit') {
        const scale = parseInt(this.printSettings.scale) / 100;
        printContent.style.transform = `scale(${scale})`;
        printContent.style.transformOrigin = 'top left';
      } else if (this.printSettings.scale === 'fit') {
        printContent.style.width = '100%';
        printContent.style.height = 'auto';
      }
    },
    handleCancel() {
      this.dialogVisible = false;
    },
    handleClose() {
      this.$emit('update:visible', false);
      this.$emit('close');
    }
  }
};
</script>

<style scoped>
/* 打印弹窗样式 */
.print-dialog ::v-deep .el-dialog {
  margin: 0 auto;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.print-dialog ::v-deep .el-dialog__header {
  padding: 15px 20px;
  border-bottom: 1px solid #EBEEF5;
}

.print-dialog ::v-deep .el-dialog__body {
  padding: 0;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.print-dialog-wrapper {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.print-content-wrapper {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  background: #f5f5f5;
  display: flex;
  justify-content: center;
  align-items: flex-start;
}

.print-content {
  width: 210mm;
  min-height: 297mm;
  padding: 20mm;
  background: #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  margin: 0 auto;
}

/* 打印设置面板样式 */
.print-settings-panel {
  width: 350px;
  background: #fff;
  border-left: 1px solid #EBEEF5;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.settings-header {
  padding: 15px 20px;
  border-bottom: 1px solid #EBEEF5;
}

.settings-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.settings-content {
  flex: 0 0 auto;
  overflow-y: auto;
  padding: 20px;
  max-height: 350px;
}

.setting-item {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.more-settings {
  padding: 10px 0;
}

.more-setting-item {
  margin-bottom: 15px;
}

.more-setting-item label {
  display: block;
  margin-bottom: 5px;
  font-size: 13px;
  color: #606266;
}

.settings-footer {
  padding: 15px 20px;
  border-top: 1px solid #EBEEF5;
  background: #fafafa;
}

/* 操作列表样式 */
.operations-list {
  border-top: 1px solid #EBEEF5;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.operations-header {
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #fafafa;
}

.operations-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #303133;
}

.operations-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 10px;
  min-height: 0;
}

.operations-content .el-table {
  flex: 1;
  overflow: auto;
}

.operations-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding: 10px 0;
  font-size: 12px;
  color: #606266;
  border-top: 1px solid #EBEEF5;
  margin-top: 10px;
}

.operations-pagination span {
  white-space: nowrap;
}

.operations-pagination .el-pagination {
  display: inline-block;
  margin: 0 5px;
}

/* 打印样式 */
@media print {
  .print-dialog-wrapper {
    display: block !important;
  }

  .print-settings-panel {
    display: none !important;
  }

  .print-content-wrapper {
    padding: 0 !important;
    background: #fff !important;
  }

  .print-content {
    box-shadow: none !important;
    padding: 15mm !important;
    margin: 0 !important;
    width: 210mm !important;
    min-height: auto !important;
  }

  @page {
    size: A4;
    margin: 15mm;
  }

  @page landscape {
    size: A4 landscape;
  }
}
</style>
