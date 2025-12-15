<template>
  <el-select 
    v-model="location" 
    filterable
    clearable
    placeholder="请选择货位"
    :disabled="value2"
    style="width: 100%"
  >
    <el-option
      v-for="item in locationOptions"
      :key="item.locationId"
      :label="item.locationName"
      :value="item.locationId"
    ></el-option>
  </el-select>
</template>

<script>
import { listLocationAll } from "@/api/foundation/location";

export default {
  props: ['value', 'value2'],
  data() {
    return {
      // 货位选项
      locationOptions: [],
    }
  },
  computed: {
    location: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val);
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询货位列表 */
    getList() {
      listLocationAll().then(response => {
        this.locationOptions = response || [];
      });
    }
  }
}
</script>

