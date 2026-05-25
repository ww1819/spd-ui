<template>
  <el-select
    v-model="material"
    popper-class="select-dropdown--multiline"
    filterable
    remote
    :remote-method="remoteMethod"
    clearable
    :placeholder="placeholder"
    :disabled="value2"
    :loading="loading"
    default-first-option
  >
    <el-option
      v-for="item in materialOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    >
      <span class="select-option-label-wrap">{{ item.name }}</span>
    </el-option>
  </el-select>
</template>

<script>
import { listMaterialDeptSafe } from "@/api/foundation/material";
import { matchMaterialKeyword, normalizeMaterialSearchKeyword } from "@/utils/materialSearch";

export default {
  props: {
    value: {},
    value2: {},
    placeholder: {
      type: String,
      default: "请选择耗材",
    },
  },
  data() {
    return {
      materialOptions: [],
      allMaterials: [],
      loading: false,
      searchTimer: null,
    };
  },
  computed: {
    material: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit("input", v);
      },
    },
  },
  watch: {
    value() {
      this.ensureSelectedOption();
    },
  },
  created() {
    this.loadAllMaterials();
  },
  beforeDestroy() {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer);
    }
  },
  methods: {
    loadAllMaterials() {
      this.loading = true;
      listMaterialDeptSafe()
        .then((response) => {
          const all = response || [];
          this.allMaterials = all;
          this.materialOptions = all.slice(0, 50);
          this.ensureSelectedOption();
        })
        .catch(() => {
          this.allMaterials = [];
          this.materialOptions = [];
        })
        .finally(() => {
          this.loading = false;
        });
    },
    ensureSelectedOption() {
      if (!this.value || !Array.isArray(this.allMaterials)) return;
      const exists = this.materialOptions.some((item) => item.id === this.value);
      if (exists) return;
      const hit = this.allMaterials.find((item) => item.id === this.value);
      if (hit) {
        this.materialOptions = [hit, ...this.materialOptions];
      }
    },
    remoteMethod(query) {
      if (this.searchTimer) {
        clearTimeout(this.searchTimer);
      }
      if (!query || query.trim() === "") {
        this.materialOptions = this.allMaterials.slice(0, 50);
        this.loading = false;
        return;
      }
      this.loading = true;
      const q = normalizeMaterialSearchKeyword(query);
      this.searchTimer = setTimeout(() => {
        this.materialOptions = (this.allMaterials || [])
          .filter((item) => matchMaterialKeyword(item, q))
          .slice(0, 100);
        this.loading = false;
      }, 200);
    },
  },
};
</script>
