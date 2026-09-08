<template>
  <div class="app-container list-page warehouse-page">
    <el-row :gutter="8" class="warehouse-layout-row">
      <!-- 左侧仓库列表 -->
      <el-col :span="5" class="warehouse-left-col">
        <div class="warehouse-side-panel" ref="leftStack">
          <div class="warehouse-side-header">
            <span>仓库</span>
          </div>
          <div class="warehouse-side-list">
            <div
              v-for="warehouse in allWarehouseList"
              :key="warehouse.id"
              :class="['warehouse-item', { 'active': selectedWarehouseId === warehouse.id }]"
              @click="handleWarehouseClick(warehouse)"
            >
              {{ warehouse.name }}
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧：查询 / 工具栏 / 明细框（对齐耗材对照） -->
      <el-col :span="19" class="warehouse-right-col">
        <div class="warehouse-main">
          <div class="form-fields-container list-query-panel" v-show="showSearch">
            <el-form :model="queryParams" ref="queryForm" size="small" :inline="true" class="query-form">
              <div class="wh-query-row">
                <el-input
                  v-model="queryParams.code"
                  placeholder="仓库编码"
                  clearable
                  class="wh-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <el-input
                  v-model="queryParams.name"
                  placeholder="仓库名称"
                  clearable
                  class="wh-query-control"
                  @keyup.enter.native="handleQuery"
                />
                <div class="wh-query-actions">
                  <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
                  <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
                </div>
              </div>
            </el-form>
          </div>

          <el-row :gutter="0" class="list-toolbar wh-toolbar">
            <div class="list-toolbar-left">
              <el-button
                type="primary"
                size="small"
                class="spd-btn spd-btn--primary"
                @click="handleAdd"
                v-hasPermi="['foundation:warehouse:add']"
              >新增</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleUpdate"
                v-hasPermi="['foundation:warehouse:edit']"
              >修改</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                :disabled="single"
                @click="handleDelete"
                v-hasPermi="['foundation:warehouse:remove']"
              >删除</el-button>
              <el-button
                size="small"
                class="spd-btn spd-btn--secondary"
                @click="handleExport"
                v-hasPermi="['foundation:warehouse:export']"
              >导出</el-button>
            </div>
            <div class="list-toolbar-right">
              <right-toolbar :showSearch.sync="showSearch" @queryTable="getList" />
            </div>
          </el-row>

          <div class="apply-table-panel" ref="tablePanel">
            <el-table
              ref="warehouseTable"
              v-loading="loading"
              :data="warehouseList"
              class="apply-main-table"
              border
              stripe
              :height="mainTableHeight"
              :row-class-name="warehouseRowClassName"
              @selection-change="handleSelectionChange"
              @sort-change="handleSortChange"
            >
              <el-table-column type="selection" width="55" align="center" class-name="apply-select-col" />
              <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip />
              <el-table-column label="仓库编码" align="center" prop="code" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="仓库名称" align="center" prop="name" min-width="200" sortable="custom" show-overflow-tooltip />
              <el-table-column label="负责人" align="center" prop="warehousePerson" width="130" sortable="custom" show-overflow-tooltip />
              <el-table-column label="电话" align="center" prop="warehousePhone" width="150" sortable="custom" show-overflow-tooltip />
              <el-table-column label="状态" align="center" prop="warehouseStatus" width="110" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <dict-tag :options="dict.type.is_use_status" :value="scope.row.warehouseStatus"/>
                </template>
              </el-table-column>
              <el-table-column label="仓库类型" align="center" prop="warehouseType" width="130" sortable="custom" show-overflow-tooltip />
              <el-table-column label="结算仓库" align="center" prop="isSettlementWarehouse" width="130" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ scope.row.isSettlementWarehouse === 1 ? '是' : '否' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="创建日期" align="center" prop="createTime" width="150" sortable="custom" show-overflow-tooltip>
                <template slot-scope="scope">
                  <span>{{ parseTime(scope.row.createTime, '{y}-{m}-{d}') }}</span>
                </template>
              </el-table-column>
              <el-table-column label="备注" align="center" prop="remark" min-width="160" show-overflow-tooltip />
              <el-table-column label="操作" align="center" class-name="apply-action-col" width="140">
                <template slot-scope="scope">
                  <el-button
                    size="small"
                    type="text"
                    @click="handleUpdate(scope.row)"
                    v-hasPermi="['foundation:warehouse:edit']"
                  >修改</el-button>
                  <el-button
                    size="small"
                    type="text"
                    @click="handleDelete(scope.row)"
                    v-hasPermi="['foundation:warehouse:remove']"
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
    <div v-if="open" class="warehouse-drawer-mask" @click.self="cancel">
      <div class="warehouse-drawer-panel" @click.stop>
        <div class="warehouse-drawer-header">
          <span class="warehouse-drawer-title">{{ title }}</span>
          <i class="el-icon-close warehouse-drawer-close" @click="cancel" />
        </div>
        <div class="warehouse-drawer-body">
          <el-form ref="form" :model="form" :rules="rules" label-width="110px">
            <el-form-item label="仓库编码" prop="code">
              <el-input v-model="form.code" :disabled="isDisabled" placeholder="仓库编码" />
            </el-form-item>
            <el-form-item label="仓库名称" prop="name">
              <el-input v-model="form.name" placeholder="仓库名称" />
            </el-form-item>
            <el-form-item label="负责人" prop="warehousePerson">
              <el-input v-model="form.warehousePerson" placeholder="负责人" />
            </el-form-item>
            <el-form-item label="电话" prop="warehousePhone">
              <el-input v-model="form.warehousePhone" placeholder="电话" />
            </el-form-item>
            <el-form-item label="状态" prop="warehouseStatus">
              <el-select v-model="form.warehouseStatus" placeholder="状态" style="width: 100%">
                <el-option
                  v-for="dict in dict.type.is_use_status"
                  :key="dict.value"
                  :label="dict.label"
                  :value="dict.value"
                />
              </el-select>
            </el-form-item>
            <el-form-item label="仓库类型" prop="warehouseType">
              <el-select v-model="form.warehouseType" placeholder="仓库类型" style="width: 100%">
                <el-option label="高值" value="高值" />
                <el-option label="低值" value="低值" />
                <el-option label="试剂" value="试剂" />
                <el-option label="设备" value="设备" />
              </el-select>
            </el-form-item>
            <el-form-item label="结算类型" prop="settlementType">
              <el-select v-model="form.settlementType" placeholder="结算类型" style="width: 100%">
                <el-option label="入库结算" value="1" />
                <el-option label="出库结算" value="2" />
                <el-option label="消耗结算" value="3" />
              </el-select>
            </el-form-item>
            <el-form-item label="结算仓库" prop="isSettlementWarehouse">
              <el-switch
                v-model="form.isSettlementWarehouse"
                :active-value="1"
                :inactive-value="0"
                active-text="是"
                inactive-text="否"
              />
            </el-form-item>
            <el-form-item label="备注" prop="remark">
              <el-input v-model="form.remark" type="textarea" :rows="2" placeholder="备注" />
            </el-form-item>
            <el-form-item v-if="isZaoqiangTenant" label="HIS药库科室ID" prop="hisId">
              <el-input v-model="form.hisId" placeholder="众阳 storageDeptId" />
            </el-form-item>
          </el-form>
        </div>
        <div class="warehouse-drawer-footer">
          <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="submitForm">保 存</el-button>
          <el-button size="small" class="spd-btn spd-btn--secondary" @click="cancel">取 消</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { listWarehouse, getWarehouse, delWarehouse, addWarehouse, updateWarehouse } from "@/api/foundation/warehouse";

export default {
  name: "Warehouse",
  dicts: ['is_use_status'],
  data() {
    return {
      loading: true,
      ids: [],
      rowHighlightTick: 0,
      isDisabled: false,
      single: true,
      multiple: true,
      showSearch: true,
      total: 0,
      warehouseList: [],
      allWarehouseList: [],
      selectedWarehouseId: null,
      title: "",
      open: false,
      mainTableHeight: 400,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        code: null,
        name: null,
        orderByColumn: null,
        isAsc: null
      },
      form: {},
      rules: {
        code: [
          { required: true, message: "仓库编码不能为空", trigger: "blur" },
          { validator: (rule, value, callback) => {
            if (!value) {
              callback();
              return;
            }
            listWarehouse({ code: value, pageNum: 1, pageSize: 1 }).then(response => {
              if (response.rows && response.rows.length > 0) {
                const existingWarehouse = response.rows[0];
                if (!this.form.id || existingWarehouse.id !== this.form.id) {
                  callback(new Error('该仓库编码已存在，请使用其他编码'));
                } else {
                  callback();
                }
              } else {
                callback();
              }
            }).catch(() => {
              callback();
            });
          }, trigger: "blur" }
        ],
        name: [
          { required: true, message: "仓库名称不能为空", trigger: "blur" }
        ],
      }
    };
  },
  computed: {
    isZaoqiangTenant() {
      return this.$store.getters.customerId === 'zaoqiang-tcm-001'
    }
  },
  watch: {
    showSearch() {
      this.$nextTick(() => this.updateMainTableHeight());
    }
  },
  created() {
    this.getList();
    this.getAllWarehouseList();
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
    /** 明细框高度：底边对齐左侧仓库列表 */
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
        if (this.$refs.warehouseTable && this.$refs.warehouseTable.doLayout) {
          this.$refs.warehouseTable.doLayout();
        }
        const overshoot = panel.getBoundingClientRect().bottom - left.getBoundingClientRect().bottom;
        if (overshoot > 2) {
          this.mainTableHeight = Math.max(240, Math.floor(this.mainTableHeight - overshoot));
          this.$nextTick(() => {
            if (this.$refs.warehouseTable && this.$refs.warehouseTable.doLayout) {
              this.$refs.warehouseTable.doLayout();
            }
          });
        }
      });
    },
    getAllWarehouseList() {
      listWarehouse({ pageNum: 1, pageSize: 10000 }).then(response => {
        this.allWarehouseList = response.rows || [];
        this.$nextTick(() => this.updateMainTableHeight());
      });
    },
    getList() {
      this.loading = true;
      const params = { ...this.queryParams };
      listWarehouse(params).then(response => {
        const rows = response.rows || [];
        this.warehouseList = rows.map((item, index) => ({
          ...item,
          index: (this.queryParams.pageNum - 1) * this.queryParams.pageSize + index + 1
        }));
        this.total = response.total;
        this.loading = false;
        this.$nextTick(() => this.updateMainTableHeight());
      }).catch(() => {
        this.loading = false;
        this.warehouseList = [];
        this.total = 0;
      });
    },
    handleWarehouseClick(warehouse) {
      if (this.selectedWarehouseId === warehouse.id) {
        this.selectedWarehouseId = null;
        this.queryParams.name = null;
      } else {
        this.selectedWarehouseId = warehouse.id;
        this.queryParams.name = warehouse.name;
      }
      this.handleQuery();
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
        createBy: null,
        createTime: null,
        updateBy: null,
        updateTime: null,
        warehousePerson: null,
        warehousePhone: null,
        warehouseStatus: null,
        warehouseType: '低值',
        settlementType: null,
        isSettlementWarehouse: 0,
        remark: null,
        hisId: null,
      };
      this.resetForm("form");
    },
    handleQuery() {
      this.queryParams.pageNum = 1;
      this.getList();
    },
    resetQuery() {
      this.selectedWarehouseId = null;
      this.queryParams.code = null;
      this.queryParams.name = null;
      this.queryParams.orderByColumn = null;
      this.queryParams.isAsc = null;
      if (this.$refs.warehouseTable && this.$refs.warehouseTable.clearSort) {
        this.$refs.warehouseTable.clearSort();
      }
      this.handleQuery();
    },
    handleSortChange({ prop, order }) {
      const columnMap = {
        code: 'code',
        name: 'name',
        warehousePerson: 'warehouse_person',
        warehousePhone: 'warehouse_phone',
        warehouseStatus: 'warehouse_status',
        warehouseType: 'warehouse_type',
        isSettlementWarehouse: 'is_settlement_warehouse',
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
      this.ids = (selection || []).map(item => item.id);
      this.single = selection.length !== 1;
      this.multiple = !selection.length;
      this.rowHighlightTick += 1;
    },
    warehouseRowClassName({ row }) {
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
      this.isDisabled = false;
      this.form.warehouseStatus = '2';
      this.form.warehouseType = '低值';
      this.form.isSettlementWarehouse = 0;
      this.title = "添加仓库";
    },
    handleUpdate(row) {
      this.reset();
      const id = row.id || this.ids;
      getWarehouse(id).then(response => {
        this.form = response.data;
        this.open = true;
        this.isDisabled = true;
        this.title = "修改仓库";
      });
    },
    submitForm() {
      this.$refs["form"].validate(valid => {
        if (valid) {
          if (this.form.id != null) {
            updateWarehouse(this.form).then(() => {
              this.$modal.msgSuccess("修改成功");
              this.open = false;
              this.getList();
              this.getAllWarehouseList();
            });
          } else {
            addWarehouse(this.form).then(() => {
              this.$modal.msgSuccess("新增成功");
              this.open = false;
              this.getList();
              this.getAllWarehouseList();
            });
          }
        }
      });
    },
    handleDelete(row) {
      const ids = row.id || this.ids;
      this.$modal.confirm('是否确认删除仓库编号为"' + ids + '"的数据项？').then(function() {
        return delWarehouse(ids);
      }).then(() => {
        this.getList();
        this.getAllWarehouseList();
        this.$modal.msgSuccess("删除成功");
      }).catch(() => {});
    },
    handleExport() {
      this.download('foundation/warehouse/export', {
        ...this.queryParams
      }, `warehouse_${new Date().getTime()}.xlsx`)
    }
  }
};
</script>

<style scoped>
.warehouse-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px);
  max-height: calc(100vh - 84px);
  min-height: 0;
  width: 100%;
  box-sizing: border-box;
  overflow: hidden;
}

.warehouse-layout-row {
  display: flex;
  flex-wrap: nowrap;
  align-items: flex-start;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
}

.warehouse-left-col,
.warehouse-right-col {
  height: 100%;
  max-height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.warehouse-side-panel {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  border: 1px solid #EBEEF5;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  height: 100%;
  min-height: 0;
  box-sizing: border-box;
}

.warehouse-side-header {
  padding: 12px 16px;
  background: #f5f7fa;
  border-bottom: 1px solid #EBEEF5;
  font-weight: bold;
  font-size: 14px;
  color: #303133;
  flex: 0 0 auto;
}

.warehouse-side-list {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 8px 0;
}

.warehouse-item {
  padding: 12px 20px;
  cursor: pointer;
  font-size: 14px;
  color: #606266;
  border-left: 3px solid transparent;
}

.warehouse-item:hover {
  background-color: #D6EBFF;
  color: #303133;
}

.warehouse-item.active {
  background-color: #B8DAFF;
  color: #303133;
  border-left-color: #2563EB;
  font-weight: 500;
}

.warehouse-main {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  height: 100%;
  gap: 4px;
}

.warehouse-page .warehouse-main > .list-query-panel,
.warehouse-page .warehouse-main > .wh-toolbar,
.warehouse-page .warehouse-main > .apply-table-panel {
  margin-top: 0 !important;
  margin-bottom: 0 !important;
}

.warehouse-page .wh-toolbar.list-toolbar {
  margin: 0 !important;
  padding: 6px 12px !important;
}

.wh-query-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.wh-query-control {
  width: 160px !important;
  min-width: 160px !important;
  max-width: 160px !important;
  flex-shrink: 0;
}

.wh-query-actions {
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

.warehouse-page .apply-main-table.el-table {
  position: relative;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body-wrapper {
  overflow: auto !important;
  overscroll-behavior: contain;
}

/* 表头样式与耗材对照明细框保持一致，排序三角用 Element 默认 caret-wrapper */
.warehouse-page .apply-main-table ::v-deep .el-table__header-wrapper th,
.warehouse-page .apply-main-table ::v-deep .el-table__header-wrapper th.el-table__cell,
.warehouse-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th,
.warehouse-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th.el-table__cell,
.warehouse-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th,
.warehouse-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th.el-table__cell {
  background-color: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  letter-spacing: 0.02em;
  padding-top: 4px !important;
  padding-bottom: 4px !important;
  height: 34px !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__header-wrapper th .cell,
.warehouse-page .apply-main-table ::v-deep .el-table__fixed-header-wrapper th .cell,
.warehouse-page .apply-main-table ::v-deep .el-table__fixed-right-header-wrapper th .cell {
  color: #334155 !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  text-align: center !important;
  line-height: 20px !important;
  white-space: nowrap !important;
}

.warehouse-page .apply-main-table ::v-deep td .cell {
  white-space: nowrap !important;
  line-height: 20px !important;
  padding-left: 6px !important;
  padding-right: 6px !important;
}

.warehouse-page .apply-main-table ::v-deep td {
  border-right-color: #f1f5f9 !important;
  border-bottom-color: #f1f5f9 !important;
  padding: 10px 0 !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body tr > td,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr > td .cell {
  transition: none !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body tr:hover > td,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr:hover > td .cell,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-select-col,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr:hover > td.el-table-column--selection,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr:hover > td.apply-action-col {
  background-color: #D6EBFF !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td .cell,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-select-col,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.el-table-column--selection,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected > td.apply-action-col,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td .cell,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-select-col,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.el-table-column--selection,
.warehouse-page .apply-main-table ::v-deep .el-table__body tr.apply-row-selected:hover > td.apply-action-col {
  background-color: #A0CBFF !important;
}

.warehouse-page .apply-main-table ::v-deep .sort-caret.ascending {
  border-bottom-color: rgba(48, 49, 51, 0.35);
}

.warehouse-page .apply-main-table ::v-deep .sort-caret.descending {
  border-top-color: rgba(48, 49, 51, 0.35);
}

.warehouse-page .apply-main-table ::v-deep .ascending .sort-caret.ascending {
  border-bottom-color: #2563EB;
}

.warehouse-page .apply-main-table ::v-deep .descending .sort-caret.descending {
  border-top-color: #2563EB;
}

.warehouse-page .apply-main-table ::v-deep th.apply-select-col,
.warehouse-page .apply-main-table ::v-deep td.apply-select-col,
.warehouse-page .apply-main-table ::v-deep th.el-table-column--selection,
.warehouse-page .apply-main-table ::v-deep td.el-table-column--selection {
  position: sticky !important;
  left: 0 !important;
  z-index: 3;
}

.warehouse-page .apply-main-table ::v-deep th.apply-action-col,
.warehouse-page .apply-main-table ::v-deep td.apply-action-col {
  position: sticky !important;
  right: 0 !important;
  z-index: 3;
}

.warehouse-page .apply-main-table ::v-deep td.apply-select-col,
.warehouse-page .apply-main-table ::v-deep td.el-table-column--selection,
.warehouse-page .apply-main-table ::v-deep td.apply-action-col {
  background-color: #fff;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar {
  width: 8px !important;
  height: 12px !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-track {
  background: #f1f1f1 !important;
  border-radius: 3px !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb {
  background: #a8a8a8 !important;
  border-radius: 3px !important;
  min-width: 24px !important;
}

.warehouse-page .apply-main-table ::v-deep .el-table__body-wrapper::-webkit-scrollbar-thumb:hover {
  background: #909399 !important;
}

/* 抽屉 */
.warehouse-drawer-mask {
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

.warehouse-drawer-panel {
  width: 520px;
  max-width: 100%;
  height: 100%;
  background: #fff;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 12px rgba(0, 0, 0, 0.12);
}

.warehouse-drawer-header {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid #ebeef5;
}

.warehouse-drawer-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.warehouse-drawer-close {
  font-size: 16px;
  color: #909399;
  cursor: pointer;
}

.warehouse-drawer-close:hover {
  color: #409EFF;
}

.warehouse-drawer-body {
  flex: 1;
  overflow: auto;
  padding: 12px 16px 8px;
}

.warehouse-drawer-footer {
  flex-shrink: 0;
  padding: 12px 16px;
  text-align: center;
  border-top: 1px solid #ebeef5;
  background: #fff;
}

.warehouse-drawer-footer .el-button {
  margin: 0 8px;
}
</style>

<style>
.app-container.warehouse-page {
  position: relative;
  display: flex;
  flex-direction: column;
  height: calc(100vh - 84px) !important;
  max-height: calc(100vh - 84px) !important;
  overflow: hidden;
  box-sizing: border-box;
  padding: 8px !important;
}

.app-container.warehouse-page .apply-pagination-wrap .pagination-container {
  position: relative !important;
  height: auto !important;
  min-height: 0 !important;
  margin: 0 !important;
  padding: 0 !important;
}

.app-container.warehouse-page .apply-pagination-wrap .pagination-container .el-pagination {
  position: static !important;
  right: auto !important;
}

.app-container.warehouse-page .apply-main-table .el-table__body tr.apply-row-selected > td,
.app-container.warehouse-page .apply-main-table .el-table__body tr.apply-row-selected > td .cell,
.app-container.warehouse-page .apply-main-table .el-table__body tr.el-table__row--striped.apply-row-selected > td {
  background-color: #B8DAFF !important;
}

.app-container.warehouse-page .apply-main-table .el-table__body-wrapper::-webkit-scrollbar:horizontal {
  height: 12px !important;
}
</style>
