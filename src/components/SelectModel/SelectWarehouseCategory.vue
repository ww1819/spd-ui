<template>
  <el-select v-model="warehouseCategory" filterable
             clearable
             placeholder="请选择库房分类"
             :disabled="value2"
  >
    <el-option
      v-for="item in warehouseCategoryOptions"
      :key="item.warehouseCategoryId"
      :label="item.warehouseCategoryName"
      :value="item.warehouseCategoryId"
    ></el-option>
  </el-select>
</template>

<script>
import { listWarehouseCategoryAll} from "@/api/foundation/warehouseCategory";

export default {
  props: ['value','value2'],
  data() {
    return {
      // 库房分类选项
      warehouseCategoryOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    warehouseCategory: {
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
    /** 查询库房分类列表 */
    getList() {
      this.loading = true;
      listWarehouseCategoryAll().then(response => {
        this.warehouseCategoryOptions = response;
      });
    },
  }
}
</script>
