<template>
  <el-autocomplete
    v-model="materialName"
    :fetch-suggestions="querySearchAsync"
    placeholder="内容"
    :trigger-on-focus="false"
  ></el-autocomplete>
</template>

<script>
import { listMaterialDeptSafe } from "@/api/foundation/material";

export default {
  props: ['value','value2'],
  data() {
    return {
      restaurants: [],
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
    listMaterialDeptSafe().then((res) => {
      this.restaurants = Array.isArray(res) ? res : [];
    }).catch(() => {
      this.restaurants = [];
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
