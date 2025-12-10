<template>
  <el-select v-model="factory" filterable
             clearable
             placeholder="请选择生产厂家"
             :disabled="value2"
  >
    <el-option
      v-for="item in factoryOptions"
      :key="item.factoryId"
      :label="item.factoryName"
      :value="item.factoryId"
    ></el-option>
  </el-select>
</template>

<script>
import { listFactoryAll } from "@/api/foundation/factory";

export default {
  // props: ['value','size'],
  props: ['value','value2'],
  data() {
    return {
      // 厂家选项
      factoryOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    factory: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询供应商列表 */
    getList() {
      this.loading = true;
      listFactoryAll().then(response => {
        this.factoryOptions = response;
      });
    },
  }
}
</script>
