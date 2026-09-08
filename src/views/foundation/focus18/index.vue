<template>
  <div class="app-container list-page focus18-page">
    <el-row :gutter="8" class="f18-layout-row">
      <!-- 左侧分类树（对齐耗材对照左侧列表） -->
      <el-col :span="5" class="f18-left-col">
        <div class="f18-side-panel" ref="leftStack">
          <div class="f18-side-header">
            <span>全部分类</span>
          </div>
          <div class="f18-side-list">
            <el-tree
              ref="categoryTree"
              :data="treeData"
              :props="treeProps"
              node-key="id"
              highlight-current
              default-expand-all
              :expand-on-click-node="false"
              @node-click="handleNodeClick"
            >
              <span slot-scope="{ node }" class="custom-tree-node">
                <i class="el-icon-folder-opened" />
                <span :title="node.label">{{ node.label }}</span>
              </span>
            </el-tree>
          </div>
        </div>
      </el-col>

      <!-- 右侧：查询 / 工具栏 / 明细框 -->
      <el-col :span="19" class="f18-right-col">
        <div class="f18-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="f18-query-row">
                <el-input
                  v-model="queryParams.category"
                  placeholder="耗材类别"
                  clearable
                  class="f18-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.classCode"
                  placeholder="耗材分类代码"
                  clearable
                  class="f18-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.medicalGenericName"
                  placeholder="医保通用名"
                  clearable
                  class="f18-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.genericCode"
                  placeholder="通用名代码"
                  clearable
                  class="f18-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <div class="f18-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar f18-toolbar">
            <div class="list-toolbar-left">
              <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleAdd" v-hasPermi="['foundation:focus18:add']">新增</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" :disabled="single" @click="handleUpdate" v-hasPermi="['foundation:focus18:edit']">修改</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" :disabled="multiple" @click="handleDelete" v-hasPermi="['foundation:focus18:remove']">删除</el-button>
              <el-button size="small" class="spd-btn spd-btn--secondary" @click="handleExport" v-hasPermi="['foundation:focus18:export']">导出</el-button>
            </div>
            <div class="list-toolbar-right">
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
            </div>
          </el-row>

          <div class="apply-table-panel" ref="tablePanel">
            <el-table
              ref="focus18Table"
              v-loading="loading"
              :data="dataList"
              class="apply-main-table"
              border
              stripe
              :height="mainTableHeight"
              :row-class-name="focus18RowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
              <el-table-column label="上级菜单" align="center" prop="parentName" min-width="140" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ scope.row.parentName || '全部分类' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="耗材类别" align="center" prop="category" min-width="110" sortable="custom" show-overflow-tooltip />
              <el-table-column label="耗材分类代码" align="center" prop="classCode" min-width="160" sortable="custom" show-overflow-tooltip />
              <el-table-column label="一级分类(学科/品类)" align="center" prop="level1" min-width="160" sortable="custom" show-overflow-tooltip />
              <el-table-column label="二级分类(用途/品目)" align="center" prop="level2" min-width="160" sortable="custom" show-overflow-tooltip />
              <el-table-column label="三级分类(部位/功能/品种)" align="center" prop="level3" min-width="200" sortable="custom" show-overflow-tooltip />
              <el-table-column label="通用名代码" align="center" prop="genericCode" min-width="110" sortable="custom" show-overflow-tooltip />
              <el-table-column label="医保通用名" align="center" prop="medicalGenericName" min-width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="材质代码" align="center" prop="materialCode" min-width="100" sortable="custom" show-overflow-tooltip />
              <el-table-column label="材质" align="center" prop="material" min-width="100" sortable="custom" show-overflow-tooltip />
              <el-table-column label="特征代码" align="center" prop="featureCode" min-width="100" sortable="custom" show-overflow-tooltip />
              <el-table-column label="特征参数" align="center" prop="featureParam" min-width="120" show-overflow-tooltip />
              <el-table-column label="操作" align="center" width="120" class-name="apply-action-col">
                <template slot-scope="scope">
                  <el-button size="small" type="text" @click="handleUpdate(scope.row)" v-hasPermi="['foundation:focus18:edit']">修改</el-button>
                  <el-button size="small" type="text" @click="handleDelete(scope.row)" v-hasPermi="['foundation:focus18:remove']">删除</el-button>
                </template>
              </el-table-column>
            </el-table>

            <div class="apply-pagination-wrap">
              <pagination
                v-show="total > 0"
                :total="total"
                :page.sync="queryParams.pageNum"
                :limit.sync="queryParams.pageSize"
                @pagination="getList"
              />
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 页面内容区内右侧抽屉（不挂到 body，避免盖住顶栏/侧栏） -->
    <div v-if="open" class="focus18-drawer-mask" @click.self="cancel">
      <div class="focus18-drawer-panel" @click.stop>
        <div class="focus18-drawer-header">
          <span class="focus18-drawer-title">{{ title }}</span>
          <i class="el-icon-close focus18-drawer-close" @click="cancel" />
        </div>
        <div class="focus18-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="180px">
            <el-form-item label="耗材类别" prop="category">
              <el-input v-model="form.category" placeholder="耗材类别" maxlength="100" />
            </el-form-item>
            <el-form-item label="耗材分类代码" prop="classCode">
              <el-input v-model="form.classCode" placeholder="耗材分类代码" maxlength="100" />
            </el-form-item>
            <el-form-item label="一级分类(学科/品类)" prop="level1">
              <el-input v-model="form.level1" placeholder="一级分类" maxlength="200" />
            </el-form-item>
            <el-form-item label="二级分类(用途/品目)" prop="level2">
              <el-input v-model="form.level2" placeholder="二级分类" maxlength="200" />
            </el-form-item>
            <el-form-item label="三级分类(部位/功能/品种)" prop="level3">
              <el-input v-model="form.level3" placeholder="三级分类" maxlength="200" />
            </el-form-item>
            <el-form-item label="通用名代码" prop="genericCode">
              <el-input v-model="form.genericCode" placeholder="通用名代码" maxlength="100" />
            </el-form-item>
            <el-form-item label="医保通用名" prop="medicalGenericName">
              <el-input v-model="form.medicalGenericName" placeholder="医保通用名" maxlength="200" />
            </el-form-item>
            <el-form-item label="材质代码" prop="materialCode">
              <el-input v-model="form.materialCode" placeholder="材质代码" maxlength="100" />
            </el-form-item>
            <el-form-item label="材质" prop="material">
              <el-input v-model="form.material" placeholder="材质" maxlength="200" />
            </el-form-item>
            <el-form-item label="特征代码" prop="featureCode">
              <el-input v-model="form.featureCode" placeholder="特征代码" maxlength="100" />
            </el-form-item>
            <el-form-item label="特征参数" prop="featureParam">
              <el-input v-model="form.featureParam" placeholder="特征参数" maxlength="500" />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
          </el-form>
        </div>
        <div class="focus18-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listFocus18, listFocus18Categories, getFocus18, addFocus18, updateFocus18, delFocus18 } from "@/api/foundation/focus18";

export default {
  name: "Focus18",
  data() {
    return {
      loading: true,
      ids: [],
      rowHighlightTick: 0,
      single: true,
      multiple: true,
      showSearch: true,
      mainTableHeight: 400,
      total: 0,
      dataList: [],
      title: "",
      open: false,
      treeData: [],
      treeProps: {
        label: "label",
        children: "children"
      },
      /** 左侧树选中的耗材类别（精确匹配）；null=全部 */
      treeCategory: null,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        category: null,
        categoryExact: null,
        classCode: null,
        medicalGenericName: null,
        genericCode: null,
        level1: null,
        level2: null,
        level3: null,
        parentId: null,
        emptyCategory: null,
        orderByColumn: null,
        isAsc: null
      },
      form: {},
      rules: {}
    };
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    }
  },
  created() {
    this.loadTree();
    this.getList();
  },
  mounted() {
    this.$nextTick(() => {
      this.updateMainTableHeight();
      setTimeout(() => this.updateMainTableHeight(), 80);
      setTimeout(() => this.updateMainTableHeight(), 200);
    });
    window.addEventListener('resize', this.updateMainTableHeight);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateMainTableHeight);
  },
  methods: {
    /** 明细框高度：底边对齐左侧分类面板 */
    updateMainTableHeight() {
      const panel = this.$refs.tablePanel;
      if (!panel || !panel.getBoundingClientRect) return;
      const left = this.$refs.leftStack;
      if (!left || !left.getBoundingClientRect) return;
      const panelTop = panel.getBoundingClientRect().top;
      const targetBottom = left.getBoundingClientRect().bottom;
      const pagEl = panel.querySelector('.apply-pagination-wrap');
      let pagH = pagEl ? pagEl.getBoundingClientRect().height : 52;
      if (pagH < 40) pagH = 52;
      const borderY =
        (parseFloat(window.getComputedStyle(panel).borderTopWidth) || 0) +
        (parseFloat(window.getComputedStyle(panel).borderBottomWidth) || 0);
      const next = Math.max(240, Math.floor(targetBottom - panelTop - pagH - borderY));
      if (Math.abs((this.mainTableHeight || 0) - next) >= 2) {
        this.mainTableHeight = next;
      }
      this.$nextTick(() => {
        if (this.$refs.focus18Table && this.$refs.focus18Table.doLayout) {
          this.$refs.focus18Table.doLayout();
        }
        const overshoot = panel.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.focus18Table && this.$refs.focus18Table.doLayout) {
              this.$refs.focus18Table.doLayout();
            }
          });
        }
      });
    },
    loadTree() {
      listFocus18Categories().then(rows => {
        const cats = Array.isArray(rows) ? rows.filter(Boolean) : [];
        this.treeData = [{
          id: "root",
          label: "全部分类",
          nodeType: "root",
          children: cats.map(name => ({
            id: "cat:" + name,
            label: name,
            nodeType: "category",
            category: name,
            children: []
          }))
        }];
        this.$nextTick(() => {
          if (this.$refs.categoryTree) {
            const key = this.treeCategory ? ("cat:" + this.treeCategory) : "root";
            this.$refs.categoryTree.setCurrentKey(key);
          }
          this.updateMainTableHeight();
        });
      }).catch(() => {
        this.treeData = [{
          id: "root",
          label: "全部分类",
          nodeType: "root",
          children: []
        }];
      });
    },
    handleNodeClick(data) {
      if (!data || data.nodeType === "root") {
        this.treeCategory = null;
        this.queryParams.categoryExact = null;
      } else if (data.nodeType === "category") {
        this.treeCategory = data.category;
        this.queryParams.categoryExact = data.category;
        this.queryParams.category = null;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    buildListQuery() {
      const q = { ...this.queryParams };
      // 左侧树精确类别优先；避免与搜索框模糊类别同时生效
      if (q.categoryExact) {
        q.category = null;
      }
      return q;
    },
    getList() {
      this.loading = true;
      listFocus18(this.buildListQuery()).then(response => {
        const rows = response.rows || [];
        this.dataList = rows.map((item, index) => ({
          ...item,
          index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
        }));
        this.total = response.total || 0;
      }).catch(() => {
        this.dataList = [];
        this.total = 0;
      }).finally(() => {
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: null,
        parentId: 0,
        category: this.treeCategory || null,
        classCode: null,
        level1: null,
        level2: null,
        level3: null,
        genericCode: null,
        medicalGenericName: null,
        materialCode: null,
        material: null,
        featureCode: null,
        featureParam: null,
        remark: null
      };
      this.resetForm("form");
    },
    handleQuery() {
      // 手动搜索时以表单为准，清掉树精确条件
      this.treeCategory = null;
      this.queryParams.categoryExact = null;
      if (this.$refs.categoryTree) {
        this.$refs.categoryTree.setCurrentKey("root");
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams.category = null;
      this.queryParams.classCode = null;
      this.queryParams.medicalGenericName = null;
      this.queryParams.genericCode = null;
      this.treeCategory = null;
      this.queryParams.categoryExact = null;
      this.queryParams.parentId = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      if (this.$refs.focus18Table && this.$refs.focus18Table.clearSort) {
        this.$refs.focus18Table.clearSort();
      }
      if (this.$refs.categoryTree) {
        this.$refs.categoryTree.setCurrentKey("root");
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        category: 'category',
        classCode: 'class_code',
        level1: 'level1',
        level2: 'level2',
        level3: 'level3',
        genericCode: 'generic_code',
        medicalGenericName: 'medical_generic_name',
        materialCode: 'material_code',
        material: 'material',
        featureCode: 'feature_code'
      };
      if (!order) {
        this.queryParams.orderByColumn = null;
        this.queryParams.isAsc = null;
      } else {
        this.queryParams.orderByColumn = columnMap[prop] || prop;
        this.queryParams.isAsc = order;
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    handleSelectionChange(selection) {
      this.ids = (selection || []).map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    focus18RowClassName({ row }) {
      void this.rowHighlightTick;
      const rid = row && row.id != null ? String(row.id) : '';
      if (rid && this.ids.some(id => String(id) === rid)) {
        return 'apply-row-selected';
      }
      return '';
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "新增18类重点耗材";
    },
    handleUpdate(row) {
      this.reset();
      const id = (row && row.id) || this.ids[0];
      getFocus18(id).then(response => {
        this.form = response.data || {};
        this.open = true;
        this.title = "修改18类重点耗材";
      });
    },
    submitForm() {
      this.$refs.form.validate(valid => {
        if (!valid) return;
        const req = this.form.id != null ? updateFocus18(this.form) : addFocus18(this.form);
        req.then(() => {
          this.$modal.msgSuccess(this.form.id != null ? "修改成功" : "新增成功");
          this.open = false;
          this.loadTree();
          this.getList();
        });
      });
    },
    handleDelete(row) {
      const ids = (row && row.id) != null ? row.id : this.ids;
      this.$modal.confirm("确认删除选中的18类重点耗材？").then(() => {
        return delFocus18(ids);
      }).then(() => {
        this.loadTree();
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download("foundation/focus18/export", { ...this.buildListQuery() }, `focus18_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style scoped>
.f18-layout-row {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.f18-left-col,
.f18-right-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.f18-side-panel {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
  background: #fff;
  border: 1px solid #e8ecf1;
  border-radius: 10px;
  overflow: hidden;
}

.f18-side-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 0 0 auto;
}

.f18-side-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}

.custom-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  font-size: 14px;
}

.custom-tree-node i {
  color: #409EFF;
  flex-shrink: 0;
}

.f18-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.focus18-page .f18-main > .list-query-panel,
.focus18-page .f18-main > .f18-toolbar,
.focus18-page .f18-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.focus18-page .f18-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.f18-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.f18-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.f18-query-actions {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.apply-table-panel {
  flex: 0 0 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  padding: 0;
  margin: 0 !important;
  background: #fff !important;
  border: 1px solid #e8ecf1 !important;
  border-radius: 10px !important;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05) !important;
  overflow: hidden;
  height: auto !important;
  width: 100%;
  box-sizing: border-box;
}

.apply-table-panel > .apply-main-table {
  flex: 0 0 auto;
  min-height: 0;
  margin-bottom: 0 !important;
  border-radius: 0;
  box-shadow: none;
}

.apply-pagination-wrap {
  flex: 0 0 auto;
  border-top: 1px solid #e2e8f0;
  background: #fff;
  padding: 12px 14px;
  box-sizing: border-box;
}

.apply-pagination-wrap ::v-deep .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  display: flex !important;
  align-items: center !important;
  justify-content: flex-end !important;
  overflow: visible !important;
}

.apply-pagination-wrap ::v-deep .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
  margin: 0 !important;
}

.focus18-page .apply-main-table.el-table {
  position: relative;
}

.focus18-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.focus18-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.focus18-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.focus18-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.focus18-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.focus18-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.focus18-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.focus18-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.focus18-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.focus18-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.focus18-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__body tr > td,
.focus18-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.focus18-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.focus18-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.focus18-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.focus18-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.focus18-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.focus18-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.focus18-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.focus18-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.focus18-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.focus18-page .apply-main-table ::v-deep th.apply-select-col,
.focus18-page .apply-main-table ::v-deep td.apply-select-col,
.focus18-page .apply-main-table ::v-deep th.el-table-column--selection,
.focus18-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.focus18-page .apply-main-table ::v-deep th.apply-action-col,
.focus18-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.focus18-page .apply-main-table ::v-deep td.apply-select-col,
.focus18-page .apply-main-table ::v-deep td.el-table-column--selection,
.focus18-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.focus18-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.focus18-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
}

.focus18-drawer-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 20;
  display: flex;
  justify-content: flex-end;
}

.focus18-drawer-panel {
  width: 560px;
  max-width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.12);
}

.focus18-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
}

.focus18-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.focus18-drawer-close {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.focus18-drawer-close:hover {
  color: #409EFF;
}

.focus18-drawer-body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px 8px;
}

.focus18-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  background: #fff;
}
</style>

<style>
.app-container.focus18-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.focus18-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.focus18-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.focus18-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.focus18-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.focus18-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.focus18-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
