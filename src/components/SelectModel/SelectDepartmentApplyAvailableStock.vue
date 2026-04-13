<template>
  <transition name="modal-fade">
    <div v-if="show" class="local-modal-mask">
      <transition name="modal-zoom">
        <div v-if="show" class="local-modal-content">
          <div class="modal-header">
            <div class="modal-title">可用库存（按耗材+仓库汇总）</div>
            <el-button size="small" @click="handleClose" class="close-btn">关闭</el-button>
          </div>
          <div class="modal-body">
            <div class="form-fields-container" style="background: #fff !important; padding: 16px 20px !important; border-radius: 8px !important; box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05) !important; margin-bottom: 16px !important; border: 1px solid #EBEEF5 !important; width: 100% !important; box-sizing: border-box !important;">
              <el-form :model="queryParams" ref="queryForm" :inline="true" label-width="0" class="query-form">
                <el-row :gutter="20">
                  <el-col :span="6">
                    <el-form-item label="产品名称" prop="materialName" label-width="100px">
                      <el-input v-model="queryParams.materialName" placeholder="名称/编码/简码" clearable @keyup.enter.native="handleQuery" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="规格" prop="materialSpeci" label-width="100px">
                      <el-input v-model="queryParams.materialSpeci" placeholder="规格" clearable @keyup.enter.native="handleQuery" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="型号" prop="materialModel" label-width="100px">
                      <el-input v-model="queryParams.materialModel" placeholder="型号" clearable @keyup.enter.native="handleQuery" />
                    </el-form-item>
                  </el-col>
                  <el-col :span="6">
                    <el-form-item label="仓库" prop="warehouseName" label-width="100px">
                      <el-input v-model="queryParams.warehouseName" placeholder="仓库名称" clearable @keyup.enter.native="handleQuery" />
                    </el-form-item>
                  </el-col>
                </el-row>
              </el-form>
            </div>

            <el-row :gutter="10" class="mb8 action-buttons-row">
              <el-col :span="1.5">
                <el-button type="primary" icon="el-icon-search" size="medium" @click="handleQuery">搜索</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button icon="el-icon-refresh" size="medium" @click="resetQuery">重置</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button size="medium" @click="handleClose">取 消</el-button>
              </el-col>
              <el-col :span="1.5">
                <el-button type="primary" size="medium" @click="checkBtn">确 定</el-button>
              </el-col>
            </el-row>

            <div class="table-wrapper">
              <el-table ref="singleTable" :data="rowList" :row-class-name="rowIndex" @selection-change="handleSelectionChange" height="100%" border>
                <el-table-column type="selection" width="55" align="center" />
                <el-table-column label="序号" align="center" prop="index" width="70" show-overflow-tooltip resizable />
                <el-table-column label="仓库" align="center" prop="warehouseName" min-width="120" show-overflow-tooltip resizable />
                <el-table-column label="编码" align="center" prop="materialCode" min-width="100" show-overflow-tooltip resizable />
                <el-table-column label="名称" align="center" prop="materialName" min-width="140" show-overflow-tooltip resizable />
                <el-table-column label="规格" align="center" prop="materialSpeci" min-width="100" show-overflow-tooltip resizable />
                <el-table-column label="型号" align="center" prop="materialModel" min-width="100" show-overflow-tooltip resizable />
                <el-table-column label="单位" align="center" prop="unitName" width="70" show-overflow-tooltip resizable />
                <el-table-column label="本仓可用数量" align="center" prop="availableQty" width="120" show-overflow-tooltip resizable />
                <el-table-column label="参考单价" align="center" prop="unitPrice" width="100" show-overflow-tooltip resizable />
                <el-table-column label="生产厂家" align="center" prop="factoryName" min-width="120" show-overflow-tooltip resizable />
              </el-table>
            </div>

            <div class="pagination-bottom-wrap">
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
      </transition>
    </div>
  </transition>
</template>

<script>
import { listDeptApplyAvailableStock } from '@/api/warehouse/inventory'

export default {
  name: 'SelectDepartmentApplyAvailableStock',
  props: {
    DialogComponentShow: [Boolean],
    selectedDetails: Array
  },
  data() {
    return {
      show: false,
      selectRow: [],
      total: 0,
      rowList: [],
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        warehouseName: null
      }
    }
  },
  mounted() {
    this.show = this.DialogComponentShow || false
    if (this.show) {
      this.getList()
    }
  },
  watch: {
    DialogComponentShow(newVal) {
      this.show = newVal
      if (newVal) {
        this.queryParams.pageNum = 1
        this.getList()
        this.$nextTick(() => this.markSelectedItems())
      }
    },
    selectedDetails: {
      handler() {
        if (this.show && this.rowList && this.rowList.length) {
          this.$nextTick(() => this.markSelectedItems())
        }
      },
      deep: true
    }
  },
  methods: {
    getList() {
      listDeptApplyAvailableStock(this.queryParams).then(response => {
        const rows = response.rows || []
        if (this.selectedDetails && this.selectedDetails.length) {
          const existed = new Set(
            this.selectedDetails
              .filter(d => d && d.materialId != null)
              .map(d => {
                const wid = d.stockWarehouseId != null && d.stockWarehouseId !== '' ? d.stockWarehouseId : 'x'
                return `${d.materialId}__${wid}`
              })
          )
          this.rowList = rows.filter(it => {
            if (!it || it.materialId == null || it.warehouseId == null) return true
            return !existed.has(`${it.materialId}__${it.warehouseId}`)
          })
        } else {
          this.rowList = rows
        }
        this.total = response.total != null ? response.total : 0
        this.$nextTick(() => this.markSelectedItems())
      })
    },
    handleQuery() {
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        materialName: null,
        materialSpeci: null,
        materialModel: null,
        warehouseName: null
      }
      this.getList()
    },
    handleSelectionChange(val) {
      this.selectRow = val
    },
    handleClose() {
      this.show = false
      this.$emit('closeDialog')
    },
    checkBtn() {
      if (!this.selectRow || !this.selectRow.length) {
        this.$message({ message: '请先选择数据', type: 'warning' })
        return
      }
      this.$emit('selectData', this.selectRow)
      this.handleClose()
    },
    rowIndex({ row, rowIndex }) {
      row.index = (this.queryParams.pageNum - 1) * this.queryParams.pageSize + rowIndex + 1
      return ''
    },
    markSelectedItems() {
      if (!this.$refs.singleTable || !this.rowList || !this.rowList.length) return
      this.$refs.singleTable.clearSelection()
    }
  }
}
</script>

<style scoped>
.local-modal-mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
}
.local-modal-content {
  background: #fff;
  width: 100%;
  height: 100%;
  min-height: 95vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 20px;
  border-bottom: 1px solid #EBEEF5;
  background: #F5F7FA;
  flex-shrink: 0;
}
.modal-title {
  font-size: 16px;
  font-weight: 600;
}
.close-btn {
  border: none;
  background: transparent;
}
.modal-body {
  flex: 1;
  overflow: hidden;
  padding: 10px 6px 24px 6px;
  background: #fff;
  display: flex;
  flex-direction: column;
  min-height: 0;
}
.table-wrapper {
  flex: 1;
  min-height: 200px;
  overflow: hidden;
}
.pagination-bottom-wrap {
  flex-shrink: 0;
  padding-top: 8px;
}
</style>
