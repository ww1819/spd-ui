<template>
  <div class="app-container list-page location-page">
    <el-row :gutter="8" class="location-layout-row">
      <!-- 左侧货位树（对齐耗材对照左侧列表） -->
      <el-col :span="5" class="location-left-col">
        <div class="location-side-panel" ref="leftStack">
          <div class="location-side-header">
            <span>全部货位</span>
          </div>
          <div class="location-side-list">
            <el-tree
              ref="locationTree"
              :data="treeData"
              :props="treeProps"
              node-key="locationId"
              highlight-current
              :indent="20"
              :default-expand-all="true"
              :expand-on-click-node="false"
              @node-click="handleNodeClick"
            >
              <span slot-scope="{ node }" class="custom-tree-node">
                <i class="el-icon-folder-opened" />
                <span>{{ node.label }}</span>
              </span>
            </el-tree>
          </div>
        </div>
      </el-col>

      <!-- 右侧：查询 / 工具栏 / 明细框 -->
      <el-col :span="19" class="location-right-col">
        <div class="location-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="location-query-row">
                <el-input
                  v-model="queryParams.locationCode"
                  placeholder="货位编码"
                  clearable
                  class="location-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.locationName"
                  placeholder="货位名称"
                  clearable
                  class="location-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <div class="location-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar location-toolbar">
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
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
            </div>
          </el-row>

          <div class="apply-table-panel" ref="tablePanel">
            <el-table
              ref="locationTable"
              v-loading="loading"
              :data="locationList"
              class="apply-main-table"
              border
              stripe
              :height="mainTableHeight"
              :row-class-name="locationRowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
              <el-table-column label="货位编码" align="center" prop="locationCode" width="140" sortable="custom" show-overflow-tooltip />
              <el-table-column label="货位名称" align="center" prop="locationName" min-width="160" sortable="custom" show-overflow-tooltip />
              <el-table-column label="五区" align="center" prop="zoneType" width="120" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ zoneTypeLabel(scope.row.zoneType) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="货架" align="center" prop="shelfCode" width="110" sortable="custom" show-overflow-tooltip />
              <el-table-column label="层/格" align="center" width="100" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span v-if="scope.row.layerNo != null || scope.row.slotNo != null">{{ scope.row.layerNo || '-' }}/{{ scope.row.slotNo || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="仓库" align="center" prop="warehouseName" min-width="140" show-overflow-tooltip />
              <el-table-column label="组织机构ID" align="center" prop="tenantId" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="备注" align="center" prop="remark" min-width="120" show-overflow-tooltip />
              <el-table-column label="上级货位" align="center" width="140" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span v-if="scope.row.parentId && scope.row.parentId !== 0">{{ getParentLocationName(scope.row.parentId) }}</span>
                </template>
              </el-table-column>
              <el-table-column label="创建日期" align="center" prop="createTime" width="150" sortable="custom" show-overflow-tooltip>
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
                  />
                </template>
              </el-table-column>
              <el-table-column label="操作" align="center" class-name="apply-action-col" width="140">
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
                  />
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
      treeData: [],
      treeProps: {
        label: 'locationName',
        children: 'children'
      },
      loading: true,
      ids: [],
      rowHighlightTick: 0,
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      locationList: [],
      mainTableHeight: 400,
      title: "",
      open: false,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        locationCode: null,
        locationName: null,
        orderByColumn: null,
        isAsc: null
      },
      form: {},
      parentOptions: [],
      locationMap: {},
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
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    }
  },
  created() {
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
        if (this.$refs.locationTable && this.$refs.locationTable.doLayout) {
          this.$refs.locationTable.doLayout();
        }
        const overshoot = panel.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.locationTable && this.$refs.locationTable.doLayout) {
              this.$refs.locationTable.doLayout();
            }
          });
        }
      });
    },
    zoneTypeLabel(val) {
      const hit = this.zoneOptions.find(z => z.value === val);
      return hit ? hit.label : (val || '合格区');
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      Promise.all([
        listLocation(params),
        treeselect()
      ]).then(([listResponse, treeResponse]) => {
        const allData = treeResponse.data || [];
        this.buildLocationMap(allData);
        const rows = (listResponse && listResponse.rows) || [];
        this.locationList = rows.map((item, index) => ({
          ...item,
          index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
        }));
        this.total = (listResponse && listResponse.total) || 0;
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          locationId: 'root',
          locationName: '全部货位',
          children: tree
        }];
        this.parentOptions = this.buildParentOptions(allData, this.form.locationId);
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      }).catch(() => {
        this.loading = false;
        this.locationList = [];
        this.total = 0;
      });
    },
    loadTreeData() {
      treeselect().then(response => {
        const allData = response.data || [];
        this.buildLocationMap(allData);
        const tree = this.buildTree(allData, 0);
        this.treeData = [{
          locationId: 'root',
          locationName: '全部货位',
          children: tree
        }];
        this.parentOptions = this.buildParentOptions(allData, this.form.locationId);
        this.$nextTick(() => this.updateMainTableHeight());
      });
    },
    buildLocationMap(data) {
      this.locationMap = {};
      data.forEach(item => {
        this.locationMap[item.locationId] = item.locationName;
      });
    },
    getParentLocationName(parentId) {
      return this.locationMap[parentId] || '';
    },
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
    buildParentOptions(data, excludeId) {
      const options = [{ locationId: 0, locationName: '顶级货位' }];
      data.forEach(item => {
        if (item.locationId !== excludeId) {
          options.push(item);
        }
      });
      return options;
    },
    handleNodeClick(data) {
      if (!data || data.locationId === 'root') {
        this.queryParams.locationCode = null;
        this.queryParams.locationName = null;
      } else {
        this.queryParams.locationCode = data.locationCode || null;
        this.queryParams.locationName = null;
      }
      this.handleQuery();
    },
    cancel() {
      this.open = false;
      this.reset();
    },
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
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.queryParams.locationCode = null;
      this.queryParams.locationName = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      if (this.$refs.locationTable && this.$refs.locationTable.clearSort) {
        this.$refs.locationTable.clearSort();
      }
      if (this.$refs.locationTree && this.$refs.locationTree.setCurrentKey) {
        this.$refs.locationTree.setCurrentKey('root');
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        locationCode: 'location_code',
        locationName: 'location_name',
        zoneType: 'zone_type',
        shelfCode: 'shelf_code',
        tenantId: 'tenant_id',
        createTime: 'create_time'
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
      this.ids = (selection || []).map(item => item.locationId);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    locationRowClassName({ row }) {
      void this.rowHighlightTick;
      const rid = row && row.locationId != null ? String(row.locationId) : '';
      if (rid && this.ids.some(id => String(id) === rid)) {
        return 'apply-row-selected';
      }
      return '';
    },
    handleAdd() {
      this.reset();
      this.form.tenantId = this.customerId || null;
      this.loadTreeData();
      this.open = true;
      this.title = "添加货位";
    },
    handleUpdate(row) {
      this.reset();
      const locationId = row.locationId || this.ids;
      getLocation(locationId).then(response => {
        this.form = response.data;
        this.loadTreeData();
        this.open = true;
        this.title = "修改货位";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.locationId != null) {
            updateLocation(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
            });
          } else {
            if (this.form.parentId === null || this.form.parentId === undefined) {
              this.form.parentId = 0;
            }
            addLocation(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const locationIds = row.locationId || this.ids;
      this.$modal.confirm('是否确认删除货位编号为"' + locationIds + '"的数据项？').then(() => {
        return delLocation(locationIds);
      }).then(() => {
        this.getList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleStatusChange(row) {
      const text = row.delFlag === 0 ? "启用" : "禁用";
      this.$modal.confirm('确认要"' + text + '""' + row.locationName + '"货位吗？').then(() => {
        return updateLocation(row);
      }).then(() => {
        this.$modal.msgSuccess(text + "成功");
        this.getList();
      }).catch(() => {
        row.delFlag = row.delFlag === 0 ? 1 : 0;
      });
    },
    handleExport() {
      const params = { ...this.queryParams };
      this.download('foundation/location/export', params, `location_${new Date().getTime()}.xlsx`);
    }
  }
};
</script>

<style scoped>
.location-layout-row {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

.location-left-col,
.location-right-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
}

.location-side-panel {
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

.location-side-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 0 0 auto;
}

.location-side-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px;
}

.custom-tree-node {
  flex: 1;
  display: flex;
  align-items: center;
  font-size: 14px;
  padding: 3px 0;
}

.custom-tree-node i {
  margin-right: 5px;
  color: #409EFF;
}

.location-side-list ::v-deep .el-tree {
  background: transparent;
}

.location-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.location-page .location-main > .list-query-panel,
.location-page .location-main > .location-toolbar,
.location-page .location-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.location-page .location-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.location-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.location-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.location-query-actions {
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

.location-page .apply-main-table.el-table {
  position: relative;
}

.location-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

.location-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.location-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.location-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.location-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.location-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.location-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.location-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.location-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.location-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.location-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.location-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.location-page .apply-main-table ::v-deep .el-table__body tr > td,
.location-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.location-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.location-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.location-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.location-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.location-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.location-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.location-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.location-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.location-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.location-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.location-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.location-page .apply-main-table ::v-deep th.apply-select-col,
.location-page .apply-main-table ::v-deep td.apply-select-col,
.location-page .apply-main-table ::v-deep th.el-table-column--selection,
.location-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.location-page .apply-main-table ::v-deep th.apply-action-col,
.location-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.location-page .apply-main-table ::v-deep td.apply-select-col,
.location-page .apply-main-table ::v-deep td.el-table-column--selection,
.location-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.location-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.location-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.location-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.location-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.location-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
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

<style>
.app-container.location-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.location-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.location-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.location-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.location-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.location-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.location-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
