<template>
  <el-select v-model="user" filterable
             clearable
             placeholder="请选择操作人">
    <el-option
      v-for="item in userOptions"
      :key="item.userId"
      :label="item.nickName || item.userName"
      :value="item.userId"
    ></el-option>
  </el-select>
</template>

<script>
import { listUserAll} from "@/api/system/user";

export default {
  props: ['value','size'],
  data() {
    return {
      // 用户选项
      userOptions: [],
      // 表单参数
      form: {},
    }
  },
  computed: {
    user: {
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
      listUserAll().then(response => {
        this.userOptions = response;
      });
    },
  }
}
</script>
