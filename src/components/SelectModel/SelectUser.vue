<template>
  <el-select v-model="user" filterable
             clearable
             :disabled="disabled"
             :placeholder="selectPlaceholder">
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
  props: {
    value: {},
    size: String,
    disabled: {
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
      userOptions: [],
      form: {},
    }
  },
  computed: {
    selectPlaceholder() {
      const t = this.placeholder != null ? String(this.placeholder).trim() : '';
      return t || '请选择操作人';
    },
    user: {
      get() { return this.value; },
      set(v) { this.$emit('input', v); }
    }
  },
  created() { this.getList(); },
  methods: {
    getList() {
      this.loading = true;
      listUserAll().then(response => { this.userOptions = response; });
    },
  }
}
</script>
