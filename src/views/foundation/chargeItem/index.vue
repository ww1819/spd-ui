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

    <el-table v-loading="loading" :data="chargeItemList" border stripe>
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
import { listHisChargeItem, fetchHisChargeItemMirror, exportHisChargeItem, updateHisChargeItemValueLevel } from '@/api/foundation/material'

export default {
  name: 'ChargeItemMaintain',
  data() {
    return {
      loading: false,
      fetching: false,
      exporting: false,
      total: 0,
      chargeItemList: [],
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
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.loading = true
      listHisChargeItem(this.queryParams).then(res => {
        const rows = (res && Array.isArray(res.rows)) ? res.rows : []
        this.chargeItemList = rows.map(item => ({
          ...item,
          valueLevel: item && item.valueLevel ? String(item.valueLevel) : '2',
          _saving: false
        }))
        this.total = res && res.total ? res.total : 0
      }).finally(() => {
        this.loading = false
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
        chargeItemId: undefined,
        itemCode: undefined,
        name: undefined,
        speci: undefined,
        valueLevel: undefined
      }
      this.getList()
    },
    handleFetch() {
      this.fetching = true
      fetchHisChargeItemMirror().then(res => {
        this.$modal.msgSuccess((res && res.msg) || '抓取成功')
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
    }
  }
}
</script>

