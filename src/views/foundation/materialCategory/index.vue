<template>
  <div class="app-container list-page material-category-page">
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
        <el-button
          type="primary"
          size="small"
          class="spd-btn spd-btn--primary"
          @click="handleAdd"
          v-hasPermi="['foundation:materialCategory:add']"
        >新增</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="single"
          @click="handleUpdate"
          v-hasPermi="['foundation:materialCategory:edit']"
        >修改</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="single"
          @click="handleDelete"
          v-hasPermi="['foundation:materialCategory:remove']"
        >删除</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleExport"
          v-hasPermi="['foundation:materialCategory:export']"
        >导出</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          :disabled="multiple"
          @click="handleBatchUpdatePinyinCode"
          v-hasPermi="['foundation:materialCategory:edit']"
        >批量更新材料类别简码</el-button>
        <el-button
          size="small"
          class="spd-btn spd-btn--secondary"
          @click="handleUpdateAllPinyinCode"
          v-hasPermi="['foundation:materialCategory:edit']"
        >全量更新材料类别简码</el-button>
      </div>
      <div class="list-toolbar-right">
        <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
      </div>
    </el-row>

    <el-table v-loading="loading" :data="materialCategoryList" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" stripe>
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" type="index" align="center" width="60"/>
      <el-table-column label="分类编码" align="center" prop="materialCategoryCode" width="120"/>
      <el-table-column label="分类名称" align="center" prop="materialCategoryName" width="180"/>
      <el-table-column label="上级分类编码" align="center" width="120">
        <template slot-scope="scope">
          <span>{{ scope.row.parentCode || "-" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="上级分类" align="center" width="180">
        <template slot-scope="scope">
          <span>{{ scope.row.parentName || "-" }}</span>
        </template>
      </el-table-column>
      <el-table-column label="拼音简码" align="center" prop="pinyinCode" width="120"/>
      <el-table-column label="创建日期" align="center" prop="createTime" width="100">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:materialCategory:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:materialCategory:remove']"
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

    <div v-if="open" class="material-category-drawer-mask" @click.self="cancel">
      <div class="material-category-drawer-panel" @click.stop>
        <div class="material-category-drawer-header">
          <span class="material-category-drawer-title">{{ title }}</span>
          <i class="el-icon-close material-category-drawer-close" @click="cancel" />
        </div>
        <div class="material-category-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="100px">
            <el-form-item label="分类编码" prop="materialCategoryCode">
              <el-input v-model="form.materialCategoryCode" :disabled="isDisabled" placeholder="分类编码" />
            </el-form-item>
            <el-form-item label="分类名称" prop="materialCategoryName">
              <el-input v-model="form.materialCategoryName" placeholder="分类名称" />
            </el-form-item>
            <el-form-item label="拼音简码" prop="pinyinCode">
              <el-input v-model="form.pinyinCode" placeholder="自动生成" disabled />
            </el-form-item>
            <el-form-item label="分类地址" prop="materialCategoryAddress">
              <el-input v-model="form.materialCategoryAddress" type="textarea" :rows="2" placeholder="分类地址" />
            </el-form-item>
            <el-form-item label="联系方式" prop="materialCategoryContact">
              <el-input v-model="form.materialCategoryContact" placeholder="联系方式" />
            </el-form-item>
          </el-form>
        </div>
        <div class="material-category-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listMaterialCategory, getMaterialCategory, delMaterialCategory, addMaterialCategory, updateMaterialCategory, updateMaterialCategoryPinyinCodeBatch, updateMaterialCategoryPinyinCodeAll } from "@/api/foundation/materialCategory";

export default {
  name: "MaterialCategory",
  computed: {
    isDisabled() {
      return this.form.materialCategoryId != null;
    },
    moreSearchStorageKey() {
      return "spd.foundation.materialCategory.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["materialCategoryCode", "materialCategoryName", "pinyinCode"];
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
      materialCategoryList: [],
      title: "",
      open: false,
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "materialCategoryCode", label: "分类编码" },
        { value: "materialCategoryName", label: "分类名称" },
        { value: "pinyinCode", label: "拼音简码" }
      ],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialCategoryCode: null,
        materialCategoryName: null,
        pinyinCode: null,
        materialCategoryAddress: null,
        materialCategoryContact: null,
      },
      form: {},
      rules: {
        materialCategoryCode: [
          { required: true, message: "耗材分类编码不能为空", trigger: "blur" }
        ],
        materialCategoryName: [
          { required: true, message: "耗材分类名称不能为空", trigger: "blur" }
        ],
      }
    };
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
  },
  methods: {
    moreSearchPlaceholderFor(t) {
      const map = {
        materialCategoryCode: "分类编码",
        materialCategoryName: "分类名称",
        pinyinCode: "拼音简码"
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
      ["materialCategoryCode", "materialCategoryName", "pinyinCode"].forEach((k) => {
        if (!set.has(k)) target[k] = null;
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      listMaterialCategory(params).then(response => {
        this.materialCategoryList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        materialCategoryId: null,
        materialCategoryCode: null,
        materialCategoryName: null,
        pinyinCode: null,
        materialCategoryAddress: null,
        materialCategoryContact: null,
        delFlag: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.resetForm("queryForm");
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.queryParams.materialCategoryCode = null;
      this.queryParams.materialCategoryName = null;
      this.queryParams.pinyinCode = null;
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.materialCategoryId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加耗材分类维护";
    },
    handleUpdate(row) {
      this.reset();
      const materialCategoryId = row.materialCategoryId || this.ids
      getMaterialCategory(materialCategoryId).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改耗材分类维护";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.materialCategoryId != null) {
            updateMaterialCategory(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            addMaterialCategory(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const materialCategoryIds = row.materialCategoryId || this.ids;
      this.$modal.confirm('是否确认删除耗材分类维护编号为"' + materialCategoryIds + '"的数据项？').then(function() {
        return delMaterialCategory(materialCategoryIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      this.download('foundation/materialCategory/export', params, `materialCategory_${new Date().getTime()}.xlsx`)
    },
    handleBatchUpdatePinyinCode() {
      const materialCategoryIds = this.ids || [];
      if (!materialCategoryIds.length) {
        this.$modal.msgWarning("请先选择需要更新简码的材料类别");
        return;
      }
      this.$modal.confirm("是否确认批量更新所选材料类别的拼音简码？").then(() => {
        return updateMaterialCategoryPinyinCodeBatch(materialCategoryIds);
      }).then(() => {
        this.$modal.msgSuccess("批量更新材料类别简码成功");
        this.getList();
      }).catch(() => {});
    },
    handleUpdateAllPinyinCode() {
      this.$modal.confirm("是否确认全量更新当前租户所有材料类别的拼音简码？").then(() => {
        return updateMaterialCategoryPinyinCodeAll();
      }).then(() => {
        this.$modal.msgSuccess("全量更新材料类别简码成功");
        this.getList();
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.material-category-page {
  position: relative;
  min-height: calc(100vh - 84px);
  width: 100%;
}

.material-category-drawer-mask {
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

.material-category-drawer-panel {
  width: 520px;
  max-width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.12);
}

.material-category-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
}

.material-category-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.material-category-drawer-close {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.material-category-drawer-close:hover {
  color: #409EFF;
}

.material-category-drawer-body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px 8px;
}

.material-category-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.material-category-drawer-footer .el-button {
  margin: 0 8px;
}
</style>
