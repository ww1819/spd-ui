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
