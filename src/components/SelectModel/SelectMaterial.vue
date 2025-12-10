<template>
  <el-select v-model="material" filterable
             clearable
             placeholder="请选择耗材"
             :disabled="value2"
  >
    <el-option
      v-for="item in materialOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    ></el-option>
  </el-select>
</template>

<script>
import { listMaterialAll} from "@/api/foundation/material";

export default {
  // props: ['value','size','isShow'],
  props: ['value','value2'],
  data() {
    return {
      // 耗材选项
      materialOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    material: {
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
    /** 查询耗材列表 */
    getList() {
      this.loading = true;
      listMaterialAll().then(response => {
        this.materialOptions = response;
      });
    },
  }
}
</script>
