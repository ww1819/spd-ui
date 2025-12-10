<template>
  <el-select v-model="department" filterable
             clearable
             placeholder="请选择科室"
             :disabled="value2"
  >
    <el-option
      v-for="item in departmentOptions"
      :key="item.id"
      :label="item.name"
      :value="item.id"
    ></el-option>
  </el-select>
</template>

<script>
import { listdepartAll} from "@/api/foundation/depart";

export default {
  // props: ['value','size'],
  props: ['value','value2'],
  data() {
    return {
      // 科室选项
      departmentOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    department: {
      get() {
        // 确保返回的值类型与选项中的value类型一致（都是数字或都是字符串）
        if (this.value != null && this.departmentOptions.length > 0) {
          // 如果value是字符串，转换为数字；如果是数字，保持原样
          const valueNum = typeof this.value === 'string' ? parseInt(this.value) : this.value;
          // 检查选项列表中是否存在该值
          const exists = this.departmentOptions.some(item => item.id === valueNum || item.id === this.value);
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
    value(newVal) {
      // 当value变化时，确保能正确显示
      if (newVal != null && this.departmentOptions.length > 0) {
        this.$nextTick(() => {
          // 强制更新组件
        });
      }
    }
  },
  created() {
    this.getList();
  },
  methods: {
    /** 查询供应商列表 */
    getList() {
      this.loading = true;
      let userId = this.$store.state.user.userId;
      listdepartAll(userId).then(response => {
        this.departmentOptions = response;
      });
    },
  }
}
</script>
