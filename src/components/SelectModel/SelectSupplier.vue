<template>
  <el-select v-model="supplier" filterable
             clearable
             placeholder="请选择供应商"
             :disabled="value2"
  >
    <el-option
      v-for="item in supplierOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    ></el-option>
  </el-select>
</template>

<script>
import { listSupplierAll} from "@/api/foundation/supplier";

export default {
  // props: ['value','size'],
  props: ['value','value2'],
  data() {
    return {
      // 供应商选项
      supplierOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    supplier: {
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
      listSupplierAll().then(response => {
        this.supplierOptions = response;
      });
    },
  }
}
</script>
