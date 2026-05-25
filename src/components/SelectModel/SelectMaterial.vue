<template>
  <el-select v-model="material" filterable
             :filter-method="useDeptSafeList ? filterDeptSafeOption : null"
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
import { listMaterialAll, listMaterialDeptSafe } from "@/api/foundation/material";
import { matchMaterialKeyword, normalizeMaterialSearchKeyword } from "@/utils/materialSearch";

export default {
  props: {
    value: {},
    value2: {},
    /** 为 true 时走 listDeptSafe（仅需登录、字段精简），用于科室库存选明细等弹窗 */
    useDeptSafeList: {
      type: Boolean,
      default: false
    }
  },
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
      const req = this.useDeptSafeList
        ? listMaterialDeptSafe({})
        : listMaterialAll();
      req
        .then(response => {
          const list = Array.isArray(response) ? response : (response && response.data) || [];
          if (this.useDeptSafeList) {
            this.allDeptSafeMaterials = list;
            this.materialOptions = list.slice(0, 100);
          } else {
            this.materialOptions = list;
          }
        })
        .finally(() => {
          this.loading = false;
        });
    },
    filterDeptSafeOption(query) {
      const q = normalizeMaterialSearchKeyword(query);
      if (!q) {
        this.materialOptions = (this.allDeptSafeMaterials || []).slice(0, 100);
        return;
      }
      this.materialOptions = (this.allDeptSafeMaterials || [])
        .filter((item) => matchMaterialKeyword(item, q))
        .slice(0, 100);
    },
  }
}
</script>
