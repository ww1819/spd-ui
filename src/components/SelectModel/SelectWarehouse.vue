<template>
  <el-select v-model="warehouse"
             filterable
             :filter-method="filterMethod"
             clearable
             :multiple="multiple"
             :collapse-tags="multiple"
             :collapse-tags-tooltip="multiple"
             :placeholder="placeholder || (multiple ? '仓库多选' : '仓库编码/名称/简码搜索')"
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
import { listWarehouseAll } from "@/api/foundation/warehouse";
import { fetchFinancePickWarehouses } from "@/api/finance/settlementSummary";
import { pinyin } from "pinyin-pro";

export default {
  props: {
    value: {
      type: [Number, String, Array],
      default: null
    },
    value2: {},
    excludeWarehouseType: {},
    includeWarehouseType: {},
    /** 为 true 时走财务结算汇总专用 pick 接口（仅需登录），避免 foundation:warehouse:list 等权限不足 */
    financePickMode: {
      type: Boolean,
      default: false
    },
    multiple: {
      type: Boolean,
      default: false
    },
    placeholder: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      // 仓库选项
      warehouseOptions: [],
      allWarehouseOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    warehouse: {
      get() {
        if (this.multiple) {
          return Array.isArray(this.value) ? this.value : [];
        }
        // 确保返回的值能在选项列表中找到对应的项
        if (this.value && this.filteredWarehouseOptions.length > 0) {
          // 检查值是否在选项列表中（支持字符串和数字类型匹配）
          const found = this.filteredWarehouseOptions.find(item => {
            return String(item.id) === String(this.value) || item.id == this.value;
          });
          if (found) {
            return found.id;
          }
        }
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
        // 支持数组、逗号分隔的字符串或单个字符串
        let excludeTypes = [];
        if (Array.isArray(this.excludeWarehouseType)) {
          excludeTypes = this.excludeWarehouseType;
        } else if (typeof this.excludeWarehouseType === 'string') {
          excludeTypes = this.excludeWarehouseType.split(',').map(t => t.trim());
        }

        return this.warehouseOptions.filter(item => {
          // 如果仓库类型为空或不在排除列表中，则保留
          return !item.warehouseType || !excludeTypes.includes(item.warehouseType);
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
      if (this.financePickMode) {
        fetchFinancePickWarehouses()
          .then(res => {
            const rows = res && res.data != null ? res.data : res;
            this.allWarehouseOptions = Array.isArray(rows) ? rows : [];
            this.warehouseOptions = this.allWarehouseOptions;
          })
          .catch(() => {
            this.allWarehouseOptions = [];
            this.warehouseOptions = [];
          });
        return;
      }
      const userId = this.$store.state.user.userId;
      listWarehouseAll(userId).then(response => {
        this.allWarehouseOptions = response || [];
        this.warehouseOptions = this.allWarehouseOptions;
      });
    },
    filterMethod(query) {
      if (!query) {
        this.warehouseOptions = this.allWarehouseOptions;
        return;
      }
      const q = query.trim().toUpperCase();
      this.warehouseOptions = (this.allWarehouseOptions || []).filter(item => {
        const code = String(item.code || item.warehouseCode || "").toUpperCase();
        const name = String(item.name || item.warehouseName || "").toUpperCase();
        const referred = String(item.referredName || "").toUpperCase();
        const py = this.getPinyinInitials(item.name || item.warehouseName || "");
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
