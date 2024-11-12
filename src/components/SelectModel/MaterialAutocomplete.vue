<template>
  <el-autocomplete
    v-model="materialName"
    :fetch-suggestions="querySearchAsync"
    placeholder="请输入内容"
    :trigger-on-focus="false"
  ></el-autocomplete>
</template>

<script>
import { listMaterial } from "@/api/foundation/material";

export default {
  props: ['value','value2'],
  data() {
    return {
      // materialName:'',
      // 表单参数
      form: {},
    }
  },
  computed: {
    materialName: {
      get() {
        return this.value;
      },
      set(v) {
        this.$emit('input', v);
      }
    }
  },
  mounted() {
    listMaterial().then((res) => {
      this.restaurants = res.rows;
    });
  },
  created() {
    // this.getList();
  },
  methods: {
    querySearchAsync(queryString, cb) {

      const res = this.restaurants;
      if(res.length>0) {
        res.forEach(item => {
          item.value = item.name;
        })
      }

      let results = res.filter(item => {
        return item.value.toLowerCase().indexOf(queryString.toLowerCase()) !== -1;
      })
      cb(results);
    },
  }
}
</script>
