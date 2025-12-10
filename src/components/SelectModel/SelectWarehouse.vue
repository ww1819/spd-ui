<template>
  <el-select v-model="warehouse" filterable
             clearable
             placeholder="请选择仓库"
             :disabled="value2"
  >
    <el-option
      v-for="item in filteredWarehouseOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    ></el-option>
  </el-select>
</template>

<script>
import { listWarehouseAll} from "@/api/foundation/warehouse";

export default {
  props: ['value','value2','excludeWarehouseType','includeWarehouseType'],
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
    },
    // 过滤后的仓库选项
    filteredWarehouseOptions() {
      // 如果指定了只包含某个类型，则只显示该类型的仓库
      if (this.includeWarehouseType) {
        return this.warehouseOptions.filter(item => {
          return item.warehouseType === this.includeWarehouseType;
        });
      }
      // 如果指定了排除某个类型，则排除该类型的仓库
      if (this.excludeWarehouseType) {
        return this.warehouseOptions.filter(item => {
          // 如果仓库类型为空或不是要排除的类型，则保留
          return !item.warehouseType || item.warehouseType !== this.excludeWarehouseType;
        });
      }
      // 如果都没有指定，返回所有仓库
      return this.warehouseOptions;
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
