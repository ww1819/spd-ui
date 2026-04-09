<template>
  <el-select v-model="warehouseCategory"
             filterable
             :filter-method="filterMethod"
             clearable
             :placeholder="placeholder || '编码/名称/简码搜索'"
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
import { pinyin } from "pinyin-pro";

export default {
  props: ['value','value2','placeholder'],
  data() {
    return {
      // 库房分类选项
      warehouseCategoryOptions: [],
      allWarehouseCategoryOptions: [],
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
        this.allWarehouseCategoryOptions = response || [];
        this.warehouseCategoryOptions = this.allWarehouseCategoryOptions;
      });
    },
    filterMethod(query) {
      if (!query) {
        this.warehouseCategoryOptions = this.allWarehouseCategoryOptions;
        return;
      }
      const q = query.trim().toUpperCase();
      this.warehouseCategoryOptions = this.allWarehouseCategoryOptions.filter(item => {
        const code = String(item.warehouseCategoryCode || item.code || "").toUpperCase();
        const name = String(item.warehouseCategoryName || item.name || "").toUpperCase();
        const referred = String(item.referredName || "").toUpperCase();
        const py = this.getPinyinInitials(item.warehouseCategoryName || item.name || "");
        return code.includes(q) || name.includes(q) || referred.includes(q) || py.includes(q);
      });
    },
    getPinyinInitials(str) {
      try {
        return pinyin(str || "", { pattern: "first", toneType: "none", type: "array" }).join("").toUpperCase();
      } catch (e) {
        return "";
      }
    }
  }
}
</script>
