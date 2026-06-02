<template>
  <div class="app-container">
    <el-form :model="queryParams" ref="queryForm" size="small" :inline="true">
      <el-form-item label="收费项ID">
        <el-input v-model="queryParams.chargeItemId" placeholder="收费项ID" clearable style="width: 150px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="收费编码">
        <el-input v-model="queryParams.itemCode" placeholder="收费编码" clearable style="width: 140px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="收费名称">
        <el-input v-model="queryParams.name" placeholder="收费名称" clearable style="width: 180px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="规格">
        <el-input v-model="queryParams.speci" placeholder="规格" clearable style="width: 120px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="高低值">
        <el-select v-model="queryParams.valueLevel" placeholder="全部" clearable style="width: 120px">
          <el-option v-for="opt in valueLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="handleQuery">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button
          type="success"
          :loading="fetching"
          v-hasPermi="['foundation:chargeItem:fetch','foundation:material:query']"
          @click="handleFetch"
        >抓取收费项目</el-button>
        <el-button
          type="warning"
          :loading="exporting"
          v-hasPermi="['foundation:chargeItem:export','foundation:material:export']"
          @click="handleExport"
        >下载</el-button>
      </el-form-item>
    </el-form>

    <el-row :gutter="10" class="mb8">
      <el-col :span="1.5">
        <span class="batch-hint">
          已选 {{ crossPageSelectedCount }} 条<span v-if="crossPageSelectedCount > 0">（含跨页）</span>
        </span>
      </el-col>
      <el-col :span="1.5">
        <el-select
          v-model="batchValueLevel"
          placeholder="批量高低值"
          size="small"
          clearable
          style="width: 120px"
        >
          <el-option v-for="opt in valueLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
      </el-col>
      <el-col :span="1.5">
        <el-button
          type="primary"
          size="small"
          :loading="batchSaving"
          :disabled="crossPageSelectedCount === 0"
          v-hasPermi="['foundation:chargeItem:edit','foundation:material:edit']"
          @click="handleBatchSave"
        >批量设置</el-button>
      </el-col>
      <el-col :span="1.5" v-if="crossPageSelectedCount > 0">
        <el-button type="text" size="small" @click="clearCrossPageSelection">清空已选</el-button>
      </el-col>
    </el-row>

    <el-table
      ref="chargeItemTable"
      v-loading="loading"
      :data="chargeItemList"
      :row-key="getChargeItemRowKey"
      border
      stripe
      @selection-change="handleSelectionChange"
    >
      <el-table-column type="selection" width="55" align="center" fixed="left" :reserve-selection="true" />
      <el-table-column label="收费项ID" prop="chargeItemId" width="140" show-overflow-tooltip />
      <el-table-column label="收费编码" prop="chargeCode" width="120" show-overflow-tooltip />
      <el-table-column label="收费名称" prop="chargeName" min-width="180" show-overflow-tooltip />
      <el-table-column label="规格型号" prop="chargeSpeci" min-width="120" show-overflow-tooltip />
      <el-table-column label="单价" prop="chargePrice" width="100" />
      <el-table-column label="拼音简码" prop="referredCode" width="120" />
      <el-table-column label="高低值属性" width="200">
        <template slot-scope="scope">
          <el-select
            v-model="scope.row.valueLevel"
            size="mini"
            style="width: 110px; margin-right: 8px;"
            :disabled="scope.row._saving"
          >
            <el-option v-for="opt in valueLevelOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-button
            type="text"
            size="mini"
            :disabled="scope.row._saving"
            v-hasPermi="['foundation:chargeItem:edit','foundation:material:edit']"
            @click="saveValueLevel(scope.row)"
          >保存</el-button>
        </template>
      </el-table-column>
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="queryParams.pageNum"
      :limit.sync="queryParams.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import {
  listHisChargeItem,
  fetchHisChargeItemMirror,
  exportHisChargeItem,
  updateHisChargeItemValueLevel,
  batchUpdateHisChargeItemValueLevel
} from '@/api/foundation/material'

export default {
  name: 'ChargeItemMaintain',
  data() {
    return {
      loading: false,
      fetching: false,
      exporting: false,
      batchSaving: false,
      total: 0,
      chargeItemList: [],
      /** 跨页勾选缓存：key 为 chargeItemId */
      selectedRowMap: {},
      batchValueLevel: undefined,
      queryParams: {
        pageNum: 1,
        pageSize: 10,
        chargeItemId: undefined,
        itemCode: undefined,
        name: undefined,
        speci: undefined,
        valueLevel: undefined
      },
      valueLevelOptions: [
        { label: '高值', value: '1' },
        { label: '低值', value: '2' }
      ]
    }
  },
  computed: {
    crossPageSelectedCount() {
      return Object.keys(this.selectedRowMap || {}).length
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getChargeItemRowKey(row) {
      return row && row.chargeItemId != null ? String(row.chargeItemId).trim() : null
    },
    getCrossPageSelectedChargeItemIds() {
      return Object.keys(this.selectedRowMap || {}).map(k => String(k).trim()).filter(Boolean)
    },
    restorePageSelection() {
      const table = this.$refs.chargeItemTable
      if (!table || !this.chargeItemList || this.chargeItemList.length === 0) {
        return
      }
      this.chargeItemList.forEach(row => {
        const key = this.getChargeItemRowKey(row)
        if (key && this.selectedRowMap[key]) {
          table.toggleRowSelection(row, true)
        }
      })
    },
    clearCrossPageSelection() {
      this.selectedRowMap = {}
      const table = this.$refs.chargeItemTable
      if (table) {
        table.clearSelection()
      }
    },
    getList() {
      this.loading = true
      listHisChargeItem(this.queryParams).then(res => {
        const rows = (res && Array.isArray(res.rows)) ? res.rows : []
        this.chargeItemList = rows.map(item => ({
          ...item,
          valueLevel: item && item.valueLevel ? String(item.valueLevel) : '2',
          _saving: false
        }))
        this.total = res != null && res.total != null ? Number(res.total) : 0
        this.$nextTick(() => this.restorePageSelection())
      }).finally(() => {
        this.loading = false
      })
    },
    handleSelectionChange(selection) {
      const pageKeys = (this.chargeItemList || [])
        .map(row => this.getChargeItemRowKey(row))
        .filter(Boolean)
      pageKeys.forEach(key => {
        if (this.selectedRowMap[key]) {
          this.$delete(this.selectedRowMap, key)
        }
      })
      ;(selection || []).forEach(row => {
        const key = this.getChargeItemRowKey(row)
        if (key) {
          this.$set(this.selectedRowMap, key, row)
        }
      })
    },
    handleQuery() {
      this.clearCrossPageSelection()
      this.queryParams.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.clearCrossPageSelection()
      this.queryParams = {
        pageNum: 1,
        pageSize: 10,
        chargeItemId: undefined,
        itemCode: undefined,
        name: undefined,
        speci: undefined,
        valueLevel: undefined
      }
      this.batchValueLevel = undefined
      this.getList()
    },
    handleFetch() {
      this.fetching = true
      fetchHisChargeItemMirror().then(res => {
        this.$modal.msgSuccess((res && res.msg) || '抓取成功')
        this.clearCrossPageSelection()
        this.getList()
      }).finally(() => {
        this.fetching = false
      })
    },
    async handleExport() {
      this.exporting = true
      try {
        const blobData = await exportHisChargeItem(this.queryParams)
        const blob = blobData instanceof Blob
          ? blobData
          : new Blob([blobData], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
        const fileName = `收费项目维护_${new Date().getTime()}.xlsx`
        const link = document.createElement('a')
        link.href = URL.createObjectURL(blob)
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(link.href)
        this.$modal.msgSuccess('下载成功')
      } catch (e) {
        this.$modal.msgError((e && e.message) || '下载失败')
      } finally {
        this.exporting = false
      }
    },
    saveValueLevel(row) {
      if (!row || !row.chargeItemId || !row.valueLevel) {
        this.$modal.msgWarning('收费项ID或高低值属性不能为空')
        return
      }
      row._saving = true
      updateHisChargeItemValueLevel({
        chargeItemId: row.chargeItemId,
        valueLevel: row.valueLevel
      }).then(res => {
        this.$modal.msgSuccess((res && res.msg) || '保存成功')
      }).finally(() => {
        row._saving = false
      })
    },
    handleBatchSave() {
      const chargeItemIds = Array.from(new Set(this.getCrossPageSelectedChargeItemIds()))
      if (!chargeItemIds.length) {
        this.$modal.msgWarning('请先勾选要批量设置的收费项目')
        return
      }
      if (!this.batchValueLevel) {
        this.$modal.msgWarning('请选择要批量设置的高低值属性')
        return
      }
      const levelLabel = this.valueLevelOptions.find(o => o.value === this.batchValueLevel)?.label || ''
      this.$modal.confirm(`确认将已选 ${chargeItemIds.length} 条收费项目（含跨页）批量设置为「${levelLabel}」？`).then(() => {
        this.batchSaving = true
        return batchUpdateHisChargeItemValueLevel({
          chargeItemIds,
          valueLevel: this.batchValueLevel
        })
      }).then(res => {
        this.$modal.msgSuccess((res && res.msg) || '批量保存成功')
        this.batchValueLevel = undefined
        this.clearCrossPageSelection()
        this.getList()
      }).catch(() => {}).finally(() => {
        this.batchSaving = false
      })
    }
  }
}
</script>

<style scoped>
.batch-hint {
  line-height: 32px;
  font-size: 13px;
  color: #606266;
}
</style>
