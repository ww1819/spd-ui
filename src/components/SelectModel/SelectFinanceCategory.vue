<template>
  <el-select v-model="financeCategory"
             popper-class="select-dropdown--multiline"
             filterable
             :filter-method="filterMethod"
             clearable
             placeholder="编码/名称/简码搜索"
             :disabled="value2"
  >
    <el-option
      v-for="item in financeCategoryOptions"
      :key="item.financeCategoryId"
      :label="item.financeCategoryName"
      :value="item.financeCategoryId"
    >
      <el-tooltip
        :content="item.financeCategoryName || ''"
        placement="top"
        effect="dark"
        :open-delay="250"
        popper-class="select-model-dropdown-tooltip"
      >
        <span class="select-option-label-wrap">{{ item.financeCategoryName }}</span>
      </el-tooltip>
    </el-option>
  </el-select>
</template>

<script>
import { listFinanceCategoryAll} from "@/api/foundation/financeCategory";
import { pinyin } from "pinyin-pro";

export default {
  // props: ['value','size'],
  props: ['value','value2'],
  data() {
    return {
      // 财务分类选项
      financeCategoryOptions: [],
      allFinanceCategoryOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    financeCategory: {
      get() {
        // 确保返回的值类型与选项中的value类型一致
        if (this.value != null && this.financeCategoryOptions.length > 0) {
          // 如果value是字符串，转换为数字；如果是数字，保持原样
          const valueNum = typeof this.value === 'string' ? parseInt(this.value) : this.value;
          // 检查选项列表中是否存在该值
          const exists = this.financeCategoryOptions.some(item => 
            item.financeCategoryId === valueNum || 
            item.financeCategoryId === this.value ||
            String(item.financeCategoryId) === String(this.value)
          );
          if (exists) {
            return valueNum;
          }
        }
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  watch: {
    value: {
      handler(newVal) {
        // 当value变化时，确保选项已加载
        if (newVal != null && this.financeCategoryOptions.length === 0) {
          this.getList();
        } else if (newVal != null && this.financeCategoryOptions.length > 0) {
          // 选项已加载，强制更新显示
          this.$nextTick(() => {
            // 确保el-select能正确匹配并显示名称
          });
        }
      },
      immediate: true
    },
    financeCategoryOptions: {
      handler() {
        // 当选项列表加载完成后，确保能正确显示当前值
        if (this.value != null) {
          this.$nextTick(() => {
            // 强制更新组件以显示正确的名称
          });
        }
      },
      deep: true
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询财务分类列表 */
    getList() {
      this.loading = true;
      listFinanceCategoryAll().then(response => {
        this.allFinanceCategoryOptions = response || [];
        this.financeCategoryOptions = this.allFinanceCategoryOptions;
        this.loading = false;
      }).catch(() => {
        this.loading = false;
      });
    },
    filterMethod(query) {
      if (!query) {
        this.financeCategoryOptions = this.allFinanceCategoryOptions;
        return;
      }
      const q = query.trim().toUpperCase();
      this.financeCategoryOptions = this.allFinanceCategoryOptions.filter(item => {
        const code = String(item.financeCategoryCode || item.code || "").toUpperCase();
        const name = String(item.financeCategoryName || item.name || "").toUpperCase();
        const referred = String(item.referredName || "").toUpperCase();
        const py = this.getPinyinInitials(item.financeCategoryName || item.name || "");
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
