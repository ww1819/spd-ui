<template>
  <div class="bind-panel">
    <el-form :model="query" size="small" inline class="query-form" @submit.native.prevent>
      <el-form-item v-if="!fixedMaterialId" label="耗材">
        <el-input v-model="query.materialKeyword" placeholder="编码/名称/ID" clearable style="width:160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item v-if="!fixedChargeItemId" label="收费项">
        <el-input v-model="query.chargeKeyword" placeholder="ID/编码/名称" clearable style="width:160px" @keyup.enter.native="handleQuery" />
      </el-form-item>
      <el-form-item label="范围">
        <el-select v-model="query.scope" placeholder="全部" clearable style="width:120px" @change="handleQuery">
          <el-option label="当前生效" value="current" />
          <el-option label="历史对照" value="history" />
          <el-option label="全部" value="all" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="small" class="spd-btn spd-btn--primary" @click="handleQuery">搜索</el-button>
        <el-button size="small" class="spd-btn spd-btn--secondary" @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <el-table v-loading="loading" :data="list" border stripe size="small" :cell-style="{ whiteSpace: 'nowrap' }">
      <el-table-column label="是否当前" width="90" align="center">
        <template slot-scope="scope">{{ scope.row.currentFlag === 'Y' ? '是' : '否' }}</template>
      </el-table-column>
      <el-table-column label="耗材ID" prop="materialId" width="100" show-overflow-tooltip />
      <el-table-column label="耗材编码" prop="materialCode" width="120" show-overflow-tooltip />
      <el-table-column label="耗材名称" prop="materialName" min-width="160" show-overflow-tooltip />
      <el-table-column label="收费项ID" prop="chargeItemId" width="120" show-overflow-tooltip />
      <el-table-column label="收费编码" prop="chargeItemCode" width="120" show-overflow-tooltip />
      <el-table-column label="收费名称" prop="chargeItemName" min-width="160" show-overflow-tooltip />
      <el-table-column label="生效开始" prop="effectiveFrom" width="165" align="center" />
      <el-table-column label="生效结束" prop="effectiveTo" width="165" align="center">
        <template slot-scope="scope">{{ scope.row.effectiveTo || '—' }}</template>
      </el-table-column>
      <el-table-column label="绑定人" prop="bindBy" width="100" show-overflow-tooltip />
      <el-table-column label="解绑人" prop="unbindBy" width="100" show-overflow-tooltip />
    </el-table>

    <pagination
      v-show="total > 0"
      :total="total"
      :page.sync="query.pageNum"
      :limit.sync="query.pageSize"
      @pagination="getList"
    />
  </div>
</template>

<script>
import { listMaterialHisChargeBinds } from '@/api/foundation/material'

export default {
  name: 'MaterialHisChargeBindPanel',
  props: {
    fixedMaterialId: { type: [Number, String], default: undefined },
    fixedChargeItemId: { type: String, default: undefined },
    /** 进入页时默认范围：current / history / all */
    defaultScope: { type: String, default: 'all' }
  },
  data() {
    return {
      loading: false,
      list: [],
      total: 0,
      query: {
        pageNum: 1,
        pageSize: 10,
        materialKeyword: undefined,
        chargeKeyword: undefined,
        scope: this.defaultScope || 'all'
      }
    }
  },
  watch: {
    fixedMaterialId() {
      this.handleQuery()
    },
    fixedChargeItemId() {
      this.handleQuery()
    }
  },
  methods: {
    scopeToCurrentOnly(scope) {
      if (scope === 'current') return true
      if (scope === 'history') return false
      return undefined
    },
    handleQuery() {
      this.query.pageNum = 1
      this.getList()
    },
    resetQuery() {
      this.query = {
        pageNum: 1,
        pageSize: 10,
        materialKeyword: undefined,
        chargeKeyword: undefined,
        scope: this.defaultScope || 'all'
      }
      this.getList()
    },
    getList() {
      this.loading = true
      const params = {
        pageNum: this.query.pageNum,
        pageSize: this.query.pageSize,
        currentOnly: this.scopeToCurrentOnly(this.query.scope),
        materialKeyword: this.fixedMaterialId ? undefined : this.query.materialKeyword,
        chargeKeyword: this.fixedChargeItemId ? undefined : this.query.chargeKeyword
      }
      if (this.fixedMaterialId != null && this.fixedMaterialId !== '') {
        params.materialId = this.fixedMaterialId
      }
      if (this.fixedChargeItemId) {
        params.chargeItemId = this.fixedChargeItemId
      }
      listMaterialHisChargeBinds(params).then(res => {
        this.list = res.rows || []
        this.total = res.total || 0
      }).finally(() => {
        this.loading = false
      })
    }
  },
  mounted() {
    this.getList()
  }
}
</script>

<style scoped>
.bind-panel {
  padding: 4px 0;
}
</style>
