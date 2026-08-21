<template>
  <div class="app-container list-page focus18-page">
    <el-row :gutter="20">
      <!-- 左侧根目录分类 -->
      <el-col :span="4">
        <el-card class="tree-card" shadow="never">
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
        </el-card>
      </el-col>

      <!-- 右侧明细 -->
      <el-col :span="20">
        <div class="query-container" v-show="showSearch">
          <div class="form-fields-container list-query-panel">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <more-search-bar
                ref="moreSearchBar"
                v-model="moreSearchTypes"
                :options="moreSearchOptions"
                :storage-key="moreSearchStorageKey"
                :default-types="builtInMoreSearchDefaults"
                :auto-load="false"
                @change="onMoreSearchTypesChange"
                @search="handleQuery"
                @reset="resetQuery"
              >
                <div
                  v-for="t in moreSearchTypes"
                  :key="t"
                  class="more-search-dynamic-field more-search-field--text"
                >
                  <el-input
                    v-model="queryParams[t]"
                    :placeholder="moreSearchPlaceholderFor(t)"
                    clearable
                    class="more-search-input more-search-input--dynamic"
                    @keyup.enter.native="handleQuery"
                  />
                </div>
              </more-search-bar>
            </el-form>
          </div>
        </div>

        <el-row :gutter="0" class="mb8 list-toolbar">
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

        <el-table v-loading="loading" :data="dataList" :row-class-name="rowIndex" @selection-change="handleSelectionChange" height="calc(100vh - 300px)" stripe>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="55" />
          <el-table-column label="上级菜单" align="center" prop="parentName" min-width="140" show-overflow-tooltip>
            <template slot-scope="scope">
              <span>{{ scope.row.parentName || '全部分类' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="耗材类别" align="center" prop="category" min-width="110" show-overflow-tooltip />
          <el-table-column label="耗材分类代码" align="center" prop="classCode" min-width="170" show-overflow-tooltip />
          <el-table-column label="一级分类(学科/品类)" align="center" prop="level1" min-width="160" show-overflow-tooltip />
          <el-table-column label="二级分类(用途/品目)" align="center" prop="level2" min-width="160" show-overflow-tooltip />
          <el-table-column label="三级分类(部位/功能/品种)" align="center" prop="level3" min-width="220" show-overflow-tooltip />
          <el-table-column label="通用名代码" align="center" prop="genericCode" min-width="110" show-overflow-tooltip />
          <el-table-column label="医保通用名" align="center" prop="medicalGenericName" min-width="140" show-overflow-tooltip />
          <el-table-column label="材质代码" align="center" prop="materialCode" min-width="100" show-overflow-tooltip />
          <el-table-column label="材质" align="center" prop="material" min-width="100" show-overflow-tooltip />
          <el-table-column label="特征代码" align="center" prop="featureCode" min-width="100" show-overflow-tooltip />
          <el-table-column label="特征参数" align="center" prop="featureParam" min-width="120" show-overflow-tooltip />
          <el-table-column label="操作" align="center" width="120" fixed="right" class-name="small-padding fixed-width">
            <template slot-scope="scope">
              <el-button size="small" type="text" @click="handleUpdate(scope.row)" v-hasPermi="['foundation:focus18:edit']">修改</el-button>
              <el-button size="small" type="text" @click="handleDelete(scope.row)" v-hasPermi="['foundation:focus18:remove']">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <pagination v-show="total > 0" :total="total" :page.sync="queryParams.pageNum" :limit.sync="queryParams.pageSize" @pagination="getList" />
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
  computed: {
    moreSearchStorageKey() {
      return "spd.foundation.focus18.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["category", "classCode", "medicalGenericName", "genericCode"];
    }
  },
  data() {
    return {
      loading: true,
      ids: [],
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      dataList: [],
      title: "",
      open: false,
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "category", label: "耗材类别" },
        { value: "classCode", label: "耗材分类代码" },
        { value: "medicalGenericName", label: "医保通用名" },
        { value: "genericCode", label: "通用名代码" }
      ],
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
        emptyCategory: null
      },
      form: {},
      rules: {}
    };
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.loadTree();
    this.getList();
  },
  methods: {
    moreSearchPlaceholderFor(t) {
      const map = {
        category: "耗材类别",
        classCode: "耗材分类代码",
        medicalGenericName: "医保通用名",
        genericCode: "通用名代码"
      };
      return map[t] || "请输入";
    },
    loadMoreSearchDefaults() {
      const bar = this.$refs.moreSearchBar;
      if (bar && typeof bar.loadDefaults === "function") {
        return bar.loadDefaults();
      }
      const fallback = this.builtInMoreSearchDefaults.slice();
      try {
        const raw = localStorage.getItem(this.moreSearchStorageKey);
        if (!raw) return fallback;
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return fallback;
        const allow = new Set(this.moreSearchOptions.map(o => o.value));
        const cleaned = parsed.filter(v => allow.has(v));
        return cleaned.length ? cleaned : fallback;
      } catch (e) {
        return fallback;
      }
    },
    applyMoreSearchToQueryParams(target) {
      const set = new Set(this.moreSearchTypes || []);
      ["category", "classCode", "medicalGenericName", "genericCode"].forEach((k) => {
        if (!set.has(k)) target[k] = null;
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
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
            this.$refs.categoryTree.setCurrentKey("root");
          }
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
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    buildListQuery() {
      const q = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(q);
      // 左侧树精确类别优先；避免与搜索框模糊类别同时生效
      if (q.categoryExact) {
        q.category = null;
      }
      return q;
    },
    getList() {
      this.loading = true;
      listFocus18(this.buildListQuery()).then(response => {
        this.dataList = response.rows || [];
        this.total = response.total || 0;
        this.loading = false;
      }).catch(() => {
        this.dataList = [];
        this.total = 0;
        this.loading = false;
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
      this.resetForm("queryForm");
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.queryParams.category = null;
      this.queryParams.classCode = null;
      this.queryParams.medicalGenericName = null;
      this.queryParams.genericCode = null;
      this.treeCategory = null;
      this.queryParams.categoryExact = null;
      this.queryParams.parentId = null;
      this.onMoreSearchTypesChange();
      if (this.$refs.categoryTree) {
        this.$refs.categoryTree.setCurrentKey("root");
      }
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
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
    rowIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    handleExport() {
      this.download("foundation/focus18/export", { ...this.buildListQuery() }, `focus18_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style scoped>
.focus18-page {
  position: relative;
  min-height: calc(100vh - 84px);
}
.tree-card {
  height: calc(100vh - 160px);
  overflow: auto;
}
.tree-card ::v-deep .el-card__body {
  padding: 12px;
}
/* 表头不换行，避免「三级分类」等长标题把行高撑开 */
.app-container ::v-deep .el-table th > .cell {
  white-space: nowrap;
}
.custom-tree-node {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}
.custom-tree-node i {
  color: #409EFF;
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
