<template>
  <div class="app-container">
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
        <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" v-show="showSearch" class="query-form">
          <el-row :gutter="20">
            <el-col :span="5">
              <el-form-item prop="category">
                <el-input v-model="queryParams.category" placeholder="耗材类别" clearable @keyup.enter.native="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item prop="classCode">
                <el-input v-model="queryParams.classCode" placeholder="耗材分类代码" clearable @keyup.enter.native="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item prop="medicalGenericName">
                <el-input v-model="queryParams.medicalGenericName" placeholder="医保通用名" clearable @keyup.enter.native="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="5">
              <el-form-item prop="genericCode">
                <el-input v-model="queryParams.genericCode" placeholder="通用名代码" clearable @keyup.enter.native="handleQuery" />
              </el-form-item>
            </el-col>
            <el-col :span="4">
              <el-form-item>
                <el-button type="primary" size="small" @click="handleQuery">搜索</el-button>
                <el-button size="small" @click="resetQuery">重置</el-button>
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button type="primary" size="small" @click="handleAdd" v-hasPermi="['foundation:focus18:add']">新增</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="primary" size="small" :disabled="single" @click="handleUpdate" v-hasPermi="['foundation:focus18:edit']">修改</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="primary" size="small" :disabled="multiple" @click="handleDelete" v-hasPermi="['foundation:focus18:remove']">删除</el-button>
          </el-col>
          <el-col :span="1.5">
            <el-button type="primary" size="small" @click="handleExport" v-hasPermi="['foundation:focus18:export']">导出</el-button>
          </el-col>
          <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
        </el-row>

        <el-table v-loading="loading" :data="dataList" :row-class-name="rowIndex" @selection-change="handleSelectionChange" height="calc(100vh - 300px)" stripe>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="55" />
          <el-table-column label="耗材类别" align="center" prop="category" min-width="110" show-overflow-tooltip />
          <el-table-column label="耗材分类代码" align="center" prop="classCode" min-width="120" show-overflow-tooltip />
          <el-table-column label="一级分类(学科/品类)" align="center" prop="level1" min-width="150" show-overflow-tooltip />
          <el-table-column label="二级分类(用途/品目)" align="center" prop="level2" min-width="150" show-overflow-tooltip />
          <el-table-column label="三级分类(部位/功能/品种)" align="center" prop="level3" min-width="170" show-overflow-tooltip />
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

    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="180px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="耗材类别" prop="category">
                <el-input v-model="form.category" placeholder="耗材类别" maxlength="100" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="耗材分类代码" prop="classCode">
                <el-input v-model="form.classCode" placeholder="耗材分类代码" maxlength="100" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="一级分类(学科/品类)" prop="level1">
                <el-input v-model="form.level1" placeholder="一级分类" maxlength="200" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="二级分类(用途/品目)" prop="level2">
                <el-input v-model="form.level2" placeholder="二级分类" maxlength="200" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="三级分类(部位/功能/品种)" prop="level3">
                <el-input v-model="form.level3" placeholder="三级分类" maxlength="200" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="通用名代码" prop="genericCode">
                <el-input v-model="form.genericCode" placeholder="通用名代码" maxlength="100" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="医保通用名" prop="medicalGenericName">
                <el-input v-model="form.medicalGenericName" placeholder="医保通用名" maxlength="200" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="材质代码" prop="materialCode">
                <el-input v-model="form.materialCode" placeholder="材质代码" maxlength="100" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="材质" prop="material">
                <el-input v-model="form.material" placeholder="材质" maxlength="200" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="特征代码" prop="featureCode">
                <el-input v-model="form.featureCode" placeholder="特征代码" maxlength="100" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="24">
              <el-form-item label="特征参数" prop="featureParam">
                <el-input v-model="form.featureParam" placeholder="特征参数" maxlength="500" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="备注" prop="remark">
            <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
          </el-form-item>
        </el-form>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" @click="submitForm">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listFocus18, listFocus18All, getFocus18, addFocus18, updateFocus18, delFocus18 } from "@/api/foundation/focus18";

export default {
  name: "Focus18",
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
      treeData: [],
      treeProps: {
        label: "label",
        children: "children"
      },
      /** 左侧树选中过滤条件 */
      treeFilter: {
        category: null,
        level1: null,
        level2: null,
        level3: null,
        emptyCategory: false
      },
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        category: null,
        classCode: null,
        medicalGenericName: null,
        genericCode: null,
        level1: null,
        level2: null,
        level3: null,
        emptyCategory: null
      },
      form: {},
      rules: {}
    };
  },
  created() {
    this.loadTree();
    this.getList();
  },
  methods: {
    loadTree() {
      listFocus18All({}).then(rows => {
        const list = Array.isArray(rows) ? rows : [];
        this.treeData = [{
          id: "root",
          label: "全部分类",
          nodeType: "root",
          children: this.buildCategoryTree(list)
        }];
      }).catch(() => {
        this.treeData = [{
          id: "root",
          label: "全部分类",
          nodeType: "root",
          children: []
        }];
      });
    },
    buildCategoryTree(rows) {
      const catMap = {};
      rows.forEach(row => {
        const category = (row.category && String(row.category).trim()) || "未分类";
        const level1 = (row.level1 && String(row.level1).trim()) || "";
        const level2 = (row.level2 && String(row.level2).trim()) || "";
        const level3 = (row.level3 && String(row.level3).trim()) || "";

        if (!catMap[category]) {
          catMap[category] = {
            id: "c:" + category,
            label: category,
            nodeType: "category",
            category: category === "未分类" ? "" : category,
            childrenMap: {}
          };
        }
        const catNode = catMap[category];
        if (!level1) return;

        if (!catNode.childrenMap[level1]) {
          catNode.childrenMap[level1] = {
            id: "c:" + category + "|1:" + level1,
            label: level1,
            nodeType: "level1",
            category: catNode.category,
            level1,
            childrenMap: {}
          };
        }
        const l1Node = catNode.childrenMap[level1];
        if (!level2) return;

        if (!l1Node.childrenMap[level2]) {
          l1Node.childrenMap[level2] = {
            id: "c:" + category + "|1:" + level1 + "|2:" + level2,
            label: level2,
            nodeType: "level2",
            category: catNode.category,
            level1,
            level2,
            childrenMap: {}
          };
        }
        const l2Node = l1Node.childrenMap[level2];
        if (!level3) return;

        if (!l2Node.childrenMap[level3]) {
          l2Node.childrenMap[level3] = {
            id: "c:" + category + "|1:" + level1 + "|2:" + level2 + "|3:" + level3,
            label: level3,
            nodeType: "level3",
            category: catNode.category,
            level1,
            level2,
            level3,
            childrenMap: {}
          };
        }
      });

      return Object.keys(catMap).sort().map(catKey => {
        const catNode = catMap[catKey];
        const children = Object.keys(catNode.childrenMap).sort().map(l1Key => {
          const l1Node = catNode.childrenMap[l1Key];
          const l1Children = Object.keys(l1Node.childrenMap).sort().map(l2Key => {
            const l2Node = l1Node.childrenMap[l2Key];
            const l2Children = Object.keys(l2Node.childrenMap).sort().map(l3Key => {
              const l3Node = l2Node.childrenMap[l3Key];
              return {
                id: l3Node.id,
                label: l3Node.label,
                nodeType: l3Node.nodeType,
                category: l3Node.category,
                level1: l3Node.level1,
                level2: l3Node.level2,
                level3: l3Node.level3
              };
            });
            return {
              id: l2Node.id,
              label: l2Node.label,
              nodeType: l2Node.nodeType,
              category: l2Node.category,
              level1: l2Node.level1,
              level2: l2Node.level2,
              children: l2Children
            };
          });
          return {
            id: l1Node.id,
            label: l1Node.label,
            nodeType: l1Node.nodeType,
            category: l1Node.category,
            level1: l1Node.level1,
            children: l1Children
          };
        });
        return {
          id: catNode.id,
          label: catNode.label,
          nodeType: catNode.nodeType,
          category: catNode.category,
          children
        };
      });
    },
    handleNodeClick(data) {
      if (!data || data.nodeType === "root") {
        this.treeFilter = { category: null, level1: null, level2: null, level3: null, emptyCategory: false };
      } else if (data.nodeType === "category" && data.label === "未分类") {
        this.treeFilter = { category: null, level1: null, level2: null, level3: null, emptyCategory: true };
      } else {
        this.treeFilter = {
          category: data.category || null,
          level1: data.level1 || null,
          level2: data.level2 || null,
          level3: data.level3 || null,
          emptyCategory: false
        };
      }
      this.queryParams.pageNum = 1;
      this.getList();
    },
    buildListQuery() {
      const q = { ...this.queryParams };
      if (this.treeFilter.emptyCategory) {
        q.emptyCategory = true;
        q.category = null;
      } else if (this.treeFilter.category) {
        q.category = this.treeFilter.category;
        q.emptyCategory = null;
      }
      if (this.treeFilter.level1) q.level1 = this.treeFilter.level1;
      if (this.treeFilter.level2) q.level2 = this.treeFilter.level2;
      if (this.treeFilter.level3) q.level3 = this.treeFilter.level3;
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
        category: null,
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
      // 新增时带上当前树选中分类
      if (this.treeFilter.category) this.form.category = this.treeFilter.category;
      if (this.treeFilter.level1) this.form.level1 = this.treeFilter.level1;
      if (this.treeFilter.level2) this.form.level2 = this.treeFilter.level2;
      if (this.treeFilter.level3) this.form.level3 = this.treeFilter.level3;
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.treeFilter = { category: null, level1: null, level2: null, level3: null, emptyCategory: false };
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
.tree-card {
  height: calc(100vh - 160px);
  overflow: auto;
}
.tree-card ::v-deep .el-card__body {
  padding: 12px;
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
  min-width: 860px;
  max-width: 92vw;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}
</style>
