<template>
  <el-table
    :data="data"
    border
    class="material-table"
  >
    <el-table-column label="操作" width="70">
      <template slot-scope="{ $index }">
        <el-button
          type="danger"
          icon="el-icon-delete"
          circle
          size="mini"
          @click="$emit('remove', $index)"
        />
      </template>
    </el-table-column>
    <el-table-column prop="uniqueCode" label="唯一码" width="220" />
    <el-table-column prop="name" label="耗材名称" />
    <el-table-column prop="spec" label="规格" width="120" />
    <el-table-column label="有效期" width="120">
      <template slot-scope="{ row }">
        {{ row.expireDate | dateFormat }}
      </template>
    </el-table-column>
    <el-table-column label="单价" width="110">
      <template slot-scope="{ row }">
        ¥ {{ row.price.toFixed(2) }}
      </template>
    </el-table-column>
    <el-table-column label="状态" width="100">
      <template slot-scope="{ row }">
        <status-badge :status="row.status" />
      </template>
    </el-table-column>
  </el-table>
</template>

<script>
import StatusBadge from './StatusBadge'

export default {
  components: { StatusBadge },
  props: ['data']
}
</script>
