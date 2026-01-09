<template>
  <el-select v-model="unit" filterable
             clearable
             placeholder="请选择单位"
             :disabled="value2"
  >
    <el-option
      v-for="item in unitOptions"
      :key="item.unitId"
      :label="item.unitName"
      :value="item.unitId"
    ></el-option>
  </el-select>
</template>

<script>
import { listUnitAll} from "@/api/foundation/unit";

export default {
  props: ['value','value2'],
  data() {
    return {
      // 单位分类选项
      unitOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    unit: {
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
    /** 查询单位分类列表 */
    getList() {
      this.loading = true;
      listUnitAll().then(response => {
        this.unitOptions = response;
      });
    },
  }
}
</script>
