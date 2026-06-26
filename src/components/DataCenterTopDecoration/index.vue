<template>
  <div class="dc-top-decoration">
    <el-row type="flex" align="middle" :gutter="8">
      <el-col :span="4">
        <dv-decoration-8 :color="colors" class="dc-decor-side" />
      </el-col>
      <el-col :span="16">
        <dv-decoration-5 :color="colors" class="dc-decor-center" />
      </el-col>
      <el-col :span="4">
        <dv-decoration-8 :reverse="true" :color="colors" class="dc-decor-side" />
      </el-col>
    </el-row>
  </div>
</template>

<script>
export default {
  name: 'DataCenterTopDecoration',
  data() {
    return {
      colors: ['#008CFF', '#00ADDD']
    }
  }
}
</script>

<style lang="scss" scoped>
.dc-top-decoration {
  flex-shrink: 0;
  padding: 6px 12px 4px;
  background: #f0f2f5;
}

.dc-decor-side {
  width: 100%;
  height: 44px;
}

.dc-decor-center {
  width: 100%;
  height: 36px;
}
</style>
