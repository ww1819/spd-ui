<template>
  <el-select v-model="financeCategory" filterable
             clearable
             placeholder="请选择生产厂家"
             :disabled="value2"
  >
    <el-option
      v-for="item in financeCategoryOptions"
      :key="item.financeCategoryId"
      :label="item.financeCategoryName"
      :value="item.financeCategoryId"
    ></el-option>
  </el-select>
</template>

<script>
import { listFinanceCategoryAll} from "@/api/foundation/financeCategory";

export default {
  // props: ['value','size'],
  props: ['value','value2'],
  data() {
    return {
      // 财务分类选项
      financeCategoryOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    financeCategory: {
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
    /** 查询财务分类列表 */
    getList() {
      this.loading = true;
      listFinanceCategoryAll().then(response => {
        this.financeCategoryOptions = response;
      });
    },
  }
}
</script>
