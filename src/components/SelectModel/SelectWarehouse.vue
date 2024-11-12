<template>
  <el-select v-model="warehouse" filterable
             clearable
             placeholder="请选择仓库"
             :disabled="value2"
  >
    <el-option
      v-for="item in warehouseOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    ></el-option>
  </el-select>
</template>

<script>
import { listWarehouseAll} from "@/api/foundation/warehouse";

export default {
  props: ['value','value2'],
  data() {
    return {
      // 仓库选项
      warehouseOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    warehouse: {
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
    /** 查询仓库列表 */
    getList() {
      this.loading = true;
      let userId = this.$store.state.user.userId;
      listWarehouseAll(userId).then(response => {
        this.warehouseOptions = response;
      });
    },
  }
}
</script>
