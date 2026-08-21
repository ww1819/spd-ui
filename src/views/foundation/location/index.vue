<template>
  <div class="app-container list-page">
    <el-row :gutter="20">
      <!-- 左侧树形菜单 -->
      <el-col :span="4">
        <el-card class="tree-card">
          <el-tree
            :data="treeData"
            :props="treeProps"
            node-key="locationId"
            highlight-current
            @node-click="handleNodeClick"
            :indent="20"
            :default-expand-all="true"
        >
            <span slot-scope="{ node }" class="custom-tree-node">
              <i class="el-icon-folder-opened" />
              <span>{{ node.label }}</span>
            </span>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 右侧表格区域 -->
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
            <el-button
              type="primary"
              size="small"
              class="spd-btn spd-btn--primary"
              @click="handleAdd"
              v-hasPermi="['foundation:location:add']"
            >新增</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              :disabled="single"
              @click="handleUpdate"
              v-hasPermi="['foundation:location:edit']"
            >修改</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              :disabled="single"
              @click="handleDelete"
              v-hasPermi="['foundation:location:remove']"
            >删除</el-button>
            <el-button
              size="small"
              class="spd-btn spd-btn--secondary"
              @click="handleExport"
              v-hasPermi="['foundation:location:export']"
            >导出</el-button>
          </div>
          <div class="list-toolbar-right">
            <right-toolbar :showSearch.sync="showSearch" @queryTable="getList"></right-toolbar>
          </div>
        </el-row>

        <el-table v-loading="loading" :data="locationList" :row-class-name="locationIndex" @selection-change="handleSelectionChange" height="calc(100vh - 330px)" stripe>
          <el-table-column type="selection" width="55" align="center" />
          <el-table-column label="序号" align="center" prop="index" width="50"/>
          <el-table-column label="货位编码" align="center" prop="locationCode" width="120"/>
          <el-table-column label="货位名称" align="center" prop="locationName" width="180"/>
          <el-table-column label="五区" align="center" prop="zoneType" width="100">
            <template slot-scope="scope">
              <span>{{ zoneTypeLabel(scope.row.zoneType) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="货架" align="center" prop="shelfCode" width="90"/>
          <el-table-column label="层/格" align="center" width="80">
            <template slot-scope="scope">
              <span v-if="scope.row.layerNo != null || scope.row.slotNo != null">{{ scope.row.layerNo || '-' }}/{{ scope.row.slotNo || '-' }}</span>
            </template>
          </el-table-column>
          <el-table-column label="仓库" align="center" prop="warehouseName" width="150"/>
          <el-table-column label="组织机构ID" align="center" prop="tenantId" width="120" show-overflow-tooltip />
          <el-table-column label="备注" align="center" prop="remark" min-width="100" show-overflow-tooltip />
          <el-table-column label="上级货位" align="center" width="150">
            <template slot-scope="scope">
              <span v-if="scope.row.parentId && scope.row.parentId !== 0">{{ getParentLocationName(scope.row.parentId) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="创建日期" align="center" prop="createTime" width="100">
            <template slot-scope="scope">
              <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
            </template>
          </el-table-column>
          <el-table-column label="启用" align="center" width="100">
            <template slot-scope="scope">
              <el-switch
                v-model="scope.row.delFlag"
                :active-value="0"
                :inactive-value="1"
                @change="handleStatusChange(scope.row)"
              ></el-switch>
            </template>
          </el-table-column>
          <el-table-column label="操作" align="center" class-name="small-padding fixed-width" width="120">
            <template slot-scope="scope">
              <el-button
                size="small"
                type="text"
                @click="handleUpdate(scope.row)"
                v-hasPermi="['foundation:location:edit']"
              >修改</el-button>
              <el-button
                size="small"
                type="text"
                @click="handleDelete(scope.row)"
                v-hasPermi="['foundation:location:remove']"
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

    <!-- 添加或修改货位对话框 -->
    <div v-if="open" class="local-modal-mask">
      <div class="local-modal-content">
        <div style="font-size:18px;font-weight:bold;margin-bottom:16px;">{{ title }}</div>
        <el-form ref="form" :model="form" :rules="rules" label-width="120px">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="货位编码" prop="locationCode">
                <el-input v-model="form.locationCode" :disabled="isDisabled" placeholder="货位编码" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="货位名称" prop="locationName">
                <el-input v-model="form.locationName" placeholder="货位名称" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="选择仓库" prop="warehouseId">
                <SelectWarehouse v-model="form.warehouseId" placeholder="仓库" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="选择上级货位" prop="parentId">
                <el-select v-model="form.parentId" placeholder="上级货位" clearable style="width: 100%">
                  <el-option
                    v-for="item in parentOptions"
                    :key="item.locationId"
                    :label="item.locationName"
                    :value="item.locationId"
                    :disabled="form.locationId && item.locationId === form.locationId"
                  ></el-option>
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="五区类型" prop="zoneType">
                <el-select v-model="form.zoneType" placeholder="五区" clearable style="width: 100%">
                  <el-option v-for="z in zoneOptions" :key="z.value" :label="z.label" :value="z.value" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="货架编码" prop="shelfCode">
                <el-input v-model="form.shelfCode" placeholder="如 A01" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="层号" prop="layerNo">
                <el-input-number v-model="form.layerNo" :min="1" :max="99" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="格口号" prop="slotNo">
                <el-input-number v-model="form.slotNo" :min="1" :max="99" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="容量" prop="capacity">
                <el-input-number v-model="form.capacity" :min="0" :precision="2" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="8">
              <el-form-item label="坐标X(米)" prop="posX">
                <el-input-number v-model="form.posX" :precision="2" :step="0.5" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="坐标Y(米)" prop="posY">
                <el-input-number v-model="form.posY" :precision="2" :step="0.5" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="坐标Z(米)" prop="posZ">
                <el-input-number v-model="form.posZ" :precision="2" :step="0.1" controls-position="right" style="width: 100%" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="组织机构ID">
                <el-input v-model="form.tenantId" disabled placeholder="保存后由系统写入" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="备注" prop="remark">
                <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="可选" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
        <div class="dialog-footer" style="text-align:right;margin-top:16px;">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">确 定</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listLocation, getLocation, delLocation, addLocation, updateLocation, treeselect } from "@/api/foundation/location";
import SelectWarehouse from '@/components/SelectModel/SelectWarehouse';
import { mapGetters } from "vuex";

export default {
  name: "Location",
  components: {
    SelectWarehouse
  },
  data() {
    return {
      // 树形数据
      treeData: [],
      treeProps: {
        label: 'locationName',
        children: 'children'
      },
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
      moreSearchTypes: [],
      moreSearchOptions: [
        { value: "locationCode", label: "货位编码" },
        { value: "locationName", label: "货位名称" }
      ],
      // 总条数
      total: 0,
      // 货位表格数据
      locationList: [],
      // 弹出层标题
      title: "",
      // 是否显示弹出层
      open: false,
      // 查询参数
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        locationCode: null,
        locationName: null,
      },
      // 表单参数
      form: {},
      // 父级货位选项
      parentOptions: [],
      // 货位映射（用于根据ID快速查找货位名称）
      locationMap: {},
      // 表单校验
      rules: {
        locationCode: [
          { required: true, message: "货位编码不能为空", trigger: "blur" }
        ],
        locationName: [
          { required: true, message: "货位名称不能为空", trigger: "blur" }
        ],
      },
      zoneOptions: [
        { value: 'PENDING_CHECK', label: '待验区' },
        { value: 'QUALIFIED', label: '合格区' },
        { value: 'UNQUALIFIED', label: '不合格区' },
        { value: 'RETURN', label: '退货区' },
        { value: 'PENDING_SHIP', label: '待发区' }
      ]
    };
  },
  computed: {
    ...mapGetters(['customerId']),
    isDisabled() {
      return this.form.locationId != null;
    },
    moreSearchStorageKey() {
      return "spd.foundation.location.moreSearchTypes";
    },
    builtInMoreSearchDefaults() {
      return ["locationCode", "locationName"];
    }
  },
  created() {
    this.moreSearchTypes = this.loadMoreSearchDefaults();
    this.onMoreSearchTypesChange();
    this.getList();
  },
  methods: {
    moreSearchPlaceholderFor(t) {
      const map = { locationCode: "货位编码", locationName: "货位名称" };
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
      ["locationCode", "locationName"].forEach((k) => {
        if (!set.has(k)) target[k] = null;
      });
    },
    onMoreSearchTypesChange() {
      this.applyMoreSearchToQueryParams(this.queryParams);
    },
    zoneTypeLabel(val) {
      const hit = this.zoneOptions.find(z => z.value === val);
      return hit ? hit.label : (val || '合格区');
    },
    /** 查询货位列表 */
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      // 并行获取列表数据和树形数据
      Promise.all([
        listLocation(params),
        treeselect()
      ]).then(([listResponse, treeResponse]) => {
        const allData = treeResponse.data || [];
        // 构建货位映射
        this.buildLocationMap(allData);
        // 设置列表数据
        this.locationList = listResponse.rows;
        this.total = listResponse.total;
        // 构建树形数据
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          locationId: 'root',
          locationName: '全部货位',
          children: tree
        }];
        // 构建父级选项（排除当前编辑的项）
        this.parentOptions = this.buildParentOptions(allData, this.form.locationId);
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    /** 加载树形数据 */
    loadTreeData() {
      treeselect().then(response => {
        const allData = response.data || [];
        // 构建货位映射
        this.buildLocationMap(allData);
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          locationId: 'root',
          locationName: '全部货位',
          children: tree
        }];
        // 构建父级选项（排除当前编辑的项）
        this.parentOptions = this.buildParentOptions(allData, this.form.locationId);
      });
    },
    /** 构建货位映射 */
    buildLocationMap(data) {
      this.locationMap = {};
      data.forEach(item => {
        this.locationMap[item.locationId] = item.locationName;
      });
    },
    /** 根据父货位ID获取父货位名称 */
    getParentLocationName(parentId) {
      return this.locationMap[parentId] || '';
    },
    /** 构建树形结构 */
    buildTree(data, parentId) {
      const tree = [];
      data.forEach(item => {
        if (item.parentId === parentId || (parentId === 0 && (item.parentId === null || item.parentId === 0))) {
          const children = this.buildTree(data, item.locationId);
          if (children.length > 0) {
            item.children = children;
          }
          tree.push(item);
        }
      });
      return tree;
    },
    /** 构建父级选项 */
    buildParentOptions(data, excludeId) {
      const options = [{ locationId: 0, locationName: '顶级货位' }];
      data.forEach(item => {
        if (item.locationId !== excludeId) {
          options.push(item);
        }
      });
      return options;
    },
    /** 树节点点击事件 */
    handleNodeClick(data) {
      if (data.locationId !== 'root') {
        console.log('选中节点:', data);
        // 此处可添加筛选逻辑
      }
    },
    // 取消按钮
    cancel() {
      this.open = false;
      this.reset();
    },
    // 表单重置
    reset() {
      this.form = {
        locationId: null,
        parentId: 0,
        locationCode: null,
        locationName: null,
        warehouseId: null,
        zoneType: 'QUALIFIED',
        shelfCode: null,
        layerNo: null,
        slotNo: null,
        posX: null,
        posY: null,
        posZ: null,
        capacity: null,
        delFlag: null,
        tenantId: null,
        remark: null,
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
      this.moreSearchTypes = this.loadMoreSearchDefaults();
      this.queryParams.locationCode = null;
      this.queryParams.locationName = null;
      this.onMoreSearchTypesChange();
      this.handleQuery();
    },
    // 多选框选中数据
    handleSelectionChange(selection) {
      this.ids = selection.map(item => item.locationId)
      this.single = selection.length!==1
      this.multiple = !selection.length
    },
    /** 新增按钮操作 */
    handleAdd() {
      this.reset();
      this.form.tenantId = this.customerId || null;
      this.loadTreeData();
      this.open = true;
      this.title = "添加货位";
    },
    /** 修改按钮操作 */
    handleUpdate(row) {
      this.reset();
      const locationId = row.locationId || this.ids
      getLocation(locationId).then(response => {
        this.form = response.data;
        this.loadTreeData();
        this.open = true;
        this.title = "修改货位";
      });
    },
    /** 提交按钮 */
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.locationId != null) {
            updateLocation(this.form).then(response => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            // 如果没有设置parentId，默认为0（顶级货位）
            if (this.form.parentId === null || this.form.parentId === undefined) {
              this.form.parentId = 0;
            }
            addLocation(this.form).then(response => {
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
      const locationIds = row.locationId || this.ids;
      this.$modal.confirm('是否确认删除货位编号为"' + locationIds + '"的数据项？').then(() => {
        return delLocation(locationIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    locationIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1;
    },
    /** 状态修改 */
    handleStatusChange(row) {
      let text = row.delFlag === 0 ? "启用" : "禁用";
      this.$modal.confirm('确认要"' + text + '""' + row.locationName + '"货位吗？').then(() => {
        return updateLocation(row);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
        this.getList();
      }).catch(() => {
        row.delFlag = row.delFlag === 0 ? 1 : 0;
      });
    },
    /** 导出按钮操作 */
    handleExport() {
      const params = { ...this.queryParams };
      this.applyMoreSearchToQueryParams(params);
      this.download('foundation/location/export', params, `location_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.tree-card {
  margin-right: 15px;
  height: calc(100vh - 180px);
  overflow-y: auto;
}
.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 3px 0;
}
.el-tree {
  background: transparent;
  padding: 10px;
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
  min-width: 900px;
  width: 900px;
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

