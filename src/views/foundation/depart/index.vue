<template>
  <div class="app-container department-container">
    <el-row :gutter="20">
      <!-- 左侧科室列表 -->
      <el-col :span="6">
        <el-card class="department-card">
          <div slot="header" class="department-header">
            <span>科室</span>
          </div>
          <div class="department-tree-wrap">
            <el-tree
              ref="deptTree"
              :data="deptTreeData"
              node-key="nodeKey"
              :props="{ label: 'label', children: 'children' }"
              highlight-current
              :default-expanded-keys="['root']"
              :expand-on-click-node="false"
              @node-click="handleDeptTreeNodeClick"
            />
          </div>
        </el-card>
      </el-col>

      <!-- 右侧表格区域 -->
      <el-col :span="18">
    <!-- 查询条件容器 -->
    <div class="query-container" v-show="showSearch">
      <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" label-width="68px">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-form-item label="科室编码" prop="code" label-width="100px">
              <el-input
                v-model="queryParams.code"
                placeholder="请输入科室编码"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="科室名称" prop="name" label-width="100px">
              <el-input
                v-model="queryParams.name"
                placeholder="请输入科室名称"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="简码" prop="referredName" label-width="100px">
              <el-input
                v-model="queryParams.referredName"
                placeholder="拼音简码"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
              />
            </el-form-item>
          </el-col>
          <el-col :span="6">
            <el-form-item label="备注" prop="deptRemark" label-width="100px">
              <el-input
                v-model="queryParams.deptRemark"
                placeholder="备注模糊查询"
                clearable
                @keyup.enter.native="handleQuery"
                style="width: 150px"
              />
            </el-form-item>
          </el-col>
        </el-row>
      </el-form>
    </div>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-plus"
          size="small"
          @click="handleAdd"
          v-hasPermi="['foundation:depart:add']"
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
          v-hasPermi="['foundation:depart:edit']"
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
          v-hasPermi="['foundation:depart:remove']"
        >删除</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          plain
          icon="el-icon-refresh"
          size="small"
          :disabled="multiple"
          @click="handleUpdateReferred"
          v-hasPermi="['foundation:depart:updateReferred']"
        >更新简码</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="warning"
          plain
          icon="el-icon-download"
          size="small"
          @click="handleExport"
          v-hasPermi="['foundation:depart:export']"
        >导出</el-button>
      </el-col>
      <el-col :span="1.8">
        <el-button
          type="info"
          plain
          icon="el-icon-upload2"
          size="small"
          @click="handleImport('add')"
          v-hasPermi="['foundation:depart:import']"
        >新增导入</el-button>
      </el-col>
      <el-col :span="1.8">
        <el-button
          type="info"
          plain
          icon="el-icon-refresh-right"
          size="small"
          @click="handleImport('update')"
          v-hasPermi="['foundation:depart:import']"
        >更新导入</el-button>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          icon="el-icon-search"
          size="small"
          @click="handleQuery"
        >搜索</el-button>
      </el-col>
      <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
    </el-row>

    <el-table v-loading="loading" :data="departList" :row-class-name="departIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" style="width: 100%">
      <el-table-column type="selection" width="55" align="center" />
      <el-table-column label="序号" align="center" prop="index" width="80" show-overflow-tooltip />
      <el-table-column label="科室编码" align="center" prop="code" width="150" show-overflow-tooltip />
      <el-table-column label="科室名称" align="center" prop="name" min-width="200" show-overflow-tooltip />
      <el-table-column label="简码" align="center" prop="referredName" width="120" show-overflow-tooltip />
      <el-table-column label="备注" align="center" prop="deptRemark" min-width="140" show-overflow-tooltip />
      <el-table-column label="HIS科室ID" align="center" prop="thirdPartyDeptId" width="140" show-overflow-tooltip />
      <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="220" fixed="right">
        <template slot-scope="scope">
          <el-button
            size="small"
            type="text"
            icon="el-icon-document"
            @click="openChangeLog(scope.row)"
            v-hasPermi="['foundation:depart:list']"
          >变更记录</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-edit"
            @click="handleUpdate(scope.row)"
            v-hasPermi="['foundation:depart:edit']"
          >修改</el-button>
          <el-button
            size="small"
            type="text"
            icon="el-icon-delete"
            @click="handleDelete(scope.row)"
            v-hasPermi="['foundation:depart:remove']"
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
      </el-col>
    </el-row>

    <!-- 添加或修改科室对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;">
          <span>{{ title }}</span>
          <el-button type="text" @click="cancel" style="font-size:14px;padding:0;color:#909399;">关闭</el-button>
        </div>
        <el-form ref="form" :model="form" :rules="rules" label-width="100px">
          <el-row>
            <el-col :span="6">
              <el-form-item label="科室编码" prop="code">
                <el-input v-model="form.code" placeholder="请输入科室编码" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="科室名称" prop="name">
                <el-input v-model="form.name" placeholder="请输入科室名称" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="简码" prop="referredName">
                <el-input v-model="form.referredName" placeholder="可留空，保存后可用「更新简码」生成" />
              </el-form-item>
            </el-col>
            <el-col :span="6">
              <el-form-item label="HIS科室ID" prop="thirdPartyDeptId">
                <el-input
                  v-model="form.thirdPartyDeptId"
                  :disabled="!!form.id || !departImportRequiresHisDeptId"
                  :placeholder="hisThirdPartyPlaceholder"
                />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备注" prop="deptRemark">
                <el-input v-model="form.deptRemark" type="textarea" :rows="2" placeholder="备注" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="上级科室" prop="parentId">
                <treeselect
                  v-model="form.parentId"
                  :options="parentTreeselectOptions"
                  :normalizer="normalizerDept"
                  placeholder="不选表示客户下顶级科室"
                  clearable
                  no-options-text="暂无科室"
                  style="width:100%"
                />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="modal-footer-fixed">
          <el-button type="primary" @click="submitForm">保 存</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>

    <!-- 科室导入：先全量校验，通过后再确认写入 -->
    <div v-if="upload.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 520px; min-width: 400px; min-height: auto;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ upload.title }}</div>
        <el-alert
          v-if="departImportRequiresHisDeptId"
          type="warning"
          :closable="false"
          show-icon
          style="margin-bottom:12px;"
          title="衡水市第三人民医院：手工新增与 Excel 新增科室时「HIS科室ID」（第三方系统科室ID）必填；已存在科室的修改/导入更新不会改库中该 ID。"
        />
        <p style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>增量导入</strong>：只新增不存在的科室编码，或勾选「更新已存在」后<strong>仅更新科室名称</strong>（简码随名称自动生成，不更新备注与 HIS 科室 ID）。不会删除未出现在文件中的科室。先整单校验并确认后写入。
        </p>
        <el-upload
          ref="upload"
          :limit="1"
          accept=".xlsx, .xls"
          :disabled="upload.isUploading"
          :http-request="noopDepartUpload"
          :on-change="handleDepartImportFileChange"
          :on-remove="handleDepartImportFileRemove"
          :auto-upload="false"
          drag
        >
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">将文件拖到此处，或<em>点击选择</em></div>
          <div class="el-upload__tip text-center" slot="tip">
            <div class="el-upload__tip" slot="tip">
              <el-checkbox v-model="upload.updateSupport" disabled /> 更新模式（按系统主键）
            </div>
            <span>仅允许 xls、xlsx。</span>
            <el-link type="primary" :underline="false" style="font-size:12px;vertical-align: baseline;" @click="importTemplate">下载模板</el-link>
          </div>
        </el-upload>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" :loading="upload.isUploading" @click="submitDepartImportFlow">校验并导入</el-button>
          <el-button @click="closeDepartImport">取 消</el-button>
        </div>
      </div>
    </div>

    <el-dialog
      :title="importPreview.title"
      :visible.sync="importPreview.visible"
      width="90%"
      top="5vh"
      append-to-body
      @close="importPreview.rows = []; importPreview.columns = []"
    >
      <div style="margin-bottom:10px;">
        <el-button type="primary" size="small" icon="el-icon-download" :disabled="!importPreview.rows.length" @click="exportDepartImportPreview">导出解析结果</el-button>
      </div>
      <el-table :data="importPreview.rows" border max-height="520" size="small" style="width:100%">
        <el-table-column
          v-for="col in importPreview.columns"
          :key="col"
          :prop="col"
          :label="col"
          min-width="120"
          show-overflow-tooltip
        />
      </el-table>
      <span slot="footer" class="dialog-footer">
        <el-button @click="importPreview.visible = false">关 闭</el-button>
      </span>
    </el-dialog>

    <div v-if="changeLog.open" class="local-modal-mask">
      <div class="local-modal-content" style="width: 720px; min-width: 400px; min-height: auto; max-width: 92vw;">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">科室变更记录 — {{ changeLog.deptName }}</div>
        <el-table v-loading="changeLog.loading" :data="changeLog.rows" max-height="420" size="small">
          <el-table-column label="时间" prop="changeTime" width="160" />
          <el-table-column label="操作人" prop="operator" width="100" show-overflow-tooltip />
          <el-table-column label="字段" prop="fieldLabel" width="100" show-overflow-tooltip />
          <el-table-column label="原值" prop="oldValue" min-width="120" show-overflow-tooltip />
          <el-table-column label="新值" prop="newValue" min-width="120" show-overflow-tooltip />
        </el-table>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button @click="changeLog.open = false">关 闭</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from "vuex";
import Treeselect from "@riophae/vue-treeselect";
import "@riophae/vue-treeselect/dist/vue-treeselect.css";
import { listdepart, departTree, getdepart, deldepart, adddepart, updatedepart, updateDepartReferred, validateDepartImportAdd, validateDepartImportUpdate, importDepartAddData, importDepartUpdateData, listDepartmentChangeLog } from "@/api/foundation/depart";
import { exportPreviewRowsToXlsx } from "@/utils/importPreviewExport";

export default {
  name: "depart",
  components: { Treeselect },
  computed: {
    ...mapGetters(["departImportRequiresHisDeptId"]),
    hisThirdPartyPlaceholder() {
      if (this.form && this.form.id) {
        return "仅展示，保存后不可在此修改";
      }
      if (this.departImportRequiresHisDeptId) {
        return "必填：第三方系统科室ID（与 HIS 一致）";
      }
      return "本租户手工新增不维护此项";
    },
  },
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
      // 科室表格数据
      departList: [],
      deptTreeData: [],
      deptFlatForSelect: [],
      parentTreeselectOptions: [],
      treeSelectedKey: "root",
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        referredName: null,
        deptRemark: null,
        treeParentId: null,
      },
      upload: {
        open: false,
        title: "",
        isUploading: false,
        updateSupport: false,
        pendingFile: null,
        mode: 'add'
      },
      importPreview: {
        visible: false,
        title: "导入解析结果",
        rows: [],
        columns: []
      },
      changeLog: {
        open: false,
        loading: false,
        deptName: "",
        rows: []
      },
      // 表单参数
      form: {},
      // 表单校验
      rules: {
        code: [
          { required: true, message: "科室编码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "科室名称不能为空", trigger: "blur" }
        ],
        thirdPartyDeptId: [
          {
            validator: (rule, value, callback) => {
              if (!this.form.id && this.departImportRequiresHisDeptId) {
                if (value === undefined || value === null || String(value).trim() === "") {
                  callback(new Error("衡水市第三人民医院新增时必须填写HIS科室ID（第三方系统科室ID）"));
                  return;
                }
              }
              callback();
            },
            trigger: "blur"
          }
        ]
      }
    };
  },
  created() {
    this.treeSelectedKey = "root";
    this.queryParams.treeParentId = null;
    this.refreshDeptTree().then(() => {
      this.getList();
    });
  },
  methods: {
    refreshDeptTree() {
      return departTree().then(res => {
        const data = res.data;
        this.deptTreeData = Array.isArray(data) ? data : [];
        const flat = [];
        if (this.deptTreeData.length && this.deptTreeData[0]) {
          this.flattenDeptTreeNodes(this.deptTreeData[0].children, null, flat);
        }
        this.deptFlatForSelect = flat;
        this.$nextTick(() => {
          if (this.$refs.deptTree && this.treeSelectedKey) {
            this.$refs.deptTree.setCurrentKey(this.treeSelectedKey);
          }
        });
      });
    },
    flattenDeptTreeNodes(nodes, parentDeptId, out) {
      (nodes || []).forEach(n => {
        if (n.deptId != null) {
          out.push({ id: n.deptId, label: n.label, parentId: parentDeptId });
          this.flattenDeptTreeNodes(n.children, n.deptId, out);
        }
      });
    },
    collectDescendantIds(editId) {
      const ex = new Set();
      if (editId == null) {
        return ex;
      }
      ex.add(editId);
      const byParent = new Map();
      (this.deptFlatForSelect || []).forEach(d => {
        const p = d.parentId;
        if (!byParent.has(p)) {
          byParent.set(p, []);
        }
        byParent.get(p).push(d.id);
      });
      const stack = [...(byParent.get(editId) || [])];
      while (stack.length) {
        const id = stack.pop();
        if (ex.has(id)) {
          continue;
        }
        ex.add(id);
        (byParent.get(id) || []).forEach(c => stack.push(c));
      }
      return ex;
    },
    pruneEmptyChildren(nodes) {
      (nodes || []).forEach(n => {
        if (n.children && n.children.length) {
          this.pruneEmptyChildren(n.children);
        } else {
          delete n.children;
        }
      });
    },
    buildTreeselectFromFlat(flat, excludeIds) {
      const items = (flat || []).filter(d => d.id != null && !excludeIds.has(d.id));
      const map = new Map();
      items.forEach(d => {
        map.set(d.id, { id: d.id, label: d.label, children: [] });
      });
      const roots = [];
      for (const d of items) {
        const node = map.get(d.id);
        const pid = d.parentId;
        if (pid != null && map.has(pid)) {
          map.get(pid).children.push(node);
        } else {
          roots.push(node);
        }
      }
      this.pruneEmptyChildren(roots);
      return roots;
    },
    rebuildParentTreeselectOptions() {
      const exclude = this.collectDescendantIds(this.form && this.form.id);
      this.parentTreeselectOptions = this.buildTreeselectFromFlat(this.deptFlatForSelect, exclude);
    },
    normalizerDept(node) {
      return {
        id: node.id,
        label: node.label,
        children: node.children && node.children.length ? node.children : undefined
      };
    },
    handleDeptTreeNodeClick(data) {
      this.treeSelectedKey = data.nodeKey;
      if (data.deptId == null) {
        this.queryParams.treeParentId = null;
      } else {
        this.queryParams.treeParentId = data.deptId;
      }
      this.handleQuery();
    },
    /** 查询科室列表 */
    getList() {
      this.loading = true;
      const q = { ...this.queryParams };
      if (q.treeParentId == null) {
        delete q.treeParentId;
      }
      listdepart(q).then(response => {
        this.departList = response.rows;
        this.total = response.total;
        this.loading = false;
      });
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        id: null,
        code: null,
        name: null,
        referredName: null,
        deptRemark: null,
        thirdPartyDeptId: null,
        parentId: null,
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null
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
      this.treeSelectedKey = "root";
      this.queryParams.treeParentId = null;
      this.$nextTick(() => {
        if (this.$refs.deptTree) {
          this.$refs.deptTree.setCurrentKey("root");
        }
      });
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.id)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.open = true;
      this.title = "添加科室";
      this.$nextTick(() => this.rebuildParentTreeselectOptions());
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const rawId = row && row.id != null ? row.id : this.ids;
      const id = Array.isArray(rawId) ? (rawId.length > 0 ? rawId[0] : null) : rawId;
      if (id == null) {
        return;
      }
      getdepart(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.title = "修改科室";
        this.$nextTick(() => this.rebuildParentTreeselectOptions());
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updatedepart(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.refreshDeptTree();
            });
          } else {
            adddepart(this.form).then(response => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.refreshDeptTree();
            });
          }
        }
      });
    },
    /** 删除按钮操作 */
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除科室编号为"' + ids + '"的数据项？').then(function() {
        return deldepart(ids);
      }).then(() => {
        this.getList();
        this.refreshDeptTree();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    departIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 导出按钮操作 */
    handleExport() {
      this.download('foundation/depart/export', {
        ...this.queryParams
      }, `depart_${new Date().getTime()}.xlsx`)
    },
    handleImport(mode) {
      this.upload.mode = mode === "update" ? "update" : "add";
      this.upload.updateSupport = this.upload.mode === "update";
      this.upload.title = this.upload.mode === "update" ? "科室更新导入" : "科室新增导入";
      this.upload.pendingFile = null;
      this.upload.open = true;
      this.$nextTick(() => {
        if (this.$refs.upload) this.$refs.upload.clearFiles();
      });
    },
    closeDepartImport() {
      this.upload.open = false;
      this.upload.pendingFile = null;
      if (this.$refs.upload) this.$refs.upload.clearFiles();
    },
    noopDepartUpload() {},
    handleDepartImportFileChange(file) {
      this.upload.pendingFile = file && file.raw ? file.raw : null;
    },
    handleDepartImportFileRemove() {
      this.upload.pendingFile = null;
    },
    importTemplate() {
      const api = this.upload.mode === "update" ? 'foundation/depart/importUpdateTemplate' : 'foundation/depart/importAddTemplate';
      this.download(api, {}, `fd_department_template_${new Date().getTime()}.xlsx`)
    },
    openChangeLog(row) {
      if (!row || !row.id) return;
      this.changeLog.open = true;
      this.changeLog.deptName = row.name || "";
      this.changeLog.rows = [];
      this.changeLog.loading = true;
      listDepartmentChangeLog(row.id).then(res => {
        this.changeLog.rows = res.data || [];
        this.changeLog.loading = false;
      }).catch(() => {
        this.changeLog.loading = false;
      });
    },
    showImportPreviewFromPayload(payload, title) {
      const rows = (payload && payload.previewRows) || [];
      this.importPreview.title = title || "导入解析结果";
      this.importPreview.rows = rows;
      this.importPreview.columns = rows.length ? Object.keys(rows[0]) : [];
      this.importPreview.visible = true;
    },
    async exportDepartImportPreview() {
      try {
        const name = (this.upload.mode === "update" ? "depart_update" : "depart_add") + "_preview_" + new Date().getTime() + ".xlsx";
        await exportPreviewRowsToXlsx(this.importPreview.rows, name);
        this.$modal.msgSuccess("已导出");
      } catch (e) {
        this.$modal.msgError(e.message || "导出失败");
      }
    },
    async submitDepartImportFlow() {
      const f = this.upload.pendingFile;
      if (!f) {
        this.$modal.msgWarning("请先选择 Excel 文件");
        return;
      }
      this.upload.isUploading = true;
      try {
        const isUpdate = this.upload.mode === "update";
        const res = isUpdate ? await validateDepartImportUpdate(f) : await validateDepartImportAdd(f);
        const d = res.data || {};
        this.showImportPreviewFromPayload(d, isUpdate ? "科室更新导入 — 解析结果" : "科室新增导入 — 解析结果");
        if (!d.valid) {
          const errs = (d.errors && d.errors.length) ? d.errors.join("<br/>") : (res.msg || "校验失败");
          this.$alert("<div style='overflow:auto;max-height:60vh'>" + errs + "</div>", "校验未通过", { dangerouslyUseHTMLString: true });
          return;
        }
        const tc = d.totalRows != null ? d.totalRows : 0;
        const ic = d.insertCount != null ? d.insertCount : 0;
        const uc = d.updateCount != null ? d.updateCount : 0;
        let confirmText = "校验已通过。共 " + tc + " 行数据，确认后写入数据库，是否继续？";
        if (!isUpdate) {
          confirmText = "校验已通过。共 " + tc + " 行数据，预计新增 " + ic + " 条、更新 " + uc + " 条。确认后写入数据库，是否继续？";
        }
        await this.$modal.confirm(confirmText);
        const res2 = isUpdate ? await importDepartUpdateData(f, true) : await importDepartAddData(f, true);
        const d2 = res2.data || {};
        this.showImportPreviewFromPayload(d2, isUpdate ? "科室更新导入 — 导入结果" : "科室新增导入 — 导入结果");
        this.$alert("<div style='overflow:auto;max-height:60vh;padding:10px 20px 0'>" + res2.msg + "</div>", "导入结果", { dangerouslyUseHTMLString: true });
        this.closeDepartImport();
        this.getList();
        this.refreshDeptTree();
      } catch (e) {
        if (e !== "cancel" && e !== "close") {
          /* request 已提示或控制台 */
        }
      } finally {
        this.upload.isUploading = false;
      }
    },
    /** 更新科室名称简码 */
    handleUpdateReferred() {
      if (!this.ids || this.ids.length === 0) {
        this.$modal.msgWarning("请先选择要更新简码的科室");
        return;
      }
      this.$modal.confirm("是否为选中的科室更新名称简码？").then(() => {
        return updateDepartReferred(this.ids);
      }).then(() => {
        this.$modal.msgSuccess("更新简码成功");
        this.getList();
      }).catch(() => {});
    }
  }
};
</script>

<style scoped>
.local-modal-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  padding: 0;
}

.local-modal-content {
  background: #fff;
  border-radius: 6px;
  width: 100% !important;
  max-width: 1900px !important;
  min-width: 1700px !important;
  max-height: 92%;
  min-height: 870px;
  display: flex;
  flex-direction: column;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
}

/* 科室卡片样式 */
.department-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  display: flex;
  flex-direction: column;
}

.department-card ::v-deep .el-card__header {
  padding: 18px 20px;
  border-bottom: 1px solid #EBEEF5;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 10;
  flex-shrink: 0;
}

.department-card ::v-deep .el-card__body {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.department-header {
  font-weight: bold;
  font-size: 14px;
}

.department-tree-wrap {
  height: 100%;
  overflow: auto;
  padding: 8px 12px 12px;
}

.department-tree-wrap ::v-deep .el-tree-node__content {
  height: 34px;
}

/* 查询条件容器 */
.query-container {
  background: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
  width: 100%;
}

/* 表格列不换行 */
.el-table {
  white-space: nowrap;
}

.el-table td,
.el-table th {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 表格横向滚动 */
.el-table__body-wrapper {
  overflow-x: auto;
}

/* 确保科室容器有相对定位，以便弹窗正确定位 */
.department-container {
  position: relative;
  min-height: calc(100vh - 84px);
  width: 100%;
  overflow: visible;
}

/* 固定底部按钮样式 */
.modal-footer-fixed {
  position: sticky;
  bottom: 0;
  left: 0;
  right: 0;
  background: #fff;
  padding: 16px 24px;
  text-align: center;
  border-top: 1px solid #EBEEF5;
  margin-top: 20px;
  z-index: 10;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.modal-footer-fixed .el-button {
  margin: 0 8px;
}
</style>
