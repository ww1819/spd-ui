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
import { pinyin } from "pinyin-pro";

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
      const q = query.trim();
      const upperQuery = q.toUpperCase();
      this.searchTimer = setTimeout(() => {
        this.materialOptions = (this.allMaterials || []).filter((item) => {
          if (!item || !item.name) return false;
          const name = item.name || "";
          const code = item.code || "";
          const referredName = item.referredName || "";
          const speci = item.speci || "";
          const model = item.model || "";
          if (
            name.includes(q) ||
            name.toUpperCase().includes(upperQuery) ||
            code.toUpperCase().includes(upperQuery) ||
            referredName.toUpperCase().includes(upperQuery) ||
            speci.toUpperCase().includes(upperQuery) ||
            model.toUpperCase().includes(upperQuery)
          ) {
            return true;
          }
          if (/^[a-zA-Z]+$/.test(q)) {
            return this.getPinyinInitials(name).includes(upperQuery);
          }
          return false;
        });
        this.loading = false;
      }, 200);
    },
    getPinyinInitials(str) {
      try {
        return pinyin(str, {
          pattern: "first",
          toneType: "none",
          type: "array",
        })
          .join("")
          .toUpperCase();
      } catch (e) {
        return "";
      }
    },
  },
};
</script>
