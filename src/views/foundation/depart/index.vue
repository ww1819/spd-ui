<template>
  <div class="app-container list-page depart-page">
    <el-row :gutter="8" class="depart-layout-row">
      <!-- 左侧科室树（对齐耗材对照左侧列表） -->
      <el-col :span="5" class="depart-left-col">
        <div class="depart-side-panel" ref="leftStack">
          <div class="depart-side-header">
            <span>科室</span>
          </div>
          <div class="depart-side-list">
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
        </div>
      </el-col>

      <!-- 右侧：查询 / 工具栏 / 明细框 -->
      <el-col :span="19" class="depart-right-col">
        <div class="depart-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="depart-query-row">
                <el-input
                  v-model="queryParams.code"
                  placeholder="科室编码"
                  clearable
                  class="depart-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.name"
                  placeholder="科室名称"
                  clearable
                  class="depart-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.referredName"
                  placeholder="拼音简码"
                  clearable
                  class="depart-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.deptRemark"
                  placeholder="备注模糊查询"
                  clearable
                  class="depart-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <div class="depart-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar depart-toolbar">
            <div class="list-toolbar-left">
              <el-button
                v-if="!isZqTcmTenant"
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                @click="handleAdd"
                v-hasPermi="['foundation:depart:add']"
              >新增</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleUpdate"
                v-hasPermi="['foundation:depart:edit']"
              >修改</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleDelete"
                v-hasPermi="['foundation:depart:remove']"
              >删除</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="multiple"
                @click="handleUpdateReferred"
                v-hasPermi="['foundation:depart:updateReferred']"
              >更新简码</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleExport"
                v-hasPermi="['foundation:depart:export']"
              >导出</el-button>
              <el-button
                v-if="!isZqTcmTenant"
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('add')"
                v-hasPermi="['foundation:depart:import']"
              >新增导入</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleImport('update')"
                v-hasPermi="['foundation:depart:import']"
              >更新导入</el-button>
              <msun-his-sync-button sync-type="depts" label="HIS科室同步" :inline="true" :refresh="getList" />
              <el-button
                v-if="showMsunProbe"
                size="small"
                class="spd-btn spd-btn--secondary"
                icon="el-icon-connection"
                @click="goMsunProbe"
              >众阳接口联调</el-button>
            </div>
            <div class="list-toolbar-right">
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
            </div>
          </el-row>

          <div class="apply-table-panel" ref="tablePanel">
            <el-table
              ref="departTable"
              v-loading="loading"
              :data="departList"
              class="apply-main-table"
              border
              stripe
              :height="mainTableHeight"
              :row-class-name="departRowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
              <el-table-column label="科室编码" align="center" prop="code" width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="科室名称" align="center" prop="name" min-width="180" sortable="custom" show-overflow-tooltip />
              <el-table-column label="简码" align="center" prop="referredName" width="120" sortable="custom" show-overflow-tooltip />
              <el-table-column label="备注" align="center" prop="deptRemark" min-width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="HIS科室编码" align="center" prop="hisId" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="院区" align="center" prop="campus" width="130" sortable="custom" show-overflow-tooltip />
              <el-table-column label="操作" align="center" class-name="apply-action-col" width="240">
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
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['foundation:depart:edit']"
                  >修改</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['foundation:depart:remove']"
                  >删除</el-button>
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
    <div v-if="open" class="page-drawer-mask" @click.self="cancel">
      <div class="page-drawer-panel" @click.stop>
        <div class="page-drawer-header">
          <span class="page-drawer-title">{{ title }}</span>
          <i class="el-icon-close page-drawer-close" @click="cancel" />
        </div>
        <div class="page-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="科室编码" prop="code">
              <el-input v-model="form.code" placeholder="科室编码" />
            </el-form-item>
            <el-form-item label="科室名称" prop="name">
              <el-input v-model="form.name" placeholder="科室名称" />
            </el-form-item>
            <el-form-item label="简码" prop="referredName">
              <el-input v-model="form.referredName" placeholder="可留空，保存后可用「更新简码」生成" />
            </el-form-item>
            <el-form-item label="HIS科室编码" prop="hisId">
              <el-input
                v-model="form.hisId"
                :disabled="!!form.id || !departImportRequiresHisDeptId"
                :placeholder="hisThirdPartyPlaceholder"
              />
            </el-form-item>
            <el-form-item label="院区" prop="campus">
              <el-input v-model="form.campus" placeholder="可手工维护，非必填" clearable maxlength="128" />
            </el-form-item>
            <el-form-item label="备注" prop="deptRemark">
              <el-input v-model="form.deptRemark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
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
            <el-form-item label="启用" prop="status">
              <el-select v-model="form.status" placeholder="请选择" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
          </el-form>
        </div>
        <div class="page-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
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
          title="衡水市第三人民医院：手工新增与 Excel 新增科室时「HIS科室编码」（第三方系统科室编码）必填；已存在科室的修改/导入更新不会改库中该编码。"
        />
        <p style="color:#909399;font-size:13px;margin:0 0 12px;line-height:1.5;">
          <strong>增量导入</strong>：只新增不存在的科室编码，或勾选「更新已存在」后<strong>仅更新科室名称</strong>（简码随名称自动生成，不更新备注与 HIS 科室编码）。不会删除未出现在文件中的科室。先整单校验并确认后写入。
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
import MsunHisSyncButton from '@/components/MsunHisSyncButton';
import { isMsunIntegratedTenant } from '@/utils/msunHis';

export default {
  name: "depart",
  dicts: ['is_use_status'],
  components: { Treeselect, MsunHisSyncButton },
  computed: {
    ...mapGetters(["departImportRequiresHisDeptId", "isZqTcmTenant"]),
    showMsunProbe() {
      return isMsunIntegratedTenant(this.$store.getters.customerId);
    },
    hisThirdPartyPlaceholder() {
      if (this.form && this.form.id) {
        return "仅展示，保存后不可在此修改";
      }
      if (this.departImportRequiresHisDeptId) {
        return "必填：第三方系统科室编码（与 HIS 一致）";
      }
      return "本组织机构手工新增不维护此项";
    }
  },
  data() {
    return {
      loading: true,
      ids: [],
      rowHighlightTick: 0,
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      departList: [],
      deptTreeData: [],
      deptFlatForSelect: [],
      parentTreeselectOptions: [],
      treeSelectedKey: "root",
      mainTableHeight: 400,
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        referredName: null,
        deptRemark: null,
        treeParentId: null,
        orderByColumn: null,
        isAsc: null
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
      form: {},
      rules: {
        code: [
          { required: true, message: "科室编码不能为空", trigger: "blur" }
        ],
        name: [
          { required: true, message: "科室名称不能为空", trigger: "blur" }
        ],
        hisId: [
          {
            validator: (rule, value, callback) => {
              if (!this.form.id && this.departImportRequiresHisDeptId) {
                if (value === undefined || value === null || String(value).trim() === "") {
                  callback(new Error("衡水市第三人民医院新增时必须填写HIS科室编码（第三方系统科室编码）"));
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
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    }
  },
  created() {
    this.treeSelectedKey = "root";
    this.queryParams.treeParentId = null;
    this.refreshDeptTree().then(() => {
      this.getList();
    });
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
    /** 明细框高度：底边对齐左侧科室树 */
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
        if (this.$refs.departTable && this.$refs.departTable.doLayout) {
          this.$refs.departTable.doLayout();
        }
        const overshoot = panel.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.departTable && this.$refs.departTable.doLayout) {
              this.$refs.departTable.doLayout();
            }
          });
        }
      });
    },
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
          this.updateMainTableHeight();
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
    goMsunProbe() {
      this.$router.push({ path: '/foundation/msun-probe/index' });
    },
    getList() {
      this.loading = true;
      const q = { ...this.queryParams };
      if (q.treeParentId == null) {
        delete q.treeParentId;
      }
      listdepart(q).then(response => {
        const rows = response.rows || [];
        this.departList = rows.map((item, index) => ({
          ...item,
          index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
        }));
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      }).catch(() => {
        this.loading = false;
        this.departList = [];
        this.total = 0;
      });
    },
    cancel() {
      this.open = false;
      this.reset();
    },
    reset() {
      this.form = {
        id: null,
        code: null,
        name: null,
        referredName: null,
        deptRemark: null,
        hisId: null,
        campus: null,
        parentId: null,
        status: "1",
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
      this.queryParams.code = null;
      this.queryParams.name = null;
      this.queryParams.referredName = null;
      this.queryParams.deptRemark = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      this.treeSelectedKey = "root";
      this.queryParams.treeParentId = null;
      if (this.$refs.departTable && this.$refs.departTable.clearSort) {
        this.$refs.departTable.clearSort();
      }
      this.$nextTick(() => {
        if (this.$refs.deptTree) {
          this.$refs.deptTree.setCurrentKey("root");
        }
      });
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        code: 'code',
        name: 'name',
        referredName: 'referred_name',
        deptRemark: 'remark',
        hisId: 'his_id',
        campus: 'campus'
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
    departRowClassName({ row }) {
      void this.rowHighlightTick;
      const rid = row && row.id != null ? String(row.id) : '';
      if (rid && this.ids.some(id => String(id) === rid)) {
        return 'apply-row-selected';
      }
      return '';
    },
    handleAdd() {
      if (this.isZqTcmTenant) {
        this.$modal.msgWarning('枣强县中医院不允许手工新增，请从HIS系统同步');
        return;
      }
      this.reset();
      this.open = true;
      this.title = "添加科室";
      this.$nextTick(() => this.rebuildParentTreeselectOptions());
    },
    handleUpdate(row) {
      this.reset();
      const rawId = row && row.id != null ? row.id : this.ids;
      const id = Array.isArray(rawId) ? (rawId.length > 0 ? rawId[0] : null) : rawId;
      if (id == null) {
        return;
      }
      getdepart(id).then(response => {
        this.form = response.data || {};
        if (!this.form.status) {
          this.$set(this.form, 'status', '1');
        }
        this.open = true;
        this.title = "修改科室";
        this.$nextTick(() => this.rebuildParentTreeselectOptions());
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updatedepart(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.refreshDeptTree();
            });
          } else {
            adddepart(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.refreshDeptTree();
            });
          }
        }
      });
    },
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
    handleExport() {
      const q = { ...this.queryParams };
      this.download('foundation/depart/export', q, `depart_${new Date().getTime()}.xlsx`);
    },
    handleImport(mode) {
      if (this.isZqTcmTenant && mode === 'add') {
        this.$modal.msgWarning('枣强县中医院不允许手工新增，请从HIS系统同步');
        return;
      }
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
      this.download(api, {}, `fd_department_template_${new Date().getTime()}.xlsx`);
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
.depart-layout-row {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.depart-left-col,
.depart-right-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.depart-side-panel {
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

.depart-side-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 0 0 auto;
}

.depart-side-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 12px 12px;
}

.depart-side-list ::v-deep .el-tree-node__content {
  height: 34px;
}

.depart-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.depart-page .depart-main > .list-query-panel,
.depart-page .depart-main > .depart-toolbar,
.depart-page .depart-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.depart-page .depart-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.depart-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.depart-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.depart-query-actions {
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

.depart-page .apply-main-table.el-table {
  position: relative;
}

.depart-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.depart-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.depart-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.depart-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.depart-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.depart-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.depart-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.depart-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.depart-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.depart-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.depart-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.depart-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.depart-page .apply-main-table ::v-deep .el-table__body tr > td,
.depart-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.depart-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.depart-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.depart-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.depart-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.depart-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.depart-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.depart-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.depart-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.depart-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.depart-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.depart-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.depart-page .apply-main-table ::v-deep th.apply-select-col,
.depart-page .apply-main-table ::v-deep td.apply-select-col,
.depart-page .apply-main-table ::v-deep th.el-table-column--selection,
.depart-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.depart-page .apply-main-table ::v-deep th.apply-action-col,
.depart-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.depart-page .apply-main-table ::v-deep td.apply-select-col,
.depart-page .apply-main-table ::v-deep td.el-table-column--selection,
.depart-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.depart-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.depart-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.depart-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.depart-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.depart-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
}

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
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
  overflow-y: auto;
  max-height: 90%;
}

.page-drawer-mask {
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

.page-drawer-panel {
  width: 520px;
  max-width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.12);
}

.page-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
}

.page-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.page-drawer-close {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.page-drawer-close:hover {
  color: #409EFF;
}

.page-drawer-body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px 8px;
}

.page-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.page-drawer-footer .el-button {
  margin: 0 8px;
}
</style>

<style>
.app-container.depart-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.depart-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.depart-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.depart-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.depart-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.depart-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.depart-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
